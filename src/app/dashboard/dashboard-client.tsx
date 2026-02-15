"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle2, AlertCircle, ChefHat, Bell, LogOut, ShieldAlert, MapPin, Volume2 } from "lucide-react"
import type { ServiceRequest, Review, Order, OrderStatus } from "@/lib/types"
import { MenuManager } from "@/components/menu-manager/menu-manager"
import { SalesSummary } from "@/components/sales-summary"
import { TableManager } from "@/components/table-manager"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface DashboardClientProps {
    initialUser: { role: string } | null
}

function OrderCard({ order, onUpdateStatus, role }: { order: Order, onUpdateStatus: (id: string, s: OrderStatus, ps?: string) => void, role?: string }) {
    return (
        <Card className={cn(
            "border-l-4 shadow-sm hover:shadow-md transition-shadow",
            order.status === "PENDING" ? "border-l-primary" : "border-l-green-500",
            order.paymentMethod === 'ONLINE' && order.paymentStatus === 'PENDING' && "ring-2 ring-purple-500/20",
            order.isOnlineOrder && "bg-blue-50/30"
        )}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                                {order.isOnlineOrder ? 'Online Guest' : (order.tableNo ? `Table ${order.tableNo}` : 'Walk-in')}
                            </CardTitle>
                            {order.isOnlineOrder && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] font-bold">
                                    ONLINE
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" /> {order.time}
                        </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                        <Badge variant={order.status === "PENDING" ? "destructive" : "default"}>
                            {order.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            {order.paymentMethod}
                        </Badge>
                    </div>
                </div>

                {order.deviceName && (
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-medium">
                        <ShieldAlert className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{order.deviceName}</span>
                    </div>
                )}
                {order.location && (
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                        <MapPin className="h-3 w-3" />
                        <a
                            href={`https://www.google.com/maps?q=${order.location}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                        >
                            View Location
                        </a>
                    </div>
                )}
            </CardHeader>
            <CardContent className="pb-3 text-sm">
                <ul className="space-y-1">
                    {order.items.map((item, i) => (
                        <li key={i} className="flex justify-between">
                            <span>{item.qty}x {item.name}</span>
                        </li>
                    ))}
                </ul>
                <div className="mt-4 pt-4 border-t flex justify-between font-bold items-center">
                    <span>Total</span>
                    <div className="flex flex-col items-end">
                        <span>Rs. {order.total}</span>
                        <span className={cn("text-[10px] uppercase font-bold", order.paymentStatus === 'PAID' ? "text-green-600" : "text-orange-500")}>
                            {order.paymentStatus}
                        </span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="gap-2">
                {order.status === "PENDING" && role !== 'COUNTER' && (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => onUpdateStatus(order.id, "PREPARING")}>
                        Start Cooking
                    </Button>
                )}
                {order.status === "PREPARING" && role !== 'COUNTER' && (
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus(order.id, "SERVED")}>
                        Mark Served
                    </Button>
                )}
                {order.status === "SERVED" && (
                    <Button
                        variant={order.paymentStatus === 'PAID' ? "outline" : "default"}
                        className={cn("w-full transition-all", order.paymentStatus !== 'PAID' && order.paymentMethod === 'ONLINE' && "bg-purple-600 hover:bg-purple-700")}
                        onClick={() => onUpdateStatus(order.id, "SERVED", "PAID")}
                        disabled={order.paymentStatus === 'PAID'}
                    >
                        {order.paymentStatus === 'PAID' ? "Paid & Verified" : (
                            order.paymentMethod === 'ONLINE' ? "Verify Payment" : "Mark Paid"
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}

export function DashboardClient({ initialUser }: DashboardClientProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const [requests, setRequests] = useState<ServiceRequest[]>([])
    const [reviews, setReviews] = useState<Review[]>([])
    const seenOrderIds = useRef<Set<string>>(new Set())
    const seenRequestIds = useRef<Set<string>>(new Set())
    const seenServedIds = useRef<Set<string>>(new Set())
    const isFirstLoad = useRef(true)
    // Initialize with prop, no loading state needed for user
    const [user, setUser] = useState<{ role: string } | null>(initialUser)

    // Loading state only for data fetching, but user is already known
    // We can show a skeleton for data, but the LAYOUT (tabs) will be correct immediately
    const [dataLoading, setDataLoading] = useState(true)
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

    useEffect(() => {
        if (!user) {
            router.push('/login')
        }
    }, [user, router])

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
            const [orderRes, reqRes, revRes] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/requests'),
                fetch('/api/reviews')
            ])

            if (orderRes.ok) {
                const newOrders: Order[] = await orderRes.json();

                // Play sound for brand new orders or served orders
                if (!isFirstLoad.current) {
                    const hasNewOrder = newOrders.some(o => o.status === 'PENDING' && !seenOrderIds.current.has(o.id));
                    if (hasNewOrder) playNotification("New Customer Order!");

                    const hasNewServed = newOrders.some(o => o.status === 'SERVED' && !seenServedIds.current.has(o.id));
                    if (hasNewServed) playNotification("Order Ready in Kitchen!");
                }

                // Update seen IDs
                newOrders.forEach(o => {
                    seenOrderIds.current.add(o.id)
                    if (o.status === 'SERVED') seenServedIds.current.add(o.id)
                });
                setOrders(newOrders);
            }

            if (reqRes.ok) {
                const newReqs: ServiceRequest[] = await reqRes.json();

                // Play sound for brand new service requests
                if (!isFirstLoad.current) {
                    const hasNewReq = newReqs.some(r => r.status === 'PENDING' && !seenRequestIds.current.has(r.id));
                    if (hasNewReq) playNotification();
                }

                // Update seen IDs
                newReqs.forEach(r => seenRequestIds.current.add(r.id));
                setRequests(newReqs);
            }
            if (revRes.ok) setReviews(await revRes.json())

            isFirstLoad.current = false;
        } catch (error) {
            console.error("Failed to fetch data", error)
        } finally {
            setDataLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [])

    const updateStatus = async (id: string, newStatus: OrderStatus, paymentStatus?: string) => {
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus, ...(paymentStatus ? { paymentStatus: paymentStatus as 'PENDING' | 'PAID' } : {}) } : o))
        try {
            await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus, ...(paymentStatus ? { paymentStatus } : {}) })
            })
        } catch (error) { console.error(error) }
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

    const pendingOrders = orders.filter(o => o.status === "PENDING")
    const preparingOrders = orders.filter(o => o.status === "PREPARING")
    const uncompletedRequests = requests.filter(r => r.status === 'PENDING');

    return (
        <div className="min-h-screen bg-muted/40 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        {user?.role === 'COUNTER' ? 'Counter Dashboard' : 'Kitchen Dashboard'}
                    </h1>
                    <p className="text-muted-foreground">
                        {user?.role === 'COUNTER' ? 'Manage payments and view orders' : 'Manage active orders and service requests'}
                    </p>
                </div>
                <div className="flex gap-2 items-center">
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
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ChefHat className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </div>

            <Tabs defaultValue="orders" className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start mb-6">
                    <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">Orders</TabsTrigger>
                    {user?.role !== 'COUNTER' && (
                        <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">
                            Requests
                            {uncompletedRequests.length > 0 && (
                                <span className="ml-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
                            )}
                        </TabsTrigger>
                    )}
                    {user?.role === 'ADMIN' && (
                        <>
                            <TabsTrigger value="reviews" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">Reviews</TabsTrigger>
                            <TabsTrigger value="menu" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">Menu</TabsTrigger>
                            <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">Sales</TabsTrigger>
                        </>
                    )}
                    {user?.role !== 'COUNTER' && (
                        <TabsTrigger value="tables" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">Tables</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="orders">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                        {/* Pending Column - Hidden for Counter unless needed */}
                        {user?.role !== 'COUNTER' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-orange-500" /> Pending
                                    </h2>
                                    <Badge variant="secondary">{pendingOrders.length}</Badge>
                                </div>
                                {pendingOrders.map(order => (
                                    <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} role={user?.role} />
                                ))}
                            </div>
                        )}

                        {/* Preparing Column - Hidden for Counter unless needed */}
                        {user?.role !== 'COUNTER' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <ChefHat className="h-5 w-5 text-blue-500" /> Preparing
                                    </h2>
                                    <Badge variant="secondary">{preparingOrders.length}</Badge>
                                </div>
                                {preparingOrders.map(order => (
                                    <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} role={user?.role} />
                                ))}
                            </div>
                        )}

                        {/* Completed/Served Column - Primary focus for Counter */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" /> Served / To Pay
                                </h2>
                                <Badge variant="secondary">{orders.filter(o => o.status === "SERVED").length}</Badge>
                            </div>
                            {orders.filter(o => o.status === "SERVED").map(order => (
                                <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} role={user?.role} />
                            ))}
                        </div>
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
                                </CardContent>
                                <CardFooter className="gap-2">
                                    <Button size="sm" variant="outline" className="w-full flex-1" onClick={() => handleRequestAction(req.id, 'CANCELLED')}>Ignore</Button>
                                    <Button size="sm" className="w-full flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleRequestAction(req.id, 'COMPLETED')}>Done</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="reviews">
                    <div className="grid gap-4 mt-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {reviews.map(rev => (
                            <Card key={rev.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {rev.name}
                                        <span className="text-orange-400 flex text-sm">
                                            {Array.from({ length: rev.rating }).map((_, i) => <span key={i}>★</span>)}
                                        </span>
                                    </CardTitle>
                                    <CardDescription>{rev.time}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p>{rev.comment}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="menu">
                    <div className="mt-4 max-w-2xl mx-auto md:mx-0">
                        <MenuManager />
                    </div>
                </TabsContent>

                <TabsContent value="stats">
                    <div className="mt-4">
                        <SalesSummary />
                    </div>
                </TabsContent>

                <TabsContent value="tables">
                    <div className="mt-4">
                        <div className="mt-4">
                            <TableManager userRole={user?.role} orders={orders} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

// Utility for styles
// import { cn } from "@/lib/utils" removed
