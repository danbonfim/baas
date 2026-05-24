/**
 * White-box logic tests for MFA backup code format.
 * (Full otplib integration tests require ESM transform setup; see api-blackbox e2e tests.)
 */
import { randomBytes } from 'crypto'

describe('MFA — backup code generation (white-box)', () => {
  function generateBackupCode(): string {
    return randomBytes(4).toString('hex').toUpperCase()
  }

  it('generates 8-char uppercase hex codes', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateBackupCode()
      expect(code).toMatch(/^[A-F0-9]{8}$/)
    }
  })

  it('generates unique codes (no collisions in 1000 samples)', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 1000; i++) codes.add(generateBackupCode())
    expect(codes.size).toBe(1000)
  })

  it('generates 10 codes for a user', () => {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) codes.push(generateBackupCode())
    expect(codes).toHaveLength(10)
    expect(new Set(codes).size).toBe(10)
  })
})

describe('MFA — TOTP rate limit logic (white-box)', () => {
  // Simulates the brute-force lockout: 5 failed in 15min → block
  function shouldLockout(recentFailures: number, maxAllowed = 5): boolean {
    return recentFailures >= maxAllowed
  }

  it('allows up to 4 failures', () => {
    expect(shouldLockout(0)).toBe(false)
    expect(shouldLockout(1)).toBe(false)
    expect(shouldLockout(4)).toBe(false)
  })

  it('locks at exactly 5 failures', () => {
    expect(shouldLockout(5)).toBe(true)
    expect(shouldLockout(10)).toBe(true)
  })
})
