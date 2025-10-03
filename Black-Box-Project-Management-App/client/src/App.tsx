import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import AppSidebar from "@/components/AppSidebar";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import AnalyticsPage from "@/pages/AnalyticsPage";
import Team from "@/pages/Team";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";

function Router() {
  // Mock user data - TODO: remove mock functionality
  const [currentUser] = useState({
    name: 'John Doe',
    email: 'john@company.com',
    role: 'admin' as const,
  });

  const isAdmin = currentUser.role === 'admin';

  return (
    <Switch>
      <Route path="/" component={() => <Dashboard />} />
      <Route path="/projects" component={() => <Projects isAdmin={isAdmin} />} />
      {isAdmin && (
        <>
          <Route path="/analytics" component={() => <AnalyticsPage isAdmin={isAdmin} />} />
          <Route path="/team" component={() => <Team />} />
          <Route path="/settings" component={() => <SettingsPage />} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Mock user data - TODO: remove mock functionality
  const currentUser = {
    name: 'John Doe',
    email: 'john@company.com',
    role: 'admin' as const,
  };

  // Custom sidebar width for time tracking application
  const sidebarStyle = {
    "--sidebar-width": "20rem",       // 320px for better content
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="timetracker-theme">
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar user={currentUser} />
              <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between p-4 border-b bg-background">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto bg-background">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
