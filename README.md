# Ascendra Workspaces Dashboard

A take-home project for **Ascendra Workspaces** — a dashboard for managing cloud developer machines.

The product supports two different user types:

* **Developers** — manage and access their own cloud workspaces.
* **DevOps / DevEx Admins** — monitor fleet health, utilization, cost, VM inventory, and templates.

The goal was to turn a loosely defined product brief into a working dashboard with clear product decisions, mock backend integration, typed data, charts, and realistic UI states.

---

## Links

* **Repository:** https://github.com/AndreiBBN/ascendra-workspaces
* **Deployed app:** https://andreibaban.com/ascendra-workspaces
  * **Email:** `admin@admin.com`
  * **Password:** `12345`
* **Developer dashboard:** https://andreibaban.com/ascendra-workspaces/developer
* **Admin dashboard:** https://andreibaban.com/ascendra-workspaces/dashboard
* **Figma / design file:** https://www.figma.com/design/WQ5O5C6cMufkJDCkPI5X8i/Untitled?node-id=0-1&t=kcfL5JxGxWQ7GMLo-1

---

## How to run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

# Part A — Product & UX Thinking

## How I interpreted the brief

Ascendra Workspaces serves two different audiences with different goals.

Developers care about their own machines. Their main goal is to quickly see machine status, open the coding environment, and perform basic lifecycle actions like start, stop, or restart.

Admins care about the whole infrastructure. Their main goal is to understand fleet health, utilization, cost, VM inventory, and available templates.

Because of this, I separated the product into two focused experiences:

* **Developer Dashboard** — personal workspace management.
* **Admin Dashboard** — fleet-wide infrastructure visibility and control.

This keeps each experience focused instead of forcing both user types into the same generic dashboard.

---

## Developer Experience

### How I interpreted the developer side

The developer experience is focused on one main need: helping engineers access and manage their own cloud workspaces quickly.

Developers do not need fleet-wide infrastructure data. They need to know:

* which machines they have
* which machines are running or stopped
* how much CPU, memory, and disk each machine uses
* how to open the coding environment
* how to start, stop, or restart a machine

### What was implemented

Route:

```text
/developer
```

The Developer Dashboard is built around the **My Machines** view.

Implemented features:

* Summary cards
* Searchable machine list
* Status filter
* Sorting
* VM status badges
* Current CPU, memory, and disk usage
* Open in IDE action
* Start / Stop / Restart controls
* Optimistic transition states
* VM detail drawer
* CPU and memory history charts
* Template details
* VM specs
* Uptime and metadata

### Key UX decisions

I assumed developer machines already exist and are assigned to the signed-in user.

I did not include a full Create Machine flow because the brief does not clearly define whether developers create machines themselves or whether admins assign them.

I used a right-side detail drawer instead of a separate VM detail page. This keeps developers on the My Machines screen while still allowing them to inspect usage, specs, uptime, and template information.

I also added simple search, filtering, and sorting because a developer may have multiple machines and should be able to find the right one quickly.

### Developer information architecture

```text
Developer Dashboard
└── My Machines
    ├── Summary cards
    ├── Machine list
    ├── Search
    ├── Status filter
    ├── Sort controls
    ├── Open in IDE action
    ├── Start / Stop / Restart controls
    └── VM Detail drawer
        ├── CPU / memory history
        ├── Template
        ├── Specs
        ├── Uptime
        └── Metadata
```

### Key developer flows

1. **View my machines**
   This is the main developer use case.

2. **Open a machine in IDE**
   This is the fastest path from dashboard to actual work.

3. **Start / stop / restart a machine**
   These are frequent machine management actions.

4. **Inspect machine details**
   This helps developers understand resource usage and machine state without leaving the main dashboard.

---

## Admin Experience

### How I interpreted the admin side

The admin experience is focused on infrastructure visibility and control.

Admins need to understand the full workspace fleet:

* how many VMs exist
* how many are running or stopped
* how much CPU and memory is used
* how much the infrastructure costs
* which VMs are idle, underused, or heavily used
* which templates are available for creating machines

### What was implemented

The Admin area includes:

* Fleet overview dashboard
* Total VMs
* Running / stopped VMs
* Total users
* Aggregate CPU utilization
* Aggregate memory utilization
* Infrastructure cost
* Fleet utilization charts
* Hot / idle VM visibility
* VM inventory page
* Searchable and filterable VM table
* Owner, template, status, CPU, memory, and disk usage per VM
* Idle / underused VM indicators
* Templates page
* View, create, and edit VM templates

### Key UX decisions

I treated VM Inventory mainly as a monitoring and investigation view, not as a full VM CRUD area.

The brief focuses on admin visibility into fleet-wide health, utilization, cost, and templates. Because of that, I prioritized clear metrics, filtering, utilization charts, idle/high-usage indicators, and template management.

I made Templates a separate Admin page because creating and editing VM templates is clearly part of the admin core scope.

### Admin information architecture

```text
Admin
├── Dashboard / Fleet Overview
│   ├── Total VMs
│   ├── Running / stopped VMs
│   ├── Total users
│   ├── Aggregate CPU / memory
│   ├── Infrastructure cost
│   ├── Fleet utilization chart
│   └── Hot / idle VM summary
│
├── VM Inventory
│   ├── Search
│   ├── Status filter
│   ├── Template filter
│   ├── Usage state filter
│   └── VM table
│       ├── Owner
│       ├── Template
│       ├── Status
│       ├── CPU / memory / disk
│       └── Idle / underused indicator
│
└── Templates
    ├── Template list
    ├── View template
    ├── Create template
    └── Edit template
```

### Key admin flows

1. **Understand fleet health**
   Admins can quickly see VM count, running/stopped state, utilization, users, and cost.

2. **Find problematic VMs**
   Inventory filters help identify idle, underused, or high-usage machines.

3. **Review utilization trends**
   CPU and memory charts show usage over time, not only the current state.

4. **Manage templates**
   Admins can view, create, and edit VM templates that define available machine configurations.

---

# Part B — Implementation

## UI states handled

The app includes:

* Loading states
* Empty states
* Error states
* Running / stopped / starting / stopping statuses
* Disabled actions when unavailable
* Optimistic lifecycle transitions
* Dark mode
* Responsive layout patterns

---

## Time-box note

This project was completed within the suggested **4–6 hour time box**.

Because of the limited time, I focused first on covering the core product requirements for both personas, building the dashboard structure, mock API layer, charts, lifecycle actions, and key UI states.

The UI is functional and consistent, but I did not have enough time to polish every visual detail to the level I would target in a production release.

I also did not fully test every responsive breakpoint. The app includes responsive layout patterns, but with more time I would do a full desktop, tablet, and mobile QA pass.

---

## Trade-offs

The main trade-offs were:

* I prioritized core functionality and product coverage over final visual polish.
* Responsive layouts were implemented, but not fully tested across all breakpoints.
* Developer machine creation was left out because the ownership/provisioning flow was unclear.
* Admin VM CRUD was left out because the core admin scope is visibility, utilization, cost, and template management.
* Policies and quotas were treated as future scope.
* Mock data was used, but structured through an API-style layer to keep the implementation close to a real product.

---

## What I would improve with more time

* Polish the UI details: spacing, alignment, hierarchy, density, and micro-interactions.
* Fully test and refine responsive behavior on desktop, tablet, and mobile.
* Review the UX flows more deeply and optimize frequent actions.
* Add a developer Create Machine flow using admin-approved templates.
* Add policies and quotas management.
* Add users and teams management.
* Add real-time updates with polling or WebSocket simulation.
* Add per-VM activity logs.
* Add stronger form validation and automated tests.
* Add role-based authentication instead of mock navigation.

---

# Summary

This project delivers a working Ascendra Workspaces dashboard for both required personas.

Developers can manage and access their own machines.

Admins can monitor fleet health, inspect VM inventory, review utilization, track cost, and manage templates.

The implementation focuses on clear product thinking, practical UX decisions, realistic data handling, reusable UI patterns, and a coherent core experience within the time box.
