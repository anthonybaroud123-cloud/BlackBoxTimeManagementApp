import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { BarChart3 } from 'lucide-react';
import { TimeEntry } from '../types';
import { formatMinutes, formatCurrency } from '../lib/utils';

export default function Analytics() {
  const { data: entries } = useQuery<TimeEntry[]>({
    queryKey: ['time-entries'],
    queryFn: async () => {
      const { data } = await supabase
        .from('time_entries')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const totalMinutes = entries?.reduce((sum, entry) => sum + entry.minutes, 0) || 0;
  const totalHours = totalMinutes / 60;
  const avgRate = 125;
  const estimatedRevenue = totalHours * avgRate;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">View insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Time Tracked</p>
          <p className="text-3xl font-bold text-gray-900">{formatMinutes(totalMinutes)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Time Entries</p>
          <p className="text-3xl font-bold text-gray-900">{entries?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Est. Revenue</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(estimatedRevenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Detailed analytics charts coming soon</p>
      </div>
    </div>
  );
}
