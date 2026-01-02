"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileDown, Calendar as CalendarIcon, Plus } from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [logs, setLogs] = useState([])
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Manual Attendance State
    const [openManual, setOpenManual] = useState(false)
    const [manualData, setManualData] = useState({
        employee_id: "",
        timestamp: "",
        status: "Masuk"
    })

    // Fallback if env not set
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001"

    const fetchReports = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/reports?start_date=${startDate}&end_date=${endDate}`, {
                headers: { "ngrok-skip-browser-warning": "true" }
            })
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

    const fetchEmployees = async () => {
        try {
            console.log("Fetching employees...")
            const res = await fetch(`${API_URL}/employees`, {
                headers: { "ngrok-skip-browser-warning": "true" }
            })
            const data = await res.json()
            console.log("Employees data:", data)
            setEmployees(data.employees || [])
        } catch (e) {
            console.error("Error fetching employees:", e)
        }
    }

    const handleManualSubmit = async () => {
        if (!manualData.employee_id || !manualData.timestamp) {
            toast.error("Mohon lengkapi data")
            return
        }
        try {
            // ISO format conversion if needed, but input type=datetime-local usually gives workable string, 
            // lets append timezone or just send as is for backend to parse.
            const res = await fetch(`${API_URL}/attendance/manual`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({
                    employee_id: manualData.employee_id,
                    timestamp: new Date(manualData.timestamp).toISOString(),
                    status: manualData.status,
                    actor_name: localStorage.getItem("user_name") || "Admin"
                })
            })

            if (res.ok) {
                toast.success("Data berhasil ditambahkan")
                setOpenManual(false)
                fetchReports()
                setManualData({ employee_id: "", timestamp: "", status: "Masuk" })
            } else {
                toast.error("Gagal menambahkan")
            }
        } catch (e) {
            toast.error("Error system")
        }
    }

    useEffect(() => {
        fetchReports()
        fetchEmployees()
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

            {/* Manual Attendance Dialog */}
            <Dialog open={openManual} onOpenChange={setOpenManual}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Input Presensi Manual</DialogTitle>
                        <DialogDescription>Untuk karyawan yang lupa absen atau kendala teknis.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Karyawan</Label>
                            <Select
                                value={manualData.employee_id}
                                onValueChange={(v) => setManualData({ ...manualData, employee_id: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="-- Pilih Karyawan --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map(e => (
                                        <SelectItem key={e.id} value={e.id}>
                                            {e.name} ({e.id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Waktu</Label>
                            <Input type="datetime-local" value={manualData.timestamp} onChange={(e) => setManualData({ ...manualData, timestamp: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={manualData.status} onValueChange={(v) => setManualData({ ...manualData, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Masuk">Masuk</SelectItem>
                                    <SelectItem value="Pulang">Pulang</SelectItem>
                                    <SelectItem value="Sakit">Sakit</SelectItem>
                                    <SelectItem value="Izin">Izin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleManualSubmit}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Data Presensi</CardTitle>
                        <CardDescription>Menampilkan {logs.length} data presensi.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setOpenManual(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Input Manual
                        </Button>
                        <a href={`${API_URL}/reports/export?start_date=${startDate}&end_date=${endDate}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                                <FileDown className="mr-2 h-4 w-4" />
                                Export Excel
                            </Button>
                        </a>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Waktu</TableHead>
                                <TableHead>ID Karyawan</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Shift</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada data untuk periode ini.</TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log: any) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-sm">
                                            {new Date(log.timestamp).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>{log.employee_id}</TableCell>
                                        <TableCell className="font-medium">{log.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{log.shift}</TableCell>
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
