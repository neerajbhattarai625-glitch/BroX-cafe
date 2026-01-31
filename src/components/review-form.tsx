"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function ReviewForm() {
    const [rating, setRating] = useState(0)
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('name') || "Anonymous",
                    rating,
                    comment: formData.get('comment')
                })
            })
            setSubmitted(true)
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <Card className="w-full max-w-md mx-auto mt-12 bg-green-50/50 border-green-200">
                <CardContent className="pt-6 text-center">
                    <h3 className="text-2xl font-bold text-green-700 mb-2">Thank You!</h3>
                    <p className="text-muted-foreground">Your review has been submitted successfully.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md mx-auto mt-12">
            <CardHeader>
                <CardTitle>Rate your experience</CardTitle>
                <CardDescription>
                    Help us improve by sharing your feedback.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="grid gap-4">
                    <div className="flex justify-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={cn("transition-transform hover:scale-110 focus:outline-none", rating >= star ? "text-orange-400" : "text-muted")}
                            >
                                <Star className={cn("h-8 w-8", rating >= star ? "fill-orange-400" : "fill-transparent")} />
                            </button>
                        ))}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name (Optional)</Label>
                        <Input id="name" name="name" placeholder="John Doe" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Input id="comment" name="comment" placeholder="The momos were amazing!" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" disabled={rating === 0 || loading}>
                        {loading ? "Submitting..." : "Submit Review"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
