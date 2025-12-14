'use client'

import { useState, useEffect } from 'react'
import {
  Users, Building2, Mail, Flame, Clock, CheckCircle,
  TrendingUp, Globe
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import toast from 'react-hot-toast'

interface DashboardData {
  totalLeads: number
  hotLeads: number
  inProgress: number
  qualified: number
  disqualified: number
  futureLeads: number
  newLeads: number
  totalCompanies: number
  companiesWithJobs: number
  emailsSentToday: number
  emailsSentTotal: number
  recentLeads: any[]
  leadsBySource: { source: string; count: number }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        setData(await res.json())
      }
    } catch (error) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const statCards = data ? [
    { label: 'Total Leads', value: data.totalLeads, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Hot Leads', value: data.hotLeads, icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'In Progress', value: data.inProgress, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Qualified', value: data.qualified, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Companies', value: data.totalCompanies, icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Emails Sent', value: data.emailsSentTotal, icon: Mail, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  ] : []

  const pipelineData = data ? [
    { name: 'Hot', value: data.hotLeads, color: '#ef4444' },
    { name: 'In Progress', value: data.inProgress, color: '#3b82f6' },
    { name: 'Qualified', value: data.qualified, color: '#22c55e' },
    { name: 'Future', value: data.futureLeads, color: '#a855f7' },
    { name: 'New', value: data.newLeads, color: '#06b6d4' },
  ] : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-outrinsic-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="card p-6 bg-gradient-to-r from-outrinsic-600/20 to-nordic-aurora/20 border-outrinsic-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white font-display">Welcome to Outrinsic</h2>
            <p className="text-slate-400 mt-1">
              AI-powered lead generation targeting Scandinavian startups
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex -space-x-2">
              {['🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮'].map((flag, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl border-2 border-slate-700"
                >
                  {flag}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.label}
            className="card p-4 card-hover animate-slide-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pipeline chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Lead Pipeline</h3>
              <p className="text-sm text-slate-500">Distribution by status</p>
            </div>
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pipelineData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-400">{item.name}</span>
                  <span className="text-sm font-medium text-white ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent leads and sources */}
        <div className="card">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Recent Leads</h3>
          </div>
          <div className="divide-y divide-slate-700/50 max-h-80 overflow-y-auto">
            {data?.recentLeads.slice(0, 5).map((lead, index) => (
              <div
                key={lead.id}
                className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors animate-slide-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-outrinsic-500 to-nordic-aurora flex items-center justify-center text-white font-medium">
                  {(lead.firstName?.[0] || lead.email?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {lead.firstName || lead.lastName
                      ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
                      : lead.email || 'Unknown'}
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {lead.companyName || 'No company'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium status-${lead.status}`}>
                  {lead.status?.replace('_', ' ')}
                </span>
              </div>
            ))}
            {(!data?.recentLeads || data.recentLeads.length === 0) && (
              <div className="p-8 text-center text-slate-500">
                No leads yet. Start by scraping or adding leads manually!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lead sources */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Lead Sources</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.leadsBySource.map((source, index) => (
            <div
              key={source.source}
              className="p-4 rounded-lg bg-slate-800/50 animate-slide-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-4 h-4 text-outrinsic-400" />
                <span className="text-sm text-slate-400">{source.source}</span>
              </div>
              <span className="text-2xl font-bold text-white">{source.count}</span>
            </div>
          ))}
          {(!data?.leadsBySource || data.leadsBySource.length === 0) && (
            <div className="col-span-full text-center text-slate-500 py-4">
              No data yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

