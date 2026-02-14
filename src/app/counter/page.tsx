import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CounterClient } from "./counter-client";

export const dynamic = "force-dynamic";

export default async function CounterPage() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("auth_token");

    if (!authCookie) {
        redirect("/login");
    }

    let user = null;

    // Auth Check
    if (authCookie.value === "counter_token") {
        user = { role: "COUNTER" };
    } else if (authCookie.value === "admin_token") {
        user = { role: "ADMIN" }; // Admins can also access
    } else {
        // DB Check
        const dbUser = await prisma.user.findUnique({
            where: { id: authCookie.value },
            select: { role: true }
        });
        if (dbUser && (dbUser.role === 'COUNTER' || dbUser.role === 'ADMIN')) {
            user = dbUser;
        }
    }

    if (!user) {
        redirect("/login"); // Or unauthorized page
    }

    return <CounterClient initialUser={user} />
}
