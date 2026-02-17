// Tier system configuration
export const TIER_LEVELS = {
    BRONZE: {
        name: 'Bronze',
        minVisits: 0,
        minSpend: 0,
        color: '#CD7F32',
        benefits: ['Welcome bonus', 'Basic rewards'],
        icon: '🥉'
    },
    SILVER: {
        name: 'Silver',
        minVisits: 5,
        minSpend: 2000,
        color: '#C0C0C0',
        benefits: ['5% discount', 'Priority seating', 'Birthday reward'],
        icon: '🥈'
    },
    GOLD: {
        name: 'Gold',
        minVisits: 15,
        minSpend: 10000,
        color: '#FFD700',
        benefits: ['10% discount', 'Free dessert monthly', 'VIP events'],
        icon: '🥇'
    },
    PLATINUM: {
        name: 'Platinum',
        minVisits: 30,
        minSpend: 25000,
        color: '#E5E4E2',
        benefits: ['15% discount', 'Complimentary drinks', 'Chef specials'],
        icon: '💎'
    },
    DIAMOND: {
        name: 'Diamond',
        minVisits: 50,
        minSpend: 50000,
        color: '#B9F2FF',
        benefits: ['20% discount', 'VIP lounge access', 'Personal chef consultation'],
        icon: '👑'
    },
    RUBY: {
        name: 'Ruby',
        minVisits: 100,
        minSpend: 100000,
        color: '#E0115F',
        benefits: ['25% discount', 'Exclusive food tasting invitations', 'Reserved parking'],
        icon: '🎯'
    },
    EMERALD: {
        name: 'Emerald',
        minVisits: 200,
        minSpend: 250000,
        color: '#50C878',
        benefits: ['30% discount', 'Lifetime anniversary rewards', 'Priority in all festival bookings'],
        icon: '🎋'
    }
} as const

export type TierLevel = keyof typeof TIER_LEVELS

// Calculate tier based on visits and spending
export function calculateTier(visits: number, totalSpend: number): TierLevel {
    if (visits >= 200 || totalSpend >= 250000) return 'EMERALD'
    if (visits >= 100 || totalSpend >= 100000) return 'RUBY'
    if (visits >= 50 || totalSpend >= 50000) return 'DIAMOND'
    if (visits >= 30 || totalSpend >= 25000) return 'PLATINUM'
    if (visits >= 15 || totalSpend >= 10000) return 'GOLD'
    if (visits >= 5 || totalSpend >= 2000) return 'SILVER'
    return 'BRONZE'
}

// Get progress to next tier
export function getTierProgress(visits: number, totalSpend: number) {
    const currentTier = calculateTier(visits, totalSpend)
    const tierOrder: TierLevel[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'RUBY', 'EMERALD']
    const currentIndex = tierOrder.indexOf(currentTier)

    if (currentIndex === tierOrder.length - 1) {
        return { nextTier: null, visitProgress: 100, spendProgress: 100 }
    }

    const nextTier = tierOrder[currentIndex + 1]
    const nextTierConfig = TIER_LEVELS[nextTier]

    const visitProgress = Math.min(100, (visits / nextTierConfig.minVisits) * 100)
    const spendProgress = Math.min(100, (totalSpend / nextTierConfig.minSpend) * 100)

    return {
        nextTier,
        visitProgress: Math.round(visitProgress),
        spendProgress: Math.round(spendProgress),
        visitsNeeded: Math.max(0, nextTierConfig.minVisits - visits),
        spendNeeded: Math.max(0, nextTierConfig.minSpend - totalSpend)
    }
}
