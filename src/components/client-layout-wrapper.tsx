"use client";

import { usePathname } from "next/navigation";
import { OrderTracker } from "@/components/order-tracker";
import { SmoothScroller } from "@/components/smooth-scroller";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
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
