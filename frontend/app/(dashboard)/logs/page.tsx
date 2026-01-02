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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AuditLog {
    id: string
    created_at: string
    actor_name: string
    action: string
    target_id: string
    details: any
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch(`${API_URL}/audit-logs`, {
                    headers: { "ngrok-skip-browser-warning": "true" }
                })
                const json = await res.json()
                if (json.success) {
                    setLogs(json.data)
                }
            } catch (error) {
                console.error("Failed to fetch audit logs", error)
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
    }, [])

    function formatDetails(details: any) {
        if (!details) return "-"
        // Pretty print JSON simplistically
        return Object.entries(details).map(([key, val]) => (
            <span key={key} className="block text-xs font-mono text-muted-foreground">
                {key}: {String(val)}
            </span>
        ))
    }

    return (
        <div className="container mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        Activity Logs
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Riwayat aktivitas dan perubahan data sistem.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Audit</CardTitle>
                    <CardDescription>Menampilkan siapa yang melakukan perubahan data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Waktu</TableHead>
                                <TableHead>Aktor</TableHead>
                                <TableHead>Aksi</TableHead>
                                <TableHead>Target ID</TableHead>
                                <TableHead>Detail</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                                    </TableRow>
                                ))
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Belum ada log aktivitas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                                            {new Date(log.created_at).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell className="font-medium">{log.actor_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                log.action.includes('DELETE') ? 'border-red-500 text-red-600' :
                                                    log.action === 'UPDATE_SHIFT' ? 'border-orange-500 text-orange-600' :
                                                        log.action === 'MANUAL_ATTENDANCE' ? 'border-blue-500 text-blue-600' : ''
                                            }>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{log.target_id}</TableCell>
                                        <TableCell>{formatDetails(log.details)}</TableCell>
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
