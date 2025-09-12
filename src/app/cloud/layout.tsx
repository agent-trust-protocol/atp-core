import { RequireAuth } from '@/components/auth/RequireAuth';

export default function CloudLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth tier="startup" feature="cloud-platform">
      {children}
    </RequireAuth>
  );
}