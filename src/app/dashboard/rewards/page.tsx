
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Gift, Plus, Trash2, Edit } from "lucide-react"

export default function RewardsPage() {
    const [rewards, setRewards] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [newReward, setNewReward] = useState({ name: '', cost: 10000, description: '' })
    const [isOpen, setIsOpen] = useState(false)

    const fetchRewards = async () => {
        try {
            const res = await fetch('/api/gamification/admin')
            if (res.ok) setRewards(await res.json())
        } catch (e) {
            toast.error("Failed to load rewards")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRewards()
    }, [])

    const handleCreate = async () => {
        try {
            const res = await fetch('/api/gamification/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReward)
            })
            if (res.ok) {
                toast.success("Reward created")
                setIsOpen(false)
                fetchRewards()
                setNewReward({ name: '', cost: 10000, description: '' })
            }
        } catch (e) {
            toast.error("Failed to create reward")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this reward?")) return;
        try {
            await fetch(`/api/gamification/admin?id=${id}`, { method: 'DELETE' })
            toast.success("Reward deleted")
            fetchRewards()
        } catch (e) { toast.error("Failed to delete") }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Gift className="h-8 w-8 text-orange-500" /> Rewards Management
                    </h1>
                    <p className="text-muted-foreground">Manage redeemable items for gamification.</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-green-600 hover:bg-green-700"><Plus className="h-4 w-4" /> Add Reward</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add New Reward</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Reward Name</Label>
                                <Input value={newReward.name} onChange={e => setNewReward({ ...newReward, name: e.target.value })} placeholder="e.g. Free Momo Plate" />
                            </div>
                            <div className="space-y-2">
                                <Label>Cost (Total Spend Required)</Label>
                                <Input type="number" value={newReward.cost} onChange={e => setNewReward({ ...newReward, cost: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={newReward.description} onChange={e => setNewReward({ ...newReward, description: e.target.value })} />
                            </div>
                            <Button className="w-full" onClick={handleCreate}>Save Reward</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reward Name</TableHead>
                            <TableHead>Cost to Unlock</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rewards.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No rewards configured.</TableCell>
                            </TableRow>
                        )}
                        {rewards.map(reward => (
                            <TableRow key={reward.id}>
                                <TableCell className="font-medium">{reward.name}</TableCell>
                                <TableCell>Rs. {reward.cost.toLocaleString()}</TableCell>
                                <TableCell>{reward.description}</TableCell>
                                <TableCell><Badge variant={reward.isActive ? 'default' : 'secondary'}>{reward.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(reward.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function Badge({ children, variant }: any) {
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${variant === 'default' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {children}
        </span>
    )
}
