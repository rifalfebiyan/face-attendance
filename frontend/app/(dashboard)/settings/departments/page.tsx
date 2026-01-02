"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Building, Briefcase } from "lucide-react"

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<any[]>([])
    const [positions, setPositions] = useState<any[]>([])
    const [newDepartment, setNewDepartment] = useState("")
    const [newPosition, setNewPosition] = useState({ title: "", department_id: "", level: 1 })
    const [isLoading, setIsLoading] = useState(true)

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const headers = { "ngrok-skip-browser-warning": "true" }
            const [deptRes, posRes] = await Promise.all([
                fetch(`${API_URL}/departments`, { headers }).then(r => r.json()),
                fetch(`${API_URL}/positions`, { headers }).then(r => r.json())
            ])

            if (deptRes.success) setDepartments(deptRes.data)
            if (posRes.success) setPositions(posRes.data)
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const addDepartment = async () => {
        if (!newDepartment) return
        try {
            await fetch(`${API_URL}/departments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({ name: newDepartment })
            })
            setNewDepartment("")
            fetchData()
        } catch (error) {
            alert("Failed to add department")
        }
    }

    const deleteDepartment = async (id: number) => {
        if (!confirm("Are you sure? Positions in this department will be unlinked.")) return
        await fetch(`${API_URL}/departments/${id}`, {
            method: 'DELETE',
            headers: { "ngrok-skip-browser-warning": "true" }
        })
        fetchData()
    }

    const addPosition = async () => {
        if (!newPosition.title || !newPosition.department_id) return
        try {
            await fetch(`${API_URL}/positions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify(newPosition)
            })
            setNewPosition({ title: "", department_id: "", level: 1 })
            fetchData()
        } catch (error) {
            alert("Failed to add position")
        }
    }

    const deletePosition = async (id: number) => {
        if (!confirm("Are you sure?")) return
        await fetch(`${API_URL}/positions/${id}`, {
            method: 'DELETE',
            headers: { "ngrok-skip-browser-warning": "true" }
        })
        fetchData()
    }

    if (isLoading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">🏢 Master Data</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Departments */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Daftar Divisi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 mb-4">
                            <Input
                                placeholder="Nama Divisi (contoh: IT)"
                                value={newDepartment}
                                onChange={(e) => setNewDepartment(e.target.value)}
                            />
                            <Button onClick={addDepartment}>Tambah</Button>
                        </div>

                        <div className="space-y-2">
                            {departments.map((dept) => (
                                <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <span className="font-medium">{dept.name}</span>
                                    <Button variant="ghost" size="sm" onClick={() => deleteDepartment(dept.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Positions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            Daftar Jabatan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 mb-4 border p-4 rounded-lg">
                            <Label>Tambah Jabatan Baru</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="Nama Jabatan"
                                    value={newPosition.title}
                                    onChange={(e) => setNewPosition({ ...newPosition, title: e.target.value })}
                                />
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newPosition.department_id}
                                    onChange={(e) => setNewPosition({ ...newPosition, department_id: e.target.value })}
                                >
                                    <option value="">Pilih Divisi</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Button onClick={addPosition} className="w-full">Simpan Jabatan</Button>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {positions.map((pos) => (
                                <div key={pos.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">{pos.title}</div>
                                        <div className="text-sm text-muted-foreground">{pos.departments?.name}</div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => deletePosition(pos.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
