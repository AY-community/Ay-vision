export type Category = 'landing' | 'webapp' | 'automation'
export type Status = 'live' | 'in-progress' | 'coming-soon'

export interface Project {
  id: string
  name: string
  tagline: string
  category: Category
  status: Status
  color: number    // Three.js hex color
  cssColor: string // CSS hex string
  image?: string   // Optional artwork used by the 3D project card
  link?: string    // Live URL to the project
}

export const PROJECTS: Project[] = [
  // WEB APPLICATIONS
  {
    id: 'ay-social',
    name: 'AY Social Media',
    tagline: 'Next-gen social platform',
    category: 'webapp',
    status: 'live',
    color: 0x8B5CF6,
    cssColor: '#8B5CF6',
    image: '/projects/ay-social.png',
    link: 'https://ay-social-media.vercel.app/',
  },
  {
    id: 'agendax',
    name: 'AgendaX',
    tagline: 'Smart scheduling & booking',
    category: 'webapp',
    status: 'in-progress',
    color: 0x0055FF,
    cssColor: '#0055FF',
    image: '/projects/agendax.png',
    link: 'https://agenda-x.vercel.app/',
  },
  {
    id: 'design-nova',
    name: 'Design Nova',
    tagline: 'SaaS landing page',
    category: 'webapp',
    status: 'coming-soon',
    color: 0xE8238D,
    cssColor: '#E8238D',
    image: '/projects/design-nova.png',
  },
  // AUTOMATION
  {
    id: 'fiver-health',
    name: 'Fiver Health',
    tagline: 'Gig analyser automation',
    category: 'automation',
    status: 'live',
    color: 0x00FF66,
    cssColor: '#00FF66',
    image: '/projects/fiverr-health.png',
  },
  {
    id: 'best-product-ecom',
    name: 'Best Product Ecom',
    tagline: 'Automated e-commerce bot',
    category: 'automation',
    status: 'live',
    color: 0xF59E0B,
    cssColor: '#F59E0B',
    image: '/projects/best-product-ecom.png',
  },
  // LANDING PAGES
  {
    id: 'iphone-17',
    name: 'iPhone 17',
    tagline: 'Concept landing page',
    category: 'landing',
    status: 'live',
    color: 0xFFFFFF,
    cssColor: '#FFFFFF',
    image: '/projects/iphone-17.jpg',
    link: 'https://iphone17-landing-page.vercel.app/',
  },
  {
    id: 'mercedes',
    name: 'Mercedes',
    tagline: 'Luxury car landing page',
    category: 'landing',
    status: 'live',
    color: 0xC0C0C0,
    cssColor: '#C0C0C0',
    image: '/projects/mercedes.jpg',
    link: 'https://mercedes-landing-page-phi.vercel.app/',
  },
  {
    id: 'stronger-with-you',
    name: 'Stronger With You',
    tagline: 'Perfume campaign',
    category: 'landing',
    status: 'live',
    color: 0xEA580C,
    cssColor: '#EA580C',
    image: '/projects/stronger-with-you.png',
    link: 'https://stronger-with-you.vercel.app/',
  },
]

export const CATEGORY_COLORS: Record<Category, string> = {
  landing: '#FFFFFF',
  webapp: '#FF3366',
  automation: '#00FF66',
}

export const CATEGORY_LABELS: Record<Category, string> = {
  landing: 'LANDING PAGES',
  webapp: 'WEB APPLICATIONS',
  automation: 'AUTOMATION',
}

export const STATUS_LABELS: Record<Status, string> = {
  live: 'LIVE',
  'in-progress': 'IN PROGRESS',
  'coming-soon': 'COMING SOON',
}
