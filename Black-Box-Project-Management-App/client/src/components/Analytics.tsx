import { useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Clock, DollarSign, TrendingUp, Users, Filter, X, Edit, Check, XCircle, Download } from 'lucide-react'
import type { Project, TimeEntry, ProjectMember, User, ProjectScope } from '@shared/schema'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Extend jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
  }
}

interface AnalyticsProps {
  isAdmin?: boolean
}

export default function Analytics({ isAdmin = false }: AnalyticsProps) {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [editingRates, setEditingRates] = useState<Record<string, Record<string, boolean>>>({})
  const [tempRates, setTempRates] = useState<Record<string, Record<string, number>>>({})
  const [projectSpecificRates, setProjectSpecificRates] = useState<Record<string, Record<string, number>>>({})
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('')
  const [projectSaleAmounts, setProjectSaleAmounts] = useState<Record<string, number>>({})
  const [editingSaleAmount, setEditingSaleAmount] = useState<Record<string, boolean>>({})
  const [tempSaleAmounts, setTempSaleAmounts] = useState<Record<string, number>>({})
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('')

  // Fetch real data from API
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    select: (data: any[]) => data as Project[]
  })

  const { data: timeEntries = [], isLoading: timeEntriesLoading } = useQuery({
    queryKey: ['/api/time-entries'],
    select: (data: any[]) => data as (TimeEntry & { project: Project; scope: ProjectScope; task?: any; user: User })[]
  })

  const { data: projectScopes = [], isLoading: scopesLoading } = useQuery({
    queryKey: ['/api/project-scopes'],
    select: (data: any[]) => data as ProjectScope[]
  })

  // Fetch project members for each project using useQueries to avoid hook rule violations
  const projectMembersQueries = useQueries({
    queries: projects.map(project => ({
      queryKey: ['/api/projects', project.id, 'members'],
      queryFn: async () => {
        const response = await fetch(`/api/projects/${project.id}/members`)
        if (!response.ok) throw new Error('Failed to fetch project members')
        return response.json()
      },
      enabled: !!project.id,
      select: (data: any[]) => data as (ProjectMember & { user: User })[]
    }))
  })

  // Helper function to get the effective rate for a team member
  const getEffectiveRate = (projectId: string, memberName: string, defaultRate: number) => {
    return projectSpecificRates[projectId]?.[memberName] ?? defaultRate
  }


  // Transform real API data into financial analytics format
  const projectFinancials = projects.map(project => {
    // Get project-specific time entries
    const projectTimeEntries = timeEntries.filter(entry => entry.projectId === project.id)
    
    // Get project scopes
    const projectSpecificScopes = projectScopes.filter(scope => scope.projectId === project.id)
    
    // Get project members from the corresponding query result
    const projectMembersIndex = projects.findIndex(p => p.id === project.id)
    const projectMembers = projectMembersQueries[projectMembersIndex]?.data || []
    
    // Calculate total hours from time entries
    const totalHours = projectTimeEntries.reduce((sum, entry) => sum + (entry.minutes || 0), 0) / 60
    
    // Calculate scope-wise analytics
    const scopeAnalytics = projectSpecificScopes.map(scope => {
      const scopeTimeEntries = projectTimeEntries.filter(entry => entry.scopeId === scope.id)
      const scopeHours = scopeTimeEntries.reduce((sum, entry) => sum + (entry.minutes || 0), 0) / 60
      
      // Calculate cost based on actual project member rates for this scope
      const scopeMemberEntries = scopeTimeEntries.map(entry => {
        const member = projectMembers.find(m => m.userId === entry.userId)
        const hourlyRate = member ? Number(member.costRate) || 75 : 75
        const sellingRate = member ? Number(member.sellingRate) || hourlyRate * 1.5 : hourlyRate * 1.5
        return {
          minutes: entry.minutes || 0,
          costRate: hourlyRate,
          sellingRate: sellingRate
        }
      })
      
      const cost = scopeMemberEntries.reduce((sum, entry) => 
        sum + (entry.minutes / 60) * entry.costRate, 0
      )
      const revenue = scopeMemberEntries.reduce((sum, entry) => 
        sum + (entry.minutes / 60) * entry.sellingRate, 0
      )
      const profit = revenue - cost
      
      return {
        name: scope.name,
        hours: Math.round(scopeHours * 100) / 100,
        cost: Math.round(cost),
        revenue: Math.round(revenue),
        profit: Math.round(profit)
      }
    })
    
    // Calculate team analytics
    const teamAnalytics = projectMembers.map(member => {
      const memberTimeEntries = projectTimeEntries.filter(entry => entry.userId === member.userId)
      const memberHours = memberTimeEntries.reduce((sum, entry) => sum + (entry.minutes || 0), 0) / 60
      const rate = Number(member.costRate) || 75 // Use project member cost rate or default
      const cost = memberHours * rate
      
      return {
        name: member.user.name,
        role: member.user.role === 'admin' ? 'Project Manager' : 'Team Member',
        hours: Math.round(memberHours * 100) / 100,
        rate: rate,
        cost: Math.round(cost)
      }
    })
    
    // Calculate project totals
    const totalCost = scopeAnalytics.reduce((sum, scope) => sum + scope.cost, 0)
    const totalRevenue = scopeAnalytics.reduce((sum, scope) => sum + scope.revenue, 0)
    
    return {
      id: project.id,
      name: project.name,
      totalHours: Math.round(totalHours * 100) / 100,
      estimatedHours: 0, // Not available in current data model, can be added later
      revenue: totalRevenue,
      cost: totalCost,
      status: project.status as 'active' | 'completed' | 'paused',
      scopes: scopeAnalytics,
      team: teamAnalytics
    }
  })

  // Get all unique scope names across projects
  const allScopeNames = Array.from(new Set(projectFinancials.flatMap(p => p.scopes.map(s => s.name))))

  // Filter data based on search and selections
  const searchFilteredProjects = projectSearchTerm.trim() 
    ? projectFinancials.filter(project => 
        project.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        project.status.toLowerCase().includes(projectSearchTerm.toLowerCase())
      )
    : projectFinancials

  const filteredProjects = selectedProjects.length > 0 
    ? searchFilteredProjects.filter(p => selectedProjects.includes(p.id))
    : searchFilteredProjects

  const filteredProjectsWithScopes = filteredProjects.map(project => {
    const filteredScopes = selectedScopes.length > 0 
      ? project.scopes.filter(scope => selectedScopes.includes(scope.name))
      : project.scopes
    
    // Create scope-to-team mapping for filtered scopes
    // For demonstration: assume each scope uses specific team members based on role
    const scopeTeamMapping: Record<string, string[]> = {
      'Frontend Development': ['Frontend Developer', 'UI Designer'],
      'Backend Development': ['Backend Developer', 'Mobile Developer'],
      'Testing & QA': ['QA Engineer'],
      'UI Design': ['UI Designer', 'Graphic Designer'],
      'Development': ['Frontend Developer', 'Backend Developer', 'Mobile Developer'],
      'Testing': ['QA Engineer'],
      'Content Creation': ['Content Writer'],
      'Design': ['Graphic Designer', 'UI Designer'],
      'Analytics': ['QA Engineer'] // Assuming analytics work done by QA
    }
    
    // Get relevant roles for selected scopes
    const relevantRoles = filteredScopes.length > 0 
      ? Array.from(new Set(filteredScopes.flatMap(scope => scopeTeamMapping[scope.name] || [])))
      : project.team.map(member => member.role)
    
    // Filter team based on scope selection
    const filteredTeam = filteredScopes.length > 0 && selectedScopes.length > 0
      ? project.team.filter(member => 
          relevantRoles.includes(member.role) || member.name.includes('Overhead')
        )
      : project.team
    
    return {
      ...project,
      scopes: filteredScopes,
      team: filteredTeam
    }
  }).filter(project => project.scopes.length > 0)

  // Use filtered data for all calculations
  const dataToUse = filteredProjectsWithScopes

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleScopeToggle = (scopeName: string) => {
    setSelectedScopes(prev => 
      prev.includes(scopeName)
        ? prev.filter(name => name !== scopeName)
        : [...prev, scopeName]
    )
  }

  const clearAllFilters = () => {
    setSelectedProjects([])
    setSelectedScopes([])
  }

  const startEditingRate = (projectId: string, memberName: string, defaultRate: number) => {
    const effectiveRate = getEffectiveRate(projectId, memberName, defaultRate)
    setEditingRates(prev => ({
      ...prev,
      [projectId]: { ...prev[projectId], [memberName]: true }
    }))
    setTempRates(prev => ({
      ...prev,
      [projectId]: { ...prev[projectId], [memberName]: effectiveRate }
    }))
  }

  const cancelEditingRate = (projectId: string, memberName: string) => {
    setEditingRates(prev => ({
      ...prev,
      [projectId]: { ...prev[projectId], [memberName]: false }
    }))
    setTempRates(prev => {
      const updated = { ...prev }
      if (updated[projectId]) {
        delete updated[projectId][memberName]
      }
      return updated
    })
  }

  const startEditingSaleAmount = (projectId: string, currentAmount: number) => {
    setEditingSaleAmount(prev => ({ ...prev, [projectId]: true }))
    setTempSaleAmounts(prev => ({ ...prev, [projectId]: currentAmount }))
  }

  const cancelEditingSaleAmount = (projectId: string) => {
    setEditingSaleAmount(prev => ({ ...prev, [projectId]: false }))
    setTempSaleAmounts(prev => {
      const updated = { ...prev }
      delete updated[projectId]
      return updated
    })
  }

  const saveSaleAmount = (projectId: string) => {
    const newAmount = tempSaleAmounts[projectId]
    if (newAmount && newAmount >= 0) {
      setProjectSaleAmounts(prev => ({ ...prev, [projectId]: newAmount }))
      setSaveSuccessMessage(`Updated sale amount to ${formatCurrency(newAmount)} for this project`)
      setTimeout(() => setSaveSuccessMessage(''), 3000)
      
      setEditingSaleAmount(prev => ({ ...prev, [projectId]: false }))
      setTempSaleAmounts(prev => {
        const updated = { ...prev }
        delete updated[projectId]
        return updated
      })
    }
  }

  const updateTempSaleAmount = (projectId: string, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setTempSaleAmounts(prev => ({ ...prev, [projectId]: numValue }))
    }
  }

  // Helper function to get project sale amount (custom or default)
  const getProjectSaleAmount = (projectId: string, defaultRevenue: number) => {
    return projectSaleAmounts[projectId] ?? defaultRevenue
  }

  const saveEditingRate = (projectId: string, memberName: string) => {
    const newRate = tempRates[projectId]?.[memberName]
    if (newRate && newRate > 0) {
      // Save the project-specific rate override
      setProjectSpecificRates(prev => ({
        ...prev,
        [projectId]: { ...prev[projectId], [memberName]: newRate }
      }))
      
      // Show success message
      setSaveSuccessMessage(`Updated ${memberName}'s rate to ${formatCurrency(newRate)}/hr for this project`)
      setTimeout(() => setSaveSuccessMessage(''), 3000)
      
      // In a real app, this would update the backend
      console.log(`Saving new rate for ${memberName} in project ${projectId}: $${newRate}/hr`)
      
      setEditingRates(prev => ({
        ...prev,
        [projectId]: { ...prev[projectId], [memberName]: false }
      }))
      setTempRates(prev => {
        const updated = { ...prev }
        if (updated[projectId]) {
          delete updated[projectId][memberName]
        }
        return updated
      })
    }
  }

  const updateTempRate = (projectId: string, memberName: string, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setTempRates(prev => ({
        ...prev,
        [projectId]: { ...prev[projectId], [memberName]: numValue }
      }))
    }
  }

  // Generate scope distribution from filtered data
  const allScopes = dataToUse.flatMap(p => p.scopes)
  const scopeTotals = allScopes.reduce((acc, scope) => {
    const scopeType = scope.name.includes('Development') ? 'Development' : 
                     scope.name.includes('Design') ? 'Design' :
                     scope.name.includes('Testing') || scope.name.includes('QA') ? 'Testing' :
                     'Other'
    acc[scopeType] = (acc[scopeType] || 0) + scope.hours
    return acc
  }, {} as Record<string, number>)
  
  const totalScopeHours = Object.values(scopeTotals).reduce((a, b) => a + b, 0)
  const scopeDistribution = [
    { name: 'Development', value: Math.round((scopeTotals.Development || 0) / totalScopeHours * 100), color: '#2563eb' },
    { name: 'Design', value: Math.round((scopeTotals.Design || 0) / totalScopeHours * 100), color: '#059669' },
    { name: 'Testing', value: Math.round((scopeTotals.Testing || 0) / totalScopeHours * 100), color: '#dc2626' },
    { name: 'Other', value: Math.round((scopeTotals.Other || 0) / totalScopeHours * 100), color: '#7c2d12' },
  ].filter(item => item.value > 0)

  // Generate chart data from filtered data
  const timeByProject = dataToUse.map(project => ({
    name: project.name,
    hours: project.scopes.reduce((acc, scope) => acc + scope.hours, 0),
    cost: project.scopes.reduce((acc, scope) => acc + scope.cost, 0)
  }))

  // Current year for monthly chart
  const currentYear = new Date().getFullYear()
  
  // Calculate real monthly hours data from time entries
  const monthlyHours = (() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    
    return months.map((month, index) => {
      // Filter time entries for this month with null safety
      const monthEntries = timeEntries.filter(entry => {
        // Use createdAt if available, otherwise fall back to startedAt or endedAt
        const dateField = entry.createdAt || entry.startedAt || entry.endedAt
        if (!dateField) return false
        
        try {
          const entryDate = new Date(dateField)
          return entryDate.getFullYear() === currentYear && entryDate.getMonth() === index
        } catch {
          return false
        }
      })
      
      // Calculate total hours for this month
      const totalMinutes = monthEntries.reduce((sum, entry) => sum + (entry.minutes || 0), 0)
      const hours = Math.round(totalMinutes / 60)
      
      // Default target is 160 hours per month (20 working days * 8 hours)
      const target = 160
      
      return { month, hours, target }
    })
  })()

  // Calculate totals from filtered data using actual sale amounts
  const totalHours = dataToUse.reduce((acc, project) => acc + project.scopes.reduce((scopeAcc, scope) => scopeAcc + scope.hours, 0), 0)
  const totalCost = dataToUse.reduce((acc, project) => acc + project.scopes.reduce((scopeAcc, scope) => scopeAcc + scope.cost, 0), 0)
  const totalActualRevenue = dataToUse.reduce((acc, project) => {
    const defaultRevenue = project.scopes.reduce((scopeAcc, scope) => scopeAcc + scope.revenue, 0)
    return acc + getProjectSaleAmount(project.id, defaultRevenue)
  }, 0)
  const profit = totalActualRevenue - totalCost

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Generate PDF report for a specific project
  const generateProjectPDF = (project: any) => {
    try {
      const doc = new jsPDF()
      
      // Project title
      doc.setFontSize(20)
      doc.text(project.name + ' - Analytics Report', 20, 25)
      
      // Report date
      doc.setFontSize(10)
      doc.text('Generated on: ' + new Date().toLocaleDateString(), 20, 35)
      
      // Project overview section
      doc.setFontSize(14)
      doc.text('Project Overview', 20, 50)
      
      const projectCost = project.scopes.reduce((acc: number, scope: any) => acc + scope.cost, 0)
      const defaultRevenue = project.scopes.reduce((acc: number, scope: any) => acc + scope.revenue, 0)
      const actualSaleAmount = getProjectSaleAmount(project.id, defaultRevenue)
      const projectProfit = actualSaleAmount - projectCost
      const profitMargin = actualSaleAmount > 0 ? (projectProfit / actualSaleAmount) * 100 : 0
      const projectHours = project.scopes.reduce((acc: number, scope: any) => acc + scope.hours, 0)
      
      // Project metrics
      doc.setFontSize(10)
      const metricsTable = [
        ['Total Hours', projectHours.toString()],
        ['Total Cost', formatCurrency(projectCost)],
        ['Sale Amount', formatCurrency(actualSaleAmount)],
        ['Profit', formatCurrency(projectProfit)],
        ['Profit Margin', profitMargin.toFixed(1) + '%'],
        ['Status', project.status]
      ];
      
      autoTable(doc, {
        head: [['Metric', 'Value']],
        body: metricsTable,
        startY: 55,
        margin: { left: 20 },
        columnStyles: {
          0: { fontStyle: 'bold' }
        }
      })
      
      // Team breakdown section
      const teamStartY = (doc as any).lastAutoTable.finalY + 15
      doc.setFontSize(14)
      doc.text('Team Breakdown', 20, teamStartY)
      
      const teamData = project.team.map((member: any) => [
        member.name,
        member.role,
        member.hours.toString(),
        formatCurrency(getEffectiveRate(project.id, member.name, member.rate) || member.rate),
        formatCurrency(member.cost)
      ])
      
      autoTable(doc, {
        head: [['Team Member', 'Role', 'Hours', 'Rate', 'Cost']],
        body: teamData,
        startY: teamStartY + 5,
        margin: { left: 20 }
      })
      
      // Scope breakdown section
      const scopeStartY = (doc as any).lastAutoTable.finalY + 15
      doc.setFontSize(14)
      doc.text('Scope Breakdown', 20, scopeStartY)
      
      const scopeData = project.scopes.map((scope: any) => [
        scope.name,
        scope.hours.toString(),
        formatCurrency(scope.cost),
        formatCurrency(scope.revenue),
        formatCurrency(scope.profit)
      ])
      
      autoTable(doc, {
        head: [['Scope', 'Hours', 'Cost', 'Revenue', 'Profit']],
        body: scopeData,
        startY: scopeStartY + 5,
        margin: { left: 20 }
      })
      
      // Save the PDF
      doc.save(`${project.name.replace(/\s+/g, '_')}_Analytics_Report.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  // Show loading state if data is still being fetched
  const isLoading = projectsLoading || timeEntriesLoading || scopesLoading || 
    projectMembersQueries.some(query => query.isLoading)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Project-focused analytics with cost and profitability tracking
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with PDF Download */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Project-focused analytics with cost and profitability tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedProjects.length === 1 && (
            <Button
              variant="outline"
              onClick={() => {
                const project = projectFinancials.find(p => selectedProjects.includes(p.id))
                if (project) generateProjectPDF(project)
              }}
              data-testid="button-download-pdf"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Primary Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Project</CardTitle>
          <p className="text-sm text-muted-foreground">Choose a project to view detailed analytics</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Input
              placeholder="Search projects by name or status..."
              value={projectSearchTerm}
              onChange={(e) => setProjectSearchTerm(e.target.value)}
              className="pl-8"
              data-testid="input-search-projects"
            />
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchFilteredProjects.map((project) => (
              <div 
                key={project.id} 
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover-elevate ${
                  selectedProjects.includes(project.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border'
                }`}
                onClick={() => handleProjectToggle(project.id)}
                data-testid={`project-card-${project.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{project.name}</h3>
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {project.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{project.totalHours}h tracked</p>
                  <p>{formatCurrency(project.cost)} total cost</p>
                  <p>{formatCurrency(getProjectSaleAmount(project.id, project.revenue))} sale amount</p>
                </div>
              </div>
            ))}
          </div>
          
          {selectedProjects.length > 0 && (
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                data-testid="button-clear-project-selection"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Selection
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scope Selection (only show when projects are selected) */}
      {selectedProjects.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Filter by Scope</CardTitle>
                <p className="text-sm text-muted-foreground">Optionally filter the selected project(s) by specific scopes</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedScopes.length === allScopeNames.length) {
                    setSelectedScopes([])
                  } else {
                    setSelectedScopes([...allScopeNames])
                  }
                }}
                data-testid="button-select-all-scopes"
              >
                {selectedScopes.length === allScopeNames.length ? 'Clear All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {allScopeNames.map((scopeName) => (
                <div key={scopeName} className="flex items-center space-x-2">
                  <Checkbox
                    id={`scope-${scopeName}`}
                    checked={selectedScopes.includes(scopeName)}
                    onCheckedChange={() => handleScopeToggle(scopeName)}
                    data-testid={`checkbox-scope-${scopeName.replace(/\s+/g, '-').toLowerCase()}`}
                  />
                  <Label 
                    htmlFor={`scope-${scopeName}`} 
                    className="text-sm cursor-pointer"
                  >
                    {scopeName}
                  </Label>
                </div>
              ))}
            </div>
            {selectedScopes.length > 0 && (
              <div className="flex items-center gap-3 pt-4 border-t mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedScopes([])}
                  data-testid="button-clear-scope-selection"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Scopes
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedScopes.length} scope{selectedScopes.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}



      {/* Time by Project Chart - Only show when no specific projects are selected */}
      {selectedProjects.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Time by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeByProject}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Analytics Content - Only show when projects are selected */}
      {selectedProjects.length > 0 && (
        <div className="space-y-6">

          {/* Time Distribution by Scope Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Time Distribution by Scope</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={scopeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {scopeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Hours Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Hours Chart - {currentYear}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Hours logged per month compared to monthly targets
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}h`,
                      name === 'hours' ? 'Actual Hours' : 'Target Hours'
                    ]}
                    labelFormatter={(label) => `${label} ${currentYear}`}
                  />
                  <Bar dataKey="hours" fill="#2563eb" name="Actual Hours" />
                  <Bar dataKey="target" fill="#e5e7eb" name="Target Hours" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Admin-only sections */}
          {isAdmin && (
            <>
              {/* Project Profitability */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Profitability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dataToUse.map((project) => {
                      const projectCost = project.scopes.reduce((acc, scope) => acc + scope.cost, 0)
                      const defaultRevenue = project.scopes.reduce((acc, scope) => acc + scope.revenue, 0)
                      const actualSaleAmount = getProjectSaleAmount(project.id, defaultRevenue)
                      const projectProfit = actualSaleAmount - projectCost
                      const profitMargin = actualSaleAmount > 0 ? (projectProfit / actualSaleAmount) * 100 : 0
                      const projectHours = project.scopes.reduce((acc, scope) => acc + scope.hours, 0)
                      
                      return (
                        <div key={project.name} className="flex items-center justify-between p-4 bg-muted rounded-lg" data-testid={`profit-${project.name.replace(/\s+/g, '-').toLowerCase()}`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium">{project.name}</h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingSaleAmount(project.id, actualSaleAmount)}
                                disabled={editingSaleAmount[project.id]}
                                data-testid={`button-edit-sale-${project.id}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span>Sale Amount:</span>
                                {editingSaleAmount[project.id] ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">$</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={tempSaleAmounts[project.id] || actualSaleAmount}
                                      onChange={(e) => updateTempSaleAmount(project.id, e.target.value)}
                                      className="h-6 w-24 text-xs"
                                      data-testid={`input-sale-amount-${project.id}`}
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => saveSaleAmount(project.id)}
                                      className="h-6 w-6 p-0"
                                      data-testid={`button-save-sale-${project.id}`}
                                    >
                                      <Check className="w-3 h-3 text-green-600" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => cancelEditingSaleAmount(project.id)}
                                      className="h-6 w-6 p-0"
                                      data-testid={`button-cancel-sale-${project.id}`}
                                    >
                                      <XCircle className="w-3 h-3 text-red-600" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-foreground">{formatCurrency(actualSaleAmount)}</span>
                                    {projectSaleAmounts[project.id] && (
                                      <Badge variant="outline" className="text-xs text-green-600">
                                        Actual
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div>Cost: {formatCurrency(projectCost)} • {projectHours}h logged</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${projectProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(projectProfit)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {profitMargin.toFixed(1)}% margin
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateProjectPDF(project)}
                              className="mt-2"
                              data-testid={`button-download-pdf-${project.id}`}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>


              {/* Team Cost Analysis */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Team Cost Analysis</CardTitle>
                    {saveSuccessMessage && (
                      <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded" data-testid="success-message-rate-update">
                        {saveSuccessMessage}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dataToUse.map((project) => (
                      <div key={project.id} className="space-y-3">
                        <h4 className="font-medium text-lg">{project.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {project.team.map((member, index) => (
                            <div key={index} className="p-3 bg-muted rounded-lg">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium text-sm">{member.name}</h5>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {member.hours}h
                                    </Badge>
                                    {!member.name.includes('Overhead') && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEditingRate(project.id, member.name, member.rate)}
                                        disabled={editingRates[project.id]?.[member.name]}
                                        data-testid={`button-edit-rate-${project.id}-${member.name.replace(/\s+/g, '-').toLowerCase()}`}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground">{member.role}</p>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Rate:</span>
                                    {editingRates[project.id]?.[member.name] ? (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs">$</span>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={tempRates[project.id]?.[member.name] || getEffectiveRate(project.id, member.name, member.rate)}
                                          onChange={(e) => updateTempRate(project.id, member.name, e.target.value)}
                                          className="h-6 w-16 text-xs"
                                          data-testid={`input-rate-${project.id}-${member.name.replace(/\s+/g, '-').toLowerCase()}`}
                                        />
                                        <span className="text-xs">/hr</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => saveEditingRate(project.id, member.name)}
                                          className="h-6 w-6 p-0"
                                          data-testid={`button-save-rate-${project.id}-${member.name.replace(/\s+/g, '-').toLowerCase()}`}
                                        >
                                          <Check className="w-3 h-3 text-green-600" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => cancelEditingRate(project.id, member.name)}
                                          className="h-6 w-6 p-0"
                                          data-testid={`button-cancel-rate-${project.id}-${member.name.replace(/\s+/g, '-').toLowerCase()}`}
                                        >
                                          <XCircle className="w-3 h-3 text-red-600" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <span>{formatCurrency(getEffectiveRate(project.id, member.name, member.rate))}/hr</span>
                                        {projectSpecificRates[project.id]?.[member.name] && (
                                          <Badge variant="outline" className="text-xs text-blue-600">
                                            Custom
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Cost:</span>
                                    <span className="font-medium">{formatCurrency(member.cost)}</span>
                                  </div>
                                </div>
                                {editingRates[project.id]?.[member.name] && (
                                  <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                                    <span className="font-medium">Project-Specific Rate:</span> This will update the rate for "{project.name}" only and won't affect the default team member rate.
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}