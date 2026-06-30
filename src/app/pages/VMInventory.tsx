import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AppShell } from '../components/AppShell';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge, UsageHealthBadge } from '../components/StatusBadge';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Search, X, ExternalLink, MoreHorizontal, Loader2,
  ChevronRight, Server, Copy, User, RotateCcw, Power,
  PowerOff,
} from 'lucide-react';
import { TableSkeleton, EmptyState, ErrorState, InProgressIndicator } from '../components/StateViews';
import { getVMInventory, updateVMStatus } from '../api/workspacesApi';
import { useAsyncData } from '../hooks/useAsyncData';
import type { ActivityEntry, VM, VMStatus, WorkspaceUser } from '../api/workspacesApi';

function mapUsersToLookup(users: WorkspaceUser[]) {
  return users.reduce<Record<string, WorkspaceUser>>((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
}

// ---- UsageMini ----

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

// ---- Status dot ----

function StatusDot({ vm }: { vm: VM }) {
  if (vm.status === 'error') return <span className="w-2 h-2 rounded-full bg-red-500 inline-block flex-shrink-0" aria-hidden />;
  if (vm.status === 'stopped') return <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 inline-block flex-shrink-0" aria-hidden />;
  if (vm.status === 'starting' || vm.status === 'stopping') return <Loader2 className="w-3 h-3 text-blue-400 animate-spin flex-shrink-0" aria-hidden />;
  if (vm.usageHealth === 'high') return <span className="w-2 h-2 rounded-full bg-orange-500 inline-block flex-shrink-0" aria-hidden />;
  if (vm.usageHealth === 'idle' || vm.usageHealth === 'underused') return <span className="w-2 h-2 rounded-full bg-amber-400 inline-block flex-shrink-0" aria-hidden />;
  return <span className="w-2 h-2 rounded-full bg-green-400 inline-block flex-shrink-0" aria-hidden />;
}

// ---- Owner panel ----

function OwnerPanel({ owner, onClose }: { owner?: WorkspaceUser; onClose: () => void }) {
  if (!owner) return null;
  return (
    <div className="mt-4 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Owner</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{owner.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{owner.email}</p>
        </div>
      </div>
      <dl className="space-y-1.5 text-xs">
        {([
          ['Role', owner.role],
          ['Total VMs', String(owner.vmCount)],
          ['Active VMs', String(owner.activeVMs)],
          ['Last active', owner.lastActive],
        ] as [string, string][]).map(([label, val]) => (
          <div key={label} className="flex justify-between">
            <dt className="text-gray-400 dark:text-gray-500">{label}</dt>
            <dd className="font-medium text-gray-700 dark:text-gray-300">{val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ---- VM Detail Drawer ----

interface VMDetailDrawerProps {
  vm: VM;
  onClose: () => void;
  onAction: (vmId: string, action: 'start' | 'stop' | 'restart') => void;
  transitioningIds: Set<string>;
  activityLog: Record<string, ActivityEntry[]>;
  ownerLookup: Record<string, WorkspaceUser>;
}

function VMDetailDrawer({ vm, onClose, onAction, transitioningIds, activityLog, ownerLookup }: VMDetailDrawerProps) {
  const [showOwner, setShowOwner] = useState(false);
  const isTransitioning = transitioningIds.has(vm.id);
  const activity = activityLog[vm.id] ?? [];
  const owner = ownerLookup[vm.ownerId];

  const handleCopyId = () => {
    navigator.clipboard.writeText(vm.id).catch(() => {});
    toast.success('VM ID copied', { description: vm.id });
  };

  const canStart = vm.status === 'stopped' && !isTransitioning;
  const canStop = vm.status === 'running' && !isTransitioning;
  const canRestart = vm.status === 'running' && !isTransitioning;
  const isError = vm.status === 'error';

  return (
    <div
      className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col flex-shrink-0 overflow-y-auto"
      role="dialog"
      aria-label={`VM details: ${vm.name}`}
      aria-modal="false"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <Server className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 font-mono truncate">{vm.name}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={handleCopyId}
            aria-label="Copy VM ID"
            title="Copy VM ID"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
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
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Status + health */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={vm.status} />
          {vm.usageHealth && <UsageHealthBadge health={vm.usageHealth} />}
          {isTransitioning && <InProgressIndicator label={
            vm.status === 'starting' ? 'Starting…' :
            vm.status === 'stopping' ? 'Stopping…' : 'Processing…'
          } />}
        </div>

        {/* Details */}
        <section>
          <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Details</h3>
          <dl className="space-y-2 text-sm">
            {([
              ['VM ID', vm.id],
              ['Owner', vm.owner],
              ['Email', vm.ownerEmail],
              ['Template', vm.template],
              ['Region', vm.region],
              ['Created', vm.createdDate],
              ['Started', vm.startedDate],
              ['Last active', vm.lastActive],
            ] as [string, string][]).map(([label, val]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0">{label}</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium text-right truncate">{val}</dd>
              </div>
            ))}
          </dl>

          {/* Owner panel toggle */}
          <button
            className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            onClick={() => setShowOwner(v => !v)}
            aria-expanded={showOwner}
          >
            {showOwner ? 'Hide owner details' : 'View owner details'}
          </button>
          {showOwner && <OwnerPanel owner={owner} onClose={() => setShowOwner(false)} />}
        </section>

        {/* Utilization */}
        <section>
          <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Utilization</h3>
          <div className="space-y-3">
            {[
              { label: 'CPU', value: vm.cpu },
              { label: 'Memory', value: vm.memory },
              { label: 'Disk', value: vm.disk },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300 tabular-nums">{value}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      value >= 85 ? 'bg-red-500' :
                      value >= 70 ? 'bg-amber-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Sparklines */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {(['CPU', 'Memory'] as const).map(metric => (
              <div key={metric} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5">{metric} — 30 min</p>
                <svg viewBox="0 0 80 24" className="w-full" preserveAspectRatio="none">
                  <polyline
                    points={metric === 'CPU'
                      ? "0,18 10,16 20,12 30,19 40,8 50,6 60,10 70,5 80,8"
                      : "0,14 10,13 20,11 30,15 40,10 50,9 60,12 70,8 80,10"}
                    fill="none"
                    stroke={metric === 'CPU' ? '#6366f1' : '#10b981'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ))}
          </div>
        </section>

        {/* Cost */}
        <section>
          <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Cost</h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            ${vm.costPerHour.toFixed(2)}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500">/hr</span>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Est. ${(vm.costPerHour * 730).toFixed(0)}/mo if always on
          </p>
        </section>

        {/* Activity log */}
        <section>
          <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Activity log</h3>
          <div className="space-y-2">
            {activity.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0 w-10">{entry.time}</span>
                <span className={
                  entry.type === 'error' ? 'text-red-600 dark:text-red-400' :
                  entry.type === 'warn' ? 'text-amber-600 dark:text-amber-400' :
                  'text-gray-700 dark:text-gray-300'
                }>
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {!isError && (
          <div className="grid grid-cols-2 gap-2">
            {vm.status !== 'stopped' ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
                onClick={() => onAction(vm.id, 'stop')}
                disabled={!canStop}
                aria-label="Stop VM"
              >
                <PowerOff className="w-3.5 h-3.5" />
                Stop VM
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
                onClick={() => onAction(vm.id, 'start')}
                disabled={!canStart}
                aria-label="Start VM"
              >
                <Power className="w-3.5 h-3.5" />
                Start VM
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
              onClick={() => onAction(vm.id, 'restart')}
              disabled={!canRestart}
              aria-label="Restart VM"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart
            </Button>
          </div>
        )}
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Open full VM details"
        >
          <ExternalLink className="w-4 h-4" />
          Open details
        </Button>
      </div>
    </div>
  );
}

// ---- Action Menu ----

interface ActionMenuProps {
  vm: VM;
  onOpenDrawer: () => void;
  onAction: (vmId: string, action: 'start' | 'stop' | 'restart') => void;
  transitioningIds: Set<string>;
}

function ActionMenu({ vm, onOpenDrawer, onAction, transitioningIds }: ActionMenuProps) {
  const isTransitioning = transitioningIds.has(vm.id);
  const isError = vm.status === 'error';
  const isInProgress = vm.status === 'starting' || vm.status === 'stopping' || isTransitioning;

  const handleCopyId = () => {
    navigator.clipboard.writeText(vm.id).catch(() => {});
    toast.success('VM ID copied', { description: vm.id });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-400 dark:text-gray-500 focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={`Actions for ${vm.name}`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 dark:bg-gray-800 dark:border-gray-700">
        <DropdownMenuItem
          className="gap-2 cursor-pointer dark:text-gray-300 dark:focus:bg-gray-700"
          onSelect={onOpenDrawer}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer dark:text-gray-300 dark:focus:bg-gray-700"
          onSelect={handleCopyId}
        >
          <Copy className="w-3.5 h-3.5" />
          Copy VM ID
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer dark:text-gray-300 dark:focus:bg-gray-700"
          onSelect={onOpenDrawer}
        >
          <User className="w-3.5 h-3.5" />
          View owner
        </DropdownMenuItem>

        {!isError && (
          <>
            <DropdownMenuSeparator className="dark:border-gray-700" />
            {vm.status !== 'stopped' ? (
              <DropdownMenuItem
                className="gap-2 cursor-pointer dark:text-gray-300 dark:focus:bg-gray-700"
                onSelect={() => onAction(vm.id, 'restart')}
                disabled={isInProgress || vm.status !== 'running'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restart VM
              </DropdownMenuItem>
            ) : null}
            {vm.status === 'running' ? (
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-red-600 dark:text-red-400 dark:focus:bg-gray-700"
                onSelect={() => onAction(vm.id, 'stop')}
                disabled={isInProgress}
              >
                <PowerOff className="w-3.5 h-3.5" />
                Stop VM
              </DropdownMenuItem>
            ) : vm.status === 'stopped' ? (
              <DropdownMenuItem
                className="gap-2 cursor-pointer dark:text-gray-300 dark:focus:bg-gray-700"
                onSelect={() => onAction(vm.id, 'start')}
                disabled={isInProgress}
              >
                <Power className="w-3.5 h-3.5" />
                Start VM
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled className="gap-2 text-gray-400 dark:text-gray-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                In progress…
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---- Main page ----

export function VMInventory() {
  const { data, loading, error, refetch } = useAsyncData(
    (forceRefresh) => getVMInventory(forceRefresh),
    [],
  );
  const [optimisticVms, setOptimisticVms] = useState<VM[]>([]);
  const [transitioningIds, setTransitioningIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [usageFilter, setUsageFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [drawerVM, setDrawerVM] = useState<VM | null>(null);
  const ownerLookup = useMemo(() => mapUsersToLookup(data?.users ?? []), [data?.users]);
  const vms = useMemo(() => optimisticVms.length > 0 ? optimisticVms : (data?.vms ?? []), [data?.vms, optimisticVms]);
  const templateOptions = useMemo(
    () => [...new Set(vms.map(vm => vm.template))].sort(),
    [vms],
  );

  const handleAction = async (vmId: string, action: 'start' | 'stop' | 'restart') => {
    const vm = vms.find(v => v.id === vmId);
    if (!vm) return;

    const toastLabel = action === 'start' ? 'Starting VM…' : action === 'stop' ? 'Stopping VM…' : 'Restarting VM…';
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
        usageHealth: updatedVm.usageHealth ?? (finalStatus === 'running' ? 'healthy' : undefined),
      };

      setOptimisticVms(baseVms.map(v => v.id === vmId ? nextVm : v));
      setDrawerVM(prev => prev?.id === vmId ? nextVm : prev);
      toast.success(
        action === 'stop' ? 'VM stopped' : action === 'start' ? 'VM is running' : 'VM restarted',
        { id: vmId }
      );
    } catch (error) {
      setOptimisticVms(baseVms.map(v => v.id === vmId ? { ...v, status: vm.status, usageHealth: vm.usageHealth } : v));
      setDrawerVM(prev => prev?.id === vmId ? { ...prev, status: vm.status, usageHealth: vm.usageHealth } : prev);
      toast.error(error instanceof Error ? error.message : 'Unable to update VM', { id: vmId });
    } finally {
      setTransitioningIds(prev => {
        const next = new Set(prev);
        next.delete(vmId);
        return next;
      });
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setTemplateFilter('all');
    setUsageFilter('all');
    setRegionFilter('all');
    setSearch('');
  };

  const activeFilterCount = [
    statusFilter !== 'all',
    templateFilter !== 'all',
    usageFilter !== 'all',
    regionFilter !== 'all',
  ].filter(Boolean).length;

  const filtered = vms.filter(vm => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      vm.name.includes(q) ||
      vm.owner.toLowerCase().includes(q) ||
      vm.template.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || vm.status === statusFilter;
    const matchesTemplate = templateFilter === 'all' || vm.template === templateFilter;
    const matchesRegion = regionFilter === 'all' || vm.region === regionFilter;
    const matchesUsage = usageFilter === 'all' || vm.usageHealth === usageFilter;
    return matchesSearch && matchesStatus && matchesTemplate && matchesRegion && matchesUsage;
  });

  if (loading && vms.length === 0) {
    return (
      <AppShell title="VM Inventory" subtitle="Search, filter, and monitor all developer machines across the workspace." showTimeRange={false}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 animate-pulse" />
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <TableSkeleton rows={6} cols={12} />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="VM Inventory" subtitle="Search, filter, and monitor all developer machines across the workspace." showTimeRange={false}>
        <ErrorState
          title="Could not load VM inventory"
          description="The inventory could not be fetched from the mock backend."
          onRetry={() => refetch(true)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="VM Inventory"
      subtitle="Search, filter, and monitor all developer machines across the workspace."
      showTimeRange={false}
    >
      <div className="flex h-full gap-0 -m-6">
        <div className="flex-1 overflow-auto p-6 space-y-6 min-w-0">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total VMs" value={vms.length} subtext="loaded from mock API" />
            <MetricCard title="Running" value={vms.filter(v => v.status === 'running').length} subtext="actively in use" />
            <MetricCard title="Idle / Underused" value={vms.filter(v => v.usageHealth === 'idle' || v.usageHealth === 'underused').length} subtext="candidates for review" />
            <MetricCard title="Errors" value={vms.filter(v => v.status === 'error').length} subtext="require attention" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search VM, owner, or template…"
                className="pl-9 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search VMs"
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

            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="w-48 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" aria-label="Filter by template">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All templates</SelectItem>
                {templateOptions.map(template => (
                  <SelectItem key={template} value={template}>{template}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={usageFilter} onValueChange={setUsageFilter}>
              <SelectTrigger className="w-40 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" aria-label="Filter by usage">
                <SelectValue placeholder="Usage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All usage</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="underused">Underused</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="high">High usage</SelectItem>
              </SelectContent>
            </Select>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-40 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" aria-label="Filter by region">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                <SelectItem value="us-east-1">us-east-1</SelectItem>
                <SelectItem value="eu-west-1">eu-west-1</SelectItem>
                <SelectItem value="eu-central-1">eu-central-1</SelectItem>
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 dark:text-gray-400 gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500"
                onClick={clearFilters}
              >
                <X className="w-3.5 h-3.5" />
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </Button>
            )}
          </div>

          {/* Table */}
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableHead className="w-5 pl-4" />
                      <TableHead className="dark:text-gray-400">VM Name</TableHead>
                      <TableHead className="dark:text-gray-400">Owner</TableHead>
                      <TableHead className="dark:text-gray-400">Template</TableHead>
                      <TableHead className="dark:text-gray-400">Region</TableHead>
                      <TableHead className="dark:text-gray-400">Status</TableHead>
                      <TableHead className="dark:text-gray-400">Usage</TableHead>
                      <TableHead className="dark:text-gray-400">CPU</TableHead>
                      <TableHead className="dark:text-gray-400">Memory</TableHead>
                      <TableHead className="dark:text-gray-400">Disk</TableHead>
                      <TableHead className="dark:text-gray-400">Last active</TableHead>
                      <TableHead className="dark:text-gray-400">Cost/hr</TableHead>
                      <TableHead className="w-24 text-right pr-4 dark:text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(vm => {
                      const isTransitioning = transitioningIds.has(vm.id);
                      const isDrawerOpen = drawerVM?.id === vm.id;
                      return (
                        <TableRow
                          key={vm.id}
                          className={`transition-colors ${
                            isDrawerOpen
                              ? 'bg-indigo-50 dark:bg-indigo-950/30'
                              : isTransitioning
                              ? 'bg-blue-50/50 dark:bg-blue-950/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <TableCell className="pl-4">
                            <StatusDot vm={vm} />
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100 font-mono text-sm">
                            {vm.name}
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">{vm.owner}</TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                              {vm.template}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 dark:text-gray-400 font-mono">{vm.region}</TableCell>
                          <TableCell><StatusBadge status={vm.status} /></TableCell>
                          <TableCell>
                            {vm.usageHealth && vm.usageHealth !== 'healthy'
                              ? <UsageHealthBadge health={vm.usageHealth} />
                              : <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
                            }
                          </TableCell>
                          <TableCell><UsageMini value={vm.cpu} status={vm.status} /></TableCell>
                          <TableCell><UsageMini value={vm.memory} status={vm.status} /></TableCell>
                          <TableCell>
                            {vm.status === 'stopped' || vm.status === 'error'
                              ? <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                              : <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">{vm.disk}%</span>
                            }
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 dark:text-gray-400">{vm.lastActive}</TableCell>
                          <TableCell>
                            <span className={`text-sm font-medium tabular-nums ${vm.costPerHour === 0 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}`}>
                              ${vm.costPerHour.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <div className="flex items-center justify-end gap-1">
                              {isTransitioning ? (
                                <InProgressIndicator />
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-gray-500 dark:text-gray-400 text-xs gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500"
                                  onClick={() => setDrawerVM(isDrawerOpen ? null : vm)}
                                  aria-label={`View details for ${vm.name}`}
                                  aria-expanded={isDrawerOpen}
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                  View
                                </Button>
                              )}
                              <ActionMenu
                                vm={vm}
                                onOpenDrawer={() => setDrawerVM(vm)}
                                onAction={handleAction}
                                transitioningIds={transitioningIds}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filtered.length === 0 && (
                <EmptyState
                  title="No VMs match these filters"
                  description="Try adjusting your search or filter criteria to find what you're looking for."
                  action={activeFilterCount > 0 || search ? { label: 'Clear all filters', onClick: clearFilters } : undefined}
                />
              )}

              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Showing {filtered.length} of {vms.length} VMs
                </p>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    {vms.filter(v => v.usageHealth === 'idle' || v.usageHealth === 'underused').length} idle / underused
                  </Badge>
                  <Badge variant="outline" className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    {vms.filter(v => v.usageHealth === 'high').length} high usage
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detail drawer */}
        {drawerVM && (
          <VMDetailDrawer
            vm={drawerVM}
            onClose={() => setDrawerVM(null)}
            onAction={handleAction}
            transitioningIds={transitioningIds}
            activityLog={data?.activityLog ?? {}}
            ownerLookup={ownerLookup}
          />
        )}
      </div>
    </AppShell>
  );
}
