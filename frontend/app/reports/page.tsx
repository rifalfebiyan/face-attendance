"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileDown, Calendar as CalendarIcon } from "lucide-react"

export default function ReportsPage() {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)

    const fetchReports = async () => {
        setLoading(true)
        try {
            const res = await fetch(`http://localhost:5001/reports?start_date=${startDate}&end_date=${endDate}`)
            const data = await res.json()
            if (data.success) {
                setLogs(data.data)
            }
        } catch (error) {
            console.error("Error fetching reports:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReports()
    }, [startDate, endDate])

    return (
        <div className="container mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        Laporan Presensi
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Rekap data kehadiran karyawan.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground mr-2">Periode:</span>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-[150px]"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-[150px]"
                        />
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Data Presensi</CardTitle>
                        <CardDescription>Menampilkan {logs.length} data presensi.</CardDescription>
                    </div>
                    {/* Placeholder for export functionality */}
                    <Button variant="outline" size="sm">
                        <FileDown className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Waktu</TableHead>
                                <TableHead>ID Karyawan</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Tidak ada data untuk periode ini.</TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log: any) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-sm">
                                            {new Date(log.timestamp).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>{log.employee_id}</TableCell>
                                        <TableCell className="font-medium">{log.name}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={`
                                                    ${log.status === 'Masuk' ? 'bg-green-100 text-green-700' : ''}
                                                    ${log.status === 'Pulang' ? 'bg-orange-100 text-orange-700' : ''}
                                                    ${log.status === 'Terlambat' ? 'bg-red-100 text-red-700' : ''}
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
    )
}
