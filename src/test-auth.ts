// Quick test file to verify Supabase connection
import { supabase } from './lib/supabase'

// Test function to check if Supabase is properly connected
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test 1: Check if client is created
    console.log('Supabase client URL:', supabase.supabaseUrl)
    
    // Test 2: Try to get session (this should work even without auth)
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    console.log('Session test:', { session, error: sessionError })
    
    // Test 3: Try a simple signup with minimal data
    const testEmail = 'test@example.com'
    const testPassword = 'testpass123'
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })
    
    console.log('Signup test result:', { data, error })
    
  } catch (error) {
    console.error('Connection test failed:', error)
  }
}

// Run this in browser console: 
// import('./test-auth').then(m => m.testSupabaseConnection())