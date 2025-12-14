'use client'

import { useState, useEffect } from 'react'
import {
  Plus, Search, Filter, Download, Trash2, Edit,
  Linkedin, MessageCircle, X, Sparkles, Users, Mail
} from 'lucide-react'
import toast from 'react-hot-toast'
import LeadModal from '@/components/LeadModal'

interface Lead {
  id: number
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  jobTitle: string | null
  companyName: string | null
  status: string
  score: number
  priority: number
  linkedinUrl: string | null
  whatsapp: string | null
  source: string | null
  aiSummary: string | null
  tags: { id: number; name: string; color: string }[]
  createdAt: string
}

interface Tag {
  id: number
  name: string
  color: string
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'HOT', label: 'Hot' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'FUTURE', label: 'Future' },
  { value: 'DISQUALIFIED', label: 'Disqualified' },
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<number[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadLeads()
    loadTags()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeads()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  const loadLeads = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      
      const res = await fetch(`/api/leads?${params.toString()}`)
      if (res.ok) {
        setLeads(await res.json())
      }
    } catch (error) {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  const loadTags = async () => {
    try {
      const res = await fetch('/api/tags')
      if (res.ok) {
        setTags(await res.json())
      }
    } catch (error) {
      console.error('Failed to load tags')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this lead?')) return
    
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      toast.success('Lead deleted')
      loadLeads()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedLeads.length} leads?`)) return
    
    try {
      await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', leadIds: selectedLeads }),
      })
      toast.success(`Deleted ${selectedLeads.length} leads`)
      setSelectedLeads([])
      loadLeads()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleStatusChange = async (leadId: number, status: string) => {
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      toast.success('Status updated')
      loadLeads()
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch('/api/leads/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: selectedLeads.length > 0 ? selectedLeads : null,
          status: statusFilter || null,
        }),
      })
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads_export_${Date.now()}.xlsx`
      a.click()
      toast.success('Export downloaded!')
    } catch (error) {
      toast.error('Export failed')
    }
  }

  const handleAIEnrich = async (leadId: number) => {
    try {
      toast.loading('Analyzing with DeepSeek AI...', { id: 'ai-enrich' })
      const res = await fetch(`/api/leads/enrich/${leadId}`, { method: 'POST' })
      if (res.ok) {
        toast.success('Lead analyzed!', { id: 'ai-enrich' })
        loadLeads()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Analysis failed', { id: 'ai-enrich' })
      }
    } catch (error) {
      toast.error('AI analysis failed', { id: 'ai-enrich' })
    }
  }

  const handleGenerateEmail = async (leadId: number) => {
    try {
      toast.loading('Generating personalized email...', { id: 'gen-email' })
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      })
      if (res.ok) {
        const data = await res.json()
        // Copy to clipboard
        const emailText = `Subject: ${data.email.subject}\n\n${data.email.body.replace(/<[^>]*>/g, '')}`
        navigator.clipboard.writeText(emailText)
        toast.success('Email generated and copied!', { id: 'gen-email' })
      } else {
        const data = await res.json()
        toast.error(data.error || 'Generation failed', { id: 'gen-email' })
      }
    } catch (error) {
      toast.error('Email generation failed', { id: 'gen-email' })
    }
  }

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map(l => l.id))
    }
  }

  const toggleSelect = (id: number) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(i => i !== id))
    } else {
      setSelectedLeads([...selectedLeads, id])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-slate-600' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={() => {
              setEditingLead(null)
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 flex flex-wrap gap-4 items-center animate-slide-in">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => {
              setStatusFilter('')
              setSearch('')
            }}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mt-6"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        </div>
      )}

      {/* Bulk actions */}
      {selectedLeads.length > 0 && (
        <div className="card p-4 flex items-center justify-between animate-slide-in bg-outrinsic-500/10 border-outrinsic-500/20">
          <span className="text-outrinsic-400">
            {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-3">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  fetch('/api/leads/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'status',
                      leadIds: selectedLeads,
                      status: e.target.value,
                    }),
                  }).then(() => {
                    toast.success('Status updated')
                    loadLeads()
                    setSelectedLeads([])
                  })
                  e.target.value = ''
                }
              }}
              className="input py-1.5 text-sm"
            >
              <option value="">Change Status</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm hover:bg-red-500/20 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Leads table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-600 bg-slate-800 text-outrinsic-500"
                  />
                </th>
                <th className="p-4 text-left text-sm font-medium text-slate-400">Contact</th>
                <th className="p-4 text-left text-sm font-medium text-slate-400">Company</th>
                <th className="p-4 text-left text-sm font-medium text-slate-400">Status</th>
                <th className="p-4 text-left text-sm font-medium text-slate-400">Tags</th>
                <th className="p-4 text-left text-sm font-medium text-slate-400">Source</th>
                <th className="p-4 text-left text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`hover:bg-slate-800/50 transition-colors ${
                    selectedLeads.includes(lead.id) ? 'bg-outrinsic-500/5' : ''
                  }`}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => toggleSelect(lead.id)}
                      className="rounded border-slate-600 bg-slate-800 text-outrinsic-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-outrinsic-500 to-nordic-aurora flex items-center justify-center text-white font-medium flex-shrink-0">
                        {(lead.firstName?.[0] || lead.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {lead.firstName || lead.lastName
                            ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
                            : 'Unknown'}
                        </p>
                        {lead.email && (
                          <p className="text-sm text-slate-500 truncate">{lead.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-white">{lead.companyName || '-'}</p>
                    <p className="text-sm text-slate-500">{lead.jobTitle || ''}</p>
                  </td>
                  <td className="p-4">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium status-${lead.status} border-0 cursor-pointer bg-transparent`}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {lead.tags?.map(tag => (
                        <span
                          key={tag.id}
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-slate-400">{lead.source || '-'}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      {lead.linkedinUrl && (
                        <a
                          href={lead.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-blue-400"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {lead.whatsapp && (
                        <a
                          href={`https://wa.me/${lead.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-green-400"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleAIEnrich(lead.id)}
                        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-purple-400"
                        title="AI Analysis"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleGenerateEmail(lead.id)}
                        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-green-400"
                        title="Generate Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingLead(lead)
                          setShowModal(true)
                        }}
                        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-outrinsic-500 mx-auto" />
            </div>
          )}
          
          {!loading && leads.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No leads found</p>
              <p className="text-sm text-slate-500 mt-1">
                Add leads manually or use the web scraper
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lead Modal */}
      {showModal && (
        <LeadModal
          lead={editingLead}
          tags={tags}
          onClose={() => {
            setShowModal(false)
            setEditingLead(null)
          }}
          onSave={() => {
            loadLeads()
            setShowModal(false)
            setEditingLead(null)
          }}
        />
      )}
    </div>
  )
}

