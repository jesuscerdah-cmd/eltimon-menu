'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase, type Category, type MenuItem } from '@/lib/supabase'

// ── Constants ──────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '528344373709'
const WHATSAPP_MESSAGE = 'Hola, me gustaría hacer un pedido desde el menú digital'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
const PHONE_NUMBER = '+528344373709'
const MAPS_URL = 'https://maps.google.com/?q=Hidalgo+182+Centro+Monterrey+NL+Mexico'

const RECOMMENDED_ITEMS = new Set([
  'Mariscada',
  'Camarones Rellenos',
  'Tampiqueña Marinera',
  'Ensalada Timón',
  'Hamburguesa Timón',
])

const POPULAR_ITEMS = new Set([
  'Caldo de Pescado',
  'Ceviche Chico',
  'Filete Empanizado',
])

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

function getBadge(name: string): 'recomendado' | 'popular' | null {
  if (RECOMMENDED_ITEMS.has(name)) return 'recomendado'
  if (POPULAR_ITEMS.has(name)) return 'popular'
  return null
}

type DisplayCategory = {
  id: string
  name: string
  description: string
  catIds: string[]
}

// ── Skeleton Loading ────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-timon-navy/5 p-4 sm:p-5">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2.5">
          <div className="h-5 bg-timon-navy/8 rounded-md w-3/4 animate-pulse" />
          <div className="h-3.5 bg-timon-navy/5 rounded w-full animate-pulse" />
          <div className="h-3.5 bg-timon-navy/5 rounded w-2/3 animate-pulse" />
        </div>
        <div className="h-6 bg-timon-navy/8 rounded-md w-20 animate-pulse flex-shrink-0" />
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

function Badge({ type }: { type: 'recomendado' | 'popular' }) {
  if (type === 'recomendado') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-timon-gold/15 text-timon-gold border border-timon-gold/20">
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
        Chef recomienda
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-timon-teal/10 text-timon-teal border border-timon-teal/15">
      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
      Popular
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

// ── Main Component ──────────────────────────────────────────────────

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')

  const sectionRefs = useRef(new Map<string, HTMLElement>())
  const navRef = useRef<HTMLDivElement>(null)
  const navButtonRefs = useRef(new Map<string, HTMLButtonElement>())
  const isClickScrolling = useRef(false)

  // ── Fetch data ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      const [catRes, itemRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*').eq('is_active', true).order('sort_order'),
      ])
      setCategories(catRes.data || [])
      setItems(itemRes.data || [])
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
            10:00 AM - 10:00 PM
          </span>
        </div>
      </header>

      {/* Category Nav */}
      {!loading && visibleCategories.length > 0 && (
        <nav className="sticky top-0 z-30 bg-timon-sand/95 backdrop-blur-md border-b border-timon-navy/5">
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
                        const badge = getBadge(item.name)
                        const hasImage = item.image_url && item.image_url.length > 0
                        return (
                          <div
                            key={item.id}
                            className={`animate-fade-in bg-white rounded-xl border border-timon-navy/5 hover:border-timon-teal/20 hover:shadow-sm transition-all duration-200 overflow-hidden ${hasImage ? 'flex' : 'p-4 sm:p-5'}`}
                            style={{ animationDelay: `${index * 40}ms` }}
                          >
                            {/* Image thumbnail */}
                            {hasImage && (
                              <div className="w-24 sm:w-28 flex-shrink-0">
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            {/* Content */}
                            <div className={hasImage ? 'flex-1 p-3 sm:p-4 min-w-0' : ''}>
                              {badge && <div className="mb-1.5"><Badge type={badge} /></div>}
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-heading font-semibold text-timon-navy text-[15px] sm:text-base leading-snug">{item.name}</h3>
                                <div className="flex-shrink-0"><Price value={item.price} /></div>
                              </div>
                              {item.description && (
                                <p className="text-timon-gray text-[13px] sm:text-sm leading-relaxed mt-1 line-clamp-2">{item.description}</p>
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
              <p className="text-white/70 leading-relaxed">Lunes a Domingo<br />10:00 AM - 10:00 PM</p>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wider text-timon-gold font-semibold mb-2">Contacto</h3>
              <div className="text-white/70 space-y-1">
                <a href="tel:+528344373709" className="block hover:text-timon-teal transition-colors">83 4437-3709</a>
                <a href="tel:+528343737388" className="block hover:text-timon-teal transition-colors">83 4373-7388</a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors mt-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.596-.798-6.364-2.143l-.444-.333-3.206 1.074 1.074-3.206-.333-.444A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" /></svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-white/25 text-xs">Menu digital</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Float */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-4 bottom-[5.5rem] sm:bottom-6 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        aria-label="Ordenar por WhatsApp"
      >
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.596-.798-6.364-2.143l-.444-.333-3.206 1.074 1.074-3.206-.333-.444A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
        </svg>
      </a>

      {/* Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1E3A5F] flex gap-2 px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] sm:hidden">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-lg min-h-[44px] transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.596-.798-6.364-2.143l-.444-.333-3.206 1.074 1.074-3.206-.333-.444A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" /></svg>
          Ordenar
        </a>
        <a href={`tel:${PHONE_NUMBER}`} className="flex-1 flex items-center justify-center gap-2 bg-timon-teal hover:bg-timon-teal-dark text-white font-semibold text-sm rounded-lg min-h-[44px] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          Reservar
        </a>
      </div>
    </div>
  )
}
