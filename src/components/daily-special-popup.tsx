"use client"

import { useState, useEffect } from "react"
import { X, Star, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose
} from "@/components/ui/dialog"
import Image from "next/image"

interface DailySpecialPopupProps {
    settings: {
        showDailySpecial: boolean
        dailySpecialTitle?: string | null
        dailySpecialDescription?: string | null
        dailySpecialImage?: string | null
    } | null
}

export function DailySpecialPopup({ settings }: DailySpecialPopupProps) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (settings?.showDailySpecial && settings.dailySpecialTitle) {
            // Slight delay for better UX
            const timer = setTimeout(() => {
                const dismissed = sessionStorage.getItem('special_dismissed');
                if (!dismissed) {
                    setOpen(true)
                }
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [settings])

    if (!settings?.showDailySpecial || !settings.dailySpecialTitle) return null

    const handleClose = () => {
        setOpen(false)
        sessionStorage.setItem('special_dismissed', 'true')
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none bg-transparent shadow-2xl">
                <div className="relative bg-background rounded-3xl overflow-hidden border border-border/50">
                    {/* Hero Image Section */}
                    <div className="relative h-64 w-full">
                        {settings.dailySpecialImage ? (
                            <Image
                                src={settings.dailySpecialImage}
                                alt="Daily Special"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-primary flex items-center justify-center">
                                <Utensils className="w-20 h-20 text-white opacity-20" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                        <div className="absolute top-4 left-4">
                            <div className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest shadow-lg">
                                <Star className="w-3 h-3 fill-white" /> Today's Special
                            </div>
                        </div>

                        <DialogClose className="absolute top-4 right-4 bg-black/20 backdrop-blur-md hover:bg-black/40 text-white p-2 rounded-full transition-colors border border-white/10">
                            <X className="w-4 h-4" />
                        </DialogClose>

                        <div className="absolute bottom-6 left-6 right-6">
                            <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase drop-shadow-lg">
                                {settings.dailySpecialTitle}
                            </h2>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <p className="text-muted-foreground leading-relaxed text-lg italic">
                            {settings.dailySpecialDescription || "Don't miss our delicious special prepared fresh just for you today!"}
                        </p>

                        <div className="flex gap-3">
                            <Button
                                className="flex-1 rounded-full h-12 font-bold tracking-tight bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20"
                                onClick={handleClose}
                            >
                                ORDER NOW
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-full h-12 px-6 font-medium"
                                onClick={handleClose}
                            >
                                NOT TODAY
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
