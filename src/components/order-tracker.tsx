"use client"

import { useEffect, useRef } from "react"
import { useCartStore } from "@/lib/store"
import { toast } from "sonner"
import type { Order } from "@/lib/types"

export function OrderTracker() {
    const { myOrderIds } = useCartStore()
    const previousStatuses = useRef<Record<string, string>>({})

    useEffect(() => {
        if (myOrderIds.length === 0) return

        const checkStatus = async () => {
            try {
                const res = await fetch('/api/orders', { cache: 'no-store' })
                if (!res.ok) return
                const allOrders = (await res.json()) as Order[]

                console.log("OrderTracker: Fetched orders", allOrders.length);
                console.log("OrderTracker: My IDs", myOrderIds);

                const myOrders = allOrders.filter((o) => myOrderIds.includes(o.id))
                console.log("OrderTracker: My Matched Orders", myOrders);

                // Check for Auto-Logout Condition (ALL orders PAID)
                if (myOrders.length > 0) {
                    const allPaid = myOrders.every(o => o.paymentStatus === 'PAID');

                    if (allPaid) {
                        const alreadyTriggered = sessionStorage.getItem('logout_triggered');
                        if (!alreadyTriggered) {
                            sessionStorage.setItem('logout_triggered', 'true');
                            toast.success("Payment Received! 🎉", {
                                description: "Thank you for visiting! You will be redirected shortly.",
                                duration: 5000
                            });

                            setTimeout(async () => {
                                try {
                                    await fetch('/api/logout', { method: 'POST' });
                                    useCartStore.getState().clearCart(); // Clear client store
                                    // Remove the flag so next visit is clean
                                    sessionStorage.removeItem('logout_triggered');
                                    window.location.href = '/thank-you';
                                } catch (e) {
                                    console.error("Logout failed", e);
                                    window.location.href = '/thank-you';
                                }
                            }, 4000); // 4 seconds delay
                        }
                    }
                }

                myOrders.forEach((order) => {
                    const prevStatus = previousStatuses.current[order.id]

                    if (prevStatus && prevStatus !== order.status) {
                        if (order.status === "PREPARING") {
                            toast.info("Cooking Started! 🍳", {
                                description: `They are preparing your delicious food for table ${order.tableNo}.`
                            })
                        } else if (order.status === "SERVED") {
                            toast.success("Order Served! 🍽️", {
                                description: "Enjoy your meal!"
                            })
                        }
                    }
                    previousStatuses.current[order.id] = order.status
                })

            } catch (error) {
                console.error("Polling error", error)
            }
        }

        checkStatus()
        const interval = setInterval(checkStatus, 5000)
        return () => clearInterval(interval)
    }, [myOrderIds])

    return null
}
