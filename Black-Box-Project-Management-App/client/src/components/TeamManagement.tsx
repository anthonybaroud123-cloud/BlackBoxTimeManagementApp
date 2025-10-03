import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { queryClient } from '@/lib/queryClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { 
  UserPlus, 
  Mail, 
  Edit, 
  Trash2, 
  DollarSign, 
  Clock,
  Shield,
  User
} from 'lucide-react'
import type { User as DBUser, InsertUser, UpdateUser, AppSetting } from '@shared/schema'
import { insertUserSchema as baseInsertUserSchema, updateUserSchema as baseUpdateUserSchema } from '@shared/schema'

// Extend shared schemas with UI-specific validation
const inviteUserSchema = baseInsertUserSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'regular']).default('regular')
})

const editUserSchema = baseUpdateUserSchema.extend({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  baseCostRate: z.string().min(1, 'Cost rate is required').transform(val => parseFloat(val))
})

type InviteUserForm = z.infer<typeof inviteUserSchema>
type UpdateUserForm = z.infer<typeof editUserSchema>

export default function TeamManagement() {
  const { toast } = useToast()
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<DBUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<DBUser | null>(null)

  // Fetch users from API
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['/api/users'],
    select: (data: any[]) => data.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt)
    })) as DBUser[]
  })

  // Fetch time entries to calculate total hours per user
  const { data: timeEntries = [] } = useQuery({
    queryKey: ['/api/time-entries'],
    select: (data: any[]) => data || []
  })

  // Fetch currency setting
  const { data: currencySetting } = useQuery<AppSetting>({
    queryKey: ['/api/settings/default_currency']
  })

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    const currency = currencySetting?.value || 'USD'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  // Form for inviting new users
  const inviteForm = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      name: '',
      email: '',
      username: '',
      password: '',
      role: 'regular'
    }
  })

  // Form for editing users
  const editForm = useForm<UpdateUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: '',
      email: '',
      username: '',
      role: 'regular'
    }
  })

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: InviteUserForm) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      if (!response.ok) throw new Error('Failed to create user')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] })
      setShowInviteDialog(false)
      inviteForm.reset()
      toast({
        title: "Success",
        description: "User invited successfully"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to invite user",
        variant: "destructive"
      })
    }
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: UpdateUserForm & { id: string }) => {
      const { id, ...updates } = userData
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error('Failed to update user')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] })
      setShowEditDialog(false)
      setEditingUser(null)
      editForm.reset()
      toast({
        title: "Success",
        description: "User updated successfully"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      })
    }
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete user')
      // 204 No Content response, no JSON to parse
      return null
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] })
      setShowDeleteDialog(false)
      setDeletingUser(null)
      toast({
        title: "Success",
        description: "User removed successfully"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      })
    }
  })

  const handleInviteUser = (data: InviteUserForm) => {
    createUserMutation.mutate(data)
  }

  const handleEditUser = (user: DBUser) => {
    setEditingUser(user)
    editForm.reset({
      name: user.name,
      email: user.email || '',
      username: user.username,
      role: user.role as 'admin' | 'regular',
      baseCostRate: String(user.baseCostRate || '75')
    })
    setShowEditDialog(true)
  }

  const handleUpdateUser = (data: UpdateUserForm) => {
    if (!editingUser) return
    updateUserMutation.mutate({ ...data, id: editingUser.id })
  }

  const handleDeleteUser = (user: DBUser) => {
    setDeletingUser(user)
    setShowDeleteDialog(true)
  }

  const confirmDeleteUser = () => {
    if (!deletingUser) return
    deleteUserMutation.mutate(deletingUser.id)
  }

  // Calculate total hours for a user
  const getUserTotalHours = (userId: string): number => {
    return timeEntries
      .filter((entry: any) => entry.createdById === userId)
      .reduce((total: number, entry: any) => total + entry.minutes, 0) / 60 // Convert minutes to hours
  }

  const getStatusBadge = (user: DBUser) => {
    // For simplicity, all real users are considered active
    return <Badge className="bg-green-500 text-white">Active</Badge>
  }

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="default" className="flex items-center gap-1">
        <Shield className="w-3 h-3" />
        Admin
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <User className="w-3 h-3" />
        User
      </Badge>
    )
  }

  if (usersError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">Manage team members and their permissions</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load team members. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage team members and their permissions</p>
        </div>
        
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-invite-member">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <Form {...inviteForm}>
              <form onSubmit={inviteForm.handleSubmit(handleInviteUser)} className="space-y-4">
                <FormField
                  control={inviteForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          data-testid="input-invite-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="colleague@company.com"
                          data-testid="input-invite-email"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="johndoe"
                          data-testid="input-invite-username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temporary Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter temporary password"
                          data-testid="input-invite-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-invite-role">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="regular">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={createUserMutation.isPending}
                    data-testid="button-send-invite"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setShowInviteDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-total-members">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-members">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-hours">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">
                  {Math.round(users.reduce((acc, user) => acc + getUserTotalHours(user.id), 0))}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading team members...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Cost Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} data-testid={`row-member-${user.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email || 'No email'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {Math.round(getUserTotalHours(user.id))}h
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        {formatCurrency(Number(user.baseCostRate || 75))}/hr
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditUser(user)}
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user)}
                          data-testid={`button-remove-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-member-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          data-testid="input-member-email"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-member-username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-member-role">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="regular">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="baseCostRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Rate ({currencySetting?.value || 'USD'}/hr)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="75.00"
                          data-testid="input-member-cost-rate"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={updateUserMutation.isPending}
                    data-testid="button-save-member"
                  >
                    {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setShowEditDialog(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingUser?.name} from the team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}