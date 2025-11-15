import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">🌌</div>
        <h1 className="text-3xl font-bold text-slate-100 mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-slate-400 mb-6">
          This page has drifted beyond our observable range, much like an
          interstellar object after perihelion. The content you&apos;re looking
          for may have moved or doesn&apos;t exist.
        </p>
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/iso-objects"
            className="block w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Browse ISO Objects
          </Link>
          <Link
            href="/"
            className="block text-blue-400 hover:text-blue-300 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
