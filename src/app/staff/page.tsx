import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StaffClient } from "./staff-client";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("auth_token");

    if (!authCookie) {
        redirect("/login");
    }

    let user = null;

    // Auth Check for Staff role
    if (authCookie.value === "staff_token") {
        user = { role: "STAFF" };
    } else if (authCookie.value === "admin_token") {
        user = { role: "ADMIN" }; // Admins can also access
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

    return <StaffClient />
}
