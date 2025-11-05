// components/Footer.tsx
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-neutral-800 mt-16">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-4 items-center justify-between text-center md:text-left">
        
        {/* Left side: address and contact */}
        <div className="text-sm text-neutral-400">
          <p>11500 SW 47th St, Miami, FL 33165</p>
          <p>
            <a href="tel:+17867606175" className="hover:underline">(786) 760-6175</a>
          </p>
        </div>

        {/* Right side: links + copyright */}
        <div className="flex flex-col md:items-end gap-2">
          <div className="flex items-center justify-center md:justify-end gap-4">
            <a href="mailto:[email protected]" className="hover:underline">Email</a>
            <a
              href="https://instagram.com/jlatrailerrentals"
              target="_blank"
              rel="noopener"
              aria-label="Instagram"
              className="flex items-center gap-1 hover:opacity-80"
            >
              <span className="inline-block w-5 h-5 rounded-md border border-neutral-500" />
              <span>@jlatrailerrentals</span>
            </a>
          </div>
          <div className="text-sm text-neutral-500">© {year} JLA Trailer Rentals</div>
        </div>

      </div>
    </footer>
  );
}
