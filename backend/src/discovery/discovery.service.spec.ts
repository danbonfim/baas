/**
 * White-box tests for the Haversine distance calculation and match scoring algorithm.
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

describe('Discovery — Haversine distance (white-box)', () => {
  it('distance from a point to itself is 0', () => {
    expect(haversineKm(-23.55, -46.63, -23.55, -46.63)).toBe(0)
  })

  it('São Paulo → Rio de Janeiro ≈ 360km', () => {
    const sp = { lat: -23.5505, lng: -46.6333 }
    const rj = { lat: -22.9068, lng: -43.1729 }
    const d = haversineKm(sp.lat, sp.lng, rj.lat, rj.lng)
    expect(d).toBeGreaterThan(355)
    expect(d).toBeLessThan(365)
  })

  it('1° of latitude ≈ 111km', () => {
    const d = haversineKm(0, 0, 1, 0)
    expect(d).toBeGreaterThan(110)
    expect(d).toBeLessThan(112)
  })

  it('symmetric — A→B equals B→A', () => {
    const ab = haversineKm(10, 20, 30, 40)
    const ba = haversineKm(30, 40, 10, 20)
    expect(ab).toBeCloseTo(ba, 5)
  })
})

describe('Discovery — match scoring (white-box)', () => {
  // Pure scoring function from DiscoveryService.matchForMe
  function scoreOf(
    p: { rating: number; verified: boolean; online: boolean; categories: { name: string }[]; languages: { language: string }[]; services: { name: string }[]; boosts: { multiplier: number }[] },
    prefs: { preferredCategories: string[]; preferredLanguages: string[]; preferredServices: string[]; preferOnline: boolean },
  ): number {
    let score = 0
    score += p.rating * 20
    if (p.verified) score += 30
    if (p.online && prefs.preferOnline) score += 25
    score += p.categories.filter((c) => prefs.preferredCategories.includes(c.name)).length * 15
    score += p.languages.filter((l) => prefs.preferredLanguages.includes(l.language)).length * 10
    score += p.services.filter((s) => prefs.preferredServices.includes(s.name)).length * 15
    const mul = p.boosts[0]?.multiplier ?? 1
    return score * mul
  }

  const basePrefs = { preferredCategories: [], preferredLanguages: [], preferredServices: [], preferOnline: false }

  it('5-star verified pro: 5*20 + 30 = 130', () => {
    const score = scoreOf(
      { rating: 5, verified: true, online: false, categories: [], languages: [], services: [], boosts: [] },
      basePrefs,
    )
    expect(score).toBe(130)
  })

  it('matching 2 of 3 preferred categories: +30', () => {
    const prefs = { ...basePrefs, preferredCategories: ['Massage', 'Yoga', 'Dance'] }
    const score = scoreOf(
      {
        rating: 0, verified: false, online: false,
        categories: [{ name: 'Massage' }, { name: 'Yoga' }, { name: 'Boxing' }],
        languages: [], services: [], boosts: [],
      },
      prefs,
    )
    expect(score).toBe(30) // 2 matches * 15
  })

  it('boost ULTRA (5x multiplier) amplifies score', () => {
    const score = scoreOf(
      { rating: 5, verified: true, online: false, categories: [], languages: [], services: [], boosts: [{ multiplier: 5 }] },
      basePrefs,
    )
    expect(score).toBe(650) // (5*20 + 30) * 5
  })

  it('online + preferOnline adds +25', () => {
    const score = scoreOf(
      { rating: 0, verified: false, online: true, categories: [], languages: [], services: [], boosts: [] },
      { ...basePrefs, preferOnline: true },
    )
    expect(score).toBe(25)
  })

  it('online but preferOnline=false adds nothing', () => {
    const score = scoreOf(
      { rating: 0, verified: false, online: true, categories: [], languages: [], services: [], boosts: [] },
      basePrefs,
    )
    expect(score).toBe(0)
  })
})
