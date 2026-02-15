import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChefClient } from "./chef-client";

export const dynamic = "force-dynamic";

export default async function ChefPage() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("auth_token");

    if (!authCookie) {
        redirect("/login");
    }

    let user = null;

    // Basic Auth Check (Admins and Staff/Chef can access)
    if (authCookie.value === "admin_token") {
        user = { role: "ADMIN" };
    } else if (authCookie.value === "staff_token") {
        user = { role: "STAFF" };
    } else {
        // DB Check
        const dbUser = await prisma.user.findUnique({
            where: { id: authCookie.value },
            select: { role: true }
        });
        if (dbUser && (dbUser.role === 'STAFF' || dbUser.role === 'ADMIN')) {
            user = dbUser;
        }
    }

    if (!user) {
        redirect("/login");
    }

    return <ChefClient />
}
