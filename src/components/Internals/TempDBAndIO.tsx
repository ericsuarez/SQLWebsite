import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Database,
  HardDrive,
  Layers,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  IO_WRITER_PROFILES,
  TEMPDB_ALLOCATION_PAGES,
  TEMPDB_IO_TSQL,
  TEMPDB_LAYOUT_SCENARIOS,
  type LocalizedText,
} from '../../data/advancedSQLData';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

type PageId = 'pfs' | 'gam' | 'sgam';
type LayoutId = 'single' | 'multiple';
type WriterId = 'checkpoint' | 'lazy-writer';
type TempDbWorkloadId = 'temp-table' | 'sort-spill' | 'version-store';

interface TempDbWorkloadStep {
  title: LocalizedText;
  detail: LocalizedText;
}

interface TempDbWorkload {
  id: TempDbWorkloadId;
  label: LocalizedText;
  summary: LocalizedText;
  query: string;
  wait: string;
  pageHeat: Record<PageId, number>;
  singleQueue: number;
  multipleQueue: number;
  filePulse: number;
  steps: TempDbWorkloadStep[];
}

interface WriterStage {
  title: LocalizedText;
  detail: LocalizedText;
  signal: LocalizedText;
  query: string;
  dirtyPages: number;
  freeBuffers: number;
  recoveryDebt: number;
}

const TEMPDB_WORKLOADS: TempDbWorkload[] = [
  {
    id: 'temp-table',
    label: { en: 'Temp table storm', es: 'Tormenta de #temp' },
    summary: {
      en: 'Many sessions create and drop temp tables at once, repeatedly touching PFS and SGAM.',
      es: 'Muchas sesiones crean y borran tablas temporales a la vez, golpeando una y otra vez PFS y SGAM.',
    },
    query: 'CREATE TABLE #stage (id int, payload char(4000)); INSERT INTO #stage SELECT TOP (4000) ...',
    wait: 'PAGELATCH_UP 2:1:1 / 2:1:3',
    pageHeat: { pfs: 96, gam: 62, sgam: 88 },
    singleQueue: 18,
    multipleQueue: 6,
    filePulse: 18,
    steps: [
      {
        title: { en: 'Create temp object', es: 'Crear objeto temporal' },
        detail: {
          en: 'The worker asks TempDB for the first page to host the temp structure.',
          es: 'El worker pide a TempDB la primera pagina que alojara la estructura temporal.',
        },
      },
      {
        title: { en: 'Touch allocation maps', es: 'Tocar mapas de asignacion' },
        detail: {
          en: 'PFS and SGAM are checked to find free space and mixed extents.',
          es: 'Se consultan PFS y SGAM para buscar espacio libre y extents mixtos disponibles.',
        },
      },
      {
        title: { en: 'Latch queue builds', es: 'Se forma la cola de latches' },
        detail: {
          en: 'Concurrent workers stack behind the same hot metadata page.',
          es: 'Los workers concurrentes se apilan detras de la misma pagina caliente de metadatos.',
        },
      },
      {
        title: { en: 'Workload spreads or stalls', es: 'La carga se reparte o se atasca' },
        detail: {
          en: 'With more files the round-robin allocator reduces the hotspot; with one file the queue keeps growing.',
          es: 'Con mas archivos el round-robin reparte el hotspot; con un solo archivo la cola sigue creciendo.',
        },
      },
    ],
  },
  {
    id: 'sort-spill',
    label: { en: 'Sort spill', es: 'Sort spill' },
    summary: {
      en: 'A grant is not enough, so worktables spill and TempDB starts allocating extents quickly.',
      es: 'La memoria concedida no basta, asi que las worktables hacen spill y TempDB empieza a asignar extents con rapidez.',
    },
    query: 'SELECT ... ORDER BY huge_column OPTION (MAXDOP 8); -- spill to tempdb',
    wait: 'PAGELATCH_UP 2:1:1 / WRITELOG secondary',
    pageHeat: { pfs: 84, gam: 78, sgam: 59 },
    singleQueue: 14,
    multipleQueue: 5,
    filePulse: 14,
    steps: [
      {
        title: { en: 'Grant falls short', es: 'La grant se queda corta' },
        detail: {
          en: 'The operator cannot keep all rows in memory and starts writing worktable chunks.',
          es: 'El operador no puede mantener todas las filas en memoria y empieza a escribir bloques de worktable.',
        },
      },
      {
        title: { en: 'Extent requests begin', es: 'Empiezan las peticiones de extents' },
        detail: {
          en: 'GAM is consulted repeatedly while new spill extents are reserved.',
          es: 'GAM se consulta repetidamente mientras se reservan nuevos extents para el spill.',
        },
      },
      {
        title: { en: 'Metadata heats up', es: 'Sube la temperatura de metadatos' },
        detail: {
          en: 'PFS still participates to place pages, while concurrency turns latch waits visible.',
          es: 'PFS sigue interviniendo para ubicar paginas, y la concurrencia hace visibles las esperas de latch.',
        },
      },
      {
        title: { en: 'Files absorb pressure', es: 'Los archivos absorben presion' },
        detail: {
          en: 'Equal TempDB files split the allocation path and keep the queue shorter.',
          es: 'Los archivos iguales de TempDB dividen la ruta de asignacion y mantienen la cola mas corta.',
        },
      },
    ],
  },
  {
    id: 'version-store',
    label: { en: 'Version store burst', es: 'Rafaga de version store' },
    summary: {
      en: 'Snapshot or RCSI activity grows row versions and keeps TempDB metadata hot over time.',
      es: 'La actividad de Snapshot o RCSI hace crecer row versions y mantiene calientes los metadatos de TempDB durante mas tiempo.',
    },
    query: 'UPDATE dbo.Orders SET status = ...; -- readers under RCSI keep versions alive',
    wait: 'PAGELATCH_EX 2:1:2',
    pageHeat: { pfs: 71, gam: 92, sgam: 66 },
    singleQueue: 12,
    multipleQueue: 4,
    filePulse: 12,
    steps: [
      {
        title: { en: 'Versions start flowing', es: 'Empiezan a fluir versiones' },
        detail: {
          en: 'Writers generate row versions while readers keep them alive longer.',
          es: 'Los escritores generan row versions mientras los lectores las mantienen vivas durante mas tiempo.',
        },
      },
      {
        title: { en: 'Extents stay reserved', es: 'Los extents quedan reservados' },
        detail: {
          en: 'GAM is revisited constantly because the version store keeps asking for space.',
          es: 'GAM se revisita constantemente porque el version store sigue pidiendo espacio.',
        },
      },
      {
        title: { en: 'Cleanup lags behind', es: 'La limpieza va por detras' },
        detail: {
          en: 'If readers linger, old versions cannot be removed and metadata pressure remains high.',
          es: 'Si los lectores duran demasiado, las versiones antiguas no se pueden retirar y la presion sobre metadatos se mantiene alta.',
        },
      },
      {
        title: { en: 'Layout decides severity', es: 'El layout decide la gravedad' },
        detail: {
          en: 'More files cannot fix every version-store issue, but they do dilute the metadata hotspot.',
          es: 'Mas archivos no arreglan todos los problemas del version store, pero si diluyen el hotspot de metadatos.',
        },
      },
    ],
  },
];
const WRITER_STAGE_POSITIONS = ['8%', '37%', '66%', '92%'];
const WRITER_STAGES: Record<WriterId, WriterStage[]> = {
  checkpoint: [
    {
      title: { en: 'Dirty pages accumulate', es: 'Se acumulan paginas sucias' },
      detail: {
        en: 'User activity dirties buffers faster than storage has persisted them yet.',
        es: 'La actividad de usuario ensucia buffers mas rapido de lo que el almacenamiento los ha persistido todavia.',
      },
      signal: {
        en: 'Recovery target says redo debt is growing.',
        es: 'El objetivo de recovery indica que la deuda de redo esta creciendo.',
      },
      query: 'CHECKPOINT; -- or indirect checkpoint background cycle',
      dirtyPages: 86,
      freeBuffers: 38,
      recoveryDebt: 82,
    },
    {
      title: { en: 'Checkpoint wakes up', es: 'Checkpoint se activa' },
      detail: {
        en: 'The checkpoint worker scans dirty pages according to recovery objectives, not memory pressure.',
        es: 'El worker de checkpoint recorre paginas sucias segun objetivos de recovery, no por presion inmediata de memoria.',
      },
      signal: {
        en: 'Target recovery time / recovery interval drives the flush.',
        es: 'Target recovery time o recovery interval empujan el vaciado.',
      },
      query: `SELECT * FROM sys.dm_os_performance_counters WHERE counter_name = 'Checkpoint pages/sec';`,
      dirtyPages: 72,
      freeBuffers: 42,
      recoveryDebt: 58,
    },
    {
      title: { en: 'Async writes leave', es: 'Salen escrituras asincronas' },
      detail: {
        en: 'Large batches move dirty pages to disk so restart time stays under control.',
        es: 'Grandes lotes llevan paginas sucias a disco para que el reinicio siga bajo control.',
      },
      signal: {
        en: 'Disk sees a broader write sweep, usually sequential enough to be efficient.',
        es: 'El disco ve una barrida de escrituras mas amplia, normalmente bastante secuencial para ser eficiente.',
      },
      query: `SELECT counter_name, cntr_value FROM sys.dm_os_performance_counters WHERE counter_name IN ('Page writes/sec', 'Checkpoint pages/sec');`,
      dirtyPages: 36,
      freeBuffers: 49,
      recoveryDebt: 24,
    },
    {
      title: { en: 'Recovery point advances', es: 'Avanza el punto de recovery' },
      detail: {
        en: 'The restart horizon is now closer to the current LSN, so crash recovery has less redo ahead.',
        es: 'El horizonte de reinicio queda mas cerca del LSN actual, asi que crash recovery tiene menos redo pendiente.',
      },
      signal: {
        en: 'Checkpoint solved restart debt, not a free-buffer emergency.',
        es: 'Checkpoint ha resuelto deuda de reinicio, no una emergencia de buffers libres.',
      },
      query: 'SELECT DB_NAME(database_id), recovery_model_desc FROM sys.databases;',
      dirtyPages: 18,
      freeBuffers: 54,
      recoveryDebt: 9,
    },
  ],
  'lazy-writer': [
    {
      title: { en: 'Free list shrinks', es: 'La free list se encoge' },
      detail: {
        en: 'The buffer pool starts running short on reusable pages for incoming reads.',
        es: 'El buffer pool empieza a quedarse corto de paginas reutilizables para lecturas entrantes.',
      },
      signal: {
        en: 'RESOURCE_MEMPHYSICAL_LOW and free list stalls begin to matter.',
        es: 'RESOURCE_MEMPHYSICAL_LOW y free list stalls empiezan a importar.',
      },
      query: `SELECT * FROM sys.dm_os_ring_buffers WHERE ring_buffer_type = 'RING_BUFFER_RESOURCE_MONITOR';`,
      dirtyPages: 64,
      freeBuffers: 9,
      recoveryDebt: 44,
    },
    {
      title: { en: 'Lazy Writer scans', es: 'Lazy Writer escanea' },
      detail: {
        en: 'It looks for candidates to evict and writes just enough dirty pages to recover breathing room.',
        es: 'Busca candidatos a expulsar y escribe solo las paginas sucias necesarias para recuperar margen.',
      },
      signal: {
        en: 'This is a memory survival path, not a restart-time optimization path.',
        es: 'Esta es una ruta de supervivencia de memoria, no una optimizacion del tiempo de arranque.',
      },
      query: `SELECT counter_name, cntr_value FROM sys.dm_os_performance_counters WHERE counter_name IN ('Lazy writes/sec', 'Free list stalls/sec');`,
      dirtyPages: 52,
      freeBuffers: 14,
      recoveryDebt: 42,
    },
    {
      title: { en: 'Targeted writes happen', es: 'Se hacen escrituras selectivas' },
      detail: {
        en: 'The writer flushes the specific buffers blocking eviction so new reads can move in.',
        es: 'El escritor vacia los buffers concretos que impiden expulsiones para que entren lecturas nuevas.',
      },
      signal: {
        en: 'Write volume may be smaller than checkpoint, but the urgency is higher.',
        es: 'El volumen de escritura puede ser menor que en checkpoint, pero la urgencia es mas alta.',
      },
      query: 'SELECT * FROM sys.dm_os_sys_memory;',
      dirtyPages: 39,
      freeBuffers: 23,
      recoveryDebt: 39,
    },
    {
      title: { en: 'Buffer pool breathes again', es: 'El buffer pool vuelve a respirar' },
      detail: {
        en: 'The goal is simply to restore reusable buffers and keep workers from stalling.',
        es: 'El objetivo es simplemente restaurar buffers reutilizables y evitar que los workers se bloqueen.',
      },
      signal: {
        en: 'Recovery debt barely changes because restart time was never the primary target.',
        es: 'La deuda de recovery apenas cambia porque el tiempo de reinicio nunca fue el objetivo principal.',
      },
      query: `SELECT counter_name, cntr_value FROM sys.dm_os_performance_counters WHERE counter_name = 'Page life expectancy';`,
      dirtyPages: 31,
      freeBuffers: 36,
      recoveryDebt: 37,
    },
  ],
};

function pick(language: 'en' | 'es', text: LocalizedText) {
  return language === 'es' ? text.es : text.en;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function metricTone(value: number, reverse?: boolean) {
  if (reverse) {
    if (value >= 60) return 'from-emerald-400 to-cyan-300';
    if (value >= 30) return 'from-amber-400 to-orange-300';
    return 'from-rose-500 to-orange-400';
  }

  if (value >= 70) return 'from-rose-500 to-orange-400';
  if (value >= 35) return 'from-amber-400 to-orange-300';
  return 'from-emerald-400 to-cyan-300';
}

export function TempDBAndIO() {
  const { language, t } = useLanguage();
  const [activePageId, setActivePageId] = useState<PageId>('pfs');
  const [activeLayoutId, setActiveLayoutId] = useState<LayoutId>('multiple');
  const [activeWriterId, setActiveWriterId] = useState<WriterId>('checkpoint');
  const [activeWorkloadId, setActiveWorkloadId] = useState<TempDbWorkloadId>('temp-table');
  const [isTempdbPlaying, setIsTempdbPlaying] = useState(true);
  const [tempdbFrame, setTempdbFrame] = useState(0);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isWriterPlaying, setIsWriterPlaying] = useState(true);
  const [writerStageIndex, setWriterStageIndex] = useState(0);

  const activePage = TEMPDB_ALLOCATION_PAGES.find((page) => page.id === activePageId) ?? TEMPDB_ALLOCATION_PAGES[0];
  const activeLayout = TEMPDB_LAYOUT_SCENARIOS.find((scenario) => scenario.id === activeLayoutId) ?? TEMPDB_LAYOUT_SCENARIOS[1];
  const activeWriter = IO_WRITER_PROFILES.find((profile) => profile.id === activeWriterId) ?? IO_WRITER_PROFILES[0];
  const activeWorkload = TEMPDB_WORKLOADS.find((workload) => workload.id === activeWorkloadId) ?? TEMPDB_WORKLOADS[0];
  const writerStages = WRITER_STAGES[activeWriterId];

  useEffect(() => {
    if (!isTempdbPlaying) return;
    const timer = window.setInterval(() => setTempdbFrame((current) => current + 1), 1800);
    return () => window.clearInterval(timer);
  }, [isTempdbPlaying]);

  useEffect(() => {
    if (!isWriterPlaying) return;
    const timer = window.setInterval(
      () => setWriterStageIndex((current) => (current + 1) % writerStages.length),
      2400
    );
    return () => window.clearInterval(timer);
  }, [isWriterPlaying, writerStages.length]);

  useEffect(() => {
    setTempdbFrame(0);
    setSelectedFileIndex(0);
  }, [activeLayoutId, activeWorkloadId]);

  useEffect(() => {
    setWriterStageIndex(0);
  }, [activeWriterId]);

  const tempdbVisual = useMemo(() => {
    const stepIndex = tempdbFrame % activeWorkload.steps.length;
    const activeFileIndex = activeLayout.id === 'single' ? 0 : tempdbFrame % activeLayout.files;
    const queueDepth = activeLayout.id === 'single' ? activeWorkload.singleQueue : activeWorkload.multipleQueue;

    const files = Array.from({ length: activeLayout.files }, (_, index) => {
      const base = activeLayout.pressure[index] ?? activeLayout.pressure[activeLayout.pressure.length - 1] ?? 0;
      const pulse = index === activeFileIndex ? activeWorkload.filePulse : activeLayout.id === 'single' ? 0 : 4;
      const pressure = clamp(base + pulse, 8, 99);
      const queue = clamp(
        Math.round(queueDepth * (index === activeFileIndex ? 1 : activeLayout.id === 'single' ? 1 : 0.55)),
        1,
        24
      );

      return {
        id: `tempdev${index + 1}`,
        pressure,
        queue,
        hotPage:
          Object.entries(activeWorkload.pageHeat).sort((left, right) => right[1] - left[1])[index % 3]?.[0] ?? 'pfs',
      };
    });

    const pageHeat = {
      pfs: clamp(
        activeWorkload.pageHeat.pfs + (activeLayout.id === 'single' ? 0 : -18) + (stepIndex === 1 ? 4 : 0),
        12,
        99
      ),
      gam: clamp(
        activeWorkload.pageHeat.gam + (activeLayout.id === 'single' ? 0 : -14) + (stepIndex === 2 ? 5 : 0),
        12,
        99
      ),
      sgam: clamp(
        activeWorkload.pageHeat.sgam + (activeLayout.id === 'single' ? 0 : -16) + (stepIndex === 1 ? 6 : 0),
        12,
        99
      ),
    };

    return {
      activeFileIndex,
      stepIndex,
      files,
      pageHeat,
      queueDepth,
      currentStep: activeWorkload.steps[stepIndex],
      events: Array.from({ length: 3 }, (_, offset) => {
        const eventStepIndex =
          (stepIndex - offset + activeWorkload.steps.length) % activeWorkload.steps.length;
        const eventFileIndex =
          activeLayout.id === 'single'
            ? 0
            : (activeFileIndex - offset + activeLayout.files) % activeLayout.files;

        return {
          id: `${activeWorkload.id}-${eventStepIndex}-${offset}`,
          file: `tempdev${eventFileIndex + 1}`,
          step: activeWorkload.steps[eventStepIndex],
        };
      }),
    };
  }, [activeLayout, activeWorkload, tempdbFrame]);

  const selectedFile = tempdbVisual.files[selectedFileIndex] ?? tempdbVisual.files[0];
  const activeWriterStage = writerStages[writerStageIndex] ?? writerStages[0];

  return (
    <div className="flex h-full flex-col gap-6 text-slate-200">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(248,113,113,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_28%)]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-5xl">
            <h2 className="mb-2 flex items-center gap-3 bg-gradient-to-r from-red-400 via-orange-300 to-blue-300 bg-clip-text text-3xl font-bold text-transparent">
              <HardDrive className="h-8 w-8 text-red-400" />
              {t('tabTempdbIo')}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {language === 'es'
                ? 'TempDB no se rompe solo por tamano: se rompe por como compiten las sesiones sobre PFS, GAM y SGAM. Y en I/O no escribe igual Checkpoint que Lazy Writer. Aqui puedes verlo en movimiento.'
                : 'TempDB does not fall apart only because of size: it falls apart because sessions compete over PFS, GAM and SGAM. And in I/O, Checkpoint and Lazy Writer do not write for the same reason. Here you can watch both paths move.'}
            </p>
          </div>
          <div className="grid gap-2 text-right">
            <div className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
              PAGELATCH_UP
            </div>
            <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
              CHECKPOINT
            </div>
            <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
              RESOURCE_MEMPHYSICAL_LOW
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
              {language === 'es' ? 'Simulador TempDB' : 'TempDB Simulator'}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {language === 'es'
                ? 'Pulsa una carga, mira que pagina se calienta y como cambia al repartir TempDB en varios archivos'
                : 'Pick a workload, watch which page heats up and see how the picture changes once TempDB is split across multiple files'}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsTempdbPlaying((current) => !current)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {isTempdbPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isTempdbPlaying ? (language === 'es' ? 'Pausar' : 'Pause') : 'Play'}
            </button>
            <button
              onClick={() => {
                setTempdbFrame(0);
                setSelectedFileIndex(0);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {language === 'es' ? 'Reset visual' : 'Reset visual'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TEMPDB_WORKLOADS.map((workload) => (
            <button
              key={workload.id}
              onClick={() => setActiveWorkloadId(workload.id)}
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-bold transition-all',
                activeWorkloadId === workload.id
                  ? 'border-red-500/30 bg-red-500/15 text-red-200'
                  : 'border-white/10 bg-black/20 text-white/60 hover:border-white/20 hover:bg-white/[0.05] hover:text-white'
              )}
            >
              {pick(language, workload.label)}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {TEMPDB_LAYOUT_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setActiveLayoutId(scenario.id)}
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-bold transition-all',
                activeLayoutId === scenario.id
                  ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-200'
                  : 'border-white/10 bg-black/20 text-white/60 hover:border-white/20 hover:bg-white/[0.05] hover:text-white'
              )}
            >
              {pick(language, scenario.title)}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.14fr)_360px]">
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {TEMPDB_ALLOCATION_PAGES.map((page) => {
                const pageId = page.id as PageId;
                const heat = tempdbVisual.pageHeat[pageId];
                const isActive = activePageId === pageId;

                return (
                  <motion.button
                    key={page.id}
                    whileHover={{ y: -3 }}
                    onClick={() => setActivePageId(pageId)}
                    className={cn(
                      'rounded-3xl border p-5 text-left transition-all',
                      isActive
                        ? 'border-red-500/25 bg-red-500/10 shadow-[0_0_24px_rgba(248,113,113,0.14)]'
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white">{page.name}</div>
                        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-red-300">
                          {page.pageId}
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-bold text-white/70">
                        {heat}%
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/65">{pick(language, page.summary)}</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${heat}%` }}
                        transition={{ duration: 0.45 }}
                        className={cn('h-full rounded-full bg-gradient-to-r', metricTone(heat))}
                      />
                    </div>
                    <p className="mt-3 text-xs leading-6 text-white/55">
                      {heat >= 80
                        ? language === 'es'
                          ? 'Hot page clara: aqui es donde mas cola ves ahora.'
                          : 'Clear hot page: this is where the queue is building now.'
                        : heat >= 55
                          ? language === 'es'
                            ? 'Participa mucho en la ruta, pero no es el unico cuello.'
                            : 'This page is heavily involved, but it is not the only bottleneck.'
                          : language === 'es'
                            ? 'Participa en la asignacion, aunque otra pagina lleva la peor parte.'
                            : 'This page participates in allocation, but another page carries most of the pain.'}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                    {language === 'es' ? 'Que esta entrando ahora' : 'What is coming in now'}
                  </div>
                  <p className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs leading-6 text-cyan-200">
                    {activeWorkload.query}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/80">{pick(language, activeWorkload.summary)}</p>
                </div>
                <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">
                    {language === 'es' ? 'Espera visible' : 'Visible wait'}
                  </div>
                  <div className="mt-2 text-sm font-bold text-white">{activeWorkload.wait}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {activeWorkload.steps.map((step, index) => {
                  const isActive = tempdbVisual.stepIndex === index;
                  return (
                    <button
                      key={`${activeWorkload.id}-${index}`}
                      onClick={() => setTempdbFrame(index)}
                      className={cn(
                        'rounded-2xl border p-4 text-left transition-all',
                        isActive
                          ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-100'
                          : 'border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:bg-white/[0.05]'
                      )}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                        {language === 'es' ? `Paso ${index + 1}` : `Step ${index + 1}`}
                      </div>
                      <div className="mt-2 text-sm font-bold">{pick(language, step.title)}</div>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeWorkload.id}-${tempdbVisual.stepIndex}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-5 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5"
                >
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                    <Activity className="h-4 w-4" />
                    {pick(language, tempdbVisual.currentStep.title)}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/85">{pick(language, tempdbVisual.currentStep.detail)}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                      {language === 'es' ? 'Round-robin por archivo' : 'File round-robin view'}
                    </div>
                    <h4 className="mt-2 text-lg font-bold text-white">{pick(language, activeLayout.title)}</h4>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                      {language === 'es' ? 'Cola estimada' : 'Estimated queue'}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-white">{tempdbVisual.queueDepth}</div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {tempdbVisual.files.map((file, index) => {
                    const isActive = index === tempdbVisual.activeFileIndex;
                    const isSelected = index === selectedFileIndex;
                    return (
                      <motion.button
                        key={file.id}
                        whileHover={{ y: -2 }}
                        onClick={() => setSelectedFileIndex(index)}
                        className={cn(
                          'rounded-3xl border p-4 text-left transition-all',
                          isSelected
                            ? 'border-cyan-500/25 bg-cyan-500/10'
                            : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/[0.04]'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Database className={cn('h-4 w-4', isActive ? 'text-cyan-300' : 'text-blue-300')} />
                            <span className="text-sm font-bold text-white">{file.id}</span>
                          </div>
                          {isActive && (
                            <motion.span
                              className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300"
                              animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.22, 1] }}
                              transition={{ duration: 1.1, repeat: Infinity }}
                            />
                          )}
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${file.pressure}%` }}
                            transition={{ duration: 0.45 }}
                            className={cn('h-full rounded-full bg-gradient-to-r', metricTone(file.pressure))}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {Array.from({ length: clamp(file.queue, 1, 12) }, (_, dotIndex) => (
                            <motion.span
                              key={`${file.id}-${dotIndex}`}
                              className="h-2 w-2 rounded-full bg-white/30"
                              animate={isActive ? { opacity: [0.25, 1, 0.25] } : { opacity: 0.4 }}
                              transition={{
                                duration: 1.2,
                                repeat: isActive ? Infinity : 0,
                                delay: dotIndex * 0.05,
                              }}
                            />
                          ))}
                        </div>

                        <p className="mt-3 text-xs leading-6 text-white/60">
                          {language === 'es'
                            ? `Mapa mas tocado ahora: ${String(file.hotPage).toUpperCase()}.`
                            : `Most touched map right now: ${String(file.hotPage).toUpperCase()}.`}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>

                <p className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/75">
                  {pick(language, activeLayout.note)}
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                  <ShieldAlert className="h-4 w-4" />
                  {language === 'es' ? 'Lectura rapida del archivo' : 'Quick file read'}
                </div>
                <h4 className="mt-4 text-xl font-bold text-white">{selectedFile?.id ?? 'tempdev1'}</h4>
                <p className="mt-3 text-sm leading-7 text-white/80">
                  {language === 'es'
                    ? `Ahora mismo este archivo soporta aproximadamente ${selectedFile?.queue ?? 0} workers en cola con una presion de ${selectedFile?.pressure ?? 0}%.`
                    : `Right now this file is carrying roughly ${selectedFile?.queue ?? 0} queued workers with ${selectedFile?.pressure ?? 0}% pressure.`}
                </p>
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                    {language === 'es' ? 'Mitigacion principal' : 'Primary mitigation'}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/80">{pick(language, activePage.fix)}</p>
                </div>
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">
                    <AlertTriangle className="h-4 w-4" />
                    {language === 'es' ? 'Sintoma clasico' : 'Classic symptom'}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/80">{pick(language, activePage.symptom)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                <Layers className="h-4 w-4" />
                {language === 'es' ? 'Evento en pantalla' : 'On-screen event'}
              </div>
              <div className="mt-4 space-y-3">
                {tempdbVisual.events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={cn(
                      'rounded-2xl border p-4',
                      index === 0 ? 'border-cyan-500/25 bg-cyan-500/10' : 'border-white/10 bg-black/25'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">{event.file}</span>
                      <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-bold text-white/65">
                        {language === 'es'
                          ? `Paso ${((tempdbVisual.stepIndex - index + activeWorkload.steps.length) % activeWorkload.steps.length) + 1}`
                          : `Step ${((tempdbVisual.stepIndex - index + activeWorkload.steps.length) % activeWorkload.steps.length) + 1}`}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-bold text-white">{pick(language, event.step.title)}</div>
                    <p className="mt-2 text-xs leading-6 text-white/60">{pick(language, event.step.detail)}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <h4 className="text-lg font-bold text-red-300">
                {language === 'es' ? 'T-SQL listo para TempDB' : 'Ready-to-paste TempDB T-SQL'}
              </h4>
              <p className="mt-2 text-sm text-white/60">
                {language === 'es'
                  ? 'Primero confirma la espera, despues verifica el reparto por archivos.'
                  : 'Confirm the wait first, then verify file distribution.'}
              </p>
              <div className="mt-5 space-y-4">
                <CopyCodeBlock code={TEMPDB_IO_TSQL.tempdbContention} accent="rose" />
                <CopyCodeBlock code={TEMPDB_IO_TSQL.ioWriters} accent="blue" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
              {language === 'es' ? 'Escritores de I/O asincrono' : 'Async I/O Writers'}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {language === 'es'
                ? 'Sigue la misma pagina sucia y veras que Checkpoint persigue recovery mientras Lazy Writer persigue buffers libres'
                : 'Follow the same dirty page and you will see Checkpoint chase recovery while Lazy Writer chases free buffers'}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {IO_WRITER_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setActiveWriterId(profile.id)}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-bold transition-all',
                  activeWriterId === profile.id
                    ? profile.id === 'checkpoint'
                      ? 'border-blue-500/30 bg-blue-500/15 text-blue-200'
                      : 'border-amber-500/30 bg-amber-500/15 text-amber-200'
                    : 'border-white/10 bg-black/20 text-white/60 hover:border-white/20 hover:bg-white/[0.05] hover:text-white'
                )}
              >
                {pick(language, profile.title)}
              </button>
            ))}
            <button
              onClick={() => setIsWriterPlaying((current) => !current)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {isWriterPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isWriterPlaying ? (language === 'es' ? 'Pausar' : 'Pause') : 'Play'}
            </button>
            <button
              onClick={() => setWriterStageIndex(0)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {language === 'es' ? 'Reiniciar fase' : 'Reset phase'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.14fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                {language === 'es' ? 'Ruta visual del escritor' : 'Visual writer path'}
              </div>

              <div className="relative mt-6 hidden h-6 md:block">
                <div className="absolute left-[8%] right-[8%] top-1/2 h-px -translate-y-1/2 bg-white/10" />
                <motion.div
                  className={cn(
                    'absolute top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_18px_rgba(255,255,255,0.45)]',
                    activeWriter.id === 'checkpoint' ? 'bg-blue-300' : 'bg-amber-300'
                  )}
                  animate={{ left: WRITER_STAGE_POSITIONS[writerStageIndex] }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {writerStages.map((stage, index) => {
                  const isActive = writerStageIndex === index;
                  return (
                    <button
                      key={`${activeWriter.id}-${index}`}
                      onClick={() => setWriterStageIndex(index)}
                      className={cn(
                        'rounded-2xl border p-4 text-left transition-all',
                        isActive
                          ? activeWriter.id === 'checkpoint'
                            ? 'border-blue-500/25 bg-blue-500/10 text-blue-100'
                            : 'border-amber-500/25 bg-amber-500/10 text-amber-100'
                          : 'border-white/10 bg-black/25 text-white/70 hover:border-white/20 hover:bg-white/[0.05]'
                      )}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                        {language === 'es' ? `Fase ${index + 1}` : `Phase ${index + 1}`}
                      </div>
                      <div className="mt-2 text-sm font-bold">{pick(language, stage.title)}</div>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeWriter.id}-${writerStageIndex}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={cn(
                    'mt-5 rounded-3xl border p-5',
                    activeWriter.id === 'checkpoint'
                      ? 'border-blue-500/20 bg-blue-500/10'
                      : 'border-amber-500/20 bg-amber-500/10'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]">
                      <Zap className="h-4 w-4" />
                      {pick(language, activeWriterStage.title)}
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/75">
                      {pick(language, activeWriter.trigger)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/85">{pick(language, activeWriterStage.detail)}</p>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                      {language === 'es' ? 'Senal del momento' : 'Signal right now'}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/75">{pick(language, activeWriterStage.signal)}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  id: 'dirty',
                  label: language === 'es' ? 'Paginas sucias' : 'Dirty pages',
                  value: activeWriterStage.dirtyPages,
                  reverse: false,
                },
                {
                  id: 'free',
                  label: language === 'es' ? 'Buffers libres' : 'Free buffers',
                  value: activeWriterStage.freeBuffers,
                  reverse: true,
                },
                {
                  id: 'recovery',
                  label: language === 'es' ? 'Deuda de recovery' : 'Recovery debt',
                  value: activeWriterStage.recoveryDebt,
                  reverse: false,
                },
              ].map((metric) => (
                <div key={metric.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">{metric.label}</div>
                  <div className="mt-3 text-2xl font-bold text-white">{metric.value}%</div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 0.45 }}
                      className={cn('h-full rounded-full bg-gradient-to-r', metricTone(metric.value, metric.reverse))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  <ArrowRight className="h-4 w-4" />
                  {language === 'es' ? 'Lo que esta pasando ahora' : 'What is happening now'}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    {
                      title: language === 'es' ? 'Buffer Pool' : 'Buffer Pool',
                      value: pick(language, activeWriter.goal),
                    },
                    {
                      title: language === 'es' ? 'Escritor activo' : 'Active writer',
                      value: pick(language, activeWriter.summary),
                    },
                    {
                      title: language === 'es' ? 'Patron de escritura' : 'Write pattern',
                      value: pick(language, activeWriter.writePattern),
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{item.title}</div>
                      <p className="mt-3 text-sm leading-7 text-white/75">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  <Database className="h-4 w-4" />
                  {language === 'es' ? 'Consulta / evidencia' : 'Query / evidence'}
                </div>
                <p className="mt-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-mono text-xs leading-6 text-cyan-200">
                  {activeWriterStage.query}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeWriter.badges.map((badge) => (
                    <span
                      key={`${activeWriter.id}-${badge}`}
                      className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/70"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <h4 className="text-lg font-bold text-white">
              {language === 'es' ? 'Script del escritor activo' : 'Active writer script'}
            </h4>
            <p className="mt-2 text-sm text-white/60">
              {language === 'es'
                ? 'Copia el bloque y correlacionalo con tus contadores y con el estado del buffer pool.'
                : 'Copy the block and correlate it with your counters and the state of the buffer pool.'}
            </p>
            <div className="mt-5">
              <CopyCodeBlock
                code={activeWriter.script}
                accent={activeWriter.id === 'checkpoint' ? 'blue' : 'amber'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
