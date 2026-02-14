import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("auth_token");
    let user = null;

    if (authCookie) {
        // Simple mock check first (legacy)
        if (authCookie.value === "admin_token") user = { role: "ADMIN", username: "admin" };
        else if (authCookie.value === "staff_token") user = { role: "STAFF", username: "staff" };
        else {
            // DB Check
            const dbUser = await prisma.user.findUnique({
                where: { id: authCookie.value },
                select: { role: true, username: true } // Only need role
            });
            if (dbUser) user = dbUser;
        }
    }

    // If no user found, DashboardClient won't show tabs (or could redirect here if we wanted)
    // But client will handle logout anyway.

    return <DashboardClient initialUser={user} />
}
