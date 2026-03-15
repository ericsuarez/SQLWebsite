import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
  type NavigateFunction,
} from 'react-router-dom';
import { MarketingLayout } from './components/Layout/MarketingLayout';
import { RootLayout } from './components/Layout/RootLayout';
import {
  SURFACE_DEFINITIONS,
  buildModulePath,
  getModuleDefinition,
  moduleSupportsSurface,
  type ModuleId,
  type SurfaceId,
} from './components/Layout/moduleCatalog';
import { PhaseZeroLanding } from './components/PhaseZero/PhaseZeroLanding';
import { SurfaceHubPage } from './components/PhaseZero/SurfaceHubPage';

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
  'incident-labs': lazyNamed(() => import('./components/DBA/IncidentDecisionLab'), 'IncidentDecisionLab'),
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
    <div className="glass-panel relative flex min-h-[320px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      <div className="z-10 p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-teal-300" />
        <h2 className="bg-gradient-to-r from-white to-white/50 bg-clip-text text-3xl font-bold capitalize text-transparent">
          {currentModule.replace(/-/g, ' ')}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-white/55">Loading interactive module content...</p>
      </div>
    </div>
  );
}

function navigateToModule(
  navigate: NavigateFunction,
  surface: SurfaceId,
  moduleId: ModuleId,
  replace = false,
) {
  const module = getModuleDefinition(moduleId);
  if (!module) {
    navigate(SURFACE_DEFINITIONS[surface].route, { replace });
    return;
  }

  const targetSurface = moduleSupportsSurface(module, surface) ? surface : module.primaryHome;
  navigate(buildModulePath(targetSurface, module.id, { view: module.defaultSubview, mode: module.defaultMode }), { replace });
}

function WorkspaceModuleRoute({ surface }: { surface: SurfaceId }) {
  const navigate = useNavigate();
  const params = useParams();
  const routeModuleId = params.moduleId as ModuleId | undefined;
  const moduleDefinition = routeModuleId ? getModuleDefinition(routeModuleId) : undefined;

  if (!routeModuleId || !moduleDefinition) {
    return <Navigate to={SURFACE_DEFINITIONS[surface].route} replace />;
  }

  if (!moduleSupportsSurface(moduleDefinition, surface)) {
    return (
      <Navigate
        to={buildModulePath(moduleDefinition.primaryHome, moduleDefinition.id, {
          view: moduleDefinition.defaultSubview,
          mode: moduleDefinition.defaultMode,
        })}
        replace
      />
    );
  }

  const ActiveModule = MODULE_COMPONENTS[moduleDefinition.id];

  return (
    <RootLayout
      currentSurface={surface}
      currentModule={moduleDefinition.id}
      onSurfaceChange={(nextSurface) => navigate(SURFACE_DEFINITIONS[nextSurface].route)}
      onModuleChange={(nextModule) => navigateToModule(navigate, surface, nextModule)}
      onNavigateToModule={(nextSurface, nextModule) => navigateToModule(navigate, nextSurface, nextModule)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${surface}-${moduleDefinition.id}`}
          initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
          transition={{ duration: 0.3 }}
          className="min-h-full w-full"
        >
          <Suspense fallback={<ModuleFallback currentModule={moduleDefinition.id} />}>
            <ActiveModule />
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </RootLayout>
  );
}

function LegacyLibraryRedirect() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const routeModuleId = params.moduleId as ModuleId | undefined;
  const moduleDefinition = routeModuleId ? getModuleDefinition(routeModuleId) : undefined;

  if (!routeModuleId || !moduleDefinition) {
    return <Navigate to={SURFACE_DEFINITIONS.learn.route} replace />;
  }

  return (
    <Navigate
      to={buildModulePath(moduleDefinition.primaryHome, moduleDefinition.id, {
        view: searchParams.get('view') ?? moduleDefinition.defaultSubview,
        mode: searchParams.get('mode') ?? moduleDefinition.defaultMode,
      })}
      replace
    />
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <MarketingLayout>
            <PhaseZeroLanding />
          </MarketingLayout>
        }
      />

      <Route path="/learn" element={<RootLayoutShell surface="learn" />} />
      <Route path="/labs" element={<RootLayoutShell surface="labs" />} />
      <Route path="/diagnose" element={<RootLayoutShell surface="diagnose" />} />

      <Route path="/learn/:moduleId" element={<WorkspaceModuleRoute surface="learn" />} />
      <Route path="/labs/:moduleId" element={<WorkspaceModuleRoute surface="labs" />} />
      <Route path="/diagnose/:moduleId" element={<WorkspaceModuleRoute surface="diagnose" />} />
      <Route path="/library" element={<Navigate to="/learn" replace />} />
      <Route path="/library/:moduleId" element={<LegacyLibraryRedirect />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RootLayoutShell({ surface }: { surface: SurfaceId }) {
  const navigate = useNavigate();

  return (
    <RootLayout
      currentSurface={surface}
      currentModule={null}
      onSurfaceChange={(nextSurface) => navigate(SURFACE_DEFINITIONS[nextSurface].route)}
      onModuleChange={(nextModule) => navigateToModule(navigate, surface, nextModule)}
      onNavigateToModule={(nextSurface, nextModule) => navigateToModule(navigate, nextSurface, nextModule)}
    >
      <SurfaceHubPage surface={surface} />
    </RootLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
