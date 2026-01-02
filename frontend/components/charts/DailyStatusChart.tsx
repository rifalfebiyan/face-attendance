"use client"

import { useEffect, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StatusData {
    name: string
    value: number
    fill: string
    [key: string]: any
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export function DailyStatusChart() {
    const [data, setData] = useState<StatusData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`${API_URL}/analytics/daily`, {
                    headers: { "ngrok-skip-browser-warning": "true" }
                }) // Default today
                const json = await res.json()
                if (json.success) {
                    setData(json.data)
                }
            } catch (error) {
                console.error("Failed to fetch daily stats", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <div className="h-[300px] flex items-center justify-center">Loading...</div>

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Status Hari Ini</CardTitle>
                <CardDescription>Distribusi kehadiran karyawan hari ini.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
