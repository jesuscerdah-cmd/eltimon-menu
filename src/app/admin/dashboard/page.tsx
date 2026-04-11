'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Category, type MenuItem, BADGE_OPTIONS } from '@/lib/supabase'

// ── Toast Notification ──────────────────────────────────────────────
type ToastType = 'success' | 'error'

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium flex items-center gap-3 animate-[slideIn_0.3s_ease] ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      {type === 'success' ? (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      )}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  )
}

// ── Confirm Dialog ──────────────────────────────────────────────────
function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-[var(--timon-dark)] mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer">Eliminar</button>
        </div>
      </div>
    </div>
  )
}

// ── Category Modal ──────────────────────────────────────────────────
function CategoryModal({ category, onSave, onClose, saving }: {
  category: Category | null
  onSave: (data: { name: string; description: string; sort_order: number }) => void
  onClose: () => void
  saving: boolean
}) {
  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')
  const [sortOrder, setSortOrder] = useState(category?.sort_order || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[var(--timon-red)] via-[var(--timon-gold)] to-[var(--timon-red)]" />
        <div className="p-6">
          <h3 className="text-lg font-bold text-[var(--timon-dark)] mb-5">
            {category ? 'Editar Categoria' : 'Nueva Categoria'}
          </h3>
          <form onSubmit={(e) => { e.preventDefault(); onSave({ name, description, sort_order: sortOrder }) }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[var(--timon-dark)] outline-none focus:border-[var(--timon-red)] focus:ring-2 focus:ring-[var(--timon-red)]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[var(--timon-dark)] outline-none focus:border-[var(--timon-red)] focus:ring-2 focus:ring-[var(--timon-red)]/20 transition-all resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[var(--timon-dark)] outline-none focus:border-[var(--timon-red)] focus:ring-2 focus:ring-[var(--timon-red)]/20 transition-all" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--timon-red)] hover:bg-[var(--timon-red-dark)] disabled:opacity-60 transition-all cursor-pointer flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {category ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Menu Item Modal ─────────────────────────────────────────────────
function MenuItemModal({ item, categories, onSave, onClose, saving }: {
  item: MenuItem | null
  categories: Category[]
  onSave: (data: { name: string; description: string; price: number | null; category_id: string; image_url: string; is_active: boolean; sort_order: number; badge: string }) => void
  onClose: () => void
  saving: boolean
}) {
  const [name, setName] = useState(item?.name || '')
  const [description, setDescription] = useState(item?.description || '')
  const [price, setPrice] = useState(item?.price?.toString() || '')
  const [categoryId, setCategoryId] = useState(item?.category_id || categories[0]?.id || '')
  const [imageUrl, setImageUrl] = useState(item?.image_url || '')
  const [badge, setBadge] = useState(item?.badge || '')
  const [isActive, setIsActive] = useState(item?.is_active ?? true)
  const [sortOrder, setSortOrder] = useState(item?.sort_order || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-4">
        <div className="h-1 bg-gradient-to-r from-[var(--timon-red)] via-[var(--timon-gold)] to-[var(--timon-red)]" />
        <div className="p-6">
          <h3 className="text-lg font-bold text-[var(--timon-dark)] mb-5">
            {item ? 'Editar Platillo' : 'Nuevo Platillo'}
          </h3>
          <form onSubmit={(e) => { e.preventDefault(); onSave({ name, description, price: price ? parseFloat(price) : null, category_id: categoryId, image_url: imageUrl, badge, is_active: isActive, sort_order: sortOrder }) }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[var(--timon-dark)] outline-none focus:border-[var(--timon-red)] focus:ring-2 focus:ring-[var(--timon-red)]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[var(--timon-dark)] outline-none focus:border-[var(--timon-red)] focus:ring-2 focus:ring-[var(--timon-red)]/20 transition-all resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio (MXN)</label>
                <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[var(--timon-dark)] outline-none focus:border-[var(--timon-red)] focus:ring-2 focus:ring-[var(--timon-red)]/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[var(--timon-dark)] outline-none focus:border-[var(--timon-red)] focus:ring-2 focus:ring-[var(--timon-red)]/20 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[var(--timon-dark)] outline-none focus:border-[var(--timon-red)] focus:ring-2 focus:ring-[var(--timon-red)]/20 transition-all cursor-pointer">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[var(--timon-dark)] outline-none focus:border-[var(--timon-red)] focus:ring-2 focus:ring-[var(--timon-red)]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta</label>
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[var(--timon-dark)] outline-none focus:border-[var(--timon-red)] focus:ring-2 focus:ring-[var(--timon-red)]/20 transition-all cursor-pointer"
              >
                {BADGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt || 'Ninguna'}</option>
                ))}
              </select>
            </div>
            {/* Active toggle */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700">Activo en menu</span>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--timon-red)] hover:bg-[var(--timon-red-dark)] disabled:opacity-60 transition-all cursor-pointer flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {item ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Icons ───────────────────────────────────────────────────────────
const IconCategories = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
)
const IconMenu = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
)
const IconPreview = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
)
const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
)
const IconHamburger = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
)
const IconClose = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
)
const IconPlus = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
)

// ── Main Dashboard ──────────────────────────────────────────────────
type Section = 'items' | 'categories'

export default function AdminDashboard() {
  const router = useRouter()
  const [section, setSection] = useState<Section>('items')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Data
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('')

  // Modals
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null })
  const [itemModal, setItemModal] = useState<{ open: boolean; item: MenuItem | null }>({ open: false, item: null })
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'category' | 'item'; id: string; name: string } | null>(null)
  const [saving, setSaving] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const showToast = useCallback((message: string, type: ToastType) => setToast({ message, type }), [])

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.replace('/admin')
      return
    }
    try {
      const payload = JSON.parse(atob(token))
      if (payload.exp <= Date.now()) {
        localStorage.removeItem('admin_token')
        router.replace('/admin')
        return
      }
    } catch {
      localStorage.removeItem('admin_token')
      router.replace('/admin')
      return
    }
    setCheckingAuth(false)
  }, [router])

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoadingData(true)
    const [catRes, itemRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*, category:categories(id, name)').order('sort_order'),
    ])
    if (catRes.data) setCategories(catRes.data)
    if (itemRes.data) setItems(itemRes.data)
    if (catRes.error) showToast('Error cargando categorias', 'error')
    if (itemRes.error) showToast('Error cargando platillos', 'error')
    setLoadingData(false)
  }, [showToast])

  useEffect(() => {
    if (!checkingAuth) fetchData()
  }, [checkingAuth, fetchData])

  // ── CRUD: Categories ────────────────────────────────────────────
  async function saveCategory(data: { name: string; description: string; sort_order: number }) {
    setSaving(true)
    if (categoryModal.category) {
      const { error } = await supabase.from('categories').update(data).eq('id', categoryModal.category.id)
      if (error) { showToast('Error al actualizar categoria', 'error'); setSaving(false); return }
      showToast('Categoria actualizada', 'success')
    } else {
      const { error } = await supabase.from('categories').insert(data)
      if (error) { showToast('Error al crear categoria', 'error'); setSaving(false); return }
      showToast('Categoria creada', 'success')
    }
    setCategoryModal({ open: false, category: null })
    setSaving(false)
    fetchData()
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { showToast('Error al eliminar. Verifique que no tenga platillos asociados.', 'error'); return }
    showToast('Categoria eliminada', 'success')
    setConfirmDelete(null)
    fetchData()
  }

  // ── CRUD: Menu Items ────────────────────────────────────────────
  async function saveItem(data: { name: string; description: string; price: number | null; category_id: string; image_url: string; is_active: boolean; sort_order: number; badge: string }) {
    setSaving(true)
    if (itemModal.item) {
      const { error } = await supabase.from('menu_items').update(data).eq('id', itemModal.item.id)
      if (error) { showToast('Error al actualizar platillo', 'error'); setSaving(false); return }
      showToast('Platillo actualizado', 'success')
    } else {
      const { error } = await supabase.from('menu_items').insert(data)
      if (error) { showToast('Error al crear platillo', 'error'); setSaving(false); return }
      showToast('Platillo creado', 'success')
    }
    setItemModal({ open: false, item: null })
    setSaving(false)
    fetchData()
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) { showToast('Error al eliminar platillo', 'error'); return }
    showToast('Platillo eliminado', 'success')
    setConfirmDelete(null)
    fetchData()
  }

  async function toggleItemActive(item: MenuItem) {
    const { error } = await supabase.from('menu_items').update({ is_active: !item.is_active }).eq('id', item.id)
    if (error) { showToast('Error al cambiar estado', 'error'); return }
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i)))
  }

  function logout() {
    localStorage.removeItem('admin_token')
    router.push('/admin')
  }

  // Filter items
  const filteredItems = filterCategory
    ? items.filter((i) => i.category_id === filterCategory)
    : items

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--timon-cream)]">
        <div className="w-8 h-8 border-4 border-[var(--timon-red)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Nav items
  const navItems: { key: Section | 'preview' | 'logout'; label: string; icon: React.ReactNode }[] = [
    { key: 'items', label: 'Platillos', icon: <IconMenu /> },
    { key: 'categories', label: 'Categorias', icon: <IconCategories /> },
    { key: 'preview', label: 'Vista Previa', icon: <IconPreview /> },
    { key: 'logout', label: 'Cerrar Sesion', icon: <IconLogout /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title="Confirmar eliminacion"
          message={`Esta seguro que desea eliminar "${confirmDelete.name}"? Esta accion no se puede deshacer.`}
          onConfirm={() => confirmDelete.type === 'category' ? deleteCategory(confirmDelete.id) : deleteItem(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Category Modal */}
      {categoryModal.open && (
        <CategoryModal
          category={categoryModal.category}
          onSave={saveCategory}
          onClose={() => setCategoryModal({ open: false, category: null })}
          saving={saving}
        />
      )}

      {/* Item Modal */}
      {itemModal.open && (
        <MenuItemModal
          item={itemModal.item}
          categories={categories}
          onSave={saveItem}
          onClose={() => setItemModal({ open: false, item: null })}
          saving={saving}
        />
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static z-40 top-0 left-0 h-full w-64 bg-[var(--timon-dark)] text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-wide">EL TIMON</h1>
              <p className="text-[var(--timon-gold)] text-xs tracking-widest uppercase">Admin Panel</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white cursor-pointer">
              <IconClose />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((nav) => {
            if (nav.key === 'preview') {
              return (
                <a
                  key={nav.key}
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  {nav.icon}
                  {nav.label}
                  <svg className="w-3.5 h-3.5 ml-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                </a>
              )
            }
            if (nav.key === 'logout') {
              return (
                <button
                  key={nav.key}
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  {nav.icon}
                  {nav.label}
                </button>
              )
            }
            const isActive = section === nav.key
            return (
              <button
                key={nav.key}
                onClick={() => { setSection(nav.key as Section); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${isActive ? 'bg-[var(--timon-red)] text-white shadow-lg shadow-[var(--timon-red)]/30' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                {nav.icon}
                {nav.label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <p className="text-white/30 text-xs text-center">Cocteles y Mariscos desde 1995</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[var(--timon-dark)] cursor-pointer">
            <IconHamburger />
          </button>
          <h2 className="text-lg font-bold text-[var(--timon-dark)]">
            {section === 'items' ? 'Platillos del Menu' : 'Categorias'}
          </h2>
        </header>

        <div className="p-4 lg:p-6">
          {loadingData ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[var(--timon-red)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : section === 'categories' ? (
            /* ── Categories Section ──────────────────────────────── */
            <div>
              <div className="flex items-center justify-between mb-5">
                <p className="text-gray-500 text-sm">{categories.length} categoria{categories.length !== 1 ? 's' : ''}</p>
                <button
                  onClick={() => setCategoryModal({ open: true, category: null })}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--timon-red)] hover:bg-[var(--timon-red-dark)] transition-all cursor-pointer shadow-md"
                >
                  <IconPlus />
                  Nueva Categoria
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <IconCategories />
                  <p className="mt-2">No hay categorias aun</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Nombre</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Descripcion</th>
                          <th className="text-center px-5 py-3 font-semibold text-gray-600 w-20">Orden</th>
                          <th className="text-right px-5 py-3 font-semibold text-gray-600 w-32">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat) => (
                          <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3.5 font-medium text-[var(--timon-dark)]">{cat.name}</td>
                            <td className="px-5 py-3.5 text-gray-500 hidden sm:table-cell max-w-xs truncate">{cat.description || '-'}</td>
                            <td className="px-5 py-3.5 text-center text-gray-500">{cat.sort_order}</td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => setCategoryModal({ open: true, category: cat })}
                                  className="p-2 rounded-lg text-gray-400 hover:text-[var(--timon-red)] hover:bg-[var(--timon-red)]/5 transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                                </button>
                                <button
                                  onClick={() => setConfirmDelete({ type: 'category', id: cat.id, name: cat.name })}
                                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Menu Items Section ──────────────────────────────── */
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-gray-500 text-sm">{filteredItems.length} platillo{filteredItems.length !== 1 ? 's' : ''}</p>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-[var(--timon-dark)] outline-none focus:border-[var(--timon-red)] cursor-pointer"
                  >
                    <option value="">Todas las categorias</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setItemModal({ open: true, item: null })}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--timon-red)] hover:bg-[var(--timon-red-dark)] transition-all cursor-pointer shadow-md"
                >
                  <IconPlus />
                  Nuevo Platillo
                </button>
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <IconMenu />
                  <p className="mt-2">No hay platillos{filterCategory ? ' en esta categoria' : ' aun'}</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left px-5 py-3 font-semibold text-gray-600">Platillo</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Categoria</th>
                          <th className="text-right px-5 py-3 font-semibold text-gray-600 w-28">Precio</th>
                          <th className="text-center px-5 py-3 font-semibold text-gray-600 w-24">Estado</th>
                          <th className="text-right px-5 py-3 font-semibold text-gray-600 w-32">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item) => (
                          <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-medium text-[var(--timon-dark)]">
                                {item.name}
                                {item.badge && (
                                  <span className="inline-flex ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--timon-teal)]/10 text-[var(--timon-teal)]">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{item.description}</div>
                              )}
                            </td>
                            <td className="px-5 py-3.5 hidden md:table-cell">
                              <span className="inline-flex px-2.5 py-1 rounded-lg bg-[var(--timon-cream)] text-xs font-medium text-[var(--timon-dark)]">
                                {(item.category as unknown as Category)?.name || '-'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right font-medium text-[var(--timon-dark)]">
                              {item.price != null ? `$${Number(item.price).toFixed(2)}` : '-'}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <button
                                onClick={() => toggleItemActive(item)}
                                className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${item.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                                title={item.is_active ? 'Activo' : 'Inactivo'}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${item.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                              </button>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => setItemModal({ open: true, item })}
                                  className="p-2 rounded-lg text-gray-400 hover:text-[var(--timon-red)] hover:bg-[var(--timon-red)]/5 transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                                </button>
                                <button
                                  onClick={() => setConfirmDelete({ type: 'item', id: item.id, name: item.name })}
                                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Keyframe animation for toast slide-in */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
