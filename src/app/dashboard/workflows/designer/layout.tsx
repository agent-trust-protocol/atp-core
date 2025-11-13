import { RequireAuth } from '@/components/auth/RequireAuth';

export default function WorkflowDesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth tier="startup" feature="workflow-designer">
      {children}
    </RequireAuth>
  );
}