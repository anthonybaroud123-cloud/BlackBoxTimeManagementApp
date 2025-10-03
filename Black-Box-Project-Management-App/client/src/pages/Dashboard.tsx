import TimeTracker from '@/components/TimeTracker'

export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Track your time and manage your projects</p>
      </div>
      <TimeTracker />
    </div>
  )
}