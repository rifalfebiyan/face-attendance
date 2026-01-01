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
            // We're using the /stats endpoint mostly, but for a full list we might need a direct Supabase call
            // OR we can add an endpoint /employees to our Flask app.
            // For now, let's try to fetch all employees via a new endpoint or reusing supabase client if we were using it in frontend.
            // Since we are proxying to Flask, let's stick to Flask endpoints.
            // I'll add a temporary mock fetch or we can request the user to add the endpoint.
            // Wait, for this iteration, let's try to use the direct Supabase client in frontend or add endpoint.
            // The user didn't ask for a new backend endpoint yet, but "manage employees" implies listing them.
            // Let's fallback to reusing the stats/history approach or ask backend to provide list.

            // Actually, let's implement a simple direct fetching via our backend structure.
            // Currently app.py doesn't have /employees list. 
            // I will implement a client-side fetch assuming we might add the endpoint OR 
            // I will use the `stats` endpoint if it had the list. It doesn't.

            // Let's assume we will add /employees to app.py shortly.
            const res = await fetch("http://localhost:5001/employees")
            if (res.ok) {
                const data = await res.json()
                setEmployees(data.employees || [])
            } else {
                // Fallback for now if endpoint doesn't exist
                console.log("Endpoint /employees not found")
            }
        } catch (error) {
            console.error("Failed to fetch employees", error)
            toast.error("Gagal memuat data karyawan")
        } finally {
            setIsLoading(false)
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
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
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
