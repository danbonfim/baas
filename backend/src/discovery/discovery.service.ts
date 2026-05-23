import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

/**
 * Haversine distance in km between two coordinates.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface SearchFilters {
  city?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  minAge?: number
  maxAge?: number
  language?: string
  service?: string
  verified?: boolean
  online?: boolean
  minRating?: number
  hasContent?: boolean
  hasSubscription?: boolean
  sortBy?: 'rating' | 'price-asc' | 'price-desc' | 'newest' | 'popular' | 'distance' | 'relevance'
  page?: number
  limit?: number
}

@Injectable()
export class DiscoveryService {
  constructor(private prisma: PrismaService) {}

  // ─── 1. Advanced search with all filters ─────────────────

  async search(filters: SearchFilters, viewerUserId?: string) {
    const { page = 1, limit = 20, sortBy = 'rating' } = filters
    const skip = (page - 1) * limit

    const where: any = { active: true }
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' }
    if (filters.verified !== undefined) where.verified = filters.verified
    if (filters.online !== undefined) where.online = filters.online
    if (filters.minRating) where.rating = { gte: filters.minRating }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.pricePerHour = {}
      if (filters.minPrice !== undefined) where.pricePerHour.gte = filters.minPrice
      if (filters.maxPrice !== undefined) where.pricePerHour.lte = filters.maxPrice
    }
    if (filters.minAge !== undefined || filters.maxAge !== undefined) {
      where.age = {}
      if (filters.minAge !== undefined) where.age.gte = filters.minAge
      if (filters.maxAge !== undefined) where.age.lte = filters.maxAge
    }
    if (filters.category) {
      where.categories = { some: { name: { contains: filters.category, mode: 'insensitive' } } }
    }
    if (filters.language) {
      where.languages = { some: { language: { contains: filters.language, mode: 'insensitive' } } }
    }
    if (filters.service) {
      where.services = { some: { name: { contains: filters.service, mode: 'insensitive' } } }
    }
    if (filters.hasContent) {
      where.premiumContent = { some: { visible: true } }
    }
    if (filters.hasSubscription) {
      where.subscriptionEnabled = true
    }

    // Exclude professionals who have blocked the current viewer (if logged in as client)
    if (viewerUserId) {
      const client = await this.prisma.client.findUnique({ where: { userId: viewerUserId } })
      if (client) {
        where.NOT = { blockedClients: { some: { clientId: client.id } } }
      }
    }

    const orderBy: any =
      sortBy === 'price-asc' ? { pricePerHour: 'asc' }
      : sortBy === 'price-desc' ? { pricePerHour: 'desc' }
      : sortBy === 'newest' ? { createdAt: 'desc' }
      : sortBy === 'popular' ? { viewCount: 'desc' }
      : { rating: 'desc' }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.professional.count({ where }),
      this.prisma.professional.findMany({
        where,
        include: {
          user: { select: { name: true, avatar: true } },
          photos: { where: { approved: true }, orderBy: { order: 'asc' }, take: 3 },
          categories: true,
          languages: true,
          boosts: { where: { status: 'ACTIVE', endsAt: { gt: new Date() } }, take: 1 },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ])

    // Apply boost multiplier sorting at app level for active boosts
    const boostSorted = items.sort((a, b) => {
      const aMul = a.boosts[0]?.multiplier ?? 1
      const bMul = b.boosts[0]?.multiplier ?? 1
      return bMul - aMul
    })

    return {
      items: boostSorted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters,
    }
  }

  // ─── 2. Proximity-based search (Haversine) ───────────────

  async searchNearby(
    lat: number,
    lng: number,
    radiusKm: number = 10,
    filters: SearchFilters = {},
    viewerUserId?: string,
  ) {
    if (radiusKm > 100) throw new BadRequestException('Raio máximo: 100km')

    // Build initial where without distance filter (do that in memory)
    const where: any = { active: true, lat: { not: null }, lng: { not: null } }
    if (filters.verified !== undefined) where.verified = filters.verified
    if (filters.online !== undefined) where.online = filters.online
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.pricePerHour = {}
      if (filters.minPrice !== undefined) where.pricePerHour.gte = filters.minPrice
      if (filters.maxPrice !== undefined) where.pricePerHour.lte = filters.maxPrice
    }

    // Quick bounding-box pre-filter (≈ to avoid Haversine on entire DB)
    const latDelta = radiusKm / 111
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180))
    where.lat = { gte: lat - latDelta, lte: lat + latDelta }
    where.lng = { gte: lng - lngDelta, lte: lng + lngDelta }

    if (viewerUserId) {
      const client = await this.prisma.client.findUnique({ where: { userId: viewerUserId } })
      if (client) {
        where.NOT = { blockedClients: { some: { clientId: client.id } } }
      }
    }

    const candidates = await this.prisma.professional.findMany({
      where,
      include: {
        user: { select: { name: true, avatar: true } },
        photos: { where: { approved: true }, orderBy: { order: 'asc' }, take: 1 },
        categories: true,
        boosts: { where: { status: 'ACTIVE', endsAt: { gt: new Date() } }, take: 1 },
      },
      take: 200,
    })

    const withDistance = candidates
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({
        ...p,
        distanceKm: Number(haversineKm(lat, lng, p.lat!, p.lng!).toFixed(2)),
      }))
      .filter((p) => p.distanceKm <= radiusKm)
      .sort((a, b) => {
        // Boosted profs first
        const aMul = a.boosts[0]?.multiplier ?? 1
        const bMul = b.boosts[0]?.multiplier ?? 1
        if (aMul !== bMul) return bMul - aMul
        return a.distanceKm - b.distanceKm
      })

    return {
      items: withDistance,
      total: withDistance.length,
      radiusKm,
      center: { lat, lng },
    }
  }

  // ─── 3. "Available Now" — online + accepting bookings ────

  async availableNow(filters: SearchFilters & { lat?: number; lng?: number } = {}) {
    const where: any = { active: true, online: true }
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' }
    if (filters.maxPrice) where.pricePerHour = { lte: filters.maxPrice }
    if (filters.verified !== undefined) where.verified = filters.verified

    const items = await this.prisma.professional.findMany({
      where,
      include: {
        user: { select: { name: true, avatar: true } },
        photos: { where: { approved: true }, orderBy: { order: 'asc' }, take: 1 },
        categories: true,
      },
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
      take: 50,
    })

    // If location provided, attach distance
    if (filters.lat != null && filters.lng != null) {
      return items
        .map((p) => ({
          ...p,
          distanceKm: p.lat != null && p.lng != null
            ? Number(haversineKm(filters.lat!, filters.lng!, p.lat, p.lng).toFixed(2))
            : null,
        }))
        .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999))
    }
    return items
  }

  // ─── 4. Match by client preferences ──────────────────────

  async getPreferences(userId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId } })
    if (!client) throw new ForbiddenException('Apenas clientes')
    let prefs = await this.prisma.clientPreference.findUnique({ where: { clientId: client.id } })
    if (!prefs) {
      prefs = await this.prisma.clientPreference.create({ data: { clientId: client.id } })
    }
    return prefs
  }

  async setPreferences(userId: string, data: Partial<{
    ageMin: number
    ageMax: number
    preferredCities: string[]
    preferredCategories: string[]
    preferredLanguages: string[]
    preferredServices: string[]
    maxPricePerHour: number
    minRating: number
    onlyVerified: boolean
    preferOnline: boolean
  }>) {
    const client = await this.prisma.client.findUnique({ where: { userId } })
    if (!client) throw new ForbiddenException('Apenas clientes')
    return this.prisma.clientPreference.upsert({
      where: { clientId: client.id },
      create: { clientId: client.id, ...data },
      update: data,
    })
  }

  /**
   * Score-based matching: ranks professionals by how well they match client preferences.
   */
  async matchForMe(userId: string, limit = 20) {
    const client = await this.prisma.client.findUnique({ where: { userId } })
    if (!client) throw new ForbiddenException('Apenas clientes')

    const prefs = await this.prisma.clientPreference.findUnique({ where: { clientId: client.id } })
    if (!prefs) {
      // Fallback: top rated
      return this.search({ sortBy: 'rating', limit })
    }

    const where: any = { active: true }
    if (prefs.onlyVerified) where.verified = true
    if (prefs.maxPricePerHour) where.pricePerHour = { lte: prefs.maxPricePerHour }
    if (prefs.minRating) where.rating = { gte: prefs.minRating }
    if (prefs.ageMin != null || prefs.ageMax != null) {
      where.age = {}
      if (prefs.ageMin != null) where.age.gte = prefs.ageMin
      if (prefs.ageMax != null) where.age.lte = prefs.ageMax
    }
    if (prefs.preferredCities.length > 0) {
      where.city = { in: prefs.preferredCities }
    }

    where.NOT = { blockedClients: { some: { clientId: client.id } } }

    const candidates = await this.prisma.professional.findMany({
      where,
      include: {
        user: { select: { name: true, avatar: true } },
        photos: { where: { approved: true }, orderBy: { order: 'asc' }, take: 1 },
        categories: true,
        languages: true,
        services: true,
        boosts: { where: { status: 'ACTIVE', endsAt: { gt: new Date() } }, take: 1 },
      },
      take: 200,
    })

    // Compute match score for each candidate
    const scored = candidates.map((p) => {
      let score = 0
      // Rating weight
      score += p.rating * 20
      // Verified bonus
      if (p.verified) score += 30
      // Online bonus
      if (p.online && prefs.preferOnline) score += 25
      // Category match
      if (prefs.preferredCategories.length > 0) {
        const catMatches = p.categories.filter((c) =>
          prefs.preferredCategories.includes(c.name),
        ).length
        score += catMatches * 15
      }
      // Language match
      if (prefs.preferredLanguages.length > 0) {
        const langMatches = p.languages.filter((l) =>
          prefs.preferredLanguages.includes(l.language),
        ).length
        score += langMatches * 10
      }
      // Service match
      if (prefs.preferredServices.length > 0) {
        const svcMatches = p.services.filter((s) =>
          prefs.preferredServices.includes(s.name),
        ).length
        score += svcMatches * 15
      }
      // Boost multiplier
      const mul = p.boosts[0]?.multiplier ?? 1
      score *= mul

      return { ...p, matchScore: Number(score.toFixed(1)) }
    })

    scored.sort((a, b) => b.matchScore - a.matchScore)

    return { items: scored.slice(0, limit), total: scored.length, preferences: prefs }
  }

  // ─── 5. Travel Mode ──────────────────────────────────────

  async enableTravelMode(
    userId: string,
    data: { city: string; state: string; country?: string; lat?: number; lng?: number; startsAt: string; endsAt: string; notes?: string },
  ) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')

    const startsAt = new Date(data.startsAt)
    const endsAt = new Date(data.endsAt)
    if (endsAt <= startsAt) throw new BadRequestException('Data final deve ser depois da inicial')
    if (endsAt < new Date()) throw new BadRequestException('Data final no passado')

    return this.prisma.travelMode.create({
      data: {
        professionalId: pro.id,
        city: data.city,
        state: data.state,
        country: data.country || 'BR',
        lat: data.lat,
        lng: data.lng,
        startsAt,
        endsAt,
        notes: data.notes,
      },
    })
  }

  async disableTravelMode(userId: string, travelId: string) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')

    const tm = await this.prisma.travelMode.findUnique({ where: { id: travelId } })
    if (!tm || tm.professionalId !== pro.id) throw new NotFoundException('Travel mode não encontrado')

    return this.prisma.travelMode.update({ where: { id: travelId }, data: { active: false } })
  }

  async myTravelModes(userId: string) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) return []
    return this.prisma.travelMode.findMany({
      where: { professionalId: pro.id },
      orderBy: { startsAt: 'desc' },
    })
  }

  /**
   * Public: find professionals traveling TO a city (visible to clients in that city).
   */
  async travelingTo(city: string) {
    const now = new Date()
    return this.prisma.travelMode.findMany({
      where: {
        active: true,
        city: { contains: city, mode: 'insensitive' },
        startsAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, // started in last 7 days
        endsAt: { gte: now },
      },
      include: {
        professional: {
          include: {
            user: { select: { name: true, avatar: true } },
            photos: { where: { approved: true }, orderBy: { order: 'asc' }, take: 1 },
          },
        },
      },
      orderBy: { startsAt: 'asc' },
    })
  }

  // ─── 6. Recommendations ──────────────────────────────────

  /**
   * "Clients who booked X also booked Y" — collaborative filtering.
   */
  async recommendationsFor(userId: string, limit = 10) {
    const client = await this.prisma.client.findUnique({ where: { userId } })
    if (!client) return []

    // Step 1: get pros this client booked
    const myBookings = await this.prisma.booking.findMany({
      where: { clientId: client.id, status: { in: ['COMPLETED', 'CONFIRMED'] } },
      select: { professionalId: true },
    })
    const myProIds = new Set(myBookings.map((b) => b.professionalId))

    if (myProIds.size === 0) {
      // Fallback: return top-rated pros the user hasn't seen
      return this.prisma.professional.findMany({
        where: { active: true, verified: true },
        orderBy: { rating: 'desc' },
        take: limit,
        include: {
          user: { select: { name: true, avatar: true } },
          photos: { where: { approved: true }, take: 1 },
        },
      })
    }

    // Step 2: find other clients who booked the same pros
    const otherClients = await this.prisma.booking.findMany({
      where: {
        professionalId: { in: [...myProIds] },
        clientId: { not: client.id },
        status: 'COMPLETED',
      },
      select: { clientId: true },
      distinct: ['clientId'],
      take: 100,
    })
    const otherClientIds = otherClients.map((c) => c.clientId)

    if (otherClientIds.length === 0) {
      return this.prisma.professional.findMany({
        where: { active: true, id: { notIn: [...myProIds] } },
        orderBy: { rating: 'desc' },
        take: limit,
        include: { user: { select: { name: true, avatar: true } }, photos: { take: 1 } },
      })
    }

    // Step 3: what other pros did those clients book? (excluding mine)
    const otherBookings = await this.prisma.booking.findMany({
      where: {
        clientId: { in: otherClientIds },
        professionalId: { notIn: [...myProIds] },
        status: 'COMPLETED',
      },
      select: { professionalId: true },
    })

    // Step 4: count occurrences
    const counts = new Map<string, number>()
    for (const b of otherBookings) counts.set(b.professionalId, (counts.get(b.professionalId) ?? 0) + 1)
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
    const ids = ranked.map(([id]) => id)

    if (ids.length === 0) return []

    const pros = await this.prisma.professional.findMany({
      where: { id: { in: ids }, active: true },
      include: { user: { select: { name: true, avatar: true } }, photos: { take: 1 }, categories: true },
    })

    // Re-attach scores
    return pros.map((p) => ({ ...p, recommendationScore: counts.get(p.id) ?? 0 })).sort((a, b) => b.recommendationScore - a.recommendationScore)
  }

  // ─── 7. Online status toggle ─────────────────────────────

  async setOnlineStatus(userId: string, online: boolean) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')

    return this.prisma.professional.update({
      where: { id: pro.id },
      data: { online },
      select: { online: true },
    })
  }

  // ─── 8. Update location ──────────────────────────────────

  async updateLocation(userId: string, lat: number, lng: number) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('Coordenadas inválidas')
    }

    return this.prisma.professional.update({
      where: { id: pro.id },
      data: { lat, lng },
      select: { lat: true, lng: true },
    })
  }
}
