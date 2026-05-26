import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'

const footerLinks = {
  Plataforma: [
    { label: 'Como funciona', href: '/como-funciona' },
    { label: 'Planos', href: '/planos' },
    { label: 'Para profissionais', href: '/para-profissionais' },
    { label: 'Segurança', href: '/seguranca' },
  ],
  Suporte: [
    { label: 'Central de ajuda', href: '/ajuda' },
    { label: 'Contato', href: '/contato' },
    { label: 'Denunciar', href: '/denunciar' },
    { label: 'FAQ', href: '/faq' },
  ],
  Legal: [
    { label: 'Termos de uso', href: '/termos' },
    { label: 'Privacidade', href: '/privacidade' },
    { label: 'LGPD', href: '/lgpd' },
    { label: 'Cookies', href: '/cookies' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
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
                    <Link to={link.href} className="text-sm text-muted-foreground hover:text-brand-400 transition-colors">
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
