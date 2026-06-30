export type VMStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
export type VMUsageHealth = 'idle' | 'underused' | 'high' | 'healthy';

export interface VM {
  id: string;
  name: string;
  owner: string;
  ownerEmail: string;
  ownerId: string;
  template: string;
  templateId: string;
  region: string;
  status: VMStatus;
  cpu: number;
  memory: number;
  disk: number;
  costPerHour: number;
  lastActive: string;
  createdDate: string;
  startedDate: string;
  usageHealth?: VMUsageHealth;
}

export interface VMTemplate {
  id: string;
  name: string;
  description: string;
  baseImage: string;
  vcpu: number;
  memoryGB: number;
  diskGB: number;
  tools: string[];
  usedByVMs: number;
  active: boolean;
}

export interface FleetMetrics {
  totalVMs: number;
  runningVMs: number;
  stoppedVMs: number;
  activeUsers: number;
  avgCPU: number;
  avgMemory: number;
  costPerHour: number;
  projectedMonthlyCost: number;
}

export interface UtilizationTrendPoint {
  time: string;
  cpu: number;
  memory: number;
  runningVMs: number;
}

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  vmCount: number;
  activeVMs: number;
  lastActive: string;
}

export interface WorkspacePolicy {
  id: string;
  name: string;
  maxVmsPerUser: number;
  idleTimeoutMinutes: number;
  allowedTemplateIds: string[];
  appliesToTeam: string;
  createdAt: string;
}

export interface ActivityEntry {
  time: string;
  message: string;
  type: 'info' | 'warn' | 'error';
}

export interface VMUsagePoint {
  timestamp: string;
  cpuPercent: number;
  memoryPercent: number;
}

export interface WorkspaceData {
  fleetMetrics: FleetMetrics;
  utilizationTrend: UtilizationTrendPoint[];
  vms: VM[];
  templates: VMTemplate[];
  users: WorkspaceUser[];
  policies: WorkspacePolicy[];
  activityLog: Record<string, ActivityEntry[]>;
  currentUser?: WorkspaceUser;
  usageHistory?: Record<string, VMUsagePoint[]>;
}

export interface FleetDashboardData {
  fleetMetrics: FleetMetrics;
  utilizationTrend: UtilizationTrendPoint[];
  vms: VM[];
}

export interface VMInventoryPageData {
  vms: VM[];
  users: WorkspaceUser[];
  activityLog: Record<string, ActivityEntry[]>;
}

export interface DeveloperDashboardData {
  currentUser: WorkspaceUser;
  vms: VM[];
  templates: VMTemplate[];
  usageHistory: Record<string, VMUsagePoint[]>;
}

const delay = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

let workspaceDataCache: WorkspaceData | null = null;
let workspaceDataPromise: Promise<WorkspaceData> | null = null;

const isDev = import.meta.env.DEV;

export async function getWorkspaceData(forceRefresh = false): Promise<WorkspaceData> {
  if (forceRefresh) {
    workspaceDataCache = null;
    workspaceDataPromise = null;
  }

  // In dev, always re-read JSON so edits to public/mock-api/workspaces.json show up.
  if (workspaceDataCache && !forceRefresh && !isDev) {
    return workspaceDataCache;
  }

  if (workspaceDataPromise && !forceRefresh) {
    return workspaceDataPromise;
  }

  workspaceDataPromise = fetch(`${import.meta.env.BASE_URL}mock-api/workspaces.json`, { cache: 'no-store' })
    .then(async response => {
      if (!response.ok) {
        throw new Error('Unable to load mock workspace data');
      }

      const data = (await response.json()) as WorkspaceData;
      await delay(400 + Math.round(Math.random() * 200));
      if (!isDev) {
        workspaceDataCache = data;
      }
      return data;
    })
    .finally(() => {
      workspaceDataPromise = null;
    });

  return workspaceDataPromise;
}

export async function getFleetDashboard(forceRefresh = false): Promise<FleetDashboardData> {
  const data = await getWorkspaceData(forceRefresh);
  return {
    fleetMetrics: data.fleetMetrics,
    utilizationTrend: data.utilizationTrend,
    vms: data.vms,
  };
}

export async function getVMInventory(forceRefresh = false): Promise<VMInventoryPageData> {
  const data = await getWorkspaceData(forceRefresh);
  return {
    vms: data.vms,
    users: data.users,
    activityLog: data.activityLog,
  };
}

const DEFAULT_DEVELOPER_USER_ID = 'owner-1';

export async function getDeveloperDashboard(forceRefresh = false): Promise<DeveloperDashboardData> {
  const data = await getWorkspaceData(forceRefresh);
  const currentUser =
    data.currentUser ??
    data.users.find(user => user.id === DEFAULT_DEVELOPER_USER_ID) ??
    data.users[0];

  if (!currentUser) {
    throw new Error('No developer user found in mock workspace data');
  }

  await delay(300 + Math.round(Math.random() * 150));

  return {
    currentUser,
    vms: data.vms.filter(vm => vm.ownerId === currentUser.id),
    templates: data.templates,
    usageHistory: data.usageHistory ?? {},
  };
}

export function getIdeUrl(vmId: string): string {
  return `https://vscode.example.com/workspace/${vmId}`;
}

export async function getTemplates(forceRefresh = false): Promise<VMTemplate[]> {
  const data = await getWorkspaceData(forceRefresh);
  await delay(250 + Math.round(Math.random() * 150));
  return data.templates;
}

export async function getActivityLog(vmId: string, forceRefresh = false): Promise<ActivityEntry[]> {
  const data = await getWorkspaceData(forceRefresh);
  return data.activityLog[vmId] ?? [];
}

export async function updateVMStatus(vmId: string, nextStatus: VMStatus): Promise<VM> {
  const data = await getWorkspaceData();
  const vm = data.vms.find(candidate => candidate.id === vmId);

  if (!vm) {
    throw new Error(`VM ${vmId} was not found`);
  }

  vm.status = nextStatus;
  if (nextStatus === 'running') {
    vm.usageHealth = vm.usageHealth ?? 'healthy';
  }

  await delay(450 + Math.round(Math.random() * 150));
  return vm;
}

export async function saveTemplate(template: VMTemplate): Promise<VMTemplate> {
  const data = await getWorkspaceData();
  const existingIndex = data.templates.findIndex(candidate => candidate.id === template.id);

  if (existingIndex >= 0) {
    data.templates[existingIndex] = template;
  } else {
    data.templates.unshift(template);
  }

  await delay(400 + Math.round(Math.random() * 150));
  return template;
}
