import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { FolderKanban, Clock, Users, DollarSign } from 'lucide-react';
import { Project, TimeEntry, User } from '../types';
import { formatCurrency, formatMinutes } from '../lib/utils';

export default function Dashboard() {
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active');
      return data || [];
    },
  });

  const { data: timeEntries } = useQuery<TimeEntry[]>({
    queryKey: ['time-entries'],
    queryFn: async () => {
      const { data } = await supabase
        .from('time_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*');
      return data || [];
    },
  });

  const totalHours = timeEntries?.reduce((sum, entry) => sum + entry.minutes, 0) || 0;
  const avgSellingRate = (users?.reduce((sum, user) => sum + (user.base_selling_rate || 0), 0) || 0) / (users?.length || 1);
  const estimatedRevenue = (totalHours / 60) * avgSellingRate;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your project overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{projects?.length || 0}</p>
            </div>
            <FolderKanban className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{Math.round(totalHours / 60)}</p>
            </div>
            <Clock className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users?.length || 0}</p>
            </div>
            <Users className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Est. Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(estimatedRevenue)}</p>
            </div>
            <DollarSign className="h-12 w-12 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
          </div>
          <div className="p-6">
            {projects && projects.length > 0 ? (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500">{project.description || 'No description'}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {project.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No projects yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Time Entries</h2>
          </div>
          <div className="p-6">
            {timeEntries && timeEntries.length > 0 ? (
              <div className="space-y-4">
                {timeEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{entry.description || 'No description'}</p>
                      <p className="text-sm text-gray-500">{new Date(entry.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{formatMinutes(entry.minutes)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No time entries yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
