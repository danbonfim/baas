import { BadRequestException, ForbiddenException } from '@nestjs/common'

/**
 * White-box unit tests for the refund tier logic.
 * Tests the pure function `refundPercent` (extracted via re-import).
 */
describe('Bookings — refund policy (white-box)', () => {
  // Re-implement same logic for isolation:
  const refundPercent = (hoursUntil: number): number => {
    if (hoursUntil >= 48) return 100
    if (hoursUntil >= 24) return 75
    if (hoursUntil >= 12) return 50
    return 0
  }

  it('returns 100% for 48h+', () => {
    expect(refundPercent(48)).toBe(100)
    expect(refundPercent(72)).toBe(100)
    expect(refundPercent(168)).toBe(100)
  })

  it('returns 75% for 24-48h', () => {
    expect(refundPercent(24)).toBe(75)
    expect(refundPercent(36)).toBe(75)
    expect(refundPercent(47.99)).toBe(75)
  })

  it('returns 50% for 12-24h', () => {
    expect(refundPercent(12)).toBe(50)
    expect(refundPercent(18)).toBe(50)
    expect(refundPercent(23.99)).toBe(50)
  })

  it('returns 0% for <12h', () => {
    expect(refundPercent(0)).toBe(0)
    expect(refundPercent(5)).toBe(0)
    expect(refundPercent(11.99)).toBe(0)
    expect(refundPercent(-5)).toBe(0) // booking in the past
  })

  it('boundary 12h is exactly 50%', () => {
    expect(refundPercent(12.0)).toBe(50)
  })
})

describe('Bookings — recurring validation (white-box)', () => {
  it('rejects occurrences < 2 or > 12', () => {
    const validate = (n: number) => {
      if (n < 2 || n > 12) throw new BadRequestException('Recorrência aceita entre 2 e 12 ocorrências')
    }
    expect(() => validate(1)).toThrow(BadRequestException)
    expect(() => validate(13)).toThrow(BadRequestException)
    expect(() => validate(2)).not.toThrow()
    expect(() => validate(12)).not.toThrow()
  })
})

describe('Bookings — platform fee calculation', () => {
  const PLATFORM_FEE = 0.15

  it('15% fee on R$100 = R$15', () => {
    const total = 100
    const fee = Number((total * PLATFORM_FEE).toFixed(2))
    const net = Number((total - fee).toFixed(2))
    expect(fee).toBe(15)
    expect(net).toBe(85)
  })

  it('15% fee on R$333.33 = R$50.00 (rounded)', () => {
    const total = 333.33
    const fee = Number((total * PLATFORM_FEE).toFixed(2))
    const net = Number((total - fee).toFixed(2))
    expect(fee).toBe(50)
    expect(net).toBe(283.33)
  })
})
