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
import { Clock } from "lucide-react"

const settingsSchema = z.object({
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam salah (HH:MM)"),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam salah (HH:MM)"),
    late_tolerance_minutes: z.number().min(0, "Toleransi minimal 0 menit"),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true)

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            start_time: "08:00",
            end_time: "17:00",
            late_tolerance_minutes: 15,
        },
        mode: "onChange",
    })

    useEffect(() => {
        // Fetch current settings
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/settings`, {
            headers: { "ngrok-skip-browser-warning": "true" }
        })
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
    }, [form])

    async function onSubmit(values: SettingsFormValues) {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/settings`, {
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
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pengaturan Presensi</h1>
                <p className="text-muted-foreground">
                    Kelola jadwal jam masuk dan toleransi keterlambatan.
                </p>
            </div>

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

                            <Button type="submit">Simpan Pengaturan</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}


