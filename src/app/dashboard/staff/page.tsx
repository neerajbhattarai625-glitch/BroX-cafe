"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
    ChefHat, Users, Banknote, ShieldCheck, RefreshCw,
    Key, User, Eye, Activity, Clock, UserCog
} from "lucide-react"
import { UpdateUsernameModal } from "@/components/update-username-modal"
import type { Order, ServiceRequest } from "@/lib/types"

interface SystemUser {
    id: string
    username: string
    role: string
    displayName?: string | null
    createdAt: string
    dashboard?: string
}

export default function AdminStaffPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [requests, setRequests] = useState<ServiceRequest[]>([])
    const [users, setUsers] = useState<SystemUser[]>([])
    const [resetting, setResetting] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [])

    const fetchData = async () => {
        try {
            const [ordersRes, requestsRes, usersRes] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/requests'),
                fetch('/api/admin/users')
            ])
            const ordersData = await ordersRes.json()
            const requestsData = await requestsRes.json()
            const usersData = await usersRes.json()

            // Map dashboards to users based on role
            const mappedUsers = usersData.map((u: any) => ({
                ...u,
                dashboard: u.role === 'ADMIN' ? '/dashboard' :
                    u.role === 'CHEF' ? '/chef' :
                        u.role === 'COUNTER' ? '/counter' : '/staff'
            }))

            setOrders(ordersData)
            setRequests(requestsData)
            setUsers(mappedUsers)
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (username: string) => {
        setResetting(username)
        try {
            const res = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            })

            const data = await res.json()

            if (res.ok) {
                toast.success(`Password reset for ${username}`, {
                    description: `New password: ${data.defaultPassword}`
                })
            } else {
                toast.error(data.error || "Failed to reset password")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setResetting(null)
        }
    }

    const handleViewDashboard = (dashboard: string) => {
        window.open(dashboard, '_blank')
    }

    // Calculate stats for each role/user
    const getStaffStats = (role: string) => {
        let activeOrders = 0
        let activeRequests = 0

        if (role === 'CHEF' || role === 'STAFF') {
            activeOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING').length
            activeRequests = requests.filter(r => r.status === 'PENDING' && r.type === 'VOICE_ORDER').length
        } else if (role === 'COUNTER') {
            activeOrders = orders.filter(o => o.paymentStatus === 'PENDING').length
            activeRequests = requests.filter(r => r.status === 'PENDING' && r.type === 'VOICE_ORDER').length
        }

        return { activeOrders, activeRequests }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 md:h-8 md:w-8" />
                        Staff Management
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Monitor dashboards and manage user accounts</p>
                </div>
                <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm" className="w-fit">
                    Back to Dashboard
                </Button>
            </div>

            <Tabs defaultValue="monitor" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="monitor" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Staff Monitoring
                    </TabsTrigger>
                    <TabsTrigger value="passwords" className="gap-2">
                        <Key className="h-4 w-4" />
                        Password Management
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="monitor" className="space-y-4 mt-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {users.filter(u => u.role !== 'ADMIN').map((user) => {
                                const stats = getStaffStats(user.role)
                                return (
                                    <Card key={user.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${user.role === 'CHEF' ? 'bg-orange-100' :
                                                        user.role === 'STAFF' ? 'bg-blue-100' :
                                                            'bg-green-100'
                                                        }`}>
                                                        {user.role === 'CHEF' ? <ChefHat className="h-6 w-6 text-orange-600" /> :
                                                            user.role === 'STAFF' ? <Users className="h-6 w-6 text-blue-600" /> :
                                                                <Banknote className="h-6 w-6 text-green-600" />}
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg">{user.displayName || user.username}</CardTitle>
                                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{user.role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-muted/50 p-3 rounded-lg">
                                                    <p className="text-xs text-muted-foreground">Active Orders</p>
                                                    <p className="text-2xl font-bold">{stats.activeOrders}</p>
                                                </div>
                                                <div className="bg-muted/50 p-3 rounded-lg">
                                                    <p className="text-xs text-muted-foreground">Requests</p>
                                                    <p className="text-2xl font-bold">{stats.activeRequests}</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleViewDashboard(user.dashboard || '/')}
                                                className="w-full gap-2"
                                                variant="outline"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View {user.role} Dashboard
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Real-Time Activity Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase font-bold">Pending</p>
                                    <p className="text-2xl md:text-3xl font-bold text-orange-600">
                                        {orders.filter(o => o.status === 'PENDING').length}
                                    </p>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase font-bold">Preparing</p>
                                    <p className="text-2xl md:text-3xl font-bold text-blue-600">
                                        {orders.filter(o => o.status === 'PREPARING').length}
                                    </p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase font-bold">Requests</p>
                                    <p className="text-2xl md:text-3xl font-bold text-green-600">
                                        {requests.filter(r => r.status === 'PENDING').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="passwords" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Reset User Passwords
                            </CardTitle>
                            <CardDescription>
                                Reset any user's password to their default value
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold truncate">{user.displayName || user.username}</p>
                                                    <p className="text-sm text-muted-foreground">{user.role}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                <code className="text-[10px] bg-muted px-2 py-1 rounded uppercase font-bold">
                                                    @{user.username}
                                                </code>
                                                <div className="flex items-center gap-2">
                                                    <UpdateUsernameModal
                                                        userId={user.id}
                                                        currentUsername={user.username}
                                                        currentDisplayName={user.displayName}
                                                        onSuccess={fetchData}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleResetPassword(user.username)}
                                                        disabled={resetting === user.username}
                                                        className="h-9 px-3 gap-2"
                                                    >
                                                        <RefreshCw className={`h-4 w-4 ${resetting === user.username ? 'animate-spin' : ''}`} />
                                                        <span className="hidden xs:inline">Reset</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-muted/50 rounded-lg">
                        <h3 className="font-semibold mb-2">ℹ️ How it works</h3>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Click "Reset Password" to restore a user's password to the default</li>
                            <li>Users can change their password from their dashboard settings</li>
                            <li>Default passwords depend on the initial setup (e.g., admin123, chef123)</li>
                        </ul>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
