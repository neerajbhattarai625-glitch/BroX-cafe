"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, CheckCircle2, AlertCircle, ChefHat, Bell, LogOut, TrendingUp, QrCode } from "lucide-react"



const MOCK_ORDERS: Order[] = [
    {
        id: "ord-1",
        tableNo: "5",
        items: [{ name: "Steam Buff Momo", qty: 2 }, { name: "Coke", qty: 2 }],
        total: 500,
        status: "PENDING",
        time: "10:30 AM"
    },
    {
        id: "ord-2",
        tableNo: "3",
        items: [{ name: "Veg Chowmein", qty: 1 }],
        total: 180,
        status: "PREPARING",
        time: "10:32 AM"
    },
    {
        id: "ord-3",
        tableNo: "8",
        items: [{ name: "Chicken Pizza", qty: 1 }, { name: "Lemonade", qty: 2 }],
        total: 850,
        status: "SERVED",
        time: "10:15 AM"
    }
]

import type { ServiceRequest, Review, Order, OrderStatus } from "@/lib/types"
import { MenuManager } from "@/components/menu-manager/menu-manager"
import { SalesSummary } from "@/components/sales-summary"
import { TableManager } from "@/components/table-manager"

export default function Dashboard() {
    const [orders, setOrders] = useState<Order[]>([])
    const [requests, setRequests] = useState<ServiceRequest[]>([])
    const [reviews, setReviews] = useState<Review[]>([])
    const [user, setUser] = useState<{ role: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' })
        router.push('/login')
    }

    const fetchData = async () => {
        try {
            const [orderRes, reqRes, revRes, userRes] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/requests'),
                fetch('/api/reviews'),
                fetch('/api/login')
            ])

            if (orderRes.ok) setOrders(await orderRes.json())
            if (reqRes.ok) setRequests(await reqRes.json())
            if (revRes.ok) setReviews(await revRes.json())
            if (userRes.ok) {
                const userData = await userRes.json()
                if (userData.user) setUser(userData.user)
            }
        } catch (error) {
            console.error("Failed to fetch data", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [])

    const updateStatus = async (id: string, newStatus: OrderStatus) => {
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o))
        try {
            await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            })
        } catch (error) { console.error(error) }
    }

    const pendingOrders = orders.filter(o => o.status === "PENDING")
    const preparingOrders = orders.filter(o => o.status === "PREPARING")

    return (
        <div className="min-h-screen bg-muted/40 p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kitchen Dashboard</h1>
                    <p className="text-muted-foreground">Manage active orders and service requests</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Requests <Badge variant="destructive" className="ml-1 rounded-full px-1">{requests.filter(r => r.status === 'PENDING').length}</Badge>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                        <LogOut className="h-5 w-5" />
                    </Button>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ChefHat className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <Tabs defaultValue="orders" className="w-full">
                    <TabsList>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                        <TabsTrigger value="requests">Requests</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        <TabsTrigger value="menu">Menu</TabsTrigger>
                        <TabsTrigger value="stats">Sales</TabsTrigger>
                        {user?.role === 'ADMIN' && <TabsTrigger value="tables">Tables</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="orders">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                            {/* Pending Column */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-orange-500" /> Pending
                                    </h2>
                                    <Badge variant="secondary">{pendingOrders.length}</Badge>
                                </div>
                                {pendingOrders.map(order => (
                                    <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
                                ))}
                            </div>

                            {/* Preparing Column */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <ChefHat className="h-5 w-5 text-blue-500" /> Preparing
                                    </h2>
                                    <Badge variant="secondary">{preparingOrders.length}</Badge>
                                </div>
                                {preparingOrders.map(order => (
                                    <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
                                ))}
                            </div>

                            {/* Completed/Served Column */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" /> Served
                                    </h2>
                                    <Badge variant="secondary">{orders.filter(o => o.status === "SERVED").length}</Badge>
                                </div>
                                {orders.filter(o => o.status === "SERVED").map(order => (
                                    <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="requests">
                        <div className="grid gap-4 mt-4">
                            {requests.length === 0 && <p>No active requests</p>}
                            {requests.map(req => (
                                <Card key={req.id}>
                                    <CardHeader>
                                        <CardTitle>Table {req.tableNo}</CardTitle>
                                        <CardDescription>{req.time}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Badge variant={req.type === 'CALL_WAITER' ? 'destructive' : 'default'} className="text-lg py-1 px-3">
                                            {req.type.replace('_', ' ')}
                                        </Badge>
                                    </CardContent>
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
                        <div className="mt-4 max-w-2xl">
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
                            <TableManager />
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}

function OrderCard({ order, onUpdateStatus }: { order: Order, onUpdateStatus: (id: string, s: OrderStatus) => void }) {
    return (
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">Table {order.tableNo}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" /> {order.time}
                        </CardDescription>
                    </div>
                    <Badge variant={order.status === "PENDING" ? "destructive" : "default"}>
                        {order.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-3 text-sm">
                <ul className="space-y-1">
                    {order.items.map((item, i) => (
                        <li key={i} className="flex justify-between">
                            <span>{item.qty}x {item.name}</span>
                        </li>
                    ))}
                </ul>
                <div className="mt-4 pt-4 border-t flex justify-between font-bold">
                    <span>Total</span>
                    <span>Rs. {order.total}</span>
                </div>
            </CardContent>
            <CardFooter className="gap-2">
                {order.status === "PENDING" && (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => onUpdateStatus(order.id, "PREPARING")}>
                        Start Cooking
                    </Button>
                )}
                {order.status === "PREPARING" && (
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus(order.id, "SERVED")}>
                        Mark Served
                    </Button>
                )}
                {order.status === "SERVED" && (
                    <Button variant="outline" className="w-full" onClick={() => onUpdateStatus(order.id, "PAID")}>
                        Mark Paid
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
