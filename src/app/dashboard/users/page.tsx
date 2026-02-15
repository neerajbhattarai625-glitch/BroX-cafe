"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { RefreshCw, User, Key, UserCog } from "lucide-react"
import { UpdateUsernameModal } from "@/components/update-username-modal"

interface SystemUser {
    id: string
    username: string
    role: string
    displayName?: string | null
    createdAt: string
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<SystemUser[]>([])
    const [loading, setLoading] = useState(true)
    const [resetting, setResetting] = useState<string | null>(null)

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            toast.error("Failed to fetch users")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

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

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <User className="h-8 w-8" />
                    User Management
                </h1>
                <p className="text-muted-foreground mt-2">Manage user accounts, display names, and reset passwords</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5" />
                        System Users
                    </CardTitle>
                    <CardDescription>
                        Manage system accounts and their display profiles
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No users found in database</p>
                            <p className="text-xs mt-1">Make sure some staff or admin users have logged in at least once.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{user.displayName || user.username}</p>
                                                {user.displayName && (
                                                    <span className="text-[10px] bg-muted px-1 rounded uppercase">@{user.username}</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{user.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UpdateUsernameModal
                                            userId={user.id}
                                            currentUsername={user.username}
                                            currentDisplayName={user.displayName}
                                            onSuccess={fetchUsers}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleResetPassword(user.username)}
                                            disabled={resetting === user.username}
                                            className="gap-2"
                                        >
                                            <Key className={`h-4 w-4 ${resetting === user.username ? 'animate-spin' : ''}`} />
                                            <span className="hidden sm:inline">Reset</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">ℹ️ How it works</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Only Admins can change or set the **Display Name** for any user.</li>
                    <li>Display names are used throughout the app for identification.</li>
                    <li>The **Username** remains fixed and is used for login.</li>
                    <li>Passwords can be reset to default values if a user forgets theirs.</li>
                </ul>
            </div>
        </div>
    )
}
