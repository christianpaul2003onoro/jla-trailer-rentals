// components/Footer.tsx
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ borderTop: "1px solid #1f2937", marginTop: 48 }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          textAlign: "center",
          color: "#cbd5e1",
        }}
      >
        {/* Address */}
        <div>11500 SW 47th St, Miami, FL 33165</div>

        {/* Contact row */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <a href="tel:+17867606175" style={{ color: "#93c5fd" }}>
            (786) 760-6175
          </a>

          <a
            href="mailto:JLAtrailerrental@gmail.com"
            style={{ color: "#93c5fd" }}
          >
            JLAtrailerrental@gmail.com
          </a>

          {/* IG: icon + handle are both clickable */}
          <a
            href="https://instagram.com/jlatrailerrentals"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram @jlatrailerrentals"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#93c5fd",
              textDecoration: "none",
            }}
          >
            {/* Minimal Instagram glyph (uses currentColor) */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "block" }}
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <span>@jlatrailerrentals</span>
          </a>
        </div>

        {/* Copyright */}
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          © {year} JLA Trailer Rentals
        </div>
      </div>
    </footer>
  );
}
