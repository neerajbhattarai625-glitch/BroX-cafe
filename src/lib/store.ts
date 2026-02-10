import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
    id: string
    name: string
    price: number
    quantity: number
}

type CartStore = {
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'quantity'>) => void
    removeItem: (id: string) => void
    userId: string | null
    setUserId: (id: string) => void
    increaseQuantity: (id: string) => void
    decreaseQuantity: (id: string) => void
    clearCart: () => void
    total: () => number
    lang: 'en' | 'np'
    setLang: (lang: 'en' | 'np') => void
    myOrderIds: string[]
    addOrderId: (id: string) => void
    tableNo: string | null
    setTableNo: (no: string | null) => void
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            userId: null,
            lang: 'en',
            myOrderIds: [],
            tableNo: null,
            setLang: (lang) => set({ lang }),
            setUserId: (id) => set({ userId: id }),
            setTableNo: (no) => set({ tableNo: no }),
            addOrderId: (id) => set((state) => ({ myOrderIds: [...state.myOrderIds, id] })),
            addItem: (item) => set((state) => {
                const existing = state.items.find((i) => i.id === item.id)
                if (existing) {
                    return {
                        items: state.items.map((i) =>
                            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                        ),
                    }
                }
                return { items: [...state.items, { ...item, quantity: 1 }] }
            }),
            removeItem: (id) => set((state) => ({
                items: state.items.filter((i) => i.id !== id),
            })),
            increaseQuantity: (id) => set((state) => ({
                items: state.items.map((i) => i.id === id ? { ...i, quantity: i.quantity + 1 } : i)
            })),
            decreaseQuantity: (id) => set((state) => ({
                items: state.items
                    .map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
                    .filter((i) => i.quantity > 0)
            })),
            clearCart: () => set({ items: [] }),
            total: () => {
                return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0)
            }
        }),
        {
            name: 'cafe-storage',
        }
    )
)
