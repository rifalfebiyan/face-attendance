"use client"

import { useEffect, useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TrendData {
    date: string
    hadir: number
    terlambat: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export function AttendanceTrendChart() {
    const [data, setData] = useState<TrendData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`${API_URL}/analytics/trend`, {
                    headers: { "ngrok-skip-browser-warning": "true" }
                })
                const json = await res.json()
                if (json.success) {
                    // Format date slightly for better XAxis?
                    // "2025-01-01" -> "01 Jan"
                    const formatted = json.data.map((item: any) => {
                        const d = new Date(item.date)
                        return {
                            ...item,
                            shortDate: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
                        }
                    })
                    setData(formatted)
                }
            } catch (error) {
                console.error("Failed to fetch trend", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <div className="h-[300px] flex items-center justify-center">Loading...</div>

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Tren Kehadiran (30 Hari Terakhir)</CardTitle>
                <CardDescription>Perbandingan jumlah karyawan hadir tepat waktu vs terlambat.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="shortDate"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="hadir"
                                name="Hadir Tepat Waktu"
                                stroke="#4ade80"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="terlambat"
                                name="Terlambat"
                                stroke="#facc15"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
