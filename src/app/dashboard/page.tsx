import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    if (!user) {
        redirect("/login");
    }

    return <DashboardClient initialUser={user} />
}
