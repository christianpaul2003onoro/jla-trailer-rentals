// components/Footer.tsx
export default function Footer() {
  return (
    <>
      <footer className="foot">
        <div className="row">
          <span>11500 SW 47th St, Miami, FL 33165</span>
        </div>
        <div className="row">
          <a href="tel:+17867606175">(786) 760-6175</a>
          <span className="sep">•</span>
          <a href="mailto:JLAtrailerrental@gmail.com">JLAtrailerrental@gmail.com</a>
          <span className="sep">•</span>
          <a href="https://instagram.com/jlatrailerrentals" target="_blank" rel="noreferrer">
            @jlatrailerrentals
          </a>
        </div>
        <div className="row dim">© 2025 JLA Trailer Rentals</div>
      </footer>

      <style jsx>{`
        .foot {
          position: fixed;           /* always visible, no scrolling needed */
          left: 0; right: 0; bottom: 0;
          z-index: 40;
          background: rgba(2, 6, 23, 0.60);   /* glassy */
          backdrop-filter: blur(6px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 14px 16px;
          display: grid;
          gap: 6px;
          text-align: center;
        }
        .row { color: #cbd5e1; font-size: 14px; }
        .row.dim { color: #94a3b8; font-size: 12px; }
        a { color: #93c5fd; text-decoration: none; }
        a:hover { color: #bfdbfe; }
        .sep { margin: 0 8px; color: #94a3b8; }
        @media (max-width: 420px) {
          .row { font-size: 13px; }
          .row.dim { font-size: 11px; }
        }
      `}</style>
    </>
  );
}
