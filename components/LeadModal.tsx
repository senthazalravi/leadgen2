'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Tag {
  id: number
  name: string
  color: string
}

interface LeadModalProps {
  lead: any | null
  tags: Tag[]
  onClose: () => void
  onSave: () => void
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'HOT', label: 'Hot' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'FUTURE', label: 'Future' },
  { value: 'DISQUALIFIED', label: 'Disqualified' },
]

export default function LeadModal({ lead, tags, onClose, onSave }: LeadModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    companyName: '',
    status: 'NEW',
    score: 0,
    priority: 0,
    linkedinUrl: '',
    whatsapp: '',
    twitter: '',
    facebook: '',
    source: '',
    notes: '',
    tagIds: [] as number[],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (lead) {
      setFormData({
        firstName: lead.firstName || '',
        lastName: lead.lastName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        jobTitle: lead.jobTitle || '',
        companyName: lead.companyName || '',
        status: lead.status || 'NEW',
        score: lead.score || 0,
        priority: lead.priority || 0,
        linkedinUrl: lead.linkedinUrl || '',
        whatsapp: lead.whatsapp || '',
        twitter: lead.twitter || '',
        facebook: lead.facebook || '',
        source: lead.source || '',
        notes: lead.notes || '',
        tagIds: lead.tags?.map((t: Tag) => t.id) || [],
      })
    }
  }, [lead])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const url = lead ? `/api/leads/${lead.id}` : '/api/leads'
      const method = lead ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        toast.success(lead ? 'Lead updated' : 'Lead created')
        onSave()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save lead')
      }
    } catch (error) {
      toast.error('Failed to save lead')
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (tagId: number) => {
    if (formData.tagIds.includes(tagId)) {
      setFormData({ ...formData, tagIds: formData.tagIds.filter(id => id !== tagId) })
    } else {
      setFormData({ ...formData, tagIds: [...formData.tagIds, tagId] })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto card animate-slide-in">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="+46 123 456 789"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Company</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="input"
                placeholder="Company AB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Job Title</label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="input"
                placeholder="CEO"
              />
            </div>
          </div>

          {/* Status and Score */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="input"
              >
                <option value="0">None</option>
                <option value="1">Low</option>
                <option value="2">Medium</option>
                <option value="3">High</option>
              </select>
            </div>
          </div>

          {/* Social links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">LinkedIn URL</label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                className="input"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">WhatsApp</label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="input"
                placeholder="+46123456789"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Source</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="input"
              placeholder="thehub.se, manual, referral, etc."
            />
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      formData.tagIds.includes(tag.id)
                        ? 'ring-2 ring-offset-2 ring-offset-slate-800'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="input resize-none"
              placeholder="Add notes about this lead..."
            />
          </div>

          {/* AI Summary */}
          {lead?.aiSummary && (
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-sm font-medium text-purple-400 mb-2">AI Summary</p>
              <p className="text-sm text-slate-300">{lead.aiSummary}</p>
              {lead.aiRecommendedApproach && (
                <>
                  <p className="text-sm font-medium text-purple-400 mt-3 mb-2">Recommended Approach</p>
                  <p className="text-sm text-slate-300">{lead.aiRecommendedApproach}</p>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                lead ? 'Save Changes' : 'Create Lead'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

