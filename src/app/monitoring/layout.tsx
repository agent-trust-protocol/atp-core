import { RequireAuth } from '@/components/auth/RequireAuth';

export default function MonitoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth tier="professional" feature="monitoring">
      {children}
    </RequireAuth>
  );
}