import { QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Link, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { Clock, ChartBar as BarChart3, Users, FolderKanban, Hop as Home } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import TimeTracking from './pages/TimeTracking';
import Team from './pages/Team';
import Analytics from './pages/Analytics';

function App() {
  const [location] = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">TimeTracker Pro</h1>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
                <p className="text-xs text-gray-500 truncate">john@company.com</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/projects" component={Projects} />
            <Route path="/time-tracking" component={TimeTracking} />
            <Route path="/team" component={Team} />
            <Route path="/analytics" component={Analytics} />
          </Switch>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
