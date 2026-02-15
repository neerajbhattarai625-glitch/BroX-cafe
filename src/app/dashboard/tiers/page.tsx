"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, TrendingUp, Users, ArrowLeft } from "lucide-react"
import { TIER_LEVELS, type TierLevel } from "@/lib/tier-system"

interface DeviceStats {
    id: string
    deviceId: string
    totalVisits: number
    totalSpend: number
    tier: TierLevel
    lastVisit: string
}

export default function TierManagementPage() {
    const router = useRouter()
    const [stats, setStats] = useState<DeviceStats[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/gamification/admin')
            const data = await res.json()
            setStats(data.stats || [])
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const tierCounts = stats.reduce((acc, stat) => {
        acc[stat.tier] = (acc[stat.tier] || 0) + 1
        return acc
    }, {} as Record<TierLevel, number>)

    const totalRevenue = stats.reduce((sum, stat) => sum + stat.totalSpend, 0)
    const totalVisits = stats.reduce((sum, stat) => sum + stat.totalVisits, 0)

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <Trophy className="h-6 w-6 md:h-8 md:w-8" />
                        Tier Management
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-2">
                        View and manage customer loyalty tiers
                    </p>
                </div>
                <Button onClick={() => router.push('/dashboard')} variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                </Button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Customers</CardDescription>
                        <CardTitle className="text-2xl md:text-3xl">{stats.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Visits</CardDescription>
                        <CardTitle className="text-2xl md:text-3xl">{totalVisits}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Revenue</CardDescription>
                        <CardTitle className="text-2xl md:text-3xl">₹{totalRevenue.toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Avg. Spend</CardDescription>
                        <CardTitle className="text-2xl md:text-3xl">
                            ₹{stats.length > 0 ? Math.round(totalRevenue / stats.length) : 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tier Distribution */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Tier Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {(Object.keys(TIER_LEVELS) as TierLevel[]).map((tier) => {
                            const config = TIER_LEVELS[tier]
                            const count = tierCounts[tier] || 0
                            const percentage = stats.length > 0 ? ((count / stats.length) * 100).toFixed(1) : '0'

                            return (
                                <div key={tier} className="text-center p-4 bg-muted/50 rounded-lg">
                                    <div className="text-3xl mb-2">{config.icon}</div>
                                    <div className="font-semibold" style={{ color: config.color }}>
                                        {config.name}
                                    </div>
                                    <div className="text-2xl font-bold mt-1">{count}</div>
                                    <div className="text-xs text-muted-foreground">{percentage}%</div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Tier Tabs */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
                    <TabsTrigger value="all">All ({stats.length})</TabsTrigger>
                    {(Object.keys(TIER_LEVELS) as TierLevel[]).map((tier) => (
                        <TabsTrigger key={tier} value={tier} className="gap-1">
                            <span className="hidden sm:inline">{TIER_LEVELS[tier].name}</span>
                            <span className="sm:hidden">{TIER_LEVELS[tier].icon}</span>
                            <span className="text-xs">({tierCounts[tier] || 0})</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="all">
                    <UserList users={stats} />
                </TabsContent>

                {(Object.keys(TIER_LEVELS) as TierLevel[]).map((tier) => (
                    <TabsContent key={tier} value={tier}>
                        <UserList users={stats.filter(s => s.tier === tier)} tierFilter={tier} />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}

function UserList({ users, tierFilter }: { users: DeviceStats[], tierFilter?: TierLevel }) {
    if (users.length === 0) {
        return (
            <div className="text-center p-12 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">
                    {tierFilter ? `No ${TIER_LEVELS[tierFilter].name} tier customers yet` : 'No customers yet'}
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => {
                const tierConfig = TIER_LEVELS[user.tier]
                return (
                    <Card key={user.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="text-2xl">{tierConfig.icon}</div>
                                    <div>
                                        <CardTitle className="text-sm font-mono">
                                            {user.deviceId.slice(0, 8)}...
                                        </CardTitle>
                                        <Badge
                                            variant="secondary"
                                            className="mt-1"
                                            style={{ backgroundColor: `${tierConfig.color}20`, color: tierConfig.color }}
                                        >
                                            {tierConfig.name}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-muted/50 p-2 rounded">
                                    <p className="text-xs text-muted-foreground">Visits</p>
                                    <p className="font-bold">{user.totalVisits}</p>
                                </div>
                                <div className="bg-muted/50 p-2 rounded">
                                    <p className="text-xs text-muted-foreground">Spent</p>
                                    <p className="font-bold">₹{user.totalSpend.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Last visit: {new Date(user.lastVisit).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
