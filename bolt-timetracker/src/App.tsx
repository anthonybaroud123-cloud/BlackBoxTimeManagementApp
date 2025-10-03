import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Clock, BarChart3, Users, FolderKanban } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import TimeTracking from './pages/TimeTracking';
import Team from './pages/Team';
import Analytics from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">TimeTracker Pro</span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium text-gray-900"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/projects"
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    <FolderKanban className="h-4 w-4 mr-1" />
                    Projects
                  </Link>
                  <Link
                    to="/time-tracking"
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Time Tracking
                  </Link>
                  <Link
                    to="/team"
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Team
                  </Link>
                  <Link
                    to="/analytics"
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/time-tracking" element={<TimeTracking />} />
            <Route path="/team" element={<Team />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
