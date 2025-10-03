import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, Pause, Clock, Plus, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import type { TimeEntry as DBTimeEntry, Project, ProjectScope, InsertTimeEntry } from '@shared/schema'

interface TimeEntry {
  id: string
  project: string
  scope: string
  duration: number
  isActive: boolean
}

export default function TimeTracker() {
  const { toast } = useToast()
  
  // Mock current user - TODO: Replace with actual user context
  const currentUserId = '68015944-9b46-4353-b2bc-de59cc592eaa' // Valid admin user ID from database
  
  const [isTracking, setIsTracking] = useState(false)
  const [currentProject, setCurrentProject] = useState<string>('') // This will store project ID
  const [currentScope, setCurrentScope] = useState<string>('') // This will store scope ID
  const [currentDescription, setCurrentDescription] = useState<string>('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [accumulatedTime, setAccumulatedTime] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualProject, setManualProject] = useState<string>('') // This will store project ID
  const [manualScope, setManualScope] = useState<string>('') // This will store scope ID
  const [manualHours, setManualHours] = useState('')
  const [manualMinutes, setManualMinutes] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  
  // Fetch real data from APIs
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    select: (data: any[]) => data.map((project: any) => ({
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt)
    })) as Project[]
  })

  const { data: projectScopes = [], isLoading: scopesLoading } = useQuery({
    queryKey: ['/api/project-scopes'],
    select: (data: any[]) => data.map((scope: any) => ({
      ...scope,
      createdAt: new Date(scope.createdAt)
    })) as ProjectScope[]
  })

  const { data: timeEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['/api/time-entries'],
    select: (data: any[]) => data.map((entry: any) => ({
      ...entry,
      startedAt: entry.startedAt ? new Date(entry.startedAt) : null,
      endedAt: entry.endedAt ? new Date(entry.endedAt) : null
    })) as DBTimeEntry[]
  })

  // Mutation for creating time entries
  const createTimeEntryMutation = useMutation({
    mutationFn: async (data: InsertTimeEntry) => {
      return await apiRequest('POST', '/api/time-entries', data)
    },
    onSuccess: () => {
      // Invalidate and refetch time entries
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries'] })
      toast({
        title: "Time entry saved",
        description: "Your time entry has been successfully recorded.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error saving time entry",
        description: "Failed to save your time entry. Please try again.",
        variant: "destructive",
      })
      console.error('Error creating time entry:', error)
    },
  })

  // Transform time entries to legacy format for recent entries display
  const recentEntries: TimeEntry[] = timeEntries
    .slice(0, 5) // Get 5 most recent entries
    .map(entry => {
      const project = projects.find(p => p.id === entry.projectId)
      const scope = projectScopes.find(s => s.id === entry.scopeId)
      return {
        id: entry.id,
        project: project?.name || 'Unknown Project',
        scope: scope?.name || 'Unknown Scope',
        duration: entry.minutes * 60, // Convert minutes to seconds
        isActive: false
      }
    })

  // Build project options with scopes (including scope IDs)
  const projectOptions = projects.map(project => {
    const scopes = projectScopes
      .filter(scope => scope.projectId === project.id)
      .map(scope => ({ id: scope.id, name: scope.name }))
    return {
      id: project.id,
      name: project.name,
      scopes
    }
  })

  const currentProjectData = projectOptions.find(p => p.id === currentProject)
  const manualProjectData = projectOptions.find(p => p.id === manualProject)

  // Timer persistence functions
  const saveTimerState = () => {
    const timerState = {
      isTracking,
      currentProject,
      currentScope,
      currentDescription,
      accumulatedTime,
      startTime: startTime?.toISOString(),
      endTime: endTime?.toISOString()
    }
    localStorage.setItem('timerState', JSON.stringify(timerState))
  }

  const loadTimerState = () => {
    const saved = localStorage.getItem('timerState')
    if (saved) {
      try {
        const timerState = JSON.parse(saved)
        // Restore session if there's any timer data (tracking or paused)
        if (timerState.currentProject && timerState.currentScope && (timerState.startTime || timerState.accumulatedTime > 0)) {
          setCurrentProject(timerState.currentProject || '')
          setCurrentScope(timerState.currentScope || '')
          setCurrentDescription(timerState.currentDescription || '')
          setAccumulatedTime(timerState.accumulatedTime || 0)
          
          if (timerState.isTracking && timerState.startTime) {
            // Resume active session
            setIsTracking(true)
            setStartTime(new Date(timerState.startTime))
            setEndTime(null)
          } else if (timerState.startTime && timerState.endTime) {
            // Resume paused session
            setIsTracking(false)
            setStartTime(new Date(timerState.startTime))
            setEndTime(new Date(timerState.endTime))
            // Set elapsed time to show accumulated time in UI
            setElapsedTime(timerState.accumulatedTime || 0)
          } else if (timerState.accumulatedTime > 0) {
            // Resume session with only accumulated time (no active/paused state)
            setIsTracking(false)
            setElapsedTime(timerState.accumulatedTime)
          }
        }
      } catch (error) {
        console.error('Failed to load timer state:', error)
        localStorage.removeItem('timerState')
      }
    }
  }

  const clearTimerState = () => {
    localStorage.removeItem('timerState')
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  const calculateElapsedTime = () => {
    if (!startTime) return accumulatedTime
    const now = new Date()
    const sessionTime = Math.floor((now.getTime() - startTime.getTime()) / 1000)
    return accumulatedTime + sessionTime
  }

  // Background timer effect
  useEffect(() => {
    if (isTracking && startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = calculateElapsedTime()
        setElapsedTime(elapsed)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isTracking, startTime])

  // Load timer state on mount
  useEffect(() => {
    loadTimerState()
  }, [])

  // Update elapsed time display for paused sessions
  useEffect(() => {
    if (!isTracking && accumulatedTime > 0) {
      setElapsedTime(accumulatedTime)
    }
  }, [isTracking])

  // Save timer state when it changes
  useEffect(() => {
    saveTimerState()
  }, [isTracking, currentProject, currentScope, currentDescription, accumulatedTime, startTime, endTime])

  const handleStart = () => {
    if (!currentProject || !currentScope) return
    const now = new Date()
    setIsTracking(true)
    setStartTime(now)
    setEndTime(null)
    // Don't reset accumulated time - preserve previous session time
    console.log('Time tracking started for:', currentProject, currentScope, 'Description:', currentDescription || 'No description')
    console.log('Start time:', now.toLocaleString())
    if (accumulatedTime > 0) {
      console.log('Resuming with accumulated time:', formatDuration(accumulatedTime))
    }
  }

  const handlePause = () => {
    const now = new Date()
    const currentElapsed = calculateElapsedTime()
    setIsTracking(false)
    setEndTime(now)
    setAccumulatedTime(currentElapsed)
    console.log('Time tracking paused at:', now.toLocaleString())
    console.log('Session time:', formatDuration(startTime ? Math.floor((now.getTime() - startTime.getTime()) / 1000) : 0))
    console.log('Total accumulated time:', formatDuration(currentElapsed))
  }

  const handleCancel = () => {
    setIsTracking(false)
    setElapsedTime(0)
    setAccumulatedTime(0)
    setStartTime(null)
    setEndTime(null)
    clearTimerState()
    console.log('Time tracking cancelled. No time entry saved.')
    // Reset description after cancelling
    setCurrentDescription('')
  }

  const handleComplete = () => {
    const now = new Date()
    const finalElapsedTime = calculateElapsedTime()
    const totalMinutes = Math.ceil(finalElapsedTime / 60) // Round up so any time tracked counts as at least 1 minute
    
    console.log('Timer completion validation:', {
      totalMinutes,
      currentProject,
      currentScope,
      finalElapsedTime,
      startTime,
      isTracking,
      elapsedTime,
      accumulatedTime
    })
    
    if (totalMinutes <= 0 || !currentProject || !currentScope) {
      console.error('Validation failed:', {
        totalMinutesValid: totalMinutes > 0,
        hasProject: !!currentProject,
        hasScope: !!currentScope
      })
      toast({
        title: "Cannot save entry",
        description: "Please ensure you have selected a project and scope, and tracked some time.",
        variant: "destructive",
      })
      return
    }

    // Create the time entry
    const timeEntryData = {
      userId: currentUserId,
      projectId: currentProject,
      scopeId: currentScope,
      description: currentDescription || '',
      minutes: totalMinutes,
      entryType: 'timer' as const,
      startedAt: startTime?.toISOString() || null,
      endedAt: now.toISOString()
    }

    console.log('Saving time entry:', timeEntryData)
    
    createTimeEntryMutation.mutate(timeEntryData, {
      onSuccess: () => {
        // Reset for next entry
        setIsTracking(false)
        setEndTime(now)
        clearTimerState()
        setElapsedTime(0)
        setAccumulatedTime(0)
        setStartTime(null)
        setEndTime(null)
        setCurrentDescription('')
      },
      onError: (error) => {
        console.error('Failed to save time entry:', error)
      }
    })
  }

  const resetManualForm = () => {
    setManualProject('')
    setManualScope('')
    setManualHours('')
    setManualMinutes('')
    setManualDescription('')
  }

  const handleManualEntry = () => {
    const hours = parseInt(manualHours) || 0
    const minutes = parseInt(manualMinutes) || 0
    const totalMinutes = (hours * 60) + minutes
    
    if (totalMinutes <= 0 || !manualProject || !manualScope) {
      toast({
        title: "Cannot save entry",
        description: "Please ensure you have selected a project and scope, and entered some time.",
        variant: "destructive",
      })
      return
    }

    // Create the time entry
    const timeEntryData: InsertTimeEntry = {
      userId: currentUserId,
      projectId: manualProject,
      scopeId: manualScope,
      description: manualDescription || '',
      minutes: totalMinutes,
      entryType: 'manual',
      startedAt: null,
      endedAt: null
    }

    console.log('Saving manual time entry:', timeEntryData)
    
    createTimeEntryMutation.mutate(timeEntryData, {
      onSuccess: () => {
        setShowManualEntry(false)
        resetManualForm()
      },
      onError: (error) => {
        console.error('Failed to save manual time entry:', error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Time Tracking Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="timer" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timer" data-testid="tab-timer">Live Timer</TabsTrigger>
              <TabsTrigger value="manual" data-testid="tab-manual">Manual Entry</TabsTrigger>
            </TabsList>

            {/* Live Timer Tab */}
            <TabsContent value="timer" className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Project</Label>
                    <Select value={currentProject} onValueChange={setCurrentProject} data-testid="select-project">
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Scope</Label>
                    <Select 
                      value={currentScope} 
                      onValueChange={setCurrentScope}
                      disabled={!currentProject}
                      data-testid="select-scope"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentProjectData?.scopes.map(scope => (
                          <SelectItem key={scope.id} value={scope.id}>
                            {scope.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description Field */}
                <div>
                  <Label htmlFor="timer-description" className="text-sm font-medium">Description (Optional)</Label>
                  <Input
                    id="timer-description"
                    placeholder="What are you working on?"
                    value={currentDescription}
                    onChange={(e) => setCurrentDescription(e.target.value)}
                    data-testid="input-timer-description"
                  />
                </div>
              </div>

              {/* Timer Display */}
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-primary mb-4" data-testid="text-timer">
                  {formatDuration(elapsedTime)}
                </div>
                
                <div className="flex justify-center gap-3">
                  {!isTracking ? (
                    <Button
                      size="lg"
                      onClick={handleStart}
                      disabled={!currentProject || !currentScope}
                      data-testid="button-start"
                      className="flex items-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Start
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        variant="secondary"
                        onClick={handlePause}
                        data-testid="button-pause"
                        className="flex items-center gap-2"
                      >
                        <Pause className="w-5 h-5" />
                        Pause
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="lg"
                            variant="destructive"
                            data-testid="button-cancel"
                            className="flex items-center gap-2"
                          >
                            <X className="w-5 h-5" />
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Time Tracking?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this time tracking session? 
                              All tracked time will be lost and not saved.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid="button-cancel-no">No, Continue</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCancel} data-testid="button-cancel-yes">
                              Yes, Cancel Session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        size="lg"
                        onClick={handleComplete}
                        data-testid="button-complete"
                        className="flex items-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Complete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manual-project" className="text-sm font-medium">Project</Label>
                  <Select value={manualProject} onValueChange={setManualProject}>
                    <SelectTrigger data-testid="select-manual-project">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="manual-scope" className="text-sm font-medium">Scope</Label>
                  <Select 
                    value={manualScope} 
                    onValueChange={setManualScope}
                    disabled={!manualProject}
                  >
                    <SelectTrigger data-testid="select-manual-scope">
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      {manualProjectData?.scopes.map(scope => (
                        <SelectItem key={scope.id} value={scope.id}>
                          {scope.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Time Input */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Time Spent</Label>
                <div className="flex gap-4 items-end">
                  <div>
                    <Label htmlFor="manual-hours" className="text-xs text-muted-foreground">Hours</Label>
                    <Input
                      id="manual-hours"
                      type="number"
                      min="0"
                      max="24"
                      placeholder="0"
                      value={manualHours}
                      onChange={(e) => setManualHours(e.target.value)}
                      className="w-20"
                      data-testid="input-manual-hours"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual-minutes" className="text-xs text-muted-foreground">Minutes</Label>
                    <Input
                      id="manual-minutes"
                      type="number"
                      min="0"
                      max="59"
                      placeholder="0"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(e.target.value)}
                      className="w-20"
                      data-testid="input-manual-minutes"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground pb-2">
                    Total: {((parseInt(manualHours) || 0) * 60 + (parseInt(manualMinutes) || 0))} minutes
                  </span>
                </div>
              </div>

              {/* Description (Optional) */}
              <div>
                <Label htmlFor="manual-description" className="text-sm font-medium">Description (Optional)</Label>
                <Input
                  id="manual-description"
                  placeholder="What did you work on?"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  data-testid="input-manual-description"
                />
              </div>

              {/* Add Entry Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleManualEntry}
                  disabled={!manualProject || !manualScope || (!(parseInt(manualHours) || 0) && !(parseInt(manualMinutes) || 0))}
                  data-testid="button-add-manual-entry"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Time Entry
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEntries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted rounded-md" data-testid={`entry-${entry.id}`}>
                <div>
                  <div className="font-medium">{entry.project}</div>
                  <div className="text-sm text-muted-foreground">{entry.scope}</div>
                </div>
                <Badge variant="secondary">{formatDuration(entry.duration)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}