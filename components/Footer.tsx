// components/Footer.tsx
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <p>11500 SW 47th St, Miami, FL 33165 • (786) 760-6175 • IG: @jlatrailerrentals</p>
        <p>© {year} JLA Trailer Rentals</p>
      </div>
    </footer>
  );
}
