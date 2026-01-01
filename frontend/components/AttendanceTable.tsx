"use client"

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

export interface AttendanceRecord {
    id: string
    name: string
    timestamp: string
    status: "Hadir" | "Terlambat" | "Izin"
    imageUrl?: string
}

interface AttendanceTableProps {
    data: AttendanceRecord[]
}

export function AttendanceTable({ data }: AttendanceTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Foto</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Belum ada data presensi hari ini.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell>
                                    <Avatar>
                                        <AvatarImage src={record.imageUrl} />
                                        <AvatarFallback>{record.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">{record.name}</TableCell>
                                <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge variant={record.status === "Hadir" ? "default" : record.status === "Terlambat" ? "destructive" : "secondary"}>
                                        {record.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
