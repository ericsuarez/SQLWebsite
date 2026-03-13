import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RootLayout } from './components/Layout/RootLayout';
import type { ModuleId } from './components/Layout/Sidebar';

type ModuleComponent = LazyExoticComponent<ComponentType>;

function lazyNamed<TModule extends Record<string, ComponentType>, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey,
): ModuleComponent {
  return lazy(async () => {
    const module = await loader();
    return { default: module[exportName] };
  });
}

const MODULE_COMPONENTS: Record<ModuleId, ModuleComponent> = {
  architecture: lazyNamed(() => import('./components/Architecture/ArchitectureOverview'), 'ArchitectureOverview'),
  storage: lazyNamed(() => import('./components/Storage/StorageEngine'), 'StorageEngine'),
  memory: lazyNamed(() => import('./components/Memory/MemoryOperations'), 'MemoryOperations'),
  execution: lazyNamed(() => import('./components/Execution/QueryExecution'), 'QueryExecution'),
  jobs: lazyNamed(() => import('./components/DBA/IndustryStandardJobs'), 'IndustryStandardJobs'),
  'incident-queries': lazyNamed(() => import('./components/DBA/IncidentQuickQueries'), 'IncidentQuickQueries'),
  ha: lazyNamed(() => import('./components/HA/HighAvailability'), 'HighAvailability'),
  indexes: lazyNamed(() => import('./components/Storage/IndexVisualizer'), 'IndexVisualizer'),
  realcases: lazyNamed(() => import('./components/DBA/RealCasesPage'), 'RealCasesPage'),
  xevents: lazyNamed(() => import('./components/DBA/ExtendedEventsLab'), 'ExtendedEventsLab'),
  osconfig: lazyNamed(() => import('./components/OS/OSLevelConfig'), 'OSLevelConfig'),
  perfmon: lazyNamed(() => import('./components/PerfMon/PerfMonVisualizer'), 'PerfMonVisualizer'),
  sqlos: lazyNamed(() => import('./components/SQLOS/SQLOSDeepDive'), 'SQLOSDeepDive'),
  modern: lazyNamed(() => import('./components/Modern/ModernFeatures'), 'ModernFeatures'),
  'tlog-internals': lazyNamed(() => import('./components/Internals/TLogInternals'), 'TLogInternals'),
  'tempdb-io': lazyNamed(() => import('./components/Internals/TempDBAndIO'), 'TempDBAndIO'),
  replication: lazyNamed(() => import('./components/Internals/ReplicationInternals'), 'ReplicationInternals'),
  'version-history': lazyNamed(() => import('./components/Internals/VersionHistory'), 'VersionHistory'),
};

function ModuleFallback({ currentModule }: { currentModule: ModuleId }) {
  return (
    <div className="relative flex min-h-[320px] w-full items-center justify-center overflow-hidden rounded-2xl glass-panel">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="text-center p-8 z-10">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-white/15 border-t-primary animate-spin" />
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 capitalize">
          {currentModule.replace(/-/g, ' ')}
        </h2>
        <p className="mt-3 text-muted-foreground text-sm max-w-lg mx-auto">
          Loading interactive module content...
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <RootLayout>
      {(currentModule) => {
        const ActiveModule = MODULE_COMPONENTS[currentModule];

        return (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModule}
              initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
              transition={{ duration: 0.3 }}
              className="w-full min-h-full"
            >
              <Suspense fallback={<ModuleFallback currentModule={currentModule} />}>
                <ActiveModule />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        );
      }}
    </RootLayout>
  );
}

export default App;
