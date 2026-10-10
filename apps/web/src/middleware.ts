import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json / icon.svg / fonts
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.svg|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
