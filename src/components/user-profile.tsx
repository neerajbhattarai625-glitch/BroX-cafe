
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, Medal, MapPin, Wallet, Gift, Star } from "lucide-react"

export function UserProfile({ text = "My Points" }: { text?: string }) {
    const [deviceId, setDeviceId] = useState<string | null>(null)
    const [stats, setStats] = useState<any>(null)
    const [settings, setSettings] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        // Get or Create Device ID
        let id = localStorage.getItem("cafe_device_id")
        if (!id) {
            id = crypto.randomUUID()
            localStorage.setItem("cafe_device_id", id)
        }
        setDeviceId(id)

        // Track Visit
        fetch('/api/gamification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: id })
        }).catch(e => console.error("Visit tracking failed", e))
    }, [])

    const fetchStats = async () => {
        if (!deviceId) return
        setLoading(true)
        try {
            const [sRes, setRes] = await Promise.all([
                fetch(`/api/gamification?deviceId=${deviceId}`),
                fetch('/api/settings')
            ])
            const sData = await sRes.json()
            const setData = await setRes.json()
            setStats(sData)
            setSettings(setData)
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setLoading(false)
        }
    }

    // Determine Progress to next milestones
    const currentSpend = stats?.stats?.totalSpend || 0
    const currentPoints = stats?.stats?.totalPoints || 0
    const milestoneTarget = settings?.achievementMilestoneTarget || 10000
    const nextMilestone = Math.ceil((currentSpend + 1) / milestoneTarget) * milestoneTarget
    const progress = ((currentSpend % milestoneTarget) / milestoneTarget) * 100
    const rewardsEarned = Math.floor(currentSpend / milestoneTarget)

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (val) fetchStats()
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full gap-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
                    <Trophy className="h-4 w-4" />
                    {text}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95%] rounded-2xl overflow-hidden p-0">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl text-white">
                            <Trophy className="h-8 w-8 text-yellow-300 drop-shadow-sm" />
                            {settings?.achievementTitle || "Your Achievements"}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Your points, tier, and reward progress.
                        </DialogDescription>
                    </DialogHeader>
                    <p className="text-orange-50 text-sm mt-2 leading-relaxed opacity-90">
                        {settings?.achievementDescription || "Start of the art gamification system! You get points for every Rs. spent."}
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Main Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex flex-col items-center justify-center text-center">
                            <MapPin className="h-6 w-6 text-blue-500 mb-2" />
                            <span className="text-2xl font-bold text-neutral-800">{stats?.stats?.totalVisits || 0}</span>
                            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Visits</span>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex flex-col items-center justify-center text-center">
                            <Star className="h-6 w-6 text-purple-600 mb-2" />
                            <span className="text-2xl font-bold text-neutral-800">{currentPoints.toLocaleString()}</span>
                            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Points</span>
                        </div>
                    </div>

                    {/* Reward Progress */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-2 relative z-10">
                            <h4 className="font-bold text-orange-800 flex items-center gap-2">
                                <Gift className="h-4 w-4" /> {settings?.achievementMilestoneText || "Free Momo Progress"}
                            </h4>
                            <span className="text-xs font-bold text-orange-600">
                                Rs. {Math.round(currentSpend % milestoneTarget).toLocaleString()} / {milestoneTarget.toLocaleString()}
                            </span>
                        </div>
                        <Progress value={progress} className="h-3 bg-orange-200 relative z-10" />
                        <p className="text-xs text-orange-700 mt-2 leading-relaxed relative z-10">
                            You have earned: <span className="font-bold bg-white px-1.5 py-0.5 rounded text-orange-600">
                                {rewardsEarned} Rewards
                            </span>
                        </p>
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                            <Gift className="h-16 w-16 text-orange-600" />
                        </div>
                    </div>

                    {/* Tier Icon & Badge */}
                    <div className="flex items-center gap-4 p-4 bg-neutral-900 text-white rounded-xl">
                        <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                            {stats?.stats?.tier === 'BRONZE' ? '🥉' :
                                stats?.stats?.tier === 'SILVER' ? '🥈' :
                                    stats?.stats?.tier === 'GOLD' ? '🥇' :
                                        stats?.stats?.tier === 'PLATINUM' ? '💎' :
                                            stats?.stats?.tier === 'DIAMOND' ? '👑' :
                                                stats?.stats?.tier === 'RUBY' ? '🎯' : '🎋'}
                        </div>
                        <div>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-tighter">Current Rank</p>
                            <h3 className="text-xl font-bold tracking-tight text-white">{stats?.stats?.tier || 'BRONZE'}</h3>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function BadgeItem({ icon, label, active }: any) {
    return (
        <div className={`flex flex-col items-center p-2 rounded-lg border transition-all ${active ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-neutral-50 border-neutral-100 text-neutral-300 grayscale'}`}>
            <div className={`h-8 w-8 flex items-center justify-center rounded-full mb-1 ${active ? 'bg-white shadow-sm' : 'bg-neutral-100'}`}>
                {icon}
            </div>
            <span className="text-[10px] font-bold text-center leading-tight">{label}</span>
        </div>
    )
}
