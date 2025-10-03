import { useState } from 'react'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type { ScopeTemplate, InsertScopeTemplate, UpdateScopeTemplate, AppSetting } from '@shared/schema'
import { 
  Settings as SettingsIcon, 
  Bell, 
  Mail, 
  Clock,
  Moon,
  Sun,
  Save,
  User,
  Briefcase,
  Plus,
  Edit,
  Trash2,
  FolderOpen,
  DollarSign
} from 'lucide-react'

interface SettingsProps {
  isAdmin?: boolean
}

export default function Settings({ isAdmin = false }: SettingsProps) {
  // Profile information state
  const [profileInfo, setProfileInfo] = useState({
    name: 'John Doe',
    email: 'john@company.com', 
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    phone: '',
    bio: '',
    timeZone: 'UTC-8'
  })
  
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [browserNotifications, setBrowserNotifications] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '17:00' })
  
  // Scope templates state (Admin only)
  const [newScopeName, setNewScopeName] = useState('')
  const [newScopeDescription, setNewScopeDescription] = useState('')
  const [editingScope, setEditingScope] = useState<string | null>(null)
  const [editScopeName, setEditScopeName] = useState('')
  const [editScopeDescription, setEditScopeDescription] = useState('')
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())
  
  // Currency settings state (Admin only)
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Currency options for admin settings
  const currencyOptions = [
    { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
    { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
    { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
    { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' },
    { value: 'CHF', label: 'Swiss Franc (CHF)', symbol: 'CHF' },
    { value: 'SEK', label: 'Swedish Krona (kr)', symbol: 'kr' },
    { value: 'NOK', label: 'Norwegian Krone (kr)', symbol: 'kr' },
    { value: 'DKK', label: 'Danish Krone (kr)', symbol: 'kr' },
  ]

  // Fetch scope templates
  const { data: scopeTemplates = [], isLoading: templatesLoading } = useQuery<ScopeTemplate[]>({
    queryKey: ['/api/scope-templates'],
    enabled: isAdmin
  })

  // Fetch default currency setting
  const { data: currencySetting, isLoading: currencyLoading } = useQuery<AppSetting>({
    queryKey: ['/api/settings/default_currency'],
    enabled: isAdmin
  })

  // Update local state when currency setting is loaded
  React.useEffect(() => {
    if (currencySetting) {
      setDefaultCurrency(currencySetting.value)
    }
  }, [currencySetting])

  // Create scope template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: InsertScopeTemplate) => {
      const response = await fetch('/api/scope-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      })
      if (!response.ok) throw new Error('Failed to create scope template')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scope-templates'] })
      toast({ title: 'Success', description: 'Scope template created successfully' })
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create scope template', variant: 'destructive' })
    }
  })

  // Update scope template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateScopeTemplate }) => {
      const response = await fetch(`/api/scope-templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error('Failed to update scope template')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scope-templates'] })
      toast({ title: 'Success', description: 'Scope template updated successfully' })
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to update scope template', variant: 'destructive' })
    }
  })

  // Delete scope template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/scope-templates/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete scope template')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scope-templates'] })
      toast({ title: 'Success', description: 'Scope template deleted successfully' })
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to delete scope template', variant: 'destructive' })
    }
  })

  // Bulk update mutation for multi-selection
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: { id: string; isActive: boolean }[]) => {
      const response = await fetch('/api/scope-templates/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })
      if (!response.ok) throw new Error('Failed to bulk update scope templates')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scope-templates'] })
      toast({ title: 'Success', description: 'Scope templates updated successfully' })
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to update scope templates', variant: 'destructive' })
    }
  })

  // Currency update mutation
  const updateCurrencyMutation = useMutation({
    mutationFn: async (currency: string) => {
      const response = await fetch('/api/settings/default_currency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: currency,
          description: 'Default currency for all financial calculations and reports',
          updatedBy: 'admin-user-id' // TODO: get from auth context
        })
      })
      if (!response.ok) throw new Error('Failed to update currency setting')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/default_currency'] })
      toast({ title: 'Success', description: 'Default currency updated successfully' })
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to update currency setting', variant: 'destructive' })
    }
  })

  const handleSave = () => {
    console.log('Settings saved')
  }

  const handleExportData = () => {
    console.log('Exporting data')
  }

  // Scope template handlers (Admin only)
  const handleAddScopeTemplate = () => {
    if (newScopeName.trim()) {
      createTemplateMutation.mutate({
        name: newScopeName,
        description: newScopeDescription,
        isActive: true
      })
      setNewScopeName('')
      setNewScopeDescription('')
    }
  }

  const handleEditScope = (scope: ScopeTemplate) => {
    setEditingScope(scope.id)
    setEditScopeName(scope.name)
    setEditScopeDescription(scope.description || '')
  }

  const handleSaveEdit = () => {
    if (editingScope) {
      updateTemplateMutation.mutate({
        id: editingScope,
        updates: {
          name: editScopeName,
          description: editScopeDescription
        }
      })
      setEditingScope(null)
      setEditScopeName('')
      setEditScopeDescription('')
    }
  }

  const handleCancelEdit = () => {
    setEditingScope(null)
    setEditScopeName('')
    setEditScopeDescription('')
  }

  const handleToggleScope = (id: string) => {
    const scope = scopeTemplates.find(s => s.id === id)
    if (scope) {
      updateTemplateMutation.mutate({
        id,
        updates: { isActive: !scope.isActive }
      })
    }
  }

  const handleDeleteScope = (id: string) => {
    deleteTemplateMutation.mutate(id)
  }

  // Multi-selection handlers
  const handleSelectAll = () => {
    if (selectedTemplates.size === scopeTemplates.length) {
      setSelectedTemplates(new Set())
    } else {
      setSelectedTemplates(new Set(scopeTemplates.map(t => t.id)))
    }
  }

  const handleSelectTemplate = (id: string) => {
    const newSelected = new Set(selectedTemplates)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedTemplates(newSelected)
  }

  const handleBulkActivate = () => {
    const updates = Array.from(selectedTemplates).map(id => ({ id, isActive: true }))
    bulkUpdateMutation.mutate(updates)
    setSelectedTemplates(new Set())
  }

  const handleBulkDeactivate = () => {
    const updates = Array.from(selectedTemplates).map(id => ({ id, isActive: false }))
    bulkUpdateMutation.mutate(updates)
    setSelectedTemplates(new Set())
  }

  const handleBulkDelete = () => {
    Promise.all(Array.from(selectedTemplates).map(id => deleteTemplateMutation.mutateAsync(id)))
      .then(() => {
        setSelectedTemplates(new Set())
        toast({ title: 'Success', description: 'Selected templates deleted successfully' })
      })
      .catch(() => {
        toast({ title: 'Error', description: 'Failed to delete some templates', variant: 'destructive' })
      })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and configurations</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data" data-testid="tab-data">Data & Export</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="project-management" data-testid="tab-project-management">Project Management</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={profileInfo.name}
                    onChange={(e) => setProfileInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    data-testid="input-profile-name"
                  />
                </div>
                <div>
                  <Label htmlFor="profile-email">Email Address</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profileInfo.email}
                    onChange={(e) => setProfileInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    data-testid="input-profile-email"
                  />
                </div>
              </div>

              <Separator />

              {/* Professional Info */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Professional Details
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profile-job-title">Job Title</Label>
                    <Input
                      id="profile-job-title"
                      value={profileInfo.jobTitle}
                      onChange={(e) => setProfileInfo(prev => ({ ...prev, jobTitle: e.target.value }))}
                      placeholder="Enter your job title"
                      data-testid="input-profile-job-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-department">Department</Label>
                    <Input
                      id="profile-department"
                      value={profileInfo.department}
                      onChange={(e) => setProfileInfo(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Enter your department"
                      data-testid="input-profile-department"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profile-phone">Phone Number</Label>
                  <Input
                    id="profile-phone"
                    type="tel"
                    value={profileInfo.phone}
                    onChange={(e) => setProfileInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    data-testid="input-profile-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="profile-timezone">Time Zone</Label>
                  <Select
                    value={profileInfo.timeZone}
                    onValueChange={(value) => setProfileInfo(prev => ({ ...prev, timeZone: value }))}
                  >
                    <SelectTrigger data-testid="select-profile-timezone">
                      <SelectValue placeholder="Select time zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-12">UTC-12 (Baker Island)</SelectItem>
                      <SelectItem value="UTC-11">UTC-11 (Hawaii)</SelectItem>
                      <SelectItem value="UTC-10">UTC-10 (Alaska)</SelectItem>
                      <SelectItem value="UTC-9">UTC-9 (Pacific)</SelectItem>
                      <SelectItem value="UTC-8">UTC-8 (Pacific)</SelectItem>
                      <SelectItem value="UTC-7">UTC-7 (Mountain)</SelectItem>
                      <SelectItem value="UTC-6">UTC-6 (Central)</SelectItem>
                      <SelectItem value="UTC-5">UTC-5 (Eastern)</SelectItem>
                      <SelectItem value="UTC-4">UTC-4 (Atlantic)</SelectItem>
                      <SelectItem value="UTC-3">UTC-3 (Argentina)</SelectItem>
                      <SelectItem value="UTC-2">UTC-2 (Mid-Atlantic)</SelectItem>
                      <SelectItem value="UTC-1">UTC-1 (Azores)</SelectItem>
                      <SelectItem value="UTC+0">UTC+0 (London)</SelectItem>
                      <SelectItem value="UTC+1">UTC+1 (Berlin)</SelectItem>
                      <SelectItem value="UTC+2">UTC+2 (Cairo)</SelectItem>
                      <SelectItem value="UTC+3">UTC+3 (Moscow)</SelectItem>
                      <SelectItem value="UTC+4">UTC+4 (Dubai)</SelectItem>
                      <SelectItem value="UTC+5">UTC+5 (Karachi)</SelectItem>
                      <SelectItem value="UTC+6">UTC+6 (Dhaka)</SelectItem>
                      <SelectItem value="UTC+7">UTC+7 (Bangkok)</SelectItem>
                      <SelectItem value="UTC+8">UTC+8 (Beijing)</SelectItem>
                      <SelectItem value="UTC+9">UTC+9 (Tokyo)</SelectItem>
                      <SelectItem value="UTC+10">UTC+10 (Sydney)</SelectItem>
                      <SelectItem value="UTC+11">UTC+11 (Solomon Islands)</SelectItem>
                      <SelectItem value="UTC+12">UTC+12 (Auckland)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Bio */}
              <div>
                <Label htmlFor="profile-bio">Bio</Label>
                <Textarea
                  id="profile-bio"
                  value={profileInfo.bio}
                  onChange={(e) => setProfileInfo(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  data-testid="input-profile-bio"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  A brief description about yourself (optional)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                General Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                </div>
                <div className="flex items-center gap-2">
                  {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <Switch
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                    data-testid="switch-dark-mode"
                  />
                </div>
              </div>

              <Separator />

              {/* Working Hours */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Working Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={workingHours.start}
                      onChange={(e) => setWorkingHours(prev => ({ ...prev, start: e.target.value }))}
                      data-testid="input-start-time"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={workingHours.end}
                      onChange={(e) => setWorkingHours(prev => ({ ...prev, end: e.target.value }))}
                      data-testid="input-end-time"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Used for reporting and time tracking analytics
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email for important updates
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  data-testid="switch-email-notifications"
                />
              </div>

              <Separator />

              {/* Browser Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Browser Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show desktop notifications for time tracking reminders
                  </p>
                </div>
                <Switch
                  checked={browserNotifications}
                  onCheckedChange={setBrowserNotifications}
                  data-testid="switch-browser-notifications"
                />
              </div>

              <Separator />

              {/* Notification Types */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Notification Types</Label>
                <div className="space-y-3">
                  {[
                    'Project deadlines approaching',
                    'Cost threshold exceeded',
                    'Weekly time reports',
                    'Team member invitations',
                    'Project completion updates'
                  ].map((type, index) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm">{type}</span>
                      <Switch defaultChecked={index < 3} data-testid={`switch-notification-${index}`} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export Options */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Export Data</Label>
                <p className="text-sm text-muted-foreground">
                  Export your time tracking data for external analysis
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" onClick={handleExportData} data-testid="button-export-csv">
                    Export as CSV
                  </Button>
                  <Button variant="outline" onClick={handleExportData} data-testid="button-export-pdf">
                    Export as PDF Report
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Data Retention */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Data Retention</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">Time Entries</span>
                      <p className="text-sm text-muted-foreground">Keep forever</p>
                    </div>
                    <Badge variant="secondary">Unlimited</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">Project Data</span>
                      <p className="text-sm text-muted-foreground">Keep forever</p>
                    </div>
                    <Badge variant="secondary">Unlimited</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">Analytics</span>
                      <p className="text-sm text-muted-foreground">Last 12 months</p>
                    </div>
                    <Badge variant="secondary">12 months</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Management Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="project-management" className="space-y-6">
            {/* Default Currency Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Default Currency
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Set the default currency for all financial calculations and reports
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="default-currency">Currency</Label>
                    <Select value={defaultCurrency} onValueChange={(value) => {
                      setDefaultCurrency(value)
                      updateCurrencyMutation.mutate(value)
                    }}>
                      <SelectTrigger data-testid="select-default-currency">
                        <SelectValue placeholder="Select default currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Current symbol:</span>
                        <Badge variant="secondary" className="font-mono" data-testid="badge-currency-symbol">
                          {currencyOptions.find(c => c.value === defaultCurrency)?.symbol || '$'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Note:</strong> This setting affects all cost calculations, analytics reports, and PDF exports. 
                      Changing the currency will not convert existing rates - you'll need to update individual teammate rates manually.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Pre-defined Project Scopes
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage standardized scope templates that can be used across projects
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Scope Template */}
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <Label className="text-base font-medium">Add New Scope Template</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-scope-name">Scope Name</Label>
                      <Input
                        id="new-scope-name"
                        value={newScopeName}
                        onChange={(e) => setNewScopeName(e.target.value)}
                        placeholder="e.g., Frontend Development"
                        data-testid="input-new-scope-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-scope-description">Description</Label>
                      <Input
                        id="new-scope-description"
                        value={newScopeDescription}
                        onChange={(e) => setNewScopeDescription(e.target.value)}
                        placeholder="Brief description of the scope"
                        data-testid="input-new-scope-description"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddScopeTemplate}
                    disabled={!newScopeName.trim()}
                    data-testid="button-add-scope-template"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Scope Template
                  </Button>
                </div>

                <Separator />

                {/* Existing Scope Templates */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Existing Scope Templates</Label>
                    {scopeTemplates.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSelectAll}
                          data-testid="button-select-all-templates"
                        >
                          {selectedTemplates.size === scopeTemplates.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        {selectedTemplates.size > 0 && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleBulkActivate}
                              disabled={bulkUpdateMutation.isPending}
                              data-testid="button-bulk-activate"
                            >
                              Activate Selected ({selectedTemplates.size})
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleBulkDeactivate}
                              disabled={bulkUpdateMutation.isPending}
                              data-testid="button-bulk-deactivate"
                            >
                              Deactivate Selected ({selectedTemplates.size})
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={handleBulkDelete}
                              disabled={deleteTemplateMutation.isPending}
                              data-testid="button-bulk-delete"
                            >
                              Delete Selected ({selectedTemplates.size})
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {templatesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading scope templates...
                    </div>
                  ) : scopeTemplates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No scope templates defined yet. Add your first template above.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {scopeTemplates.map((scope) => (
                        <div key={scope.id} className="flex items-center gap-3 p-4 bg-card border rounded-lg" data-testid={`scope-template-${scope.id}`}>
                          <Checkbox
                            checked={selectedTemplates.has(scope.id)}
                            onCheckedChange={() => handleSelectTemplate(scope.id)}
                            data-testid={`checkbox-select-template-${scope.id}`}
                          />
                          <div className="flex-1">
                            {editingScope === scope.id ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <Input
                                    value={editScopeName}
                                    onChange={(e) => setEditScopeName(e.target.value)}
                                    placeholder="Scope name"
                                    data-testid={`input-edit-scope-name-${scope.id}`}
                                  />
                                  <Input
                                    value={editScopeDescription}
                                    onChange={(e) => setEditScopeDescription(e.target.value)}
                                    placeholder="Description"
                                    data-testid={`input-edit-scope-description-${scope.id}`}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    data-testid={`button-save-edit-${scope.id}`}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    data-testid={`button-cancel-edit-${scope.id}`}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-medium">{scope.name}</h4>
                                  <Badge variant={scope.isActive ? 'default' : 'secondary'}>
                                    {scope.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{scope.description}</p>
                              </div>
                            )}
                          </div>
                          
                          {editingScope !== scope.id && (
                            <div className="flex items-center gap-2 ml-4">
                              <Switch
                                checked={scope.isActive}
                                onCheckedChange={() => handleToggleScope(scope.id)}
                                data-testid={`switch-scope-active-${scope.id}`}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditScope(scope)}
                                data-testid={`button-edit-scope-${scope.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteScope(scope.id)}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-delete-scope-${scope.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  <strong>Note:</strong> These scope templates will be available for selection when creating new projects. 
                  Only active templates will appear in the project creation form.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} data-testid="button-save-settings">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}