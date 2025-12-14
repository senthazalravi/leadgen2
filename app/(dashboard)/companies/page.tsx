'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Search, MapPin, Users, Briefcase, Globe,
  Linkedin, Phone, Mail, ExternalLink, Plus, Filter, X
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Company {
  id: number
  name: string
  website: string | null
  industry: string | null
  country: string | null
  city: string | null
  description: string | null
  employeeCount: string | null
  linkedinUrl: string | null
  phone: string | null
  email: string | null
  hasJobOpenings: boolean
  jobOpeningsCount: number
  sourceUrl: string | null
  createdAt: string
}

const COUNTRIES = [
  { value: '', label: 'All Countries' },
  { value: 'Sweden', label: '🇸🇪 Sweden' },
  { value: 'Norway', label: '🇳🇴 Norway' },
  { value: 'Denmark', label: '🇩🇰 Denmark' },
  { value: 'Finland', label: '🇫🇮 Finland' },
]

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [hasJobsFilter, setHasJobsFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCompanies()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, countryFilter, hasJobsFilter])

  const loadCompanies = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (countryFilter) params.append('country', countryFilter)
      if (hasJobsFilter) params.append('hasJobs', hasJobsFilter)
      
      const res = await fetch(`/api/companies?${params.toString()}`)
      if (res.ok) {
        setCompanies(await res.json())
      }
    } catch (error) {
      toast.error('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this company?')) return
    
    try {
      await fetch(`/api/companies/${id}`, { method: 'DELETE' })
      toast.success('Company deleted')
      loadCompanies()
      setSelectedCompany(null)
    } catch (error) {
      toast.error('Failed to delete company')
    }
  }

  const createLeadFromCompany = async (company: Company) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.name,
          companyId: company.id,
          email: company.email,
          phone: company.phone,
          source: 'company',
        }),
      })
      if (res.ok) {
        toast.success('Lead created from company')
      }
    } catch (error) {
      toast.error('Failed to create lead')
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
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-slate-600' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 flex flex-wrap gap-4 items-end animate-slide-in">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Country</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="input"
            >
              {COUNTRIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Job Openings</label>
            <select
              value={hasJobsFilter}
              onChange={(e) => setHasJobsFilter(e.target.value)}
              className="input"
            >
              <option value="">All</option>
              <option value="true">Has Openings</option>
              <option value="false">No Openings</option>
            </select>
          </div>
          
          <button
            onClick={() => {
              setCountryFilter('')
              setHasJobsFilter('')
              setSearch('')
            }}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-2xl font-bold text-white">{companies.length}</p>
          <p className="text-sm text-slate-500">Total Companies</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-green-400">
            {companies.filter(c => c.hasJobOpenings).length}
          </p>
          <p className="text-sm text-slate-500">With Job Openings</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-outrinsic-400">
            {companies.filter(c => c.country === 'Sweden').length}
          </p>
          <p className="text-sm text-slate-500">🇸🇪 Sweden</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-nordic-frost">
            {companies.filter(c => c.country === 'Norway').length}
          </p>
          <p className="text-sm text-slate-500">🇳🇴 Norway</p>
        </div>
      </div>

      {/* Companies grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <div
            key={company.id}
            className="card p-6 card-hover cursor-pointer"
            onClick={() => setSelectedCompany(company)}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-outrinsic-500 to-nordic-aurora flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {company.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{company.name}</h3>
                {company.industry && (
                  <p className="text-sm text-slate-500">{company.industry}</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              {(company.city || company.country) && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span>{[company.city, company.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              
              {company.hasJobOpenings && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Briefcase className="w-4 h-4" />
                  <span>{company.jobOpeningsCount} job opening{company.jobOpeningsCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              
              {company.employeeCount && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users className="w-4 h-4" />
                  <span>{company.employeeCount} employees</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {company.linkedinUrl && (
                <a
                  href={company.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-blue-400"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {company.email && (
                <a
                  href={`mailto:${company.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-outrinsic-400"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-outrinsic-500" />
        </div>
      )}

      {!loading && companies.length === 0 && (
        <div className="card p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No companies found</p>
          <p className="text-sm text-slate-500 mt-1">
            Use the Web Scraper to discover companies
          </p>
        </div>
      )}

      {/* Company detail modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto card animate-slide-in">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-outrinsic-500 to-nordic-aurora flex items-center justify-center text-white font-bold text-xl">
                  {selectedCompany.name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedCompany.name}</h2>
                  {selectedCompany.industry && (
                    <p className="text-slate-500">{selectedCompany.industry}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {selectedCompany.description && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Description</h3>
                  <p className="text-slate-300">{selectedCompany.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {selectedCompany.country && (
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-sm text-slate-500">Location</p>
                    <p className="text-white">
                      {[selectedCompany.city, selectedCompany.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {selectedCompany.employeeCount && (
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-sm text-slate-500">Employees</p>
                    <p className="text-white">{selectedCompany.employeeCount}</p>
                  </div>
                )}
              </div>
              
              {/* Contact info */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Contact</h3>
                <div className="space-y-2">
                  {selectedCompany.email && (
                    <a
                      href={`mailto:${selectedCompany.email}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white"
                    >
                      <Mail className="w-5 h-5 text-outrinsic-400" />
                      {selectedCompany.email}
                    </a>
                  )}
                  {selectedCompany.phone && (
                    <a
                      href={`tel:${selectedCompany.phone}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white"
                    >
                      <Phone className="w-5 h-5 text-green-400" />
                      {selectedCompany.phone}
                    </a>
                  )}
                  {selectedCompany.website && (
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white"
                    >
                      <Globe className="w-5 h-5 text-slate-400" />
                      {selectedCompany.website}
                      <ExternalLink className="w-4 h-4 ml-auto" />
                    </a>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => createLeadFromCompany(selectedCompany)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Lead
                </button>
                <button
                  onClick={() => handleDelete(selectedCompany.id)}
                  className="btn-secondary text-red-400 hover:text-red-300"
                >
                  Delete Company
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

