/**
 * NASA JPL Horizons API Client (Server-Side)
 * Fetches orbital data for interstellar objects
 */

import { createClient } from '@/lib/supabase/server'

export interface ISOData {
  id: string
  nasa_id: string
  name: string
  designation: string
  discovery_date: string
  object_type: string
  // Will be populated from NASA API in future
  orbital_data?: any
}

/**
 * Fetch ISO objects from database
 */
export async function getISOObjects() {
  const supabase = await createClient()

  const { data: objects, error } = await supabase
    .from('iso_objects')
    .select('id, nasa_id, name, designation, discovery_date, object_type')
    .order('discovery_date', { ascending: false })

  if (error) {
    console.error('Failed to fetch ISO objects:', error)
    return []
  }

  return objects || []
}

/**
 * Fetch single ISO by ID (supports both UUID and numeric lookup)
 */
export async function getISOById(id: string) {
  const supabase = await createClient()

  // Try UUID lookup first
  const { data: object, error } = await supabase
    .from('iso_objects')
    .select('id, nasa_id, name, designation, discovery_date, object_type')
    .eq('id', id)
    .single()

  if (object) {
    return object
  }

  // If UUID lookup failed, try numeric lookup by nasa_id (for backward compatibility)
  const { data: objectByNasa, error: nasaError } = await supabase
    .from('iso_objects')
    .select('id, nasa_id, name, designation, discovery_date, object_type')
    .eq('nasa_id', `${id}I`)
    .single()

  return objectByNasa || null
}
