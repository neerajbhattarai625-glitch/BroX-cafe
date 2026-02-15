"use client"

import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { BellRing, FileText, GlassWater } from "lucide-react"
import { useState } from "react"
import { VoiceRecorder } from "@/components/voice-recorder"

interface ServiceMenuProps {
    tableNo: string;
}

export function ServiceMenu({ tableNo }: ServiceMenuProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [open, setOpen] = useState(false)

    const handleRequest = async (type: "CALL_WAITER" | "REQUEST_BILL" | "WATER" | "VOICE_ORDER", audioData?: string) => {
        setLoading(type)
        let lat = null;
        let lng = null;

        // Get Location if possible
        if ("geolocation" in navigator) {
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            } catch (e) {
                console.warn("Location access denied or timed out");
            }
        }

        try {
            await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tableNo,
                    type,
                    userLat: lat,
                    userLng: lng,
                    audioData
                })
            })
            setOpen(false)
            // Toast success here ideally
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(null)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button size="icon" className="h-14 w-14 rounded-full shadow-xl bg-destructive hover:bg-destructive/90 animate-bounce-slow">
                    <BellRing className="h-6 w-6" />
                    <span className="sr-only">Call Waiter</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 mr-6 mb-2" side="top" align="end">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Service Request</h4>
                        <p className="text-sm text-muted-foreground">
                            What do you need?
                        </p>
                    </div>
                </div>

                <div className="border-t my-1"></div>

                <VoiceRecorder onUpload={async (audioData) => {
                    await handleRequest('VOICE_ORDER', audioData)
                }} disabled={!!loading} />

                <div className="border-t my-1"></div>

                <div className="grid gap-2">
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => handleRequest('WATER')} disabled={!!loading}>
                        <GlassWater className="h-4 w-4 text-blue-500" />
                        <div className="flex flex-col items-start">
                            <span>Water</span>
                            <span className="text-xs text-muted-foreground">Refill please</span>
                        </div>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => handleRequest('REQUEST_BILL')} disabled={!!loading}>
                        <FileText className="h-4 w-4 text-green-500" />
                        <div className="flex flex-col items-start">
                            <span>Request Bill</span>
                            <span className="text-xs text-muted-foreground">Ready to pay</span>
                        </div>
                    </Button>
                </div>

            </PopoverContent>
        </Popover >
    )
}
