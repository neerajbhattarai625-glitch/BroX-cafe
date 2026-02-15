"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { RestaurantMenu } from "@/components/restaurant-menu";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateDeviceId } from "@/lib/device-fingerprint";

export default function TablePage({ params }: { params: Promise<{ id: string }> }) {
    // Directly unwrap params with `use()` hook as per Next.js 15+ convention for async params
    const { id } = use(params);

    const router = useRouter();
    const { setTableNo, tableNo, clearCart } = useCartStore();

    const [verifying, setVerifying] = useState(true);
    const [blocked, setBlocked] = useState<string | null>(null);
    const initialized = useState({ current: false })[0];

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' });
        setTableNo(null);
        clearCart();
        router.replace('/');
    };

    useEffect(() => {
        const checkSession = async () => {
            if (initialized.current) return;
            initialized.current = true;

            if (id) {
                // Attempt Login
                try {
                    const deviceId = getOrCreateDeviceId();
                    const res = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tableId: id, deviceId })
                    });

                    let errorData: any = {};
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.table) {
                            setTableNo(data.table.number);
                            setVerifying(false);
                            return;
                        }
                        errorData = data;
                    } else {
                        errorData = await res.json().catch(() => ({}));
                    }

                    if (errorData.code === 'TABLE_IN_USE') {
                        setBlocked("This table is currently in use by another device. Please wait or contact staff.");
                    } else if (errorData.code === 'DEVICE_ALREADY_IN_SESSION') {
                        setBlocked(errorData.error);
                    } else {
                        // Check if we ALREADY have a valid session for THIS table (fallback)
                        const vRes = await fetch('/api/login');
                        const vData = await vRes.json();

                        if (vData.success && vData.table && vData.table.id === id) {
                            setTableNo(vData.table.number);
                        } else {
                            setBlocked(errorData.error || "Invalid Table or Session Expired.");
                        }
                    }
                    setVerifying(false);
                } catch (e) {
                    console.error("Login Check Failed", e);
                    setBlocked("Connection Error. Please try again.");
                    setVerifying(false);
                }
            }
        };

        checkSession();
    }, [id, router, setTableNo, initialized, clearCart]);

    if (blocked) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                <div className="bg-destructive/10 p-6 rounded-full mb-6">
                    <Lock className="w-12 h-12 text-destructive" />
                </div>
                <h2 className="text-3xl font-bold mb-3 text-destructive">Access Denied</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
                    {blocked}
                </p>
                <Button onClick={() => window.location.href = '/'} variant="outline" className="min-w-[140px]">
                    Return Home
                </Button>
            </div>
        );
    }

    if (verifying) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground animate-pulse">Connecting to Table...</p>
            </div>
        );
    }

    return <RestaurantMenu tableNo={tableNo} onLogout={handleLogout} />;
}
