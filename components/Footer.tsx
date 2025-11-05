// components/Footer.tsx
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-800 mt-16">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left: address + contact */}
        <div className="text-sm text-neutral-400 space-y-1 text-center md:text-left">
          <div>11500 SW 47th St, Miami, FL 33165</div>
          <div>
            <a href="tel:+17867606175" className="hover:underline">(786) 760-6175</a>
          </div>
          <div>
            <a
              href="mailto:JLAtrailerrental@gmail.com"
              className="hover:underline"
            >
              JLAtrailerrental@gmail.com
            </a>
          </div>
          <div className="text-neutral-500">© {year} JLA Trailer Rentals</div>
        </div>

        {/* Right: Instagram */}
        <div className="flex items-center justify-center md:justify-end">
          <a
            href="https://instagram.com/jlatrailerrentals"
            target="_blank"
            rel="noopener"
            aria-label="JLA Trailer Rentals on Instagram"
            className="group inline-flex items-center gap-2 rounded-xl border border-neutral-700 px-3 py-2 hover:border-neutral-500 hover:bg-neutral-800/40"
          >
            {/* Instagram glyph (inline SVG, no extra deps) */}
            <svg
              width="22" height="22" viewBox="0 0 24 24"
              fill="none" xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <rect x="2" y="2" width="20" height="20" rx="5"
                    stroke="currentColor" className="text-neutral-400 group-hover:text-neutral-200" />
              <circle cx="12" cy="12" r="4"
                      stroke="currentColor" className="text-neutral-400 group-hover:text-neutral-200" />
              <circle cx="17.5" cy="6.5" r="1.25"
                      fill="currentColor" className="text-neutral-400 group-hover:text-neutral-200" />
            </svg>
            <span className="text-sm font-medium text-neutral-300 group-hover:text-neutral-100">
              @jlatrailerrentals
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
