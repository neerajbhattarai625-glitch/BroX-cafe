"use client";

import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CartSheet } from "@/components/cart-sheet";
import { ServiceMenu } from "@/components/service-menu";
import { ReviewForm } from "@/components/review-form";
import { MENU_ITEMS as MOCK_ITEMS, CATEGORIES as MOCK_CATS } from "@/lib/data";
import { useTheme } from "next-themes";
import { useCartStore } from "@/lib/store";
import { Moon, Sun, ShoppingBag, UtensilsCrossed, ChefHat, QrCode, Lock, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";

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

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { theme, setTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState("all");
  const { addItem, lang, setLang, tableNo, setTableNo } = useCartStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    // 1. Check for QR Code Params & Login
    const tid = searchParams.get("tableId");
    const tkn = searchParams.get("token");

    const checkSession = async () => {
      if (tid && tkn) {
        // Attempt Login
        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableId: tid, token: tkn })
          });
          if (res.ok) {
            // Success, remove params from URL for clean look
            router.replace('/');
            // Verify to get table number
            const vRes = await fetch('/api/login');
            const vData = await vRes.json();
            if (vData.table) setTableNo(vData.table.number);
          } else {
            alert("Invalid QR Code or Table Closed.");
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        // 2. Check existing session
        try {
          const res = await fetch('/api/login');
          const data = await res.json();
          if (data.table) {
            setTableNo(data.table.number);
          } else {
            setTableNo(null);
          }
          if (data.user) {
            setUser(data.user);
          }
        } catch (e) {
          console.error(e);
        }
      }
      setVerifying(false);
    };

    checkSession();
  }, [searchParams, router, setTableNo]);

  useEffect(() => {
    // Fetch live data
    Promise.all([
      fetch('/api/categories').then(res => res.ok ? res.json() : []),
      fetch('/api/menu').then(res => res.ok ? res.json() : [])
    ]).then(([cats, items]) => {
      setCategories(cats.length > 0 ? cats : MOCK_CATS);
      setMenuItems(items.length > 0 ? items : MOCK_ITEMS);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load menu", err);
      // Fallback to mock data if API fails
      setCategories(MOCK_CATS);
      setMenuItems(MOCK_ITEMS);
      setLoading(false);
    });
  }, []);

  const filteredItems = activeCategory === "all"
    ? menuItems
    : menuItems.filter(item => item.categoryId === activeCategory);

  return (
    <div className="min-h-screen pb-20 bg-background text-foreground transition-colors duration-300 font-sans selection:bg-orange-500/30">

      {/* Session Overlay */}
      {!tableNo && !verifying && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-card border shadow-xl p-8 rounded-2xl max-w-md w-full animate-in zoom-in-95">
            <div className="bg-orange-100 dark:bg-orange-900/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to Cafe Delight</h2>
            <p className="text-muted-foreground mb-6">
              To place an order, please scan the QR code located on your table.
            </p>
            <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
              <p>If you have already scanned and see this message, please ask our staff for assistance.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-orange-500 to-amber-500 p-2 rounded-xl shadow-lg shadow-orange-500/20">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent tracking-tight">
              Cafe Delight
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === 'en' ? 'np' : 'en')}
              className="font-bold text-base w-10 h-10 rounded-full hover:bg-muted"
            >
              {lang === 'en' ? '🇳🇵' : '🇺🇸'}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-muted" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            {user ? (
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-muted" onClick={() => router.push('/dashboard')}>
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-muted" onClick={() => router.push('/login')}>
                <Lock className="h-5 w-5 text-muted-foreground" />
              </Button>
            )}
            <CartSheet />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[50vh] sm:h-[60vh] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <Image
          src="/images/momo-buff.png"
          alt="Hero Food"
          fill
          className="object-cover scale-105 animate-slow-zoom"
          priority
        />
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 rounded-full bg-orange-500/20 text-orange-200 text-sm font-medium border border-orange-500/30 backdrop-blur-md mb-4 inline-block">
              {lang === 'en' ? 'Authentic Flavors' : 'अनिवार्य स्वाद'}
            </span>
            <h2 className="text-5xl sm:text-7xl font-black text-white drop-shadow-2xl tracking-tight leading-tight">
              {lang === 'en' ? 'Taste of Nepal' : 'नेपालको स्वाद'}
            </h2>
            <p className="text-slate-100 text-xl sm:text-2xl font-light mt-4 max-w-2xl mx-auto leading-relaxed drop-shadow-lg opacity-90">
              {lang === 'en' ? 'Experience the finest Momos, savory Noodles, and refreshing drinks in town.' : 'सहरकै उत्कृष्ट मोमो, चाउमिन र पेय पदार्थको अनुभव लिनुहोस्।'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex gap-4 justify-center pt-4"
          >
            <Button size="lg" className="rounded-full px-8 bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-xl shadow-orange-900/20 text-lg h-12">
              {lang === 'en' ? 'View Menu' : 'मेनु हेर्नुहोस्'}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <nav className="sticky top-20 z-40 bg-background/80 backdrop-blur-lg border-b border-border/40 py-4 overflow-x-auto scroolbar-hide">
        <div className="container mx-auto px-6 flex gap-3 min-w-max pb-2">
          <Button
            variant={activeCategory === "all" ? "default" : "secondary"}
            onClick={() => setActiveCategory("all")}
            className={cn(
              "rounded-full px-6 transition-all duration-300",
              activeCategory === "all" ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20" : "hover:bg-muted"
            )}
          >
            {lang === 'en' ? 'All' : 'सबै'}
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "secondary"}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "rounded-full px-6 transition-all duration-300",
                activeCategory === cat.id ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20" : "hover:bg-muted"
              )}
            >
              {lang === 'en' ? cat.nameEn : cat.nameNp}
            </Button>
          ))}
        </div>
      </nav>

      {/* Menu Grid */}
      <main className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <Card className="overflow-hidden group h-full border-0 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-card/50 backdrop-blur-sm dark:bg-card/40">
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={item.image || "/images/momo-buff.png"}
                    alt={item.nameEn}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    Rs. {item.price}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <CardHeader className="p-5 pb-2">
                  <CardTitle className="flex justify-between items-start text-xl font-bold tracking-tight">
                    <span className="line-clamp-1" title={lang === 'en' ? item.nameEn : item.nameNp}>
                      {lang === 'en' ? item.nameEn : item.nameNp}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-primary font-medium flex items-center gap-1.5 text-base">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    {lang === 'en' ? item.nameNp : item.nameEn}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-2 flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>

                <CardFooter className="p-5 pt-0">
                  <Button
                    className="w-full font-semibold rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/30 transition-all h-11"
                    onClick={() => addItem({
                      id: item.id,
                      name: lang === 'en' ? item.nameEn : item.nameNp,
                      price: item.price
                    })}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    {lang === 'en' ? 'Add to Order' : 'अर्डर गर्नुहोस्'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>

      <section className="container mx-auto px-6 py-8 pb-32">
        <div className="bg-muted/30 rounded-3xl p-8 md:p-12 border border-border/50">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-bold mb-4">{lang === 'en' ? 'Tell us about your experience' : 'तपाईंको अनुभव बताउनुहोस्'}</h2>
            <p className="text-muted-foreground">{lang === 'en' ? 'We value your feedback to serve you better.' : 'तपाईंको प्रतिक्रिया हाम्रो लागि महत्वपूर्ण छ।'}</p>
          </div>
          <ReviewForm />
        </div>
      </section>

      {/* Floating Call Waiter Button */}
      <div className="fixed bottom-8 right-8 z-50 animate-bounce-subtle">
        <ServiceMenu />
      </div>

      {/* Footer */}
      <footer className="bg-muted/50 py-8 border-t border-border/40 mt-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; 2024 Cafe Delight. All rights reserved.</p>
          <a href="/login" className="hover:text-primary transition-colors hover:underline">
            {lang === 'en' ? 'Staff Login' : 'कर्मचारी लगइन'}
          </a>
        </div>
      </footer>

    </div>
  );
}
