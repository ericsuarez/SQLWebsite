import {
  BookOpen,
  Cpu,
  Database,
  FileSearch,
  FileWarning,
  FlaskConical,
  GitBranch,
  HardDrive,
  History,
  Radar,
  Server,
  Settings,
  Shield,
  Siren,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { TranslationKey } from '../../i18n/translations';

export type ModuleId =
  | 'architecture'
  | 'storage'
  | 'memory'
  | 'execution'
  | 'jobs'
  | 'incident-labs'
  | 'incident-queries'
  | 'ha'
  | 'indexes'
  | 'realcases'
  | 'xevents'
  | 'osconfig'
  | 'perfmon'
  | 'sqlos'
  | 'modern'
  | 'tlog-internals'
  | 'tempdb-io'
  | 'replication'
  | 'version-history';

export type SurfaceId = 'learn' | 'labs' | 'diagnose' | 'library';
export type LearnLevel = 1 | 2 | 3 | null;
export type LibraryGroupId = 'engine' | 'operations' | 'internals';

export interface LocalizedText {
  en: string;
  es: string;
}

export interface ModuleDefinition {
  id: ModuleId;
  titleKey: TranslationKey;
  icon: LucideIcon;
  color: string;
  aliases: string[];
  summary: LocalizedText;
  primaryHome: Exclude<SurfaceId, 'library'>;
  availableIn: SurfaceId[];
  libraryGroup: LibraryGroupId;
  level: LearnLevel;
  defaultSubview?: string;
  defaultMode?: string;
}

export interface SurfaceDefinition {
  id: SurfaceId;
  title: LocalizedText;
  kicker: LocalizedText;
  description: LocalizedText;
  route: `/${SurfaceId}` | '/';
  icon: LucideIcon;
  chipClassName: string;
  cardClassName: string;
  textClassName: string;
}

export interface SurfaceSectionDefinition {
  id: string;
  surface: SurfaceId;
  label: LocalizedText;
  description: LocalizedText;
  moduleIds: ModuleId[];
  level?: Exclude<LearnLevel, null>;
  xp?: number;
}

export interface LibraryGroupDefinition {
  id: LibraryGroupId;
  label: LocalizedText;
}

export const SURFACE_DEFINITIONS: Record<SurfaceId, SurfaceDefinition> = {
  learn: {
    id: 'learn',
    title: { en: 'Learn', es: 'Aprende' },
    kicker: { en: 'Learning Route', es: 'Ruta de Aprendizaje' },
    description: {
      en: 'Build the mental model first: engine, memory, execution, waits, and internals with a guided order.',
      es: 'Construye primero el mapa mental: motor, memoria, ejecución, waits e internals en un orden guiado.',
    },
    route: '/learn',
    icon: BookOpen,
    chipClassName: 'border-teal-500/25 bg-teal-500/10 text-teal-200',
    cardClassName: 'border-teal-500/20 bg-teal-500/10',
    textClassName: 'text-teal-300',
  },
  labs: {
    id: 'labs',
    title: { en: 'Practice', es: 'Practica' },
    kicker: { en: 'Interactive Labs', es: 'Laboratorios Interactivos' },
    description: {
      en: 'Use guided simulations and fullscreen play views to watch what the engine is doing under pressure.',
      es: 'Usa simulaciones guiadas y vistas play para ver qué está haciendo el motor bajo presión.',
    },
    route: '/labs',
    icon: FlaskConical,
    chipClassName: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
    cardClassName: 'border-amber-500/20 bg-amber-500/10',
    textClassName: 'text-amber-300',
  },
  diagnose: {
    id: 'diagnose',
    title: { en: 'Diagnose', es: 'Diagnostica' },
    kicker: { en: 'Triage & Evidence', es: 'Triage y Evidencia' },
    description: {
      en: 'Jump straight into queries, XE, postmortems, and operational checklists when an incident is already live.',
      es: 'Salta directo a queries, XE, postmortems y checklists operativos cuando la incidencia ya está en marcha.',
    },
    route: '/diagnose',
    icon: Radar,
    chipClassName: 'border-lime-500/25 bg-lime-500/10 text-lime-200',
    cardClassName: 'border-lime-500/20 bg-lime-500/10',
    textClassName: 'text-lime-300',
  },
  library: {
    id: 'library',
    title: { en: 'Library', es: 'Biblioteca' },
    kicker: { en: 'Full Catalog', es: 'Catálogo Completo' },
    description: {
      en: 'Expert access to the full module catalog without the guided order.',
      es: 'Acceso experto al catálogo completo de módulos sin pasar por la ruta guiada.',
    },
    route: '/library',
    icon: Database,
    chipClassName: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200',
    cardClassName: 'border-cyan-500/20 bg-cyan-500/10',
    textClassName: 'text-cyan-300',
  },
};

export const LIBRARY_GROUPS: LibraryGroupDefinition[] = [
  {
    id: 'engine',
    label: { en: 'Engine Core', es: 'Core del Motor' },
  },
  {
    id: 'operations',
    label: { en: 'Operations & DBA', es: 'Operaciones y DBA' },
  },
  {
    id: 'internals',
    label: { en: 'Internals & Evolution', es: 'Internals y Evolución' },
  },
];

export const MODULES: ModuleDefinition[] = [
  {
    id: 'architecture',
    titleKey: 'architectureOverview',
    icon: Server,
    color: 'text-teal-300',
    aliases: ['architecture', 'overview', 'layers', 'arquitectura', 'capas'],
    summary: {
      en: 'How SQL Server is layered, which system databases exist, and how files fit together.',
      es: 'Cómo se organiza SQL Server por capas, qué bases de sistema existen y cómo encajan los ficheros.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'library'],
    libraryGroup: 'engine',
    level: 1,
  },
  {
    id: 'storage',
    titleKey: 'storageEngine',
    icon: HardDrive,
    color: 'text-emerald-300',
    aliases: ['storage', 'engine', 'pages', 'iam', 'extents', 'almacenamiento', 'paginas'],
    summary: {
      en: 'Pages, extents, files, recovery, and the physical behavior of the storage engine.',
      es: 'Páginas, extents, ficheros, recovery y el comportamiento físico del motor de almacenamiento.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'library'],
    libraryGroup: 'engine',
    level: 1,
  },
  {
    id: 'memory',
    titleKey: 'memoryOperations',
    icon: Cpu,
    color: 'text-teal-200',
    aliases: ['memory', 'buffer pool', 'clerks', 'max memory', 'min memory', 'memoria'],
    summary: {
      en: 'Buffer Pool, clerks, grants, and memory configuration from the engine point of view.',
      es: 'Buffer Pool, clerks, grants y configuración de memoria desde la visión del motor.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'library'],
    libraryGroup: 'engine',
    level: 1,
  },
  {
    id: 'execution',
    titleKey: 'queryExecution',
    icon: Settings,
    color: 'text-amber-300',
    aliases: ['execution', 'query', 'plan', 'optimizer', 'key lookup', 'ejecucion', 'consulta'],
    summary: {
      en: 'Execution pipeline, optimizer choices, DMVs, and plan operators.',
      es: 'Pipeline de ejecución, decisiones del optimizador, DMVs y operadores del plan.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'labs', 'library'],
    libraryGroup: 'engine',
    level: 2,
    defaultSubview: 'optimizer',
  },
  {
    id: 'indexes',
    titleKey: 'indexVisualizer',
    icon: BookOpen,
    color: 'text-lime-300',
    aliases: ['index', 'indexes', 'btree', 'clustered', 'nci', 'indice', 'indices'],
    summary: {
      en: 'Clustered vs nonclustered indexes, lookups, coverage, fragmentation, and read cost.',
      es: 'Índices clustered y nonclustered, lookups, cobertura, fragmentación y coste de lectura.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'library'],
    libraryGroup: 'engine',
    level: 2,
  },
  {
    id: 'perfmon',
    titleKey: 'tabPerfMon',
    icon: Cpu,
    color: 'text-amber-300',
    aliases: ['perfmon', 'counters', 'monitoring', 'telemetry', 'rendimiento'],
    summary: {
      en: 'Counter baselines for CPU, memory, and I/O when the instance starts to hurt.',
      es: 'Baselines de contadores para CPU, memoria e I/O cuando la instancia empieza a doler.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'diagnose', 'library'],
    libraryGroup: 'operations',
    level: 2,
  },
  {
    id: 'sqlos',
    titleKey: 'tabSqlOs',
    icon: Database,
    color: 'text-cyan-300',
    aliases: ['sqlos', 'scheduler', 'workers', 'waits', 'sqldk', 'scheduler'],
    summary: {
      en: 'Schedulers, waits, workers, synchronization, and the SQLOS mental model.',
      es: 'Schedulers, waits, workers, sincronización y el mapa mental de SQLOS.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'library'],
    libraryGroup: 'operations',
    level: 2,
  },
  {
    id: 'osconfig',
    titleKey: 'tabOsConfig',
    icon: Server,
    color: 'text-orange-300',
    aliases: ['os', 'windows', 'lpim', 'ifi', 'power plan', 'configuracion os'],
    summary: {
      en: 'The host layer: virtualization, IFI, LPIM, power plan, and other hidden bottlenecks.',
      es: 'La capa host: virtualización, IFI, LPIM, power plan y otros cuellos invisibles.',
    },
    primaryHome: 'diagnose',
    availableIn: ['learn', 'labs', 'diagnose', 'library'],
    libraryGroup: 'operations',
    level: 2,
  },
  {
    id: 'tlog-internals',
    titleKey: 'tabTlogInternals',
    icon: FileWarning,
    color: 'text-amber-300',
    aliases: ['transaction log', 'vlf', 'writelog', 'wal', 'log de transacciones'],
    summary: {
      en: 'WAL, log flush, VLF shape, and why commit latency lives on the log path.',
      es: 'WAL, log flush, forma de los VLF y por qué la latencia del commit vive en la ruta del log.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'labs', 'library'],
    libraryGroup: 'internals',
    level: 3,
    defaultSubview: 'flow',
  },
  {
    id: 'tempdb-io',
    titleKey: 'tabTempdbIo',
    icon: HardDrive,
    color: 'text-rose-300',
    aliases: ['tempdb', 'pfs', 'gam', 'sgam', 'checkpoint', 'lazy writer', 'io'],
    summary: {
      en: 'TempDB allocation pain, I/O baselines, checkpoint bursts, and lazy writer behavior.',
      es: 'Dolor de asignación en TempDB, baselines de I/O, ráfagas de checkpoint y comportamiento de lazy writer.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'labs', 'library'],
    libraryGroup: 'internals',
    level: 3,
    defaultSubview: 'tempdb',
  },
  {
    id: 'modern',
    titleKey: 'tabModern',
    icon: Zap,
    color: 'text-lime-300',
    aliases: ['modern', 'adr', 'iqp', 'ledger', 'features', 'caracteristicas modernas'],
    summary: {
      en: 'ADR, IQP, Hekaton, SQLPAL, and what changed in modern SQL Server releases.',
      es: 'ADR, IQP, Hekaton, SQLPAL y qué cambió en las versiones modernas de SQL Server.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'library'],
    libraryGroup: 'internals',
    level: 3,
  },
  {
    id: 'replication',
    titleKey: 'tabReplication',
    icon: GitBranch,
    color: 'text-teal-300',
    aliases: ['replication', 'publisher', 'subscriber', 'distributor', 'replicacion'],
    summary: {
      en: 'Publisher, distributor, subscriber, and the main replication topologies.',
      es: 'Publisher, distributor, subscriber y las topologías principales de replicación.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'library'],
    libraryGroup: 'internals',
    level: 3,
  },
  {
    id: 'version-history',
    titleKey: 'tabVersionHistory',
    icon: History,
    color: 'text-lime-300',
    aliases: ['version', 'history', 'release', 'cu', 'gdr', 'sp', 'historia'],
    summary: {
      en: 'Version lineage, release history, servicing branches, and why some features matter.',
      es: 'Linaje de versiones, historia de releases, ramas de servicing y por qué importan algunas features.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'library'],
    libraryGroup: 'internals',
    level: 3,
  },
  {
    id: 'ha',
    titleKey: 'highAvailability',
    icon: Shield,
    color: 'text-cyan-300',
    aliases: ['ha', 'dr', 'always on', 'availability group', 'alta disponibilidad'],
    summary: {
      en: 'Always On, commit modes, sync lag, and the DBA runbook for HA/DR incidents.',
      es: 'Always On, modos de commit, sync lag y el runbook DBA para incidencias de HA/DR.',
    },
    primaryHome: 'diagnose',
    availableIn: ['learn', 'diagnose', 'library'],
    libraryGroup: 'operations',
    level: 3,
  },
  {
    id: 'incident-labs',
    titleKey: 'tabIncidentLabs',
    icon: FlaskConical,
    color: 'text-amber-300',
    aliases: ['labs', 'incident lab', 'decision lab', 'triage lab', 'runbook', 'laboratorios', 'casos guiados'],
    summary: {
      en: 'Guided incident drills focused on suspicion, proof, and the next DBA move.',
      es: 'Drills guiados de incidencia centrados en sospecha, prueba y siguiente paso DBA.',
    },
    primaryHome: 'labs',
    availableIn: ['labs', 'library'],
    libraryGroup: 'operations',
    level: null,
    defaultMode: 'play',
  },
  {
    id: 'jobs',
    titleKey: 'tabIndustryJobs',
    icon: Wrench,
    color: 'text-orange-300',
    aliases: ['jobs', 'sql agent', 'ola hallengren', 'brent ozar', 'blitz', 'mantenimiento'],
    summary: {
      en: 'Maintenance, health checks, and operational habits around SQL Agent jobs.',
      es: 'Mantenimiento, health checks y hábitos operativos alrededor de SQL Agent jobs.',
    },
    primaryHome: 'diagnose',
    availableIn: ['labs', 'diagnose', 'library'],
    libraryGroup: 'operations',
    level: null,
    defaultMode: 'play',
  },
  {
    id: 'incident-queries',
    titleKey: 'tabIncidentQueries',
    icon: FileSearch,
    color: 'text-lime-300',
    aliases: ['quick queries', 'triage', 'blockers', 'waits', 'cpu', 'grants', 'incidencias', 'queries rapidas'],
    summary: {
      en: 'Ready-to-run triage packs for blockers, CPU, waits, memory, TempDB, log, and AG issues.',
      es: 'Packs de triage listos para blockers, CPU, waits, memoria, TempDB, log y problemas de AG.',
    },
    primaryHome: 'diagnose',
    availableIn: ['diagnose', 'library'],
    libraryGroup: 'operations',
    level: null,
    defaultSubview: 'detect',
    defaultMode: 'play',
  },
  {
    id: 'xevents',
    titleKey: 'tabXEvents',
    icon: Radar,
    color: 'text-cyan-300',
    aliases: ['xevents', 'extended events', 'xe', 'attention', 'deadlock graph', 'blocked process', 'event file'],
    summary: {
      en: 'Capture what DMVs miss: blocked process, deadlock graphs, attention, and durable evidence.',
      es: 'Captura lo que las DMVs no ven: blocked process, deadlock graphs, attention y evidencia duradera.',
    },
    primaryHome: 'diagnose',
    availableIn: ['diagnose', 'library'],
    libraryGroup: 'operations',
    level: null,
    defaultMode: 'play',
  },
  {
    id: 'realcases',
    titleKey: 'realCasesTitle',
    icon: Siren,
    color: 'text-rose-300',
    aliases: ['real cases', 'incidents', 'postmortem', 'casos reales', 'incidentes'],
    summary: {
      en: 'Cross-layer postmortems to read the full incident from symptom to operational response.',
      es: 'Postmortems transversales para leer la incidencia completa desde el síntoma hasta la respuesta operativa.',
    },
    primaryHome: 'diagnose',
    availableIn: ['diagnose', 'library'],
    libraryGroup: 'operations',
    level: null,
  },
];

export const SURFACE_SECTIONS: Record<SurfaceId, SurfaceSectionDefinition[]> = {
  learn: [
    {
      id: 'level-1',
      surface: 'learn',
      label: { en: 'Level 1 · Engine Fundamentals', es: 'Nivel 1 · Fundamentos del motor' },
      description: {
        en: 'Start with the shape of SQL Server before diving into advanced diagnostics.',
        es: 'Empieza por la forma de SQL Server antes de entrar en el diagnóstico avanzado.',
      },
      moduleIds: ['architecture', 'storage', 'memory', 'execution'],
      level: 1,
      xp: 240,
    },
    {
      id: 'level-2',
      surface: 'learn',
      label: { en: 'Level 2 · Performance & Design', es: 'Nivel 2 · Rendimiento y diseño' },
      description: {
        en: 'Plan shape, indexes, waits, counters, and the host settings that change behavior.',
        es: 'Forma del plan, índices, waits, contadores y ajustes del host que cambian el comportamiento.',
      },
      moduleIds: ['indexes', 'execution', 'sqlos', 'perfmon', 'osconfig'],
      level: 2,
      xp: 420,
    },
    {
      id: 'level-3',
      surface: 'learn',
      label: { en: 'Level 3 · Advanced Internals', es: 'Nivel 3 · Internals avanzados' },
      description: {
        en: 'Recovery, TempDB, replication, version history, and the internals that explain edge behavior.',
        es: 'Recovery, TempDB, replicación, historia de versiones e internals que explican el comportamiento límite.',
      },
      moduleIds: ['tlog-internals', 'tempdb-io', 'modern', 'replication', 'version-history', 'ha'],
      level: 3,
      xp: 610,
    },
  ],
  labs: [
    {
      id: 'guided-incidents',
      surface: 'labs',
      label: { en: 'Guided Incident Labs', es: 'Laboratorios guiados de incidencias' },
      description: {
        en: 'Work from symptom to proof without leaving the play view.',
        es: 'Trabaja del síntoma a la prueba sin salir de la vista play.',
      },
      moduleIds: ['incident-labs', 'execution'],
    },
    {
      id: 'engine-labs',
      surface: 'labs',
      label: { en: 'Engine Internals Labs', es: 'Labs de internals del motor' },
      description: {
        en: 'Visual flows for log, TempDB, and host pain points.',
        es: 'Flujos visuales para log, TempDB y cuellos del host.',
      },
      moduleIds: ['tlog-internals', 'tempdb-io', 'osconfig'],
    },
    {
      id: 'dba-labs',
      surface: 'labs',
      label: { en: 'DBA Practice Labs', es: 'Labs de práctica DBA' },
      description: {
        en: 'Maintenance decisions, runbooks, and operational practice.',
        es: 'Decisiones de mantenimiento, runbooks y práctica operativa.',
      },
      moduleIds: ['jobs'],
    },
  ],
  diagnose: [
    {
      id: 'triage',
      surface: 'diagnose',
      label: { en: 'Fast Triage', es: 'Triage rápido' },
      description: {
        en: 'Start with the smallest proof that isolates the symptom.',
        es: 'Empieza por la prueba mínima que aísla el síntoma.',
      },
      moduleIds: ['incident-queries', 'perfmon', 'osconfig'],
    },
    {
      id: 'evidence',
      surface: 'diagnose',
      label: { en: 'Evidence & Capture', es: 'Evidencia y captura' },
      description: {
        en: 'Persist what disappears from live DMVs when the incident clears itself.',
        es: 'Persiste lo que desaparece de las DMVs vivas cuando la incidencia se limpia sola.',
      },
      moduleIds: ['xevents', 'realcases'],
    },
    {
      id: 'operations',
      surface: 'diagnose',
      label: { en: 'Operational Response', es: 'Respuesta operativa' },
      description: {
        en: 'Jobs, HA/DR, and platform checks to turn evidence into action.',
        es: 'Jobs, HA/DR y comprobaciones de plataforma para convertir evidencia en acción.',
      },
      moduleIds: ['jobs', 'ha'],
    },
  ],
  library: LIBRARY_GROUPS.map((group) => ({
    id: group.id,
    surface: 'library',
    label: group.label,
    description:
      group.id === 'engine'
        ? {
            en: 'Core engine concepts and plan behavior.',
            es: 'Conceptos del motor y comportamiento de planes.',
          }
        : group.id === 'operations'
        ? {
            en: 'DBA operations, triage, and platform controls.',
            es: 'Operación DBA, triage y controles de plataforma.',
          }
        : {
            en: 'Advanced internals, evolution, and storage paths.',
            es: 'Internals avanzados, evolución y rutas de almacenamiento.',
          },
    moduleIds: MODULES.filter((module) => module.libraryGroup === group.id).map((module) => module.id),
  })),
};

export const ALL_MODULES = MODULES;

export function normalizeSearchValue(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getModuleDefinition(moduleId: ModuleId) {
  return MODULES.find((module) => module.id === moduleId);
}

export function moduleSupportsSurface(module: ModuleDefinition, surface: SurfaceId) {
  return module.availableIn.includes(surface);
}

export function modulesForSurface(surface: SurfaceId) {
  return MODULES.filter((module) => moduleSupportsSurface(module, surface));
}

export function getPrimarySectionForModule(moduleId: ModuleId) {
  const module = getModuleDefinition(moduleId);
  if (!module) {
    return undefined;
  }

  return SURFACE_SECTIONS[module.primaryHome].find((section) => section.moduleIds.includes(moduleId));
}

export function buildModulePath(
  surface: SurfaceId,
  moduleId?: ModuleId,
  options?: { view?: string; mode?: string }
) {
  const base = moduleId ? `/${surface}/${moduleId}` : `/${surface}`;
  const search = new URLSearchParams();

  if (options?.view) {
    search.set('view', options.view);
  }

  if (options?.mode) {
    search.set('mode', options.mode);
  }

  const query = search.toString();
  return query ? `${base}?${query}` : base;
}
