"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle2, AlertCircle, Banknote, LogOut, Volume2 } from "lucide-react" // Banknote icon
import { ThemeToggle } from "@/components/theme-toggle"
import type { Order } from "@/lib/types" // Ensure types are updated if needed
import { TableManager } from "@/components/table-manager"
import { SalesSummary } from "@/components/sales-summary" // Reuse if possible, or adapt
import { toast } from "sonner"

interface CounterClientProps {
    initialUser: { role: string }
}

export function CounterClient({ initialUser }: CounterClientProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const seenOrderIds = useRef<Set<string>>(new Set())
    const seenServedIds = useRef<Set<string>>(new Set())
    const isFirstLoad = useRef(true)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        audioRef.current = new Audio("/sounds/notification.mp3")
        audioRef.current.load()
    }, [])

    const playNotification = (message = "New Order Received!") => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().then(() => {
                console.log("Audio played successfully")
            }).catch(e => {
                console.warn("Audio playback blocked or failed:", e)
            })
        }
        toast.info(message, {
            duration: 3000,
            position: "top-right"
        })
    }

    const router = useRouter()

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' })
        router.push('/login')
    }

    const testSound = () => {
        playNotification()
        alert("If you didn't hear a sound, please ensure your volume is up and you've allowed audio in your browser settings.")
    }

    const fetchData = async () => {
        try {
            const res = await fetch('/api/orders')
            if (res.ok) {
                const data: Order[] = await res.json()

                if (!isFirstLoad.current) {
                    // 1. Check for new PENDING orders
                    const hasNewOrder = data.some(o => o.status === 'PENDING' && !seenOrderIds.current.has(o.id));
                    if (hasNewOrder) playNotification("New Customer Order!");

                    // 2. Check for newly SERVED orders (Ready from kitchen)
                    const hasNewServed = data.some(o => o.status === 'SERVED' && !seenServedIds.current.has(o.id));
                    if (hasNewServed) playNotification("Order Ready in Kitchen!");
                }

                // Update seen IDs
                data.forEach(o => {
                    seenOrderIds.current.add(o.id)
                    if (o.status === 'SERVED') seenServedIds.current.add(o.id)
                })

                setOrders(data)
                isFirstLoad.current = false
            }
        } catch (error) {
            console.error("Failed to fetch orders", error)
        }
    }

    useEffect(() => {
        const timeout = setTimeout(fetchData, 0)
        const interval = setInterval(fetchData, 10000)
        return () => {
            clearTimeout(timeout)
            clearInterval(interval)
        }
    }, [])

    const confirmPayment = async (orderId: string) => {
        try {
            const orderToPay = orders.find(o => o.id === orderId)
            if (!orderToPay) return

            await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, paymentStatus: 'PAID', status: 'PAID' })
            })

            // Auto-close table logic
            if (!orderToPay.isOnlineOrder && orderToPay.tableNo) {
                // Fetch fresh tables to get the table ID
                const tablesRes = await fetch('/api/tables')
                if (tablesRes.ok) {
                    const tables = await tablesRes.json()
                    const table = tables.find((t: any) => t.number === orderToPay.tableNo)

                    if (table && table.status === 'OPEN') {
                        // Check if ANY other orders for this table are still unpaid
                        const otherUnpaid = orders.filter(o =>
                            o.tableNo === orderToPay.tableNo &&
                            o.id !== orderId &&
                            o.paymentStatus !== 'PAID' &&
                            o.status !== 'CANCELLED'
                        )

                        if (otherUnpaid.length === 0) {
                            await fetch('/api/tables', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: table.id, status: 'CLOSED' })
                            })
                            toast.success(`Table ${orderToPay.tableNo} closed automatically`, {
                                description: "All orders have been paid."
                            })
                        }
                    }
                }
            }
            fetchData()
        } catch (error) {
            console.error("Failed to confirm payment", error)
            toast.error("Failed to confirm payment")
        }
    }

    // Filter for Cash Pending
    // method='CASH' and paymentStatus='PENDING'
    const pendingPayments = orders.filter(o => o.paymentMethod === 'CASH' && o.paymentStatus === 'PENDING')

    // Recent Sales (Paid orders)
    const paidOrders = orders.filter(o => o.paymentStatus === 'PAID')

    return (
        <div className="min-h-screen bg-muted/40 p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Counter Dashboard</h1>
                    <p className="text-muted-foreground">Manage payments and view sales</p>
                </div>
                <div className="flex gap-2 items-center">
                    <ThemeToggle />
                    <Button variant="outline" size="icon" onClick={testSound} title="Test Notification Sound" className="bg-background">
                        <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                        <LogOut className="h-5 w-5" />
                    </Button>
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Banknote className="h-6 w-6 text-green-700" />
                    </div>
                </div>
            </div>

            <Tabs defaultValue="payments" className="w-full">
                <TabsList>
                    <TabsTrigger value="payments">Pending Payments</TabsTrigger>
                    <TabsTrigger value="tables">Tables</TabsTrigger>
                    <TabsTrigger value="sales">Sales History</TabsTrigger>
                </TabsList>

                <TabsContent value="payments">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                        {pendingPayments.length === 0 && <p className="text-muted-foreground p-4">No pending cash payments.</p>}
                        {pendingPayments.map(order => (
                            <Card key={order.id} className="border-l-4 border-l-orange-500">
                                <CardHeader>
                                    <div className="flex justify-between">
                                        <CardTitle>Table {order.tableNo}</CardTitle>
                                        <Badge variant="outline">Rs. {order.total}</Badge>
                                    </div>
                                    <CardDescription>{order.time} - {order.paymentMethod}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm space-y-1">
                                        {order.items.map((item, i) => (
                                            <li key={i}>{item.qty}x {item.name}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => confirmPayment(order.id)}>
                                        Confirm Payment Received
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="tables">
                    <div className="mt-4">
                        <TableManager userRole={initialUser.role} orders={orders} />
                    </div>
                </TabsContent>

                <TabsContent value="sales">
                    <div className="mt-4">
                        <SalesSummary />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
