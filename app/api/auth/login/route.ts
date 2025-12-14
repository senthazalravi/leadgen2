import { NextRequest, NextResponse } from 'next/server'
import { createToken, validateCredentials } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    if (!validateCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }
    
    const token = await createToken(username)
    
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    
    return NextResponse.json({ success: true, username })
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}

