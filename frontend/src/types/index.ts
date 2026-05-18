export interface Professional {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  age: number
  city: string
  state: string
  country: string
  rating: number
  reviewCount: number
  pricePerHour: number
  verified: boolean
  premium: boolean
  online: boolean
  photos: string[]
  videos: string[]
  categories: string[]
  languages: string[]
  services: string[]
  availability: Availability[]
  location: { lat: number; lng: number }
  createdAt: string
}

export interface Availability {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface Booking {
  id: string
  professionalId: string
  clientId: string
  date: string
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  totalAmount: number
  platformFee: number
  professionalAmount: number
  paymentStatus: 'pending' | 'paid' | 'refunded'
  createdAt: string
}

export interface Review {
  id: string
  clientId: string
  clientName: string
  professionalId: string
  rating: number
  comment: string
  createdAt: string
}

export interface Subscription {
  id: string
  userId: string
  plan: 'basic' | 'premium' | 'vip'
  status: 'active' | 'cancelled' | 'past_due'
  credits: number
  currentPeriodEnd: string
  stripeSubscriptionId: string
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  read: boolean
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'client' | 'professional' | 'admin'
  avatar?: string
  subscription?: Subscription
  wallet: { balance: number; credits: number }
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'quarter' | 'year'
  credits: number
  features: string[]
  popular?: boolean
}
