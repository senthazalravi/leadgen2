import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar username={session.username} />
      <div className="lg:pl-72">
        <Header />
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

