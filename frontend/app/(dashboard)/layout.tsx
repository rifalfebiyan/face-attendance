import { SidebarWrapper } from "@/components/SidebarWrapper"

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
                    <div className="font-semibold">Face Attendance</div>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
