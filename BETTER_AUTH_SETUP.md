# Better Auth Integration Guide

This guide covers the Better Auth integration for the Agent Trust Protocol website.

## What's Been Done

### 1. Installation ✅
- Installed `better-auth` package
- Added Better Auth MCP server to `.cursor/mcp.json`

### 2. Configuration Files Created ✅

#### Environment Variables (`.env.local`)
```env
BETTER_AUTH_SECRET=generate-a-random-32-char-secret-key-here-change-in-production
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
```

#### Auth Server Configuration (`src/lib/auth.ts`)
- Configured Better Auth with SQLite (for development)
- Enabled email/password authentication
- Added custom user fields: `tenantId`, `plan`, `companyName`
- Session expiry set to 30 days
- Cookie prefix set to `atp`

#### Auth Client Configuration (`src/lib/auth-client.ts`)
- Created React client with helper hooks:
  - `useAuth()` - Get user, session, loading state
  - `useAuthSession()` - Type-safe session hook
  - `signIn`, `signUp`, `signOut` - Auth operations

### 3. API Routes ✅

#### Catch-all Route (`src/app/api/auth/[...all]/route.ts`)
Handles all Better Auth endpoints:
- `/api/auth/sign-in` - Email/password sign in
- `/api/auth/sign-up` - User registration
- `/api/auth/sign-out` - Logout
- `/api/auth/get-session` - Get current session
- `/api/auth/callback/*` - OAuth callbacks (when configured)

### 4. Middleware Updated ✅

Updated `middleware.ts` to:
- Use Better Auth session validation via `betterFetch`
- Check for authenticated session instead of simple token
- Skip auth check for Better Auth API routes
- Maintain all existing protected routes

### 5. Pages Updated ✅

#### Login Page (`src/app/login/page.tsx`)
- Uses `signIn.email()` for authentication
- Supports return URL for redirects after login
- Social login placeholders for GitHub, Google, Microsoft
- Better error handling

#### Signup Page (`src/app/signup/page.tsx`)
- Uses `signUp.email()` for registration
- Auto-login after successful signup
- Stores additional enterprise data via separate API
- Shows validation errors

## Next Steps to Complete Setup

### 1. Generate and Run Database Migration

```bash
# Generate the database schema
cd website-repo
npx better-auth migrate

# This will create the necessary tables:
# - user
# - session
# - account (for OAuth)
# - verification (for email verification)
```

### 2. Generate a Secure Secret Key

```bash
# Generate a random secret (macOS/Linux)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Update `.env.local` with the generated secret:
```env
BETTER_AUTH_SECRET=your-generated-secret-here
```

### 3. Choose Your Database (Production)

For production, switch from SQLite to a proper database:

**Option A: PostgreSQL (Recommended)**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/atp_auth
```

**Option B: MongoDB (if already using for ATP Cloud)**
```env
DATABASE_URL=mongodb://localhost:27017/atp_auth
```

Then install the appropriate adapter:
```bash
npm install better-auth-postgres  # for PostgreSQL
# or
npm install better-auth-mongodb   # for MongoDB
```

Update `src/lib/auth.ts`:
```typescript
import { betterAuth } from "better-auth";
import { postgresAdapter } from "better-auth-postgres"; // or mongodbAdapter

export const auth = betterAuth({
  database: postgresAdapter({
    url: process.env.DATABASE_URL,
  }),
  // ... rest of config
});
```

### 4. Enable Social OAuth (Optional)

To add GitHub/Google/Microsoft login:

1. Get OAuth credentials from providers:
   - GitHub: https://github.com/settings/developers
   - Google: https://console.cloud.google.com/
   - Microsoft: https://portal.azure.com/

2. Add to `.env.local`:
```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

3. Update `src/lib/auth.ts`:
```typescript
export const auth = betterAuth({
  // ... existing config
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

### 5. Enable Email Verification (Production)

For production, enable email verification:

1. Configure an email service (Resend, SendGrid, etc.)

2. Update `src/lib/auth.ts`:
```typescript
export const auth = betterAuth({
  // ... existing config
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Send email with verification link
      await emailService.send({
        to: user.email,
        subject: "Verify your email",
        html: `Click here to verify: ${url}`,
      });
    },
  },
});
```

### 6. Add Logout Functionality

Create a logout button/link in your protected pages:

```typescript
import { signOut } from '@/lib/auth-client';

function LogoutButton() {
  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return <Button onClick={handleLogout}>Sign Out</Button>;
}
```

### 7. Protect Routes with Session Checks

In server components, check authentication:

```typescript
// app/portal/page.tsx
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function PortalPage() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Welcome {session.user.name}</h1>
      {/* Protected content */}
    </div>
  );
}
```

### 8. Update Production Environment Variables

In `.env.production`:
```env
BETTER_AUTH_SECRET=your-production-secret-32-chars-minimum
BETTER_AUTH_URL=https://agenttrustprotocol.com
DATABASE_URL=postgresql://user:password@your-db-host:5432/atp_auth
```

## Testing the Integration

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Signup Flow
1. Navigate to http://localhost:3000/signup
2. Fill in the registration form
3. Submit and verify account creation
4. Should auto-redirect to /portal

### 3. Test Login Flow
1. Navigate to http://localhost:3000/login
2. Enter credentials from signup
3. Verify successful login and redirect

### 4. Test Protected Routes
1. While logged out, try accessing /portal
2. Should redirect to /login
3. After login, should be able to access /portal

### 5. Test Logout
1. Click logout (when implemented)
2. Verify redirect to login
3. Verify cannot access protected routes

## Integration with Existing ATP Services

### Linking Better Auth Users to ATP Cloud Tenants

You can link Better Auth users to your existing ATP Cloud tenant system:

```typescript
// After successful signup in signup/page.tsx
const { data } = await signUp.email({...});

if (data) {
  // Create ATP Cloud tenant for this user
  await fetch('/api/cloud/tenants', {
    method: 'POST',
    body: JSON.stringify({
      userId: data.user.id,
      email: data.user.email,
      plan: 'trial',
      // ... other tenant data
    }),
  });
}
```

### Using Better Auth with Existing ATP Services

Your existing ATP services can validate Better Auth sessions:

```typescript
// In your API routes
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Use session.user.id to look up tenant data
  const tenant = await getTenantByUserId(session.user.id);

  // Continue with ATP business logic...
}
```

## Troubleshooting

### "Database not found" Error
Run the migration: `npx better-auth migrate`

### Session Not Persisting
Check that cookies are being set correctly. In production, ensure `useSecureCookies` is true and you're using HTTPS.

### CORS Issues
Better Auth handles CORS automatically. If you encounter issues, check your Next.js middleware configuration.

### TypeScript Errors
Ensure all Better Auth types are properly imported:
```typescript
import type { Session } from './src/lib/auth';
```

## Documentation Links

- Better Auth Docs: https://www.better-auth.com/docs
- Better Auth GitHub: https://github.com/better-auth/better-auth
- Database Adapters: https://www.better-auth.com/docs/concepts/database
- Social Providers: https://www.better-auth.com/docs/concepts/social-sign-in

## Migration from Old Auth System

The old demo auth system in `src/app/api/auth/login/route.ts` and `src/app/api/auth/signup/route.ts` can now be removed or kept as fallback during migration.

To migrate existing users:
1. Export user data from old system
2. Hash passwords with Better Auth's bcrypt implementation
3. Insert into Better Auth's user table
4. Update any tenant associations

## Support

For Better Auth specific issues, check:
- Documentation: https://www.better-auth.com/docs
- GitHub Issues: https://github.com/better-auth/better-auth/issues
- Discord: Better Auth community

For ATP-specific integration questions, refer to the ATP documentation.
