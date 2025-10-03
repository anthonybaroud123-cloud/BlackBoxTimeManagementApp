import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Clock, 
  BarChart3, 
  FolderOpen, 
  Users, 
  Settings, 
  LogOut,
  Timer,
  Shield
} from 'lucide-react'

interface AppSidebarProps {
  user?: {
    name: string
    email: string
    role: 'admin' | 'user'
    avatar?: string
  }
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation()
  const { state } = useSidebar()
  
  // Mock user data - TODO: remove mock functionality
  const currentUser = user || {
    name: 'John Doe',
    email: 'john@company.com',
    role: 'admin' as const,
  }

  const navigationItems = [
    {
      title: 'Time Tracker',
      url: '/',
      icon: Timer,
      description: 'Track time on projects'
    },
    {
      title: 'Projects',
      url: '/projects',
      icon: FolderOpen,
      description: 'Manage your projects'
    },
  ]

  const adminItems = [
    {
      title: 'Analytics',
      url: '/analytics',
      icon: BarChart3,
      description: 'View reports and insights'
    },
    {
      title: 'Team Management',
      url: '/team',
      icon: Users,
      description: 'Manage team members'
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings,
      description: 'App configuration'
    },
  ]

  const handleLogout = () => {
    console.log('User logged out')
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Clock className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold">TimeTracker</h2>
            <p className="text-xs text-muted-foreground">Pro</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="ml-[7px] mr-[7px]">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Link 
                      href={item.url}
                      className={location === item.url ? 'bg-sidebar-accent' : ''}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {currentUser.role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Shield className="w-4 h-4" />
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Link 
                        href={item.url}
                        className={location === item.url ? 'bg-sidebar-accent' : ''}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Quick Stats */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Today</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hours logged</span>
                <Badge variant="secondary" data-testid="badge-hours-today">7.5h</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active projects</span>
                <Badge variant="secondary" data-testid="badge-active-projects">3</Badge>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-3">
          {/* User Profile */}
          <div className="flex items-center gap-3 p-2 bg-sidebar-accent rounded-lg group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                align="center"
                hidden={state !== "collapsed"}
              >
                {currentUser.name}
              </TooltipContent>
            </Tooltip>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            </div>
            <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'} className="text-xs group-data-[collapsible=icon]:hidden">
              {currentUser.role}
            </Badge>
          </div>

          {/* Logout Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}