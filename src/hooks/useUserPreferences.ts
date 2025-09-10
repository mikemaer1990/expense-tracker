import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export interface UserPreferences {
  currency: string
  dateFormat: string
  theme: string
}

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'CAD',
  dateFormat: 'MM/DD/YYYY',
  theme: 'light'
}

const STORAGE_KEYS = {
  currency: 'expense_tracker_currency',
  dateFormat: 'expense_tracker_dateFormat',
  theme: 'expense_tracker_theme'
} as const

export function useUserPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load preferences from localStorage immediately
  const loadFromLocalStorage = (): UserPreferences => {
    return {
      currency: localStorage.getItem(STORAGE_KEYS.currency) || DEFAULT_PREFERENCES.currency,
      dateFormat: localStorage.getItem(STORAGE_KEYS.dateFormat) || DEFAULT_PREFERENCES.dateFormat,
      theme: localStorage.getItem(STORAGE_KEYS.theme) || DEFAULT_PREFERENCES.theme
    }
  }

  // Save to localStorage
  const saveToLocalStorage = (prefs: UserPreferences) => {
    localStorage.setItem(STORAGE_KEYS.currency, prefs.currency)
    localStorage.setItem(STORAGE_KEYS.dateFormat, prefs.dateFormat)
    localStorage.setItem(STORAGE_KEYS.theme, prefs.theme)
  }

  // Load preferences from Supabase
  const loadFromSupabase = async (): Promise<UserPreferences | null> => {
    if (!user?.id) return null

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('currency, date_format, theme')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found - this is normal for new users
          return null
        }
        throw error
      }

      return {
        currency: data.currency,
        dateFormat: data.date_format,
        theme: data.theme
      }
    } catch (err) {
      console.error('Error loading preferences from Supabase:', err)
      return null
    }
  }

  // Save preferences to Supabase
  const saveToSupabase = async (prefs: UserPreferences) => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          currency: prefs.currency,
          date_format: prefs.dateFormat,
          theme: prefs.theme,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error
    } catch (err) {
      console.error('Error saving preferences to Supabase:', err)
      // Don't throw - we want localStorage to still work
    }
  }

  // Update a specific preference
  const updatePreference = async (key: keyof UserPreferences, value: string) => {
    const newPreferences = { ...preferences, [key]: value }
    
    // Update state immediately
    setPreferences(newPreferences)
    
    // Save to localStorage immediately (for instant feedback)
    saveToLocalStorage(newPreferences)
    
    // Save to Supabase in background
    await saveToSupabase(newPreferences)
  }

  // Migrate existing localStorage preferences to Supabase
  const migrateToSupabase = async (localPrefs: UserPreferences) => {
    if (!user?.id) return

    // Check if we already have preferences in Supabase
    const supabasePrefs = await loadFromSupabase()
    if (supabasePrefs) return // Already migrated

    // Save localStorage preferences to Supabase
    await saveToSupabase(localPrefs)
  }

  // Initialize preferences on component mount and user change
  useEffect(() => {
    const initializePreferences = async () => {
      setLoading(true)
      setError(null)

      try {
        // Always load from localStorage first (fastest)
        const localPrefs = loadFromLocalStorage()
        setPreferences(localPrefs)

        if (user?.id) {
          // Try to load from Supabase
          const supabasePrefs = await loadFromSupabase()
          
          if (supabasePrefs) {
            // Use Supabase preferences and update localStorage
            setPreferences(supabasePrefs)
            saveToLocalStorage(supabasePrefs)
          } else {
            // No Supabase preferences found, migrate localStorage data
            await migrateToSupabase(localPrefs)
          }
        }
        
        // Clear any previous errors if we got here successfully
        setError(null)
      } catch (err) {
        setError('Failed to load preferences')
        console.error('Error initializing preferences:', err)
        // Fallback to localStorage preferences
        const localPrefs = loadFromLocalStorage()
        setPreferences(localPrefs)
      } finally {
        setLoading(false)
      }
    }

    initializePreferences()
  }, [user?.id])

  return {
    preferences,
    loading,
    error,
    updatePreference
  }
}