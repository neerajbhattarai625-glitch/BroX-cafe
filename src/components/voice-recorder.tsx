"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface VoiceRecorderProps {
    onUpload: (audioData: string) => Promise<void>;
    disabled?: boolean;
}

export function VoiceRecorder({ onUpload, disabled }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                await processAudio(blob)
                stream.getTracks().forEach(track => track.stop()) // Stop mic
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (err) {
            console.error("Error accessing microphone:", err)
            toast.error("Microphone access denied")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsProcessing(true)
        }
    }

    const processAudio = async (blob: Blob) => {
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = async () => {
            const base64Audio = reader.result as string
            try {
                await onUpload(base64Audio)
                toast.success("Voice order sent!")
            } catch (error) {
                console.error("Upload failed", error)
                toast.error("Failed to send voice order")
            } finally {
                setIsProcessing(false)
            }
        }
    }

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            {!isRecording ? (
                <Button
                    onClick={startRecording}
                    disabled={disabled || isProcessing}
                    variant="outline"
                    className="w-full h-auto py-4 flex flex-col gap-2 border-primary/20 hover:bg-primary/5"
                >
                    {isProcessing ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Mic className="h-6 w-6 text-primary" />}
                    <span className="text-sm font-medium">{isProcessing ? "Sending..." : "Tap to Speak Order"}</span>
                </Button>
            ) : (
                <Button
                    onClick={stopRecording}
                    variant="destructive"
                    className="w-full h-auto py-4 flex flex-col gap-2 animate-pulse"
                >
                    <Square className="h-6 w-6 fill-current" />
                    <span className="text-sm font-medium">Stop & Send</span>
                </Button>
            )}
            {isRecording && <span className="text-xs text-red-500 animate-pulse font-medium">Recording...</span>}
        </div>
    )
}
