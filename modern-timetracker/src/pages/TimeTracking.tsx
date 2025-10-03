import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Play, Square, Clock } from 'lucide-react';
import { TimeEntry } from '../types';
import { formatMinutes } from '../lib/utils';
import { format } from 'date-fns';
import { queryClient } from '../lib/queryClient';

export default function TimeTracking() {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [description, setDescription] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const { data: entries } = useQuery<TimeEntry[]>({
    queryKey: ['time-entries'],
    queryFn: async () => {
      const { data } = await supabase
        .from('time_entries')
        .select('*, projects(*), project_scopes(*)')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const createEntry = useMutation({
    mutationFn: async (minutes: number) => {
      const { data } = await supabase
        .from('time_entries')
        .insert([
          {
            user_id: 'system-user',
            project_id: 'system-project',
            scope_id: 'system-scope',
            description,
            minutes,
            entry_type: 'timer',
          },
        ])
        .select();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      setDescription('');
      setSeconds(0);
    },
  });

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      createEntry.mutate(minutes);
    }
  };

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Time Tracking</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-gray-900 mb-6">
            {formatTime(seconds)}
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            className="w-full max-w-md mx-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
          />
          {isRunning ? (
            <button
              onClick={handleStop}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Square className="h-5 w-5" />
              <span>Stop Timer</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Play className="h-5 w-5" />
              <span>Start Timer</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Time Entries</h2>
        </div>
        <div className="p-6">
          {entries && entries.length > 0 ? (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-4">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{entry.description || 'No description'}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatMinutes(entry.minutes)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No time entries yet. Start tracking your time!</p>
          )}
        </div>
      </div>
    </div>
  );
}
