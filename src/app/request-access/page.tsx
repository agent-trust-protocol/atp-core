import { redirect } from 'next/navigation';

// Redirect /request-access to /signup — single Tally form handles all access requests
export default function RequestAccessPage() {
  redirect('/signup');
}
