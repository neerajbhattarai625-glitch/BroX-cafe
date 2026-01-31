import fs from 'fs';
import path from 'path';
import 'server-only';
import { Order, ServiceRequest, Review } from './types';

const DB_PATH = path.join(process.cwd(), 'data/db.json');

type DBData = {
    orders: Order[];
    requests: ServiceRequest[];
    reviews: Review[];
};

function readDB(): DBData {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return { orders: [], requests: [], reviews: [] };
        }
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        return {
            orders: parsed.orders || [],
            requests: parsed.requests || [],
            reviews: parsed.reviews || []
        };
    } catch (error) {
        return { orders: [], requests: [], reviews: [] };
    }
}

function writeDB(data: DBData) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const db = {
    getOrders: () => readDB().orders,
    addOrder: (order: Order) => {
        const data = readDB();
        data.orders.push(order);
        writeDB(data);
        return order;
    },
    updateOrder: (id: string, updates: Partial<Order>) => {
        const data = readDB();
        const index = data.orders.findIndex(o => o.id === id);
        if (index !== -1) {
            data.orders[index] = { ...data.orders[index], ...updates };
            writeDB(data);
            return data.orders[index];
        }
        return null;
    },
    getRequests: () => readDB().requests,
    addRequest: (req: ServiceRequest) => {
        const data = readDB();
        data.requests.push(req);
        writeDB(data);
        return req;
    },
    updateRequest: (id: string, updates: Partial<ServiceRequest>) => {
        const data = readDB();
        const index = data.requests.findIndex(r => r.id === id);
        if (index !== -1) {
            data.requests[index] = { ...data.requests[index], ...updates };
            writeDB(data);
            return data.requests[index];
        }
        return null;
    },
    getReviews: () => readDB().reviews,
    addReview: (review: Review) => {
        const data = readDB();
        data.reviews.push(review);
        writeDB(data);
        return review;
    }
};
