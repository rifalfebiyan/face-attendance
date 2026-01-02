"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    Users,
    History,
    Settings,
    LogOut,
    Camera,
    UserPlus,
    ScanFace,
    FileText,
    Clock,
    CalendarCheck
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function DashboardSidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    const sidebarItems = [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Data Karyawan",
            href: "/employees",
            icon: Users,
        },
        {
            title: "Jadwal Shift",
            href: "/shifts",
            icon: Clock,
        },
        {
            title: "Izin & Cuti",
            href: "/leaves",
            icon: CalendarCheck,
        },
        {
            title: "Laporan Presensi",
            href: "/reports",
            icon: FileText,
        },
        {
            title: "Activity Logs",
            href: "/logs",
            icon: History,
        },
        {
            title: "Pengaturan",
            href: "/settings",
            icon: Settings,
        },
    ]

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="flex items-center gap-2 px-4 mb-6 mt-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ScanFace className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Warunk Digital
                        </h2>
                    </div>

                    <div className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={pathname === item.href ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start transition-all duration-200",
                                        pathname === item.href
                                            ? "bg-primary/10 text-primary hover:bg-primary/20 font-medium shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <item.icon className={cn("mr-2 h-4 w-4", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                                    {item.title}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Aksi Cepat
                    </h2>
                    <div className="space-y-1">
                        <Link href="/attendance">
                            <Button variant="ghost" className="w-full justify-start hover:bg-green-50 hover:text-green-700 text-muted-foreground transition-all">
                                <Camera className="mr-2 h-4 w-4" />
                                Scan Presensi
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button variant="ghost" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700 text-muted-foreground transition-all">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Registrasi Wajah
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="px-3 py-2 mt-auto absolute bottom-4 w-full">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={async () => {
                        await fetch('/api/logout', { method: 'POST' })
                        window.location.href = '/login'
                    }}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                </Button>
            </div>
        </div>
    )
}
