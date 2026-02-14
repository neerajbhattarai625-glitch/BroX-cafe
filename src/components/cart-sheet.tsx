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
import { ShoppingCart, Trash2, Plus, Minus, CheckCircle2, Loader2, Lock } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const PAYMENT_LOGOS = {
    ESEWA: (
        <svg viewBox="0 0 100 100" className="w-8 h-8 shrink-0">
            <path d="M50 5 L90 50 L50 95 L10 50 Z" fill="#60bb46" />
            <path d="M30 50 L45 65 L70 35" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" />
        </svg>
    ),
    KHALTI: (
        <svg viewBox="0 0 100 100" className="w-8 h-8 shrink-0">
            <path d="M10 10 H90 V90 H10 Z" fill="#5c2d91" />
            <path d="M35 35 L65 65 M65 35 L35 65" stroke="white" strokeWidth="8" strokeLinecap="round" />
        </svg>
    ),
    FONEPAY: (
        <svg viewBox="0 0 100 100" className="w-8 h-8 shrink-0">
            <path d="M10 20 Q50 5 90 20 V80 Q50 95 10 80 Z" fill="#ed1c24" />
            <path d="M30 30 L70 70 M70 30 L30 70" stroke="white" strokeWidth="10" strokeLinecap="round" />
        </svg>
    ),
    BANKING: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
    )
}

export function CartSheet() {
    const { items, removeItem, increaseQuantity, decreaseQuantity, total, clearCart, addOrderId, tableNo } = useCartStore()
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [paymentMethod, setPaymentMethod] = React.useState<'CASH' | 'ONLINE'>('CASH')
    const [onlineProvider, setOnlineProvider] = React.useState<string>('ESEWA')
    const [isPaid, setIsPaid] = React.useState(false)
    const [isRedirecting, setIsRedirecting] = React.useState(false)

    const handlePlaceOrder = async () => {
        if (!tableNo) return

        setIsSubmitting(true)

        // Mock Online Payment Redirection Simulation
        if (paymentMethod === 'ONLINE') {
            setIsRedirecting(true)
            await new Promise(resolve => setTimeout(resolve, 2000));
            setIsRedirecting(false)
            // Wait for "Gateway" processing
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
                if (paymentMethod === 'ONLINE') {
                    setIsPaid(true)
                    setTimeout(() => {
                        clearCart()
                        setIsPaid(false)
                        setPaymentMethod('CASH')
                    }, 2000)
                } else {
                    clearCart()
                    setPaymentMethod('CASH')
                }
            }
        } catch (error) {
            console.error("Failed to place order", error)
        } finally {
            if (paymentMethod !== 'ONLINE') setIsSubmitting(false)
            else setTimeout(() => setIsSubmitting(false), 2000)
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
                <SheetFooter className="sm:flex-col sm:space-x-0">
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
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Provider</Label>
                            <div className="grid grid-cols-1 gap-2.5">
                                {['ESEWA', 'KHALTI', 'FONEPAY', 'BANKING'].map((provider) => (
                                    <motion.button
                                        key={provider}
                                        whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.02)" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setOnlineProvider(provider)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left bg-white",
                                            onlineProvider === provider
                                                ? "border-primary shadow-sm"
                                                : "border-transparent hover:border-gray-200 shadow-sm"
                                        )}
                                    >
                                        <div className="flex items-center justify-center shrink-0">
                                            {PAYMENT_LOGOS[provider as keyof typeof PAYMENT_LOGOS]}
                                        </div>
                                        <div className="flex flex-col grow">
                                            <span className="font-bold text-base text-gray-900">
                                                {provider === 'ESEWA' && "eSewa Mobile Wallet"}
                                                {provider === 'KHALTI' && "Khalti Digital Wallet"}
                                                {provider === 'FONEPAY' && "Fonepay Direct"}
                                                {provider === 'BANKING' && "Mobile Banking App"}
                                            </span>
                                        </div>
                                        {onlineProvider === provider && (
                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                    </motion.button>
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

                <AnimatePresence>
                    {isSubmitting && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[50] bg-background flex flex-col items-center justify-center p-8 text-center"
                        >
                            {isRedirecting ? (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="space-y-6 w-full"
                                >
                                    <div className="flex justify-center">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
                                                {PAYMENT_LOGOS[onlineProvider as keyof typeof PAYMENT_LOGOS]}
                                            </div>
                                            <motion.div
                                                animate={{ x: [0, 20, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className="absolute -right-4 top-1/2 -translate-y-1/2 bg-background border rounded-full p-2 shadow-xl"
                                            >
                                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            </motion.div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black italic tracking-tighter uppercase italic">Secure Gateway</h3>
                                        <p className="text-muted-foreground font-medium">Redirecting you to <span className="text-foreground font-bold underline decoration-primary/30 underline-offset-4">{onlineProvider}</span> secure portal</p>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            initial={{ x: "-100%" }}
                                            animate={{ x: "0%" }}
                                            transition={{ duration: 2, ease: "easeInOut" }}
                                            className="h-full bg-gradient-to-r from-primary to-orange-400"
                                        />
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 font-semibold uppercase tracking-widest">
                                        <Lock className="w-3 h-3" />
                                        <span>AES-256 Encrypted Connection</span>
                                    </div>
                                </motion.div>
                            ) : !isPaid ? (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="relative inline-block">
                                        <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 animate-ping" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">Authenticating Transaction</h3>
                                        <p className="text-muted-foreground">Confirming your payment with their secure network...</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6 border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)] relative">
                                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1.5, opacity: 0 }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="absolute inset-0 border-2 border-green-500 rounded-full"
                                        />
                                    </div>
                                    <h3 className="text-3xl font-black tracking-tight mb-2 uppercase italic text-green-600 dark:text-green-400">Payment Secured</h3>
                                    <p className="text-lg text-muted-foreground font-medium">Your order has been received by the kitchen!</p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </SheetContent>
        </Sheet>
    )
}
