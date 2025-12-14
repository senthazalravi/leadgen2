'use client'

import { usePathname } from 'next/navigation'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your lead generation' },
  '/leads': { title: 'Leads', subtitle: 'Manage and qualify your leads' },
  '/companies': { title: 'Companies', subtitle: 'Scandinavian startup ecosystem' },
  '/scraper': { title: 'Web Scraper', subtitle: 'Discover leads automatically' },
  '/emails': { title: 'Emails', subtitle: 'Templates and automation' },
  '/settings': { title: 'Settings', subtitle: 'Configure your preferences' },
}

export default function Header() {
  const pathname = usePathname()
  const page = pageTitles[pathname] || { title: 'Outrinsic', subtitle: 'Lead Generation' }

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
      <div className="flex items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-4 ml-12 lg:ml-0">
          <div>
            <h2 className="text-xl font-semibold text-white font-display">
              {page.title}
            </h2>
            <p className="text-sm text-slate-500">
              {page.subtitle}
            </p>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-400">System Online</span>
          </div>
        </div>
      </div>
    </header>
  )
}

