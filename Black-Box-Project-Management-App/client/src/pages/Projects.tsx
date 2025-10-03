import ProjectDashboard from '@/components/ProjectDashboard'

interface ProjectsProps {
  isAdmin?: boolean
}

export default function Projects({ isAdmin = false }: ProjectsProps) {
  return (
    <div className="p-6">
      <ProjectDashboard isAdmin={isAdmin} />
    </div>
  )
}