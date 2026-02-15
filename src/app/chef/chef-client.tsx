"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, ChefHat, CheckCircle2, Play, LogOut, Volume2, Bell } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChangePasswordModal } from "@/components/change-password-modal"
import { MobileMenu } from "@/components/mobile-menu"
import type { Order, ServiceRequest } from "@/lib/types"
import { toast } from "sonner"

export function ChefClient() {
    const [user, setUser] = useState<{ displayName: string, role: string } | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [requests, setRequests] = useState<ServiceRequest[]>([])
    const [prevPendingCount, setPrevPendingCount] = useState<number | null>(null)
    const seenRequestIds = useRef<Set<string>>(new Set())
    const isFirstLoad = useRef(true)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const router = useRouter()

    useEffect(() => {
        audioRef.current = new Audio("/sounds/notification.mp3")
        audioRef.current.load()
        fetchUser()
    }, [])

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/me')
            if (res.ok) {
                setUser(await res.json())
            }
        } catch (e) {
            console.error(e)
        }
    }

    const fetchData = async () => {
        try {
            const [ordersRes, requestsRes] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/requests')
            ])

            if (ordersRes.ok) {
                const data = await ordersRes.json()
                const pendingOrdersCount = data.filter((o: Order) => o.status === 'PENDING').length

                if (!isFirstLoad.current && prevPendingCount !== null && pendingOrdersCount > prevPendingCount) {
                    playNotification("New Order!")
                }

                setOrders(data)
                setPrevPendingCount(pendingOrdersCount)
            }

            if (requestsRes.ok) {
                const newReqs: ServiceRequest[] = await requestsRes.json();

                if (!isFirstLoad.current) {
                    const hasNewReq = newReqs.some(r => r.status === 'PENDING' && !seenRequestIds.current.has(r.id));
                    if (hasNewReq) playNotification("New Service Request / Voice Order!");
                }

                newReqs.forEach(r => seenRequestIds.current.add(r.id));
                setRequests(newReqs);
            }

            isFirstLoad.current = false
        } catch (error) {
            console.error("Failed to fetch data", error)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [])

    const playNotification = (msg = "New Order in Kitchen!") => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(e => console.warn("Audio blocked:", e))
        }
        toast.info(msg, { position: "top-center" })
    }

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: newStatus })
            })
            if (res.ok) {
                toast.success(`Order marked as ${newStatus.toLowerCase()}`)
                fetchData()
            }
        } catch (error) {
            toast.error("Failed to update order status")
        }
    }

    const handleRequestAction = async (id: string, action: 'COMPLETED' | 'CANCELLED') => {
        setRequests(requests.map(r => r.id === id ? { ...r, status: action } : r));
        try {
            await fetch('/api/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: action })
            });
        } catch (e) {
            console.error(e);
        }
    }

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' })
        router.push('/login')
    }

    const pendingOrders = orders.filter(o => o.status === 'PENDING')
    const preparingOrders = orders.filter(o => o.status === 'PREPARING')
    const uncompletedRequests = requests.filter(r => r.status === 'PENDING' && r.type === 'VOICE_ORDER');

    return (
        <div className="min-h-screen bg-background p-4 md:p-6 font-sans text-foreground">
            <div className="flex items-center justify-between mb-6 md:mb-8 max-w-7xl mx-auto gap-4">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-orange-500 dark:bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-200 dark:shadow-orange-900">
                        <ChefHat className="h-5 w-5 md:h-7 md:w-7" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-foreground">
                            {user?.displayName ? `${user.displayName}'s Kitchen` : 'Kitchen Display'}
                        </h1>
                        <p className="text-xs md:text-base text-muted-foreground font-medium hidden sm:block">Manage active food preparation</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Desktop buttons */}
                    <div className="hidden md:flex gap-3">
                        <ChangePasswordModal />
                        <ThemeToggle />
                        <Button variant="outline" size="icon" title={`${uncompletedRequests.length} Active Requests`} className="rounded-xl border-neutral-200 dark:border-neutral-800 relative">
                            <Bell className="h-5 w-5" />
                            {uncompletedRequests.length > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />}
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => playNotification()} className="rounded-xl border-neutral-200 dark:border-neutral-800">
                            <Volume2 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Mobile menu */}
                    <div className="md:hidden">
                        <MobileMenu>
                            <ChangePasswordModal />
                            <ThemeToggle />
                            <Button variant="outline" className="w-full justify-start gap-2" title={`${uncompletedRequests.length} Active Requests`}>
                                <Bell className="h-4 w-4" />
                                Requests ({uncompletedRequests.length})
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => playNotification()}>
                                <Volume2 className="h-4 w-4" />
                                Test Sound
                            </Button>
                            <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleLogout}>
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </MobileMenu>
                    </div>
                </div>
            </div>

            {/* Service Requests Section (Collapsible or floating? Let's put it at top if active) */}
            {uncompletedRequests.length > 0 && (
                <div className="max-w-7xl mx-auto mb-8 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-4 flex items-center gap-2">
                        <Bell className="h-4 w-4" /> Service Requests & Voice Orders
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {uncompletedRequests.map(req => (
                            <Card key={req.id} className="border-l-4 border-l-orange-500 shadow-sm">
                                <CardHeader className="pb-2 p-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm font-bold">Table {req.tableNo}</CardTitle>
                                        <span className="text-xs text-muted-foreground">{req.time}</span>
                                    </div>
                                    <Badge variant={req.type === 'CALL_WAITER' ? 'destructive' : 'default'} className="mt-1">
                                        {req.type.replace('_', ' ')}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    {req.type === 'VOICE_ORDER' && req.audioData && (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <audio
                                                controls
                                                src={req.audioData}
                                                className="w-full h-8"
                                            />
                                            <p className="text-[10px] text-center text-muted-foreground">Voice Message</p>
                                        </div>
                                    )}
                                    <div className="flex gap-2 mt-3">
                                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleRequestAction(req.id, 'CANCELLED')}>Ignore</Button>
                                        <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleRequestAction(req.id, 'COMPLETED')}>Done</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                {/* Column: PENDING */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                            New Orders
                            <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900 border-none px-2.5 py-0.5 rounded-full">
                                {pendingOrders.length}
                            </Badge>
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {pendingOrders.length === 0 && (
                            <div className="bg-card border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center text-muted-foreground">
                                <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p className="font-medium text-lg">No pending orders</p>
                            </div>
                        )}
                        {pendingOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                actionLabel="Start Preparing"
                                actionIcon={<Play className="h-4 w-4" />}
                                onAction={() => updateStatus(order.id, 'PREPARING')}
                                colorClass="border-orange-200"
                                badgeClass="bg-orange-50 text-orange-600"
                            />
                        ))}
                    </div>
                </div>

                {/* Column: PREPARING */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                            In Preparation
                            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900 border-none px-2.5 py-0.5 rounded-full">
                                {preparingOrders.length}
                            </Badge>
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {preparingOrders.length === 0 && (
                            <div className="bg-card border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p className="font-medium text-lg">Nothing is cooking yet</p>
                            </div>
                        )}
                        {preparingOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                actionLabel="Ready for Pickup"
                                actionIcon={<CheckCircle2 className="h-4 w-4" />}
                                onAction={() => updateStatus(order.id, 'READY')}
                                colorClass="border-blue-200"
                                badgeClass="bg-blue-50 text-blue-600"
                                variant="blue"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function OrderCard({ order, actionLabel, actionIcon, onAction, colorClass, badgeClass, variant = "orange" }: any) {
    return (
        <Card className={`overflow-hidden border-2 shadow-sm rounded-2xl transition-all hover:shadow-md bg-card ${colorClass}`}>
            <CardHeader className="pb-3 border-b bg-muted/50">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold">
                            {order.isOnlineOrder ? 'Online Guest' : `Table ${order.tableNo}`}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 mt-0.5 font-medium text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" /> {order.time}
                        </CardDescription>
                    </div>
                    <Badge className={`rounded-full border-none font-bold ${badgeClass}`}>
                        {order.status}
                    </Badge>
                </div>
                {order.isOnlineOrder && order.location && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                        Location: {order.location}
                    </div>
                )}
            </CardHeader>
            <CardContent className="pt-4 pb-4">
                <ul className="space-y-3">
                    {order.items.map((item: any, i: number) => (
                        <li key={i} className="flex justify-between items-center bg-card p-3 rounded-xl border border-border shadow-sm">
                            <span className="font-semibold text-foreground">{item.name}</span>
                            <span className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center text-sm font-bold">
                                {item.qty}
                            </span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="bg-muted/50 pt-3 pb-3 border-t">
                <Button
                    className={`w-full h-12 rounded-xl font-bold gap-2 text-white shadow-lg transition-transform active:scale-[0.98] ${variant === "blue"
                        ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                        : "bg-orange-600 hover:bg-orange-700 shadow-orange-100"
                        }`}
                    onClick={onAction}
                >
                    {actionIcon}
                    {actionLabel}
                </Button>
            </CardFooter>
        </Card>
    )
}
