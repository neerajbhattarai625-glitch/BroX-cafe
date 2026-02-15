"use client"

import { useSearchParams } from "next/navigation"
import { ShieldAlert, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BlockedPage() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type');
    const isManual = type === 'manual';

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
                            <ShieldAlert className="w-12 h-12 text-destructive" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-foreground">
                        {isManual ? 'Access Restricted' : 'Access Denied'}
                    </h1>
                    <div className="p-6 bg-muted/30 rounded-3xl border border-border/50 space-y-4">
                        <p className="text-xl leading-relaxed text-destructive font-bold uppercase tracking-tight">
                            {isManual
                                ? "sorry to say but your device is blocked for some reason."
                                : "Basterd! Don't even think you can access it outside Nepal by using VPN."}
                        </p>
                        <p className="text-sm text-muted-foreground italic">
                            {isManual
                                ? "Please contact the cafe administrator if you think this is a mistake."
                                : "This application is strictly restricted to Nepal. VPN and Proxy connections are blocked."}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                        <MapPin className="w-3 h-3" />
                        <span>Pokhara, Nepal | Restricted Content</span>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="rounded-full h-12 px-8 font-heading tracking-wide"
                    >
                        RETRY CONNECTION
                    </Button>
                </div>
            </div>

            {/* Background Decorative Element */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
            </div>
        </div>
    )
}
