"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Category {
    id: string;
    nameEn: string;
    nameNp: string;
}

export function MenuManager() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error("Failed to load categories", err))
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            const response = await fetch('/api/menu', {
                method: 'POST',
                body: formData,
            })

            if (response.ok) {
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000);
                (e.target as HTMLFormElement).reset()
            } else {
                console.error("Failed to add item")
            }
        } catch (error) {
            console.error("Error submitting form", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add Menu Item</CardTitle>
                <CardDescription>Add new dishes to the digital menu.</CardDescription>
            </CardHeader>
            <CardContent>
                <form id="menu-form" onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nameEn">Name (English)</Label>
                            <Input id="nameEn" name="nameEn" placeholder="e.g. Chicken Momo" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nameNp">Name (Nepali)</Label>
                            <Input id="nameNp" name="nameNp" placeholder="e.g. चिकेन मोमो" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price">Price (Rs.)</Label>
                            <Input id="price" name="price" type="number" placeholder="200" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <select
                                id="category"
                                name="categoryId"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="" disabled selected>Select a category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.nameEn}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input id="description" name="description" placeholder="Brief description of the dish" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="image">Image (optional)</Label>
                        <Input id="image" name="image" type="file" accept="image/*" />
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex justify-between">
                {success && <p className="text-green-600 font-medium">Item added successfully!</p>}
                <Button type="submit" form="menu-form" disabled={loading}>
                    {loading ? "Adding..." : "Add Item"}
                </Button>
            </CardFooter>
        </Card>
    )
}
