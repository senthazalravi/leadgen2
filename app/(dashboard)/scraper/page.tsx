'use client'

import { useState, useEffect } from 'react'
import {
  Globe, Play, Loader2, CheckCircle, XCircle, Clock,
  Building2, Users, ExternalLink, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ScrapingJob {
  id: number
  url: string
  jobType: string
  status: string
  progress: number
  totalItems: number
  itemsScraped: number
  errorMessage: string | null
  resultSummary: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

const PRESET_URLS = [
  { url: 'https://thehub.se/startups', label: 'TheHub.se - Startups', type: 'thehub' },
  { url: 'https://thehub.se/jobs', label: 'TheHub.se - Jobs', type: 'thehub' },
  { url: 'https://thehub.se/companies/sweden', label: 'TheHub.se - Sweden', type: 'thehub' },
  { url: 'https://thehub.se/companies/norway', label: 'TheHub.se - Norway', type: 'thehub' },
  { url: 'https://thehub.se/companies/denmark', label: 'TheHub.se - Denmark', type: 'thehub' },
  { url: 'https://thehub.se/companies/finland', label: 'TheHub.se - Finland', type: 'thehub' },
]

export default function ScraperPage() {
  const [url, setUrl] = useState('')
  const [jobType, setJobType] = useState('general')
  const [jobs, setJobs] = useState<ScrapingJob[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadJobs()
    const interval = setInterval(loadJobs, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadJobs = async () => {
    try {
      const res = await fetch('/api/scraper')
      if (res.ok) {
        setJobs(await res.json())
      }
    } catch (error) {
      console.error('Failed to load jobs')
    }
  }

  const startScraping = async () => {
    if (!url) {
      toast.error('Please enter a URL')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, jobType }),
      })
      
      if (res.ok) {
        toast.success('Scraping started!')
        setUrl('')
        loadJobs()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to start')
      }
    } catch (error) {
      toast.error('Failed to start scraping')
    } finally {
      setLoading(false)
    }
  }

  const selectPreset = (preset: typeof PRESET_URLS[0]) => {
    setUrl(preset.url)
    setJobType(preset.type)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/10'
      case 'failed':
        return 'text-red-400 bg-red-400/10'
      case 'running':
        return 'text-blue-400 bg-blue-400/10'
      default:
        return 'text-slate-400 bg-slate-400/10'
    }
  }

  const parseSummary = (summary: string | null) => {
    if (!summary) return null
    try {
      return JSON.parse(summary)
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="card p-6 bg-gradient-to-r from-outrinsic-600/20 to-nordic-aurora/20 border-outrinsic-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-outrinsic-500/20 flex items-center justify-center flex-shrink-0">
            <Globe className="w-6 h-6 text-outrinsic-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Web Scraper</h2>
            <p className="text-slate-400 mt-1">
              Automatically discover and extract leads from websites. Optimized for TheHub.se 
              and other Scandinavian startup ecosystems.
            </p>
          </div>
        </div>
      </div>

      {/* Scraper form */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Start New Scrape</h3>
        
        {/* Preset URLs */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">Quick Select</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_URLS.map((preset, index) => (
              <button
                key={index}
                onClick={() => selectPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  url === preset.url
                    ? 'bg-outrinsic-500/20 text-outrinsic-400 border border-outrinsic-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm text-slate-400 mb-2">URL to Scrape</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://thehub.se/startups"
              className="input"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-sm text-slate-400 mb-2">Type</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="input"
            >
              <option value="thehub">TheHub.se</option>
              <option value="general">General Website</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={startScraping}
              disabled={loading || !url}
              className="btn-primary flex items-center gap-2 h-[42px] px-6"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Start Scraping
            </button>
          </div>
        </div>
      </div>

      {/* Scraping jobs */}
      <div className="card">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Scraping History</h3>
          <button
            onClick={loadJobs}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        <div className="divide-y divide-slate-700/50">
          {jobs.map((job) => {
            const summary = parseSummary(job.resultSummary)
            
            return (
              <div key={job.id} className="p-4">
                <div className="flex items-start gap-4">
                  {getStatusIcon(job.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white truncate">{job.url}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    
                    {job.status === 'running' && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{job.itemsScraped} / {job.totalItems || '?'}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-outrinsic-500 to-outrinsic-400 transition-all duration-300"
                            style={{ width: `${job.totalItems ? (job.itemsScraped / job.totalItems * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {summary && (
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        {summary.companiesFound !== undefined && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <Building2 className="w-4 h-4" />
                            <span>{summary.companiesFound} companies</span>
                          </div>
                        )}
                        {summary.emailsFound !== undefined && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <Users className="w-4 h-4" />
                            <span>{summary.emailsFound} emails</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {job.errorMessage && (
                      <p className="mt-2 text-sm text-red-400">{job.errorMessage}</p>
                    )}
                    
                    <p className="mt-2 text-xs text-slate-500">
                      {job.startedAt
                        ? `Started: ${new Date(job.startedAt).toLocaleString()}`
                        : `Created: ${new Date(job.createdAt).toLocaleString()}`}
                    </p>
                  </div>
                  
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )
          })}
          
          {jobs.length === 0 && (
            <div className="p-12 text-center">
              <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No scraping jobs yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Start by entering a URL above
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Tips for Best Results</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-800/50">
            <h4 className="font-medium text-outrinsic-400 mb-2">🎯 TheHub.se</h4>
            <p className="text-sm text-slate-400">
              Use the preset URLs for TheHub.se to scrape startups from Sweden, Norway, Denmark, and Finland.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-800/50">
            <h4 className="font-medium text-nordic-frost mb-2">🌐 General Websites</h4>
            <p className="text-sm text-slate-400">
              For other websites, the scraper will extract emails, phone numbers, and company information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

