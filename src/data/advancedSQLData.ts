/* ────────────────────────────────────────────────────
   advancedSQLData.ts
   Technical data for OS Config, PerfMon, SQLOS & Modern Features modules
   ──────────────────────────────────────────────────── */

// ─── OS-Level Config ──────────────────────────────────
export interface OSConfigItem {
  id: string;
  titleKey: string;
  descKey: string;
  impactKey: string;
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
  nameKey: string;
  descKey: string;
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
  labelKey: string;
  color: string;
  descKey: string;
}

export const SQLOS_STATES: SQLOSState[] = [
  { id: 'running', labelKey: 'sqlosRunning', color: 'emerald', descKey: 'sqlosRunningDesc' },
  { id: 'runnable', labelKey: 'sqlosRunnable', color: 'amber', descKey: 'sqlosRunnableDesc' },
  { id: 'suspended', labelKey: 'sqlosSuspended', color: 'rose', descKey: 'sqlosSuspendedDesc' },
];

export interface SyncPrimitive {
  id: string;
  nameKey: string;
  levelKey: string;
  granularityKey: string;
  durationKey: string;
  exampleKey: string;
  color: string;
}

export const SYNC_PRIMITIVES: SyncPrimitive[] = [
  { id: 'lock', nameKey: 'sqlosLockName', levelKey: 'sqlosLockLevel', granularityKey: 'sqlosLockGranularity', durationKey: 'sqlosLockDuration', exampleKey: 'sqlosLockExample', color: 'amber' },
  { id: 'latch', nameKey: 'sqlosLatchName', levelKey: 'sqlosLatchLevel', granularityKey: 'sqlosLatchGranularity', durationKey: 'sqlosLatchDuration', exampleKey: 'sqlosLatchExample', color: 'rose' },
  { id: 'spinlock', nameKey: 'sqlosSpinlockName', levelKey: 'sqlosSpinlockLevel', granularityKey: 'sqlosSpinlockGranularity', durationKey: 'sqlosSpinlockDuration', exampleKey: 'sqlosSpinlockExample', color: 'violet' },
];

export interface WaitCategory {
  id: string;
  nameKey: string;
  descKey: string;
  color: string;
  waits: { name: string; descKey: string; fixKey: string }[];
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
export interface ModernFeature {
  id: string;
  titleKey: string;
  descKey: string;
  detailKey: string;
  version: string;
  color: string;
  icon: string;
}

export const MODERN_FEATURES: ModernFeature[] = [
  { id: 'adr', titleKey: 'modAdrTitle', descKey: 'modAdrDesc', detailKey: 'modAdrDetail', version: '2019+', color: 'emerald', icon: 'RotateCcw' },
  { id: 'iqp', titleKey: 'modIqpTitle', descKey: 'modIqpDesc', detailKey: 'modIqpDetail', version: '2019+', color: 'blue', icon: 'Brain' },
  { id: 'hybridBp', titleKey: 'modHybridTitle', descKey: 'modHybridDesc', detailKey: 'modHybridDetail', version: '2019+', color: 'violet', icon: 'Cpu' },
  { id: 'hekaton', titleKey: 'modHekatonTitle', descKey: 'modHekatonDesc', detailKey: 'modHekatonDetail', version: '2014+', color: 'amber', icon: 'Zap' },
  { id: 'sqlpal', titleKey: 'modSqlpalTitle', descKey: 'modSqlpalDesc', detailKey: 'modSqlpalDetail', version: '2017+', color: 'cyan', icon: 'Layers' },
];
