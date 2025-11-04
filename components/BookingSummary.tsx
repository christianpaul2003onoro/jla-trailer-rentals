// components/BookingSummary.tsx
// explain: small display card used by /book/find after a successful lookup.

import StatusPill from "./StatusPill";

type Props = {
  booking: {
    rentalId: string;
    status: "Pending" | "Approved" | "Paid" | "Closed" | "Rejected";
    startDate: string;
    endDate: string;
    pickupTime: string | null;
    returnTime: string | null;
    deliveryRequested: boolean;
    trailer: { id: string; name: string; ratePerDay: number } | null;
    client: {
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phone: string | null;
      vehicle: string | null;
    } | null;
    createdAt: string;
  };
};

export default function BookingSummary({ booking }: Props) {
  const fullName = `${booking.client?.firstName ?? ""} ${booking.client?.lastName ?? ""}`.trim();

  return (
    <div
      style={{
        background: "#0b1220",
        border: "1px solid #1f2937",
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 800, color: "#e5e7eb" }}>{booking.rentalId}</div>
        <StatusPill status={booking.status} />
      </div>

      <div style={{ color: "#cbd5e1", marginBottom: 6 }}>
        <strong>Trailer:</strong> {booking.trailer?.name ?? "—"}{" "}
        <span style={{ color: "#93c5fd" }}>
          {booking.trailer ? `($${booking.trailer.ratePerDay}/day)` : ""}
        </span>
      </div>

      <div style={{ color: "#cbd5e1", marginBottom: 6 }}>
        <strong>Dates:</strong> {booking.startDate} → {booking.endDate}
        {booking.pickupTime ? ` • Pickup: ${booking.pickupTime}` : "" }
        {booking.returnTime ? ` • Return: ${booking.returnTime}` : "" }
      </div>

      <div style={{ color: "#cbd5e1", marginBottom: 6 }}>
        <strong>Delivery:</strong> {booking.deliveryRequested ? "Requested" : "No"}
      </div>

      <div style={{ color: "#cbd5e1" }}>
        <strong>Customer:</strong> {fullName || "—"}
        {booking.client?.email ? ` • ${booking.client.email}` : ""}
        {booking.client?.phone ? ` • ${booking.client.phone}` : ""}
      </div>
    </div>
  );
}
