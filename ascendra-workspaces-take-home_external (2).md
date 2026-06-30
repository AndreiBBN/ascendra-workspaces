# Take-Home Assignment — Product Design Engineer

## Ascendra Workspaces Dashboard

Welcome, and thanks for taking the time. This exercise is designed to mirror the actual work of the role: taking a loosely-specified product need, making sound UX decisions, and shipping a clean, modern interface wired to a backend.

We care more about **how you think and the quality of what you ship** than about completing every feature. Please don't gold-plate — see the time box below.

---

## 1. Context

**Ascendra Networks** provides cloud infrastructure. We're building **Ascendra Workspaces**: a platform for managing developer machines.
The product serves **two distinct audiences**, and your job is to design and build a dashboard that serves both:

- **Developers / Engineers** — people who use the developer machines for daily work.
- **DevOps / DevEx admins** — the people who manage the infrastructure; they need visibility into fleet-wide performance and utilization.

---

## 2. The Brief (raw requirements)

This is roughly how the requirement reached us. Part of the exercise is turning this into a coherent, well-structured product surface. Where the brief is ambiguous, **make a decision and note your reasoning** — don't wait for clarification.

> We need a dashboard for managing developer machines. Developers should be able to login to their account and be able to use their developer environment from the browser [for example they might use vscode server].
>
> On the admin side, DevOps and DevEx need complete visibility into the infrastructure: how many developer machines are running, what's the overall utilization, how much it costs? They manage VMs templates (spec: cpu, memory, hard drive size), set policies (max VMs per developer, resource limits, idle timeout). They need to see utilization metrics — VM and fleet-wide — to understand if the infra is healthy.
>
> The key difference: developers only care about **their own VMs and their resource usage**. DevOps cares about **infrastructure health and efficiency** — what's the per VM and aggregate utilization.
>
> It should feel modern and fast, and obviously the admin and developer experiences are different enough that they shouldn't be the same screens.

---

## 3. What We'd Like You to Do

There are two parts. Both matter.

### Part A — Product & UX thinking

Before or alongside building, briefly show your thinking:

- How you interpreted the brief and what decisions you made.
- The information architecture: what the two areas (developer / admin) contain and how someone moves between them.
- Key flows you prioritized and why.

This can be a short section in your README, a few annotated sketches/wireframes, or a Figma link — whatever communicates your reasoning. **A polished Figma file is not required**; clear thinking is.

### Part B — Design & implement the dashboard

Build a working frontend, wired to a (mock) backend, covering **both** the developer and admin experiences. You don't need to build everything in the brief — focus on a coherent, well-executed slice (see scope below).

---

## 4. Scope

To respect the time box, here's a suggested **core** vs. **optional** split. You're free to reprioritize, but please cover at least the core for both personas.

### Developer view — core

- **My Machines**: a list of the developer's VMs showing status (running / stopped / starting), template, and current resource usage (CPU%, memory%, disk%).
- **Connect**: a clear way to open the developer environment in the browser (e.g. an "Open in IDE" button that links to a vscode-server URL — can be a non-functional stub).
- **Lifecycle controls**: start / stop / restart a VM, with appropriate UI states for transitions.
- **VM detail**: usage over time (CPU and memory as line charts or sparklines), basic VM metadata (template, specs, uptime).

### Admin view — core

- **Fleet overview**: top-level metrics — total VMs (running / stopped / total), number of users, aggregate CPU utilization, aggregate memory utilization, and total infrastructure cost.
- **VM inventory**: a searchable/filterable list of all VMs across the org, each with owner, template, status, and per-VM utilization (CPU%, memory%, disk%). Surface idle or underused VMs clearly.
- **Fleet utilization**: visualizations for aggregate CPU and memory utilization over time, plus a way to see distribution (which VMs are hot, which are idle).
- **Templates**: list of VM templates with the ability to view and create/edit one — name, CPU, memory, disk size, base image.

### Optional / stretch (pick what interests you)

- Policies & quotas (max VMs per developer, resource limits, idle auto-stop timeout).
- Users & teams management with per-user VM count and utilization.
- Real-time status and metric updates (polling or WebSocket-simulated).
- Per-VM drill-down with more detailed metrics or activity log.
- Dark mode, empty/loading/error states polished throughout, keyboard accessibility.

---

## 5. Design Requirements

- Modern, clean, and **functional** — this is a tool people use all day; clarity and speed beat decoration.
- A clear visual and navigational distinction between the **developer** and **admin** experiences.
- Thoughtful information hierarchy for data-dense views (tables, metrics, charts).
- Handle the full set of states: loading, empty, error, and in-progress transitions (e.g. a VM that is "starting").
- Responsive and reasonably accessible (semantic markup, focus states, color contrast).

---

## 6. Technical Guidelines

- **Stack**: You're welcome to use any modern tech stack you're fluent in — tell us what you chose and why.
- **Backend integration is part of the exercise.** Don't hardcode data inside components. Build a real data layer (e.g. a typed API client + a data-fetching layer such as TanStack Query) talking to a **mock backend**. Use whatever you like for the mock — MSW, `json-server`, a small Express stub, or static JSON served behind an async client. We want to see loading/error/empty states handled as if the data were real.
- Use a charting library of your choice for utilization visualizations (e.g. Recharts, Visx, Tremor).
- TypeScript types/interfaces for your domain models.

### Suggested data shapes

Starter shapes to save you time — adjust freely.

```ts
type VMStatus = "running" | "stopped" | "starting" | "stopping" | "error";

interface VM {
  id: string;
  name: string;
  ownerId: string;
  templateId: string;
  status: VMStatus;
  region: string;

  // Timestamps
  createdAt: string;             // ISO timestamp
  startedAt: string | null;
  lastActiveAt: string;          // for idle detection

  // Current resource usage
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  diskUsagePercent: number;

  // Cost
  hourlyCost: number;            // USD
}

interface VMTemplate {
  id: string;
  name: string;
  description: string;
  baseImage: string;             // e.g. "ubuntu-22.04"
  vCpu: number;                  // number of vCPU cores, e.g. 4, 8, 16
  memoryGb: number;              // RAM in GB, e.g. 8, 16, 32
  diskSizeGb: number;            // disk in GB, e.g. 50, 100, 200
  preinstalledTools: string[];   // e.g. ["vscode-server", "docker", "node"]
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "engineer" | "admin";
  vmCount: number;
}

interface Policy {
  id: string;
  name: string;
  maxVmsPerUser: number;
  idleTimeoutMinutes: number;    // auto-stop after this much idle time
  allowedTemplateIds: string[];
  appliesToTeam?: string;
  createdAt: string;
}

// Powers the admin "Fleet utilization" view
interface FleetUtilization {
  period: string;                // "real-time" | "last-24-hours" | "last-30-days"

  // Counts
  totalVms: number;
  runningVms: number;
  stoppedVms: number;
  totalUsers: number;

  // Aggregate utilization (right now)
  avgCpuUtilizationPercent: number;
  peakCpuUtilizationPercent: number;
  avgMemoryUtilizationPercent: number;
  peakMemoryUtilizationPercent: number;

  // Cost
  totalHourlyCost: number;       // USD/hour
  monthToDateCost: number;       // USD
  projectedMonthlyCost: number;  // USD

  // Trend for charting
  utilizationTrend: {
    timestamp: string;
    cpuPercent: number;
    memoryPercent: number;
    runningVms: number;
  }[];

  // Per-VM snapshot for the inventory view
  vmMetrics: {
    vmId: string;
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
    status: VMStatus;
  }[];
}
```

---

## 7. Deliverables

1. A **Git repository** (or zip) with the project and clear instructions to install and run it locally.
2. A **README** containing:
   - How to run it.
   - Your Part A thinking: how you read the brief, key decisions, and trade-offs.
   - What you'd do with more time / what you intentionally left out.
3. A URL where the app is deployed and can be played with.
4. *(Optional)* A short (2–5 min) screen recording walking through what you built and why.

---

## 8. Time Box

Please aim for roughly **4–6 hours**. We do not expect a complete product. A smaller, well-executed and well-reasoned slice is far better than a broad, half-finished one. If you run out of time, say so in the README and tell us what you'd do next.

---

## 9. How We Evaluate

| Area | What we're looking for |
|------|------------------------|
| Requirement interpretation | Sensible product decisions from an ambiguous brief; clear reasoning about developer vs. admin needs |
| UX / UI quality | Modern, functional, clear hierarchy; handles real-world states; responsive & accessible |
| Frontend implementation | Sound component structure, state management, typing, and overall front-end craft |
| Data visualization | Clear, readable charts for utilization; not overwhelming |
| Backend integration | A clean data layer with proper loading/error/empty handling — not hardcoded UI |
| Code quality | Readable, organized, consistent; reasonable tests where they add value |
| Communication | A clear README and rationale we could hand to a teammate |

---

## 10. Submission

Send us the repository link (or zip), deployed URL, and any design artifacts at **[submission email / link]**. If anything is unclear, make a reasonable assumption, note it, and proceed — that judgment is part of what we're assessing.

Good luck, and have fun with it.
