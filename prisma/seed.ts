import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Initial Users
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: 'admin123',
            role: 'ADMIN',
            displayName: 'System Admin'
        }
    })
    await prisma.user.upsert({
        where: { username: 'chef' },
        update: {},
        create: {
            username: 'chef',
            password: 'chef123',
            role: 'CHEF',
            displayName: 'Head Chef'
        }
    })
    await prisma.user.upsert({
        where: { username: 'staff' },
        update: {},
        create: {
            username: 'staff',
            password: 'staff123',
            role: 'STAFF',
            displayName: 'Floor Staff'
        }
    })
    await prisma.user.upsert({
        where: { username: 'counter' },
        update: {},
        create: {
            username: 'counter',
            password: 'counter123',
            role: 'COUNTER',
            displayName: 'Counter Desk'
        }
    })

    // Initial Site Settings
    await prisma.siteSettings.upsert({
        where: { id: 'global' },
        update: {},
        create: {
            id: 'global',
            cafeName: "Daddy's Kitchen",
            cafeTagline: "Authentic Flavors",
            location: "Lakeside, Pokhara",
            openHours: "10am - 10pm",
            maxStaffUsers: 10
        }
    })

    console.log('Seeding completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
