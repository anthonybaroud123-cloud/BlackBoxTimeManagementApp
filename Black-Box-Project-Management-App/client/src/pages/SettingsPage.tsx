import Settings from '@/components/Settings'

export default function SettingsPage() {
  // Since the settings route is admin-only in App.tsx, anyone accessing this page is an admin
  return (
    <div className="p-6">
      <Settings isAdmin={true} />
    </div>
  )
}