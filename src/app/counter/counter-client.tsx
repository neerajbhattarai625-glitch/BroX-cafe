"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle2, AlertCircle, Banknote, LogOut, Volume2, Bell } from "lucide-react" // Banknote icon
import { ThemeToggle } from "@/components/theme-toggle"
import type { Order, ServiceRequest } from "@/lib/types" // Ensure types are updated if needed
import { TableManager } from "@/components/table-manager"
import { SalesSummary } from "@/components/sales-summary" // Reuse if possible, or adapt
import { toast } from "sonner"

interface CounterClientProps {
    initialUser: { role: string }
}

export function CounterClient({ initialUser }: CounterClientProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const [requests, setRequests] = useState<ServiceRequest[]>([])
    const seenOrderIds = useRef<Set<string>>(new Set())
    const seenServedIds = useRef<Set<string>>(new Set())
    const seenRequestIds = useRef<Set<string>>(new Set())
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
            const [ordersRes, requestsRes] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/requests')
            ])

            if (ordersRes.ok) {
                const data: Order[] = await ordersRes.json()

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

    // Logic to filter orders: Only show if ALL orders for the table are SERVED (or PAID/CANCELLED)
    // blocking statuses: PENDING, PREPARING, READY
    const isTableFullyServed = (tableNo: string) => {
        const tableOrders = orders.filter(o => o.tableNo === tableNo && o.status !== 'CANCELLED');
        // If any order is NOT Served and NOT Paid, then it's blocking
        // Actually, we want to know if everything is at least SERVED.
        // So PENDING, PREPARING, READY are blocking.
        // SERVED is fine. PAID is fine.
        return !tableOrders.some(o => ['PENDING', 'PREPARING', 'READY'].includes(o.status));
    }

    // Filter for Cash Pending AND Table is Ready for Bill
    // method='CASH' and paymentStatus='PENDING' and status='SERVED'
    // AND isTableFullyServed
    const pendingPayments = orders.filter(o => {
        if (o.paymentMethod !== 'CASH' || o.paymentStatus !== 'PENDING') return false;
        if (o.status !== 'SERVED') return false; // Must be served to pay
        if (o.tableNo && !isTableFullyServed(o.tableNo)) return false;
        return true;
    });

    // Notification logic for Counter: Only beep if a new order appears in the *eligible* pending payments
    // We need to track eligible IDs specifically for notification
    const eligiblePaymentIds = useRef<Set<string>>(new Set())

    useEffect(() => {
        if (isFirstLoad.current) return;

        const newEligible = pendingPayments.filter(o => !eligiblePaymentIds.current.has(o.id));
        if (newEligible.length > 0) {
            playNotification("New Bill Ready for Payment!");
            newEligible.forEach(o => eligiblePaymentIds.current.add(o.id));
        }
    }, [pendingPayments]) // Depend on the filtered list

    // Recent Sales (Paid orders)
    const paidOrders = orders.filter(o => o.paymentStatus === 'PAID')

    // Uncompleted requests
    const uncompletedRequests = requests.filter(r => r.status === 'PENDING');

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
                    <Button variant="outline" className="gap-2 bg-background">
                        <Bell className="h-4 w-4" />
                        <span className="hidden md:inline">Requests</span>
                        <Badge variant="destructive" className="ml-1 rounded-full px-1">{uncompletedRequests.length}</Badge>
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
                    <TabsTrigger value="payments">
                        Pending Payments
                        {pendingPayments.length > 0 && <Badge variant="destructive" className="ml-2 px-1 rounded-full">{pendingPayments.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="requests">
                        Requests
                        {uncompletedRequests.length > 0 && <span className="ml-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />}
                    </TabsTrigger>
                    <TabsTrigger value="tables">Tables</TabsTrigger>
                    <TabsTrigger value="sales">Sales History</TabsTrigger>
                </TabsList>

                <TabsContent value="payments">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                        {pendingPayments.length === 0 && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
                                <h3 className="text-lg font-semibold mb-1">No Pending Bills</h3>
                                <p className="text-muted-foreground">Bills will appear here only after all items for a table are served.</p>
                            </div>
                        )}
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

                <TabsContent value="requests">
                    <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
                        {uncompletedRequests.length === 0 && <p className="text-muted-foreground">No active requests</p>}
                        {uncompletedRequests.map(req => (
                            <Card key={req.id} className="border-l-4 border-l-orange-500 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex justify-between items-center">
                                        <span>Table {req.tableNo}</span>
                                        <span className="text-xs font-normal text-muted-foreground">{req.time}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Badge variant={req.type === 'CALL_WAITER' ? 'destructive' : 'default'} className="text-md py-1 px-3 w-full justify-center">
                                        {req.type.replace('_', ' ')}
                                    </Badge>

                                    {/* Voice Order Player */}
                                    {req.type === 'VOICE_ORDER' && req.audioData && (
                                        <div className="mt-4 flex flex-col gap-2">
                                            <audio
                                                controls
                                                src={req.audioData}
                                                className="w-full h-8"
                                            />
                                            <p className="text-xs text-center text-muted-foreground">Listen and create order</p>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="gap-2">
                                    <Button size="sm" variant="outline" className="w-full flex-1" onClick={() => handleRequestAction(req.id, 'CANCELLED')}>Ignore</Button>
                                    <Button size="sm" className="w-full flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleRequestAction(req.id, 'COMPLETED')}>Done</Button>
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
