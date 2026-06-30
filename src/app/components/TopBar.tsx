import { Moon, Sun, Search, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useTheme } from '../context/ThemeContext';

interface TopBarProps {
  title: string;
  subtitle?: string;
  showTimeRange?: boolean;
  accountLabel?: string;
}

export function TopBar({ title, subtitle, showTimeRange = true, accountLabel = 'Admin Account' }: TopBarProps) {
  const { theme, toggle } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search or type command..."
              className="w-72 pl-9 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500"
              aria-label="Global search"
            />
          </div>

          {showTimeRange && (
            <Select defaultValue="24h">
              <SelectTrigger className="w-32 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" aria-label="Time range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="30d">Last 30d</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="h-9 w-9 p-0 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="User menu"
              >
                <Avatar>
                  <AvatarFallback className="bg-indigo-600 text-white">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
              <DropdownMenuLabel className="dark:text-gray-200">{accountLabel}</DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:border-gray-700" />
              <DropdownMenuItem className="dark:text-gray-300 dark:focus:bg-gray-700">Settings</DropdownMenuItem>
              <DropdownMenuItem className="dark:text-gray-300 dark:focus:bg-gray-700">Billing</DropdownMenuItem>
              <DropdownMenuSeparator className="dark:border-gray-700" />
              <DropdownMenuItem className="dark:text-gray-300 dark:focus:bg-gray-700">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
