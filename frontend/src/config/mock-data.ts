import { Professional, Review } from '@/types'

const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Florianópolis', 'Brasília', 'Salvador', 'Recife']
const categories = ['Acompanhante', 'Massagista', 'Modelo', 'Dançarina']
const services = ['Jantar', 'Eventos', 'Viagens', 'Massagem', 'Companhia', 'Festas']
const languages = ['Português', 'Inglês', 'Espanhol', 'Francês']

const names = [
  'Isabella Santos', 'Valentina Costa', 'Sofia Oliveira', 'Laura Martins',
  'Helena Rodrigues', 'Manuela Silva', 'Alice Ferreira', 'Júlia Almeida',
  'Cecília Lima', 'Beatriz Souza', 'Maria Luísa Pereira', 'Lorena Cardoso',
  'Camila Nunes', 'Gabriela Ribeiro', 'Rafaela Moreira', 'Fernanda Araújo',
  'Bianca Campos', 'Larissa Gomes', 'Mariana Barbosa', 'Natália Rocha',
]

function seededValue(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function seededBetween(seed: number, min: number, max: number) {
  return Math.floor(seededValue(seed) * (max - min + 1)) + min
}

function seededFrom<T>(arr: T[], seed: number, count: number): T[] {
  const result: T[] = []
  const used = new Set<number>()
  for (let j = 0; j < count && j < arr.length; j++) {
    let idx = Math.floor(seededValue(seed + j * 7) * arr.length)
    while (used.has(idx)) idx = (idx + 1) % arr.length
    used.add(idx)
    result.push(arr[idx])
  }
  return result
}

const ages = [24, 27, 23, 29, 25, 31, 22, 28, 26, 30, 23, 33, 25, 27, 29, 24, 26, 28, 32, 22]
const ratings = [4.8, 4.5, 4.9, 4.3, 4.7, 4.6, 4.4, 4.8, 4.2, 4.9, 4.5, 4.7, 4.3, 4.6, 4.8, 4.4, 4.9, 4.5, 4.7, 4.6]
const reviewCounts = [127, 43, 89, 15, 76, 98, 32, 112, 8, 145, 56, 67, 21, 94, 135, 44, 78, 38, 103, 19]
const prices = [350, 450, 500, 280, 600, 380, 320, 550, 400, 700, 300, 480, 250, 520, 650, 420, 750, 330, 460, 580]
const verifiedList = [true, true, true, false, true, true, true, true, false, true, true, true, false, true, true, true, true, false, true, true]
const premiumList = [true, false, true, false, true, true, false, true, false, true, false, true, false, false, true, true, false, true, false, true]
const onlineList = [true, false, true, true, false, true, true, false, true, true, false, true, false, true, false, true, true, false, true, false]
const photoCountList = [5, 4, 6, 3, 5, 7, 4, 6, 3, 8, 5, 4, 3, 6, 5, 4, 7, 3, 5, 6]

export const mockProfessionals: Professional[] = names.map((name, i) => ({
  id: `prof-${i + 1}`,
  name,
  slug: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-'),
  tagline: [
    'Elegância e sofisticação para momentos especiais',
    'Companhia premium para eventos e viagens',
    'Massagista profissional com técnicas exclusivas',
    'Modelo internacional disponível para acompanhar você',
    'Experiência única e inesquecível',
  ][i % 5],
  description: 'Profissional verificada com experiência em acompanhamento de alto padrão. Disponível para jantares, eventos corporativos, viagens e momentos especiais.',
  age: ages[i],
  city: cities[i % cities.length],
  state: 'SP',
  country: 'BR',
  rating: ratings[i],
  reviewCount: reviewCounts[i],
  pricePerHour: prices[i],
  verified: verifiedList[i],
  premium: premiumList[i],
  online: onlineList[i],
  photos: Array.from({ length: photoCountList[i] }, (_, j) =>
    `https://picsum.photos/seed/${name.replace(/\s/g, '')}-${j}/600/800`
  ),
  videos: [],
  categories: seededFrom(categories, i * 100, seededBetween(i * 200, 1, 3)),
  languages: seededFrom(languages, i * 300, seededBetween(i * 400, 1, 3)),
  services: seededFrom(services, i * 500, seededBetween(i * 600, 2, 5)),
  availability: [
    { dayOfWeek: 1, startTime: '10:00', endTime: '22:00' },
    { dayOfWeek: 2, startTime: '10:00', endTime: '22:00' },
    { dayOfWeek: 3, startTime: '10:00', endTime: '22:00' },
    { dayOfWeek: 4, startTime: '10:00', endTime: '22:00' },
    { dayOfWeek: 5, startTime: '10:00', endTime: '00:00' },
    { dayOfWeek: 6, startTime: '12:00', endTime: '00:00' },
  ],
  location: {
    lat: -23.55 + (seededValue(i * 700) - 0.5) * 2,
    lng: -46.63 + (seededValue(i * 800) - 0.5) * 2,
  },
  createdAt: '2026-03-15T10:00:00.000Z',
}))

export const mockReviews: Review[] = Array.from({ length: 50 }, (_, i) => ({
  id: `review-${i + 1}`,
  clientId: `client-${seededBetween(i * 900, 1, 100)}`,
  clientName: `Cliente ${seededBetween(i * 1000, 1, 100)}`,
  professionalId: `prof-${seededBetween(i * 1100, 1, 20)}`,
  rating: seededBetween(i * 1200, 3, 5),
  comment: [
    'Excelente profissional, muito atenciosa e pontual.',
    'Companhia incrível para o evento. Recomendo!',
    'Superou todas as expectativas. Voltarei com certeza.',
    'Profissional e educada. Ótima experiência.',
    'Muito simpática e elegante. Perfeita para o jantar.',
  ][i % 5],
  createdAt: '2026-04-20T10:00:00.000Z',
}))
