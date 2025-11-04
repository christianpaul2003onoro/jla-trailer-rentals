// components/Nav.tsx
// Top nav. If parent passes onBookClick, we use it to confirm before navigating.

import Link from "next/link";
import * as React from "react";

type Props = {
  // Optional: when provided, we call it on "Book" click so pages can intercept.
  onBookClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export default function Nav({ onBookClick }: Props) {
  return (
    <header className="nav">
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <Link href="/" className="brand" style={{ fontWeight: 700, color: "var(--text)" }}>
          JLA Trailer Rentals
        </Link>

        <nav>
          <Link href="/fleet" style={{ marginLeft: 16 }}>Our Fleet</Link>

          {/* Always points to /book?reset=1; onBookClick can prevent default to ask user */}
          <a
            href="/book?reset=1"
            onClick={onBookClick}
            style={{ marginLeft: 16, color: "var(--brand)", textDecoration: "none", cursor: "pointer" }}
          >
            Book
          </a>

          <Link href="/find" style={{ marginLeft: 16 }}>Find My Rental</Link>
        </nav>
      </div>
    </header>
  );
}
