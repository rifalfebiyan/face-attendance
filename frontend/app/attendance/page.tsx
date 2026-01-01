"use client"

import { WebSocketCamera, AttendanceResult } from "@/components/WebSocketCamera"
import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AttendancePage() {
    const [lastAttendance, setLastAttendance] = useState<{ name: string, time: string, status: string } | null>(null)
    const [lastDetectionTime, setLastDetectionTime] = useState(0)

    const handleResult = useCallback((data: AttendanceResult) => {
        if (!data.success || !data.user) return

        const now = Date.now()
        // Prevent spamming
        if (now - lastDetectionTime < 5000) return

        // Update state
        setLastDetectionTime(now)

        // Check if it's a new or significant update to show toast
        if (!lastAttendance || lastAttendance.name !== data.user.name || (now - lastDetectionTime > 20000)) {
            toast.success(`Selamat Datang, ${data.user.name}!`, {
                description: `Presensi tercatat: ${new Date(data.user.time).toLocaleTimeString()}`
            })
        }

        setLastAttendance({
            name: data.user.name,
            time: new Date(data.user.time).toLocaleTimeString(),
            status: data.user.status
        })

    }, [lastAttendance, lastDetectionTime])

    return (
        <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Smart Attendance</h1>
                <p className="text-muted-foreground">Real-time Face Recognition via WebSocket</p>
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Live Streaming
                </div>
            </div>

            <div className="w-full max-w-4xl relative">
                <WebSocketCamera
                    onResult={handleResult}
                    serverUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}
                />
            </div>

            {lastAttendance && (
                <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300 border-green-500 border-2 shadow-lg bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-sm">
                                <User className="h-10 w-10 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">{lastAttendance.name}</h3>
                                <div className="flex items-center justify-center gap-2 text-muted-foreground mt-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{lastAttendance.time}</span>
                                </div>
                            </div>
                            <Badge
                                className={`text-lg px-6 py-1 ${lastAttendance.status === 'Pulang'
                                    ? 'bg-orange-500 hover:bg-orange-600'
                                    : 'bg-green-500 hover:bg-green-600'
                                    }`}
                                variant="default"
                            >
                                {lastAttendance.status}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )
            }

            <div className="fixed bottom-6 left-6">
                <Link href="/dashboard">
                    <Button variant="secondary">Kembali ke Dashboard</Button>
                </Link>
            </div>
        </div >
    )
}
