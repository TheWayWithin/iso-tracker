import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
        {/* Star field overlay */}
        <div className="absolute inset-0 star-field opacity-60" />
        <div className="text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Are We Alone?
            <span className="block text-blue-400">Track the Answer.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Something is passing through our solar system. Thousands are already watching. Join them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Start Free - View Evidence
            </Link>
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center justify-center px-8 py-3 border border-slate-600 text-base font-medium rounded-md text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="bg-slate-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why ISO Tracker?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <div className="text-blue-400 text-2xl mb-4">📡</div>
              <h3 className="text-xl font-semibold text-white mb-3">Live Sky Tracking</h3>
              <p className="text-slate-400">
                Watch interstellar visitors cross your sky. Real-time positions, updated every minute.
              </p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <div className="text-blue-400 text-2xl mb-4">🔭</div>
              <h3 className="text-xl font-semibold text-white mb-3">Observation Planning</h3>
              <p className="text-slate-400">
                Know exactly when and where to look tonight. Custom alerts for optimal viewing from your location.
              </p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <div className="text-blue-400 text-2xl mb-4">🗳️</div>
              <h3 className="text-xl font-semibold text-white mb-3">Community Debate</h3>
              <p className="text-slate-400">
                Cast your vote: alien or natural? Join 12,000+ observers analyzing the evidence together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured ISO */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-8 border border-blue-700/50">
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
                UPCOMING
              </span>
              <h2 className="text-2xl font-bold text-white">3I/ATLAS - Observation Window</h2>
            </div>
            <p className="text-slate-300 mb-6">
              The next confirmed interstellar object is approaching. Track the evidence as it develops
              and join the analysis when the observation window opens.
            </p>
            <Link
              href="/3i-atlas"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
            >
              Learn more about 3I/ATLAS
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="bg-slate-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Choose Your Role
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Start free as a Spectator, or upgrade to contribute evidence and verdicts.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Spectator */}
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-2">Spectator</h3>
              <p className="text-3xl font-bold text-white mb-4">Free</p>
              <ul className="space-y-3 text-slate-400 mb-6">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  View all evidence
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Read assessments
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Follow ISOs
                </li>
              </ul>
              <Link
                href="/auth/sign-up"
                className="block text-center w-full py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Event Pass */}
            <div className="bg-slate-900 p-6 rounded-lg border border-blue-600 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                POPULAR
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Event Pass</h3>
              <p className="text-3xl font-bold text-white mb-4">
                $4.99<span className="text-sm text-slate-400">/mo</span>
              </p>
              <ul className="space-y-3 text-slate-400 mb-6">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Everything in Spectator
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Email alerts
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Priority support
                </li>
              </ul>
              <Link
                href="/auth/sign-up?tier=event_pass"
                className="block text-center w-full py-2 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors"
              >
                Subscribe
              </Link>
            </div>

            {/* Evidence Analyst */}
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-2">Evidence Analyst</h3>
              <p className="text-3xl font-bold text-white mb-4">
                $19<span className="text-sm text-slate-400">/mo</span>
              </p>
              <ul className="space-y-3 text-slate-400 mb-6">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Everything in Event Pass
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit evidence
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Cast verdicts
                </li>
              </ul>
              <Link
                href="/auth/sign-up?tier=evidence_analyst"
                className="block text-center w-full py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Subscribe
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Separate Fact from Fiction?
          </h2>
          <p className="text-slate-400 mb-8">
            Join thousands of evidence-based analysts tracking interstellar objects.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 mb-4 md:mb-0">
              &copy; 2025 ISO Tracker. Evidence-based analysis for interstellar objects.
            </div>
            <div className="flex gap-6">
              <Link href="/guidelines" className="text-slate-400 hover:text-white">
                Guidelines
              </Link>
              <Link href="/iso-objects" className="text-slate-400 hover:text-white">
                Browse ISOs
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
