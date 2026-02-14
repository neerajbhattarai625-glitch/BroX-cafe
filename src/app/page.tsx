"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useTheme } from "next-themes";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { QrCode, Lock, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { QRScannerModal } from "@/components/qr-scanner-modal";
import { RestaurantMenu } from "@/components/restaurant-menu";
import { getOrCreateDeviceId } from "@/lib/device-fingerprint";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { setTableNo, tableNo, clearCart } = useCartStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [verifying, setVerifying] = useState(true);
  const [blocked, setBlocked] = useState<string | null>(null);
  const initialized = useState({ current: false })[0];
  const [showScanner, setShowScanner] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setTableNo(null);
    clearCart();
    router.replace('/')
  };

  const verifySession = async () => {
    try {
      const res = await fetch('/api/login')
      const data = await res.json()
      if (data.success && data.table) {
        setTableNo(data.table.number)
        // Check if the table is still OPEN
        if (data.table.status === 'CLOSED') {
          handleLogout();
        }
      } else {
        setTableNo(null);
      }
    } catch (e) {
      console.error("Session verification failed", e)
    } finally {
      setVerifying(false)
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setShowScanner(false);
    try {
      // Check if it's a URL
      const url = new URL(decodedText);

      // Check for /table/[id] path
      if (url.pathname.startsWith("/table/")) {
        const pathParts = url.pathname.split('/');
        const tid = pathParts[pathParts.length - 1]; // get ID from end of path
        if (tid) {
          router.push(`/table/${tid}`);
          return;
        }
      }

      // Check for query param (backward compatibility)
      const tid = url.searchParams.get("tableId");
      if (tid) {
        router.push(`/?tableId=${tid}`);
      } else {
        // Fallback: assume the text IS the tableId if looks like UUID? 
        // Or just alert invalid
        alert("Invalid QR Code: No tableId found");
      }
    } catch (e) {
      // Maybe it's just the ID?
      // router.push(`/?tableId=${decodedText}`);
      alert("Invalid QR Code Format");
    }
  };

  useEffect(() => {
    // 1. Check for QR Code Params & Login
    const tid = searchParams.get("tableId");

    const checkSession = async () => {
      if (initialized.current) return;
      initialized.current = true;

      if (tid) {
        // Attempt Login / Auto-Open with Retry (Max 1 retry = 2 attempts total)
        let loginSuccess = false;

        for (let i = 0; i < 2; i++) {
          try {
            const deviceId = getOrCreateDeviceId();
            const res = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tableId: tid, deviceId })
            });

            if (res.ok) {
              loginSuccess = true;
              router.replace('/');
              const vRes = await fetch('/api/login');
              const vData = await vRes.json();
              if (vData.table) setTableNo(vData.table.number);
              break; // Success!
            } else {
              const errorData = await res.json();
              if (errorData.code === 'TABLE_IN_USE') {
                setBlocked("This table is currently in use by another device. Please wait or contact staff.");
                setVerifying(false);
                return;
              }
              // If failed, wait before retry (unless it's the last attempt)
              if (i < 1) await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (e) {
            console.error("Login attempt failed", e);
            if (i < 1) await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (!loginSuccess) {
          // Fallback: Check if we are ALREADY logged in to this table despite the error
          const verifyRes = await fetch('/api/login');
          const verifyData = await verifyRes.json();

          if (verifyData.table && verifyData.table.id === tid) {
            router.replace('/');
            setTableNo(verifyData.table.number);
            verifySession();
            return;
          }

          setBlocked("Access Denied. Please scan again.");
        }
      }
      // 2. Check existing session
      verifySession()
    };

    checkSession();

    // 3. Polling for Session Validity (Every 30 seconds)
    const interval = setInterval(verifySession, 30000)
    return () => clearInterval(interval)

  }, [searchParams, router, setTableNo, initialized, clearCart]);


  if (blocked) {
    return (
      <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="bg-destructive/10 p-6 rounded-full mb-6">
          <Lock className="w-12 h-12 text-destructive" />
        </div>
        <h2 className="text-3xl font-bold mb-3 text-destructive">Access Denied</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
          {blocked}
        </p>
        <Button onClick={() => window.location.href = '/'} variant="outline" className="min-w-[140px]">
          Try Again
        </Button>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground animate-pulse">Verifying Access...</p>
      </div>
    );
  }



  // Authenticated Content
  return (
    <RestaurantMenu tableNo={tableNo} onLogout={handleLogout} />
  );
}
