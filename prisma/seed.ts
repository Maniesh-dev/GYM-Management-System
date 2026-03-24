import 'dotenv/config'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
    const gym = await prisma.gym.create({
        data: {
            name: 'Fight Club Jaipur',
            phone: '9876543210',
            address: 'Vaishali Nagar, Jaipur',
        },
    })

    await prisma.plan.createMany({
        data: [
            { gymId: gym.id, name: 'Monthly', durationDays: 30, price: 1500 },
            { gymId: gym.id, name: 'Quarterly', durationDays: 90, price: 4000 },
            { gymId: gym.id, name: 'Annual', durationDays: 365, price: 14000 },
        ],
    })

    await prisma.user.create({
        data: {
            name: 'Maniesh Sanwal',
            email: 'owner@fightclub.com',
            passwordHash: await bcrypt.hash('maniesh@123', 10),
            role: 'OWNER',
            gymId: gym.id,
        },
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())