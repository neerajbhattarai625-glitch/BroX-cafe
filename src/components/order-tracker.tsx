"use client"

import { useEffect, useRef } from "react"
import { useCartStore } from "@/lib/store"
import { toast } from "sonner"

export function OrderTracker() {
    const { myOrderIds } = useCartStore()
    const previousStatuses = useRef<Record<string, string>>({})

    useEffect(() => {
        if (myOrderIds.length === 0) return

        const checkStatus = async () => {
            try {
                const res = await fetch('/api/orders')
                if (!res.ok) return
                const orders = await res.json()

                const myOrders = orders.filter((o: any) => myOrderIds.includes(o.id))

                myOrders.forEach((order: any) => {
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
