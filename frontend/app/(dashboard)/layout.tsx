import { SidebarWrapper } from "@/components/SidebarWrapper"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { DashboardSidebar } from "@/components/DashboardSidebar"

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen">
            <SidebarWrapper />
            <div className="flex-1 flex flex-col min-h-screen">
                <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40 lg:hidden sticky top-0 z-10 backdrop-blur-sm">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0 lg:hidden hover:bg-gray-200/50">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
                            <DashboardSidebar className="border-none" />
                        </SheetContent>
                    </Sheet>
                    <div className="font-semibold text-lg tracking-tight">Warunk Digital</div>
                </header>
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
