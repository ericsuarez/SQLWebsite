# SQL Server Architecture Simulator

An interactive, visual educational tool built with React, TypeScript, and Framer Motion to explore the intricate internal workings of Microsoft SQL Server.

## 🚀 Features

The simulator provides an immersive learning experience broken down into core SQL Server components:

- **Architecture Overview**: A high-level view of the relational engine, protocol layer, and storage engine interactions.
- **Storage Engine**: Visualizes page structures, extents, B-trees, allocation maps (GAM/SGAM), and Instant File Initialization (IFI) behavior.
- **Memory Operations**: Explore the Buffer Pool, Plan Cache, and memory grants for queries.
- **Query Execution**: Step-by-step insight into parsing, binding, optimization, and query plans.
- **DBA Scenarios**: Interactive diagnostic cases including blocking, deadlocks, page splits, and wait statistics. Includes context-specific T-SQL diagnostic queries spanning from SQL Server 2019 to 2025.
- **High Availability (HA)**: Visual setup of Always On Availability Groups, failover scenarios, and synchronization states.

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 + TypeScript
- **Tooling**: [Vite](https://vitejs.dev/) for lightning-fast development and optimized builds.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for modern, responsive layout and sleek glassmorphism themes.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for rich, smooth micro-interactions that make complex database operations easy to understand.
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- `npm` or `yarn`

### Installation

1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd SQLWebsite
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

- `src/components/`: Core feature modules and UI components.
  - `/Architecture`: Overview and core layers.
  - `/Storage`: Storage internals like B-Trees and Pages.
  - `/Memory`: Buffer Pool and Plan Cache.
  - `/Execution`: Query processing pipeline.
  - `/DBA`: Scenarios, metrics, and T-SQL diagnostic queries.
  - `/HA`: Always On Availability Groups visualization.
- `src/contexts/`: React Contexts (e.g., Theme, SQL Version tracking).
- `src/i18n/`: Internationalization support.

## 📝 License

This project is licensed under the MIT License.
