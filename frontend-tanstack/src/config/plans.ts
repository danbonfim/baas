import { SubscriptionPlan } from '@/types'

export const PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 49.90,
    interval: 'month',
    credits: 3,
    features: [
      '3 créditos mensais',
      'Chat ilimitado',
      'Perfis verificados',
      'Suporte por email',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99.90,
    interval: 'month',
    credits: 8,
    features: [
      '8 créditos mensais',
      'Chat prioritário',
      'Perfis verificados',
      'Cashback 5%',
      'Acesso antecipado',
      'Suporte prioritário',
    ],
    popular: true,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 199.90,
    interval: 'month',
    credits: 20,
    features: [
      '20 créditos mensais',
      'Chat VIP',
      'Perfis exclusivos',
      'Cashback 10%',
      'Acesso antecipado',
      'Suporte 24/7',
      'Concierge pessoal',
      'Descontos exclusivos',
    ],
  },
]

export const PLATFORM_FEE_PERCENT = 15
export const BOOST_PRICES = {
  day: 29.90,
  week: 149.90,
  month: 399.90,
}
