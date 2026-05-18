'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

const footerLinks = {
  Plataforma: [
    { label: 'Como funciona', href: '#' },
    { label: 'Planos', href: '#' },
    { label: 'Para profissionais', href: '#' },
    { label: 'Segurança', href: '#' },
  ],
  Suporte: [
    { label: 'Central de ajuda', href: '#' },
    { label: 'Contato', href: '#' },
    { label: 'Denunciar', href: '#' },
    { label: 'FAQ', href: '#' },
  ],
  Legal: [
    { label: 'Termos de uso', href: '#' },
    { label: 'Privacidade', href: '#' },
    { label: 'LGPD', href: '#' },
    { label: 'Cookies', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">BAAS</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A plataforma premium de acompanhantes mais segura e moderna do Brasil.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-brand-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BAAS. Todos os direitos reservados. +18 anos.
          </p>
          <p className="text-xs text-muted-foreground">
            Plataforma para maiores de 18 anos. Uso sujeito aos termos de serviço.
          </p>
        </div>
      </div>
    </footer>
  )
}
