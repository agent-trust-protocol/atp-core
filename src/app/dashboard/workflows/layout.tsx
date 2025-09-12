import { RequireAuth } from '@/components/auth/RequireAuth';

export default function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth tier="startup" feature="workflows">
      {children}
    </RequireAuth>
  );
}