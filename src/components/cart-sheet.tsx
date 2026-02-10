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
    const { items, removeItem, increaseQuantity, decreaseQuantity, total, clearCart, addOrderId, tableNo } = useCartStore()
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [paymentMethod, setPaymentMethod] = React.useState<'CASH' | 'ONLINE'>('CASH')
    const [onlineProvider, setOnlineProvider] = React.useState<string>('ESEWA')

    const handlePlaceOrder = async () => {
        if (!tableNo) return

        setIsSubmitting(true)

        // Mock Online Payment Delay
        if (paymentMethod === 'ONLINE') {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tableNo,
                    items: items.map(i => ({ name: i.name, qty: i.quantity })),
                    total: Math.round(total() * 1.1 * 1.13),
                    paymentMethod: paymentMethod === 'ONLINE' ? onlineProvider : 'CASH'
                })
            })

            if (res.ok) {
                const data = await res.json()
                addOrderId(data.id)
                clearCart()
                // Reset defaults
                setPaymentMethod('CASH')
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
                        <span className="font-bold flex items-center gap-2">
                            {tableNo ? (
                                <>
                                    {tableNo}
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                </>
                            ) : (
                                <span className="text-destructive text-xs">Not Verified</span>
                            )}
                        </span>
                    </div>

                    <div className="space-y-2 mt-2">
                        <Label>Payment Method</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('CASH')}
                                className="w-full"
                            >
                                Cash
                            </Button>
                            <Button
                                variant={paymentMethod === 'ONLINE' ? 'default' : 'outline'}
                                onClick={() => setPaymentMethod('ONLINE')}
                                className="w-full"
                            >
                                Online
                            </Button>
                        </div>
                    </div>

                    {paymentMethod === 'ONLINE' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label>Select Wallet</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {['ESEWA', 'KHALTI', 'FONEPAY'].map((provider) => (
                                    <Button
                                        key={provider}
                                        variant={onlineProvider === provider ? 'default' : 'ghost'}
                                        size="sm"
                                        className="border"
                                        onClick={() => setOnlineProvider(provider)}
                                    >
                                        {provider}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    <SheetClose asChild>
                        <Button
                            type="submit"
                            className="w-full mt-4 bg-green-600 hover:bg-green-700"
                            disabled={items.length === 0 || isSubmitting || !tableNo}
                            onClick={handlePlaceOrder}
                        >
                            {isSubmitting ? "Processing..." : (
                                paymentMethod === 'CASH' ? "Place Order (Pay Cash)" : `Pay via ${onlineProvider}`
                            )}
                        </Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
