
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, Medal, MapPin, Wallet, Gift, Star } from "lucide-react"

export function UserProfile({ text = "My Points" }: { text?: string }) {
    const [deviceId, setDeviceId] = useState<string | null>(null)
    const [stats, setStats] = useState<any>(null)
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
            const res = await fetch(`/api/gamification?deviceId=${deviceId}`)
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // Determine Progress to next 10,000 RS
    const currentSpend = stats?.stats?.totalSpend || 0
    const nextMilestone = Math.ceil((currentSpend + 1) / 10000) * 10000
    const progress = ((currentSpend % 10000) / 10000) * 100
    const rewardsEarned = Math.floor(currentSpend / 10000)

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
            <DialogContent className="max-w-md w-[95%] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        Your Achievements
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Main Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex flex-col items-center justify-center text-center">
                            <MapPin className="h-6 w-6 text-blue-500 mb-2" />
                            <span className="text-2xl font-bold text-neutral-800">{stats?.stats?.totalVisits || 0}</span>
                            <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Visits</span>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex flex-col items-center justify-center text-center">
                            <Wallet className="h-6 w-6 text-green-600 mb-2" />
                            <span className="text-2xl font-bold text-neutral-800">Rs. {stats?.stats?.totalSpend?.toLocaleString() || 0}</span>
                            <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Total Spent</span>
                        </div>
                    </div>

                    {/* Reward Progress */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-orange-800 flex items-center gap-2">
                                <Gift className="h-4 w-4" /> Free Momo Progress
                            </h4>
                            <span className="text-xs font-bold text-orange-600">
                                {currentSpend % 10000} / 10,000
                            </span>
                        </div>
                        <Progress value={progress} className="h-3 bg-orange-200" />
                        <p className="text-xs text-orange-700 mt-2 leading-relaxed">
                            Start of the art gamification system! You get <strong>1 Free Plate Momo</strong> for every Rs. 10,000 spent.
                            <br />
                            You have earned: <span className="font-bold bg-white px-1.5 py-0.5 rounded text-orange-600">{rewardsEarned} Plates</span>
                        </p>
                    </div>

                    {/* Badges (Placeholder Logic) */}
                    <div>
                        <h4 className="font-bold text-neutral-800 mb-3 flex items-center gap-2">
                            <Medal className="h-4 w-4 text-purple-600" /> Badges
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                            {/* Logic to show badges based on stats */}
                            <BadgeItem icon={<Star />} label="Newbie" active={true} />
                            <BadgeItem icon={<MapPin />} label="Regular" active={(stats?.stats?.totalVisits || 0) > 5} />
                            <BadgeItem icon={<Wallet />} label="Big Spender" active={(stats?.stats?.totalSpend || 0) > 5000} />
                            <BadgeItem icon={<Trophy />} label="Momo Master" active={(stats?.stats?.totalSpend || 0) > 20000} />
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
