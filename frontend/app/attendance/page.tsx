"use client"

import { WebSocketCamera, AttendanceResult } from "@/components/WebSocketCamera"
import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Scan, CheckCircle2 } from "lucide-react"

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 md:p-8">

            {/* Header Section */}
            <div className="text-center space-y-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl mb-4">
                    <Scan className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    Smart Attendance
                </h1>
                <div className="flex items-center justify-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                        System Active & Scanning
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl items-center">

                {/* Camera Section */}
                <div className="lg:col-span-2 relative group w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 dark:border-gray-700/50 backdrop-blur-sm">
                    {/* Scanner Overlay UI */}
                    <div className="absolute inset-0 z-10 pointer-events-none border-[3px] border-transparent">
                        <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-blue-500/80 rounded-tl-2xl"></div>
                        <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-blue-500/80 rounded-tr-2xl"></div>
                        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-blue-500/80 rounded-bl-2xl"></div>
                        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-blue-500/80 rounded-br-2xl"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent w-full animate-scan"></div>
                    </div>

                    <WebSocketCamera
                        onResult={handleResult}
                        serverUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}
                    />
                </div>

                {/* Result Section (Dynamic) */}
                <div className="flex flex-col items-center justify-center w-full min-h-[300px]">
                    {lastAttendance ? (
                        <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl animate-in zoom-in slide-in-from-right-8 duration-500">
                            <CardContent className="p-8">
                                <div className="flex flex-col items-center text-center gap-6">
                                    <div className="relative">
                                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-75 blur"></div>
                                        <div className="relative h-24 w-24 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border-4 border-white dark:border-gray-800">
                                            <User className="h-12 w-12 text-primary" />
                                            <div className="absolute bottom-0 right-0 h-8 w-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center">
                                                <CheckCircle2 className="h-4 w-4 text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-bold text-foreground">{lastAttendance.name}</h3>
                                        <p className="text-sm font-medium text-muted-foreground">Karyawan Terverifikasi</p>
                                    </div>

                                    <div className="w-full h-px bg-border"></div>

                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="bg-muted/50 p-4 rounded-xl flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                                <Clock className="h-3 w-3" />
                                                Waktu
                                            </div>
                                            <div className="text-xl font-bold font-mono text-foreground">
                                                {lastAttendance.time}
                                            </div>
                                        </div>
                                        <div className="bg-muted/50 p-4 rounded-xl flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                                Status
                                            </div>
                                            <Badge
                                                className={`text-base px-4 py-0.5 mt-0.5 ${lastAttendance.status === 'Pulang'
                                                    ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200'
                                                    : 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200'
                                                    }`}
                                                variant="outline"
                                            >
                                                {lastAttendance.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-white/5 dark:bg-white/5 w-full max-w-md h-[380px]">
                            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center animate-pulse">
                                <Scan className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-muted-foreground">Menunggu Wajah...</h3>
                                <p className="text-sm text-muted-foreground/60 max-w-[200px] mx-auto">
                                    Silakan posisikan wajah Anda di depan kamera.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Instructions */}
            <div className="mt-12 text-center text-muted-foreground/50 text-xs">
                <p>Pastikan pencahayaan ruangan cukup baik.</p>
                <p>&copy; {new Date().getFullYear()} Face Attendance System</p>
            </div>
        </div>
    )
}
