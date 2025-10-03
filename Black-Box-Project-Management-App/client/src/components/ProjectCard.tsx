import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, DollarSign, Users, TrendingUp, Settings, Eye, EyeOff, Edit, Trash2 } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface ProjectScope {
  name: string
  timeSpent: number
  progress: number
}

interface TeamMember {
  id: string
  name: string
  role: string
  avatar?: string
  hourlyRate?: number
}

interface ProjectData {
  id: string
  name: string
  description: string
  totalTime: number
  estimatedTime: number
  revenue?: number
  cost?: number
  status: 'active' | 'completed' | 'paused'
  scopes: ProjectScope[]
  team: TeamMember[]
  isAdmin?: boolean
}

interface ProjectCardProps {
  project: ProjectData
  isAdmin?: boolean
  onEditProject?: (projectId: string) => void
  onDeleteProject?: (projectId: string) => void
}

export default function ProjectCard({ project, isAdmin = false, onEditProject, onDeleteProject }: ProjectCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showFinancials, setShowFinancials] = useState(false)

  const progressPercentage = (project.totalTime / project.estimatedTime) * 100
  const totalCost = project.team.reduce((acc, member) => 
    acc + (member.hourlyRate || 0) * (project.totalTime / 3600), 0
  )
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    return `${hours}h`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'completed': return 'bg-blue-500'
      case 'paused': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card className="hover-elevate" data-testid={`card-project-${project.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Badge 
                variant="secondary" 
                className={`text-white ${getStatusColor(project.status)}`}
                data-testid={`status-${project.status}`}
              >
                {project.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
          {isAdmin && (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEditProject?.(project.id)}
                data-testid="button-edit-project"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDeleteProject?.(project.id)}
                data-testid="button-delete-project"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{formatDuration(project.totalTime)} logged</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{project.team.length} members</span>
          </div>
        </div>


        {/* Team Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Team</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              data-testid="button-toggle-details"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
          
          <div className="flex -space-x-2">
            {project.team.slice(0, 4).map(member => (
              <Tooltip key={member.id}>
                <TooltipTrigger asChild>
                  <Avatar className="border-2 border-background w-8 h-8" data-testid={`avatar-${member.id}`}>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {project.team.length > 4 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs font-medium">+{project.team.length - 4}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{project.team.length - 4} more team members</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Collapsible Details */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleContent className="space-y-4">
            {/* Scopes Breakdown */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Scope Breakdown</h4>
              <div className="space-y-2">
                {project.scopes.map(scope => (
                  <div key={scope.name} className="flex items-center justify-between p-2 bg-muted rounded" data-testid={`scope-${scope.name.replace(/\s+/g, '-').toLowerCase()}`}>
                    <span className="text-sm">{scope.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatDuration(scope.timeSpent)}</span>
                      <div className="w-16">
                        <Progress value={scope.progress} className="h-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}