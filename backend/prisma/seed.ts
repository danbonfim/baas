import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } } as any)
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

const names = [
  'Isabella Santos', 'Valentina Costa', 'Sofia Oliveira', 'Laura Martins',
  'Helena Rodrigues', 'Manuela Silva', 'Alice Ferreira', 'Júlia Almeida',
]

async function main() {
  console.log('🌱 Seeding database...')

  const adminHash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@baas.com' },
    update: {},
    create: {
      email: 'admin@baas.com',
      passwordHash: adminHash,
      name: 'Admin BAAS',
      role: 'ADMIN',
      emailVerified: true,
    },
  })

  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    const email = `${name.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[̀-ͯ]/g, '')}@baas.com`
    const hash = await bcrypt.hash('senha123', 10)
    const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: hash,
        name,
        role: 'PROFESSIONAL',
        emailVerified: true,
      },
    })

    const pro = await prisma.professional.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        slug,
        tagline: 'Experiência premium para momentos especiais',
        description: 'Profissional verificada com experiência em acompanhamento de alto padrão. Discreta, elegante e pontual.',
        age: 24 + (i % 8),
        city: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba'][i % 4],
        state: ['SP', 'RJ', 'MG', 'PR'][i % 4],
        verified: i % 3 !== 0,
        premium: i % 2 === 0,
        online: i % 3 === 0,
        pricePerHour: [350, 450, 500, 280, 600, 380, 320, 550][i],
        kycStatus: 'APPROVED',
        rating: [4.8, 4.5, 4.9, 4.3, 4.7, 4.6, 4.4, 4.8][i],
        reviewCount: [127, 43, 89, 15, 76, 98, 32, 112][i],
        profileComplete: true,
        active: true,
      },
    })

    // Add categories, languages, services, availability
    const existingCats = await prisma.professionalCategory.count({ where: { professionalId: pro.id } })
    if (existingCats === 0) {
      await prisma.professionalCategory.createMany({
        data: ['Acompanhante', 'Social', 'Eventos'].map(name => ({ professionalId: pro.id, name })),
      })
      await prisma.professionalLanguage.createMany({
        data: ['Português', 'Inglês'].map(language => ({ professionalId: pro.id, language })),
      })
      await prisma.professionalService.createMany({
        data: ['Jantar', 'Viagens', 'Eventos Sociais', 'Cinema'].map(name => ({ professionalId: pro.id, name })),
      })
      await prisma.availability.createMany({
        data: [1, 2, 3, 4, 5].map(dayOfWeek => ({
          professionalId: pro.id,
          dayOfWeek,
          startTime: '18:00',
          endTime: '23:00',
        })),
      })
    }
  }

  const clientHash = await bcrypt.hash('cliente123', 10)
  const clientUser = await prisma.user.upsert({
    where: { email: 'cliente@baas.com' },
    update: {},
    create: {
      email: 'cliente@baas.com',
      passwordHash: clientHash,
      name: 'Cliente Teste',
      role: 'CLIENT',
      emailVerified: true,
    },
  })

  await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      credits: 5,
      balance: 120,
    },
  })

  console.log('✅ Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
