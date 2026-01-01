"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Upload, CheckCircle } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface FaceUploadCardProps {
    index: number
    label: string
    onImageSelected: (file: File | null) => void
    image: File | null
}

export function FaceUploadCard({ index, label, onImageSelected, image }: FaceUploadCardProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            // Validate file type and size (simple check here, form validation handles details)
            if (file.size > 5 * 1024 * 1024) {
                alert("File too large (>5MB)")
                return
            }
            onImageSelected(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleRemove = () => {
        onImageSelected(null)
        setPreviewUrl(null)
        if (inputRef.current) inputRef.current.value = ""
    }

    return (
        <Card className={cn("relative overflow-hidden transition-all hover:border-primary", image && "border-primary bg-primary/5")}>
            <CardContent className="p-4 flex flex-col items-center justify-center min-h-[200px] text-center gap-4">
                <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    ref={inputRef}
                    onChange={handleFileChange}
                />

                {previewUrl ? (
                    <div className="relative w-full h-full aspect-square md:aspect-[4/3] rounded-md overflow-hidden group">
                        <Image
                            src={previewUrl}
                            alt={`Preview ${label}`}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="destructive" size="icon" onClick={handleRemove}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="flex flex-col items-center justify-center w-full h-full cursor-pointer py-8"
                        onClick={() => inputRef.current?.click()}
                    >
                        <div className="p-4 rounded-full bg-muted mb-3">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Click to upload
                        </p>
                    </div>
                )}

                {image && (
                    <div className="absolute top-2 right-2">
                        <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
