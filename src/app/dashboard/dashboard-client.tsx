"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle2, AlertCircle, ChefHat, Bell, LogOut, ShieldAlert, MapPin, Volume2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChangePasswordModal } from "@/components/change-password-modal"
import type { ServiceRequest as BaseServiceRequest, Review, Order, OrderStatus } from "@/lib/types"

interface ServiceRequest extends BaseServiceRequest {
    assignedToUserId?: string;
    audioData?: string;
}
import { MenuManager } from "@/components/menu-manager/menu-manager"
import { SalesSummary } from "@/components/sales-summary"
import { TableManager } from "@/components/table-manager"
import { DeviceManager } from "@/components/device-manager"
import { SettingsManager } from "@/components/settings-manager"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface DashboardClientProps {
    initialUser: { role: string, username?: string, displayName?: string | null } | null
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
                {order.status === "PENDING" && role !== 'COUNTER' && role !== 'ADMIN' && (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => onUpdateStatus(order.id, "PREPARING")}>
                        Start Cooking
                    </Button>
                )}
                {/* PREPARING buttons hidden here, Chef Dashboard handles it */}

                {order.status === "READY" && role !== 'COUNTER' && (
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
    const [settings, setSettings] = useState<any>(null)
    const seenOrderIds = useRef<Set<string>>(new Set())
    const seenRequestIds = useRef<Set<string>>(new Set())
    const seenServedIds = useRef<Set<string>>(new Set())
    const isFirstLoad = useRef(true)

    // Initialize with prop
    const [user, setUser] = useState<{ role: string, username?: string, displayName?: string | null } | null>(initialUser)

    const [dataLoading, setDataLoading] = useState(true)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        fetchSettings()
        audioRef.current = new Audio("/sounds/notification.mp3")
        audioRef.current.load()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings')
            if (res.ok) setSettings(await res.json())
        } catch (e) { console.error(e) }
    }

    const playNotification = (message = "New Order Received!") => {
        // ADMIN should not hear sounds
        if (user?.role === 'ADMIN') return;

        // Try to play the beep sound
        if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(e => console.warn("Audio playback blocked:", e))
        }

        // Use SpeechSynthesis for LOUD announcement
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 1.0;
            utterance.pitch = 1.1;
            utterance.volume = 1.0; // Max volume
            window.speechSynthesis.speak(utterance);
        }

        toast.info(message, {
            duration: 5000,
            position: "top-right",
            action: {
                label: "Dismiss",
                onClick: () => window.speechSynthesis.cancel()
            }
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

                // Play sound for brand new orders or READY orders (Kitchen -> Waiter)
                if (!isFirstLoad.current) {
                    const hasNewOrder = newOrders.some(o => o.status === 'PENDING' && !seenOrderIds.current.has(o.id));
                    if (hasNewOrder) playNotification("New Customer Order!");

                    // Notify Waiter when Chef sets status to READY
                    const hasNewReady = newOrders.some(o => o.status === 'READY' && !seenServedIds.current.has(o.id));
                    if (hasNewReady) playNotification("Order Ready to Serve!");
                }

                // Update seen IDs
                newOrders.forEach(o => {
                    seenOrderIds.current.add(o.id)
                    if (o.status === 'READY') seenServedIds.current.add(o.id)
                });
                setOrders(newOrders);
            }

            if (reqRes.ok) {
                const newReqs: ServiceRequest[] = await reqRes.json();

                // Play sound for brand new service requests
                if (!isFirstLoad.current) {
                    const hasNewReq = newReqs.some(r => r.status === 'PENDING' && !seenRequestIds.current.has(r.id));

                    if (hasNewReq) {
                        // Check if ANY of the new requests are assigned to ME
                        const myRequest = newReqs.find(r =>
                            r.status === 'PENDING' &&
                            !seenRequestIds.current.has(r.id) &&
                            r.assignedToUserId === (user as any)?.id // user token usually has id
                        );

                        if (myRequest) {
                            playNotification(`Table ${myRequest.tableNo} is calling YOU!`);
                            // Force sound playback for targeted request
                            if (audioRef.current) {
                                audioRef.current.currentTime = 0;
                                audioRef.current.play().catch(e => console.error(e));
                            }
                        } else {
                            // Generic notification for others (optional to silence or keep)
                            if (user?.role === 'ADMIN') return; // Silence admin
                            playNotification();
                        }
                    }
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

        // Location Tracking for Smart Waiter (every 2 mins)
        const trackLocation = () => {
            if (user?.role === 'STAFF' && "geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    try {
                        await fetch('/api/staff/location', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                lat: pos.coords.latitude,
                                lng: pos.coords.longitude
                            })
                        })
                    } catch (e) { console.error("Loc update failed", e) }
                });
            }
        };
        trackLocation(); // Initial
        const locInterval = setInterval(trackLocation, 120000);

        return () => {
            clearInterval(interval)
            clearInterval(locInterval)
        }
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
    const readyOrders = orders.filter(o => o.status === "READY")
    const uncompletedRequests = requests.filter(r => r.status === 'PENDING');

    return (
        <div className="min-h-screen bg-muted/40 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">
                        {user?.displayName ? `${user.displayName}'s Dashboard` : (settings?.cafeName ? `${settings.cafeName} ${user?.role === 'ADMIN' ? 'Admin' : 'Staff'}` : (user?.role === 'COUNTER' ? 'Counter Dashboard' : (user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Staff Dashboard')))}
                    </h1>
                    <p className="text-muted-foreground text-sm truncate">
                        {user?.role === 'COUNTER' ? 'Manage payments and view orders' : `Manage ${settings?.cafeName || 'Cafe'} orders and service requests`}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <div className="flex items-center gap-2">
                        {user?.role === 'ADMIN' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/dashboard/staff')}
                                className="h-9 gap-2"
                            >
                                <ChefHat className="h-4 w-4" />
                                <span className="hidden lg:inline">Staff</span>
                            </Button>
                        )}
                        <ChangePasswordModal />
                        <ThemeToggle />
                    </div>
                    <div className="flex items-center gap-2 border-l pl-2 border-muted-foreground/20">
                        {user?.role !== 'ADMIN' && (
                            <Button variant="outline" size="icon" onClick={testSound} title="Test Notification Sound" className="h-9 w-9 bg-background">
                                <Volume2 className="h-4 w-4" />
                            </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-9 gap-2 bg-background">
                            <Bell className="h-4 w-4" />
                            <Badge variant="destructive" className="h-5 min-w-[20px] px-1 rounded-full">{uncompletedRequests.length}</Badge>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
                            <LogOut className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="orders" className="w-full">
                <TabsList className="flex w-full overflow-x-auto h-auto gap-2 bg-transparent p-0 justify-start mb-6 no-scrollbar pb-1">
                    <TabsTrigger value="orders" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">Orders</TabsTrigger>
                    {user?.role !== 'COUNTER' && (
                        <TabsTrigger value="requests" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background">
                            Requests
                            {uncompletedRequests.length > 0 && (
                                <span className="ml-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
                            )}
                        </TabsTrigger>
                    )}
                    {user?.role === 'ADMIN' && (
                        <>
                            <TabsTrigger value="reviews" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background text-xs sm:text-sm">Reviews</TabsTrigger>
                            <TabsTrigger value="menu" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background text-xs sm:text-sm">Menu</TabsTrigger>
                            <TabsTrigger value="stats" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background text-xs sm:text-sm">Sales</TabsTrigger>
                            <TabsTrigger value="devices" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background text-xs sm:text-sm">Devices</TabsTrigger>
                            <TabsTrigger value="settings" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background text-xs sm:text-sm">Settings</TabsTrigger>
                        </>
                    )}
                    {user?.role !== 'COUNTER' && (
                        <TabsTrigger value="tables" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background text-xs sm:text-sm">Tables</TabsTrigger>
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

                        {/* Ready to Serve Column (Replaces Preparing focus for Waiter) */}
                        {user?.role !== 'COUNTER' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <ChefHat className="h-5 w-5 text-blue-500" /> {user?.role === 'ADMIN' ? 'Prep / Ready' : 'Ready to Serve'}
                                    </h2>
                                    <Badge variant="secondary">{readyOrders.length + (user?.role === 'ADMIN' ? preparingOrders.length : 0)}</Badge>
                                </div>
                                {/* Admin sees preparing, Waiter only sees READY usually, but let's show both but different actions */}
                                {user?.role === 'ADMIN' && preparingOrders.map(order => (
                                    <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} role={user?.role} />
                                ))}
                                {readyOrders.map(order => (
                                    <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} role={user?.role} />
                                ))}
                            </div>
                        )}

                        {/* Completed/Served Column - Primary focus for Counter */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" /> Served {user?.role === 'COUNTER' ? '/ To Pay' : ''}
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

                                    {/* Smart Waiter Assignment Info */}
                                    {req.assignedToUserId && (
                                        <p className="text-xs text-muted-foreground mt-2 text-center">
                                            {req.assignedToUserId === (user as any)?.id ?
                                                <span className="text-green-600 font-bold">Assigned to YOU</span> :
                                                `Assigned to Staff`
                                            }
                                        </p>
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
                <TabsContent value="devices">
                    <div className="mt-4">
                        <DeviceManager />
                    </div>
                </TabsContent>
                <TabsContent value="settings">
                    <div className="mt-4">
                        <SettingsManager />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

// Utility for styles
// import { cn } from "@/lib/utils" removed
