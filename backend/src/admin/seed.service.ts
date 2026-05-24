import { Injectable, ForbiddenException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import * as bcrypt from 'bcryptjs'

interface DemoProfile {
  name: string
  email: string
  city: string
  state: string
  lat: number
  lng: number
  age: number
  pricePerHour: number
  tagline: string
  description: string
  rating: number
  reviewCount: number
  verified: boolean
  kycLevel: 'NONE' | 'EMAIL' | 'DOCUMENT' | 'BIOMETRIC' | 'FULL'
  online: boolean
  premium: boolean
  monthlySubscriptionPrice?: number
  subscriptionEnabled?: boolean
  categories: string[]
  languages: string[]
  services: string[]
  avatarUrl: string
  photos: string[]
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    name: 'Isabela Costa',
    email: 'isabela@demo.baas.app',
    city: 'São Paulo', state: 'SP',
    lat: -23.5505, lng: -46.6333,
    age: 26, pricePerHour: 450,
    tagline: 'Acompanhante VIP — discreta e sofisticada',
    description: 'Profissional há 4 anos, atendimentos em hotel 5 estrelas. Idiomas: PT, EN, ES. Preferência por encontros longos.',
    rating: 4.9, reviewCount: 47,
    verified: true, kycLevel: 'BIOMETRIC',
    online: true, premium: true,
    monthlySubscriptionPrice: 99, subscriptionEnabled: true,
    categories: ['Acompanhante VIP', 'Eventos sociais'],
    languages: ['Português', 'Inglês', 'Espanhol'],
    services: ['Jantar', 'Viagem', 'Eventos'],
    avatarUrl: 'https://i.pravatar.cc/300?img=47',
    photos: ['https://i.pravatar.cc/600?img=47', 'https://i.pravatar.cc/600?img=48'],
  },
  {
    name: 'Camila Andrade',
    email: 'camila@demo.baas.app',
    city: 'Rio de Janeiro', state: 'RJ',
    lat: -22.9068, lng: -43.1729,
    age: 24, pricePerHour: 380,
    tagline: 'Carioca autêntica · Praia, samba e boa conversa',
    description: 'Atendo na zona sul do Rio. Modelo profissional, formada em comunicação. Disponível para eventos e viagens.',
    rating: 4.8, reviewCount: 32,
    verified: true, kycLevel: 'FULL',
    online: true, premium: false,
    monthlySubscriptionPrice: 79, subscriptionEnabled: true,
    categories: ['Acompanhante', 'Modelo'],
    languages: ['Português', 'Inglês'],
    services: ['Jantar', 'Praia', 'Eventos'],
    avatarUrl: 'https://i.pravatar.cc/300?img=49',
    photos: ['https://i.pravatar.cc/600?img=49', 'https://i.pravatar.cc/600?img=20'],
  },
  {
    name: 'Marina Vieira',
    email: 'marina@demo.baas.app',
    city: 'Belo Horizonte', state: 'MG',
    lat: -19.9167, lng: -43.9345,
    age: 28, pricePerHour: 320,
    tagline: 'Mineira sensual · Massagem terapêutica',
    description: 'Especialista em massagem relaxante e terapêutica. Ambiente discreto em região hoteleira. Atendimento de qualidade.',
    rating: 4.9, reviewCount: 89,
    verified: true, kycLevel: 'BIOMETRIC',
    online: false, premium: true,
    categories: ['Massagista', 'Terapeuta'],
    languages: ['Português'],
    services: ['Massagem relaxante', 'Massagem tântrica'],
    avatarUrl: 'https://i.pravatar.cc/300?img=44',
    photos: ['https://i.pravatar.cc/600?img=44'],
  },
  {
    name: 'Beatriz Lima',
    email: 'beatriz@demo.baas.app',
    city: 'Brasília', state: 'DF',
    lat: -15.7942, lng: -47.8822,
    age: 23, pricePerHour: 500,
    tagline: 'Universitária · Discrição absoluta',
    description: 'Estudante de direito, ambiente discreto e seguro. Atendo apenas executivos e diplomatas. Referências obrigatórias.',
    rating: 5.0, reviewCount: 15,
    verified: true, kycLevel: 'FULL',
    online: true, premium: true,
    monthlySubscriptionPrice: 149, subscriptionEnabled: true,
    categories: ['Universitária', 'Acompanhante VIP'],
    languages: ['Português', 'Inglês', 'Francês'],
    services: ['Jantar executivo', 'Eventos diplomáticos'],
    avatarUrl: 'https://i.pravatar.cc/300?img=45',
    photos: ['https://i.pravatar.cc/600?img=45', 'https://i.pravatar.cc/600?img=46'],
  },
  {
    name: 'Ana Carolina',
    email: 'anacarolina@demo.baas.app',
    city: 'Curitiba', state: 'PR',
    lat: -25.4284, lng: -49.2733,
    age: 30, pricePerHour: 280,
    tagline: 'Madura experiente · Conversa inteligente',
    description: 'Profissional há 8 anos. Atendo executivos com sofisticação. Conversa fluida, presença marcante. Atendo em hotéis 4 e 5 estrelas.',
    rating: 4.7, reviewCount: 124,
    verified: true, kycLevel: 'BIOMETRIC',
    online: true, premium: false,
    categories: ['Madura', 'Acompanhante'],
    languages: ['Português', 'Inglês'],
    services: ['Jantar', 'Eventos', 'Viagem'],
    avatarUrl: 'https://i.pravatar.cc/300?img=23',
    photos: ['https://i.pravatar.cc/600?img=23'],
  },
  {
    name: 'Larissa Mendes',
    email: 'larissa@demo.baas.app',
    city: 'São Paulo', state: 'SP',
    lat: -23.5629, lng: -46.6544,
    age: 22, pricePerHour: 220,
    tagline: 'Jovem e divertida · Atendimento personalizado',
    description: 'Iniciando na profissão, tratamento carinhoso e atencioso. Disponível para encontros mais longos com desconto.',
    rating: 4.5, reviewCount: 8,
    verified: false, kycLevel: 'EMAIL',
    online: true, premium: false,
    categories: ['Jovem', 'Iniciante'],
    languages: ['Português'],
    services: ['Encontro casual', 'Massagem'],
    avatarUrl: 'https://i.pravatar.cc/300?img=24',
    photos: ['https://i.pravatar.cc/600?img=24'],
  },
  {
    name: 'Patrícia Souza',
    email: 'patricia@demo.baas.app',
    city: 'Porto Alegre', state: 'RS',
    lat: -30.0346, lng: -51.2177,
    age: 27, pricePerHour: 350,
    tagline: 'Gaúcha elegante · Acompanhante de eventos',
    description: 'Especialista em acompanhar eventos corporativos e sociais. Discrição e elegância. Atendo em Porto Alegre e região.',
    rating: 4.8, reviewCount: 56,
    verified: true, kycLevel: 'DOCUMENT',
    online: false, premium: false,
    categories: ['Acompanhante', 'Eventos'],
    languages: ['Português', 'Espanhol'],
    services: ['Eventos corporativos', 'Jantar'],
    avatarUrl: 'https://i.pravatar.cc/300?img=25',
    photos: ['https://i.pravatar.cc/600?img=25'],
  },
  {
    name: 'Juliana Ferreira',
    email: 'juliana@demo.baas.app',
    city: 'Salvador', state: 'BA',
    lat: -12.9714, lng: -38.5014,
    age: 25, pricePerHour: 300,
    tagline: 'Baiana tropical · Energia contagiante',
    description: 'Baiana de verdade, alegre e receptiva. Atendo turistas e locais. Falo inglês e espanhol fluentemente.',
    rating: 4.9, reviewCount: 73,
    verified: true, kycLevel: 'BIOMETRIC',
    online: true, premium: false,
    monthlySubscriptionPrice: 59, subscriptionEnabled: true,
    categories: ['Acompanhante', 'Turismo'],
    languages: ['Português', 'Inglês', 'Espanhol'],
    services: ['Tour pela cidade', 'Praia', 'Jantar'],
    avatarUrl: 'https://i.pravatar.cc/300?img=26',
    photos: ['https://i.pravatar.cc/600?img=26', 'https://i.pravatar.cc/600?img=27'],
  },
  {
    name: 'Renata Oliveira',
    email: 'renata@demo.baas.app',
    city: 'Florianópolis', state: 'SC',
    lat: -27.5954, lng: -48.5480,
    age: 29, pricePerHour: 400,
    tagline: 'Catarinense premium · Atendimento em Floripa',
    description: 'Modelo profissional, atendo executivos em viagem para Floripa. Conhecimento profundo da cidade e melhores experiências.',
    rating: 4.8, reviewCount: 41,
    verified: true, kycLevel: 'FULL',
    online: true, premium: true,
    monthlySubscriptionPrice: 89, subscriptionEnabled: true,
    categories: ['Modelo', 'Acompanhante VIP'],
    languages: ['Português', 'Inglês'],
    services: ['Tour pela ilha', 'Jantar', 'Eventos'],
    avatarUrl: 'https://i.pravatar.cc/300?img=28',
    photos: ['https://i.pravatar.cc/600?img=28'],
  },
  {
    name: 'Vitória Almeida',
    email: 'vitoria@demo.baas.app',
    city: 'Recife', state: 'PE',
    lat: -8.0476, lng: -34.8770,
    age: 24, pricePerHour: 250,
    tagline: 'Pernambucana doce · Atendimento humanizado',
    description: 'Acolhedora e atenciosa. Atendo em ambiente discreto no Recife Antigo. Massagem relaxante incluída em encontros longos.',
    rating: 4.6, reviewCount: 19,
    verified: true, kycLevel: 'DOCUMENT',
    online: false, premium: false,
    categories: ['Acompanhante', 'Massagista'],
    languages: ['Português'],
    services: ['Massagem', 'Encontro', 'Jantar'],
    avatarUrl: 'https://i.pravatar.cc/300?img=29',
    photos: ['https://i.pravatar.cc/600?img=29'],
  },
]

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * One-shot demo data seeder. Idempotent: skips profiles that already exist by email.
   * Protected by ADMIN_SEED_SECRET env var (passed via X-Admin-Secret header).
   */
  async seedDemoData(providedSecret: string) {
    const secret = process.env.ADMIN_SEED_SECRET
    if (!secret) throw new ForbiddenException('Seed disabled: ADMIN_SEED_SECRET not configured')
    if (providedSecret !== secret) throw new ForbiddenException('Invalid admin secret')

    const passwordHash = await bcrypt.hash('Demo123!Senha', 10)
    let created = 0
    let skipped = 0
    const results: any[] = []

    for (const profile of DEMO_PROFILES) {
      // Skip if email already exists
      const existing = await this.prisma.user.findUnique({ where: { email: profile.email } })
      if (existing) {
        skipped++
        results.push({ email: profile.email, status: 'skipped' })
        continue
      }

      try {
        const slug = profile.name
          .toLowerCase()
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

        const user = await this.prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            passwordHash,
            phone: '+5511999000000',
            avatar: profile.avatarUrl,
            role: 'PROFESSIONAL',
            emailVerified: true,
          },
        })

        const pro = await this.prisma.professional.create({
          data: {
            userId: user.id,
            slug,
            tagline: profile.tagline,
            description: profile.description,
            age: profile.age,
            city: profile.city,
            state: profile.state,
            country: 'BR',
            lat: profile.lat,
            lng: profile.lng,
            verified: profile.verified,
            premium: profile.premium,
            online: profile.online,
            active: true,
            profileComplete: true,
            pricePerHour: profile.pricePerHour,
            kycStatus: profile.verified ? 'APPROVED' : 'PENDING',
            kycLevel: profile.kycLevel,
            rating: profile.rating,
            reviewCount: profile.reviewCount,
            viewCount: Math.floor(Math.random() * 500),
            monthlySubscriptionPrice: profile.monthlySubscriptionPrice,
            subscriptionEnabled: profile.subscriptionEnabled ?? false,
            subscriberCount: profile.subscriptionEnabled ? Math.floor(Math.random() * 30) : 0,
            totalEarnings: profile.reviewCount * profile.pricePerHour * 0.85,
            totalTipsReceived: Math.floor(Math.random() * 2000),
          },
        })

        // Categories
        for (const name of profile.categories) {
          await this.prisma.professionalCategory.create({ data: { professionalId: pro.id, name } })
        }
        // Languages
        for (const language of profile.languages) {
          await this.prisma.professionalLanguage.create({ data: { professionalId: pro.id, language } })
        }
        // Services
        for (const name of profile.services) {
          await this.prisma.professionalService.create({ data: { professionalId: pro.id, name } })
        }
        // Photos
        for (let i = 0; i < profile.photos.length; i++) {
          await this.prisma.photo.create({
            data: {
              professionalId: pro.id,
              url: profile.photos[i],
              thumbnailUrl: profile.photos[i],
              order: i,
              approved: true,
            },
          })
        }
        // Availability — weekdays 18:00-23:59
        for (let day = 1; day <= 7; day++) {
          await this.prisma.availability.create({
            data: { professionalId: pro.id, dayOfWeek: day, startTime: '18:00', endTime: '23:59' },
          })
        }

        created++
        results.push({ email: profile.email, slug, status: 'created' })
        this.logger.log(`Created demo profile: ${profile.name} (${slug})`)
      } catch (err: any) {
        results.push({ email: profile.email, status: 'error', error: err.message })
        this.logger.error(`Failed to create ${profile.name}: ${err.message}`)
      }
    }

    return {
      total: DEMO_PROFILES.length,
      created,
      skipped,
      results,
      defaultPassword: 'Demo123!Senha',
      hint: 'Use any of these emails with the password to login as a demo professional.',
    }
  }

  /**
   * Create an admin account. Protected by admin secret.
   * Returns access token + credentials.
   */
  async createAdmin(providedSecret: string, email: string, name: string, password: string) {
    const secret = process.env.ADMIN_SEED_SECRET
    if (!secret) throw new ForbiddenException('Disabled: ADMIN_SEED_SECRET not configured')
    if (providedSecret !== secret) throw new ForbiddenException('Invalid admin secret')

    const existing = await this.prisma.user.findUnique({ where: { email } })
    if (existing) {
      // Promote existing user to admin
      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: { role: 'ADMIN' },
      })
      return { promoted: true, userId: updated.id, email: updated.email, role: updated.role }
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await this.prisma.user.create({
      data: { email, name, passwordHash, role: 'ADMIN', emailVerified: true },
    })
    return { created: true, userId: user.id, email: user.email, role: user.role }
  }

  /**
   * Wipe all demo profiles (by email pattern). Also requires admin secret.
   */
  async wipeDemoData(providedSecret: string) {
    const secret = process.env.ADMIN_SEED_SECRET
    if (!secret) throw new ForbiddenException('Wipe disabled: ADMIN_SEED_SECRET not configured')
    if (providedSecret !== secret) throw new ForbiddenException('Invalid admin secret')

    const result = await this.prisma.user.deleteMany({
      where: { email: { endsWith: '@demo.baas.app' } },
    })
    return { deleted: result.count }
  }
}
