import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import ProjectCard from './ProjectCard'
import { Plus, Search, Filter, FolderOpen, X } from 'lucide-react'
import { useQuery, useQueries, useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import type { Project, ProjectScope, User as DBUser, ProjectMember, ScopeTemplate, TimeEntry } from '@shared/schema'

interface ProjectData {
  id: string
  name: string
  description: string
  totalTime: number
  estimatedTime: number
  revenue?: number
  cost?: number
  status: 'active' | 'completed' | 'paused'
  scopes: Array<{ name: string; timeSpent: number; progress: number }>
  team: Array<{ id: string; name: string; role: string; avatar?: string; hourlyRate?: number }>
}

interface ProjectDashboardProps {
  isAdmin?: boolean
}

export default function ProjectDashboard({ isAdmin = false }: ProjectDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [filterTeamMembers, setFilterTeamMembers] = useState<string[]>([])
  const [filterScopes, setFilterScopes] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectScopes, setProjectScopes] = useState<string[]>([''])
  const [selectedTeammates, setSelectedTeammates] = useState<string[]>([])
  const [newScopeName, setNewScopeName] = useState('')
  
  // Fetch real data from APIs
  const { data: scopeTemplates = [], isLoading: scopeTemplatesLoading } = useQuery({
    queryKey: ['/api/scope-templates'],
    select: (data: any[]) => data.map((template: any) => ({
      ...template,
      createdAt: new Date(template.createdAt),
      updatedAt: new Date(template.updatedAt)
    })) as ScopeTemplate[]
  })

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    select: (data: any[]) => data.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt)
    })) as DBUser[]
  })

  // Use scope templates as pre-determined scopes
  const predeterminedScopes = scopeTemplates
    .filter(template => template.isActive)
    .map(template => template.name)
  
  // Use real users as available teammates
  const availableTeammates = users.map(user => ({
    id: user.id,
    name: user.name,
    role: user.role === 'admin' ? 'Administrator' : 'Team Member'
  }))
  
  // Fetch real projects and related data
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    select: (data: any[]) => data.map((project: any) => ({
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt)
    })) as Project[]
  })

  const { data: apiProjectScopes = [], isLoading: projectScopesLoading } = useQuery({
    queryKey: ['/api/project-scopes'],
    select: (data: any[]) => data.map((scope: any) => ({
      ...scope,
      createdAt: new Date(scope.createdAt)
    })) as ProjectScope[]
  })

  const { data: timeEntries = [], isLoading: timeEntriesLoading } = useQuery({
    queryKey: ['/api/time-entries'],
    select: (data: any[]) => data.map((entry: any) => ({
      ...entry,
      startedAt: entry.startedAt ? new Date(entry.startedAt) : null,
      endedAt: entry.endedAt ? new Date(entry.endedAt) : null
    })) as TimeEntry[]
  })

  // Fetch project members for all projects
  const projectMemberQueries = useQueries({
    queries: projects.map(project => ({
      queryKey: ['/api/projects', project.id, 'members'],
      queryFn: async () => {
        const response = await fetch(`/api/projects/${project.id}/members`)
        if (!response.ok) throw new Error('Failed to fetch project members')
        return response.json()
      },
      enabled: !!project.id
    }))
  })

  // Check if any project member queries are loading
  const membersLoading = projectMemberQueries.some(query => query.isLoading)

  // Transform projects to match ProjectData interface
  const projectsData: ProjectData[] = projects.map((project, index) => {
    const scopes = apiProjectScopes.filter(scope => scope.projectId === project.id)
    const projectTimeEntries = timeEntries.filter(entry => entry.projectId === project.id)
    
    // Get project members from the corresponding query
    const memberQuery = projectMemberQueries[index]
    const projectMembers = memberQuery?.data || []
    
    // Calculate total time from time entries (in seconds)
    const totalTimeMinutes = projectTimeEntries.reduce((total, entry) => total + entry.minutes, 0)
    const totalTime = totalTimeMinutes * 60 // Convert to seconds for legacy interface
    
    // Create scope data with time calculations
    const scopeData = scopes.map(scope => {
      const scopeEntries = projectTimeEntries.filter(entry => entry.scopeId === scope.id)
      const timeSpent = scopeEntries.reduce((total, entry) => total + entry.minutes * 60, 0) // Convert to seconds
      const progress = Math.min(Math.round((timeSpent / Math.max(totalTime, 1)) * 100), 100)
      
      return {
        name: scope.name,
        timeSpent,
        progress
      }
    })

    return {
      id: project.id,
      name: project.name,
      description: project.description || '',
      totalTime,
      estimatedTime: 0, // Default estimated time - will be calculated from tasks
      revenue: 0, // Revenue will be calculated from project billing
      cost: 0, // Cost will be calculated from team member rates and time
      status: project.status as 'active' | 'completed' | 'paused',
      scopes: scopeData,
      team: projectMembers.map((member: any) => ({
        id: member.userId,
        name: users.find(u => u.id === member.userId)?.name || 'Unknown',
        role: member.role || 'Team Member',
        hourlyRate: member.hourlyRate || 0
      }))
    }
  })


  // Get unique values for filter options
  const allStatuses = Array.from(new Set(projectsData.map(p => p.status)))
  const allTeamMembers = Array.from(new Set(projectsData.flatMap(p => (p.team || []).map(t => t.name))))
  const allScopes = Array.from(new Set(projectsData.flatMap(p => p.scopes.map(s => s.name))))

  const filteredProjects = projectsData.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus.length === 0 || filterStatus.includes(project.status)
    
    const matchesTeamMembers = filterTeamMembers.length === 0 || 
      filterTeamMembers.some(memberName => (project.team || []).some(t => t.name === memberName))
    
    const matchesScopes = filterScopes.length === 0 ||
      filterScopes.some(scopeName => project.scopes.some(s => s.name === scopeName))
    
    return matchesSearch && matchesStatus && matchesTeamMembers && matchesScopes
  })

  const addScope = () => {
    if (newScopeName.trim() && !projectScopes.includes(newScopeName.trim())) {
      setProjectScopes([...projectScopes.filter(s => s.trim()), newScopeName.trim()])
      setNewScopeName('')
    }
  }

  const removeScope = (index: number) => {
    setProjectScopes(projectScopes.filter((_, i) => i !== index))
  }

  const toggleTeammate = (teammateId: string) => {
    if (selectedTeammates.includes(teammateId)) {
      setSelectedTeammates(selectedTeammates.filter(id => id !== teammateId))
    } else {
      setSelectedTeammates([...selectedTeammates, teammateId])
    }
  }


  const resetForm = () => {
    setProjectName('')
    setProjectDescription('')
    setProjectScopes([''])
    setSelectedTeammates([])
    setNewScopeName('')
  }

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: {
      name: string
      description: string
      scopes: string[]
      teammates: string[]
    }) => {
      // Create project
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectData.name,
          description: projectData.description,
          status: 'active',
          createdById: '68015944-9b46-4353-b2bc-de59cc592eaa' // Valid admin user ID from database
        })
      })
      
      if (!projectResponse.ok) {
        throw new Error('Failed to create project')
      }
      
      const project = await projectResponse.json()
      
      // Create project scopes
      for (const scopeName of projectData.scopes) {
        const response = await fetch(`/api/projects/${project.id}/scopes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: scopeName
          })
        })
        if (!response.ok) {
          throw new Error(`Failed to create scope: ${scopeName}`)
        }
      }
      
      // Add team members
      for (const userId of projectData.teammates) {
        const response = await fetch(`/api/projects/${project.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            role: 'Team Member',
            hourlyRate: 0
          })
        })
        if (!response.ok) {
          throw new Error(`Failed to add team member: ${userId}`)
        }
      }
      
      return project
    },
    onSuccess: () => {
      // Force refetch of project data to avoid 304 cached responses
      queryClient.refetchQueries({ queryKey: ['/api/projects'] })
      queryClient.refetchQueries({ queryKey: ['/api/project-scopes'] })
      
      setShowCreateDialog(false)
      resetForm()
    }
  })

  const handleCreateProject = () => {
    const validScopes = projectScopes.filter(s => s.trim())
    
    createProjectMutation.mutate({
      name: projectName,
      description: projectDescription,
      scopes: validScopes,
      teammates: selectedTeammates
    })
  }

  // Edit project mutation
  const editProjectMutation = useMutation({
    mutationFn: async (projectData: {
      id: string
      name: string
      description: string
      scopes: string[]
      teammates: string[]
    }) => {
      // Update project basic info
      const projectResponse = await fetch(`/api/projects/${projectData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectData.name,
          description: projectData.description
        })
      })
      
      if (!projectResponse.ok) {
        throw new Error('Failed to update project')
      }
      
      // Get existing scopes and members from queryClient to avoid 304 handling issues
      const existingScopes = apiProjectScopes.filter(scope => scope.projectId === projectData.id)
      const projectIndex = projects.findIndex(p => p.id === projectData.id)
      const existingMembers = projectIndex >= 0 ? (projectMemberQueries[projectIndex]?.data || []) : []
      
      // Update scopes - remove old ones not in new list, add new ones
      const existingScopeNames = existingScopes.map(s => s.name)
      const newScopeNames = projectData.scopes
      
      // Remove scopes that are no longer selected
      for (const scope of existingScopes) {
        if (!newScopeNames.includes(scope.name)) {
          const response = await fetch(`/api/projects/${projectData.id}/scopes/${scope.id}`, {
            method: 'DELETE'
          })
          if (!response.ok) {
            throw new Error(`Failed to delete scope: ${scope.name}`)
          }
        }
      }
      
      // Add new scopes
      for (const scopeName of newScopeNames) {
        if (!existingScopeNames.includes(scopeName)) {
          const response = await fetch(`/api/projects/${projectData.id}/scopes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: scopeName
            })
          })
          if (!response.ok) {
            throw new Error(`Failed to add scope: ${scopeName}`)
          }
        }
      }
      
      // Update team members - remove old ones not in new list, add new ones
      const existingMemberIds = existingMembers.map((m: any) => m.userId)
      const newMemberIds = projectData.teammates
      
      // Remove members that are no longer selected
      for (const member of existingMembers) {
        if (!newMemberIds.includes(member.userId)) {
          const response = await fetch(`/api/projects/${projectData.id}/members/${member.userId}`, {
            method: 'DELETE'
          })
          if (!response.ok) {
            throw new Error(`Failed to remove team member: ${member.userId}`)
          }
        }
      }
      
      // Add new members
      for (const userId of newMemberIds) {
        if (!existingMemberIds.includes(userId)) {
          const response = await fetch(`/api/projects/${projectData.id}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              role: 'Team Member',
              hourlyRate: 0
            })
          })
          if (!response.ok) {
            throw new Error(`Failed to add team member: ${userId}`)
          }
        }
      }
      
      return projectData
    },
    onSuccess: () => {
      // Force refetch of project data to avoid 304 cached responses
      queryClient.refetchQueries({ queryKey: ['/api/projects'] })
      queryClient.refetchQueries({ queryKey: ['/api/project-scopes'] })
      
      setShowEditDialog(false)
      setEditingProjectId(null)
      resetForm()
    }
  })

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete project')
      }
      
      return projectId
    },
    onSuccess: () => {
      // Force complete cache invalidation and refetch to avoid 304 responses
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] })
      queryClient.invalidateQueries({ queryKey: ['/api/project-scopes'] })
      queryClient.refetchQueries({ queryKey: ['/api/projects'], type: 'active' })
      queryClient.refetchQueries({ queryKey: ['/api/project-scopes'], type: 'active' })
      
      setShowDeleteDialog(false)
      setDeletingProjectId(null)
    }
  })

  const handleEditProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    const projectIndex = projects.findIndex(p => p.id === projectId)
    
    // Check if data is still loading to prevent race conditions
    if (projectScopesLoading || membersLoading || 
        (projectIndex >= 0 && projectMemberQueries[projectIndex]?.isLoading)) {
      console.warn('Cannot edit project while data is still loading')
      return
    }
    
    if (project) {
      setEditingProjectId(projectId)
      setProjectName(project.name)
      setProjectDescription(project.description || '')
      // Load existing scopes for this project
      const projectScopesData = apiProjectScopes.filter(scope => scope.projectId === projectId)
      setProjectScopes(projectScopesData.map(scope => scope.name))
      // Load existing team members  
      const projectMembers = projectIndex >= 0 ? (projectMemberQueries[projectIndex]?.data || []) : []
      setSelectedTeammates(projectMembers.map((m: any) => m.userId))
      setShowEditDialog(true)
    }
  }

  const handleDeleteProject = (projectId: string) => {
    setDeletingProjectId(projectId)
    setShowDeleteDialog(true)
  }

  const confirmEditProject = () => {
    if (!editingProjectId) return
    
    const validScopes = projectScopes.filter(s => s.trim())
    
    editProjectMutation.mutate({
      id: editingProjectId,
      name: projectName,
      description: projectDescription,
      scopes: validScopes,
      teammates: selectedTeammates
    })
  }

  const confirmDeleteProject = () => {
    if (!deletingProjectId) return
    
    deleteProjectMutation.mutate(deletingProjectId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and track progress</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-project">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name" className="text-sm font-medium">Project Name</Label>
                  <Input 
                    id="project-name"
                    placeholder="Enter project name" 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    data-testid="input-project-name" 
                  />
                </div>
                <div>
                  <Label htmlFor="project-description" className="text-sm font-medium">Description</Label>
                  <Input 
                    id="project-description"
                    placeholder="Project description" 
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    data-testid="input-project-description" 
                  />
                </div>
              </div>

              {/* Project Scopes */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Project Scopes</Label>
                
                {/* Pre-determined Scopes */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Select from Common Scopes</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-muted/30">
                    {predeterminedScopes.map((scope) => {
                      const isSelected = projectScopes.includes(scope)
                      return (
                        <div key={scope} className="flex items-center space-x-2">
                          <Checkbox
                            id={`predetermined-${scope}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setProjectScopes(prev => [...prev.filter(s => s.trim()), scope])
                              } else {
                                setProjectScopes(prev => prev.filter(s => s !== scope))
                              }
                            }}
                            data-testid={`checkbox-scope-${scope.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <Label 
                            htmlFor={`predetermined-${scope}`} 
                            className="text-sm cursor-pointer"
                          >
                            {scope}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Custom Scope Input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Or Add Custom Scope</Label>
                  <div className="flex gap-2">
                  <Input
                    placeholder="Enter scope name"
                    value={newScopeName}
                    onChange={(e) => setNewScopeName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addScope()}
                    data-testid="input-new-scope"
                  />
                  <Button type="button" onClick={addScope} data-testid="button-add-scope">
                    Add Scope
                  </Button>
                </div>
                <div className="space-y-2">
                  {projectScopes.filter(s => s.trim() && !predeterminedScopes.includes(s)).map((scope, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded" data-testid={`scope-item-${index}`}>
                      <span className="text-sm">{scope}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeScope(projectScopes.indexOf(scope))}
                        data-testid={`button-remove-scope-${index}`}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {projectScopes.filter(s => s.trim() && !predeterminedScopes.includes(s)).length === 0 && (
                    <p className="text-sm text-muted-foreground">No custom scopes added yet</p>
                  )}
                </div>
                </div>
              </div>

              {/* Team Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Assign Team Members</Label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {availableTeammates.map((teammate) => (
                    <div key={teammate.id} className="flex items-center space-x-3 p-2 border rounded" data-testid={`teammate-option-${teammate.id}`}>
                      <input
                        type="checkbox"
                        id={`teammate-${teammate.id}`}
                        checked={selectedTeammates.includes(teammate.id)}
                        onChange={() => toggleTeammate(teammate.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`teammate-${teammate.id}`} className="text-sm font-medium">
                          {teammate.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{teammate.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateProject} 
                  className="flex-1" 
                  disabled={!projectName.trim() || projectScopes.filter(s => s.trim()).length === 0 || createProjectMutation.isPending}
                  data-testid="button-save-project"
                >
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </Button>
                <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-project-name" className="text-sm font-medium">Project Name</Label>
                  <Input 
                    id="edit-project-name"
                    placeholder="Enter project name" 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    data-testid="input-edit-project-name" 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-project-description" className="text-sm font-medium">Description</Label>
                  <Input 
                    id="edit-project-description"
                    placeholder="Project description" 
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    data-testid="input-edit-project-description" 
                  />
                </div>
              </div>

              {/* Project Scopes */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Project Scopes</Label>
                
                {/* Pre-determined Scopes */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Select from Common Scopes</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-muted/30">
                    {predeterminedScopes.map((scope) => {
                      const isSelected = projectScopes.includes(scope)
                      return (
                        <div key={scope} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-predetermined-${scope}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setProjectScopes(prev => [...prev.filter(s => s.trim()), scope])
                              } else {
                                setProjectScopes(prev => prev.filter(s => s !== scope))
                              }
                            }}
                            data-testid={`checkbox-edit-scope-${scope.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <Label 
                            htmlFor={`edit-predetermined-${scope}`} 
                            className="text-sm cursor-pointer"
                          >
                            {scope}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Custom Scope Input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Or Add Custom Scope</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter scope name"
                      value={newScopeName}
                      onChange={(e) => setNewScopeName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addScope()}
                      data-testid="input-edit-new-scope"
                    />
                    <Button type="button" onClick={addScope} data-testid="button-edit-add-scope">
                      Add Scope
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {projectScopes.filter(s => s.trim() && !predeterminedScopes.includes(s)).map((scope, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded" data-testid={`edit-scope-item-${index}`}>
                        <span className="text-sm">{scope}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeScope(projectScopes.indexOf(scope))}
                          data-testid={`button-edit-remove-scope-${index}`}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    {projectScopes.filter(s => s.trim() && !predeterminedScopes.includes(s)).length === 0 && (
                      <p className="text-sm text-muted-foreground">No custom scopes added yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Assign Team Members</Label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {availableTeammates.map((teammate) => (
                    <div key={teammate.id} className="flex items-center space-x-3 p-2 border rounded" data-testid={`edit-teammate-option-${teammate.id}`}>
                      <input
                        type="checkbox"
                        id={`edit-teammate-${teammate.id}`}
                        checked={selectedTeammates.includes(teammate.id)}
                        onChange={() => toggleTeammate(teammate.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`edit-teammate-${teammate.id}`} className="text-sm font-medium">
                          {teammate.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{teammate.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={confirmEditProject} 
                  className="flex-1" 
                  disabled={!projectName.trim() || projectScopes.filter(s => s.trim()).length === 0 || editProjectMutation.isPending}
                  data-testid="button-update-project"
                >
                  {editProjectMutation.isPending ? 'Updating...' : 'Update Project'}
                </Button>
                <Button variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this project? This action cannot be undone. All project data, time entries, scopes, and team assignments will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteProject}
                disabled={deleteProjectMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete Project'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-total-projects">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FolderOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-projects">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FolderOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {projectsData.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-completed-projects">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FolderOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {projectsData.filter(p => p.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Search and Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-projects"
                />
              </div>
              {/* Status Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 border-dashed" data-testid="filter-status">
                    <Filter className="mr-2 h-4 w-4" />
                    Status
                    {filterStatus.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1">
                        {filterStatus.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="start">
                  <div className="space-y-3">
                    <h4 className="font-medium leading-none">Filter by Status</h4>
                    <div className="space-y-2">
                      {allStatuses.map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={filterStatus.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilterStatus([...filterStatus, status])
                              } else {
                                setFilterStatus(filterStatus.filter(s => s !== status))
                              }
                            }}
                          />
                          <Label htmlFor={`status-${status}`} className="text-sm capitalize">
                            {status}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {filterStatus.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilterStatus([])}
                        className="h-8 px-2 lg:px-3"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Team Members Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 border-dashed" data-testid="filter-team-members">
                    <Filter className="mr-2 h-4 w-4" />
                    Team Members
                    {filterTeamMembers.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1">
                        {filterTeamMembers.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
                  <div className="space-y-3">
                    <h4 className="font-medium leading-none">Filter by Team Member</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {allTeamMembers.map((member) => (
                        <div key={member} className="flex items-center space-x-2">
                          <Checkbox
                            id={`member-${member}`}
                            checked={filterTeamMembers.includes(member)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilterTeamMembers([...filterTeamMembers, member])
                              } else {
                                setFilterTeamMembers(filterTeamMembers.filter(m => m !== member))
                              }
                            }}
                          />
                          <Label htmlFor={`member-${member}`} className="text-sm">
                            {member}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {filterTeamMembers.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilterTeamMembers([])}
                        className="h-8 px-2 lg:px-3"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Scopes Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 border-dashed" data-testid="filter-scopes">
                    <Filter className="mr-2 h-4 w-4" />
                    Scopes
                    {filterScopes.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1">
                        {filterScopes.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
                  <div className="space-y-3">
                    <h4 className="font-medium leading-none">Filter by Scope</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {allScopes.map((scope) => (
                        <div key={scope} className="flex items-center space-x-2">
                          <Checkbox
                            id={`scope-${scope}`}
                            checked={filterScopes.includes(scope)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilterScopes([...filterScopes, scope])
                              } else {
                                setFilterScopes(filterScopes.filter(s => s !== scope))
                              }
                            }}
                          />
                          <Label htmlFor={`scope-${scope}`} className="text-sm">
                            {scope}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {filterScopes.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilterScopes([])}
                        className="h-8 px-2 lg:px-3"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear All Filters */}
              {(filterStatus.length > 0 || filterTeamMembers.length > 0 || filterScopes.length > 0) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilterStatus([])
                    setFilterTeamMembers([])
                    setFilterScopes([])
                  }}
                  className="h-9 px-2"
                  data-testid="clear-all-filters"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {projectsLoading || timeEntriesLoading || projectScopesLoading || usersLoading || scopeTemplatesLoading || membersLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterStatus.length > 0 || filterTeamMembers.length > 0 || filterScopes.length > 0 
                ? 'Try adjusting your search or filters' 
                : 'Create your first project to get started'}
            </p>
            {(!searchTerm && filterStatus.length === 0 && filterTeamMembers.length === 0 && filterScopes.length === 0) && (
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-project">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              isAdmin={isAdmin}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
            />
          ))}
        </div>
      )}
    </div>
  )
}