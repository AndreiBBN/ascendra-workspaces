import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Search,
  X,
  ExternalLink,
  ChevronRight,
  Server,
  Power,
  PowerOff,
  RotateCcw,
  Monitor,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { Card, CardContent } from '../components/ui/card';
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
import { TableSkeleton, EmptyState, ErrorState, InProgressIndicator } from '../components/StateViews';
import {
  getDeveloperDashboard,
  getIdeUrl,
  updateVMStatus,
  type VM,
  type VMStatus,
  type VMTemplate,
  type VMUsagePoint,
} from '../api/workspacesApi';
import { useAsyncData } from '../hooks/useAsyncData';
import { useTheme } from '../context/ThemeContext';

type SortOption = 'name' | 'status' | 'cpu' | 'memory' | 'lastActive';

const STATUS_ORDER: Record<VMStatus, number> = {
  running: 0,
  starting: 1,
  stopping: 2,
  stopped: 3,
  error: 4,
};

function UsageMini({ value, status }: { value: number; status: VMStatus }) {
  if (status === 'stopped' || status === 'error') {
    return <span className="text-sm text-gray-300 dark:text-gray-600">—</span>;
  }
  const color =
    value >= 85 ? 'bg-red-500' :
    value >= 70 ? 'bg-amber-500' :
    value < 15 ? 'bg-amber-300' :
    'bg-blue-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums w-9">{value}%</span>
    </div>
  );
}

function formatUptime(vm: VM): string {
  if (vm.status === 'stopped' || vm.status === 'error') return '—';
  if (vm.status === 'starting' || vm.status === 'stopping') return 'Starting up…';
  return vm.startedDate ? `Since ${vm.startedDate}` : '—';
}

function sortVMs(vms: VM[], sortBy: SortOption): VM[] {
  const sorted = [...vms];
  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'status':
        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      case 'cpu':
        return b.cpu - a.cpu;
      case 'memory':
        return b.memory - a.memory;
      case 'lastActive':
        return a.lastActive.localeCompare(b.lastActive);
      default:
        return 0;
    }
  });
  return sorted;
}

function UsageHistoryChart({
  data,
  dataKey,
  name,
  color,
  height = 160,
}: {
  data: VMUsagePoint[];
  dataKey: 'cpuPercent' | 'memoryPercent';
  name: string;
  color: string;
  height?: number;
}) {
  const { theme } = useTheme();

  if (data.length === 0) {
    return (
      <p className="text-xs text-gray-400 dark:text-gray-500 py-6 text-center">No history available</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#f3f4f6'} vertical={false} />
        <XAxis
          dataKey="timestamp"
          stroke={theme === 'dark' ? '#4b5563' : '#e5e7eb'}
          tick={{ fontSize: 10, fill: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke={theme === 'dark' ? '#4b5563' : '#e5e7eb'}
          tick={{ fontSize: 10, fill: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          unit="%"
          width={32}
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
          formatter={(value) => [`${value ?? 0}%`, name]}
          labelStyle={{ color: '#6b7280', marginBottom: 4 }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface DeveloperVMDrawerProps {
  vm: VM;
  template?: VMTemplate;
  usageHistory: VMUsagePoint[];
  onClose: () => void;
  onAction: (vmId: string, action: 'start' | 'stop' | 'restart') => void;
  onOpenIde: (vm: VM) => void;
  transitioningIds: Set<string>;
}

function DeveloperVMDrawer({
  vm,
  template,
  usageHistory,
  onClose,
  onAction,
  onOpenIde,
  transitioningIds,
}: DeveloperVMDrawerProps) {
  const isTransitioning = transitioningIds.has(vm.id);
  const canStart = vm.status === 'stopped' && !isTransitioning;
  const canStop = vm.status === 'running' && !isTransitioning;
  const canRestart = (vm.status === 'running' || vm.status === 'error') && !isTransitioning;
  const canOpenIde = vm.status === 'running' && !isTransitioning;

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-y-auto md:relative md:inset-auto md:w-96 md:max-w-none md:flex-shrink-0"
      role="dialog"
      aria-label={`Machine details: ${vm.name}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <Server className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 font-mono truncate">{vm.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={onClose}
          aria-label="Close drawer"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-5 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={vm.status} />
          {isTransitioning && (
            <InProgressIndicator label={
              vm.status === 'starting' ? 'Starting…' :
              vm.status === 'stopping' ? 'Stopping…' : 'Processing…'
            } />
          )}
        </div>

        {canOpenIde && (
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500"
            onClick={() => onOpenIde(vm)}
            aria-label={`Open ${vm.name} in IDE`}
          >
            <ExternalLink className="w-4 h-4" />
            Open in IDE
          </Button>
        )}

        <section>
          <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">CPU usage — last 6 hours</h3>
          <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-2">
            <UsageHistoryChart data={usageHistory} dataKey="cpuPercent" name="CPU" color="#6366f1" />
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Memory usage — last 6 hours</h3>
          <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-2">
            <UsageHistoryChart data={usageHistory} dataKey="memoryPercent" name="Memory" color="#10b981" />
          </div>
        </section>

        {template && (
          <section>
            <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Template</h3>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{template.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
          </section>
        )}

        <section>
          <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Specs</h3>
          <dl className="space-y-2 text-sm">
            {([
              ['vCPU', template ? String(template.vcpu) : '—'],
              ['Memory', template ? `${template.memoryGB} GB` : '—'],
              ['Disk', template ? `${template.diskGB} GB` : '—'],
              ['Base image', template?.baseImage ?? '—'],
              ['Tools', template?.tools.join(', ') ?? '—'],
            ] as [string, string][]).map(([label, val]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0">{label}</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium text-right">{val}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Metadata</h3>
          <dl className="space-y-2 text-sm">
            {([
              ['Region', vm.region],
              ['Created', vm.createdDate],
              ['Last active', vm.lastActive],
              ['Started at', vm.startedDate || '—'],
              ['Uptime', formatUptime(vm)],
              ['Cost/hr', `$${vm.costPerHour.toFixed(2)}`],
            ] as [string, string][]).map(([label, val]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0">{label}</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium text-right">{val}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {vm.status === 'running' ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
              onClick={() => onAction(vm.id, 'stop')}
              disabled={!canStop}
              aria-label="Stop machine"
            >
              <PowerOff className="w-3.5 h-3.5" />
              Stop
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
              onClick={() => onAction(vm.id, 'start')}
              disabled={!canStart}
              aria-label="Start machine"
            >
              <Power className="w-3.5 h-3.5" />
              Start
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
            onClick={() => onAction(vm.id, 'restart')}
            disabled={!canRestart}
            aria-label="Restart machine"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {vm.status === 'error' ? 'Recover' : 'Restart'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MachineRowActionsProps {
  vm: VM;
  isTransitioning: boolean;
  onOpenIde: (vm: VM) => void;
  onAction: (vmId: string, action: 'start' | 'stop' | 'restart') => void;
  onDetails: () => void;
  isDrawerOpen: boolean;
}

function MachineRowActions({
  vm,
  isTransitioning,
  onOpenIde,
  onAction,
  onDetails,
  isDrawerOpen,
}: MachineRowActionsProps) {
  const canOpenIde = vm.status === 'running' && !isTransitioning;
  const canStart = vm.status === 'stopped' && !isTransitioning;
  const canStop = vm.status === 'running' && !isTransitioning;
  const canRestart = (vm.status === 'running' || vm.status === 'error') && !isTransitioning;
  const inProgress = vm.status === 'starting' || vm.status === 'stopping' || isTransitioning;

  if (inProgress) {
    return <InProgressIndicator label={vm.status === 'starting' ? 'Starting…' : 'Stopping…'} />;
  }

  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs gap-1 dark:border-gray-600 dark:text-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
        onClick={() => onOpenIde(vm)}
        disabled={!canOpenIde}
        aria-label={`Open ${vm.name} in IDE`}
      >
        <ExternalLink className="w-3 h-3" />
        <span className="hidden lg:inline">Open IDE</span>
      </Button>
      {canStart && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 dark:border-gray-600 dark:text-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={() => onAction(vm.id, 'start')}
          aria-label={`Start ${vm.name}`}
        >
          <Power className="w-3.5 h-3.5" />
        </Button>
      )}
      {canStop && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 dark:border-gray-600 dark:text-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={() => onAction(vm.id, 'stop')}
          aria-label={`Stop ${vm.name}`}
        >
          <PowerOff className="w-3.5 h-3.5" />
        </Button>
      )}
      {canRestart && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 dark:border-gray-600 dark:text-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={() => onAction(vm.id, 'restart')}
          aria-label={`Restart ${vm.name}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-gray-500 dark:text-gray-400 text-xs gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500"
        onClick={onDetails}
        aria-label={`View details for ${vm.name}`}
        aria-expanded={isDrawerOpen}
      >
        <ChevronRight className="w-3.5 h-3.5" />
        Details
      </Button>
    </div>
  );
}

export function DeveloperDashboard() {
  const { data, loading, error, refetch } = useAsyncData(
    (forceRefresh) => getDeveloperDashboard(forceRefresh),
    [],
  );

  const [optimisticVms, setOptimisticVms] = useState<VM[]>([]);
  const [transitioningIds, setTransitioningIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [drawerVM, setDrawerVM] = useState<VM | null>(null);

  const myVms = useMemo(
    () => (optimisticVms.length > 0 ? optimisticVms : (data?.vms ?? [])),
    [data?.vms, optimisticVms],
  );

  const templateLookup = useMemo(
    () => (data?.templates ?? []).reduce<Record<string, VMTemplate>>((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {}),
    [data?.templates],
  );

  const runningVMs = myVms.filter(v => v.status === 'running');
  const runningCount = myVms.filter(v => v.status === 'running').length;
  const stoppedCount = myVms.filter(v => v.status === 'stopped').length;
  const avgCpu = runningVMs.length
    ? Math.round(runningVMs.reduce((sum, v) => sum + v.cpu, 0) / runningVMs.length)
    : 0;
  const avgMemory = runningVMs.length
    ? Math.round(runningVMs.reduce((sum, v) => sum + v.memory, 0) / runningVMs.length)
    : 0;
  const monthlyCost = Math.round(myVms.reduce((sum, v) => sum + v.costPerHour, 0) * 730);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const matches = myVms.filter(vm => {
      const matchesSearch = !q ||
        vm.name.toLowerCase().includes(q) ||
        vm.template.toLowerCase().includes(q) ||
        vm.region.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || vm.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    return sortVMs(matches, sortBy);
  }, [myVms, search, statusFilter, sortBy]);

  const handleOpenIde = (vm: VM) => {
    if (vm.status !== 'running') return;
    const url = getIdeUrl(vm.id);
    toast.success('Opening IDE…', { description: vm.name });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenRunningIde = () => {
    const running = myVms.find(v => v.status === 'running');
    if (running) {
      handleOpenIde(running);
    } else {
      toast.info('No running machine', { description: 'Start a machine first to open the IDE.' });
    }
  };

  const handleAction = async (vmId: string, action: 'start' | 'stop' | 'restart') => {
    const vm = myVms.find(v => v.id === vmId);
    if (!vm) return;

    const toastLabel = action === 'start' ? 'Starting machine…' : action === 'stop' ? 'Stopping machine…' : 'Restarting machine…';
    const transitionalStatus: VMStatus = action === 'start' ? 'starting' : action === 'stop' ? 'stopping' : 'starting';
    const finalStatus: VMStatus = action === 'stop' ? 'stopped' : 'running';

    const baseVms = optimisticVms.length > 0 ? optimisticVms : (data?.vms ?? []);

    toast.loading(toastLabel, { id: vmId });
    setTransitioningIds(prev => new Set(prev).add(vmId));
    setOptimisticVms(baseVms.map(v => v.id === vmId ? { ...v, status: transitionalStatus } : v));
    setDrawerVM(prev => prev?.id === vmId ? { ...prev, status: transitionalStatus } : prev);

    try {
      const updatedVm = await updateVMStatus(vmId, finalStatus);
      const nextVm = {
        ...updatedVm,
        cpu: finalStatus === 'running' ? (updatedVm.cpu || 12) : 0,
        memory: finalStatus === 'running' ? (updatedVm.memory || 18) : 0,
        usageHealth: updatedVm.usageHealth ?? (finalStatus === 'running' ? 'healthy' as const : undefined),
      };

      setOptimisticVms(baseVms.map(v => v.id === vmId ? nextVm : v));
      setDrawerVM(prev => prev?.id === vmId ? nextVm : prev);
      toast.success(
        action === 'stop' ? 'Machine stopped' : action === 'start' ? 'Machine is running' : 'Machine restarted',
        { id: vmId },
      );
    } catch (err) {
      setOptimisticVms(baseVms.map(v => v.id === vmId ? { ...v, status: vm.status, usageHealth: vm.usageHealth } : v));
      setDrawerVM(prev => prev?.id === vmId ? { ...prev, status: vm.status, usageHealth: vm.usageHealth } : prev);
      toast.error(err instanceof Error ? err.message : 'Unable to update machine', { id: vmId });
    } finally {
      setTransitioningIds(prev => {
        const next = new Set(prev);
        next.delete(vmId);
        return next;
      });
    }
  };

  const shellProps = {
    title: 'My Machines',
    subtitle: 'Manage your cloud development workspaces and open your coding environment.',
    showTimeRange: false as const,
    variant: 'developer' as const,
  };

  if (loading && !data) {
    return (
      <AppShell {...shellProps}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 animate-pulse" />
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <TableSkeleton rows={4} cols={8} />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell {...shellProps}>
        <ErrorState
          title="Could not load your machines"
          description="Your workspace data could not be fetched from the mock backend."
          onRetry={() => refetch(true)}
        />
      </AppShell>
    );
  }

  if (myVms.length === 0) {
    return (
      <AppShell {...shellProps}>
        <EmptyState
          title="You don't have any machines yet."
          description="Machines assigned to you will appear here."
        />
      </AppShell>
    );
  }

  return (
    <AppShell {...shellProps}>
      <div className="flex h-full gap-0 -m-6 relative">
        <div className="flex-1 overflow-auto p-6 space-y-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Signed in as {data?.currentUser.name} · Data source: mock API
            </p>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-indigo-500"
              onClick={handleOpenRunningIde}
              aria-label="Open running IDE"
            >
              <Monitor className="w-4 h-4" />
              Open running IDE
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard title="Total Machines" value={myVms.length} subtext="assigned to you" />
            <MetricCard title="Running" value={runningCount} subtext="ready to use" />
            <MetricCard title="Stopped" value={stoppedCount} subtext="start when needed" />
            <MetricCard title="Avg CPU" value={`${avgCpu}%`} subtext={`${avgMemory}% avg memory`} />
            <MetricCard title="Est. monthly cost" value={`$${monthlyCost}`} subtext="if always on" />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, template, or region…"
                className="pl-9 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search machines"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
                <SelectItem value="starting">Starting</SelectItem>
                <SelectItem value="stopping">Stopping</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-40 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" aria-label="Sort machines">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="cpu">CPU</SelectItem>
                <SelectItem value="memory">Memory</SelectItem>
                <SelectItem value="lastActive">Last active</SelectItem>
              </SelectContent>
            </Select>

            {(search || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 dark:text-gray-400 gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500"
                onClick={() => { setSearch(''); setStatusFilter('all'); }}
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(vm => {
              const isTransitioning = transitioningIds.has(vm.id);
              const isDrawerOpen = drawerVM?.id === vm.id;
              return (
                <Card
                  key={vm.id}
                  className={`dark:bg-gray-900 dark:border-gray-700 ${isDrawerOpen ? 'ring-2 ring-indigo-500/50' : ''}`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium font-mono text-sm text-gray-900 dark:text-gray-100">{vm.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{vm.template} · {vm.region}</p>
                      </div>
                      <StatusBadge status={vm.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-gray-400">CPU</span><UsageMini value={vm.cpu} status={vm.status} /></div>
                      <div><span className="text-gray-400">Mem</span><UsageMini value={vm.memory} status={vm.status} /></div>
                      <div><span className="text-gray-400">Disk</span><span className="text-sm tabular-nums">{vm.status === 'stopped' ? '—' : `${vm.disk}%`}</span></div>
                    </div>
                    <p className="text-xs text-gray-400">{formatUptime(vm) !== '—' ? formatUptime(vm) : `Last active: ${vm.lastActive}`}</p>
                    <MachineRowActions
                      vm={vm}
                      isTransitioning={isTransitioning}
                      onOpenIde={handleOpenIde}
                      onAction={handleAction}
                      onDetails={() => setDrawerVM(isDrawerOpen ? null : vm)}
                      isDrawerOpen={isDrawerOpen}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block dark:bg-gray-900 dark:border-gray-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableHead className="dark:text-gray-400">Machine</TableHead>
                      <TableHead className="dark:text-gray-400">Status</TableHead>
                      <TableHead className="dark:text-gray-400">Template</TableHead>
                      <TableHead className="dark:text-gray-400">Region</TableHead>
                      <TableHead className="dark:text-gray-400">CPU</TableHead>
                      <TableHead className="dark:text-gray-400">Memory</TableHead>
                      <TableHead className="dark:text-gray-400">Disk</TableHead>
                      <TableHead className="dark:text-gray-400">Uptime / Last active</TableHead>
                      <TableHead className="text-right pr-4 dark:text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(vm => {
                      const isTransitioning = transitioningIds.has(vm.id);
                      const isDrawerOpen = drawerVM?.id === vm.id;
                      return (
                        <TableRow
                          key={vm.id}
                          className={`cursor-pointer transition-colors ${
                            isDrawerOpen
                              ? 'bg-indigo-50 dark:bg-indigo-950/30'
                              : isTransitioning
                              ? 'bg-blue-50/50 dark:bg-blue-950/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                          onClick={() => setDrawerVM(isDrawerOpen ? null : vm)}
                        >
                          <TableCell className="font-medium font-mono text-sm text-gray-900 dark:text-gray-100">{vm.name}</TableCell>
                          <TableCell><StatusBadge status={vm.status} /></TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{vm.template}</span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 dark:text-gray-400 font-mono">{vm.region}</TableCell>
                          <TableCell onClick={e => e.stopPropagation()}><UsageMini value={vm.cpu} status={vm.status} /></TableCell>
                          <TableCell onClick={e => e.stopPropagation()}><UsageMini value={vm.memory} status={vm.status} /></TableCell>
                          <TableCell>
                            {vm.status === 'stopped' || vm.status === 'error'
                              ? <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                              : <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">{vm.disk}%</span>
                            }
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                            {formatUptime(vm) !== '—' ? formatUptime(vm) : vm.lastActive}
                          </TableCell>
                          <TableCell className="text-right pr-4" onClick={e => e.stopPropagation()}>
                            <MachineRowActions
                              vm={vm}
                              isTransitioning={isTransitioning}
                              onOpenIde={handleOpenIde}
                              onAction={handleAction}
                              onDetails={() => setDrawerVM(isDrawerOpen ? null : vm)}
                              isDrawerOpen={isDrawerOpen}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filtered.length === 0 && (
                <EmptyState
                  title="No machines match these filters"
                  description="Try adjusting your search or filter criteria."
                  action={search || statusFilter !== 'all' ? { label: 'Clear filters', onClick: () => { setSearch(''); setStatusFilter('all'); } } : undefined}
                />
              )}

              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Showing {filtered.length} of {myVms.length} machines
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {drawerVM && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 bg-black/30 md:hidden"
              aria-label="Close drawer overlay"
              onClick={() => setDrawerVM(null)}
            />
            <DeveloperVMDrawer
              vm={drawerVM}
              template={templateLookup[drawerVM.templateId]}
              usageHistory={data?.usageHistory[drawerVM.id] ?? []}
              onClose={() => setDrawerVM(null)}
              onAction={handleAction}
              onOpenIde={handleOpenIde}
              transitioningIds={transitioningIds}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
