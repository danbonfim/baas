import { Injectable, Logger } from '@nestjs/common'
import { Resend } from 'resend'

interface PanicAlertEmailData {
  userName: string
  userPhone?: string | null
  lat?: number | null
  lng?: number | null
  message?: string | null
  triggeredAt: Date
}

interface CheckinMissedEmailData {
  professionalName: string
  expectedAt: Date
  level: number
  lat?: number | null
  lng?: number | null
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private resend: Resend | null = null
  private fromAddress: string

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    this.fromAddress = process.env.EMAIL_FROM || 'BAAS Alertas <onboarding@resend.dev>'

    if (apiKey) {
      this.resend = new Resend(apiKey)
      this.logger.log('Resend initialized')
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails will be logged but not sent')
    }
  }

  /**
   * Send panic alert email to ALL emergency contacts.
   * Returns array of {email, success, error?} for audit.
   */
  async sendPanicAlerts(
    contacts: { name: string; phone: string; email?: string }[],
    data: PanicAlertEmailData,
  ): Promise<{ email: string; success: boolean; error?: string }[]> {
    const mapsUrl =
      data.lat != null && data.lng != null
        ? `https://www.google.com/maps?q=${data.lat},${data.lng}`
        : null

    const results: { email: string; success: boolean; error?: string }[] = []

    for (const contact of contacts) {
      if (!contact.email) continue
      const subject = `🆘 ALERTA DE EMERGÊNCIA — ${data.userName} precisa de ajuda`
      const html = this.renderPanicAlertHtml({ ...data, contact, mapsUrl })
      const text = this.renderPanicAlertText({ ...data, contact, mapsUrl })

      const result = await this.send({ to: contact.email, subject, html, text })
      results.push({ email: contact.email, ...result })
    }
    return results
  }

  /**
   * Send check-in missed escalation email.
   * Level 1-2: send to the professional themselves.
   * Level 3+: send to emergency contacts.
   */
  async sendCheckinEscalation(
    recipient: { email: string; name: string },
    data: CheckinMissedEmailData,
  ): Promise<{ success: boolean; error?: string }> {
    const subject =
      data.level >= 3
        ? `🆘 ALERTA: ${data.professionalName} não confirmou check-in de segurança`
        : `⚠️ Check-in de segurança não confirmado`

    const html = this.renderCheckinEscalationHtml({ ...data, recipient })
    const text = this.renderCheckinEscalationText({ ...data, recipient })

    return this.send({ to: recipient.email, subject, html, text })
  }

  /**
   * Send a 6-digit verification code for signup or password reset.
   * The code expires in 10 minutes.
   */
  async sendVerificationCode(
    to: string,
    code: string,
    purpose: 'REGISTER' | 'PASSWORD_RESET',
  ): Promise<{ success: boolean; error?: string }> {
    const isRegister = purpose === 'REGISTER'
    const subject = isRegister
      ? `Seu código de cadastro BAAS: ${code}`
      : `Recuperação de senha BAAS: ${code}`

    const html = this.renderVerificationCodeHtml(code, purpose)
    const text = isRegister
      ? `Seu código de cadastro é: ${code}\n\nUse-o como senha para finalizar o cadastro. Expira em 10 minutos.`
      : `Seu código de recuperação é: ${code}\n\nExpira em 10 minutos. Se você não solicitou, ignore este email.`

    return this.send({ to, subject, html, text })
  }

  /**
   * Generic KYC notification (approved / rejected).
   */
  async sendKycResult(
    recipient: { email: string; name: string },
    approved: boolean,
    reason?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const subject = approved
      ? '✅ Verificação aprovada — BAAS'
      : '❌ Verificação rejeitada — BAAS'

    const html = approved
      ? this.renderKycApprovedHtml(recipient.name)
      : this.renderKycRejectedHtml(recipient.name, reason ?? '')

    return this.send({ to: recipient.email, subject, html })
  }

  /**
   * Send a basic email. Returns {success, error?}.
   */
  private async send(params: {
    to: string
    subject: string
    html: string
    text?: string
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.resend) {
      this.logger.warn(`[EMAIL SKIPPED] to=${params.to} subject=${params.subject}`)
      return { success: false, error: 'resend_not_configured' }
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      })

      if (error) {
        this.logger.error(`Resend error: ${JSON.stringify(error)}`)
        return { success: false, error: error.message ?? 'unknown' }
      }

      this.logger.log(`Email sent: ${data?.id} → ${params.to}`)
      return { success: true }
    } catch (err: any) {
      this.logger.error(`Failed to send email: ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  // ─── HTML Templates ──────────────────────────

  private renderPanicAlertHtml(d: any): string {
    const locationBlock = d.mapsUrl
      ? `<p><strong>📍 Localização:</strong> <a href="${d.mapsUrl}">${d.lat?.toFixed(5)}, ${d.lng?.toFixed(5)}</a></p>`
      : '<p><em>Localização não disponível.</em></p>'

    const messageBlock = d.message ? `<p><strong>Mensagem:</strong> ${this.escape(d.message)}</p>` : ''
    const phoneBlock = d.userPhone ? `<p><strong>Telefone:</strong> <a href="tel:${d.userPhone}">${d.userPhone}</a></p>` : ''

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, Arial, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🆘 ALERTA DE EMERGÊNCIA</h1>
  </div>
  <div style="border: 1px solid #dc2626; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Olá ${this.escape(d.contact.name)},</p>
    <p><strong>${this.escape(d.userName)}</strong> acionou o botão de pânico no app BAAS e te indicou como contato de emergência.</p>
    ${locationBlock}
    ${phoneBlock}
    ${messageBlock}
    <p><strong>Acionado em:</strong> ${d.triggeredAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
    <div style="margin-top: 24px; padding: 16px; background: #fef2f2; border-left: 4px solid #dc2626;">
      <strong>O que fazer:</strong>
      <ol style="margin: 8px 0;">
        <li>Tente ligar para a pessoa imediatamente</li>
        <li>Se não conseguir contato, considere acionar a Polícia (190)</li>
        <li>Compartilhe a localização com as autoridades, se necessário</li>
      </ol>
    </div>
    <p style="font-size: 12px; color: #666; margin-top: 24px;">Este é um alerta automatizado da plataforma BAAS. Em caso de dúvidas: suporte@baas.app</p>
  </div>
</body>
</html>`
  }

  private renderPanicAlertText(d: any): string {
    return `🆘 ALERTA DE EMERGÊNCIA

Olá ${d.contact.name},

${d.userName} acionou o botão de pânico no app BAAS e te indicou como contato de emergência.

${d.mapsUrl ? `📍 Localização: ${d.mapsUrl}` : 'Localização não disponível.'}
${d.userPhone ? `📞 Telefone: ${d.userPhone}` : ''}
${d.message ? `Mensagem: ${d.message}` : ''}
Acionado em: ${d.triggeredAt.toLocaleString('pt-BR')}

O QUE FAZER:
1. Tente ligar para a pessoa imediatamente
2. Se não conseguir contato, considere acionar a Polícia (190)
3. Compartilhe a localização com as autoridades, se necessário

— Plataforma BAAS`
  }

  private renderCheckinEscalationHtml(d: any): string {
    const mapsUrl =
      d.lat != null && d.lng != null ? `https://www.google.com/maps?q=${d.lat},${d.lng}` : null

    if (d.level >= 3) {
      // Severe escalation — email to emergency contact
      return `<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0;">🆘 Check-in de segurança ESCALADO</h1>
  </div>
  <div style="border: 1px solid #dc2626; border-top: none; padding: 24px;">
    <p>Olá ${this.escape(d.recipient.name)},</p>
    <p><strong>${this.escape(d.professionalName)}</strong> não confirmou um check-in de segurança no app BAAS após múltiplas tentativas (nível ${d.level}).</p>
    <p>Esperado em: ${d.expectedAt.toLocaleString('pt-BR')}</p>
    ${mapsUrl ? `<p>Última localização conhecida: <a href="${mapsUrl}">ver no mapa</a></p>` : ''}
    <p>Recomendamos contato imediato. Se necessário, acione a Polícia (190).</p>
  </div>
</body></html>`
    }

    // Self-notification (level 1-2)
    return `<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0;">⚠️ Check-in de segurança não confirmado</h1>
  </div>
  <div style="border: 1px solid #f59e0b; border-top: none; padding: 24px;">
    <p>Olá ${this.escape(d.recipient.name)},</p>
    <p>Você não confirmou seu check-in de segurança. Por favor, abra o app e confirme que está bem.</p>
    <p>Esperado em: ${d.expectedAt.toLocaleString('pt-BR')}</p>
    <p>Se você não confirmar em breve, seus contatos de emergência serão avisados (nível ${d.level} de ${3}).</p>
  </div>
</body></html>`
  }

  private renderCheckinEscalationText(d: any): string {
    return `${d.level >= 3 ? '🆘 CHECK-IN ESCALADO' : '⚠️ Check-in não confirmado'}

${d.level >= 3
  ? `${d.professionalName} não confirmou check-in de segurança (nível ${d.level}). Esperado em ${d.expectedAt.toLocaleString('pt-BR')}.`
  : `Você não confirmou seu check-in. Esperado em ${d.expectedAt.toLocaleString('pt-BR')}. Confirme no app.`}
`
  }

  private renderVerificationCodeHtml(code: string, purpose: 'REGISTER' | 'PASSWORD_RESET'): string {
    const isRegister = purpose === 'REGISTER'
    const title = isRegister ? 'Confirme seu cadastro' : 'Recupere sua senha'
    const instruction = isRegister
      ? 'Use o código abaixo como <strong>senha temporária</strong> para finalizar seu cadastro no app:'
      : 'Use o código abaixo para definir uma nova senha:'

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, Arial, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background:#f9fafb;">
  <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">${title}</h1>
  </div>
  <div style="background: white; padding: 32px 24px; border-radius: 0 0 12px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
    <p style="font-size: 16px; margin-top: 0;">Olá,</p>
    <p style="font-size: 15px;">${instruction}</p>
    <div style="background: #f3f4f6; border: 2px dashed #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6366f1; font-family: 'Courier New', monospace;">${code}</div>
    </div>
    <p style="font-size: 13px; color: #6b7280;">⏱️ <strong>Expira em 10 minutos.</strong></p>
    <p style="font-size: 13px; color: #6b7280;">🔒 Não compartilhe este código com ninguém. A equipe BAAS nunca pedirá esse código por telefone ou mensagem.</p>
    ${
      !isRegister
        ? `<p style="font-size: 13px; color: #6b7280;">Se você não solicitou esta recuperação, ignore este email. Sua senha continua a mesma.</p>`
        : ''
    }
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">BAAS — Plataforma segura para profissionais</p>
  </div>
</body>
</html>`
  }

  private renderKycApprovedHtml(name: string): string {
    return `<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #10b981;">✅ Verificação aprovada</h1>
  <p>Olá ${this.escape(name)},</p>
  <p>Sua verificação de identidade no BAAS foi aprovada. Seu perfil agora exibe o selo "Verificado ✓".</p>
  <p>Profissionais verificadas recebem em média 3x mais visualizações e agendamentos.</p>
  <p>— Equipe BAAS</p>
</body></html>`
  }

  private renderKycRejectedHtml(name: string, reason: string): string {
    return `<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #dc2626;">Verificação rejeitada</h1>
  <p>Olá ${this.escape(name)},</p>
  <p>Sua submissão de KYC não foi aprovada.</p>
  <p><strong>Motivo:</strong> ${this.escape(reason)}</p>
  <p>Por favor, resubmeta com documentos válidos pelo app.</p>
  <p>— Equipe BAAS</p>
</body></html>`
  }

  private escape(s: string): string {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]!))
  }
}
