"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { RefreshCw, User, Key } from "lucide-react"

const USERS = [
    { username: 'admin', role: 'ADMIN', defaultPassword: 'admin123' },
    { username: 'staff', role: 'STAFF', defaultPassword: 'staff123' },
    { username: 'chef', role: 'STAFF', defaultPassword: 'chef123' },
    { username: 'counter', role: 'COUNTER', defaultPassword: 'counter123' }
]

export default function UserManagementPage() {
    const [resetting, setResetting] = useState<string | null>(null)

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
                <p className="text-muted-foreground mt-2">Manage user accounts and reset passwords</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Reset User Passwords
                    </CardTitle>
                    <CardDescription>
                        Reset any user's password to their default value
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {USERS.map((user) => (
                            <div
                                key={user.username}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{user.username}</p>
                                        <p className="text-sm text-muted-foreground">{user.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        Default: {user.defaultPassword}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleResetPassword(user.username)}
                                        disabled={resetting === user.username}
                                        className="gap-2"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${resetting === user.username ? 'animate-spin' : ''}`} />
                                        {resetting === user.username ? 'Resetting...' : 'Reset Password'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">ℹ️ How it works</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Click "Reset Password" to restore a user's password to the default</li>
                    <li>Users can change their password from their dashboard settings</li>
                    <li>Default passwords are shown above for reference</li>
                </ul>
            </div>
        </div>
    )
}
