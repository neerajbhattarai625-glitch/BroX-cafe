export type OrderItem = {
    name: string;
    qty: number;
}

export type OrderStatus = "PENDING" | "PREPARING" | "SERVED" | "PAID" | "CANCELLED";


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
}

export type ServiceRequest = {
    id: string;
    tableNo: string;
    type: "CALL_WAITER" | "REQUEST_BILL" | "WATER";
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    time: string;
};

export type Review = {
    id: string;
    name: string;
    rating: number;
    comment: string;
    time: string;
};
