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

export type SurfaceId = 'learn' | 'labs' | 'diagnose';
export type LearnLevel = 1 | 2 | 3 | null;
export type ModuleGroupId = 'engine' | 'operations' | 'internals';

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
  primaryHome: SurfaceId;
  availableIn: SurfaceId[];
  group: ModuleGroupId;
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
  goal: LocalizedText;
  outcome: LocalizedText;
  moduleIds: ModuleId[];
  level?: Exclude<LearnLevel, null>;
  xp?: number;
}

export interface SurfaceGuideDefinition {
  title: LocalizedText;
  intro: LocalizedText;
  coaching: LocalizedText;
  startLabel: LocalizedText;
  continueLabel: LocalizedText;
  completeLabel: LocalizedText;
}

export const SURFACE_DEFINITIONS: Record<SurfaceId, SurfaceDefinition> = {
  learn: {
    id: 'learn',
    title: { en: 'Learn', es: 'Aprende' },
    kicker: { en: 'Academy', es: 'Academia' },
    description: {
      en: 'Build the mental model first: engine, storage, memory, execution, waits, and advanced internals in order.',
      es: 'Construye primero el mapa mental: motor, almacenamiento, memoria, ejecucion, waits e internals avanzados en orden.',
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
    kicker: { en: 'Labs', es: 'Labs' },
    description: {
      en: 'Use guided simulations and play views to watch what the engine is doing under pressure.',
      es: 'Usa simulaciones guiadas y vistas play para ver que esta haciendo el motor bajo presion.',
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
    kicker: { en: 'Triage & Response', es: 'Triage y Respuesta' },
    description: {
      en: 'Jump into queries, evidence capture, real cases, and operational response when an incident is already live.',
      es: 'Salta a queries, captura de evidencia, casos reales y respuesta operativa cuando la incidencia ya esta en marcha.',
    },
    route: '/diagnose',
    icon: Radar,
    chipClassName: 'border-lime-500/25 bg-lime-500/10 text-lime-200',
    cardClassName: 'border-lime-500/20 bg-lime-500/10',
    textClassName: 'text-lime-300',
  },
};

export const SURFACE_GUIDES: Record<SurfaceId, SurfaceGuideDefinition> = {
  learn: {
    title: { en: 'Follow the engine in order', es: 'Sigue el motor en orden' },
    intro: {
      en: 'Start with architecture and engine shape. Then move into memory and execution. Only after that go into performance and advanced internals.',
      es: 'Empieza por arquitectura y forma del motor. Luego entra en memoria y ejecucion. Solo despues baja a rendimiento e internals avanzados.',
    },
    coaching: {
      en: 'This path is here so you stop jumping between concepts that only make sense once the base model is clear.',
      es: 'Esta ruta existe para que dejes de saltar entre conceptos que solo tienen sentido cuando la base esta clara.',
    },
    startLabel: { en: 'Start academy', es: 'Empezar academia' },
    continueLabel: { en: 'Continue academy', es: 'Continuar academia' },
    completeLabel: { en: 'Finish this stage', es: 'Cerrar esta etapa' },
  },
  labs: {
    title: { en: 'Train by watching the engine react', es: 'Entrena viendo reaccionar al motor' },
    intro: {
      en: 'Read the symptom, watch the internal path, and then decide what a DBA would do next.',
      es: 'Lee el sintoma, mira la ruta interna y despues decide que haria un DBA a continuacion.',
    },
    coaching: {
      en: 'Every lab should teach suspicion, proof, and the next safe move, not just show a lot of text.',
      es: 'Cada lab debe ensenar sospecha, prueba y siguiente movimiento seguro, no solo soltar mucho texto.',
    },
    startLabel: { en: 'Start labs', es: 'Empezar labs' },
    continueLabel: { en: 'Continue labs', es: 'Continuar labs' },
    completeLabel: { en: 'Next lab block', es: 'Siguiente bloque' },
  },
  diagnose: {
    title: { en: 'Triage first, evidence second, action third', es: 'Primero triage, luego evidencia, despues accion' },
    intro: {
      en: 'Reduce noise first. Then capture what disappears. Finally decide the operational response.',
      es: 'Primero reduce ruido. Luego captura lo que desaparece. Por ultimo decide la respuesta operativa.',
    },
    coaching: {
      en: 'This route is for incidents that already exist. It should feel direct, not exploratory.',
      es: 'Esta ruta es para incidencias que ya existen. Debe sentirse directa, no exploratoria.',
    },
    startLabel: { en: 'Start triage', es: 'Empezar triage' },
    continueLabel: { en: 'Continue diagnosis', es: 'Continuar diagnostico' },
    completeLabel: { en: 'Move to response', es: 'Pasar a respuesta' },
  },
};

export const MODULES: ModuleDefinition[] = [
  {
    id: 'architecture',
    titleKey: 'architectureOverview',
    icon: Server,
    color: 'text-teal-300',
    aliases: ['architecture', 'overview', 'layers', 'arquitectura', 'capas'],
    summary: {
      en: 'How SQL Server is layered, which system databases exist, and how files fit together.',
      es: 'Como se organiza SQL Server por capas, que bases de sistema existen y como encajan los ficheros.',
    },
    primaryHome: 'learn',
    availableIn: ['learn'],
    group: 'engine',
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
      es: 'Paginas, extents, ficheros, recovery y el comportamiento fisico del motor de almacenamiento.',
    },
    primaryHome: 'learn',
    availableIn: ['learn'],
    group: 'engine',
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
      es: 'Buffer Pool, clerks, grants y configuracion de memoria desde la vision del motor.',
    },
    primaryHome: 'learn',
    availableIn: ['learn'],
    group: 'engine',
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
      es: 'Pipeline de ejecucion, decisiones del optimizador, DMVs y operadores del plan.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'labs'],
    group: 'engine',
    level: 1,
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
      es: 'Indices clustered y nonclustered, lookups, cobertura, fragmentacion y coste de lectura.',
    },
    primaryHome: 'learn',
    availableIn: ['learn'],
    group: 'engine',
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
    availableIn: ['learn', 'diagnose'],
    group: 'operations',
    level: 2,
  },
  {
    id: 'sqlos',
    titleKey: 'tabSqlOs',
    icon: Database,
    color: 'text-cyan-300',
    aliases: ['sqlos', 'scheduler', 'workers', 'waits', 'sqldk'],
    summary: {
      en: 'Schedulers, waits, workers, synchronization, and the SQLOS mental model.',
      es: 'Schedulers, waits, workers, sincronizacion y el mapa mental de SQLOS.',
    },
    primaryHome: 'learn',
    availableIn: ['learn'],
    group: 'operations',
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
      es: 'La capa host: virtualizacion, IFI, LPIM, power plan y otros cuellos invisibles.',
    },
    primaryHome: 'diagnose',
    availableIn: ['learn', 'labs', 'diagnose'],
    group: 'operations',
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
      es: 'WAL, log flush, forma de los VLF y por que la latencia del commit vive en la ruta del log.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'labs'],
    group: 'internals',
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
      es: 'Dolor de asignacion en TempDB, baselines de I/O, rafagas de checkpoint y comportamiento de lazy writer.',
    },
    primaryHome: 'learn',
    availableIn: ['learn', 'labs'],
    group: 'internals',
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
      es: 'ADR, IQP, Hekaton, SQLPAL y que cambio en las versiones modernas de SQL Server.',
    },
    primaryHome: 'learn',
    availableIn: ['learn'],
    group: 'internals',
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
      es: 'Publisher, distributor, subscriber y las topologias principales de replicacion.',
    },
    primaryHome: 'learn',
    availableIn: ['learn'],
    group: 'internals',
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
      es: 'Linaje de versiones, historia de releases, ramas de servicing y por que importan algunas features.',
    },
    primaryHome: 'learn',
    availableIn: ['learn'],
    group: 'internals',
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
    availableIn: ['learn', 'diagnose'],
    group: 'operations',
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
    availableIn: ['labs'],
    group: 'operations',
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
      es: 'Mantenimiento, health checks y habitos operativos alrededor de SQL Agent jobs.',
    },
    primaryHome: 'diagnose',
    availableIn: ['labs', 'diagnose'],
    group: 'operations',
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
    availableIn: ['diagnose'],
    group: 'operations',
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
    availableIn: ['diagnose'],
    group: 'operations',
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
      es: 'Postmortems transversales para leer la incidencia completa desde el sintoma hasta la respuesta operativa.',
    },
    primaryHome: 'diagnose',
    availableIn: ['diagnose'],
    group: 'operations',
    level: null,
  },
];

export const SURFACE_SECTIONS: Record<SurfaceId, SurfaceSectionDefinition[]> = {
  learn: [
    {
      id: 'level-1',
      surface: 'learn',
      label: { en: 'Stage 1 · Engine Fundamentals', es: 'Etapa 1 · Fundamentos del motor' },
      description: {
        en: 'Start with how SQL Server is shaped before jumping into waits or production incidents.',
        es: 'Empieza por como esta montado SQL Server antes de saltar a waits o incidencias de produccion.',
      },
      goal: {
        en: 'Understand how architecture, storage, memory, and execution fit together.',
        es: 'Entiende como encajan arquitectura, almacenamiento, memoria y ejecucion.',
      },
      outcome: {
        en: 'You finish this stage with a clean model of how a query moves through the engine.',
        es: 'Cierras esta etapa con un modelo claro de como se mueve una query por el motor.',
      },
      moduleIds: ['architecture', 'storage', 'memory', 'execution'],
      level: 1,
      xp: 240,
    },
    {
      id: 'level-2',
      surface: 'learn',
      label: { en: 'Stage 2 · Performance & Design', es: 'Etapa 2 · Rendimiento y diseno' },
      description: {
        en: 'Move into indexes, schedulers, counters, and host settings that change behavior.',
        es: 'Pasa a indices, schedulers, contadores y ajustes del host que cambian el comportamiento.',
      },
      goal: {
        en: 'Learn why shape, counters, waits, and configuration all point to the same problem from different angles.',
        es: 'Aprende por que forma, contadores, waits y configuracion apuntan al mismo problema desde angulos distintos.',
      },
      outcome: {
        en: 'You stop reading performance symptoms as isolated signals.',
        es: 'Dejas de leer los sintomas de rendimiento como senales aisladas.',
      },
      moduleIds: ['indexes', 'sqlos', 'perfmon', 'osconfig'],
      level: 2,
      xp: 420,
    },
    {
      id: 'level-3',
      surface: 'learn',
      label: { en: 'Stage 3 · Advanced Internals', es: 'Etapa 3 · Internals avanzados' },
      description: {
        en: 'Open the low-level paths that explain recovery, TempDB pain, replication, versioning, and HA behavior.',
        es: 'Abre las rutas de bajo nivel que explican recovery, dolor de TempDB, replicacion, versionado y comportamiento de HA.',
      },
      goal: {
        en: 'Understand the internals that usually feel opaque even to experienced DBAs.',
        es: 'Entiende los internals que suelen parecer opacos incluso a DBAs con experiencia.',
      },
      outcome: {
        en: 'You can explain why deep engine problems happen instead of treating them like black magic.',
        es: 'Puedes explicar por que ocurren los problemas profundos del motor en lugar de tratarlos como magia negra.',
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
      label: { en: 'Block 1 · Guided Incident Drills', es: 'Bloque 1 · Drills guiados de incidencia' },
      description: {
        en: 'Start with the symptom, then prove the suspicion, then choose the next DBA move.',
        es: 'Empieza por el sintoma, luego prueba la sospecha y despues elige el siguiente paso DBA.',
      },
      goal: {
        en: 'Train the habit of reading before fixing.',
        es: 'Entrena el habito de leer antes de arreglar.',
      },
      outcome: {
        en: 'You should be able to explain why one suspicion is stronger than another.',
        es: 'Deberias poder explicar por que una sospecha es mas fuerte que otra.',
      },
      moduleIds: ['incident-labs', 'execution'],
    },
    {
      id: 'engine-labs',
      surface: 'labs',
      label: { en: 'Block 2 · Engine Internals Labs', es: 'Bloque 2 · Labs de internals del motor' },
      description: {
        en: 'Watch the internal path when the bottleneck is in log, TempDB, or the host layer.',
        es: 'Mira la ruta interna cuando el cuello esta en log, TempDB o la capa host.',
      },
      goal: {
        en: 'See what really happens under the covers, not just the symptom.',
        es: 'Ver que pasa de verdad por debajo, no solo el sintoma.',
      },
      outcome: {
        en: 'You should connect the symptom with the internal path that produced it.',
        es: 'Deberias conectar el sintoma con la ruta interna que lo produjo.',
      },
      moduleIds: ['tlog-internals', 'tempdb-io', 'osconfig'],
    },
    {
      id: 'dba-labs',
      surface: 'labs',
      label: { en: 'Block 3 · DBA Practice', es: 'Bloque 3 · Practica DBA' },
      description: {
        en: 'Train the operational side: maintenance, runbooks, and safe day-two habits.',
        es: 'Entrena la parte operativa: mantenimiento, runbooks y habitos seguros de dia dos.',
      },
      goal: {
        en: 'Understand what a DBA automates, reviews, and never trusts blindly.',
        es: 'Entiende que automatiza un DBA, que revisa y que nunca confia a ciegas.',
      },
      outcome: {
        en: 'You finish with a stronger operational instinct, not just theory.',
        es: 'Terminas con mejor instinto operativo, no solo teoria.',
      },
      moduleIds: ['jobs'],
    },
  ],
  diagnose: [
    {
      id: 'triage',
      surface: 'diagnose',
      label: { en: 'Block 1 · Fast Triage', es: 'Bloque 1 · Triage rapido' },
      description: {
        en: 'Start with the smallest proof that isolates the symptom.',
        es: 'Empieza por la prueba minima que aisla el sintoma.',
      },
      goal: {
        en: 'Reduce noise fast and decide whether the problem smells like CPU, memory, TempDB, log, or host.',
        es: 'Reduce ruido rapido y decide si el problema huele a CPU, memoria, TempDB, log o host.',
      },
      outcome: {
        en: 'You know what to run first without opening ten tabs.',
        es: 'Sabes que lanzar primero sin abrir diez pestanas.',
      },
      moduleIds: ['incident-queries', 'perfmon', 'osconfig'],
    },
    {
      id: 'evidence',
      surface: 'diagnose',
      label: { en: 'Block 2 · Evidence & Capture', es: 'Bloque 2 · Evidencia y captura' },
      description: {
        en: 'Capture the evidence that live DMVs lose when pressure drops.',
        es: 'Captura la evidencia que las DMVs vivas pierden cuando baja la presion.',
      },
      goal: {
        en: 'Know when DMVs are enough and when you need XE or a postmortem view.',
        es: 'Saber cuando bastan las DMVs y cuando necesitas XE o una vista postmortem.',
      },
      outcome: {
        en: 'You stop losing critical evidence just because the incident cleared itself.',
        es: 'Dejas de perder evidencia critica solo porque la incidencia se limpio sola.',
      },
      moduleIds: ['xevents', 'realcases'],
    },
    {
      id: 'operations',
      surface: 'diagnose',
      label: { en: 'Block 3 · Operational Response', es: 'Bloque 3 · Respuesta operativa' },
      description: {
        en: 'Convert proof into a controlled operational response instead of an improvised fix.',
        es: 'Convierte la prueba en una respuesta operativa controlada en lugar de un fix improvisado.',
      },
      goal: {
        en: 'Close the loop after diagnosis with jobs, HA/DR, and safe action paths.',
        es: 'Cerrar el ciclo tras el diagnostico con jobs, HA/DR y rutas seguras de accion.',
      },
      outcome: {
        en: 'You understand how a DBA responds after the diagnosis is clear.',
        es: 'Entiendes como responde un DBA despues de que el diagnostico ya este claro.',
      },
      moduleIds: ['jobs', 'ha'],
    },
  ],
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

export function getPrimarySectionForModule(moduleId: ModuleId) {
  const module = getModuleDefinition(moduleId);
  if (!module) {
    return undefined;
  }

  return SURFACE_SECTIONS[module.primaryHome].find((section) => section.moduleIds.includes(moduleId));
}

export function getSectionForSurfaceModule(surface: SurfaceId, moduleId: ModuleId) {
  return SURFACE_SECTIONS[surface].find((section) => section.moduleIds.includes(moduleId));
}

export function getSurfaceSequence(surface: SurfaceId) {
  const seen = new Set<ModuleId>();
  const ordered: ModuleId[] = [];

  for (const section of SURFACE_SECTIONS[surface]) {
    for (const moduleId of section.moduleIds) {
      if (!seen.has(moduleId)) {
        seen.add(moduleId);
        ordered.push(moduleId);
      }
    }
  }

  return ordered;
}

export function getModuleStepIndex(surface: SurfaceId, moduleId: ModuleId) {
  return getSurfaceSequence(surface).findIndex((candidate) => candidate === moduleId);
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
