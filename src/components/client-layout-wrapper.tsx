"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { OrderTracker } from "@/components/order-tracker";
import { SmoothScroller } from "@/components/smooth-scroller";

import { ensureDeviceCookie } from "@/lib/device-fingerprint";

import { useRouter } from "next/navigation";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        ensureDeviceCookie();

        async function checkBlocked() {
            if (pathname === '/blocked') return;
            try {
                const res = await fetch('/api/check-blocked');
                const data = await res.json();
                if (data.blocked) {
                    router.replace('/blocked');
                }
            } catch (e) {
                console.error("Block check failed", e);
            }
        }
        checkBlocked();
    }, [pathname, router]);

    const isAdminPath = pathname?.startsWith('/dashboard') || pathname?.startsWith('/counter');

    if (isAdminPath) {
        return (
            <div className="flex flex-col min-h-screen">
                {children}
            </div>
        );
    }

    return (
        <SmoothScroller>
            <OrderTracker />
            {children}
        </SmoothScroller>
    );
}
