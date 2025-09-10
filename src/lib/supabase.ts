import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (will be expanded as we build)
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          is_default?: boolean
          created_at?: string
        }
      }
      expense_types: {
        Row: {
          id: string
          category_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          expense_type_id: string
          amount: number
          description: string | null
          date: string
          is_recurring: boolean
          recurring_expense_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          expense_type_id: string
          amount: number
          description?: string | null
          date: string
          is_recurring?: boolean
          recurring_expense_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          expense_type_id?: string
          amount?: number
          description?: string | null
          date?: string
          is_recurring?: boolean
          recurring_expense_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          currency: string
          date_format: string
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          currency?: string
          date_format?: string
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          currency?: string
          date_format?: string
          theme?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}