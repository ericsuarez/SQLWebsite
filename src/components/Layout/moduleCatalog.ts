import {
  BookOpen,
  Cpu,
  Database,
  FileSearch,
  FileWarning,
  GitBranch,
  HardDrive,
  History,
  Server,
  Settings,
  Shield,
  Siren,
  Radar,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { TranslationKey } from '../../i18n/translations';
import type { ModuleId } from './Sidebar';

export type ModuleGroupId = 'engine' | 'operations' | 'internals';

export interface ModuleDefinition {
  id: ModuleId;
  titleKey: TranslationKey;
  icon: LucideIcon;
  color: string;
  aliases: string[];
}

export interface ModuleGroupDefinition {
  id: ModuleGroupId;
  label: { en: string; es: string };
  modules: ModuleDefinition[];
}

export const MODULE_GROUPS: ModuleGroupDefinition[] = [
  {
    id: 'engine',
    label: { en: 'Engine Core', es: 'Core del Motor' },
    modules: [
      {
        id: 'architecture',
        titleKey: 'architectureOverview',
        icon: Server,
        color: 'text-blue-400',
        aliases: ['architecture', 'overview', 'layers', 'arquitectura', 'capas'],
      },
      {
        id: 'storage',
        titleKey: 'storageEngine',
        icon: HardDrive,
        color: 'text-emerald-400',
        aliases: ['storage', 'engine', 'pages', 'iam', 'extents', 'almacenamiento', 'paginas'],
      },
      {
        id: 'memory',
        titleKey: 'memoryOperations',
        icon: Cpu,
        color: 'text-purple-400',
        aliases: ['memory', 'buffer pool', 'clerks', 'max memory', 'min memory', 'memoria'],
      },
      {
        id: 'execution',
        titleKey: 'queryExecution',
        icon: Settings,
        color: 'text-amber-400',
        aliases: ['execution', 'query', 'plan', 'optimizer', 'key lookup', 'ejecucion', 'consulta'],
      },
      {
        id: 'indexes',
        titleKey: 'indexVisualizer',
        icon: BookOpen,
        color: 'text-teal-400',
        aliases: ['index', 'indexes', 'btree', 'clustered', 'nci', 'indice', 'indices'],
      },
    ],
  },
  {
    id: 'operations',
    label: { en: 'Operations & DBA', es: 'Operaciones y DBA' },
    modules: [
      {
        id: 'jobs',
        titleKey: 'tabIndustryJobs',
        icon: Wrench,
        color: 'text-orange-400',
        aliases: ['jobs', 'sql agent', 'ola hallengren', 'brent ozar', 'blitz', 'mantenimiento'],
      },
      {
        id: 'incident-queries',
        titleKey: 'tabIncidentQueries',
        icon: FileSearch,
        color: 'text-emerald-300',
        aliases: ['quick queries', 'triage', 'blockers', 'waits', 'cpu', 'grants', 'incidencias', 'queries rapidas'],
      },
      {
        id: 'realcases',
        titleKey: 'realCasesTitle',
        icon: Siren,
        color: 'text-cyan-400',
        aliases: ['real cases', 'incidents', 'postmortem', 'casos reales', 'incidentes'],
      },
      {
        id: 'xevents',
        titleKey: 'tabXEvents',
        icon: Radar,
        color: 'text-orange-300',
        aliases: ['xevents', 'extended events', 'xe', 'attention', 'deadlock graph', 'blocked process', 'event file'],
      },
      {
        id: 'ha',
        titleKey: 'highAvailability',
        icon: Shield,
        color: 'text-sky-400',
        aliases: ['ha', 'dr', 'always on', 'availability group', 'alta disponibilidad'],
      },
      {
        id: 'osconfig',
        titleKey: 'tabOsConfig',
        icon: Server,
        color: 'text-indigo-400',
        aliases: ['os', 'windows', 'lpim', 'ifi', 'power plan', 'configuracion os'],
      },
      {
        id: 'perfmon',
        titleKey: 'tabPerfMon',
        icon: Cpu,
        color: 'text-fuchsia-400',
        aliases: ['perfmon', 'counters', 'monitoring', 'telemetry', 'rendimiento'],
      },
      {
        id: 'sqlos',
        titleKey: 'tabSqlOs',
        icon: Database,
        color: 'text-violet-400',
        aliases: ['sqlos', 'scheduler', 'workers', 'waits', 'sqldk', 'scheduler'],
      },
    ],
  },
  {
    id: 'internals',
    label: { en: 'Internals & Evolution', es: 'Internals y Evolucion' },
    modules: [
      {
        id: 'modern',
        titleKey: 'tabModern',
        icon: Zap,
        color: 'text-yellow-400',
        aliases: ['modern', 'adr', 'iqp', 'ledger', 'features', 'caracteristicas modernas'],
      },
      {
        id: 'tlog-internals',
        titleKey: 'tabTlogInternals',
        icon: FileWarning,
        color: 'text-orange-400',
        aliases: ['transaction log', 'vlf', 'writelog', 'wal', 'log de transacciones'],
      },
      {
        id: 'tempdb-io',
        titleKey: 'tabTempdbIo',
        icon: HardDrive,
        color: 'text-red-400',
        aliases: ['tempdb', 'pfs', 'gam', 'sgam', 'checkpoint', 'lazy writer', 'io'],
      },
      {
        id: 'replication',
        titleKey: 'tabReplication',
        icon: GitBranch,
        color: 'text-sky-400',
        aliases: ['replication', 'publisher', 'subscriber', 'distributor', 'replicacion'],
      },
      {
        id: 'version-history',
        titleKey: 'tabVersionHistory',
        icon: History,
        color: 'text-lime-400',
        aliases: ['version', 'history', 'release', 'cu', 'gdr', 'sp', 'historia'],
      },
    ],
  },
];

export const ALL_MODULES: ModuleDefinition[] = MODULE_GROUPS.flatMap((group) => group.modules);

export function normalizeSearchValue(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
