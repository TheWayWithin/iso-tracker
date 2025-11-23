import { notFound } from 'next/navigation'
import { getISOById } from '@/lib/nasa/horizons'
import { ISODetailTabs } from '@/components/visualization/ISODetailTabs'
import { ISODetailHeader } from '@/components/isos/ISODetailHeader'

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
        {/* Header with Follow Button */}
        <ISODetailHeader
          isoId={iso.id}
          isoName={iso.name}
          isoDesignation={iso.designation}
        />

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
