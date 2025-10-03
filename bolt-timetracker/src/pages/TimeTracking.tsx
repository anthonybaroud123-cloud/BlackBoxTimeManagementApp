import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { Play, Square, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TimeEntry {
  id: number;
  project_id: number;
  user_id: number;
  description: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  projects?: { name: string };
}

export default function TimeTracking() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    loadEntries();
    checkActiveEntry();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeEntry) {
      interval = setInterval(() => {
        const start = new Date(activeEntry.start_time).getTime();
        const now = Date.now();
        setTimer(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  async function loadEntries() {
    const { data } = await supabase
      .from('time_entries')
      .select('*, projects(name)')
      .order('start_time', { ascending: false })
      .limit(10);

    if (data) {
      setEntries(data);
    }
  }

  async function checkActiveEntry() {
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .is('end_time', null)
      .maybeSingle();

    if (data) {
      setActiveEntry(data);
    }
  }

  async function startTimer() {
    const description = prompt('What are you working on?');
    if (!description) return;

    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('status', 'active')
      .limit(1);

    if (!projects || projects.length === 0) {
      alert('Please create a project first');
      return;
    }

    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (!users || users.length === 0) {
      alert('No user found');
      return;
    }

    const { data } = await supabase
      .from('time_entries')
      .insert([
        {
          project_id: projects[0].id,
          user_id: users[0].id,
          description,
          start_time: new Date().toISOString(),
          duration: 0,
        },
      ])
      .select()
      .single();

    if (data) {
      setActiveEntry(data);
      loadEntries();
    }
  }

  async function stopTimer() {
    if (!activeEntry) return;

    const endTime = new Date();
    const startTime = new Date(activeEntry.start_time);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);

    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: endTime.toISOString(),
        duration,
      })
      .eq('id', activeEntry.id);

    if (!error) {
      setActiveEntry(null);
      setTimer(0);
      loadEntries();
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Time Tracking</h1>

        <Card className="mb-8">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="text-6xl font-mono font-bold mb-6">
                {formatTime(timer)}
              </div>
              {activeEntry ? (
                <div>
                  <p className="text-lg text-gray-600 mb-4">{activeEntry.description}</p>
                  <Button variant="destructive" size="lg" onClick={stopTimer}>
                    <Square className="h-5 w-5 mr-2" />
                    Stop Timer
                  </Button>
                </div>
              ) : (
                <Button size="lg" onClick={startTimer}>
                  <Play className="h-5 w-5 mr-2" />
                  Start Timer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-gray-500">No time entries yet. Start tracking your time!</p>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-gray-500">
                          {entry.projects?.name || 'Unknown Project'} •{' '}
                          {format(new Date(entry.start_time), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{entry.duration ? `${entry.duration}m` : 'Active'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
