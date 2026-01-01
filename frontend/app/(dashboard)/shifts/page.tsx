"use client"

import { useEffect, useState } from "react"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Clock } from "lucide-react"

export default function ShiftsPage() {
    const [shifts, setShifts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form Data
    const [formData, setFormData] = useState({
        name: "",
        start_time: "08:00",
        end_time: "17:00",
        late_tolerance_minutes: 15
    })

    // Fallback if env not set
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001"

    const fetchShifts = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/shifts`, {
                headers: { "ngrok-skip-browser-warning": "true" }
            })
            const data = await res.json()
            if (data.success) {
                setShifts(data.data)
            }
        } catch (error) {
            toast.error("Gagal memuat data shift")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchShifts()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch(`${API_URL}/shifts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast.success("Shift berhasil disimpan")
                setOpen(false)
                fetchShifts()
                setFormData({ name: "", start_time: "08:00", end_time: "17:00", late_tolerance_minutes: 15 })
            } else {
                toast.error("Gagal menyimpan shift")
            }
        } catch (error) {
            toast.error("Terjadi kesalahan")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus shift ini?")) return
        try {
            const res = await fetch(`${API_URL}/shifts/${id}`, {
                method: "DELETE"
            })
            if (res.ok) {
                toast.success("Shift dihapus")
                fetchShifts()
            }
        } catch (error) {
            toast.error("Gagal menghapus")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manajemen Shift</h1>
                    <p className="text-muted-foreground">Atur jadwal kerja karyawan (Pagi, Siang, Malam).</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Tambah Shift
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Shift Baru</DialogTitle>
                            <DialogDescription>
                                Buat jadwal jam kerja baru untuk karyawan.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nama Shift</Label>
                                <Input
                                    placeholder="Contoh: Shift Pagi"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Jam Masuk</Label>
                                    <Input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Jam Pulang</Label>
                                    <Input
                                        type="time"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Toleransi Keterlambatan (Menit)</Label>
                                <Input
                                    type="number"
                                    value={formData.late_tolerance_minutes}
                                    onChange={(e) => setFormData({ ...formData, late_tolerance_minutes: parseInt(e.target.value) })}
                                    min={0}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Shift
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Shift</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Shift</TableHead>
                                <TableHead>Jam Kerja</TableHead>
                                <TableHead>Toleransi (Menit)</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : shifts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada shift.</TableCell>
                                </TableRow>
                            ) : (
                                shifts.map((shift) => (
                                    <TableRow key={shift.id}>
                                        <TableCell className="font-medium">{shift.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                {shift.start_time} - {shift.end_time}
                                            </div>
                                        </TableCell>
                                        <TableCell>{shift.late_tolerance_minutes} menit</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(shift.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
