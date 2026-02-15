"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function ThankYouPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push("/");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-10">
                <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-10 right-10 w-64 h-64 bg-orange-500 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center max-w-lg"
            >
                <div className="mb-8 relative">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-bounce-slow">
                        <Heart className="w-12 h-12 text-primary fill-primary" />
                    </div>
                    <Sparkles className="absolute -top-2 -right-2 text-orange-400 w-8 h-8 animate-spin-slow" />
                </div>

                <h1 className="font-serif italic text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                    Thank You!
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground font-light mb-8 leading-relaxed">
                    Thank you! We hope you enjoyed.<br />
                    <span className="font-medium text-foreground">Please visit again!</span>
                </p>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

                <Button
                    size="lg"
                    className="rounded-full px-8 h-14 text-lg font-heading tracking-wide shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    onClick={() => router.push("/")}
                >
                    Return to Home ({countdown}s)
                </Button>
            </motion.div>
        </div>
    );
}
