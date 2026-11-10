import { withAuth } from 'next-auth/middleware';

// Verifies the session JWT signature (not just cookie presence) before any page
// or API route is served. Fine-grained role checks happen in each page/action.
export default withAuth({ pages: { signIn: '/login' } });

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico|logo.png|robots.txt).*)'],
};
