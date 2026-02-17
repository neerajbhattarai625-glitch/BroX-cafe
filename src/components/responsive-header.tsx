"use client"

import { useState } from "react"
import { ChefHat, Menu, LogOut, ShieldCheck, ShoppingBag, User, Sun, Moon, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTheme } from "next-themes"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavLink {
    label: string
    href: string
    icon: React.ReactNode
}

interface ResponsiveHeaderProps {
    user?: {
        username: string
        role: string
        displayName?: string | null
    }
    logoOnly?: boolean
    settings?: any
    lang?: string
    onLangToggle?: () => void
    onScanQR?: () => void
}

export function ResponsiveHeader({ user, logoOnly, settings, lang, onLangToggle, onScanQR }: ResponsiveHeaderProps) {
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' })
        router.push('/login')
    }

    const navLinks: NavLink[] = []

    if (user?.role === 'ADMIN') {
        navLinks.push(
            { label: 'Overview', href: '/dashboard', icon: <ShieldCheck className="h-4 w-4" /> },
            { label: 'Staff Management', href: '/dashboard/staff', icon: <User className="h-4 w-4" /> },
            { label: 'Site Settings', href: '/dashboard/settings', icon: <Sun className="h-4 w-4" /> }
        )
    } else if (user?.role === 'CHEF') {
        navLinks.push(
            { label: 'Kitchen Orders', href: '/chef', icon: <ChefHat className="h-4 w-4" /> }
        )
    } else if (user?.role === 'COUNTER') {
        navLinks.push(
            { label: 'Billing / Counter', href: '/counter', icon: <ShoppingBag className="h-4 w-4" /> }
        )
    } else if (user?.role === 'STAFF') {
        navLinks.push(
            { label: 'Floor Management', href: '/staff', icon: <User className="h-4 w-4" /> }
        )
    } else if (!user && !logoOnly) {
        // Public links if needed
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 mx-auto">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(user ? '/dashboard' : '/')}
                        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                    >
                        {settings?.logoImage ? (
                            <img src={settings.logoImage} alt="Logo" className="h-8 w-auto object-contain" />
                        ) : (
                            <div className="bg-orange-600 p-1.5 rounded-lg text-white shadow-lg shadow-orange-500/20">
                                <ChefHat className="h-6 w-6" />
                            </div>
                        )}
                        <span className="font-serif italic font-bold sm:inline-block text-xl">
                            {settings?.cafeName || 'Cafe Delight'}
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Desktop Nav */}
                    {!logoOnly && (
                        <nav className="hidden lg:flex items-center gap-6 mr-4">
                            {navLinks.map((link) => (
                                <button
                                    key={link.href}
                                    onClick={() => router.push(link.href)}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-orange-600 flex items-center gap-2",
                                        pathname === link.href ? "text-orange-600" : "text-muted-foreground"
                                    )}
                                >
                                    {link.icon}
                                    {link.label}
                                </button>
                            ))}
                        </nav>
                    )}

                    {onLangToggle && (
                        <Button variant="ghost" size="icon" className="rounded-full font-bold text-xs" onClick={onLangToggle}>
                            {lang?.toUpperCase() || 'EN'}
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-full"
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>

                    {onScanQR && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden md:flex rounded-full gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                            onClick={onScanQR}
                        >
                            <ShoppingBag className="h-4 w-4" />
                            Scan Table
                        </Button>
                    )}

                    {!logoOnly && (
                        <>
                            {/* Mobile Hamburger */}
                            <Sheet open={open} onOpenChange={setOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden rounded-full">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] flex flex-col">
                                    <SheetHeader className="text-left pb-6 border-b">
                                        <SheetTitle className="font-serif italic text-2xl">
                                            {settings?.cafeName || 'Menu'}
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="flex flex-col gap-2 mt-6 flex-1">
                                        {navLinks.map((link) => (
                                            <Button
                                                key={link.href}
                                                variant={pathname === link.href ? "secondary" : "ghost"}
                                                className="justify-start gap-4 h-12 text-lg rounded-xl"
                                                onClick={() => {
                                                    router.push(link.href)
                                                    setOpen(false)
                                                }}
                                            >
                                                {link.icon}
                                                {link.label}
                                            </Button>
                                        ))}

                                        {onScanQR && (
                                            <Button
                                                variant="outline"
                                                className="md:hidden justify-start gap-4 h-12 text-lg rounded-xl border-orange-200 text-orange-700"
                                                onClick={() => {
                                                    onScanQR()
                                                    setOpen(false)
                                                }}
                                            >
                                                <ShoppingBag className="h-5 w-5" />
                                                Scan Table QR
                                            </Button>
                                        )}

                                        {!user && (
                                            <Button
                                                variant="secondary"
                                                className="mt-4 justify-start gap-4 h-12 text-lg rounded-xl"
                                                onClick={() => router.push('/login')}
                                            >
                                                <ShieldCheck className="h-5 w-5" />
                                                Staff Login
                                            </Button>
                                        )}
                                    </div>

                                    {user && (
                                        <div className="mt-auto pt-6 border-t font-medium text-sm text-muted-foreground pb-4">
                                            <div className="mb-4">
                                                Logged in as: <span className="text-foreground">{user?.displayName || user?.username}</span>
                                                <p className="text-[10px] uppercase tracking-widest opacity-60">{user?.role}</p>
                                            </div>
                                            <Button
                                                variant="destructive"
                                                className="w-full justify-start gap-4 h-12 text-lg rounded-xl"
                                                onClick={handleLogout}
                                            >
                                                <LogOut className="h-5 w-5" />
                                                Logout
                                            </Button>
                                        </div>
                                    )}
                                </SheetContent>
                            </Sheet>

                            {user && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="hidden md:flex gap-2 rounded-full border-orange-200 text-orange-700 hover:bg-orange-50"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
