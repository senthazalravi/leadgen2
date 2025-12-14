import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'outrinsic-secret-key-2024-lead-generation'
)

// Hardcoded credentials as requested
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'outrinsic'

export async function createToken(username: string) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET_KEY)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload as { username: string }
  } catch {
    return null
  }
}

export function validateCredentials(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) return null
  
  return verifyToken(token)
}

export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  
  return payload
}

// Middleware helper
export function withAuth(handler: (req: NextRequest, user: { username: string }) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const token = req.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    return handler(req, user)
  }
}

