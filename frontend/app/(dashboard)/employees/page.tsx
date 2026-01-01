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

// Define Employee Type
interface Employee {
    id: string
    name: string
    created_at?: string
    face_encoding?: any
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchEmployees = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees`, {
                headers: { "ngrok-skip-browser-warning": "true" }
            })
            if (res.ok) {
                const data = await res.json()
                setEmployees(data.employees || [])
            } else {
                console.log("Endpoint /employees not found")
            }
        } catch (error) {
            console.error("Failed to fetch employees", error)
            toast.error("Gagal memuat data karyawan")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${id}`, {
                method: "DELETE",
                headers: { "ngrok-skip-browser-warning": "true" }
            })

            if (res.ok) {
                toast.success("Karyawan berhasil dihapus")
                fetchEmployees() // Refresh list
            } else {
                const err = await res.json()
                toast.error(`Gagal menghapus: ${err.error || 'Unknown error'}`)
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat menghapus")
        }
    }

    useEffect(() => {
        fetchEmployees()
    }, [])

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Karyawan</h1>
                    <p className="text-muted-foreground">
                        Kelola data karyawan yang terdaftar.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchEmployees}>
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
                                <TableHead className="w-[100px]">Avatar</TableHead>
                                <TableHead>Nama Lengkap</TableHead>
                                <TableHead>NIP / ID</TableHead>
                                <TableHead>Status Wajah</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Memuat data...
                                    </TableCell>
                                </TableRow>
                            ) : employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Belum ada data karyawan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.map((emp) => (
                                    <TableRow key={emp.id}>
                                        <TableCell>
                                            <Avatar>
                                                <AvatarImage src={`https://ui-avatars.com/api/?name=${emp.name}&background=random`} />
                                                <AvatarFallback>{emp.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium">{emp.name}</TableCell>
                                        <TableCell>{emp.id}</TableCell>
                                        <TableCell>
                                            {emp.face_encoding ? (
                                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                    Terdaftar
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                                    Belum
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tindakan ini tidak dapat dibatalkan. Data karyawan <strong>{emp.name}</strong> beserta riwayat wajah akan dihapus permanen.
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
