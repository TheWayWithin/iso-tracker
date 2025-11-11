import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getISOById } from '@/lib/nasa/horizons'

export default async function ISODetailPage({
  params,
}: {
  params: { id: string }
}) {
  const iso = await getISOById(params.id)

  if (!iso) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/iso-objects" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Objects
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{iso.name}</h1>
              <p className="text-gray-600">{iso.designation}</p>
            </div>
          </div>
        </div>

        {/* Basic Info Card */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Object Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-600 text-sm">NASA ID</p>
              <p className="font-mono font-semibold">{iso.nasa_id}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Type</p>
              <p className="capitalize font-semibold">{iso.object_type}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Discovery Date</p>
              <p className="font-semibold">{new Date(iso.discovery_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Coordinate System Tabs */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">NASA Horizons Data</h2>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200 mb-6">
            <button className="px-6 py-3 font-medium text-blue-600 border-b-2 border-blue-600">
              Geocentric View
            </button>
            <button className="px-6 py-3 font-medium text-gray-500 hover:text-gray-700">
              Heliocentric View
            </button>
          </div>

          {/* Placeholder Content */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-blue-800 font-medium mb-2">NASA API Integration Coming Soon</p>
            <p className="text-blue-600 text-sm">
              This will display orbital elements, ephemeris data, and physical properties
              from the NASA JPL Horizons system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
