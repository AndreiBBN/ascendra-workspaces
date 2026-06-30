import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { DeveloperSidebar } from './DeveloperSidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showTimeRange?: boolean;
  variant?: 'admin' | 'developer';
}

export function AppShell({
  children,
  title,
  subtitle,
  showTimeRange,
  variant = 'admin',
}: AppShellProps) {
  const SidebarComponent = variant === 'developer' ? DeveloperSidebar : Sidebar;
  const accountLabel = variant === 'developer' ? 'Developer Account' : 'Admin Account';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <SidebarComponent />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title={title}
          subtitle={subtitle}
          showTimeRange={showTimeRange}
          accountLabel={accountLabel}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
