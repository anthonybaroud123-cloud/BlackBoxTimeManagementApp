import ProjectCard from '../ProjectCard'

export default function ProjectCardExample() {
  // Mock data - TODO: remove mock functionality
  const mockProject = {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern design and improved UX',
    totalTime: 144000, // 40 hours
    estimatedTime: 180000, // 50 hours
    revenue: 15000,
    cost: 8000,
    status: 'active' as const,
    scopes: [
      { name: 'Frontend Development', timeSpent: 86400, progress: 75 },
      { name: 'Backend Development', timeSpent: 43200, progress: 45 },
      { name: 'Testing & QA', timeSpent: 14400, progress: 20 },
    ],
    team: [
      { id: '1', name: 'John Doe', role: 'Frontend Developer', hourlyRate: 85 },
      { id: '2', name: 'Jane Smith', role: 'Backend Developer', hourlyRate: 90 },
      { id: '3', name: 'Mike Wilson', role: 'QA Engineer', hourlyRate: 70 },
      { id: '4', name: 'Sarah Johnson', role: 'UI Designer', hourlyRate: 80 },
    ]
  }

  return (
    <div className="max-w-md">
      <ProjectCard 
        project={mockProject} 
        isAdmin={true} 
        onManageProject={(id) => console.log('Managing project:', id)}
      />
    </div>
  )
}