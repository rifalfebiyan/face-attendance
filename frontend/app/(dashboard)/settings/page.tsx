"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CalendarDays, Trash2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"

const settingsSchema = z.object({
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam salah (HH:MM)"),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam salah (HH:MM)"),
    late_tolerance_minutes: z.number().min(0, "Toleransi minimal 0 menit"),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true)

    // Holidays State
    const [holidays, setHolidays] = useState<any[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [holidayDesc, setHolidayDesc] = useState("")

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            start_time: "08:00",
            end_time: "17:00",
            late_tolerance_minutes: 15,
        },
        mode: "onChange",
    })

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

    useEffect(() => {
        const headers = { "ngrok-skip-browser-warning": "true" }

        // Fetch current settings
        fetch(`${API_URL}/settings`, { headers })
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    form.reset({
                        start_time: data.start_time.substring(0, 5), // Ensure HH:MM
                        end_time: data.end_time.substring(0, 5),
                        late_tolerance_minutes: data.late_tolerance_minutes,
                    })
                }
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false))

        fetchHolidays()
    }, [form])

    const fetchHolidays = async () => {
        try {
            const res = await fetch(`${API_URL}/holidays`, {
                headers: { "ngrok-skip-browser-warning": "true" }
            })
            const json = await res.json()
            if (json.success) setHolidays(json.data)
        } catch (e) {
            console.error(e)
        }
    }

    const addHoliday = async () => {
        if (!selectedDate || !holidayDesc) return toast.error("Pilih tanggal dan isi deskripsi")

        // Format YYYY-MM-DD (Local Time)
        const offset = selectedDate.getTimezoneOffset()
        const localDate = new Date(selectedDate.getTime() - (offset * 60 * 1000))
        const dateStr = localDate.toISOString().split('T')[0]

        try {
            await fetch(`${API_URL}/holidays`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({ date: dateStr, description: holidayDesc })
            })
            setHolidayDesc("")
            fetchHolidays()
            toast.success("Hari libur ditambahkan")
        } catch (e) {
            toast.error("Gagal menambah hari libur")
        }
    }

    const deleteHoliday = async (id: number) => {
        if (!confirm("Hapus hari libur?")) return
        await fetch(`${API_URL}/holidays/${id}`, {
            method: 'DELETE',
            headers: { "ngrok-skip-browser-warning": "true" }
        })
        fetchHolidays()
        toast.success("Hari libur dihapus")
    }

    // Highlighted dates for Calendar (modifiers)
    const holidayDates = holidays.map(h => new Date(h.date))

    async function onSubmit(values: SettingsFormValues) {
        try {

            const res = await fetch(`${API_URL}/settings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify(values),
            })

            const data = await res.json()
            if (res.ok && data.success) {
                toast.success("Pengaturan tersimpan!")
            } else {
                toast.error("Gagal menyimpan pengaturan")
            }
        } catch (error) {
            toast.error("Error koneksi ke server")
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Peraturan</h1>
                <p className="text-muted-foreground">
                    Kelola jadwal kerja dan hari libur perusahaan.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Column: Work Schedule Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Jadwal Kerja
                        </CardTitle>
                        <CardDescription>
                            Karyawan yang absen setelah (Jam Masuk + Toleransi) akan dianggap "Terlambat".
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="start_time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Jam Masuk</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="end_time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Jam Pulang</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="late_tolerance_minutes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Toleransi Keterlambatan (Menit)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={event => field.onChange(+event.target.value || 0)}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Minsal: 15 menit. Jika jam masuk 08:00, absen 08:16 dianggap terlambat.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full">Simpan Pengaturan</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Right Columns: Holiday Calendar */}
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Input Form & Calendar */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tambah Hari Libur</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="rounded-md border mb-4"
                                    modifiers={{ holiday: holidayDates }}
                                    modifiersStyles={{ holiday: { color: 'red', fontWeight: 'bold' } }}
                                />

                                <div className="w-full space-y-2">
                                    <Input
                                        placeholder="Keterangan (misal: Tahun Baru)"
                                        value={holidayDesc}
                                        onChange={(e) => setHolidayDesc(e.target.value)}
                                    />
                                    <Button onClick={addHoliday} className="w-full">Tambahkan Libur</Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* List of Holidays */}
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Daftar Hari Libur ({holidays.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                    {holidays.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">Belum ada hari libur.</p>
                                    )}
                                    {holidays.map((h) => (
                                        <div key={h.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-red-100 p-2 rounded-full text-red-600">
                                                    <CalendarDays className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{h.date}</div>
                                                    <div className="text-xs text-muted-foreground">{h.description}</div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteHoliday(h.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div >
    )
}


