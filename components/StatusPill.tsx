// components/StatusPill.tsx

type Props = { status: string };

const COLORS: Record<string, string> = {
  Pending:  '#f59e0b',
  Approved: '#3b82f6',
  Paid:     '#10b981',
  Closed:   '#9ca3af',
  Rejected: '#ef4444',
};

export default function StatusPill({ status }: Props) {
  const bg = COLORS[status] ?? '#6b7280';
  return (
    <span style={{
      display:'inline-block',
      padding:'2px 8px',
      borderRadius:999,
      fontSize:12,
      fontWeight:700,
      color:'#04131f',
      background:bg
    }}>
      {status}
    </span>
  );
}
