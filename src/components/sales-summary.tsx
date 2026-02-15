"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, TrendingUp, Calendar } from "lucide-react"

export function SalesSummary() {
    const [stats, setStats] = useState<{
        daily: { total: number, count: number },
        monthly: { total: number, count: number },
        tableStats: { tableNo: string, bookings: number, revenue: number }[]
    } | null>(null)

    useEffect(() => {
        fetch('/api/stats')
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch")
                return res.json()
            })
            .then(data => {
                if (data.daily && data.monthly) {
                    setStats(data)
                } else {
                    console.error("Invalid stats data:", data)
                }
            })
            .catch(err => console.error(err))
    }, [])

    if (!stats) return <div className="p-4">Loading stats...</div>

    // Sort for charts
    const mostBooked = [...(stats.tableStats || [])].sort((a, b) => b.bookings - a.bookings).slice(0, 5);
    const highestRevenue = [...(stats.tableStats || [])].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const maxBookings = Math.max(...mostBooked.map(t => t.bookings), 1);
    const maxRevenue = Math.max(...highestRevenue.map(t => t.revenue), 1);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs. {stats.daily.total}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.daily.count} orders today
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs. {stats.monthly.total}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.monthly.count} orders this month
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Most Popular Tables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mostBooked.map((t, i) => (
                                <div key={t.tableNo} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">Table {t.tableNo}</span>
                                        <span className="text-muted-foreground">{t.bookings} bookings</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${(t.bookings / maxBookings) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {mostBooked.length === 0 && <p className="text-sm text-muted-foreground">No data available</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Highest Revenue Tables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {highestRevenue.map((t, i) => (
                                <div key={t.tableNo} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">Table {t.tableNo}</span>
                                        <span className="text-muted-foreground">Rs. {t.revenue}</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full"
                                            style={{ width: `${(t.revenue / maxRevenue) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {highestRevenue.length === 0 && <p className="text-sm text-muted-foreground">No data available</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
