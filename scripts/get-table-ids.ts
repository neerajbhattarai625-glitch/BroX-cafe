
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const tables = await prisma.table.findMany({
        orderBy: { number: 'asc' }
    })

    console.log("Table IDs:")
    tables.forEach(t => {
        console.log(`Table ${t.number}: ${t.id}`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
