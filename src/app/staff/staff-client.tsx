"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Users, CheckCircle2, Play, LogOut, Volume2, Bell, Table as TableIcon, Power } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChangePasswordModal } from "@/components/change-password-modal"
import { MobileMenu } from "@/components/mobile-menu"
import type { Order, ServiceRequest, Table, OrderStatus } from "@/lib/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function StaffClient() {
    const [user, setUser] = useState<{ displayName: string, role: string } | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [requests, setRequests] = useState<ServiceRequest[]>([])
    const [tables, setTables] = useState<Table[]>([])
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
            const [ordersRes, requestsRes, tablesRes] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/requests'),
                fetch('/api/tables')
            ])
            const ordersData = await ordersRes.json()
            const requestsData = await requestsRes.json()
            const tablesData = await tablesRes.json()

            setOrders(ordersData)
            setRequests(requestsData)
            setTables(tablesData)

            const currentPending = ordersData.filter((o: Order) => o.status === 'PENDING').length
            if (!isFirstLoad.current && prevPendingCount !== null && currentPending > prevPendingCount) {
                playNotification()
                toast.success("New order received!")
            }
            setPrevPendingCount(currentPending)
            isFirstLoad.current = false
        } catch (error) {
            console.error('Failed to fetch data:', error)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 3000)
        return () => clearInterval(interval)
    }, [])

    const playNotification = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(e => console.error('Audio play failed:', e))
        }
    }

    const handleLogout = () => {
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        router.push('/login')
    }

    const handleOrderAction = async (id: string, status: OrderStatus) => {
        setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
        try {
            await fetch('/api/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            })
            toast.success(`Order ${status.toLowerCase()}`)
        } catch (e) {
            toast.error("Failed to update order")
        }
    }

    const handleRequestAction = async (id: string, action: 'COMPLETED' | 'CANCELLED') => {
        setRequests(requests.map(r => r.id === id ? { ...r, status: action } : r))
        try {
            await fetch('/api/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: action })
            })
            toast.success(`Request ${action.toLowerCase()}`)
        } catch (e) {
            console.error(e)
        }
    }

    const handleTableAction = async (tableId: string, action: 'OPEN' | 'CLOSED') => {
        try {
            const res = await fetch('/api/tables', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId, status: action })
            })
            if (res.ok) {
                fetchData()
                toast.success(`Table ${action.toLowerCase()}`)
            }
        } catch (e) {
            toast.error("Failed to update table")
        }
    }

    const pendingOrders = orders.filter(o => o.status === 'PENDING')
    const preparingOrders = orders.filter(o => o.status === 'PREPARING')
    const uncompletedRequests = requests.filter(r => r.status === 'PENDING' && r.type === 'VOICE_ORDER')
    const openTables = tables.filter(t => t.status === 'OPEN')
    const closedTables = tables.filter(t => t.status === 'CLOSED')

    return (
        <div className="min-h-screen bg-background p-4 md:p-6 font-sans text-foreground">
            <div className="flex items-center justify-between mb-6 md:mb-8 gap-4 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white shadow-lg">
                        <Users className="h-5 w-5 md:h-7 md:w-7" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-foreground">
                            {user?.displayName ? `${user.displayName}'s Staff Dashboard` : 'Staff Dashboard'}
                        </h1>
                        <p className="text-xs md:text-base text-muted-foreground font-medium hidden sm:block">Manage orders and service requests</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Desktop Actions */}
                    <div className="hidden md:flex gap-3">
                        <ChangePasswordModal />
                        <ThemeToggle />
                        <Button variant="outline" size="icon" onClick={() => playNotification()} className="rounded-xl">
                            <Volume2 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl text-neutral-500 hover:text-red-600">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <MobileMenu>
                            <ChangePasswordModal />
                            <ThemeToggle />
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

            <Tabs defaultValue="orders" className="max-w-7xl mx-auto">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="orders" className="gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Orders</span>
                        {pendingOrders.length > 0 && <Badge variant="destructive" className="ml-1 px-1 rounded-full">{pendingOrders.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Requests</span>
                        {uncompletedRequests.length > 0 && <Badge variant="destructive" className="ml-1 px-1 rounded-full">{uncompletedRequests.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="tables" className="gap-2">
                        <TableIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Tables</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                        {/* Pending Orders */}
                        <div className="space-y-4">
                            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                                New Orders
                                <Badge variant="secondary" className="px-2 py-0.5">{pendingOrders.length}</Badge>
                            </h2>
                            {pendingOrders.length === 0 ? (
                                <div className="bg-card border-2 border-dashed rounded-xl p-8 md:p-12 text-center text-muted-foreground">
                                    <p>No pending orders</p>
                                </div>
                            ) : (
                                pendingOrders.map(order => (
                                    <Card key={order.id} className="border-l-4 border-l-orange-500">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base md:text-lg">
                                                    {order.tableNo ? `Table ${order.tableNo}` : 'Walk-in'}
                                                </CardTitle>
                                                <span className="text-xs md:text-sm text-muted-foreground">{order.time}</span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span>{item.name} x{item.qty}</span>
                                                    <span className="font-medium">₹{(item.qty * 100)}</span>
                                                </div>
                                            ))}
                                        </CardContent>
                                        <CardFooter className="gap-2">
                                            <Button size="sm" onClick={() => handleOrderAction(order.id, 'PREPARING')} className="flex-1">
                                                <Play className="h-4 w-4 mr-1" /> Start
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* Preparing Orders */}
                        <div className="space-y-4">
                            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                                In Preparation
                                <Badge variant="secondary" className="px-2 py-0.5">{preparingOrders.length}</Badge>
                            </h2>
                            {preparingOrders.length === 0 ? (
                                <div className="bg-card border-2 border-dashed rounded-xl p-8 md:p-12 text-center text-muted-foreground">
                                    <p>No orders in preparation</p>
                                </div>
                            ) : (
                                preparingOrders.map(order => (
                                    <Card key={order.id} className="border-l-4 border-l-blue-500">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base md:text-lg">
                                                    {order.tableNo ? `Table ${order.tableNo}` : 'Walk-in'}
                                                </CardTitle>
                                                <span className="text-xs md:text-sm text-muted-foreground">{order.time}</span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span>{item.name} x{item.qty}</span>
                                                </div>
                                            ))}
                                        </CardContent>
                                        <CardFooter>
                                            <Button size="sm" onClick={() => handleOrderAction(order.id, 'READY')} className="w-full bg-green-600 hover:bg-green-700">
                                                <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Ready
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {uncompletedRequests.map(req => (
                            <Card key={req.id} className="border-l-4 border-l-orange-500">
                                <CardHeader className="pb-2 p-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm font-bold">Table {req.tableNo}</CardTitle>
                                        <span className="text-xs text-muted-foreground">{req.time}</span>
                                    </div>
                                    <Badge variant="default" className="mt-1 w-fit">
                                        {req.type.replace('_', ' ')}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    {req.audioData && (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <audio controls src={req.audioData} className="w-full h-8" />
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
                        {uncompletedRequests.length === 0 && (
                            <div className="col-span-full bg-card border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground">
                                <p>No active requests</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="tables" className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {[...openTables, ...closedTables].sort((a, b) => parseInt(a.number) - parseInt(b.number)).map(table => (
                            <Card
                                key={table.id}
                                className={cn(
                                    "relative overflow-hidden transition-all hover:shadow-md border-2",
                                    table.status === 'OPEN' ? "border-green-500/20 bg-green-50/10" : "border-neutral-200 dark:border-neutral-800"
                                )}
                            >
                                <CardHeader className="p-4 pb-2 text-center">
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                        Table {table.number}
                                    </p>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 flex flex-col items-center gap-3">
                                    <Badge
                                        variant={table.status === 'OPEN' ? "default" : "outline"}
                                        className={cn(
                                            "font-bold px-3 py-0.5 rounded-full text-[10px] uppercase",
                                            table.status === 'OPEN' ? "bg-green-500 hover:bg-green-600 border-none" : "text-muted-foreground"
                                        )}
                                    >
                                        {table.status}
                                    </Badge>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={cn(
                                            "h-10 w-10 rounded-full transition-colors",
                                            table.status === 'OPEN'
                                                ? "text-green-600 hover:text-green-700 hover:bg-green-100/50"
                                                : "text-muted-foreground hover:bg-muted"
                                        )}
                                        onClick={() => handleTableAction(table.id, table.status === 'OPEN' ? 'CLOSED' : 'OPEN')}
                                    >
                                        <Power className={cn("h-5 w-5", table.status === 'OPEN' && "animate-pulse")} />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {(openTables.length === 0 && closedTables.length === 0) && (
                        <div className="bg-card border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground">
                            <p className="font-medium">No tables configured in system</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
