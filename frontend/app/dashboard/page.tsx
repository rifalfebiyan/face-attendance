"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, UserCheck, Clock, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Dashboard() {
    const [stats, setStats] = useState({
        total_employees: 0,
        present_today: 0,
        checked_out_today: 0,
        history: [],
        schedule: { start_time: "08:00", end_time: "17:00" }
    })
    const [isLoading, setIsLoading] = useState(true)

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`http://localhost:5001/stats?date=${selectedDate}`)
                const data = await res.json()
                if (!data.error) {
                    setStats(data)
                }
            } catch (e) {
                console.error("Failed to fetch stats", e)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
        // Poll every 5 seconds for real-time updates
        const interval = setInterval(fetchStats, 5000)
        return () => clearInterval(interval)
    }, [selectedDate]) // Re-run when date changes

    const formattedDate = new Date(selectedDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const attendancePercentage = stats.total_employees > 0
        ? Math.round((stats.present_today / stats.total_employees) * 100)
        : 0

    return (
        <div className="container mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        {formattedDate}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    {/* <Button variant="outline">Download Report</Button> */}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_employees}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Terdaftar dalam sistem
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hadir Hari Ini</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.present_today}</div>
                        <div className="flex items-center text-xs mt-1">
                            <span className={`${attendancePercentage >= 80 ? 'text-green-500' : 'text-orange-500'} flex items-center font-medium`}>
                                {attendancePercentage >= 80 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {attendancePercentage}%
                            </span>
                            <span className="text-muted-foreground ml-1">dari total karyawan</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sudah Pulang</CardTitle>
                        <UserCheck className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.checked_out_today}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Selesai bekerja hari ini
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50/50 dark:from-card dark:to-orange-950/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Jam Operasional</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.schedule?.start_time?.substring(0, 5)} - {stats.schedule?.end_time?.substring(0, 5)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Senin - Jumat
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Table */}
            <div className="grid gap-4 md:grid-cols-7">
                <Card className="col-span-7">
                    <CardHeader>
                        <CardTitle>Riwayat Presensi Terbaru</CardTitle>
                        <CardDescription>
                            Daftar karyawan yang melakukan presensi hari ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Avatar</TableHead>
                                    <TableHead>Nama Karyawan</TableHead>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><div className="h-8 w-8 rounded-full bg-muted animate-pulse" /></TableCell>
                                            <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-6 w-16 bg-muted animate-pulse rounded" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : stats.history.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            Belum ada data presensi hari ini.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stats.history.map((log: any, index: number) => (
                                        <TableRow key={index} className="group hover:bg-muted/50 transition-colors">
                                            <TableCell>
                                                <Avatar className="h-9 w-9 border-2 border-background shadow-sm group-hover:scale-110 transition-transform">
                                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${log.name}&background=random`} />
                                                    <AvatarFallback>{log.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{log.name}</TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs">
                                                {new Date(log.time).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={`
                                                        ${log.status === 'Masuk' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                                                        ${log.status === 'Pulang' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : ''}
                                                        ${log.status === 'Terlambat' ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}
                                                        ${log.status === 'Hadir' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}
                                                    `}
                                                >
                                                    {log.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
