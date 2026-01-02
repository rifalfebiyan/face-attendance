"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TopLateItem {
    id: string
    name: string
    count: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export function TopLateList() {
    const [data, setData] = useState<TopLateItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`${API_URL}/analytics/top-late`, {
                    headers: { "ngrok-skip-browser-warning": "true" }
                })
                const json = await res.json()
                if (json.success) {
                    setData(json.data)
                } else {
                    setError(json.error || 'Unknown API error')
                }
            } catch (error: any) {
                console.error("Failed to fetch top late", error)
                setError(error.message || 'Fetch failed')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Terlambat Terbanyak</CardTitle>
                <CardDescription>Top 5 karyawan terlambat bulan ini.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Debug info removed */}

                <div className="space-y-4">
                    {loading ? (
                        <div>Loading...</div>
                    ) : data.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">Tidak ada data terlambat bulan ini 🎉</div>
                    ) : (
                        data.map((item) => (
                            <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={`https://avatar.vercel.sh/${item.name}`} alt={item.name} />
                                        <AvatarFallback>{item.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium leading-none">{item.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">ID: {item.id}</p>
                                    </div>
                                </div>
                                <div className="font-bold text-red-500">
                                    {item.count}x
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

