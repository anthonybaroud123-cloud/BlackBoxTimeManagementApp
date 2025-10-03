import Analytics from '@/components/Analytics'

interface AnalyticsPageProps {
  isAdmin?: boolean
}

export default function AnalyticsPage({ isAdmin = false }: AnalyticsPageProps) {
  return (
    <div className="p-6">
      <Analytics isAdmin={isAdmin} />
    </div>
  )
}