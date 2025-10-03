import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Mail } from 'lucide-react';
import { User } from '../types';
import { formatCurrency } from '../lib/utils';

export default function Team() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-600 mt-1">Manage your team members and their rates</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading team members...</p>
        </div>
      ) : users && users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-lg font-medium text-blue-600">
                    {user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 truncate">{user.name}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="h-4 w-4 mr-1" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Cost Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(user.base_cost_rate)}/hr
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Selling Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(user.base_selling_rate)}/hr
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No team members yet.</p>
        </div>
      )}
    </div>
  );
}
