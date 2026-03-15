/* ────────────────────────────────────────────────────
   advancedSQLData.ts
   Technical data for OS Config, PerfMon, SQLOS & Modern Features modules
   ──────────────────────────────────────────────────── */

// ─── OS-Level Config ──────────────────────────────────
import type { TranslationKey } from '../i18n/translations';

export interface OSConfigItem {
  id: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  impactKey: TranslationKey;
  category: 'virtualization' | 'network' | 'policy' | 'power';
  icon: string;
  defaultValue: number | boolean | string;
  recommendedValue: number | boolean | string;
  unit?: string;
  dangerZone?: string;
}

export const OS_CONFIG_ITEMS: OSConfigItem[] = [
  // Virtualization & Storage
  { id: 'queueDepth', titleKey: 'osQueueDepthTitle', descKey: 'osQueueDepthDesc', impactKey: 'osQueueDepthImpact', category: 'virtualization', icon: 'HardDrive', defaultValue: 32, recommendedValue: 64, unit: 'requests', dangerZone: '< 32' },
  { id: 'ntfsAlloc', titleKey: 'osNtfsAllocTitle', descKey: 'osNtfsAllocDesc', impactKey: 'osNtfsAllocImpact', category: 'virtualization', icon: 'HardDrive', defaultValue: 4, recommendedValue: 64, unit: 'KB' },
  { id: 'pvscsi', titleKey: 'osPvscsiTitle', descKey: 'osPvscsiDesc', impactKey: 'osPvscsiImpact', category: 'virtualization', icon: 'Server', defaultValue: 'LSI Logic', recommendedValue: 'PVSCSI' },
  { id: 'scatterGather', titleKey: 'osScatterGatherTitle', descKey: 'osScatterGatherDesc', impactKey: 'osScatterGatherImpact', category: 'virtualization', icon: 'Layers', defaultValue: false, recommendedValue: true },
  { id: 'maxTransferSize', titleKey: 'osMaxTransferTitle', descKey: 'osMaxTransferDesc', impactKey: 'osMaxTransferImpact', category: 'virtualization', icon: 'Zap', defaultValue: 64, recommendedValue: 2048, unit: 'KB' },

  // Network
  { id: 'rss', titleKey: 'osRssTitle', descKey: 'osRssDesc', impactKey: 'osRssImpact', category: 'network', icon: 'Network', defaultValue: false, recommendedValue: true },
  { id: 'vmq', titleKey: 'osVmqTitle', descKey: 'osVmqDesc', impactKey: 'osVmqImpact', category: 'network', icon: 'Network', defaultValue: false, recommendedValue: true },

  // Windows Policies
  { id: 'lpim', titleKey: 'osLpimTitle', descKey: 'osLpimDesc', impactKey: 'osLpimImpact', category: 'policy', icon: 'Shield', defaultValue: false, recommendedValue: true },
  { id: 'ifi', titleKey: 'osIfiTitle', descKey: 'osIfiDesc', impactKey: 'osIfiImpact', category: 'policy', icon: 'Shield', defaultValue: false, recommendedValue: true },
  { id: 'bypassTraverse', titleKey: 'osBypassTitle', descKey: 'osBypassDesc', impactKey: 'osBypassImpact', category: 'policy', icon: 'Shield', defaultValue: true, recommendedValue: true },

  // Power Management
  { id: 'powerPlan', titleKey: 'osPowerPlanTitle', descKey: 'osPowerPlanDesc', impactKey: 'osPowerPlanImpact', category: 'power', icon: 'Cpu', defaultValue: 'Balanced', recommendedValue: 'High Performance' },
];

// ─── PerfMon Counters ─────────────────────────────────
export interface PerfCounter {
  id: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  category: 'memory' | 'io' | 'cpu';
  unit: string;
  healthy: number;
  warning: number;
  critical: number;
  direction: 'lower-is-better' | 'higher-is-better';
  defaultValue: number;
  stressValue: number;
}

export const PERFMON_COUNTERS: PerfCounter[] = [
  // Memory Pressure
  { id: 'ple', nameKey: 'pmPleTitle', descKey: 'pmPleDesc', category: 'memory', unit: 'sec', healthy: 300, warning: 150, critical: 60, direction: 'higher-is-better', defaultValue: 450, stressValue: 35 },
  { id: 'lazyWrites', nameKey: 'pmLazyWritesTitle', descKey: 'pmLazyWritesDesc', category: 'memory', unit: '/sec', healthy: 5, warning: 20, critical: 50, direction: 'lower-is-better', defaultValue: 2, stressValue: 78 },
  { id: 'freeListStalls', nameKey: 'pmFreeListTitle', descKey: 'pmFreeListDesc', category: 'memory', unit: '/sec', healthy: 0, warning: 2, critical: 10, direction: 'lower-is-better', defaultValue: 0, stressValue: 14 },
  { id: 'memGrantsPending', nameKey: 'pmMemGrantsTitle', descKey: 'pmMemGrantsDesc', category: 'memory', unit: '', healthy: 0, warning: 1, critical: 5, direction: 'lower-is-better', defaultValue: 0, stressValue: 8 },

  // I/O Bottleneck
  { id: 'diskSecRead', nameKey: 'pmDiskReadTitle', descKey: 'pmDiskReadDesc', category: 'io', unit: 'ms', healthy: 5, warning: 15, critical: 30, direction: 'lower-is-better', defaultValue: 3, stressValue: 48 },
  { id: 'diskSecWrite', nameKey: 'pmDiskWriteTitle', descKey: 'pmDiskWriteDesc', category: 'io', unit: 'ms', healthy: 5, warning: 15, critical: 30, direction: 'lower-is-better', defaultValue: 2, stressValue: 52 },
  { id: 'diskQueueLen', nameKey: 'pmDiskQueueTitle', descKey: 'pmDiskQueueDesc', category: 'io', unit: '', healthy: 2, warning: 5, critical: 15, direction: 'lower-is-better', defaultValue: 1, stressValue: 22 },

  // CPU & Throughput
  { id: 'batchReqSec', nameKey: 'pmBatchReqTitle', descKey: 'pmBatchReqDesc', category: 'cpu', unit: '/sec', healthy: 1000, warning: 5000, critical: 10000, direction: 'lower-is-better', defaultValue: 800, stressValue: 12000 },
  { id: 'compilations', nameKey: 'pmCompilationsTitle', descKey: 'pmCompilationsDesc', category: 'cpu', unit: '/sec', healthy: 50, warning: 100, critical: 200, direction: 'lower-is-better', defaultValue: 30, stressValue: 280 },
  { id: 'recompilations', nameKey: 'pmRecompTitle', descKey: 'pmRecompDesc', category: 'cpu', unit: '/sec', healthy: 10, warning: 50, critical: 100, direction: 'lower-is-better', defaultValue: 5, stressValue: 140 },
  { id: 'ctxSwitches', nameKey: 'pmCtxSwitchTitle', descKey: 'pmCtxSwitchDesc', category: 'cpu', unit: '/sec', healthy: 5000, warning: 20000, critical: 50000, direction: 'lower-is-better', defaultValue: 3000, stressValue: 65000 },
];

// ─── SQLOS Deep Dive ──────────────────────────────────
export interface SQLOSState {
  id: string;
  labelKey: TranslationKey;
  color: string;
  descKey: TranslationKey;
}

export const SQLOS_STATES: SQLOSState[] = [
  { id: 'running', labelKey: 'sqlosRunning', color: 'emerald', descKey: 'sqlosRunningDesc' },
  { id: 'runnable', labelKey: 'sqlosRunnable', color: 'amber', descKey: 'sqlosRunnableDesc' },
  { id: 'suspended', labelKey: 'sqlosSuspended', color: 'rose', descKey: 'sqlosSuspendedDesc' },
];

export interface SyncPrimitive {
  id: string;
  nameKey: TranslationKey;
  levelKey: TranslationKey;
  granularityKey: TranslationKey;
  durationKey: TranslationKey;
  exampleKey: TranslationKey;
  color: string;
}

export const SYNC_PRIMITIVES: SyncPrimitive[] = [
  { id: 'lock', nameKey: 'sqlosLockName', levelKey: 'sqlosLockLevel', granularityKey: 'sqlosLockGranularity', durationKey: 'sqlosLockDuration', exampleKey: 'sqlosLockExample', color: 'amber' },
  { id: 'latch', nameKey: 'sqlosLatchName', levelKey: 'sqlosLatchLevel', granularityKey: 'sqlosLatchGranularity', durationKey: 'sqlosLatchDuration', exampleKey: 'sqlosLatchExample', color: 'rose' },
  { id: 'spinlock', nameKey: 'sqlosSpinlockName', levelKey: 'sqlosSpinlockLevel', granularityKey: 'sqlosSpinlockGranularity', durationKey: 'sqlosSpinlockDuration', exampleKey: 'sqlosSpinlockExample', color: 'violet' },
];

export interface WaitCategory {
  id: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  color: string;
  waits: WaitDefinition[];
}

interface WaitDefinition {
  name: string;
  descKey: TranslationKey;
  fixKey: TranslationKey;
}

export const WAIT_CATEGORIES: WaitCategory[] = [
  { id: 'cpu', nameKey: 'waitCatCpu', descKey: 'waitCatCpuDesc', color: 'emerald', waits: [
    { name: 'SOS_SCHEDULER_YIELD', descKey: 'waitSosYieldDesc', fixKey: 'waitSosYieldFix' },
    { name: 'CXPACKET', descKey: 'waitCxpacketDesc', fixKey: 'waitCxpacketFix' },
    { name: 'THREADPOOL', descKey: 'waitThreadpoolDesc', fixKey: 'waitThreadpoolFix' },
  ]},
  { id: 'io', nameKey: 'waitCatIo', descKey: 'waitCatIoDesc', color: 'blue', waits: [
    { name: 'PAGEIOLATCH_SH', descKey: 'waitPageioShDesc', fixKey: 'waitPageioShFix' },
    { name: 'WRITELOG', descKey: 'waitWritelogDesc', fixKey: 'waitWritelogFix' },
    { name: 'ASYNC_IO_COMPLETION', descKey: 'waitAsyncIoDesc', fixKey: 'waitAsyncIoFix' },
  ]},
  { id: 'lock', nameKey: 'waitCatLock', descKey: 'waitCatLockDesc', color: 'amber', waits: [
    { name: 'LCK_M_X', descKey: 'waitLckMxDesc', fixKey: 'waitLckMxFix' },
    { name: 'LCK_M_S', descKey: 'waitLckMsDesc', fixKey: 'waitLckMsFix' },
    { name: 'PAGELATCH_EX', descKey: 'waitPagelatchDesc', fixKey: 'waitPagelatchFix' },
  ]},
  { id: 'network', nameKey: 'waitCatNetwork', descKey: 'waitCatNetworkDesc', color: 'cyan', waits: [
    { name: 'ASYNC_NETWORK_IO', descKey: 'waitAsyncNetDesc', fixKey: 'waitAsyncNetFix' },
    { name: 'OLEDB', descKey: 'waitOledbDesc', fixKey: 'waitOledbFix' },
  ]},
];

// ─── Modern Features ──────────────────────────────────
export interface LocalizedText {
  en: string;
  es: string;
}

export interface TLogWalStage {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  detail: LocalizedText;
  badge: string;
  metric: string;
}

export const TLOG_WAL_STAGES: TLogWalStage[] = [
  {
    id: 'log-buffer',
    title: {
      en: 'Log Buffer in RAM',
      es: 'Log Buffer en RAM',
    },
    summary: {
      en: 'The worker formats log records in memory before the transaction can commit.',
      es: 'El worker construye registros de log en memoria antes de que la transacción pueda hacer commit.',
    },
    detail: {
      en: 'Every INSERT, UPDATE or DELETE creates log records first. Dirty data pages can wait, but the log record must exist immediately.',
      es: 'Cada INSERT, UPDATE o DELETE genera primero registros de log. Las páginas de datos pueden esperar, pero el log record debe existir al instante.',
    },
    badge: 'LOGBUFFER',
    metric: '60 KB log blocks',
  },
  {
    id: 'log-flush',
    title: {
      en: 'Log Flush',
      es: 'Log Flush',
    },
    summary: {
      en: 'Commit forces the log cache to stable media so the LSN is durable.',
      es: 'El commit fuerza el vaciado de la caché de log a medio estable para que el LSN sea duradero.',
    },
    detail: {
      en: 'The WAL rule is strict: SQL Server must harden the log block before acknowledging COMMIT to the client.',
      es: 'La regla WAL es estricta: SQL Server debe endurecer el bloque de log antes de confirmar el COMMIT al cliente.',
    },
    badge: 'WRITELOG',
    metric: 'Commit waits on flush latency',
  },
  {
    id: 'ldf-vlfs',
    title: {
      en: '.ldf and active VLF',
      es: '.ldf y VLF activo',
    },
    summary: {
      en: 'The flushed block lands in the current active VLF and recovery starts from there after a crash.',
      es: 'El bloque vaciado aterriza en el VLF activo y desde ahí arranca la recuperación tras un crash.',
    },
    detail: {
      en: 'A healthy log file keeps a manageable VLF count. Too many tiny VLFs stretch crash recovery, log scan and backup operations.',
      es: 'Un log sano mantiene un número manejable de VLFs. Demasiados VLFs pequeños alargan crash recovery, el escaneo del log y los backups.',
    },
    badge: 'ACTIVE VLF',
    metric: 'Recovery scans VLF by VLF',
  },
];

export interface TLogVlfProfile {
  id: 'healthy' | 'fragmented';
  label: LocalizedText;
  summary: LocalizedText;
  vlfCount: number;
  bars: number;
  recovery: LocalizedText;
  impact: LocalizedText;
  badges: string[];
}

export const TLOG_VLF_PROFILES: TLogVlfProfile[] = [
  {
    id: 'healthy',
    label: {
      en: 'Healthy log layout',
      es: 'Layout sano del log',
    },
    summary: {
      en: 'Pre-sized log with few large VLFs and predictable growth increments.',
      es: 'Log pre-dimensionado con pocos VLFs grandes y crecimiento predecible.',
    },
    vlfCount: 16,
    bars: 16,
    recovery: {
      en: 'Crash recovery scans fast because the active portion lives in a short VLF chain.',
      es: 'Crash recovery escanea rápido porque la parte activa vive en una cadena corta de VLFs.',
    },
    impact: {
      en: 'Shorter startup, faster restore and cleaner log reuse.',
      es: 'Arranque más corto, restore más rápido y mejor reutilización del log.',
    },
    badges: ['sys.dm_db_log_info', 'Target: < 200 VLFs', 'Recovery friendly'],
  },
  {
    id: 'fragmented',
    label: {
      en: 'Fragmented log layout',
      es: 'Layout fragmentado del log',
    },
    summary: {
      en: 'Repeated tiny autogrowth events create hundreds of small VLFs.',
      es: 'Un autogrowth pequeño repetido crea cientos de VLFs diminutos.',
    },
    vlfCount: 640,
    bars: 96,
    recovery: {
      en: 'Crash recovery and redo/undo have to walk a long chain of tiny VLFs before the database opens.',
      es: 'Crash recovery y redo/undo tienen que recorrer una cadena enorme de VLFs pequeños antes de abrir la base.',
    },
    impact: {
      en: 'Long startup after failure, slower log backup scans and painful maintenance windows.',
      es: 'Arranque lento tras fallo, backups de log más lentos y ventanas de mantenimiento dolorosas.',
    },
    badges: ['Autogrowth storm', 'Long redo', 'Slow startup'],
  },
];

export const TLOG_TSQL_SCRIPTS = {
  inspectWal: `SELECT DB_NAME(database_id) AS db_name,
       log_since_last_log_backup_mb,
       active_log_size_mb,
       total_log_size_mb,
       log_truncation_holdup_reason
FROM sys.dm_db_log_stats(DB_ID());`,
  inspectVlfs: `SELECT COUNT(*) AS vlf_count,
       SUM(CASE WHEN vlf_active = 1 THEN 1 ELSE 0 END) AS active_vlfs,
       MIN(vlf_size_mb) AS min_vlf_mb,
       MAX(vlf_size_mb) AS max_vlf_mb
FROM sys.dm_db_log_info(DB_ID());

-- If vlf_count is very high, grow the log in larger MB chunks
-- instead of letting small autogrowth events fragment the file.`,
};

export interface TempDbAllocationPage {
  id: string;
  pageId: string;
  name: string;
  title: LocalizedText;
  summary: LocalizedText;
  role: LocalizedText;
  symptom: LocalizedText;
  fix: LocalizedText;
  badge: string;
}

export const TEMPDB_ALLOCATION_PAGES: TempDbAllocationPage[] = [
  {
    id: 'pfs',
    pageId: '2:1:1',
    name: 'PFS',
    title: {
      en: 'Page Free Space',
      es: 'Espacio libre por página',
    },
    summary: {
      en: 'Tracks free space and allocation status for pages every 8088 pages.',
      es: 'Controla espacio libre y estado de asignación cada 8088 páginas.',
    },
    role: {
      en: 'Heavy temp table create/drop cycles hammer this page first.',
      es: 'Los ciclos intensos de crear y borrar #temp golpean primero esta página.',
    },
    symptom: {
      en: 'PAGELATCH_UP on 2:1:1 while sessions queue behind a single file.',
      es: 'PAGELATCH_UP sobre 2:1:1 mientras las sesiones se apilan detras de un solo archivo.',
    },
    fix: {
      en: 'Add equally sized TempDB data files so allocations spread out.',
      es: 'Agregar varios archivos de datos del mismo tamaño para repartir las asignaciones.',
    },
    badge: 'PAGELATCH_UP',
  },
  {
    id: 'gam',
    pageId: '2:1:2',
    name: 'GAM',
    title: {
      en: 'Global Allocation Map',
      es: 'Mapa global de asignación',
    },
    summary: {
      en: 'Tracks which extents are free or already allocated.',
      es: 'Marca que extents estan libres o ya asignados.',
    },
    role: {
      en: 'Temp objects and version store allocations revisit GAM constantly.',
      es: 'Los objetos temporales y el version store vuelven a GAM constantemente.',
    },
    symptom: {
      en: 'Allocation workers spin and sleep around 2:1:2 under heavy concurrency.',
      es: 'Los workers de asignación giran y esperan alrededor de 2:1:2 con alta concurrencia.',
    },
    fix: {
      en: 'More TempDB files reduce hot extent metadata points.',
      es: 'Mas archivos TempDB reducen los puntos calientes de metadatos de extents.',
    },
    badge: 'GAM',
  },
  {
    id: 'sgam',
    pageId: '2:1:3',
    name: 'SGAM',
    title: {
      en: 'Shared Global Allocation Map',
      es: 'Mapa global de asignación compartida',
    },
    summary: {
      en: 'Tracks mixed extents that still have free pages available.',
      es: 'Controla extents mixtos que aún tienen páginas libres.',
    },
    role: {
      en: 'Mixed extent allocation is a classic TempDB metadata hotspot.',
      es: 'La asignación de extents mixtos es un hotspot clásico de metadatos en TempDB.',
    },
    symptom: {
      en: 'PAGELATCH_UP or PAGELATCH_EX against SGAM under temp object storms.',
      es: 'PAGELATCH_UP o PAGELATCH_EX sobre SGAM durante tormentas de objetos temporales.',
    },
    fix: {
      en: 'Distribute activity across multiple files and keep them equally sized.',
      es: 'Distribuir la actividad entre varios archivos y mantenerlos con el mismo tamaño.',
    },
    badge: 'SGAM',
  },
];

export interface TempDbLayoutScenario {
  id: 'single' | 'multiple';
  title: LocalizedText;
  summary: LocalizedText;
  files: number;
  pressure: number[];
  badges: string[];
  note: LocalizedText;
}

export const TEMPDB_LAYOUT_SCENARIOS: TempDbLayoutScenario[] = [
  {
    id: 'single',
    title: {
      en: 'Single TempDB file',
      es: 'Un solo archivo de TempDB',
    },
    summary: {
      en: 'All allocation traffic converges on the same PFS/GAM/SGAM pages.',
      es: 'Todo el tráfico de asignación converge en las mismas páginas PFS/GAM/SGAM.',
    },
    files: 1,
    pressure: [96],
    badges: ['2:1:1', '2:1:2', '2:1:3', 'PAGELATCH_UP'],
    note: {
      en: 'The queue is short only when concurrency is low. Under bursts, workers stack on the same file header and allocation maps.',
      es: 'La cola solo es pequeña con poca concurrencia. Bajo ráfagas, los workers se amontonan sobre la misma cabecera y mapas de asignación.',
    },
  },
  {
    id: 'multiple',
    title: {
      en: 'Four equally sized TempDB files',
      es: 'Cuatro archivos de TempDB del mismo tamaño',
    },
    summary: {
      en: 'Allocation rounds spread across files, reducing latch pressure on each metadata page.',
      es: 'Las rondas de asignación se reparten entre archivos y bajan la presión de latch en cada página de metadatos.',
    },
    files: 4,
    pressure: [28, 25, 23, 24],
    badges: ['Round-robin', 'Balanced files', 'Lower latch pressure'],
    note: {
      en: 'This does not eliminate every problem, but it removes the classic single-page metadata bottleneck.',
      es: 'No elimina todos los problemas, pero sí quita el cuello de botella clásico de una sola página de metadatos.',
    },
  },
];

export interface AsyncWriterMetric {
  label: LocalizedText;
  value: string;
}

export interface AsyncWriterProfile {
  id: 'checkpoint' | 'lazy-writer';
  title: LocalizedText;
  trigger: LocalizedText;
  goal: LocalizedText;
  writePattern: LocalizedText;
  summary: LocalizedText;
  badges: string[];
  metrics: AsyncWriterMetric[];
  script: string;
}

export const IO_WRITER_PROFILES: AsyncWriterProfile[] = [
  {
    id: 'checkpoint',
    title: {
      en: 'Checkpoint',
      es: 'Checkpoint',
    },
    trigger: {
      en: 'Triggered by recovery interval, target recovery time or explicit CHECKPOINT.',
      es: 'Se activa por recovery interval, target recovery time o CHECKPOINT explicito.',
    },
    goal: {
      en: 'Flush dirty pages so crash recovery has less redo work to perform later.',
      es: 'Escribir páginas sucias para que crash recovery tenga menos redo pendiente después.',
    },
    writePattern: {
      en: 'Large, asynchronous write batches driven by recovery objectives, not by immediate memory shortage.',
      es: 'Grandes lotes de escritura asincrona guiados por objetivos de recovery, no por falta inmediata de memoria.',
    },
    summary: {
      en: 'Checkpoint moves the recovery point forward. It is about durability horizon and restart time.',
      es: 'Checkpoint mueve hacia delante el punto de recovery. Su foco es la durabilidad y el tiempo de reinicio.',
    },
    badges: ['CHECKPOINT', 'Target Recovery Time', 'Recovery LSN'],
    metrics: [
      { label: { en: 'Typical trigger', es: 'Disparador tipico' }, value: 'Recovery objective' },
      { label: { en: 'Dirty pages touched', es: 'Paginas sucias tocadas' }, value: 'High batch' },
      { label: { en: 'Main wait seen', es: 'Espera principal' }, value: 'CHECKPOINT_QUEUE' },
    ],
    script: `CHECKPOINT;

SELECT counter_name, cntr_value
FROM sys.dm_os_performance_counters
WHERE counter_name IN ('Checkpoint pages/sec', 'Page writes/sec');`,
  },
  {
    id: 'lazy-writer',
    title: {
      en: 'Lazy Writer',
      es: 'Lazy Writer',
    },
    trigger: {
      en: 'Triggered when SQL Server needs free buffers and sees memory pressure.',
      es: 'Se activa cuando SQL Server necesita buffers libres y detecta presión de memoria.',
    },
    goal: {
      en: 'Free cleanable buffers quickly so workers can keep reading new pages.',
      es: 'Liberar buffers rápidamente para que los workers puedan leer páginas nuevas.',
    },
    writePattern: {
      en: 'Selective asynchronous writes focused on pages needed to relieve memory pressure right now.',
      es: 'Escrituras asíncronas selectivas centradas en páginas que alivian la presión de memoria ahora mismo.',
    },
    summary: {
      en: 'Lazy Writer is about memory survival. It does not advance the recovery point by design.',
      es: 'Lazy Writer trata de sobrevivir a la presión de memoria. No existe para adelantar el recovery point.',
    },
    badges: ['RESOURCE_MEMPHYSICAL_LOW', 'Lazy writes/sec', 'LAZYWRITER_SLEEP'],
    metrics: [
      { label: { en: 'Typical trigger', es: 'Disparador tipico' }, value: 'Memory pressure' },
      { label: { en: 'Dirty pages touched', es: 'Paginas sucias tocadas' }, value: 'Targeted batch' },
      { label: { en: 'Main wait seen', es: 'Espera principal' }, value: 'RESOURCE_MEMPHYSICAL_LOW' },
    ],
    script: `SELECT counter_name, cntr_value
FROM sys.dm_os_performance_counters
WHERE counter_name IN ('Lazy writes/sec', 'Free list stalls/sec', 'Page life expectancy');

SELECT *
FROM sys.dm_os_ring_buffers
WHERE ring_buffer_type = 'RING_BUFFER_RESOURCE_MONITOR';`,
  },
];

export const TEMPDB_IO_TSQL = {
  tempdbContention: `SELECT wt.wait_type,
       wt.wait_duration_ms,
       wt.resource_description,
       wt.blocking_session_id,
       wt.session_id
FROM sys.dm_os_waiting_tasks wt
WHERE wt.wait_type LIKE 'PAGELATCH%'
  AND wt.resource_description LIKE '2:%'
ORDER BY wt.wait_duration_ms DESC;

SELECT file_id, name, physical_name, size
FROM tempdb.sys.database_files;`,
  ioWriters: `SELECT counter_name, cntr_value
FROM sys.dm_os_performance_counters
WHERE counter_name IN (
  'Checkpoint pages/sec',
  'Lazy writes/sec',
  'Free list stalls/sec',
  'Page writes/sec'
)
ORDER BY counter_name;`,
};

export interface ReplicationRole {
  id: 'publisher' | 'distributor' | 'subscriber';
  title: LocalizedText;
  summary: LocalizedText;
  detail: LocalizedText;
  badge: string;
}

export const REPLICATION_ROLES: ReplicationRole[] = [
  {
    id: 'publisher',
    title: {
      en: 'Publisher',
      es: 'Publisher',
    },
    summary: {
      en: 'Owns the source database and marks articles that will be replicated.',
      es: 'Tiene la base origen y marca los articulos que se van a replicar.',
    },
    detail: {
      en: 'In transactional replication, the publisher commits locally and then the Log Reader Agent extracts marked changes from the transaction log.',
      es: 'En replicación transaccional, el publisher hace commit local y luego el Log Reader Agent extrae los cambios marcados desde el transaction log.',
    },
    badge: 'Source of change',
  },
  {
    id: 'distributor',
    title: {
      en: 'Distributor',
      es: 'Distributor',
    },
    summary: {
      en: 'Stores metadata, commands, snapshots and the distribution database used to fan out changes.',
      es: 'Guarda metadatos, comandos, snapshots y la distribution database desde la que se reparten cambios.',
    },
    detail: {
      en: 'This server is the traffic hub of replication. Distribution Agent or Merge Agent pulls work from here and pushes it to subscribers.',
      es: 'Este servidor es el hub de tráfico de la replicación. El Distribution Agent o el Merge Agent toman trabajo desde aquí y lo llevan a los subscribers.',
    },
    badge: 'Distribution DB',
  },
  {
    id: 'subscriber',
    title: {
      en: 'Subscriber',
      es: 'Subscriber',
    },
    summary: {
      en: 'Receives publications and applies snapshots, commands or merged changes.',
      es: 'Recibe publicaciones y aplica snapshots, comandos o cambios fusionados.',
    },
    detail: {
      en: 'A subscriber can be push or pull, read-only or update-capable depending on the replication topology and conflict rules.',
      es: 'Un subscriber puede ser push o pull, solo lectura o con capacidad de actualización según la topología y las reglas de conflicto.',
    },
    badge: 'Destination',
  },
];

export interface ReplicationStage {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  actor: string;
  badge: string;
}

export const REPLICATION_STAGES: ReplicationStage[] = [
  {
    id: 'publication',
    title: {
      en: 'Publication created',
      es: 'Publicacion creada',
    },
    summary: {
      en: 'Tables, procedures or filtered articles are exposed from the source database.',
      es: 'Se exponen tablas, procedimientos o articulos filtrados desde la base origen.',
    },
    actor: 'Publisher',
    badge: 'Articles',
  },
  {
    id: 'capture',
    title: {
      en: 'Changes captured',
      es: 'Cambios capturados',
    },
    summary: {
      en: 'Snapshot Agent or Log Reader Agent captures the initial dataset or the committed log commands.',
      es: 'El Snapshot Agent o el Log Reader Agent capturan el conjunto inicial o los comandos comprometidos en el log.',
    },
    actor: 'Snapshot / Log Reader Agent',
    badge: 'Capture',
  },
  {
    id: 'distribution',
    title: {
      en: 'Commands stored',
      es: 'Comandos almacenados',
    },
    summary: {
      en: 'The distribution database queues commands and metadata until each subscription consumes them.',
      es: 'La distribution database encola comandos y metadatos hasta que cada suscripcion los consume.',
    },
    actor: 'Distributor',
    badge: 'msdistribution',
  },
  {
    id: 'delivery',
    title: {
      en: 'Subscriber synchronized',
      es: 'Subscriber sincronizado',
    },
    summary: {
      en: 'Distribution Agent, Merge Agent or peer topology applies the pending work and updates latency counters.',
      es: 'El Distribution Agent, el Merge Agent o la topología peer aplican el trabajo pendiente y actualizan la latencia.',
    },
    actor: 'Distribution / Merge Agent',
    badge: 'Apply',
  },
];

export interface ReplicationMode {
  id: 'snapshot' | 'transactional' | 'merge' | 'peer';
  label: LocalizedText;
  summary: LocalizedText;
  strengths: LocalizedText;
  tradeoff: LocalizedText;
  latency: string;
  badges: string[];
}

export const REPLICATION_MODES: ReplicationMode[] = [
  {
    id: 'snapshot',
    label: {
      en: 'Snapshot replication',
      es: 'Replicacion snapshot',
    },
    summary: {
      en: 'Best when a full refresh is acceptable and row-by-row change tracking is unnecessary.',
      es: 'Va bien cuando un refresco completo es aceptable y no hace falta seguir cambio por cambio.',
    },
    strengths: {
      en: 'Simple topology, predictable refresh cycle and common as the initial dataset for other replication modes.',
      es: 'Topologia simple, ciclo de refresco predecible y muy usada como dataset inicial para otros modos.',
    },
    tradeoff: {
      en: 'Large snapshots can be expensive to generate and apply if the dataset is big.',
      es: 'Los snapshots grandes pueden ser caros de generar y de aplicar si el conjunto de datos es amplio.',
    },
    latency: 'Batch refresh',
    badges: ['Snapshot Agent', 'Initial load', 'Full refresh'],
  },
  {
    id: 'transactional',
    label: {
      en: 'Transactional replication',
      es: 'Replicacion transaccional',
    },
    summary: {
      en: 'Optimized for high-throughput server-to-server delivery where subscribers must stay very close to the publisher.',
      es: 'Optimizada para entrega server-to-server de alto throughput cuando los subscribers deben quedar muy cerca del publisher.',
    },
    strengths: {
      en: 'Low latency, ordered command delivery and common for reporting, offloading reads and integration between sites.',
      es: 'Baja latencia, entrega ordenada de comandos y muy util para reporting, offload de lecturas e integracion entre sedes.',
    },
    tradeoff: {
      en: 'The topology depends on healthy log reader and distribution agents; undistributed commands can accumulate quickly.',
      es: 'La topología depende de agentes sanos de lectura y distribución; los comandos sin repartir pueden acumularse muy rápido.',
    },
    latency: 'Near real time',
    badges: ['Log Reader Agent', 'Distribution Agent', 'Ordered commands'],
  },
  {
    id: 'merge',
    label: {
      en: 'Merge replication',
      es: 'Replicacion merge',
    },
    summary: {
      en: 'Designed for disconnected or mobile scenarios where multiple nodes can update the same data set.',
      es: 'Pensada para escenarios desconectados o móviles donde varios nodos pueden actualizar el mismo conjunto de datos.',
    },
    strengths: {
      en: 'Supports bidirectional synchronization, partitions and conflict detection/resolution.',
      es: 'Soporta sincronizacion bidireccional, particiones y deteccion/resolucion de conflictos.',
    },
    tradeoff: {
      en: 'Conflict metadata and merge processing add complexity and overhead compared with transactional replication.',
      es: 'Los metadatos de conflicto y el proceso de merge añaden complejidad y más coste que la replicación transaccional.',
    },
    latency: 'Scheduled sync',
    badges: ['Merge Agent', 'Conflict resolver', 'Mobile'],
  },
  {
    id: 'peer',
    label: {
      en: 'Peer-to-peer',
      es: 'Peer-to-peer',
    },
    summary: {
      en: 'Extends transactional replication to multiple writable nodes that each own a partition of writes.',
      es: 'Extiende la replicación transaccional a varios nodos escribibles donde cada uno debe poseer su partición de escrituras.',
    },
    strengths: {
      en: 'Useful for scale-out and site resilience when application routing avoids write conflicts.',
      es: 'Util para scale-out y resiliencia entre sedes cuando el enrutado de la aplicacion evita conflictos de escritura.',
    },
    tradeoff: {
      en: 'It is not conflict resolution magic: if two peers write the same row, the application design is already wrong.',
      es: 'No es magia para resolver conflictos: si dos peers escriben la misma fila, el diseño de la aplicación ya va mal.',
    },
    latency: 'Near real time',
    badges: ['Peer topology', 'Partitioned writes', 'Conflict avoidance'],
  },
];

export const REPLICATION_TSQL = {
  topology: `EXEC sp_helppublication;
EXEC sp_helpsubscription;

SELECT publisher_db,
       publication,
       publication_type,
       immediate_sync,
       allow_push,
       allow_pull
FROM distribution.dbo.MSpublications;`,
  latency: `EXEC sp_replmonitorhelppublisher
  @publisher = @@SERVERNAME;

SELECT TOP (50)
       publisher_database_id,
       xact_seqno,
       entry_time,
       delivered_commands
FROM distribution.dbo.MSdistribution_history
ORDER BY entry_time DESC;`,
};

export interface VersionUpdateTrack {
  id: 'sp-era' | 'cu-era' | 'current';
  label: LocalizedText;
  summary: LocalizedText;
  detail: LocalizedText;
  badges: string[];
}

export const VERSION_UPDATE_TRACKS: VersionUpdateTrack[] = [
  {
    id: 'sp-era',
    label: {
      en: 'Service Pack era',
      es: 'Era de Service Packs',
    },
    summary: {
      en: 'Older releases were commonly discussed in terms of RTM, Service Packs and later cumulative fixes.',
      es: 'Las versiones antiguas se gestionaban habitualmente en torno a RTM, Service Packs y luego fixes acumulativos.',
    },
    detail: {
      en: 'If you work with SQL Server 2000 through SQL Server 2016, you still hear people classify estates by major Service Pack level because that was the operational language for many years.',
      es: 'Si trabajas con SQL Server 2000 hasta SQL Server 2016, todavía es habitual clasificar entornos por nivel de Service Pack porque ese fue el lenguaje operativo durante años.',
    },
    badges: ['RTM', 'SP', 'Legacy estates'],
  },
  {
    id: 'cu-era',
    label: {
      en: 'Cumulative Update era',
      es: 'Era de Cumulative Updates',
    },
    summary: {
      en: 'Modern releases lean on CUs for feature maturity and fixes, with GDRs reserved for security-oriented servicing.',
      es: 'Las versiones modernas se apoyan en CUs para madurez funcional y correcciones, y dejan los GDR para servicing orientado a seguridad.',
    },
    detail: {
      en: 'From SQL Server 2017 onward, many production best practices assume you track a recent CU because fixes ship there continuously.',
      es: 'Desde SQL Server 2017, muchas buenas prácticas de producción asumen que sigues un CU reciente porque las correcciones llegan de forma continua por esa vía.',
    },
    badges: ['CU', 'GDR', 'Build discipline'],
  },
  {
    id: 'current',
    label: {
      en: 'Current decision model',
      es: 'Modelo actual de decisión',
    },
    summary: {
      en: 'Choose version by workload features, edition limits, lifecycle, Linux/Azure alignment and engine improvements.',
      es: 'La version debe elegirse por features del workload, limites de edicion, lifecycle, alineacion con Linux/Azure y mejoras del motor.',
    },
    detail: {
      en: 'For a new deployment, version choice is rarely about syntax only. It is also about Query Store defaults, security, HA options, edition caps and the servicing model your team can sustain.',
      es: 'En un despliegue nuevo, la decisión rara vez depende solo de sintaxis. También pesa Query Store, seguridad, HA, límites por edición y el modelo de mantenimiento que tu equipo puede sostener.',
    },
    badges: ['Lifecycle', 'Edition limits', 'Operational fit'],
  },
];

export interface SqlServerRelease {
  id: string;
  version: string;
  year: number;
  era: LocalizedText;
  summary: LocalizedText;
  history: LocalizedText;
  highlights: LocalizedText[];
  servicing: LocalizedText;
  badges: string[];
}

export const SQL_SERVER_RELEASES: SqlServerRelease[] = [
  {
    id: '2000',
    version: 'SQL Server 2000',
    year: 2000,
    era: {
      en: 'Classic relational platform',
      es: 'Plataforma relacional clasica',
    },
    summary: {
      en: 'Represents the old-school SQL Server era before DMVs, modern HA and the cost-based tooling we now take for granted.',
      es: 'Representa la etapa clasica previa a DMVs, HA moderna y muchas de las herramientas de coste que hoy damos por hechas.',
    },
    history: {
      en: 'This is the generation many DBAs associate with DTS, older replication estates and heavily manual administration.',
      es: 'Es la generacion que muchos DBAs asocian con DTS, entornos viejos de replicacion y administracion muy manual.',
    },
    highlights: [
      { en: 'Strong OLTP foundation for its time', es: 'Base OLTP solida para su epoca' },
      { en: 'Legacy replication and log shipping patterns', es: 'Patrones clasicos de replicacion y log shipping' },
      { en: 'Pre-DMV operational model', es: 'Modelo operativo previo a las DMVs' },
    ],
    servicing: {
      en: 'Legacy release; only relevant today for migration and historical estates.',
      es: 'Version legacy; hoy solo importa por migraciones y entornos historicos.',
    },
    badges: ['DTS era', 'Legacy', 'Migration risk'],
  },
  {
    id: '2005',
    version: 'SQL Server 2005',
    year: 2005,
    era: {
      en: 'Engine modernization jump',
      es: 'Gran salto de modernizacion',
    },
    summary: {
      en: 'Introduced DMVs, database mirroring, snapshots and a much more modern manageability story.',
      es: 'Introdujo DMVs, database mirroring, snapshots y una historia de administracion mucho mas moderna.',
    },
    history: {
      en: 'For many long-lived estates, SQL Server 2005 is the real starting point of the modern DBA toolbox.',
      es: 'Para muchos entornos longevos, SQL Server 2005 es el verdadero punto de arranque del toolbox moderno de DBA.',
    },
    highlights: [
      { en: 'DMVs and modern metadata visibility', es: 'DMVs y visibilidad moderna de metadatos' },
      { en: 'Database mirroring and snapshots', es: 'Database mirroring y snapshots' },
      { en: 'SSIS and management tooling expansion', es: 'Expansion de SSIS y del tooling de administracion' },
    ],
    servicing: {
      en: 'Service Pack generation; relevant mainly for upgrade history.',
      es: 'Generacion de Service Packs; hoy importa sobre todo por historia de upgrade.',
    },
    badges: ['DMVs', 'Mirroring', 'SSIS'],
  },
  {
    id: '2008',
    version: 'SQL Server 2008 / 2008 R2',
    year: 2008,
    era: {
      en: 'Data platform expansion',
      es: 'Expansion de la plataforma de datos',
    },
    summary: {
      en: 'Strengthened compression, policy-based management, backup options and enterprise warehousing patterns.',
      es: 'Reforzo compresion, policy-based management, opciones de backup y patrones de data warehousing enterprise.',
    },
    history: {
      en: 'Still common in migration stories because many legacy vendor applications stayed on 2008 R2 for years.',
      es: 'Sigue apareciendo mucho en historias de migración porque muchas aplicaciones de terceros se quedaron años en 2008 R2.',
    },
    highlights: [
      { en: 'Compression and backup improvements', es: 'Mejoras en compresion y backup' },
      { en: 'Policy-based management', es: 'Policy-based management' },
      { en: 'Wider BI ecosystem adoption', es: 'Mayor adopcion dentro del ecosistema BI' },
    ],
    servicing: {
      en: 'Legacy; a common source platform in modernization projects.',
      es: 'Legacy; una plataforma origen muy comun en proyectos de modernizacion.',
    },
    badges: ['Compression', 'Policy-based', 'Legacy app estates'],
  },
  {
    id: '2012',
    version: 'SQL Server 2012',
    year: 2012,
    era: {
      en: 'HA redesign era',
      es: 'Era del rediseño HA',
    },
    summary: {
      en: 'Always On availability groups became one of the defining platform capabilities for enterprise deployments.',
      es: 'Always On availability groups paso a ser una de las capacidades clave para despliegues enterprise.',
    },
    history: {
      en: 'This version marks the point where many estates pivot from mirroring to AG thinking.',
      es: 'Marca el punto en el que muchos entornos pasan de pensar en mirroring a pensar en AGs.',
    },
    highlights: [
      { en: 'Always On availability groups', es: 'Always On availability groups' },
      { en: 'Columnstore first wave', es: 'Primera ola de columnstore' },
      { en: 'Contained databases and BI enhancements', es: 'Contained databases y mejoras BI' },
    ],
    servicing: {
      en: 'Still important in upgrade narratives because AG adoption often started here.',
      es: 'Sigue siendo importante en narrativas de upgrade porque muchas adopciones de AG arrancaron aqui.',
    },
    badges: ['AGs', 'Columnstore', 'Enterprise HA'],
  },
  {
    id: '2014',
    version: 'SQL Server 2014',
    year: 2014,
    era: {
      en: 'In-Memory OLTP era',
      es: 'Era de In-Memory OLTP',
    },
    summary: {
      en: 'Focused on Hekaton, delayed durability and the next step of cloud-aware hybrid database patterns.',
      es: 'Se centro en Hekaton, delayed durability y el siguiente paso hacia patrones hibridos mas cercanos a la nube.',
    },
    history: {
      en: 'It introduced a bold performance direction even if many estates adopted the in-memory features gradually.',
      es: 'Introdujo una direccion de rendimiento muy ambiciosa aunque muchos entornos adoptaron las funciones in-memory de forma gradual.',
    },
    highlights: [
      { en: 'In-Memory OLTP (Hekaton)', es: 'In-Memory OLTP (Hekaton)' },
      { en: 'Buffer Pool Extension and delayed durability', es: 'Buffer Pool Extension y delayed durability' },
      { en: 'Incremental cloud integration', es: 'Integracion cloud incremental' },
    ],
    servicing: {
      en: 'Useful today mainly when planning legacy upgrades and memory-optimized migrations.',
      es: 'Hoy es util sobre todo al planificar upgrades legacy y migraciones de objetos memory-optimized.',
    },
    badges: ['Hekaton', 'Delayed durability', 'Hybrid'],
  },
  {
    id: '2016',
    version: 'SQL Server 2016',
    year: 2016,
    era: {
      en: 'Security and operational leap',
      es: 'Salto en seguridad y operación',
    },
    summary: {
      en: 'Microsoft Learn highlights Query Store, temporal tables, JSON, PolyBase and a major security wave with Always Encrypted, Dynamic Data Masking and Row-Level Security.',
      es: 'Microsoft Learn destaca Query Store, temporal tables, JSON, PolyBase y una gran ola de seguridad con Always Encrypted, Dynamic Data Masking y Row-Level Security.',
    },
    history: {
      en: 'This release changed daily troubleshooting because Query Store gave DBAs a first-class history of plans and runtime behavior.',
      es: 'Esta version cambio el troubleshooting diario porque Query Store dio a los DBAs un historial de planes y comportamiento en ejecucion.',
    },
    highlights: [
      { en: 'Query Store', es: 'Query Store' },
      { en: 'Temporal tables and JSON support', es: 'Temporal tables y soporte JSON' },
      { en: 'Always Encrypted, DDM and RLS', es: 'Always Encrypted, DDM y RLS' },
    ],
    servicing: {
      en: 'One of the last releases many teams still describe by Service Pack level.',
      es: 'Una de las ultimas versiones que muchos equipos aun describen por nivel de Service Pack.',
    },
    badges: ['Query Store', 'Security', 'PolyBase'],
  },
  {
    id: '2017',
    version: 'SQL Server 2017',
    year: 2017,
    era: {
      en: 'Cross-platform milestone',
      es: 'Hito cross-platform',
    },
    summary: {
      en: 'Microsoft Learn frames 2017 as the release that brought SQL Server to Linux, containers and a broader platform story.',
      es: 'Microsoft Learn presenta 2017 como la version que llevo SQL Server a Linux, contenedores y una historia de plataforma mucho mas amplia.',
    },
    history: {
      en: 'It also launched adaptive query processing, automatic tuning steps, graph tables and resumable online index rebuild.',
      es: 'Tambien lanzo adaptive query processing, automatic tuning, graph tables y resumable online index rebuild.',
    },
    highlights: [
      { en: 'SQL Server on Linux and containers', es: 'SQL Server en Linux y contenedores' },
      { en: 'Adaptive query processing first wave', es: 'Primera ola de adaptive query processing' },
      { en: 'Graph and resumable online index rebuild', es: 'Graph y resumable online index rebuild' },
    ],
    servicing: {
      en: 'Beginning of the CU-centric servicing model most modern estates follow.',
      es: 'Inicio del modelo de servicing centrado en CUs que siguen la mayoria de entornos modernos.',
    },
    badges: ['Linux', 'Adaptive', 'Containers'],
  },
  {
    id: '2019',
    version: 'SQL Server 2019',
    year: 2019,
    era: {
      en: 'Intelligent database wave',
      es: 'Ola de base de datos inteligente',
    },
    summary: {
      en: 'Microsoft Learn highlights Big Data Clusters, data virtualization, ADR, UTF-8 support and broader intelligent query processing.',
      es: 'Microsoft Learn destaca Big Data Clusters, data virtualization, ADR, soporte UTF-8 y una familia IQP mas amplia.',
    },
    history: {
      en: 'For many DBAs, 2019 is where ADR and modern IQP become practical reasons to upgrade older OLTP estates.',
      es: 'Para muchos DBAs, 2019 es donde ADR y el IQP moderno se convierten en motivos practicos para actualizar entornos OLTP antiguos.',
    },
    highlights: [
      { en: 'Accelerated Database Recovery', es: 'Accelerated Database Recovery' },
      { en: 'Big Data Clusters and data virtualization', es: 'Big Data Clusters y data virtualization' },
      { en: 'UTF-8 and wider intelligent query processing', es: 'UTF-8 y una familia IQP mas amplia' },
    ],
    servicing: {
      en: 'Mature CU era release, still common in current production estates.',
      es: 'Versión madura de la era CU, todavía muy común en producción.',
    },
    badges: ['ADR', 'UTF-8', 'Big Data'],
  },
  {
    id: '2022',
    version: 'SQL Server 2022',
    year: 2022,
    era: {
      en: 'Azure-connected engine',
      es: 'Motor conectado con Azure',
    },
    summary: {
      en: 'Microsoft Learn highlights Ledger, Managed Instance link, Query Store on readable secondaries, Query Store hints, DOP feedback and Parameter Sensitive Plan optimization.',
      es: 'Microsoft Learn destaca Ledger, Managed Instance link, Query Store en secundarias legibles, Query Store hints, DOP feedback y Parameter Sensitive Plan optimization.',
    },
    history: {
      en: 'Engine internals also improve VLF creation and allow instant file initialization benefits for transaction log growth events up to 64 MB.',
      es: 'Los internos del motor tambien mejoran la creacion de VLFs y permiten beneficios de instant file initialization en autogrowth del log hasta 64 MB.',
    },
    highlights: [
      { en: 'Ledger and Azure SQL Managed Instance link', es: 'Ledger y Azure SQL Managed Instance link' },
      { en: 'PSP optimization, DOP feedback and Query Store hints', es: 'PSP optimization, DOP feedback y Query Store hints' },
      { en: 'Query Store enabled by default for new databases', es: 'Query Store habilitado por defecto en bases nuevas' },
    ],
    servicing: {
      en: 'Strong choice for estates that need modern Query Store, security and hybrid cloud integration without jumping to the newest branch.',
      es: 'Buena opcion para entornos que quieren Query Store, seguridad e integracion hibrida sin saltar a la rama mas nueva.',
    },
    badges: ['Ledger', 'PSP', 'Managed Instance link'],
  },
  {
    id: '2025',
    version: 'SQL Server 2025',
    year: 2025,
    era: {
      en: 'AI and next-generation platform',
      es: 'Plataforma de nueva generacion y AI',
    },
    summary: {
      en: 'Microsoft Learn highlights vector data type, vector index, regex functions, external REST endpoint invocation, TDS 8.0 with TLS 1.3, tempdb governance and ZSTD backup compression.',
      es: 'Microsoft Learn destaca vector data type, vector index, funciones regex, invocacion de endpoints REST externos, TDS 8.0 con TLS 1.3, tempdb governance y compresion de backups con ZSTD.',
    },
    history: {
      en: 'The release also changes editions: Resource Governor reaches Standard, Standard capacity limits rise, Express grows to 50 GB and Web edition is discontinued.',
      es: 'La version tambien cambia ediciones: Resource Governor llega a Standard, suben sus limites, Express pasa a 50 GB y Web edition desaparece.',
    },
    highlights: [
      { en: 'Vector type, vector functions and approximate vector index', es: 'Tipo vector, funciones vectoriales e indice vectorial aproximado' },
      { en: 'Regex, REST endpoints and AI model integration', es: 'Regex, endpoints REST e integracion con modelos AI' },
      { en: 'Standard edition capacity increase and Resource Governor', es: 'Mas capacidad en Standard y Resource Governor' },
    ],
    servicing: {
      en: 'Current branch decision: version choice now includes edition limits, AI features, security defaults and operational maturity.',
      es: 'Decisión de rama actual: la versión ya depende también de límites por edición, AI, seguridad por defecto y madurez operativa.',
    },
    badges: ['Vectors', 'TDS 8.0 / TLS 1.3', 'ZSTD backup'],
  },
];

export const VERSION_DISCOVERY_TSQL = {
  current: `SELECT @@VERSION AS full_version,
       SERVERPROPERTY('ProductVersion') AS product_version,
       SERVERPROPERTY('ProductLevel') AS product_level,
       SERVERPROPERTY('Edition') AS edition,
       SERVERPROPERTY('ProductUpdateLevel') AS update_level,
       SERVERPROPERTY('ProductUpdateReference') AS update_kb;`,
  buildDiscipline: `SELECT SERVERPROPERTY('ProductVersion') AS product_version,
       SERVERPROPERTY('ProductLevel') AS product_level,
       SERVERPROPERTY('Edition') AS edition;

-- Compare this output with the official build list for your branch
-- and keep the instance on a supported CU/GDR strategy.`,
};
