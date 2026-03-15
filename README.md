# SQLLab.dev - Learn, Labs, Diagnose

![SQLLab.dev](./screenshots/1.png)

SQLLab.dev is an interactive learning and troubleshooting platform for Microsoft SQL Server internals.

It is not a live admin console and it is not a toy architecture demo. It is a visual, client-side training environment built to help engineers understand how the engine behaves, practice incident handling, and diagnose production-style problems without touching a real instance.

Live demo: [sqllab.dev](https://sqllab.dev/)

---

## Product Shape

SQLLab is now organized around three clear product paths:

### Learn
Build the mental model first.

- Architecture, engine layers, and system databases
- Storage engine, pages, extents, IAM, and recovery basics
- Buffer Pool, memory clerks, grants, and max/min memory
- Query execution, optimizer choices, plan operators, and indexes
- SQLOS, waits, PerfMon, and host-level configuration
- Advanced internals such as transaction log, VLFs, TempDB, replication, and version history

### Labs
Practice by watching the engine react.

- Guided incident drills
- Optimizer and execution plan labs
- TLog and VLF interactive flows
- TempDB and advanced I/O simulations
- SQL Agent maintenance and health-check labs
- Fullscreen "play" views focused on query, evidence, and DBA action

### Diagnose
Go straight to triage, evidence, and response.

- Quick incident queries
- Extended Events capture flows
- Real cases and postmortem scenarios
- Jobs as operational runbooks
- OS and platform checklists
- HA/DR response paths

### Expert Mode: Library
`Library` exists as an expert-mode catalog for people who already know where they want to go. It is intentionally secondary to the three main journeys above.

---

## Core Promise

The landing and product structure are designed to answer three questions quickly:

1. What is this?
   A visual SQL Server learning and troubleshooting platform.
2. What is it not?
   Not a production console and not a direct connection to your database.
3. Where do I start?
   Learn, Labs, or Diagnose.

That clarity matters more than having a long feature list.

---

## What You Can Explore

Current coverage includes:

- Relational engine and query pipeline
- Optimizer behavior and plan operators
- Storage engine internals and index structures
- Memory operations and clerks
- SQLOS scheduling, waits, and workers
- PerfMon interpretation
- OS-level configuration and virtualization pitfalls
- Transaction log internals and VLF behavior
- TempDB allocation and advanced I/O paths
- Modern SQL Server features
- Replication internals
- Version and release history
- Jobs, maintenance strategy, and health checks
- Extended Events
- Quick triage query packs
- Real-world DBA scenarios and postmortems

---

## Why This Exists

A lot of SQL Server content explains what to run.
SQLLab focuses on helping you understand why the engine behaves the way it does.

Examples:

- Why a `Key Lookup` becomes expensive
- Why `WRITELOG` changes commit latency
- Why TempDB can hurt even when disk looks fine
- Why a plan is reused when it should not be
- Why waits, counters, and XE evidence tell different parts of the same story

The goal is to train instinct, not just copy-paste scripts.

---

## Technical Approach

This project uses a modern frontend stack to simulate engine behavior entirely in the browser:

- React 19 and TypeScript
- Framer Motion
- Tailwind CSS
- i18n support for English and Spanish
- Context-based shared state
- Route-based navigation for `Learn`, `Labs`, `Diagnose`, and expert `Library`

The current product phase is intentionally client-side first:

- no live SQL Server connection
- no destructive operations
- no production credentials required

That keeps the experience safe, fast, and inexpensive while still delivering useful DBA training.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. `git clone https://github.com/ericsuarez/SQLWebsite.git`
2. `cd SQLWebsite`
3. `npm install`
4. `npm run dev`

### Production Build

- `npm run build`

---

## Roadmap Direction

The current direction is:

1. Make the landing extremely clear
2. Keep the main product paths obvious: Learn, Labs, Diagnose
3. Treat Library as expert access, not as the emotional center of the product
4. Expand simulated labs before introducing heavier backend infrastructure
5. Add static analysis of SQL artifacts such as execution plans and XE files before considering controlled real-engine interaction

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
