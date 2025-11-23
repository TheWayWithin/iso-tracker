export default function AtlasLanding() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0A1628] via-[#0D1B2A] to-[#0A1628] relative overflow-hidden">
      {/* Star field overlay */}
      <div className="absolute inset-0 star-field opacity-50 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 text-center">
        {/* Urgency Badge */}
        <div className="inline-flex items-center gap-2 bg-[#10B981]/20 border border-[#10B981]/50 rounded-full px-6 py-2 mb-8 relative">
          <span className="w-3 h-3 bg-[#10B981] rounded-full animate-ping opacity-75 absolute" />
          <span className="w-3 h-3 bg-[#10B981] rounded-full relative" />
          <span className="text-sm font-bold text-[#10B981] uppercase tracking-widest ml-1">Visible Now</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-[#F5F7FA] font-['Space_Grotesk'] tracking-tight mb-6">
          <span className="text-[#FFB84D]">3I/ATLAS</span>
          <br />
          Is Here
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-[#CBD5E1] mb-10 max-w-md mx-auto leading-relaxed">
          The third interstellar visitor is passing through our solar system right now.
          <span className="text-[#F5F7FA] font-medium"> Get real-time alerts when new evidence drops.</span>
        </p>

        {/* Email Form */}
        <form className="w-full max-w-md mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-[#0A1628]/80 border border-[#2E5BFF]/30 rounded-lg px-4 py-4 text-[#F5F7FA] placeholder-[#64748B] focus:border-[#2E5BFF] focus:outline-none focus:ring-2 focus:ring-[#2E5BFF]/20 text-base min-h-[48px]"
              required
              aria-label="Email address"
            />
            <button
              type="submit"
              className="bg-[#FFB84D] hover:bg-[#FFC978] text-[#0A1628] font-semibold px-8 py-4 rounded-lg min-h-[48px] transition-all duration-200 shadow-[0_4px_16px_rgba(255,184,77,0.3)] hover:shadow-[0_6px_20px_rgba(255,184,77,0.4)] whitespace-nowrap"
            >
              Notify Me
            </button>
          </div>
        </form>

        {/* Social Proof */}
        <p className="text-sm text-[#64748B] mb-12">
          Join <span className="text-[#F5F7FA] font-medium">12,000+</span> observers tracking now
        </p>

        {/* Explainer Section */}
        <div className="border-t border-[#2E5BFF]/10 pt-12 max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-[#F5F7FA] mb-4 font-['Space_Grotesk']">
            What is 3I/ATLAS?
          </h2>
          <p className="text-[#94A3B8] mb-6 leading-relaxed">
            3I/ATLAS is the third confirmed interstellar object detected in our solar system -
            an object from another star system passing through our cosmic neighborhood.
            Our platform lets you track its journey in real-time.
          </p>
          <a
            href="https://isotracker.org"
            className="inline-flex items-center gap-2 text-[#2E5BFF] hover:text-[#4B73FF] font-medium transition-colors"
          >
            Learn more at isotracker.org
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-[#2E5BFF]/10 text-center w-full">
          <p className="text-xs text-[#64748B]">
            2025 ISO Tracker. Democratizing the search for interstellar visitors.
          </p>
        </footer>
      </div>
    </main>
  );
}
