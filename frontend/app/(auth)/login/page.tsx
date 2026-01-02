"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Lock, Mail, ScanFace } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(1, {
        message: "Password is required.",
    }),
})

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("email", values.email)
            formData.append("password", values.password)

            const response = await fetch("/api/login", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Login failed")
            }

            toast.success("Login successful")
            // Store user name for audit logs
            if (data.user && data.user.name) {
                localStorage.setItem("user_name", data.user.name)
            }
            router.push("/")
            router.refresh()
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("An unknown error occurred")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
            {/* Ambient Background */}
            <div className="absolute inset-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[100px] animate-pulse" />
            </div>

            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            {/* Main Card */}
            <div className="relative w-full max-w-md p-8 m-4">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"></div>
                <div className="relative space-y-8 z-10">

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                            <ScanFace className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
                        <p className="text-gray-400">Sign in to access your dashboard</p>
                    </div>

                    {/* Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300">Email Address</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-400 transition-colors">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <Input
                                                    placeholder="admin@example.com"
                                                    className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:bg-black/40 transition-all h-11"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-gray-300">Password</FormLabel>
                                            <span className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 transition-colors">
                                                Forgot password?
                                            </span>
                                        </div>
                                        <FormControl>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-400 transition-colors">
                                                    <Lock className="w-5 h-5" />
                                                </div>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:bg-black/40 transition-all h-11"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium border-0 shadow-lg shadow-blue-500/20 transition-all duration-300"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    "Sign in to Dashboard"
                                )}
                            </Button>
                        </form>
                    </Form>

                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 text-center text-xs text-gray-500">
                &copy; 2024 Warunk Digital. Secure & Protected.
            </div>
        </div>
    )
}
