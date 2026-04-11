import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDFAF5] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚓</div>
        <h1 className="font-heading text-3xl font-bold text-[#1E3A5F] mb-2" style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)' }}>
          Pagina no encontrada
        </h1>
        <p className="text-[#6B7280] mb-6">
          Este platillo no esta en el menu... pero tenemos muchos mas.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#2A9D8F] hover:bg-[#238B7E] text-white font-semibold rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Volver al menu
        </Link>
      </div>
    </div>
  )
}
