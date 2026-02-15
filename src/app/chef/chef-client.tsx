"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, ChefHat, CheckCircle2, Play, LogOut, Volume2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Order } from "@/lib/types"
import { toast } from "sonner"

export function ChefClient() {
    const [orders, setOrders] = useState<Order[]>([])
    const [prevPendingCount, setPrevPendingCount] = useState<number | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const router = useRouter()

    useEffect(() => {
        audioRef.current = new Audio("/sounds/notification.mp3")
        audioRef.current.load()
    }, [])

    const playNotification = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(e => console.warn("Audio blocked:", e))
        }
        toast.info("New Order in Kitchen!", { position: "top-center" })
    }

    const fetchData = async () => {
        try {
            const res = await fetch('/api/orders')
            if (res.ok) {
                const data = await res.json()
                const pendingOrders = data.filter((o: Order) => o.status === 'PENDING')

                if (prevPendingCount !== null && pendingOrders.length > prevPendingCount) {
                    playNotification()
                }

                setOrders(data)
                setPrevPendingCount(pendingOrders.length)
            }
        } catch (error) {
            console.error("Failed to fetch orders", error)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [])

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

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' })
        router.push('/login')
    }

    const pendingOrders = orders.filter(o => o.status === 'PENDING')
    const preparingOrders = orders.filter(o => o.status === 'PREPARING')

    return (
        <div className="min-h-screen bg-neutral-50 p-6 font-sans">
            <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                        <ChefHat className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Kitchen Display</h1>
                        <p className="text-neutral-500 font-medium">Manage active food preparation</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <ThemeToggle />
                    <Button variant="outline" size="icon" onClick={() => playNotification()} className="rounded-xl border-neutral-200 dark:border-neutral-800">
                        <Volume2 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl text-neutral-500 hover:text-red-600 hover:bg-red-50">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                {/* Column: PENDING */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-800">
                            New Orders
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-2.5 py-0.5 rounded-full">
                                {pendingOrders.length}
                            </Badge>
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {pendingOrders.length === 0 && (
                            <div className="bg-white border-2 border-dashed border-neutral-200 rounded-2xl p-12 text-center text-neutral-400">
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
                        <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-800">
                            In Preparation
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-2.5 py-0.5 rounded-full">
                                {preparingOrders.length}
                            </Badge>
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {preparingOrders.length === 0 && (
                            <div className="bg-white border-2 border-dashed border-neutral-200 rounded-2xl p-12 text-center text-neutral-400">
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
        <Card className={`overflow-hidden border-2 shadow-sm rounded-2xl transition-all hover:shadow-md ${colorClass}`}>
            <CardHeader className="pb-3 border-b bg-neutral-50/50">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold">
                            {order.isOnlineOrder ? 'Online Guest' : `Table ${order.tableNo}`}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 mt-0.5 font-medium text-neutral-500">
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
                        <li key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-neutral-100 shadow-sm">
                            <span className="font-semibold text-neutral-800">{item.name}</span>
                            <span className="h-8 w-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-sm font-bold">
                                {item.qty}
                            </span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="bg-neutral-50/50 pt-3 pb-3 border-t">
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
