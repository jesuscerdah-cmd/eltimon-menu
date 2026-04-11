'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase, type Category, type MenuItem } from '@/lib/supabase'

// ── Constants ──────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '528344373709'
const WHATSAPP_MESSAGE = 'Hola, tengo una pregunta sobre El Timón'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
const MAPS_URL = 'https://maps.google.com/?q=Hidalgo+182+Centro+Monterrey+NL+Mexico'

const CATEGORY_GROUPS: Record<string, string[]> = {
  'Paquetes': ['Súper Paquetes', 'Paquetes Familiares'],
  'Infantil y Combos': ['Timoncitos', 'Minicombos'],
}

const CATEGORY_ORDER = [
  'Cócteles', 'Ensaladas', 'Sopas y Caldos', 'Antojitos y Botanas',
  'Filetes', 'Camarones', 'Pescados Enteros', 'Más del Mar',
  'Tacos y Quesadillas', 'Hamburguesas',
  'Paquetes', 'Infantil y Combos', 'Bebidas', 'Postres',
]

// ── Helpers ─────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

type DisplayCategory = {
  id: string
  name: string
  description: string
  catIds: string[]
}

// ── Open/Closed Check ──────────────────────────────────────────────

function isRestaurantOpen(): { open: boolean; message: string } {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const time = hour * 60 + minute
  const openTime = 10 * 60  // 10:00 AM
  const closeTime = 21 * 60  // 9:00 PM
  if (time >= openTime && time < closeTime) {
    return { open: true, message: 'Abierto ahora' }
  }
  return { open: false, message: 'Cerrado — Abre a las 10:00 AM' }
}

// ── Category Placeholder Icons ──────────────────────────────────────

type PlaceholderStyle = { bg: string; icon: React.ReactNode }

const PLACEHOLDER_STYLES: Record<string, PlaceholderStyle> = {
  cocktail: {
    bg: 'from-rose-50 to-orange-50',
    icon: <path d="M12 3L14 9H20L15 13L17 19L12 15L7 19L9 13L4 9H10L12 3Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  fish: {
    bg: 'from-cyan-50 to-blue-50',
    icon: <path d="M20 12C20 12 17 8 12 8C7 8 4 12 4 12C4 12 7 16 12 16C17 16 20 12 20 12ZM2 12L4.5 9.5M2 12L4.5 14.5M22 12L19.5 9.5M22 12L19.5 14.5" strokeLinecap="round" strokeLinejoin="round" />,
  },
  shrimp: {
    bg: 'from-orange-50 to-rose-50',
    icon: <path d="M19 8C19 8 17 4 12 4C8 4 6 7 6 10C6 13 8 15 10 16L7 20M19 8C17 10 15 11 12 11M19 8L21 6" strokeLinecap="round" strokeLinejoin="round" />,
  },
  snack: {
    bg: 'from-amber-50 to-yellow-50',
    icon: <><circle cx="12" cy="12" r="3" /><path d="M12 5V3M12 21V19M5 12H3M21 12H19M7.05 7.05L5.636 5.636M18.364 18.364L16.95 16.95M7.05 16.95L5.636 18.364M18.364 5.636L16.95 7.05" strokeLinecap="round" /></>,
  },
  taco: {
    bg: 'from-lime-50 to-emerald-50',
    icon: <path d="M4 16C4 16 4 8 12 8C20 8 20 16 20 16M4 16H20M4 16C4 18 6 19 8 19M20 16C20 18 18 19 16 19" strokeLinecap="round" strokeLinejoin="round" />,
  },
  drink: {
    bg: 'from-sky-50 to-indigo-50',
    icon: <path d="M8 2H16L14 22H10L8 2ZM7 6H17M9 12H15" strokeLinecap="round" strokeLinejoin="round" />,
  },
  dessert: {
    bg: 'from-pink-50 to-fuchsia-50',
    icon: <path d="M12 4C8 4 5 7 5 10H19C19 7 16 4 12 4ZM5 10L6 20H18L19 10M12 4V2M9 14V17M15 14V17" strokeLinecap="round" strokeLinejoin="round" />,
  },
  seafood: {
    bg: 'from-teal-50 to-cyan-50',
    icon: <path d="M3 12C5 8 9 6 12 6C15 6 19 8 21 12M3 12C5 16 9 18 12 18C15 18 19 16 21 12M3 12H21M7 9C7 9 9 12 12 12C15 12 17 9 17 9" strokeLinecap="round" strokeLinejoin="round" />,
  },
}

// Map DB category names to placeholder styles
const CATEGORY_PLACEHOLDER_MAP: Record<string, string> = {
  'Cócteles': 'cocktail',
  'Ensaladas': 'snack',
  'Filetes': 'fish',
  'Camarones': 'shrimp',
  'Antojitos y Botanas': 'snack',
  'Pescados Enteros': 'fish',
  'Más del Mar': 'seafood',
  'Tacos y Quesadillas': 'taco',
  'Bebidas': 'drink',
  'Postres': 'dessert',
}

function getPlaceholderStyle(categoryName: string): PlaceholderStyle {
  const key = CATEGORY_PLACEHOLDER_MAP[categoryName] || 'seafood'
  return PLACEHOLDER_STYLES[key]
}

function PlaceholderThumb({ categoryName }: { categoryName: string }) {
  const style = getPlaceholderStyle(categoryName)
  return (
    <div className={`w-full h-full bg-gradient-to-br ${style.bg} flex items-center justify-center`}>
      <svg className="w-8 h-8 text-timon-navy/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {style.icon}
      </svg>
    </div>
  )
}

// ── Skeleton Loading ────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-timon-navy/5 overflow-hidden flex">
      <div className="w-20 sm:w-24 flex-shrink-0 bg-timon-navy/5 animate-pulse" />
      <div className="flex-1 p-3 sm:p-4 space-y-2">
        <div className="h-4 bg-timon-navy/8 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-timon-navy/5 rounded w-full animate-pulse" />
        <div className="h-3 bg-timon-navy/5 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="px-4 sm:px-6 max-w-4xl mx-auto py-8 space-y-10">
      <div className="flex gap-2.5 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-timon-navy/8 rounded-full w-28 flex-shrink-0 animate-pulse" />
        ))}
      </div>
      {[1, 2].map((section) => (
        <div key={section} className="space-y-4">
          <div className="h-7 bg-timon-navy/8 rounded-md w-40 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Badge Component ─────────────────────────────────────────────────

function Badge({ label }: { label: string }) {
  // Gold style: Chef Recomienda, Especialidad
  const isGold = label === 'Chef Recomienda' || label === 'Especialidad'
  // Teal style: Popular, Mas Pedido
  const isTeal = label === 'Popular' || label === 'Más Pedido'
  // Coral style: Premium, Nuevo
  const isCoral = label === 'Premium' || label === 'Nuevo'
  // Emerald style: Temporada
  const isEmerald = label === 'Temporada'

  let colorClasses = 'bg-timon-gold/15 text-timon-gold border-timon-gold/20'
  let icon = (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
  )

  if (isTeal) {
    colorClasses = 'bg-timon-teal/10 text-timon-teal border-timon-teal/15'
    icon = (
      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
    )
  } else if (isCoral) {
    colorClasses = 'bg-timon-coral/10 text-timon-coral border-timon-coral/15'
    icon = (
      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.967.744L14.146 7.2 17.5 7.512a1 1 0 01.541 1.753l-2.454 2.11.733 3.413a1 1 0 01-1.491 1.083L12 14.12l-2.829 1.752a1 1 0 01-1.491-1.083l.733-3.413-2.454-2.11a1 1 0 01.541-1.753l3.354-.312 1.179-3.456A1 1 0 0112 2z" clipRule="evenodd" /></svg>
    )
  } else if (isEmerald) {
    colorClasses = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15'
    icon = (
      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" /></svg>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${colorClasses}`}>
      {icon}
      {label}
    </span>
  )
}

// ── Price Component ─────────────────────────────────────────────────

function Price({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-sm italic text-timon-gold font-medium">Precio de mercado</span>
  }
  const whole = Math.floor(value)
  return (
    <span className="font-heading font-bold text-timon-coral text-lg tracking-tight">
      <span className="text-xs font-normal text-timon-coral/60 mr-0.5">$</span>
      {whole}
    </span>
  )
}

// ── Cart Types ──────────────────────────────────────────────────────

type CartItem = { item: MenuItem; quantity: number }

// ── Main Component ──────────────────────────────────────────────────

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [deliveryEnabled, setDeliveryEnabled] = useState(false)
  const [cartStep, setCartStep] = useState<'cart' | 'form'>('cart')
  const [deliveryForm, setDeliveryForm] = useState({
    name: '', address: '', colonia: '', reference: '', phone: '', notes: ''
  })

  const sectionRefs = useRef(new Map<string, HTMLElement>())
  const navRef = useRef<HTMLDivElement>(null)
  const navButtonRefs = useRef(new Map<string, HTMLButtonElement>())
  const isClickScrolling = useRef(false)

  // ── Cart functions ─────────────────────────────────────────────
  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id)
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { item, quantity: 1 }]
    })
  }

  function removeFromCart(itemId: string) {
    setCart(prev => prev.filter(c => c.item.id !== itemId))
  }

  function updateQuantity(itemId: string, delta: number) {
    setCart(prev => prev.map(c => {
      if (c.item.id !== itemId) return c
      const newQty = c.quantity + delta
      return newQty <= 0 ? c : { ...c, quantity: newQty }
    }).filter(c => c.quantity > 0))
  }

  const cartTotal = cart.reduce((sum, c) => sum + (c.item.price || 0) * c.quantity, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  // ── Build WhatsApp URL with delivery form ─────────────────────
  function buildWhatsAppURL(): string {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    const itemsList = cart.map(c => `  ${c.quantity}x ${c.item.name} — $${(c.item.price || 0) * c.quantity}`).join('\n')
    const msg = [
      '🍽️ *Pedido a domicilio — El Timón*',
      '',
      `👤 *Cliente:* ${deliveryForm.name}`,
      `📍 *Dirección:* ${deliveryForm.address}`,
      `🏘️ *Colonia:* ${deliveryForm.colonia}`,
      deliveryForm.reference ? `📌 *Referencia:* ${deliveryForm.reference}` : '',
      `📱 *Teléfono:* ${deliveryForm.phone}`,
      '',
      '📋 *Pedido:*',
      itemsList,
      '',
      `💰 *Total: $${cartTotal}*`,
      deliveryForm.notes ? `\n📝 *Notas:* ${deliveryForm.notes}` : '',
      '',
      `🕐 *Hora:* ${timeStr}`,
      `📍 *Sucursal:* Centro — Hidalgo #182`,
    ].filter(Boolean).join('\n')
    return `https://wa.me/528183443709?text=${encodeURIComponent(msg)}`
  }

  // ── Fetch data ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      const [catRes, itemRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*').eq('is_active', true).order('sort_order'),
      ])
      setCategories(catRes.data || [])
      setItems(itemRes.data || [])

      const settingsRes = await supabase.from('settings').select('*').eq('key', 'delivery_enabled').single()
      if (settingsRes.data?.value === 'true') setDeliveryEnabled(true)

      setLoading(false)
    }
    fetchData()
  }, [])

  // ── Build display categories ────────────────────────────────────
  const displayCategories = useMemo<DisplayCategory[]>(() => {
    if (categories.length === 0) return []

    const result: DisplayCategory[] = []
    const usedDbIds = new Set<string>()

    for (const displayName of CATEGORY_ORDER) {
      if (CATEGORY_GROUPS[displayName]) {
        const dbNames = CATEGORY_GROUPS[displayName]
        const matchedCats = categories.filter(c => dbNames.includes(c.name))
        if (matchedCats.length > 0) {
          result.push({
            id: `group-${slugify(displayName)}`,
            name: displayName,
            description: matchedCats.map(c => c.description).filter(Boolean).join('. '),
            catIds: matchedCats.map(c => c.id),
          })
          matchedCats.forEach(c => usedDbIds.add(c.id))
        }
      } else {
        const cat = categories.find(c => c.name === displayName)
        if (cat) {
          result.push({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            catIds: [cat.id],
          })
          usedDbIds.add(cat.id)
        }
      }
    }

    // Append any ungrouped categories
    for (const cat of categories) {
      if (!usedDbIds.has(cat.id)) {
        result.push({ id: cat.id, name: cat.name, description: cat.description, catIds: [cat.id] })
      }
    }

    return result
  }, [categories])

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>()
    for (const dc of displayCategories) {
      const catItems = items.filter(item => dc.catIds.includes(item.category_id))
      if (catItems.length > 0) map.set(dc.id, catItems)
    }
    return map
  }, [displayCategories, items])

  const visibleCategories = useMemo(
    () => displayCategories.filter(dc => itemsByCategory.has(dc.id)),
    [displayCategories, itemsByCategory]
  )

  // ── Search filtering ───────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return null
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const q = normalize(searchQuery)
    return items.filter(item => {
      const name = normalize(item.name)
      const desc = normalize(item.description || '')
      return name.includes(q) || desc.includes(q)
    })
  }, [searchQuery, items])

  // Set initial active
  useEffect(() => {
    if (visibleCategories.length > 0 && !activeCategory) {
      setActiveCategory(visibleCategories[0].id)
    }
  }, [visibleCategories, activeCategory])

  // ── IntersectionObserver ────────────────────────────────────────
  useEffect(() => {
    if (visibleCategories.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrolling.current) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-category-id')
            if (id) setActiveCategory(id)
          }
        }
      },
      { rootMargin: '-120px 0px -55% 0px', threshold: 0 }
    )
    sectionRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [visibleCategories])

  // ── Auto-scroll nav pill ────────────────────────────────────────
  useEffect(() => {
    if (!activeCategory || !navRef.current) return
    const btn = navButtonRefs.current.get(activeCategory)
    if (btn) {
      const nav = navRef.current
      nav.scrollTo({
        left: btn.offsetLeft - nav.clientWidth / 2 + btn.clientWidth / 2,
        behavior: 'smooth',
      })
    }
  }, [activeCategory])

  // ── Click nav ───────────────────────────────────────────────────
  const scrollToCategory = useCallback((categoryId: string) => {
    setActiveCategory(categoryId)
    isClickScrolling.current = true
    const section = sectionRefs.current.get(categoryId)
    if (section) {
      const top = section.getBoundingClientRect().top + window.scrollY - 120
      window.scrollTo({ top, behavior: 'smooth' })
    }
    setTimeout(() => { isClickScrolling.current = false }, 800)
  }, [])

  // ── Helper to get category name for an item ────────────────────
  function getCategoryNameForItem(item: MenuItem): string {
    for (const dc of displayCategories) {
      if (dc.catIds.includes(item.category_id)) return dc.name
    }
    return ''
  }

  // ── Close cart helper ──────────────────────────────────────────
  function closeCart() {
    setCartOpen(false)
    setCartStep('cart')
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-timon-sand">

      {/* Header */}
      <header className="bg-[#1E3A5F] text-white py-10 sm:py-14 px-4 text-center">
        <p className="text-timon-gold text-xs sm:text-sm font-medium uppercase tracking-[0.2em] mb-3">
          Desde 1995
        </p>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-2">
          El Timon
        </h1>
        <p className="text-white/70 text-sm sm:text-base mb-6">
          Cocteles y Mariscos
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-white/60 text-xs sm:text-sm">
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-timon-gold transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Hidalgo #182 Centro, Monterrey
          </a>
          <span className="hidden sm:inline text-white/30">|</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            10:00 AM - 9:00 PM
          </span>
        </div>
        {/* Open/Closed Indicator */}
        {(() => {
          const status = isRestaurantOpen()
          return (
            <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium ${status.open ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              <span className={`w-2 h-2 rounded-full ${status.open ? 'bg-green-400' : 'bg-red-400'}`} />
              {status.message}
            </div>
          )
        })()}
      </header>

      {/* Search + Category Nav */}
      {!loading && visibleCategories.length > 0 && (
        <nav className="sticky top-0 z-30 bg-timon-sand/95 backdrop-blur-md border-b border-timon-navy/5">
          {/* Search Bar */}
          <div className="px-4 pt-3 pb-1 max-w-4xl mx-auto">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-timon-gray/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar platillo..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-timon-navy/8 bg-white text-timon-navy text-sm placeholder-timon-gray/40 outline-none focus:border-timon-teal focus:ring-2 focus:ring-timon-teal/10 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-timon-gray/40 hover:text-timon-gray cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
          {/* Category Pills (hidden when searching) */}
          {!searchQuery && (
            <div ref={navRef} className="category-nav flex gap-2 px-4 py-3 overflow-x-auto max-w-4xl mx-auto">
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  ref={(el) => { if (el) navButtonRefs.current.set(cat.id, el) }}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium min-h-[44px] transition-all duration-200 cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-timon-teal text-white shadow-md shadow-timon-teal/20'
                      : 'bg-white text-timon-navy/60 border border-timon-navy/8 hover:bg-timon-teal-light hover:text-timon-teal'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </nav>
      )}

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-32 sm:pb-12">
        {loading ? (
          <LoadingSkeleton />
        ) : visibleCategories.length === 0 ? (
          <div className="text-center py-20 text-timon-gray">
            <p className="text-lg">No hay platillos disponibles en este momento.</p>
          </div>
        ) : searchQuery && filteredItems !== null ? (
          /* Search Results */
          filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 mx-auto mb-3 text-timon-navy/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <p className="text-timon-gray text-base mb-1">No encontramos ese platillo.</p>
              <p className="text-timon-gray/70 text-sm mb-4">&iquest;Qu&eacute; tal un Filete Empanizado?</p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-5 py-2.5 bg-timon-teal text-white text-sm font-medium rounded-xl hover:bg-timon-teal-dark active:scale-95 transition-all cursor-pointer"
              >
                Ver todo el men&uacute;
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map((item, index) => {
                const badge = item.badge
                const hasImage = item.image_url && item.image_url.length > 0
                const catName = getCategoryNameForItem(item)
                return (
                  <div
                    key={item.id}
                    className="relative animate-fade-in bg-white rounded-xl border border-timon-navy/5 hover:border-timon-teal/20 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 overflow-hidden flex"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 sm:w-24 flex-shrink-0">
                      {hasImage ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          style={{ filter: 'contrast(1.05) saturate(1.1)' }}
                        />
                      ) : (
                        <PlaceholderThumb categoryName={catName} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-3 sm:p-4 min-w-0 relative">
                      {badge && badge.length > 0 && <div className="mb-1.5"><Badge label={badge} /></div>}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading font-semibold text-timon-navy text-[15px] sm:text-base leading-snug">{item.name}</h3>
                        <div className="flex-shrink-0"><Price value={item.price} /></div>
                      </div>
                      {item.description && (
                        <p className="text-timon-gray text-[13px] sm:text-sm leading-relaxed mt-1 line-clamp-2">{item.description}</p>
                      )}
                      {/* Add to cart button — only when delivery enabled */}
                      {deliveryEnabled && (
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(item) }}
                          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-timon-teal text-white flex items-center justify-center text-lg font-bold hover:bg-timon-teal-dark active:scale-90 transition-all cursor-pointer shadow-sm"
                          aria-label={`Agregar ${item.name}`}
                        >+</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          <div className="space-y-10">
            {visibleCategories.map((cat) => {
              const catItems = itemsByCategory.get(cat.id) || []
              return (
                <section
                  key={cat.id}
                  id={slugify(cat.name)}
                  data-category-id={cat.id}
                  ref={(el) => { if (el) sectionRefs.current.set(cat.id, el) }}
                  className="scroll-mt-28"
                >
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="font-heading text-xl sm:text-2xl font-semibold text-timon-navy">{cat.name}</h2>
                      <div className="flex-1 h-px bg-timon-gold/25" />
                    </div>
                    {cat.description && <p className="text-timon-gray text-sm">{cat.description}</p>}
                  </div>

                  {catItems.length === 0 ? (
                    <div className="text-center py-8 text-timon-gray/60">
                      <svg className="w-8 h-8 mx-auto mb-2 text-timon-teal/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-sm">Proximamente nuevos platillos</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {catItems.map((item, index) => {
                        const badge = item.badge
                        const hasImage = item.image_url && item.image_url.length > 0
                        return (
                          <div
                            key={item.id}
                            className="relative animate-fade-in bg-white rounded-xl border border-timon-navy/5 hover:border-timon-teal/20 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 overflow-hidden flex"
                            style={{ animationDelay: `${index * 40}ms` }}
                          >
                            {/* Thumbnail: real image or category placeholder */}
                            <div className="w-20 sm:w-24 flex-shrink-0">
                              {hasImage ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  style={{ filter: 'contrast(1.05) saturate(1.1)' }}
                                />
                              ) : (
                                <PlaceholderThumb categoryName={cat.name} />
                              )}
                            </div>
                            {/* Content */}
                            <div className="flex-1 p-3 sm:p-4 min-w-0 relative">
                              {badge && badge.length > 0 && <div className="mb-1.5"><Badge label={badge} /></div>}
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-heading font-semibold text-timon-navy text-[15px] sm:text-base leading-snug">{item.name}</h3>
                                <div className="flex-shrink-0"><Price value={item.price} /></div>
                              </div>
                              {item.description && (
                                <p className="text-timon-gray text-[13px] sm:text-sm leading-relaxed mt-1 line-clamp-2">{item.description}</p>
                              )}
                              {/* Add to cart button — only when delivery enabled */}
                              {deliveryEnabled && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); addToCart(item) }}
                                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-timon-teal text-white flex items-center justify-center text-lg font-bold hover:bg-timon-teal-dark active:scale-90 transition-all cursor-pointer shadow-sm"
                                  aria-label={`Agregar ${item.name}`}
                                >+</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#1E3A5F] text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-1">El Timon</h2>
            <p className="text-white/50 text-sm">Cocteles y Mariscos &middot; Desde 1995</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-sm">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-timon-gold font-semibold mb-2">Ubicacion</h3>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-timon-teal transition-colors leading-relaxed">
                Hidalgo #182 Centro<br />Monterrey, N.L.
              </a>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wider text-timon-gold font-semibold mb-2">Horario</h3>
              <p className="text-white/70 leading-relaxed">Lunes a Domingo<br />10:00 AM - 9:00 PM</p>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wider text-timon-gold font-semibold mb-2">Contacto</h3>
              <div className="text-white/70 space-y-1">
                <a href="tel:+528344373709" className="block hover:text-timon-teal transition-colors">83 4437-3709</a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors mt-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.596-.798-6.364-2.143l-.444-.333-3.206 1.074 1.074-3.206-.333-.444A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" /></svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
          {/* Social Links */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <a href="https://www.instagram.com/eltimon.mx/" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors" aria-label="Instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
            </a>
            <a href="https://www.facebook.com/eltimon.mx/" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors" aria-label="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            </a>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <a href="https://www.ladislaoch.com" target="_blank" rel="noopener noreferrer" className="text-white/20 text-xs hover:text-white/40 transition-colors">
              Desarrollado por @ladislaoch
            </a>
          </div>
        </div>
      </footer>

      {/* Cart Floating Badge — only when delivery enabled */}
      {deliveryEnabled && cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed right-4 bottom-36 sm:bottom-[5.5rem] z-50 w-14 h-14 rounded-full bg-timon-navy text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          aria-label="Ver mi pedido"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-timon-coral text-white text-xs font-bold flex items-center justify-center">{cartCount}</span>
        </button>
      )}

      {/* WhatsApp Float — hidden when cart drawer is open */}
      {!cartOpen && (
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed right-4 bottom-20 sm:bottom-6 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          aria-label="Preguntar por WhatsApp"
        >
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.596-.798-6.364-2.143l-.444-.333-3.206 1.074 1.074-3.206-.333-.444A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
          </svg>
        </a>
      )}

      {/* Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1E3A5F] px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] sm:hidden">
        {deliveryEnabled && cartCount > 0 ? (
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center justify-center gap-2 w-full bg-timon-teal hover:bg-timon-teal-dark active:scale-95 text-white font-semibold text-sm rounded-lg min-h-[44px] transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            Ver mi pedido ({cartCount})
          </button>
        ) : deliveryEnabled ? (
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold text-sm rounded-lg min-h-[44px] transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.596-.798-6.364-2.143l-.444-.333-3.206 1.074 1.074-3.206-.333-.444A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" /></svg>
            Ordenar por WhatsApp
          </a>
        ) : (
          <a href="tel:+528183443709" className="flex items-center justify-center gap-2 w-full bg-timon-teal hover:bg-timon-teal-dark active:scale-95 text-white font-semibold text-sm rounded-lg min-h-[44px] transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            Llamar
          </a>
        )}
      </div>

      {/* Cart Panel (slide-up drawer) — only when delivery enabled */}
      {deliveryEnabled && cartOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={closeCart} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-timon-navy/5">
              <h3 className="font-heading font-bold text-timon-navy text-lg">Mi Pedido</h3>
              <button onClick={closeCart} className="text-timon-gray hover:text-timon-navy cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {cartStep === 'cart' ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.map(({ item, quantity }) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-timon-navy text-sm truncate">{item.name}</p>
                        <p className="text-timon-coral text-sm font-semibold">${item.price ? (item.price * quantity) : 0}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-full border border-timon-navy/10 flex items-center justify-center text-timon-navy hover:bg-timon-navy/5 cursor-pointer">&minus;</button>
                        <span className="text-sm font-semibold text-timon-navy w-5 text-center">{quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-full border border-timon-navy/10 flex items-center justify-center text-timon-navy hover:bg-timon-navy/5 cursor-pointer">+</button>
                        <button onClick={() => removeFromCart(item.id)} className="ml-1 text-timon-gray/40 hover:text-red-500 cursor-pointer">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-timon-navy/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-heading font-bold text-timon-navy text-lg">Total</span>
                    <span className="font-heading font-bold text-timon-coral text-xl">${cartTotal}</span>
                  </div>
                  <button
                    onClick={() => setCartStep('form')}
                    className="block w-full py-3.5 bg-timon-teal hover:bg-timon-teal-dark active:scale-[0.98] text-white font-semibold text-center rounded-xl transition-all cursor-pointer"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <button onClick={() => setCartStep('cart')} className="flex items-center gap-1 text-sm text-timon-teal hover:underline cursor-pointer mb-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Volver al pedido
                  </button>
                  <h4 className="font-heading font-semibold text-timon-navy">Datos de entrega</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-timon-gray mb-1">Nombre *</label>
                      <input value={deliveryForm.name} onChange={e => setDeliveryForm(f => ({...f, name: e.target.value}))} required className="w-full px-3 py-2.5 rounded-lg border border-timon-navy/10 bg-white text-sm text-timon-navy outline-none focus:border-timon-teal focus:ring-1 focus:ring-timon-teal/20" placeholder="Tu nombre" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-timon-gray mb-1">Direccion completa *</label>
                      <input value={deliveryForm.address} onChange={e => setDeliveryForm(f => ({...f, address: e.target.value}))} required className="w-full px-3 py-2.5 rounded-lg border border-timon-navy/10 bg-white text-sm text-timon-navy outline-none focus:border-timon-teal focus:ring-1 focus:ring-timon-teal/20" placeholder="Calle y numero" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-timon-gray mb-1">Colonia *</label>
                      <input value={deliveryForm.colonia} onChange={e => setDeliveryForm(f => ({...f, colonia: e.target.value}))} required className="w-full px-3 py-2.5 rounded-lg border border-timon-navy/10 bg-white text-sm text-timon-navy outline-none focus:border-timon-teal focus:ring-1 focus:ring-timon-teal/20" placeholder="Colonia" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-timon-gray mb-1">Referencia</label>
                      <input value={deliveryForm.reference} onChange={e => setDeliveryForm(f => ({...f, reference: e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-timon-navy/10 bg-white text-sm text-timon-navy outline-none focus:border-timon-teal focus:ring-1 focus:ring-timon-teal/20" placeholder="Entre calles, color de casa, etc." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-timon-gray mb-1">Telefono *</label>
                      <input value={deliveryForm.phone} onChange={e => setDeliveryForm(f => ({...f, phone: e.target.value}))} required type="tel" className="w-full px-3 py-2.5 rounded-lg border border-timon-navy/10 bg-white text-sm text-timon-navy outline-none focus:border-timon-teal focus:ring-1 focus:ring-timon-teal/20" placeholder="81 1234 5678" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-timon-gray mb-1">Notas del pedido</label>
                      <textarea value={deliveryForm.notes} onChange={e => setDeliveryForm(f => ({...f, notes: e.target.value}))} rows={2} className="w-full px-3 py-2.5 rounded-lg border border-timon-navy/10 bg-white text-sm text-timon-navy outline-none focus:border-timon-teal focus:ring-1 focus:ring-timon-teal/20 resize-none" placeholder="Sin cebolla, extra salsa, etc." />
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-timon-navy/5 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-timon-gray">{cartCount} platillos</span>
                    <span className="font-heading font-bold text-timon-coral text-lg">${cartTotal}</span>
                  </div>
                  {(!deliveryForm.name || !deliveryForm.address || !deliveryForm.colonia || !deliveryForm.phone) ? (
                    <p className="text-xs text-timon-coral text-center">Completa los campos obligatorios (*)</p>
                  ) : (
                    <a
                      href={buildWhatsAppURL()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => { setCart([]); setCartOpen(false); setCartStep('cart'); setDeliveryForm({ name: '', address: '', colonia: '', reference: '', phone: '', notes: '' }) }}
                      className="block w-full py-3.5 bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-semibold text-center rounded-xl transition-all"
                    >
                      Enviar pedido por WhatsApp
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
