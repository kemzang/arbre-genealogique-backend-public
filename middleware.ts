// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Récupérer l'origine de la requête
  const origin = request.headers.get('origin') ?? ''
  
  // Liste des origines autorisées
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173']
  
  // Vérifier si l'origine est autorisée
  const isAllowed = allowedOrigins.includes(origin) || !origin // !origin pour les requêtes serveur à serveur ou Postman

  // Gestion du "Preflight request" (requête OPTIONS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  const response = NextResponse.next()

  // Ajout des headers pour les réponses normales
  if (isAllowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0])
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  return response
}

export const config = {
  matcher: '/api/:path*',
}