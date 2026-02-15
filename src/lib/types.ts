export type OrderItem = {
    name: string;
    qty: number;
}

export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "SERVED" | "PAID" | "CANCELLED";


export interface Order {
    id: string
    tableNo: string
    items: { name: string; qty: number }[]
    total: number
    status: OrderStatus
    paymentMethod?: string
    paymentStatus: 'PENDING' | 'PAID'
    transactionId?: string
    time: string
    deviceName?: string       // NEW
    location?: string         // NEW
    isOnlineOrder?: boolean   // NEW
    customerPhone?: string    // NEW
}

export type ServiceRequest = {
    id: string;
    tableNo: string;
    type: "CALL_WAITER" | "REQUEST_BILL" | "WATER" | "VOICE_ORDER";
    status: string;
    time: string;
    createdAt: Date;
};

export type Review = {
    id: string;
    name: string;
    rating: number;
    comment: string;
    time: string;
};
