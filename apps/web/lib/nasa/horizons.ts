/**
 * NASA JPL Horizons API Client (Server-Side)
 * Fetches orbital data for interstellar objects
 */

export interface ISOData {
  object_id: string
  name: string
  designation: string
  discovery_date: string
  // Will be populated from NASA API in future
  orbital_data?: any
}

/**
 * Fetch ISO objects from database
 */
export async function getISOObjects() {
  // This will be implemented with actual Supabase calls
  // For now, return mock data to get pages working
  return [
    {
      id: '1',
      nasa_id: '1I',
      name: "1I/'Oumuamua",
      designation: 'A/2017 U1',
      discovery_date: '2017-10-19',
      object_type: 'interstellar'
    },
    {
      id: '2',
      nasa_id: '2I',
      name: '2I/Borisov',
      designation: 'C/2019 Q4',
      discovery_date: '2019-08-30',
      object_type: 'interstellar'
    },
    {
      id: '3',
      nasa_id: '3I',
      name: '3I/ATLAS',
      designation: 'A/2025 O1',
      discovery_date: '2025-07-01',
      object_type: 'interstellar'
    }
  ]
}

/**
 * Fetch single ISO by ID
 */
export async function getISOById(id: string) {
  const objects = await getISOObjects()
  return objects.find(obj => obj.id === id)
}
