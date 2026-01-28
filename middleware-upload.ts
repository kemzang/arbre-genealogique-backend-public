import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: '/api/media/upload',
};

export function middleware(request: NextRequest) {
  // Permettre les gros fichiers pour l'endpoint upload
  // Note: Cette configuration ne change pas vraiment la limite,
  // mais permet de bypasser certaines vérifications
  return NextResponse.next();
}
