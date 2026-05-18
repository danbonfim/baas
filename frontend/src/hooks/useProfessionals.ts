'use client'

import { useState, useEffect, useCallback } from 'react'
import { api, extractError } from '@/lib/api'
import { Professional } from '@/types'

interface SearchFilters {
  query?: string
  city?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  verified?: boolean
  online?: boolean
  sortBy?: string
  page?: number
  limit?: number
}

interface SearchResult {
  data: Professional[]
  total: number
  page: number
  totalPages: number
}

export function useProfessionals(filters: SearchFilters = {}) {
  const [result, setResult] = useState<SearchResult>({ data: [], total: 0, page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | boolean> = {}
      if (filters.city && filters.city !== 'Todas') params.city = filters.city
      if (filters.category && filters.category !== 'Todas') params.category = filters.category
      if (filters.minPrice !== undefined) params.minPrice = filters.minPrice
      if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice
      if (filters.verified) params.verified = true
      if (filters.online) params.online = true
      if (filters.sortBy && filters.sortBy !== 'relevance') params.sortBy = filters.sortBy
      if (filters.page) params.page = filters.page
      if (filters.limit) params.limit = filters.limit

      const { data } = await api.get<SearchResult | Professional[] | { items: Professional[]; total: number; page: number; totalPages: number }>('/professionals', { params })

      // handle paginated ({items}), legacy ({data}), and array responses
      if (Array.isArray(data)) {
        setResult({ data: data.map(normalizeProfessional), total: data.length, page: 1, totalPages: 1 })
      } else if ('items' in data) {
        setResult({ data: data.items.map(normalizeProfessional), total: data.total, page: data.page, totalPages: data.totalPages })
      } else {
        setResult({ ...(data as SearchResult), data: (data as SearchResult).data.map(normalizeProfessional) })
      }
    } catch (e) {
      setError(extractError(e))
    } finally {
      setLoading(false)
    }
  }, [
    filters.city, filters.category, filters.minPrice, filters.maxPrice,
    filters.verified, filters.online, filters.sortBy, filters.page, filters.limit,
  ])

  useEffect(() => { fetch() }, [fetch])

  return { ...result, loading, error, refetch: fetch }
}

// Normalize API professional response to match frontend Professional type
function normalizeProfessional(raw: any): Professional {
  return {
    ...raw,
    name: raw.user?.name ?? raw.name ?? '',
    categories: Array.isArray(raw.categories)
      ? raw.categories.map((c: any) => typeof c === 'string' ? c : c.name)
      : [],
    languages: Array.isArray(raw.languages)
      ? raw.languages.map((l: any) => typeof l === 'string' ? l : l.language)
      : [],
    services: Array.isArray(raw.services)
      ? raw.services.map((s: any) => typeof s === 'string' ? s : s.name)
      : [],
    photos: Array.isArray(raw.photos)
      ? raw.photos.map((p: any) => typeof p === 'string' ? p : p.url)
      : [],
    availability: Array.isArray(raw.availability) ? raw.availability : [],
  }
}

export function useProfessional(slug: string) {
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    api.get<any>(`/professionals/${slug}`)
      .then(({ data }) => setProfessional(normalizeProfessional(data)))
      .catch((e) => setError(extractError(e)))
      .finally(() => setLoading(false))
  }, [slug])

  return { professional, loading, error }
}
