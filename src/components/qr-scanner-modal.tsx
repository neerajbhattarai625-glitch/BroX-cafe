"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { X, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface QRScannerModalProps {
    isOpen: boolean
    onClose: () => void
    onScanSuccess: (decodedText: string) => void
}

export function QRScannerModal({ isOpen, onClose, onScanSuccess }: QRScannerModalProps) {
    const [cameraError, setCameraError] = useState<string | null>(null)

    // Track scanner instance
    const scannerRef = useRef<Html5Qrcode | null>(null)
    // Track mount state
    const isMountedRef = useRef(false)
    // Track current transition promise to serialize operations
    const transitionPromiseRef = useRef<Promise<void>>(Promise.resolve())

    // Helper to queue scanner operations
    const queueOperation = useCallback((operation: () => Promise<void>) => {
        const nextPromise = transitionPromiseRef.current.then(async () => {
            if (!isMountedRef.current) return
            try {
                await operation()
            } catch (e) {
                console.warn("Scanner operation failed:", e)
                throw e
            }
        }).catch(err => {
            console.error("Queue error:", err)
        })
        transitionPromiseRef.current = nextPromise
    }, [])

    // Initialize scanner ONCE when modal opens
    useEffect(() => {
        isMountedRef.current = true

        if (isOpen && !scannerRef.current) {
            const element = document.getElementById("reader")
            if (element) {
                scannerRef.current = new Html5Qrcode("reader", {
                    verbose: false,
                    useBarCodeDetectorIfSupported: true
                })
            }
        }

        return () => {
            isMountedRef.current = false
            const scanner = scannerRef.current
            if (scanner) {
                try {
                    if (scanner.isScanning) {
                        scanner.stop().then(() => scanner.clear()).catch(console.error)
                    } else {
                        scanner.clear()
                    }
                } catch (e) {
                    console.error("Cleanup error", e)
                }
                scannerRef.current = null
            }
        }
    }, [isOpen])

    // Start Camera
    useEffect(() => {
        if (!isOpen) return;

        queueOperation(async () => {
            const scanner = scannerRef.current
            if (!scanner) return

            setCameraError(null)

            // Check for Secure Context
            if (!window.isSecureContext) {
                setCameraError('Camera access requires a SECURE connection (HTTPS). Please ensure you are using https:// or testing on localhost.')
                return
            }

            try {
                // Check if mediaDevices is available
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Camera API not supported or blocked by browser.")
                }

                // Ensure stopped
                if (scanner.isScanning) {
                    await scanner.stop()
                }

                await new Promise(r => setTimeout(r, 100))
                if (!isMountedRef.current) return

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    (decodedText) => {
                        onScanSuccess(decodedText)
                        onClose()
                    },
                    (errorMessage) => {
                        // ignore
                    }
                )
            } catch (err: any) {
                console.error("Camera Start Error:", err)
                if (isMountedRef.current) {
                    let msg = "Camera access failed."
                    if (err.name === 'NotAllowedError') msg = "Camera permission denied. Please enable it in browser settings."
                    else if (err.name === 'NotFoundError') msg = "No camera found on this device."
                    else if (!window.isSecureContext) msg = "Camera requires HTTPS. Please use a secure connection."
                    else msg = `Camera Error: ${err.message || 'Unknown error'}. Ensure no other app is using the camera.`

                    setCameraError(msg)
                }
            }
        })
    }, [isOpen, onScanSuccess, onClose, queueOperation])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
                >
                    <div className="w-full max-w-md bg-background rounded-3xl overflow-hidden relative shadow-2xl border border-border/50">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b bg-muted/30">
                            <div className="flex gap-2 items-center text-sm font-medium">
                                <Camera className="w-4 h-4" />
                                Scan QR Code
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-0 bg-black relative min-h-[350px] flex items-center justify-center overflow-hidden">
                            <div
                                id="reader"
                                className="w-full h-full"
                            />

                            {/* Camera Error Overlay */}
                            {cameraError && (
                                <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center p-6 text-center text-white">
                                    <p className="mb-4">{cameraError}</p>
                                    <Button variant="secondary" onClick={onClose}>
                                        Close
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground">
                                Point camera at the QR code on your table.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
