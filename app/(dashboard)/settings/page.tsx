'use client'

import { useState, useEffect } from 'react'
import { Tag, Key, Plus, Trash2, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface TagItem {
  id: number
  name: string
  color: string
}

const COLOR_PRESETS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'tags' | 'api'>('tags')
  const [tags, setTags] = useState<TagItem[]>([])
  const [newTag, setNewTag] = useState({ name: '', color: '#6366f1' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      const res = await fetch('/api/tags')
      if (res.ok) setTags(await res.json())
    } catch (error) {
      console.error('Failed to load tags')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.name) return
    
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTag),
      })
      
      if (res.ok) {
        toast.success('Tag created')
        setNewTag({ name: '', color: '#6366f1' })
        loadTags()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create tag')
      }
    } catch (error) {
      toast.error('Failed to create tag')
    }
  }

  const handleDeleteTag = async (id: number) => {
    if (!confirm('Delete this tag?')) return
    
    try {
      await fetch(`/api/tags/${id}`, { method: 'DELETE' })
      toast.success('Tag deleted')
      loadTags()
    } catch (error) {
      toast.error('Failed to delete tag')
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-700">
        {[
          { id: 'tags', label: 'Tags', icon: Tag },
          { id: 'api', label: 'API Keys', icon: Key },
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
      </div>

      {/* Tags */}
      {activeTab === 'tags' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-outrinsic-500/20 flex items-center justify-center">
                <Tag className="w-5 h-5 text-outrinsic-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Create Tag</h2>
                <p className="text-sm text-slate-500">Add tags to organize your leads</p>
              </div>
            </div>
            
            <form onSubmit={handleCreateTag} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  className="input"
                  placeholder="Tag name"
                />
              </div>
              
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTag({ ...newTag, color })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newTag.color === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Tag
              </button>
            </form>
          </div>
          
          <div className="card p-6">
            <h3 className="font-semibold text-white mb-4">Existing Tags</h3>
            
            <div className="flex flex-wrap gap-3">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-white">{tag.name}</span>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {tags.length === 0 && !loading && (
                <p className="text-slate-500">No tags created yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API Keys */}
      {activeTab === 'api' && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-outrinsic-500/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-outrinsic-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">API Configuration</h2>
              <p className="text-sm text-slate-500">Configure external service integrations</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h3 className="font-medium text-green-400 mb-2">✓ Resend API Configured</h3>
              <p className="text-sm text-slate-400">
                Resend API is configured via environment variable. Emails will be sent through Resend.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <h3 className="font-medium text-white mb-2">OpenAI API</h3>
              <p className="text-sm text-slate-400 mb-4">
                Required for AI-powered lead enrichment and analysis. Set OPENAI_API_KEY in Netlify environment variables.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <h3 className="font-medium text-white mb-2">Database</h3>
              <p className="text-sm text-slate-400">
                Connected to Neon PostgreSQL database. Configure DATABASE_URL in Netlify environment variables.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-400">
                <strong>Note:</strong> All API keys should be configured as environment variables in your Netlify dashboard
                for security. Never commit API keys to your repository.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-outrinsic-500" />
        </div>
      )}
    </div>
  )
}

