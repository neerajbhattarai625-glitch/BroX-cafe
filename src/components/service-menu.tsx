"use client"

import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { BellRing, FileText, GlassWater } from "lucide-react"
import { useState } from "react"

interface ServiceMenuProps {
    tableNo: string;
}

export function ServiceMenu({ tableNo }: ServiceMenuProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [open, setOpen] = useState(false)

    const handleRequest = async (type: "CALL_WAITER" | "REQUEST_BILL" | "WATER") => {
        setLoading(type)
        try {
            await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tableNo,
                    type
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
                    <div className="grid gap-2">
                        <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => handleRequest('CALL_WAITER')} disabled={!!loading}>
                            <BellRing className="h-4 w-4 text-orange-500" />
                            <div className="flex flex-col items-start">
                                <span>Call Waiter</span>
                                <span className="text-xs text-muted-foreground">Assist me</span>
                            </div>
                        </Button>
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
                </div>
            </PopoverContent>
        </Popover>
    )
}
