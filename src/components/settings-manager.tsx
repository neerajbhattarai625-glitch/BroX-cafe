"use client"

import { useState, useEffect } from "react"
import { ChefHat, Save, MapPin, Phone, Clock, Globe, Languages, Image as ImageIcon, Star, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export function SettingsManager() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        cafeName: "",
        cafeTagline: "",
        cafeNameNp: "",
        cafeTaglineNp: "",
        heroImage: "",
        logoImage: "",
        openHours: "",
        location: "",
        phone: ""
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings')
            if (res.ok) {
                const data = await res.json()
                setSettings({
                    cafeName: data.cafeName || "",
                    cafeTagline: data.cafeTagline || "",
                    cafeNameNp: data.cafeNameNp || "",
                    cafeTaglineNp: data.cafeTaglineNp || "",
                    heroImage: data.heroImage || "",
                    logoImage: data.logoImage || "",
                    openHours: data.openHours || "",
                    location: data.location || "",
                    phone: data.phone || ""
                })
            }
        } catch (error) {
            toast.error("Failed to load settings")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setSettings(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            if (res.ok) {
                toast.success("Settings updated successfully!")
            } else {
                toast.error("Failed to update settings")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading settings...</div>
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="h-6 w-6" /> Site Settings
                    </h2>
                    <p className="text-muted-foreground text-sm">Manage global branding and cafe information</p>
                </div>
                <Button type="submit" disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Branding Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Globe className="h-4 w-4" /> Basic Branding
                        </CardTitle>
                        <CardDescription>English and translated cafe details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cafeName">Cafe Name (English)</Label>
                            <Input id="cafeName" name="cafeName" value={settings.cafeName} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cafeTagline">Tagline (English)</Label>
                            <Input id="cafeTagline" name="cafeTagline" value={settings.cafeTagline} onChange={handleChange} />
                        </div>
                        <div className="space-y-2 pt-2 border-t">
                            <Label htmlFor="cafeNameNp">Cafe Name (Nepali)</Label>
                            <Input id="cafeNameNp" name="cafeNameNp" value={settings.cafeNameNp} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cafeTaglineNp">Tagline (Nepali)</Label>
                            <Input id="cafeTaglineNp" name="cafeTaglineNp" value={settings.cafeTaglineNp} onChange={handleChange} />
                        </div>
                    </CardContent>
                </Card>

                {/* Images Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> Visual Identity
                        </CardTitle>
                        <CardDescription>Hero images and site logo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="heroImage">Hero Section Image URL</Label>
                            <Input id="heroImage" name="heroImage" value={settings.heroImage} onChange={handleChange} placeholder="/images/hero.jpg" />
                            <p className="text-[10px] text-muted-foreground">Standard path: /images/momo-buff.png</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logoImage">Logo URL (Optional)</Label>
                            <Input id="logoImage" name="logoImage" value={settings.logoImage} onChange={handleChange} placeholder="https://..." />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact & Hours */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Operational Information</CardTitle>
                        <CardDescription>Location, contact, and hours shown in footer and hero</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="openHours" className="flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Opening Hours
                            </Label>
                            <Input id="openHours" name="openHours" value={settings.openHours} onChange={handleChange} placeholder="10am - 10pm" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location" className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> Location
                            </Label>
                            <Input id="location" name="location" value={settings.location} onChange={handleChange} placeholder="Lakeside, Pokhara" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="h-3 w-3" /> Contact Phone
                            </Label>
                            <Input id="phone" name="phone" value={settings.phone} onChange={handleChange} placeholder="+977..." />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    )
}
