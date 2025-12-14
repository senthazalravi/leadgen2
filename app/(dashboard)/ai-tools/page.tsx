'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles, Building2, Users, Mail, Wand2, RefreshCw,
  CheckCircle, ArrowRight, Briefcase, MessageSquare, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Lead {
  id: number
  firstName: string | null
  lastName: string | null
  email: string | null
  companyName: string | null
  status: string
}

interface Company {
  id: number
  name: string
  industry: string | null
  description: string | null
}

const SERVICES = [
  { id: 'customerSupport', name: 'Customer Support', icon: MessageSquare, color: 'text-green-400' },
  { id: 'socialMedia', name: 'Social Media', icon: Users, color: 'text-blue-400' },
  { id: 'content', name: 'Content Generation', icon: FileText, color: 'text-purple-400' },
  { id: 'leadGen', name: 'Lead Generation', icon: Briefcase, color: 'text-orange-400' },
]

export default function AIToolsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedLead, setSelectedLead] = useState<number | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [generatedEmail, setGeneratedEmail] = useState<any>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [templatesSeeded, setTemplatesSeeded] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [leadsRes, companiesRes] = await Promise.all([
        fetch('/api/leads?limit=50'),
        fetch('/api/companies?limit=50'),
      ])
      
      if (leadsRes.ok) setLeads(await leadsRes.json())
      if (companiesRes.ok) setCompanies(await companiesRes.json())
    } catch (error) {
      console.error('Failed to load data')
    }
  }

  const seedTemplates = async () => {
    setLoading('seed')
    try {
      const res = await fetch('/api/templates/seed', { method: 'POST' })
      const data = await res.json()
      toast.success(data.message)
      setTemplatesSeeded(true)
    } catch (error) {
      toast.error('Failed to seed templates')
    } finally {
      setLoading(null)
    }
  }

  const analyzeCompany = async () => {
    if (!selectedCompany) {
      toast.error('Please select a company')
      return
    }

    setLoading('company')
    setAnalysisResult(null)
    
    try {
      const res = await fetch('/api/ai/analyze-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompany }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setAnalysisResult(data.analysis)
        toast.success('Company analyzed!')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Analysis failed')
      }
    } catch (error) {
      toast.error('Analysis failed')
    } finally {
      setLoading(null)
    }
  }

  const analyzeLead = async () => {
    if (!selectedLead) {
      toast.error('Please select a lead')
      return
    }

    setLoading('lead')
    setAnalysisResult(null)
    
    try {
      const res = await fetch('/api/ai/analyze-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setAnalysisResult(data.analysis)
        toast.success('Lead analyzed!')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Analysis failed')
      }
    } catch (error) {
      toast.error('Analysis failed')
    } finally {
      setLoading(null)
    }
  }

  const generateEmail = async () => {
    if (!selectedLead) {
      toast.error('Please select a lead')
      return
    }

    setLoading('email')
    setGeneratedEmail(null)
    
    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setGeneratedEmail(data.email)
        toast.success('Email generated!')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Generation failed')
      }
    } catch (error) {
      toast.error('Generation failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI-Powered Tools</h2>
            <p className="text-slate-400 mt-1">
              Use DeepSeek AI to analyze companies, generate personalized emails, and identify the best services to propose.
            </p>
          </div>
        </div>
      </div>

      {/* Services Overview */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Outrinsic Services</h3>
        <p className="text-slate-400 mb-4">
          We offer these services with resources in <span className="text-outrinsic-400">India</span> and{' '}
          <span className="text-outrinsic-400">Indonesia</span> at <span className="text-green-400">60-70% cost savings</span>:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SERVICES.map((service) => (
            <div key={service.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <service.icon className={`w-6 h-6 ${service.color} mb-2`} />
              <p className="text-white font-medium">{service.name}</p>
            </div>
          ))}
        </div>
        
        {!templatesSeeded && (
          <button
            onClick={seedTemplates}
            disabled={loading === 'seed'}
            className="mt-4 btn-primary flex items-center gap-2"
          >
            {loading === 'seed' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Initialize Email Templates
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Company Analysis */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-outrinsic-400" />
            <h3 className="text-lg font-semibold text-white">Analyze Company</h3>
          </div>
          
          <p className="text-sm text-slate-400 mb-4">
            AI will analyze the company, identify pain points, and suggest relevant services.
          </p>
          
          <select
            value={selectedCompany || ''}
            onChange={(e) => setSelectedCompany(e.target.value ? parseInt(e.target.value) : null)}
            className="input mb-4"
          >
            <option value="">Select a company...</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} {company.industry ? `(${company.industry})` : ''}
              </option>
            ))}
          </select>
          
          <button
            onClick={analyzeCompany}
            disabled={loading === 'company' || !selectedCompany}
            className="btn-primary flex items-center gap-2 w-full justify-center"
          >
            {loading === 'company' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Analyze with AI
          </button>
        </div>

        {/* Lead Analysis */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Analyze Lead</h3>
          </div>
          
          <p className="text-sm text-slate-400 mb-4">
            Get sales insights, talking points, and recommended approach for any lead.
          </p>
          
          <select
            value={selectedLead || ''}
            onChange={(e) => setSelectedLead(e.target.value ? parseInt(e.target.value) : null)}
            className="input mb-4"
          >
            <option value="">Select a lead...</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.firstName || lead.lastName 
                  ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
                  : lead.email || `Lead #${lead.id}`}
                {lead.companyName ? ` - ${lead.companyName}` : ''}
              </option>
            ))}
          </select>
          
          <div className="flex gap-2">
            <button
              onClick={analyzeLead}
              disabled={loading === 'lead' || !selectedLead}
              className="btn-primary flex items-center gap-2 flex-1 justify-center"
            >
              {loading === 'lead' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Analyze
            </button>
            <button
              onClick={generateEmail}
              disabled={loading === 'email' || !selectedLead}
              className="btn-secondary flex items-center gap-2 flex-1 justify-center"
            >
              {loading === 'email' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              Generate Email
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="card p-6 animate-slide-in">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">AI Analysis Results</h3>
          </div>
          
          <div className="space-y-4">
            {analysisResult.summary && (
              <div className="p-4 rounded-lg bg-slate-800/50">
                <p className="text-sm text-slate-400 mb-1">Summary</p>
                <p className="text-white">{analysisResult.summary}</p>
              </div>
            )}
            
            {analysisResult.painPoints && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400 mb-2">Pain Points</p>
                <ul className="space-y-1">
                  {analysisResult.painPoints.map((point: string, i: number) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisResult.suggestedServices && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-400 mb-2">Suggested Services</p>
                <ul className="space-y-1">
                  {analysisResult.suggestedServices.map((service: string, i: number) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisResult.proposalPoints && (
              <div className="p-4 rounded-lg bg-outrinsic-500/10 border border-outrinsic-500/20">
                <p className="text-sm text-outrinsic-400 mb-2">Proposal Points</p>
                <ul className="space-y-1">
                  {analysisResult.proposalPoints.map((point: string, i: number) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-outrinsic-400 mt-0.5 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisResult.outreachAngle && (
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm text-purple-400 mb-1">Recommended Approach</p>
                <p className="text-white">{analysisResult.outreachAngle || analysisResult.recommendedApproach}</p>
              </div>
            )}
            
            {analysisResult.talkingPoints && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-400 mb-2">Talking Points</p>
                <ul className="space-y-1">
                  {analysisResult.talkingPoints.map((point: string, i: number) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisResult.nextSteps && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-400 mb-2">Next Steps</p>
                <ul className="space-y-1">
                  {analysisResult.nextSteps.map((step: string, i: number) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <span className="text-yellow-400 font-medium">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Email */}
      {generatedEmail && (
        <div className="card p-6 animate-slide-in">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-outrinsic-400" />
            <h3 className="text-lg font-semibold text-white">Generated Email</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-800/50">
              <p className="text-sm text-slate-400 mb-1">Subject</p>
              <p className="text-white font-medium">{generatedEmail.subject}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-800/50">
              <p className="text-sm text-slate-400 mb-2">Body</p>
              <div 
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedEmail.body }}
              />
            </div>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body.replace(/<[^>]*>/g, '')}`)
                toast.success('Copied to clipboard!')
              }}
              className="btn-secondary w-full"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

