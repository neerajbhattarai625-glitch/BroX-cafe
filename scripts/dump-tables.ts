
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const tables = await prisma.table.findMany()
    console.log('Tables:', JSON.stringify(tables, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
