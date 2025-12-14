'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      
      if (res.ok) {
        toast.success('Welcome to Outrinsic!')
        router.push('/dashboard')
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Login failed')
      }
    } catch (error) {
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-outrinsic-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-nordic-aurora/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-nordic-frost/10 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(136,192,208,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(136,192,208,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      
      <div className="w-full max-w-md relative">
        {/* Logo and header */}
        <div className="text-center mb-8 animate-slide-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-outrinsic-500 to-nordic-aurora mb-4 shadow-lg shadow-outrinsic-500/25">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight">
            Outrinsic
          </h1>
          <p className="text-slate-400 mt-2">
            AI-Powered Lead Generation for Scandinavian Markets
          </p>
        </div>
        
        {/* Login card */}
        <div className="card p-8 animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          
          {/* Hint */}
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <p className="text-sm text-slate-400 text-center">
              <span className="text-outrinsic-400 font-medium">Demo credentials:</span> admin / outrinsic
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6 animate-slide-in" style={{ animationDelay: '0.2s' }}>
          Targeting startups across Norway, Sweden, Denmark & Finland
        </p>
      </div>
    </div>
  )
}

