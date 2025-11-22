import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '3I/ATLAS - The Third Interstellar Object | Now Visible',
  description: 'Track 3I/ATLAS, the third confirmed interstellar object now visible in our solar system. Join evidence-based analysis of this historic astronomical event.',
  openGraph: {
    title: '3I/ATLAS - Third Interstellar Object Now Visible',
    description: 'Be part of history. Track and analyze the third confirmed visitor from interstellar space.',
    type: 'website',
  },
}

export default function ThreeIAtlasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full mb-6">
            <span className="animate-pulse w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="font-semibold">NOW VISIBLE</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
            3I/ATLAS
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-4">
            The <span className="text-purple-400 font-semibold">third confirmed interstellar object</span> is passing through our solar system now.
          </p>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            After 1I/'Oumuamua and 2I/Borisov, this is your chance to participate in evidence-based
            analysis as history unfolds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              Join the Analysis
            </Link>
            <Link
              href="#timeline"
              className="inline-flex items-center justify-center px-8 py-4 border border-purple-600 text-lg font-medium rounded-md text-purple-400 hover:bg-purple-900/30 transition-colors"
            >
              View Timeline
            </Link>
          </div>
        </div>
      </section>

      {/* Key Facts */}
      <section className="bg-slate-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            What We Know
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">3rd</div>
              <div className="text-slate-400">Interstellar Object</div>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">2025</div>
              <div className="text-slate-400">Observation Window</div>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">TBD</div>
              <div className="text-slate-400">Origin Classification</div>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">Live</div>
              <div className="text-slate-400">NASA JPL Tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Question */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-8 border border-purple-700/50">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              The Central Question
            </h2>
            <p className="text-xl text-slate-300 text-center mb-8">
              Is 3I/ATLAS a natural comet from another star system, or something else entirely?
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-lg text-center">
                <div className="text-green-400 font-semibold mb-2">Natural Origin</div>
                <p className="text-sm text-slate-400">Comet or asteroid ejected from another star system</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg text-center">
                <div className="text-yellow-400 font-semibold mb-2">Uncertain</div>
                <p className="text-sm text-slate-400">Insufficient evidence for definitive classification</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg text-center">
                <div className="text-red-400 font-semibold mb-2">Artificial Origin</div>
                <p className="text-sm text-slate-400">Technology or construction from intelligent beings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section id="timeline" className="bg-slate-800/50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Observation Timeline
          </h2>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-24 text-right">
                <span className="text-purple-400 font-semibold">Discovery</span>
              </div>
              <div className="flex-shrink-0 w-4 h-4 bg-purple-600 rounded-full mt-1"></div>
              <div>
                <h3 className="text-white font-semibold">Initial Detection</h3>
                <p className="text-slate-400">Object identified by ATLAS survey telescope</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-24 text-right">
                <span className="text-purple-400 font-semibold">Analysis</span>
              </div>
              <div className="flex-shrink-0 w-4 h-4 bg-purple-600 rounded-full mt-1"></div>
              <div>
                <h3 className="text-white font-semibold">Evidence Collection</h3>
                <p className="text-slate-400">Spectroscopy, trajectory analysis, and surface composition studies</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-24 text-right">
                <span className="text-green-400 font-semibold">Current</span>
              </div>
              <div className="flex-shrink-0 w-4 h-4 bg-green-500 rounded-full mt-1 animate-pulse"></div>
              <div>
                <h3 className="text-white font-semibold">Peak Observation Window</h3>
                <p className="text-slate-400">Best visibility for detailed analysis and evidence submission</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-24 text-right">
                <span className="text-slate-500 font-semibold">Upcoming</span>
              </div>
              <div className="flex-shrink-0 w-4 h-4 bg-slate-600 rounded-full mt-1"></div>
              <div>
                <h3 className="text-white font-semibold">Post-Perihelion Analysis</h3>
                <p className="text-slate-400">Continued tracking as object exits inner solar system</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why This Matters
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">Scientific Precedent</h3>
              <p className="text-slate-400">
                Only the third confirmed interstellar object. Each one teaches us something new about
                objects from beyond our solar system. The analysis methodology we develop here will
                set standards for future discoveries.
              </p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">Evidence-Based Analysis</h3>
              <p className="text-slate-400">
                Unlike social media speculation, ISO Tracker provides structured evaluation. Every claim
                is scored on chain of custody, witness credibility, and technical merit. See where
                the evidence actually points.
              </p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">Community Consensus</h3>
              <p className="text-slate-400">
                Watch in real-time as the scientific community weighs in. No echo chambers, no
                algorithms pushing sensationalism. Just rigorous analysis and transparent voting
                on the evidence.
              </p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">Be Part of History</h3>
              <p className="text-slate-400">
                This is a rare opportunity. Interstellar objects are detected once per decade at most.
                Your analysis and verdict become part of the permanent record for this historic event.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Track It Live
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            The observation window is open now. Join thousands of observers analyzing evidence
            in real-time as 3I/ATLAS passes through our solar system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 border border-slate-600 text-lg font-medium rounded-md text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Learn More About ISO Tracker
            </Link>
          </div>
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
              <Link href="/" className="text-slate-400 hover:text-white">
                Home
              </Link>
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
