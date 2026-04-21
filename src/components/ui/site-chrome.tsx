'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';

const AUTH_PATHS = ['/login', '/signup', '/auth/callback'];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`));

  if (isAuthPage) {
    return <main className="relative">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="relative">{children}</main>
      <Footer />
    </>
  );
}
