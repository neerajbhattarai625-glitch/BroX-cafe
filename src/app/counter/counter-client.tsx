"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle2, AlertCircle, Banknote, LogOut, Volume2, Bell } from "lucide-react" // Banknote icon
import { ThemeToggle } from "@/components/theme-toggle"
import { ChangePasswordModal } from "@/components/change-password-modal"
import type { Order, ServiceRequest } from "@/lib/types" // Ensure types are updated if needed
import { TableManager } from "@/components/table-manager"
import { SalesSummary } from "@/components/sales-summary"
import { MobileMenu } from "@/components/mobile-menu"
import { toast } from "sonner"

interface CounterClientProps {
    initialUser: { role: string }
}

export function CounterClient({ initialUser }: CounterClientProps) {
    const [user, setUser] = useState<{ displayName: string, role: string } | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [requests, setRequests] = useState<ServiceRequest[]>([])
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
                setOrders(data)
            }

            if (requestsRes.ok) {
                const newReqs: ServiceRequest[] = await requestsRes.json();
                if (!isFirstLoad.current) {
                    const hasNewReq = newReqs.some(r => r.status === 'PENDING' && !seenRequestIds.current.has(r.id));
                    if (hasNewReq) playNotification("New Service Request!");
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

    const playNotification = (msg = "Counter Notification") => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(e => console.warn("Audio blocked:", e))
        }
        toast.info(msg, { position: "top-center" })
    }

    const testSound = () => {
        playNotification("Test Sound Working!")
    }

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' })
        router.push('/login')
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

    const confirmPayment = async (orderId: string) => {
        try {
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, paymentStatus: 'PAID' })
            })
            if (res.ok) {
                toast.success("Payment confirmed")
                fetchData()
            }
        } catch (error) {
            toast.error("Failed to confirm payment")
        }
    }

    const pendingPayments = orders.filter(o => o.status === 'SERVED' && o.paymentStatus !== 'PAID')
    const uncompletedRequests = requests.filter(r => r.status === 'PENDING')

    return (
        <div className="min-h-screen bg-muted/40 p-4 md:p-6">
            <div className="flex items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-green-500 dark:bg-green-600 flex items-center justify-center text-white shadow-lg">
                        <Banknote className="h-5 w-5 md:h-7 md:w-7" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight">
                            {user?.displayName ? `${user.displayName}'s Counter` : 'Counter Dashboard'}
                        </h1>
                        <p className="text-xs md:text-base text-muted-foreground hidden sm:block">Manage payments and view sales</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Desktop Actions */}
                    <div className="hidden md:flex gap-2 items-center">
                        <ThemeToggle />
                        <Button variant="outline" size="icon" onClick={testSound} title="Test Notification Sound" className="bg-background">
                            <Volume2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="gap-2 bg-background">
                            <Bell className="h-4 w-4" />
                            <span>Requests</span>
                            <Badge variant="destructive" className="ml-1 rounded-full px-1">{uncompletedRequests.length}</Badge>
                        </Button>
                        <ChangePasswordModal />
                        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <MobileMenu>
                            <ChangePasswordModal />
                            <ThemeToggle />
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={testSound}>
                                <Volume2 className="h-4 w-4" />
                                Test Sound
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <Bell className="h-4 w-4" />
                                Requests ({uncompletedRequests.length})
                            </Button>
                            <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleLogout}>
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </MobileMenu>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="payments" className="w-full">
                <TabsList className="bg-background border mb-4">
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
                            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-card">
                                <h3 className="text-lg font-semibold mb-1">No Pending Bills</h3>
                                <p className="text-muted-foreground">Bills will appear here only after all items for a table are served.</p>
                            </div>
                        )}
                        {pendingPayments.map(order => (
                            <Card key={order.id} className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">Table {order.tableNo}</CardTitle>
                                        <Badge variant="outline" className="font-bold text-primary">Rs. {order.total}</Badge>
                                    </div>
                                    <CardDescription>{order.time} - {order.paymentMethod}</CardDescription>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <ul className="text-sm space-y-2 border-t pt-3">
                                        {(order.items as any[]).map((item, i) => (
                                            <li key={i} className="flex justify-between">
                                                <span>{item.name}</span>
                                                <span className="font-medium">x{item.qty}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button className="w-full bg-green-600 hover:bg-green-700 shadow-sm" onClick={() => confirmPayment(order.id)}>
                                        Confirm Payment Received
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="requests">
                    <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
                        {uncompletedRequests.length === 0 && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-card">
                                <p className="text-muted-foreground">No active requests</p>
                            </div>
                        )}
                        {uncompletedRequests.map(req => (
                            <Card key={req.id} className="border-l-4 border-l-orange-500 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex justify-between items-center text-base">
                                        <span>Table {req.tableNo}</span>
                                        <span className="text-xs font-normal text-muted-foreground">{req.time}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <Badge variant={req.type === 'CALL_WAITER' ? 'destructive' : 'default'} className="text-xs py-1 px-3 w-full justify-center rounded-lg">
                                        {req.type.replace('_', ' ')}
                                    </Badge>

                                    {req.type === 'VOICE_ORDER' && req.audioData && (
                                        <div className="mt-4 flex flex-col gap-2">
                                            <audio controls src={req.audioData} className="w-full h-8" />
                                            <p className="text-[10px] text-center text-muted-foreground">Voice Message</p>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="gap-2">
                                    <Button size="sm" variant="outline" className="w-full flex-1 h-9" onClick={() => handleRequestAction(req.id, 'CANCELLED')}>Ignore</Button>
                                    <Button size="sm" className="w-full flex-1 h-9 bg-green-600 hover:bg-green-700" onClick={() => handleRequestAction(req.id, 'COMPLETED')}>Done</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="tables">
                    <div className="mt-4 bg-card p-4 rounded-xl border border-border shadow-sm">
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
