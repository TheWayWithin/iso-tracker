import Link from 'next/link'
import { getISOObjects } from '@/lib/nasa/horizons'

export default async function ISOObjectsPage() {
  const isos = await getISOObjects()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Interstellar Objects</h1>
          <p className="text-gray-600">
            Tracking {isos.length} confirmed interstellar object{isos.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ISO Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isos.map((iso) => (
            <Link
              key={iso.id}
              href={`/iso-objects/${iso.id}`}
              className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-blue-600">{iso.name}</h2>
                  <p className="text-gray-600 text-sm">{iso.designation}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {iso.object_type}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">NASA ID:</span>
                  <span className="font-mono font-semibold">{iso.nasa_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discovered:</span>
                  <span className="font-semibold">
                    {new Date(iso.discovery_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-blue-600 text-sm flex items-center">
                  View Details
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
