import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Category = {
  id: string
  name: string
  description: string
  sort_order: number
}

export type MenuItem = {
  id: string
  name: string
  description: string
  price: number | null
  category_id: string
  image_url: string
  is_active: boolean
  sort_order: number
  category?: Category
}
