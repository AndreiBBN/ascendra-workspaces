import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '../components/AppShell';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge, UsageHealthBadge } from '../components/StatusBadge';
import { UsageBar } from '../components/UsageBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Search, Filter, Flame, Clock } from 'lucide-react';
import { getFleetDashboard } from '../api/workspacesApi';
import { useAsyncData } from '../hooks/useAsyncData';
import { CardSkeleton, EmptyState, ErrorState } from '../components/StateViews';
import { useTheme } from '../context/ThemeContext';

export function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { theme } = useTheme();

  const { data, loading, error, refetch } = useAsyncData(
    (forceRefresh) => getFleetDashboard(forceRefresh),
    [],
  );

  const fleetMetrics = data?.fleetMetrics;
  const vmList = data?.vms ?? [];
  const chartData = data?.utilizationTrend ?? [];

  const filteredVMs = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return vmList.filter(vm => {
      const matchesSearch = vm.name.toLowerCase().includes(query) || vm.owner.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || vm.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, vmList]);

  const hotVMs = useMemo(
    () => vmList.filter(vm => vm.status === 'running' && (vm.cpu > 85 || vm.memory > 80)).slice(0, 3),
    [vmList]
  );

  const idleVMs = useMemo(
    () => vmList.filter(vm => vm.status === 'running' && (vm.usageHealth === 'idle' || vm.usageHealth === 'underused')).slice(0, 3),
    [vmList]
  );

  const templateOptions = useMemo(
    () => [...new Set(vmList.map(vm => vm.template))].sort(),
    [vmList],
  );

  if (loading && !data) {
    return (
      <AppShell title="Fleet Overview" subtitle="Monitor workspace health, utilization, and cost.">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
          <CardSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Fleet Overview" subtitle="Monitor workspace health, utilization, and cost.">
        <ErrorState
          title="Could not load fleet data"
          description="The dashboard could not be loaded from the mock backend."
          onRetry={() => refetch(true)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Fleet Overview" subtitle="Monitor workspace health, utilization, and cost.">
      <div className="space-y-6">
        <p className="text-xs text-gray-500 dark:text-gray-400">Data source: mock API · /mock-api/workspaces.json</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total VMs"
            value={fleetMetrics?.totalVMs ?? 0}
            subtext={`${fleetMetrics?.runningVMs ?? 0} running / ${fleetMetrics?.stoppedVMs ?? 0} stopped`}
          />
          <MetricCard title="Active Users" value={fleetMetrics?.activeUsers ?? 0} />
          <MetricCard title="Avg CPU Utilization" value={`${fleetMetrics?.avgCPU ?? 0}%`} trend="up" trendValue="2%" />
          <MetricCard title="Avg Memory Utilization" value={`${fleetMetrics?.avgMemory ?? 0}%`} trend="down" trendValue="1%" />
          <MetricCard
            title="Infrastructure Cost"
            value={`$${fleetMetrics?.costPerHour ?? 0}/hr`}
            subtext={`$${(fleetMetrics?.projectedMonthlyCost ?? 0).toLocaleString()} projected monthly`}
          />
        </div>

        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fleet Utilization</CardTitle>
                <CardDescription>CPU and Memory utilization — last 24 hours</CardDescription>
              </div>
              <div className="flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#6366f1" strokeWidth="2" /></svg>
                  CPU
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" /></svg>
                  Memory
                </span>
                <span className="text-gray-400 dark:text-gray-500">{chartData[chartData.length - 1]?.runningVMs ?? 0} VMs running</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#f3f4f6'} vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke={theme === 'dark' ? '#4b5563' : '#e5e7eb'}
                  tick={{ fontSize: 11, fill: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  stroke={theme === 'dark' ? '#4b5563' : '#e5e7eb'}
                  tick={{ fontSize: 11, fill: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[30, 100]}
                  unit="%"
                  width={38}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: '1px solid',
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    padding: '8px 12px',
                    background: theme === 'dark' ? '#1f2937' : '#ffffff',
                    color: theme === 'dark' ? '#f9fafb' : '#374151',
                  }}
                  formatter={(value, name) => [`${value ?? 0}%`, String(name)]}
                  labelStyle={{ color: '#6b7280', marginBottom: 4 }}
                />
                <ReferenceLine y={80} stroke="#fca5a5" strokeDasharray="4 4" strokeWidth={1} label={{ value: '80%', position: 'right', fontSize: 10, fill: '#fca5a5' }} />
                <Line type="monotone" dataKey="cpu" name="CPU" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#6366f1' }} />
                <Line type="monotone" dataKey="memory" name="Memory" stroke="#10b981" strokeWidth={2} strokeDasharray="6 3" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" />
                <CardTitle>Hot VMs</CardTitle>
              </div>
              <CardDescription>High CPU or memory utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hotVMs.map(vm => (
                  <div key={vm.id} className="p-4 bg-red-50 border border-red-100 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-50">{vm.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{vm.owner}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={vm.status} />
                        {vm.usageHealth && <UsageHealthBadge health={vm.usageHealth} />}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <UsageBar percentage={vm.cpu} label="CPU" />
                      <UsageBar percentage={vm.memory} label="Memory" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <CardTitle>Idle / Underused VMs</CardTitle>
              </div>
              <CardDescription>Running but with very low utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {idleVMs.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No idle VMs detected</p>
                ) : (
                  idleVMs.map(vm => (
                    <div key={vm.id} className="p-4 bg-amber-50 border border-amber-100 rounded-lg dark:bg-amber-900/20 dark:border-amber-800">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-50">{vm.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{vm.owner}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={vm.status} />
                          {vm.usageHealth && <UsageHealthBadge health={vm.usageHealth} />}
                          {vm.lastActive && <span className="text-xs text-amber-700">{`Last active: ${vm.lastActive}`}</span>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <UsageBar percentage={vm.cpu} label="CPU" />
                        <UsageBar percentage={vm.memory} label="Memory" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>VM Inventory Snapshot</CardTitle>
                <CardDescription>Current workspace fleet status</CardDescription>
              </div>
              <Button variant="link" className="text-indigo-600" asChild>
                <Link to="/inventory">View full inventory →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search VMs..."
                  className="pl-9 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                  <SelectItem value="starting">Starting</SelectItem>
                  <SelectItem value="stopping">Stopping</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-48 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  {templateOptions.map(template => (
                    <SelectItem key={template} value={template}>{template}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="dark:bg-gray-800 dark:hover:bg-gray-800">
                    <TableHead className="dark:text-gray-400">VM Name</TableHead>
                    <TableHead className="dark:text-gray-400">Owner</TableHead>
                    <TableHead className="dark:text-gray-400">Template</TableHead>
                    <TableHead className="dark:text-gray-400">Status</TableHead>
                    <TableHead className="dark:text-gray-400">Usage</TableHead>
                    <TableHead className="dark:text-gray-400">CPU</TableHead>
                    <TableHead className="dark:text-gray-400">Memory</TableHead>
                    <TableHead className="dark:text-gray-400">Disk</TableHead>
                    <TableHead className="text-right dark:text-gray-400">Cost/hr</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVMs.map(vm => (
                    <TableRow key={vm.id}>
                      <TableCell className="font-medium font-mono text-sm">{vm.name}</TableCell>
                      <TableCell>{vm.owner}</TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">{vm.template}</TableCell>
                      <TableCell><StatusBadge status={vm.status} /></TableCell>
                      <TableCell>
                        {vm.usageHealth && vm.usageHealth !== 'healthy'
                          ? <UsageHealthBadge health={vm.usageHealth} />
                          : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full ${vm.cpu >= 85 ? 'bg-red-500' : vm.cpu >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${vm.cpu}%` }} />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300 w-10 tabular-nums">{vm.cpu}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full ${vm.memory >= 80 ? 'bg-red-500' : vm.memory >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${vm.memory}%` }} />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300 w-10 tabular-nums">{vm.memory}%</span>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-sm text-gray-600 dark:text-gray-300">{vm.disk}%</span></TableCell>
                      <TableCell className="text-right"><span className="text-sm font-medium tabular-nums">${vm.costPerHour.toFixed(2)}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredVMs.length === 0 && (
              <EmptyState
                title="No VMs found matching your filters"
                description="Try adjusting your search or filter criteria."
                action={searchQuery || statusFilter !== 'all' ? { label: 'Clear filters', onClick: () => { setSearchQuery(''); setStatusFilter('all'); } } : undefined}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
