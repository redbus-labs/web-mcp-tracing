import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, List, Users, Network, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from './AppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Overview', path: '/', icon: Activity },
  { name: 'Executions', path: '/executions', icon: List },
  { name: 'Sessions', path: '/sessions', icon: Users },
  { name: 'API Traces', path: '/traces', icon: Network },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function AppShell() {
  const { apps, selectedApp, setSelectedApp, dateRange, setDateRange } = useAppContext();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Sidebar */}
      <aside 
        className={`${
          isCollapsed ? 'w-16' : 'w-64'
        } border-r bg-muted/20 flex flex-col transition-all duration-300 ease-in-out relative`}
      >
        <div className="h-14 flex items-center justify-center px-4 border-b font-semibold tracking-tight overflow-hidden">
          {isCollapsed ? 'W' : 'WebMCP Tracing'}
        </div>
        
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b flex items-center justify-between px-6 bg-background z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">App:</span>
              <Select value={selectedApp} onValueChange={setSelectedApp}>
                <SelectTrigger className="w-[200px] h-8">
                  <SelectValue placeholder="Select App" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Apps</SelectItem>
                  {apps.map((app) => (
                    <SelectItem key={app} value={app}>
                      {app}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Time:</span>
              <Select value={dateRange} onValueChange={(val: any) => setDateRange(val)}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Mock User Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-muted/10">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}