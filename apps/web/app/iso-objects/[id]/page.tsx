import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getISOById } from '@/lib/nasa/horizons'
import { ISODetailTabs } from '@/components/visualization/ISODetailTabs'

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{iso.name}</h1>
              <p className="text-gray-700 font-medium">{iso.designation}</p>
            </div>
          </div>
        </div>

        {/* Main Content - Tab Navigation */}
        <ISODetailTabs
          isoId={iso.id}
          isoName={iso.name}
          isoNasaId={iso.nasa_id}
          isoObjectType={iso.object_type}
          isoDiscoveryDate={iso.discovery_date}
          isoDesignation={iso.designation}
        />
      </div>
    </div>
  )
}
