"use client"

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { io, Socket } from "socket.io-client"

export interface AttendanceResult {
    success: boolean
    user?: {
        name: string
        time: string
        status: string
    }
    error?: string
}

export interface WebSocketCameraRef {
    capture: () => Promise<File | null>
}

interface WebSocketCameraProps {
    onResult?: (result: AttendanceResult) => void
    serverUrl?: string
    intervalMs?: number
    autoCapture?: boolean
}

// Ensure we only have one socket instance
let socket: Socket | null = null;

export const WebSocketCamera = forwardRef<WebSocketCameraRef, WebSocketCameraProps>(({
    onResult,
    serverUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001",
    intervalMs = 500,
    autoCapture = true
}, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    // Initialize Socket
    useEffect(() => {
        if (!socket) {
            socket = io(serverUrl, {
                transports: ["websocket"],
                reconnectionAttempts: 5
            })
        }

        if (!socket.connected) {
            socket.connect()
        }

        function onConnect() {
            setIsConnected(true)
            console.log("Socket connected")
        }

        function onDisconnect() {
            setIsConnected(false)
            console.log("Socket disconnected")
        }

        function onAttendanceResult(data: AttendanceResult) {
            if (onResult) onResult(data)
        }

        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("attendance_result", onAttendanceResult)

        return () => {
            // Optional: Don't disconnect to keep persistent connection across re-renders if desired
            // But removing listeners is good practice
            socket?.off("connect", onConnect)
            socket?.off("disconnect", onDisconnect)
            socket?.off("attendance_result", onAttendanceResult)
        }
    }, [serverUrl, onResult])

    const startCamera = useCallback(async () => {
        try {
            setError(null)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
            })
            setStream(mediaStream)

            if (videoRef.current) {
                const video = videoRef.current
                video.srcObject = mediaStream

                video.onloadedmetadata = async () => {
                    try {
                        await video.play()
                    } catch (e: any) {
                        if (e.name !== 'AbortError') {
                            console.error("Play error:", e)
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
            setError("Unable to access camera. Please check permissions.")
        }
    }, [])

    useEffect(() => {
        startCamera()
    }, [startCamera])

    // Cleanup stream on unmount or when stream changes
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
                console.log("Camera stream stopped")
            }
        }
    }, [stream])

    // Processing loop (Auto Capture)
    useEffect(() => {
        let intervalId: NodeJS.Timeout

        if (stream && isConnected && socket && autoCapture) {
            intervalId = setInterval(() => {
                if (videoRef.current && canvasRef.current) {
                    const video = videoRef.current
                    const canvas = canvasRef.current

                    if (video.readyState === video.HAVE_ENOUGH_DATA) {
                        canvas.width = video.videoWidth
                        canvas.height = video.videoHeight
                        const ctx = canvas.getContext('2d')
                        if (ctx) {
                            ctx.drawImage(video, 0, 0)
                            const base64 = canvas.toDataURL("image/jpeg", 0.7)
                            socket?.emit("process_frame", { image: base64 })
                        }
                    }
                }
            }, intervalMs)
        }

        return () => clearInterval(intervalId)
    }, [stream, isConnected, intervalMs, autoCapture])

    // Expose capture method
    useImperativeHandle(ref, () => ({
        capture: async () => {
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current
                const canvas = canvasRef.current

                if (video.readyState >= video.HAVE_CURRENT_DATA) {
                    canvas.width = video.videoWidth
                    canvas.height = video.videoHeight
                    const ctx = canvas.getContext('2d')

                    if (ctx) {
                        ctx.drawImage(video, 0, 0)
                        return new Promise<File | null>((resolve) => {
                            canvas.toBlob((blob) => {
                                if (blob) {
                                    const file = new File([blob], "capture.jpg", { type: "image/jpeg" })
                                    resolve(file)
                                } else {
                                    resolve(null)
                                }
                            }, 'image/jpeg', 0.9)
                        })
                    }
                }
            }
            return null
        }
    }))

    return (
        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
            <Card className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg border-2 border-muted">
                {/* Status Indicator */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-red-500"}`} />
                    <span className="text-xs text-white/80 font-mono">
                        {isConnected ? "WS Connected" : "Connecting..."}
                    </span>
                </div>

                {!stream && !error && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p>Initializing Camera...</p>
                    </div>
                )}

                {error ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6 bg-destructive/10">
                        <Alert variant="destructive" className="max-w-md">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Camera Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                            <Button variant="outline" size="sm" onClick={startCamera} className="mt-2 text-foreground">
                                Try Again
                            </Button>
                        </Alert>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            className="w-full h-full object-cover transform -scale-x-100"
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/20 rounded-full pointer-events-none" />
                    </>
                )}

                <canvas ref={canvasRef} className="hidden" />
            </Card>
        </div>
    )
})

WebSocketCamera.displayName = "WebSocketCamera"
