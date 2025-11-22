import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: criteria, error } = await supabase
      .from('loeb_scale_criteria')
      .select('*')
      .order('level', { ascending: true })

    if (error) {
      console.error('Error fetching Loeb Scale criteria:', error)
      return NextResponse.json(
        { error: 'Failed to fetch criteria' },
        { status: 500 }
      )
    }

    return NextResponse.json({ criteria })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
