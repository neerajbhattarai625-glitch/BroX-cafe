"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CartSheet } from "@/components/cart-sheet";
import { ServiceMenu } from "@/components/service-menu";
import { ReviewForm } from "@/components/review-form";
import { MENU_ITEMS as MOCK_ITEMS, CATEGORIES as MOCK_CATS } from "@/lib/data";
import { useTheme } from "next-themes";
import { useCartStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, ShoppingBag, UtensilsCrossed, ChefHat, LogOut, Lock, MapPin, Clock, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScroll, useTransform, motion, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu as MenuIcon, Scan, PhoneCall } from "lucide-react";
import { QRScannerModal } from "@/components/qr-scanner-modal";

// Ensure GSAP plugin is registered
if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface Category {
    id: string;
    nameEn: string;
    nameNp: string;
}

interface MenuItem {
    id: string;
    nameEn: string;
    nameNp: string;
    description: string | null;
    price: number;
    image: string | null;
    categoryId: string;
}

interface RestaurantMenuProps {
    tableNo: string | null;
    onLogout: () => void;
}

export function RestaurantMenu({ tableNo, onLogout }: RestaurantMenuProps) {
    const { theme, setTheme } = useTheme();
    const [activeCategory, setActiveCategory] = useState("all");
    const { addItem, lang, setLang } = useCartStore();
    const router = useRouter();

    const [categories, setCategories] = useState<Category[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const heroTextRef = useRef<HTMLDivElement>(null);
    const menuGridRef = useRef<HTMLDivElement>(null);

    const [showScanner, setShowScanner] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleScanSuccess = (decodedText: string) => {
        setShowScanner(false);
        try {
            const url = new URL(decodedText);
            if (url.pathname.startsWith("/table/")) {
                const pathParts = url.pathname.split('/');
                const tid = pathParts[pathParts.length - 1];
                if (tid) {
                    // Normalize: check if we are already on this table
                    if (tid === tableNo) {
                        // Already here
                        return;
                    }
                    // Redirect to new table
                    window.location.href = `/table/${tid}`;
                }
            }
        } catch (e) {
            console.error("Invalid QR", e);
        }
    };

    // Initial Data Fetch
    useEffect(() => {
        Promise.all([
            fetch('/api/categories').then(res => res.ok ? res.json() : []),
            fetch('/api/menu').then(res => res.ok ? res.json() : [])
        ]).then(([cats, items]) => {
            setCategories(cats.length > 0 ? cats : MOCK_CATS);
            setMenuItems(items.length > 0 ? items : MOCK_ITEMS);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load menu", err);
            setCategories(MOCK_CATS);
            setMenuItems(MOCK_ITEMS);
            setLoading(false);
        });
    }, []);

    // GSAP Animations
    useEffect(() => {
        if (loading) return;

        const ctx = gsap.context(() => {
            // Hero Text Reveal
            gsap.from(".hero-text-reveal", {
                y: 100,
                opacity: 0,
                duration: 1.2,
                stagger: 0.2,
                ease: "power4.out"
            });

            // Parallax Background
            gsap.to(".parallax-bg", {
                yPercent: 30,
                ease: "none",
                scrollTrigger: {
                    trigger: ".hero-section",
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                }
            });

            // Menu Item Stagger
            ScrollTrigger.batch(".menu-item-card", {
                onEnter: (batch) => {
                    gsap.to(batch, {
                        opacity: 1,
                        y: 0,
                        stagger: 0.1,
                        duration: 0.6,
                        ease: "power2.out"
                    });
                },
                start: "top 85%",
                once: true
            });

        }, containerRef);

        return () => ctx.revert();
    }, [loading, activeCategory]); // Re-run when category changes to animate new items

    const filteredItems = activeCategory === "all"
        ? menuItems
        : menuItems.filter(item => item.categoryId === activeCategory);

    return (
        <div ref={containerRef} className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500/30 overflow-x-hidden">

            {/* Header / Nav */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 h-16 transition-all duration-300">
                <div className="container mx-auto px-4 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                            <ChefHat className="w-5 h-5" />
                        </div>
                        <h1 className="font-serif italic text-xl font-bold tracking-tight">Cafe Delight</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Info Button (Mobile) - Could be a sheet, simpler for now just icon */}

                        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </Button>

                        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full font-bold text-xs" onClick={() => setLang(lang === 'en' ? 'np' : 'en')}>
                            {lang === 'en' ? 'NP' : 'EN'}
                        </Button>

                        <CartSheet />
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section relative h-[90vh] flex items-center justify-center text-center overflow-hidden">
                <div className="parallax-bg absolute inset-0 z-0">
                    <Image
                        src="/images/momo-buff.png"
                        alt="Delicious Food"
                        fill
                        className="object-cover opacity-90 dark:opacity-60"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
                </div>

                <div className="relative z-10 px-6 max-w-3xl mx-auto space-y-6" ref={heroTextRef}>
                    <p className="hero-text-reveal font-script text-3xl md:text-5xl text-orange-400 drop-shadow-md rotate-[-3deg]">
                        {lang === 'en' ? 'Authentic Flavors' : 'अनिवार्य स्वाद'}
                    </p>
                    <h2 className="hero-text-reveal font-serif italic text-6xl md:text-8xl font-black text-white drop-shadow-2xl leading-[0.9]">
                        {lang === 'en' ? 'Taste of Nepal' : 'नेपालको स्वाद'}
                    </h2>
                    <p className="hero-text-reveal text-white/90 text-lg md:text-xl font-light max-w-lg mx-auto leading-relaxed drop-shadow-lg">
                        {lang === 'en' ? 'Experience the finest Momos, savory Noodles, and refreshing drinks.' : 'सहरकै उत्कृष्ट मोमो, चाउमिन र पेय पदार्थको अनुभव लिनुहोस्।'}
                    </p>

                    <div className="hero-text-reveal pt-6">
                        <Button
                            className="bg-orange-600 hover:bg-orange-700 text-white font-heading tracking-wide text-lg h-14 px-8 rounded-full shadow-xl shadow-orange-500/30 transition-transform hover:scale-105"
                            onClick={() => document.getElementById('menu-start')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            {lang === 'en' ? 'ORDER NOW' : 'अर्डर गर्नुहोस्'}
                        </Button>
                    </div>
                </div>

                {/* Info Bar at Bottom of Hero */}
                <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-6 text-white/80 text-xs md:text-sm font-medium">
                    <div className="flex items-center gap-1.5 backdrop-blur-md bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
                        <Clock className="w-3.5 h-3.5" /> 10am - 10pm
                    </div>
                    <div className="flex items-center gap-1.5 backdrop-blur-md bg-black/20 px-3 py-1.5 rounded-full border border-white/10 cursor-pointer hover:bg-black/30 transition-colors">
                        <MapPin className="w-3.5 h-3.5" /> Lakeside, Pokhara
                    </div>
                </div>
            </section>

            {/* Menu Section */}
            <div id="menu-start" className="relative z-20 -mt-8 bg-background rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pt-12 pb-24 min-h-screen">

                {/* Info / Table Status (Mobile Sticky) */}
                {tableNo && (
                    <div className="sticky top-16 z-30 flex justify-center mb-8 pointer-events-none">
                        <div className="bg-background/90 backdrop-blur-md border border-border shadow-sm rounded-full px-4 py-1.5 flex items-center gap-3 pointer-events-auto">
                            <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Table {tableNo}
                            </span>
                            <div className="h-4 w-px bg-border" />
                            <button onClick={onLogout} className="text-muted-foreground hover:text-destructive transition-colors">
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Categories */}
                <div className="mb-10 overflow-x-auto scrollbar-hide px-4">
                    <div className="flex gap-2 w-max mx-auto md:flex-wrap md:justify-center">
                        <Button
                            variant={activeCategory === "all" ? "default" : "outline"}
                            onClick={() => setActiveCategory("all")}
                            className={cn(
                                "rounded-full px-6 font-heading tracking-wide transition-all",
                                activeCategory === "all" ? "bg-foreground text-background" : "border-border text-muted-foreground"
                            )}
                        >
                            ALL
                        </Button>
                        {categories.map((cat) => (
                            <Button
                                key={cat.id}
                                variant={activeCategory === cat.id ? "default" : "outline"}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "rounded-full px-6 font-heading tracking-wide transition-all",
                                    activeCategory === cat.id ? "bg-foreground text-background" : "border-border text-muted-foreground"
                                )}
                            >
                                {lang === 'en' ? cat.nameEn.toUpperCase() : cat.nameNp}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Menu Grid */}
                <div className="container mx-auto px-4" ref={menuGridRef}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredItems.map((item) => (
                            <Card
                                key={item.id}
                                className="menu-item-card opacity-0 translate-y-8 border-none shadow-none bg-transparent group"
                            >
                                <div className="relative h-64 w-full rounded-[2rem] overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-all duration-500">
                                    <Image
                                        src={item.image || "/images/momo-buff.png"}
                                        alt={item.nameEn}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4">
                                        <div className="bg-background/90 backdrop-blur text-foreground font-heading font-bold px-3 py-1 rounded-full text-sm shadow-sm">
                                            Rs. {item.price}
                                        </div>
                                    </div>

                                    {/* Quick Add Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <Button
                                            className="rounded-full h-12 w-12 bg-white text-black hover:bg-white/90 hover:scale-110 transition-all font-bold"
                                            size="icon"
                                            onClick={() => addItem({
                                                id: item.id,
                                                name: lang === 'en' ? item.nameEn : item.nameNp,
                                                price: item.price
                                            })}
                                        >
                                            <PlusIcon className="w-6 h-6" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="px-2">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-serif italic text-xl font-bold leading-tight group-hover:text-orange-600 transition-colors">
                                            {lang === 'en' ? item.nameEn : item.nameNp}
                                        </h3>
                                    </div>
                                    <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed mb-3">
                                        {item.description}
                                    </p>
                                    <Button
                                        className="w-full rounded-xl font-heading tracking-wide md:hidden bg-muted hover:bg-muted/80 text-foreground"
                                        variant="secondary"
                                        onClick={() => addItem({
                                            id: item.id,
                                            name: lang === 'en' ? item.nameEn : item.nameNp,
                                            price: item.price
                                        })}
                                    >
                                        ADD TO CART
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 pb-32 bg-muted/20">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                    <h3 className="font-serif italic text-3xl font-bold">How was everything?</h3>
                    <ReviewForm />
                </div>
            </div>

            {/* Floating Call Waiter Button - Only for Table Sessions */}
            {tableNo && (
                <div className="fixed bottom-6 right-6 z-40">
                    <ServiceMenu />
                </div>
            )}

            {/* Simple Footer */}
            <footer className="py-8 text-center text-muted-foreground text-sm bg-background border-t border-border/40">
                <p className="font-serif italic text-lg mb-2">Cafe Delight</p>
                <div className="flex justify-center gap-4 mb-4">
                    <a href="#" className="hover:text-foreground"><Phone className="w-4 h-4" /></a>
                    <a href="#" className="hover:text-foreground"><MapPin className="w-4 h-4" /></a>
                    <a href="#" className="hover:text-foreground"><Clock className="w-4 h-4" /></a>
                </div>
                <p>&copy; 2024. All rights reserved.</p>
            </footer>
            <QRScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} onScanSuccess={handleScanSuccess} />
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )
}
