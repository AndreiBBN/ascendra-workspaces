import { Link, useLocation } from 'react-router';
import { LayoutDashboard, Server, FileCode, Lock } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'VM Inventory', href: '/inventory', icon: Server },
  { name: 'Templates', href: '/templates', icon: FileCode },
  { name: 'Policies', href: '/policies', icon: Lock, disabled: true },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">A</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-50 text-sm">Ascendra</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Workspaces</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-0.5" aria-label="Main navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.disabled ? '#' : item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={item.disabled}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                item.disabled
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
              {item.disabled && (
                <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wide">Soon</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">Admin Console</p>
        <Link
          to="/developer"
          className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          Switch to Developer Dashboard
        </Link>
      </div>
    </div>
  );
}
