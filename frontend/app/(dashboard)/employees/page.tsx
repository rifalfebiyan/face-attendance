"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, UserPlus, RefreshCcw } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Settings } from "lucide-react"

// Define Employee Type
interface Employee {
    id: string
    name: string
    created_at?: string
    face_encoding?: any
    shift_id?: number
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [shifts, setShifts] = useState<any[]>([])
    // New States
    const [departments, setDepartments] = useState<any[]>([])
    const [positions, setPositions] = useState<any[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [openEditDialog, setOpenEditDialog] = useState(false) // Renamed from openShiftDialog

    // Form States
    const [formData, setFormData] = useState({
        shift_id: "",
        department_id: "",
        position_id: ""
    })

    // Fallback if env not set
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001"

    const fetchAllData = async () => {
        setIsLoading(true)
        try {
            const headers = { "ngrok-skip-browser-warning": "true" }
            const [empRes, shiftRes, deptRes, posRes] = await Promise.all([
                fetch(`${API_URL}/employees`, { headers }),
                fetch(`${API_URL}/shifts`, { headers }),
                fetch(`${API_URL}/departments`, { headers }),
                fetch(`${API_URL}/positions`, { headers })
            ])

            if (empRes.ok) {
                const d = await empRes.json()
                setEmployees(d.employees || [])
            }
            if (shiftRes.ok) {
                const d = await shiftRes.json()
                setShifts(d.data || [])
            }
            if (deptRes.ok) {
                const d = await deptRes.json()
                setDepartments(d.data || [])
            }
            if (posRes.ok) {
                const d = await posRes.json()
                setPositions(d.data || [])
            }

        } catch (error) {
            console.error("Failed to fetch data", error)
            toast.error("Gagal memuat data")
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateEmployee = async () => {
        if (!selectedEmployee) return
        try {
            const res = await fetch(`${API_URL}/employees/${selectedEmployee.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({
                    shift_id: formData.shift_id,
                    department_id: formData.department_id,
                    position_id: formData.position_id,
                    actor_name: localStorage.getItem("user_name") || "Admin"
                })
            })

            if (res.ok) {
                toast.success("Data berhasil diupdate")
                setOpenEditDialog(false)
                fetchAllData()
            } else {
                toast.error("Gagal update data")
            }
        } catch (e) {
            toast.error("Error updating data")
        }
    }

    const openEdit = (emp: any) => {
        setSelectedEmployee(emp)
        setFormData({
            shift_id: emp.shift_id ? String(emp.shift_id) : "",
            department_id: emp.department_id ? String(emp.department_id) : "",
            position_id: emp.position_id ? String(emp.position_id) : ""
        })
        setOpenEditDialog(true)
    }

    const handleDelete = async (id: string) => {
        // ... (existing code)
        try {
            const actor = localStorage.getItem("user_name") || "Admin"
            const res = await fetch(`${API_URL}/employees/${id}?actor_name=${encodeURIComponent(actor)}`, {
                method: "DELETE",
                headers: { "ngrok-skip-browser-warning": "true" }
            })

            if (res.ok) {
                toast.success("Karyawan berhasil dihapus")
                fetchAllData()
            } else {
                const err = await res.json()
                toast.error(`Gagal menghapus: ${err.error || 'Unknown error'}`)
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat menghapus")
        }
    }

    useEffect(() => {
        fetchAllData()
    }, [])

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Karyawan</h1>
                    <p className="text-muted-foreground">
                        Kelola data karyawan, shift, divisi, dan jabatan.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchAllData}>
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Link href="/register">
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Tambah Karyawan
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Karyawan</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Avatar</TableHead>
                                <TableHead>Nama Lengkap</TableHead>
                                <TableHead>Divisi/Jabatan</TableHead>
                                <TableHead>Shift</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Memuat data...
                                    </TableCell>
                                </TableRow>
                            ) : employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Belum ada data karyawan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.map((emp: any) => (
                                    <TableRow key={emp.id}>
                                        <TableCell>
                                            <Avatar>
                                                <AvatarImage src={`https://ui-avatars.com/api/?name=${emp.name}&background=random`} />
                                                <AvatarFallback>{emp.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{emp.name}</div>
                                            <div className="text-xs text-muted-foreground">{emp.id}</div>
                                        </TableCell>
                                        <TableCell>
                                            {emp.department_id ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{emp.departments?.name}</span>
                                                    <span className="text-xs text-muted-foreground">{emp.positions?.title || '-'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs font-italic">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {emp.shift_id ? (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    {shifts.find(s => s.id === emp.shift_id)?.name || "Shift #" + emp.shift_id}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-red-400">No Shift</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEdit(emp)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Hapus Karyawan?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Data <strong>{emp.name}</strong> akan dihapus permanen.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(emp.id)}
                                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                            >
                                                                Hapus
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Data Karyawan</DialogTitle>
                        <DialogDescription>
                            Atur Shift, Divisi, dan Jabatan untuk <strong>{selectedEmployee?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Shift Kerja</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.shift_id}
                                onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
                            >
                                <option value="">-- Pilih Shift --</option>
                                {shifts.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.start_time} - {s.end_time})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Divisi (Departemen)</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.department_id}
                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                            >
                                <option value="">-- Pilih Divisi --</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Jabatan</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.position_id}
                                onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                            >
                                <option value="">-- Pilih Jabatan --</option>
                                {/* Filter positions based on selected department? Optional but good UX */}
                                {positions
                                    .filter(p => !formData.department_id || String(p.department_id) === formData.department_id)
                                    .map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                            </select>
                        </div>

                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateEmployee}>Simpan Perubahan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
