'use client'

import { useState, useEffect } from 'react'
import {
  Mail, Plus, Clock, CheckCircle, XCircle,
  FileText, Trash2, Edit, RefreshCw, Send
} from 'lucide-react'
import toast from 'react-hot-toast'

interface EmailTemplate {
  id: number
  name: string
  subject: string
  body: string
  isDefault: boolean
  createdAt: string
}

interface EmailLog {
  id: number
  leadId: number | null
  toEmail: string
  subject: string | null
  status: string
  sentAt: string | null
  createdAt: string
  lead?: { firstName: string | null; lastName: string | null }
}

export default function EmailsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates')
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'templates') {
        const res = await fetch('/api/emails/templates')
        if (res.ok) setTemplates(await res.json())
      } else {
        const res = await fetch('/api/emails/logs')
        if (res.ok) setLogs(await res.json())
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Delete this template?')) return
    
    try {
      await fetch(`/api/emails/templates/${id}`, { method: 'DELETE' })
      toast.success('Template deleted')
      loadData()
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'opened':
        return <Mail className="w-4 h-4 text-blue-400" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="card p-6 bg-gradient-to-r from-outrinsic-600/20 to-nordic-aurora/20 border-outrinsic-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-outrinsic-500/20 flex items-center justify-center flex-shrink-0">
            <Send className="w-6 h-6 text-outrinsic-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Email System</h2>
            <p className="text-slate-400 mt-1">
              Create email templates and send personalized emails to your leads using Resend API.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-700">
        {[
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'logs', label: 'Sent Emails', icon: Mail },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-outrinsic-500 text-outrinsic-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
        
        <div className="ml-auto">
          {activeTab === 'templates' && (
            <button
              onClick={() => {
                setEditingTemplate(null)
                setShowTemplateModal(true)
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          )}
        </div>
      </div>

      {/* Templates tab */}
      {activeTab === 'templates' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="card p-6 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-outrinsic-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-outrinsic-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{template.name}</h3>
                    {template.isDefault && (
                      <span className="text-xs text-outrinsic-400">Default</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingTemplate(template)
                      setShowTemplateModal(true)
                    }}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500">Subject</p>
                  <p className="text-sm text-slate-300 truncate">{template.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Preview</p>
                  <p className="text-sm text-slate-400 line-clamp-3">
                    {template.body.replace(/<[^>]*>/g, '')}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {!loading && templates.length === 0 && (
            <div className="col-span-full card p-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No email templates yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Create templates to streamline your outreach
              </p>
            </div>
          )}
        </div>
      )}

      {/* Logs tab */}
      {activeTab === 'logs' && (
        <div className="card">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-white">Email History</h3>
            <button
              onClick={loadData}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          
          <div className="divide-y divide-slate-700/50">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-center gap-4">
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate">{log.toEmail}</p>
                  <p className="text-sm text-slate-500 truncate">{log.subject}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    log.status === 'sent' ? 'bg-green-400/10 text-green-400' :
                    log.status === 'failed' ? 'bg-red-400/10 text-red-400' :
                    'bg-slate-400/10 text-slate-400'
                  }`}>
                    {log.status}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    {log.sentAt
                      ? new Date(log.sentAt).toLocaleString()
                      : new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            
            {!loading && logs.length === 0 && (
              <div className="p-12 text-center">
                <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No emails sent yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-outrinsic-500" />
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowTemplateModal(false)
            setEditingTemplate(null)
          }}
          onSave={() => {
            loadData()
            setShowTemplateModal(false)
            setEditingTemplate(null)
          }}
        />
      )}
    </div>
  )
}

function TemplateModal({
  template,
  onClose,
  onSave
}: {
  template: EmailTemplate | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    isDefault: false
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        isDefault: template.isDefault
      })
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const url = template 
        ? `/api/emails/templates/${template.id}` 
        : '/api/emails/templates'
      const method = template ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        toast.success(template ? 'Template updated' : 'Template created')
        onSave()
      } else {
        toast.error('Failed to save template')
      }
    } catch (error) {
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto card animate-slide-in">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white">
            {template ? 'Edit Template' : 'New Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Initial Outreach"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Subject Line
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="input"
              placeholder="e.g., Partnership opportunity with {{company}}"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Email Body (HTML supported)
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={10}
              className="input font-mono text-sm resize-none"
              placeholder={`<p>Hi {{first_name}},</p>

<p>I noticed {{company}} is doing interesting work...</p>

<p>Best regards,<br/>Outrinsic Team</p>`}
              required
            />
          </div>
          
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-sm font-medium text-slate-300 mb-2">Available Variables</p>
            <div className="flex flex-wrap gap-2">
              {['{{first_name}}', '{{last_name}}', '{{full_name}}', '{{email}}', '{{company}}', '{{job_title}}'].map(v => (
                <code
                  key={v}
                  className="px-2 py-1 rounded bg-outrinsic-500/20 text-outrinsic-400 text-sm cursor-pointer hover:bg-outrinsic-500/30"
                  onClick={() => setFormData({ ...formData, body: formData.body + v })}
                >
                  {v}
                </code>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="rounded border-slate-600 bg-slate-800 text-outrinsic-500"
            />
            <label htmlFor="isDefault" className="text-sm text-slate-400">
              Set as default template
            </label>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                template ? 'Save Changes' : 'Create Template'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

