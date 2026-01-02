"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Check, X } from "lucide-react"

export default function LeavesPage() {
    const [leaves, setLeaves] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([]) // For creating new request
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form
    const [formData, setFormData] = useState({
        employee_id: "",
        type: "Izin",
        start_date: "",
        end_date: "",
        reason: ""
    })

    // Fallback if env not set
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001"

    const fetchLeaves = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/leaves`, {
                headers: { "ngrok-skip-browser-warning": "true" }
            })
            const data = await res.json()
            if (data.success) setLeaves(data.data)
        } catch (e) { toast.error("Gagal memuat data cuti") }
        finally { setLoading(false) }
    }

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${API_URL}/employees`, {
                headers: { "ngrok-skip-browser-warning": "true" }
            })
            const data = await res.json()
            setEmployees(data.employees || [])
        } catch (e) { }
    }

    useEffect(() => {
        fetchLeaves()
        fetchEmployees()
    }, [])

    const handleSubmit = async () => {
        if (!formData.employee_id || !formData.start_date || !formData.end_date) {
            toast.error("Mohon lengkapi data")
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch(`${API_URL}/leaves`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast.success("Pengajuan berhasil disimpan")
                setOpen(false)
                fetchLeaves()
                setFormData({
                    employee_id: "",
                    type: "Izin",
                    start_date: "",
                    end_date: "",
                    reason: ""
                })
            }
        } catch (e) { toast.error("Gagal menyimpan") }
        finally { setSubmitting(false) }
    }

    const updateStatus = async (id: number, status: string) => {
        try {
            const res = await fetch(`${API_URL}/leaves/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({
                    status,
                    actor_name: localStorage.getItem("user_name") || "Admin"
                })
            })
            if (res.ok) {
                toast.success(`Status diubah menjadi: ${status}`)
                fetchLeaves()
            }
        } catch (e) { toast.error("Error updating status") }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Perizinan & Cuti</h1>
                    <p className="text-muted-foreground">Kelola pengajuan izin, sakit, dan cuti karyawan.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Buat Pengajuan
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Form Pengajuan Izin/Cuti</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Karyawan</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                >
                                    <option value="">-- Pilih Karyawan --</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Jenis</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Izin">Izin</SelectItem>
                                        <SelectItem value="Sakit">Sakit</SelectItem>
                                        <SelectItem value="Cuti">Cuti Tahunan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Dari Tanggal</Label>
                                    <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sampai Tanggal</Label>
                                    <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Alasan</Label>
                                <Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Keterangan tambahan..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSubmit} disabled={submitting}>Simpan</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Pengajuan</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal Pengajuan</TableHead>
                                <TableHead>Karyawan</TableHead>
                                <TableHead>Jenis</TableHead>
                                <TableHead>Tanggal Izin</TableHead>
                                <TableHead>Alasan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
                            ) : leaves.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Tidak ada data.</TableCell></TableRow>
                            ) : (
                                leaves.map((l) => (
                                    <TableRow key={l.id}>
                                        <TableCell>{new Date(l.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium">{l.employee_name}</TableCell>
                                        <TableCell>{l.type}</TableCell>
                                        <TableCell>
                                            {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={l.reason}>{l.reason}</TableCell>
                                        <TableCell>
                                            <Badge variant={l.status === 'Approved' ? 'default' : l.status === 'Rejected' ? 'destructive' : 'secondary'}>
                                                {l.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {l.status === 'Pending' && (
                                                <div className="flex justify-end gap-1">
                                                    <Button size="icon" variant="ghost" className="text-green-600 hover:bg-green-50" onClick={() => updateStatus(l.id, 'Approved')}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => updateStatus(l.id, 'Rejected')}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
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
