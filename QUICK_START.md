# Better Auth - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Generate Secret Key (Required)
```bash
openssl rand -base64 32
```

Copy the output and update `.env.local`:
```env
BETTER_AUTH_SECRET=your-generated-secret-here
```

### Step 2: Initialize Database
```bash
npx better-auth migrate
```

This creates the auth database tables.

### Step 3: Start Development
```bash
npm run dev
```

Visit http://localhost:3000/signup to test!

---

## 📁 File Structure

```
website-repo/
├── src/
│   ├── lib/
│   │   ├── auth.ts              # ← Better Auth server config
│   │   └── auth-client.ts       # ← React hooks & client
│   └── app/
│       ├── api/auth/[...all]/   # ← Auth API endpoints
│       ├── login/page.tsx       # ← Login page (updated)
│       └── signup/page.tsx      # ← Signup page (updated)
├── middleware.ts                # ← Session validation (updated)
├── .env.local                   # ← Config (needs secret!)
└── BETTER_AUTH_SETUP.md         # ← Full documentation
```

---

## 🔑 Key Functions

### Client-Side (React Components)

```typescript
import { signIn, signUp, signOut, useAuth } from '@/lib/auth-client';

// Login
await signIn.email({ email, password });

// Signup
await signUp.email({ email, password, name });

// Logout
await signOut();

// Get current user
const { user, isAuthenticated, isLoading } = useAuth();
```

### Server-Side (API Routes, Server Components)

```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Get session
const session = await auth.api.getSession({
  headers: headers(),
});

// Check if authenticated
if (!session?.user) {
  return redirect('/login');
}

// Use user data
const userId = session.user.id;
const email = session.user.email;
```

---

## ✅ What Works Now

- ✅ Email/password signup
- ✅ Email/password login
- ✅ Session management (30-day expiry)
- ✅ Protected routes (middleware)
- ✅ Automatic redirects
- ✅ Password hashing (bcrypt)
- ✅ Secure cookies (HTTP-only)

---

## 🔧 Common Tasks

### Add Logout Button
```typescript
import { signOut } from '@/lib/auth-client';

<Button onClick={() => signOut()}>
  Sign Out
</Button>
```

### Protect a Server Component
```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) redirect('/login');

  return <div>Protected content</div>;
}
```

### Check Auth in Client Component
```typescript
'use client';
import { useAuth } from '@/lib/auth-client';

export default function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return <div>Hello {user.name}!</div>;
}
```

---

## 🎯 Production Checklist

Before deploying:

- [ ] Generate new `BETTER_AUTH_SECRET` for production
- [ ] Set up production database (PostgreSQL/MongoDB)
- [ ] Update `BETTER_AUTH_URL` to your production domain
- [ ] Enable email verification (`requireEmailVerification: true`)
- [ ] Configure email service (Resend, SendGrid, etc.)
- [ ] Test signup → login → logout flow
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set up OAuth providers (optional)

---

## 📖 Full Documentation

- **Complete Setup**: See `BETTER_AUTH_SETUP.md`
- **Migration Summary**: See `BETTER_AUTH_MIGRATION_SUMMARY.md`
- **Better Auth Docs**: https://www.better-auth.com/docs
- **MCP Help**: Use Better Auth MCP in Cursor for interactive help

---

## 🐛 Quick Fixes

**"Database not found"**
```bash
npx better-auth migrate
```

**"Invalid secret"**
```bash
# Generate new secret
openssl rand -base64 32
# Update .env.local
```

**Session not working**
- Clear browser cookies
- Restart dev server
- Check `BETTER_AUTH_URL` matches your domain

**TypeScript errors**
- Restart TS server in VS Code
- Run `npm install`

---

## 💡 Tips

1. **Development**: Use SQLite (default, already configured)
2. **Production**: Switch to PostgreSQL or MongoDB
3. **Debugging**: Check browser DevTools → Application → Cookies
4. **Session**: Stored in `atp_session` cookie (HTTP-only, secure)
5. **MCP**: Your Better Auth MCP server is already connected!

---

**Need Help?** Check `BETTER_AUTH_SETUP.md` for detailed instructions!
