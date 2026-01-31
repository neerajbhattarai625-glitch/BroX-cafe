# Cafe Delight - Ordering System Prototype

A modern, responsive web application for cafe ordering and kitchen management.

## Features

### For Customers
- **Visual Menu**: Browse Momos, Noodles, and Drinks with appetizing visuals.
- **Cart System**: Add items, adjust quantities, and place orders directly from the table.
- **Service Requests**: "Call Waiter", "Request Water", or "Bill" with a single tap.
- **Reviews**: Rate your experience and leave feedback.
- **Theming**: Toggle between Light and Dark modes.

### For Staff/Owners
- **Kitchen Dashboard**: Real-time view of all active orders.
- **Kanban Flow**: Move orders from `Pending` -> `Preparing` -> `Served` -> `Paid`.
- **Request Management**: Instant notifications for service requests.
- **Live Sync**: The dashboard updates automatically every 5 seconds to reflect new orders.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4, Shadcn UI
- **State Management**: Zustand
- **Database**: File-based Mock JSON (simulation for prototype)
- **Language**: TypeScript

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Open Application**
    - Customer View: [http://localhost:3000](http://localhost:3000)
    - Kitchen Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## Project Structure
- `src/app`: Page routes and layouts.
- `src/components`: Reusable UI components.
- `src/lib`: Utilities, store, and mock data.
- `data/db.json`: Local persistence for the prototype.
