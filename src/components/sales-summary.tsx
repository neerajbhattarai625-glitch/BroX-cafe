"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, TrendingUp, Calendar } from "lucide-react"

export function SalesSummary() {
    const [stats, setStats] = useState<{
        daily: { total: number, count: number },
        monthly: { total: number, count: number }
    } | null>(null)

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error(err))
    }, [])

    if (!stats) return <div className="p-4">Loading stats...</div>

    return (
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

            {/* Optional: Add more cards if needed */}
        </div>
    )
}
