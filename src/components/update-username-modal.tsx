"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { UserCog } from "lucide-react"

interface UpdateUsernameModalProps {
    userId: string
    currentUsername: string
    currentDisplayName?: string | null
    onSuccess?: () => void
}

export function UpdateUsernameModal({ userId, currentUsername, currentDisplayName, onSuccess }: UpdateUsernameModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState(currentUsername)
    const [displayName, setDisplayName] = useState(currentDisplayName || currentUsername)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!username.trim()) {
            toast.error("Username cannot be empty")
            return
        }

        if (!displayName.trim()) {
            toast.error("Display name cannot be empty")
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/admin/update-username', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    username: username.trim(),
                    displayName: displayName.trim()
                })
            })

            const data = await res.json()

            if (res.ok) {
                toast.success("User updated successfully!")
                setOpen(false)
                onSuccess?.()
            } else {
                toast.error(data.error || "Failed to update user")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <UserCog className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit User</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5" />
                        Manage User Account
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username (Login ID)</Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter login username"
                            required
                        />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">This is used for logging into the dashboard</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name (Public)</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            placeholder="Enter display name"
                        />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">This name appears in headers and order lists</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? "Updating..." : "Update Name"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
