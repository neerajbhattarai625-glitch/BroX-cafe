"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { UserPlus, ShieldAlert } from "lucide-react"

export function CreateUserModal({ onSuccess }: { onSuccess?: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        displayName: "",
        role: "STAFF"
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (res.ok) {
                toast.success("User created successfully")
                setOpen(false)
                setFormData({ username: "", password: "", displayName: "", role: "STAFF" })
                onSuccess?.()
            } else {
                toast.error(data.error || "Failed to create user")
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
                <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add New User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Create Staff Account
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="STAFF">Floor Staff / Waiter</option>
                            <option value="CHEF">Chef / Kitchen</option>
                            <option value="COUNTER">Counter / Billing</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Username (Login ID)</Label>
                        <Input
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="e.g. rahul_chef"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Set initial password"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Display Name</Label>
                        <Input
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            placeholder="e.g. Rahul Sharma"
                        />
                    </div>

                    <div className="bg-muted/50 p-3 rounded-lg flex gap-3 items-start">
                        <ShieldAlert className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-tight">
                            Make sure to share the username and password with the staff member. They can change their password later from their dashboard.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? "Creating..." : "Create Account"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
