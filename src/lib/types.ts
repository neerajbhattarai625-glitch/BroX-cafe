export type OrderItem = {
    name: string;
    qty: number;
}

export type OrderStatus = "PENDING" | "PREPARING" | "SERVED" | "PAID";

export type Order = {
    id: string;
    tableNo: string;
    items: OrderItem[];
    total: number;
    status: OrderStatus;
    time: string;
};

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
