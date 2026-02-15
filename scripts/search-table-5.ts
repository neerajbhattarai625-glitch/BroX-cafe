
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const table5 = await prisma.table.findFirst({ where: { number: "5" } })
    console.log('Table 5 found:', table5)

    const allTables = await prisma.table.findMany()
    console.log('All Table Numbers:', allTables.map(t => t.number))

    const count5 = await prisma.serviceRequest.count({ where: { tableNo: "5" } })
    console.log('Service Requests with Table 5:', count5)
}

main().catch(console.error).finally(() => prisma.$disconnect())
