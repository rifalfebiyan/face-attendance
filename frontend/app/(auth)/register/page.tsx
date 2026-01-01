"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, CheckCircle2, User, Save, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { WebSocketCamera, WebSocketCameraRef, AttendanceResult } from "@/components/WebSocketCamera"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    id: z.string().min(3, {
        message: "ID/NIP must be at least 3 characters.",
    }),
})

export default function RegisterPage() {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2>(1)
    const [capturedImages, setCapturedImages] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isRecognized, setIsRecognized] = useState(false)

    // Explicitly type the ref
    const cameraRef = useRef<WebSocketCameraRef>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            id: "",
        },
    })

    function onFormSubmit() {
        setStep(2)
    }

    const handleWebSocketResult = (result: AttendanceResult) => {
        // Feedback loop: green if face is detected (even if unknown/stranger)
        // If error says "No face detected", we show red.
        // "Unknown face" is GOOD for registration (means face is seen).
        if (result.success || result.error === "Unknown face") {
            setIsRecognized(true)
        } else {
            setIsRecognized(false)
        }
    }

    const capturePhoto = async () => {
        if (!cameraRef.current) {
            console.error("Camera Ref is null!")
            toast.error("Camera not initialized")
            return
        }

        const tid = toast.loading("Mengambil foto...")
        try {
            const file = await cameraRef.current.capture()
            if (file) {
                setCapturedImages(prev => [...prev, file])
                toast.dismiss(tid)
                toast.success(`Foto ${capturedImages.length + 1} berhasil disimpan!`)
            } else {
                toast.dismiss(tid)
                toast.error("Gagal mengambil gambar. Pastikan kamera aktif.")
            }
        } catch (err) {
            console.error(err)
            toast.dismiss(tid)
            toast.error("Terjadi error saat capture.")
        }
    }

    const resetPhotos = () => {
        setCapturedImages([])
    }

    const submitRegistration = async () => {
        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("name", form.getValues("name"))
            formData.append("id", form.getValues("id"))

            capturedImages.forEach((file, index) => {
                formData.append(`photo${index}`, file)
            })

            const res = await fetch("/api/register", {
                method: "POST",
                body: formData
            })

            const data = await res.json()

            if (res.ok && data.success) {
                toast.success("Registrasi Berhasil!", {
                    description: "Data wajah telah tersimpan."
                })
                router.push("/dashboard")
            } else {
                toast.error("Registrasi Gagal", {
                    description: data.error || "Terjadi kesalahan."
                })
            }
        } catch (error) {
            toast.error("Error", { description: "Gagal menghubungi server." })
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Registrasi Wajah</h1>
                <p className="text-muted-foreground">Daftarkan wajah Anda untuk presensi otomatis.</p>
            </div>

            <Card className="w-full max-w-2xl border-none shadow-lg bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    {step === 1 ? (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                                        <User className="h-5 w-5" />
                                        Data Diri
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label>Nama Lengkap</Label>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label>NIP / ID Karyawan</Label>
                                                <FormControl>
                                                    <Input placeholder="12345678" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full" size="lg">
                                    Lanjut ke Foto Wajah
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="flex items-center gap-2 text-primary font-semibold">
                                    <Camera className="h-5 w-5" />
                                    Ambil 3 Foto
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {capturedImages.length} / 3 Foto
                                </div>
                            </div>

                            {capturedImages.length < 3 ? (
                                <div className="space-y-4">
                                    <WebSocketCamera
                                        ref={cameraRef}
                                        onResult={handleWebSocketResult}
                                        // autoCapture=true by default, so it helps us know if face is in frame
                                        serverUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}
                                    />

                                    <div className="flex justify-center flex-col items-center gap-2">
                                        <div className={`px-4 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${isRecognized ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {isRecognized ? "Wajah Terdeteksi" : "Wajah Tidak Terdeteksi"}
                                        </div>
                                        <p className="text-xs text-muted-foreground transition-all">
                                            {capturedImages.length === 0 && "Foto 1: Hadap Depan"}
                                            {capturedImages.length === 1 && "Foto 2: Serong Kiri Sedikit"}
                                            {capturedImages.length === 2 && "Foto 3: Serong Kanan Sedikit"}
                                        </p>
                                    </div>

                                    <Button
                                        onClick={capturePhoto}
                                        className="w-full"
                                        size="lg"
                                        disabled={!isRecognized}
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        Ambil Foto {capturedImages.length + 1}
                                    </Button>

                                    <p className="text-[10px] text-center text-muted-foreground">
                                        *Tombol aktif jika wajah terdeteksi
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6 text-center py-8">
                                    <div className="flex justify-center mb-4">
                                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in">
                                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-green-700">Foto Lengkap!</h3>
                                        <p className="text-muted-foreground">Siap untuk menyimpan data.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={resetPhotos} className="flex-1">
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Ulangi
                                        </Button>
                                        <Button onClick={submitRegistration} className="flex-1" disabled={isSubmitting}>
                                            {isSubmitting ? "Menyimpan..." : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Simpan & Daftar
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {capturedImages.length < 3 && (
                                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="w-full">
                                    Kembali ke Data Diri
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>


        </div>
    )
}
