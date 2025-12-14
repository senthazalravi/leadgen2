'use client'

import { useState, useEffect } from 'react'
import {
  Globe, Play, Loader2, CheckCircle, XCircle, Clock,
  Building2, Users, ExternalLink, RefreshCw, Zap, Mail
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
  { url: 'https://thehub.io/startups', label: 'TheHub.io - All Startups', type: 'thehub' },
  { url: 'https://thehub.io/startups?country=Sweden', label: 'TheHub.io - Sweden', type: 'thehub' },
  { url: 'https://thehub.io/startups?country=Norway', label: 'TheHub.io - Norway', type: 'thehub' },
  { url: 'https://thehub.io/startups?country=Denmark', label: 'TheHub.io - Denmark', type: 'thehub' },
  { url: 'https://thehub.io/startups?country=Finland', label: 'TheHub.io - Finland', type: 'thehub' },
  { url: 'https://thehub.io/jobs', label: 'TheHub.io - Jobs', type: 'thehub' },
]

const PAGE_OPTIONS = [
  { value: 5, label: '5 pages (~100 startups)' },
  { value: 10, label: '10 pages (~200 startups)' },
  { value: 25, label: '25 pages (~500 startups)' },
  { value: 50, label: '50 pages (~1,000 startups)' },
  { value: 100, label: '100 pages (~2,000 startups)' },
  { value: 250, label: '250 pages (~5,000 startups)' },
  { value: 500, label: '500 pages (~10,000 startups)' },
]

export default function ScraperPage() {
  const [url, setUrl] = useState('')
  const [jobType, setJobType] = useState('thehub')
  const [maxPages, setMaxPages] = useState(10)
  const [jobs, setJobs] = useState<ScrapingJob[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadJobs()
    const interval = setInterval(loadJobs, 3000) // Poll every 3 seconds
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
        body: JSON.stringify({ url, jobType, maxPages }),
      })
      
      if (res.ok) {
        toast.success(`Scraping started! Will process up to ${maxPages} pages.`)
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
            <h2 className="text-lg font-semibold text-white">Web Scraper - TheHub.io</h2>
            <p className="text-slate-400 mt-1">
              Scrape <strong>10,000+ startups</strong> from TheHub.io. Extract company names, descriptions, 
              emails, phone numbers, LinkedIn profiles, and more from Scandinavian startups.
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-400">
                <Zap className="w-4 h-4" />
                <span>Auto-pagination</span>
              </div>
              <div className="flex items-center gap-1 text-blue-400">
                <Building2 className="w-4 h-4" />
                <span>Company details</span>
              </div>
              <div className="flex items-center gap-1 text-purple-400">
                <Mail className="w-4 h-4" />
                <span>Email extraction</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scraper form */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Start New Scrape</h3>
        
        {/* Preset URLs */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">Quick Select (TheHub.io)</label>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm text-slate-400 mb-2">URL to Scrape</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://thehub.io/startups"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Scraper Type</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="input"
            >
              <option value="thehub">TheHub.io</option>
              <option value="general">General Website</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Pages to Scrape</label>
            <select
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              className="input"
            >
              {PAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            💡 Tip: Start with fewer pages to test, then increase for bulk scraping.
          </p>
          <button
            onClick={startScraping}
            disabled={loading || !url}
            className="btn-primary flex items-center gap-2 px-6"
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
                          <span>{summary?.status || 'Processing...'}</span>
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
                    
                    {summary && job.status === 'completed' && (
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        {summary.companiesFound !== undefined && (
                          <div className="flex items-center gap-1 text-blue-400">
                            <Building2 className="w-4 h-4" />
                            <span>{summary.companiesFound} companies</span>
                          </div>
                        )}
                        {summary.leadsCreated !== undefined && (
                          <div className="flex items-center gap-1 text-purple-400">
                            <Users className="w-4 h-4" />
                            <span>{summary.leadsCreated} leads</span>
                          </div>
                        )}
                        {summary.emailsFound !== undefined && summary.emailsFound > 0 && (
                          <div className="flex items-center gap-1 text-green-400">
                            <Mail className="w-4 h-4" />
                            <span>{summary.emailsFound} emails</span>
                          </div>
                        )}
                        {summary.totalProcessed !== undefined && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <span>({summary.totalProcessed} processed)</span>
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
                      {job.completedAt && ` • Completed: ${new Date(job.completedAt).toLocaleString()}`}
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
                Select a preset or enter a URL to start scraping
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-800/50">
            <div className="text-2xl mb-2">1️⃣</div>
            <h4 className="font-medium text-outrinsic-400 mb-2">Select Source</h4>
            <p className="text-sm text-slate-400">
              Choose TheHub.io preset or enter any startup listing URL.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-800/50">
            <div className="text-2xl mb-2">2️⃣</div>
            <h4 className="font-medium text-nordic-frost mb-2">Scrape Pages</h4>
            <p className="text-sm text-slate-400">
              The scraper visits each page, extracts startup links, then fetches company details.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-800/50">
            <div className="text-2xl mb-2">3️⃣</div>
            <h4 className="font-medium text-green-400 mb-2">Get Leads</h4>
            <p className="text-sm text-slate-400">
              Companies and leads are saved with emails, phones, descriptions, and LinkedIn profiles.
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-400">
            ⚠️ <strong>Note:</strong> Scraping 10,000+ startups will take time. Start with 10-25 pages to test, 
            then run larger batches. Each startup page is fetched individually to extract full details.
          </p>
        </div>
      </div>
    </div>
  )
}
