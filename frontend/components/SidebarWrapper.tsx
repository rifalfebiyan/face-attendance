"use client"

import { usePathname } from "next/navigation"
import { DashboardSidebar } from "@/components/DashboardSidebar"

export function SidebarWrapper() {
    const pathname = usePathname()
    // Paths where sidebar should be hidden
    const hiddenPaths = ["/register", "/attendance"]
    // Check if current path starts with any of the hidden paths (to handle sub-routes if any, though exact match is safer for now)
    const shouldHide = hiddenPaths.some(path => pathname === path)

    if (shouldHide) return null

    return (
        <div className="hidden border-r bg-gray-100/40 lg:block lg:w-64 dark:bg-gray-800/40 sticky top-0 h-screen overflow-y-auto">
            <DashboardSidebar className="h-full" />
        </div>
    )
}
