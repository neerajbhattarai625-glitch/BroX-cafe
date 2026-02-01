require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Checking database connection...')
    try {
        const categories = await prisma.category.findMany()
        console.log('--- DB CHECK RESULT ---')
        console.log(`Categories count: ${categories.length}`)
        if (categories.length > 0) {
            console.log('First category:', categories[0].nameEn)
            console.log('SUCCESS: Database is populated.')
        } else {
            console.log('WARNING: Database is connected but EMPTY.')
        }
    } catch (e) {
        console.error('--- CONNECTION ERROR ---')
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
