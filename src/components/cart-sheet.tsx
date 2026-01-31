"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react"
import { useCartStore } from "@/lib/store"

export function CartSheet() {
    const { items, removeItem, increaseQuantity, decreaseQuantity, total, clearCart, addOrderId } = useCartStore()
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handlePlaceOrder = async () => {
        setIsSubmitting(true)
        const tableNo = (document.getElementById('table') as HTMLInputElement)?.value || "5"

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tableNo,
                    items: items.map(i => ({ name: i.name, qty: i.quantity })),
                    total: Math.round(total() * 1.1 * 1.13)
                })
            })

            if (res.ok) {
                const data = await res.json()
                addOrderId(data.id) // Track this order
                clearCart()
            }
        } catch (error) {
            console.error("Failed to place order", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-in zoom-in">
                            {itemCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Your Order</SheetTitle>
                    <SheetDescription>
                        Review your items before placing the order.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    {items.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Your cart is empty.</p>
                    )}
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="font-medium">{item.name}</span>
                                <span className="text-sm text-muted-foreground">Rs. {item.price} x {item.quantity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => decreaseQuantity(item.id)}>
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-bold w-4 text-center">{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => increaseQuantity(item.id)}>
                                    <Plus className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive ml-2" onClick={() => removeItem(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Separator />
                    <Separator />
                    <div className="space-y-1.5 pt-4">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>Rs. {total()}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>Service Charge (10%)</span>
                            <span>Rs. {Math.round(total() * 0.1)}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>VAT (13%)</span>
                            <span>Rs. {Math.round((total() + total() * 0.1) * 0.13)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between text-lg font-bold">
                            <span>Grand Total</span>
                            <span>Rs. {Math.round(total() * 1.1 * 1.13)}</span>
                        </div>
                    </div>
                </div>
                <SheetFooter>
                    <div className="w-full flex flex-col gap-2">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="table" className="text-right">
                                Table
                            </Label>
                            <Input id="table" defaultValue="5" className="col-span-3" />
                        </div>
                        <SheetClose asChild>
                            <Button type="submit" className="w-full mt-2" disabled={items.length === 0 || isSubmitting} onClick={handlePlaceOrder}>
                                {isSubmitting ? "Placing Order..." : "Place Order"}
                            </Button>
                        </SheetClose>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
