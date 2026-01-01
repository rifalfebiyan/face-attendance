"use client"

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export interface CameraCaptureRef {
    capture: () => Promise<File | null>
}

interface CameraCaptureProps {
    onCapture?: (file: File) => void
    isProcessing?: boolean
    autoCaptureInterval?: number // if set, captures automatically every N ms
    showButton?: boolean
}

export const CameraCapture = forwardRef<CameraCaptureRef, CameraCaptureProps>(({
    onCapture,
    isProcessing = false,
    autoCaptureInterval,
    showButton = true
}, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)

    const startCamera = useCallback(async () => {
        try {
            setError(null)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                try {
                    await videoRef.current.play()
                } catch (e) {
                    console.error("Error playing video:", e)
                }
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
            setError("Unable to access camera. Please check permissions.")
        }
    }, [])

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
    }, [stream])

    useEffect(() => {
        startCamera()
        return () => {
            stopCamera()
        }
    }, [startCamera, stopCamera])

    const captureImage = useCallback((): Promise<File | null> => {
        return new Promise((resolve) => {
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current
                const canvas = canvasRef.current

                // Check if video is actually playing
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth
                    canvas.height = video.videoHeight

                    const context = canvas.getContext('2d')
                    if (context) {
                        context.drawImage(video, 0, 0, canvas.width, canvas.height)

                        canvas.toBlob((blob) => {
                            if (blob) {
                                const file = new File([blob], "capture.jpg", { type: "image/jpeg" })
                                if (onCapture) onCapture(file)
                                resolve(file)
                            } else {
                                resolve(null)
                            }
                        }, 'image/jpeg', 0.85)
                    } else {
                        resolve(null)
                    }
                } else {
                    resolve(null)
                }
            } else {
                resolve(null)
            }
        })
    }, [onCapture])

    // Expose capture method to parent
    useImperativeHandle(ref, () => ({
        capture: captureImage
    }))

    // Auto capture logic
    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined
        if (autoCaptureInterval && stream) {
            intervalId = setInterval(() => {
                if (!isProcessing) {
                    captureImage()
                }
            }, autoCaptureInterval)
        }
        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [autoCaptureInterval, stream, isProcessing, captureImage])


    return (
        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
            <Card className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg border-2 border-muted">
                {!stream && !error && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50">
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
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                    />
                )}

                <canvas ref={canvasRef} className="hidden" />
            </Card>

            {showButton && (
                <div className="flex justify-center gap-4">
                    <Button
                        size="lg"
                        onClick={() => captureImage()}
                        disabled={!stream || isProcessing}
                        className="px-8 min-w-[200px]"
                    >
                        {isProcessing ? "Processing..." : (
                            <>
                                <Camera className="mr-2 h-5 w-5" />
                                Ambil Gambar & Presensi
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
})

CameraCapture.displayName = "CameraCapture"
