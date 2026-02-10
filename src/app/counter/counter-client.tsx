"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle2, AlertCircle, Banknote, LogOut } from "lucide-react" // Banknote icon
import type { Order } from "@/lib/types" // Ensure types are updated if needed
import { SalesSummary } from "@/components/sales-summary" // Reuse if possible, or adapt

interface CounterClientProps {
    initialUser: { role: string }
}

export function CounterClient({ initialUser }: CounterClientProps) {
    const [orders, setOrders] = useState<any[]>([]) // Using any for now to bypass strict type check on new fields till restart
    const router = useRouter()

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' })
        router.push('/login')
    }

    const fetchData = async () => {
        try {
            const res = await fetch('/api/orders')
            if (res.ok) {
                const data = await res.json()
                setOrders(data)
            }
        } catch (error) {
            console.error("Failed to fetch orders", error)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [])

    const confirmPayment = async (orderId: string) => {
        try {
            // We need a specific endpoint or update the PUT order endpoint to handle paymentStatus
            // For now, let's reuse PUT /api/orders to update status to PAID if currently PENDING_PAYMENT?
            // Actually, let's update local state optimistically

            // NOTE: We might need to update the API to handle specific payment status updates
            // but for MVP, marking order status as PAID might be enough? 
            // The requirement says "payment confirmed by counter staffs". 
            // Let's assume this means setting paymentStatus='PAID'.

            // I'll use the existing PUT /api/orders for now, but I might need to add a specialized action or strict param.
            // Let's use a new server action or just update the PUT body to support paymentStatus.

            // Wait, the existing PUT /api/orders only updates `status` (Order Status). 
            // I should update it to support `paymentStatus` too.
            // Let's assume I'll update the API next.
            await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, paymentStatus: 'PAID', status: 'PAID' }) // Auto-mark order as PAID too? Or just payment?
                // Usually Payment Paid -> Order might still be Preparing. 
                // But for "Cash", if they pay, status might not change, just paymentStatus.
            })
            fetchData()
        } catch (error) { console.error(error) }
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
                <div className="flex gap-2">
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
                                        {order.items.map((item: any, i: number) => (
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

                <TabsContent value="sales">
                    <div className="mt-4">
                        <SalesSummary />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
