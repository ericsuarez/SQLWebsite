export interface LocalizedText {
  en: string;
  es: string;
}

export interface TempDbIoBaseline {
  id:
    | 'hot-waiters'
    | 'tempdb-read-ms'
    | 'data-read-ms'
    | 'data-write-ms'
    | 'log-write-ms'
    | 'pageiolatch-wait-ms'
    | 'writelog-wait-ms'
    | 'pending-io'
    | 'lazy-writes'
    | 'free-list-stalls';
  scope: 'tempdb' | 'reads' | 'writes' | 'log' | 'memory';
  title: LocalizedText;
  summary: LocalizedText;
  whatToRead: LocalizedText;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  healthy: number;
  warning: number;
  direction: 'lower-is-better';
  healthyText: LocalizedText;
  warningText: LocalizedText;
  criticalText: LocalizedText;
  badges: string[];
  query: string;
}

export interface TempDbIoObservation {
  label: LocalizedText;
  value: string;
  tone: 'emerald' | 'amber' | 'cyan' | 'rose' | 'violet';
}

export interface TempDbIoChoice {
  id: string;
  label: LocalizedText;
  explanation: LocalizedText;
}

export interface TempDbIoDiagnosticCase {
  id:
    | 'metadata'
    | 'spill'
    | 'cold-cache'
    | 'writelog'
    | 'version-store'
    | 'memory'
    | 'checkpoint';
  title: LocalizedText;
  question: LocalizedText;
  summary: LocalizedText;
  suspicion: LocalizedText;
  badges: string[];
  accent: 'emerald' | 'amber' | 'cyan' | 'rose' | 'violet';
  observations: TempDbIoObservation[];
  choices: TempDbIoChoice[];
  correctChoiceId: string;
  diagnosis: LocalizedText;
  dbaFocus: LocalizedText;
  dbaActions: LocalizedText[];
  caution: LocalizedText;
  query: string;
  followUp: LocalizedText[];
}

export const TEMPDB_IO_BASELINES: TempDbIoBaseline[] = [
  {
    id: 'hot-waiters',
    scope: 'tempdb',
    title: { en: 'TempDB hot waiters', es: 'Sesiones esperando en TempDB' },
    summary: {
      en: 'Active waiters on 2:1:1 / 2:1:2 / 2:1:3.',
      es: 'Sesiones activas esperando en 2:1:1 / 2:1:2 / 2:1:3.',
    },
    whatToRead: {
      en: 'Short spikes are normal. Sustained queues mean metadata pain.',
      es: 'Picos cortos son normales. Colas sostenidas significan dolor de metadatos.',
    },
    unit: 'sesiones',
    min: 0,
    max: 12,
    step: 1,
    defaultValue: 2,
    healthy: 1,
    warning: 4,
    direction: 'lower-is-better',
    healthyText: { en: '0-1: normal.', es: '0-1: normal.' },
    warningText: { en: '2-4: watch file fan-out.', es: '2-4: vigila el reparto entre archivos.' },
    criticalText: { en: '5+: classic metadata contention.', es: '5+: contención clásica de metadatos.' },
    badges: ['PAGELATCH_UP', '2:1:1', '2:1:2', '2:1:3'],
    query: `SELECT COUNT(*) AS hot_waiters
FROM sys.dm_os_waiting_tasks
WHERE wait_type LIKE 'PAGELATCH%'
  AND (
    resource_description LIKE '2:1:1%'
    OR resource_description LIKE '2:1:2%'
    OR resource_description LIKE '2:1:3%'
  );`,
  },
  {
    id: 'tempdb-read-ms',
    scope: 'tempdb',
    title: { en: 'TempDB read latency', es: 'Latencia de lectura en TempDB' },
    summary: {
      en: 'Average read ms for TempDB files.',
      es: 'Media de ms de lectura para los ficheros de TempDB.',
    },
    whatToRead: {
      en: 'Useful when spills hit disk and PAGEIOLATCH_SH starts surfacing.',
      es: 'Útil cuando los spills pisan disco y empieza a salir PAGEIOLATCH_SH.',
    },
    unit: 'ms',
    min: 0,
    max: 40,
    step: 1,
    defaultValue: 7,
    healthy: 8,
    warning: 20,
    direction: 'lower-is-better',
    healthyText: { en: '< 8 ms: healthy.', es: '< 8 ms: sano.' },
    warningText: { en: '8-20 ms: watch bursts.', es: '8-20 ms: vigila las ráfagas.' },
    criticalText: { en: '> 20 ms: TempDB I/O is hurting.', es: '> 20 ms: el I/O de TempDB ya duele.' },
    badges: ['TempDB', 'avg_read_ms', 'PAGEIOLATCH_SH'],
    query: `SELECT mf.name,
       CAST(vfs.io_stall_read_ms / NULLIF(vfs.num_of_reads, 0) AS decimal(10,2)) AS avg_read_ms
FROM sys.dm_io_virtual_file_stats(DB_ID('tempdb'), NULL) vfs
JOIN tempdb.sys.database_files mf
  ON vfs.file_id = mf.file_id
ORDER BY avg_read_ms DESC;`,
  },
  {
    id: 'data-read-ms',
    scope: 'reads',
    title: { en: 'Data read latency', es: 'Latencia de lectura de datos' },
    summary: {
      en: 'Average read ms across data files.',
      es: 'Media de ms de lectura en ficheros de datos.',
    },
    whatToRead: {
      en: 'This is where PAGEIOLATCH_SH usually starts making sense.',
      es: 'Aquí es donde PAGEIOLATCH_SH suele empezar a tener sentido.',
    },
    unit: 'ms',
    min: 0,
    max: 50,
    step: 1,
    defaultValue: 9,
    healthy: 8,
    warning: 20,
    direction: 'lower-is-better',
    healthyText: { en: '< 8 ms: good OLTP baseline.', es: '< 8 ms: buena base OLTP.' },
    warningText: { en: '8-20 ms: acceptable only in short bursts.', es: '8-20 ms: aceptable solo en ráfagas cortas.' },
    criticalText: { en: '> 20 ms: storage or read volume is now visible.', es: '> 20 ms: ya se nota el almacenamiento o el volumen de lectura.' },
    badges: ['avg_read_ms', 'PAGEIOLATCH_SH', 'physical reads'],
    query: `SELECT TOP (20)
       DB_NAME(vfs.database_id) AS db_name,
       mf.name,
       CAST(vfs.io_stall_read_ms / NULLIF(vfs.num_of_reads, 0) AS decimal(10,2)) AS avg_read_ms
FROM sys.dm_io_virtual_file_stats(NULL, NULL) vfs
JOIN sys.master_files mf
  ON vfs.database_id = mf.database_id
 AND vfs.file_id = mf.file_id
WHERE mf.type_desc = 'ROWS'
ORDER BY avg_read_ms DESC;`,
  },
  {
    id: 'data-write-ms',
    scope: 'writes',
    title: { en: 'Data write latency', es: 'Latencia de escritura de datos' },
    summary: {
      en: 'Average write ms across data files.',
      es: 'Media de ms de escritura en ficheros de datos.',
    },
    whatToRead: {
      en: 'Checkpoint or heavy write bursts show up here.',
      es: 'Los checkpoints o ráfagas de escritura fuertes se ven aquí.',
    },
    unit: 'ms',
    min: 0,
    max: 40,
    step: 1,
    defaultValue: 6,
    healthy: 5,
    warning: 15,
    direction: 'lower-is-better',
    healthyText: { en: '< 5 ms: healthy.', es: '< 5 ms: sano.' },
    warningText: { en: '5-15 ms: watch checkpoint bursts.', es: '5-15 ms: vigila ráfagas de checkpoint.' },
    criticalText: { en: '> 15 ms: users start to notice flush pain.', es: '> 15 ms: los usuarios empiezan a notar el flush.' },
    badges: ['avg_write_ms', 'Checkpoint pages/sec', 'Page writes/sec'],
    query: `SELECT TOP (20)
       DB_NAME(vfs.database_id) AS db_name,
       mf.name,
       CAST(vfs.io_stall_write_ms / NULLIF(vfs.num_of_writes, 0) AS decimal(10,2)) AS avg_write_ms
FROM sys.dm_io_virtual_file_stats(NULL, NULL) vfs
JOIN sys.master_files mf
  ON vfs.database_id = mf.database_id
 AND vfs.file_id = mf.file_id
WHERE mf.type_desc = 'ROWS'
ORDER BY avg_write_ms DESC;`,
  },
  {
    id: 'log-write-ms',
    scope: 'log',
    title: { en: 'Log write latency', es: 'Latencia de escritura del log' },
    summary: {
      en: 'Average write ms for log files.',
      es: 'Media de ms de escritura en los ficheros de log.',
    },
    whatToRead: {
      en: 'This is the direct partner of WRITELOG waits.',
      es: 'Esta es la pareja directa de los waits WRITELOG.',
    },
    unit: 'ms',
    min: 0,
    max: 25,
    step: 1,
    defaultValue: 4,
    healthy: 3,
    warning: 8,
    direction: 'lower-is-better',
    healthyText: { en: '< 3 ms: healthy commit path.', es: '< 3 ms: ruta de commit sana.' },
    warningText: { en: '3-8 ms: watch VLF and growth pattern.', es: '3-8 ms: vigila VLF y el patrón de growth.' },
    criticalText: { en: '> 8 ms: commit latency is now user-visible.', es: '> 8 ms: la latencia de commit ya es visible.' },
    badges: ['WRITELOG', 'avg_write_ms', 'VLF'],
    query: `SELECT DB_NAME(vfs.database_id) AS db_name,
       mf.name,
       CAST(vfs.io_stall_write_ms / NULLIF(vfs.num_of_writes, 0) AS decimal(10,2)) AS avg_write_ms
FROM sys.dm_io_virtual_file_stats(NULL, NULL) vfs
JOIN sys.master_files mf
  ON vfs.database_id = mf.database_id
 AND vfs.file_id = mf.file_id
WHERE mf.type_desc = 'LOG'
ORDER BY avg_write_ms DESC;`,
  },
  {
    id: 'pageiolatch-wait-ms',
    scope: 'reads',
    title: { en: 'PAGEIOLATCH avg wait', es: 'Espera media PAGEIOLATCH' },
    summary: {
      en: 'Average wait ms for disk reads into the buffer pool.',
      es: 'Espera media en ms de las lecturas desde disco hacia el buffer pool.',
    },
    whatToRead: {
      en: 'Use it when users say the first load is slow or reads feel heavy. This is a read-latency symptom, not a TempDB latch symptom.',
      es: 'Úsalo cuando los usuarios digan que la primera carga va lenta o que leer pesa mucho. Esto es síntoma de lectura a disco, no de latch de TempDB.',
    },
    unit: 'ms',
    min: 0,
    max: 60,
    step: 1,
    defaultValue: 11,
    healthy: 10,
    warning: 25,
    direction: 'lower-is-better',
    healthyText: { en: '< 10 ms: reads are usually healthy.', es: '< 10 ms: las lecturas suelen estar sanas.' },
    warningText: { en: '10-25 ms: watch storage plus read volume.', es: '10-25 ms: vigila almacenamiento más volumen de lectura.' },
    criticalText: { en: '> 25 ms: disk reads are now clearly hurting queries.', es: '> 25 ms: las lecturas a disco ya están dañando las queries.' },
    badges: ['PAGEIOLATCH_SH', 'read path', 'avg wait'],
    query: `WITH w AS (
  SELECT wait_type,
         wait_time_ms,
         waiting_tasks_count
  FROM sys.dm_os_wait_stats
  WHERE wait_type IN ('PAGEIOLATCH_SH','PAGEIOLATCH_EX','PAGEIOLATCH_UP')
)
SELECT wait_type,
       wait_time_ms / NULLIF(waiting_tasks_count, 0) AS avg_wait_ms,
       waiting_tasks_count
FROM w
ORDER BY avg_wait_ms DESC;`,
  },
  {
    id: 'writelog-wait-ms',
    scope: 'log',
    title: { en: 'WRITELOG avg wait', es: 'Espera media WRITELOG' },
    summary: {
      en: 'Average wait ms while commit waits for log hardening.',
      es: 'Espera media en ms mientras el commit espera a endurecer el log.',
    },
    whatToRead: {
      en: 'Use it when short INSERT/UPDATE transactions feel sticky. This is commit-path evidence, not generic data-file latency.',
      es: 'Úsalo cuando transacciones cortas de INSERT o UPDATE se sientan pegajosas. Esto es evidencia de la ruta de commit, no de la latencia genérica de los datos.',
    },
    unit: 'ms',
    min: 0,
    max: 40,
    step: 1,
    defaultValue: 7,
    healthy: 5,
    warning: 15,
    direction: 'lower-is-better',
    healthyText: { en: '< 5 ms: healthy commit path.', es: '< 5 ms: ruta de commit sana.' },
    warningText: { en: '5-15 ms: watch log latency, VLFs and sync hardening.', es: '5-15 ms: vigila latencia del log, VLF y endurecimiento sincronizado.' },
    criticalText: { en: '> 15 ms: the log path is now a visible bottleneck.', es: '> 15 ms: la ruta del log ya es un cuello visible.' },
    badges: ['WRITELOG', 'commit path', 'avg wait'],
    query: `SELECT wait_type,
       wait_time_ms / NULLIF(waiting_tasks_count, 0) AS avg_wait_ms,
       waiting_tasks_count
FROM sys.dm_os_wait_stats
WHERE wait_type = 'WRITELOG';`,
  },
  {
    id: 'pending-io',
    scope: 'writes',
    title: { en: 'Pending I/O', es: 'I/O pendientes' },
    summary: {
      en: 'Outstanding I/O requests right now.',
      es: 'Peticiones de I/O pendientes ahora mismo.',
    },
    whatToRead: {
      en: 'Short spikes are fine. A sustained queue is not.',
      es: 'Picos cortos están bien. Una cola sostenida no.',
    },
    unit: 'peticiones',
    min: 0,
    max: 20,
    step: 1,
    defaultValue: 3,
    healthy: 2,
    warning: 8,
    direction: 'lower-is-better',
    healthyText: { en: '0-2: normal.', es: '0-2: normal.' },
    warningText: { en: '3-8: watch together with latency.', es: '3-8: míralo junto con la latencia.' },
    criticalText: { en: '9+: storage is backing up.', es: '9+: el almacenamiento se está atascando.' },
    badges: ['dm_io_pending_io_requests', 'queue depth'],
    query: `SELECT COUNT(*) AS pending_io_count
FROM sys.dm_io_pending_io_requests;

SELECT io_type, io_pending_ms_ticks
FROM sys.dm_io_pending_io_requests
ORDER BY io_pending_ms_ticks DESC;`,
  },
  {
    id: 'lazy-writes',
    scope: 'memory',
    title: { en: 'Lazy writes/sec', es: 'Lazy writes/sec' },
    summary: {
      en: 'How often Lazy Writer flushes to recover buffers.',
      es: 'Con qué frecuencia Lazy Writer vacía páginas para recuperar buffers.',
    },
    whatToRead: {
      en: 'Persistent movement means memory pressure, not just background churn.',
      es: 'Movimiento persistente significa presión de memoria, no solo ruido de fondo.',
    },
    unit: '/sec',
    min: 0,
    max: 60,
    step: 1,
    defaultValue: 4,
    healthy: 5,
    warning: 20,
    direction: 'lower-is-better',
    healthyText: { en: '0-5/sec: normal.', es: '0-5/sec: normal.' },
    warningText: { en: '6-20/sec: memory pressure may be building.', es: '6-20/sec: puede crecer presión de memoria.' },
    criticalText: { en: '> 20/sec: the engine is fighting for buffers.', es: '> 20/sec: el motor pelea por buffers.' },
    badges: ['Lazy writes/sec', 'RESOURCE_MEMPHYSICAL_LOW', 'Buffer Pool'],
    query: `SELECT counter_name, cntr_value
FROM sys.dm_os_performance_counters
WHERE counter_name IN ('Lazy writes/sec', 'Page life expectancy')
ORDER BY counter_name;`,
  },
  {
    id: 'free-list-stalls',
    scope: 'memory',
    title: { en: 'Free list stalls/sec', es: 'Free list stalls/sec' },
    summary: {
      en: 'How often a worker cannot get a free buffer immediately.',
      es: 'Cuántas veces un worker no consigue un buffer libre al instante.',
    },
    whatToRead: {
      en: 'This is one of the clearest memory-pain counters.',
      es: 'Es uno de los contadores más claros de dolor de memoria.',
    },
    unit: '/sec',
    min: 0,
    max: 12,
    step: 1,
    defaultValue: 1,
    healthy: 0,
    warning: 2,
    direction: 'lower-is-better',
    healthyText: { en: '0/sec: healthy.', es: '0/sec: sano.' },
    warningText: { en: '1-2/sec: watch grants and churn.', es: '1-2/sec: vigila grants y churn.' },
    criticalText: { en: '3+/sec: user workload already feels it.', es: '3+/sec: la carga de usuario ya lo nota.' },
    badges: ['Free list stalls/sec', 'PLE', 'memory pressure'],
    query: `SELECT counter_name, cntr_value
FROM sys.dm_os_performance_counters
WHERE counter_name IN ('Free list stalls/sec', 'Lazy writes/sec', 'Page life expectancy')
ORDER BY counter_name;`,
  },
];

export const TEMPDB_IO_DIAGNOSTIC_CASES: TempDbIoDiagnosticCase[] = [
  {
    id: 'metadata',
    title: { en: 'TempDB metadata storm', es: 'Tormenta de metadatos en TempDB' },
    question: {
      en: 'Many #temp tables appear and everything slows down. What do you suspect first?',
      es: 'Aparecen muchas #temp y todo se frena. ¿Qué sospechas primero?',
    },
    summary: {
      en: 'Classic contention on allocation pages, not on storage latency.',
      es: 'Contención clásica en páginas de asignación, no en latencia de disco.',
    },
    suspicion: {
      en: 'The DBA wants to prove metadata pain before blaming storage.',
      es: 'El DBA quiere demostrar dolor en metadatos antes de culpar al disco.',
    },
    badges: ['PAGELATCH_UP', '2:1:1', '#temp'],
    accent: 'rose',
    observations: [
      { label: { en: 'Hot waiters', es: 'Sesiones calientes' }, value: '9', tone: 'rose' },
      { label: { en: 'TempDB read latency', es: 'Latencia TempDB' }, value: '4 ms', tone: 'emerald' },
      { label: { en: 'TempDB files', es: 'Archivos TempDB' }, value: '1', tone: 'amber' },
      { label: { en: 'Visible wait', es: 'Wait visible' }, value: 'PAGELATCH_UP', tone: 'rose' },
    ],
    choices: [
      { id: 'disk', label: { en: 'Slow storage', es: 'Disco lento' }, explanation: { en: 'Latency is fine. This is not the first suspect.', es: 'La latencia está bien. No es la primera sospecha.' } },
      { id: 'metadata', label: { en: 'Allocation contention', es: 'Contención de asignación' }, explanation: { en: 'Correct: PFS/GAM/SGAM are the bottleneck.', es: 'Correcto: PFS/GAM/SGAM son el cuello.' } },
      { id: 'blocking', label: { en: 'Lock blocking', es: 'Bloqueo por locks' }, explanation: { en: 'The wait family does not match.', es: 'La familia de waits no encaja.' } },
    ],
    correctChoiceId: 'metadata',
    diagnosis: {
      en: 'Add equally sized files first, then check whether spills or temp-object storms are the source.',
      es: 'Añade archivos del mismo tamaño primero y luego comprueba si la fuente son spills o tormentas de objetos temporales.',
    },
    dbaFocus: { en: 'Prove the hot pages before changing TempDB.', es: 'Demuestra las páginas calientes antes de cambiar TempDB.' },
    dbaActions: [
      { en: 'Capture waits on 2:1:1/2/2/3.', es: 'Captura waits en 2:1:1/2/2/3.' },
      { en: 'Review file count, size and growth.', es: 'Revisa número, tamaño y growth.' },
      { en: 'Then chase spill-heavy queries if needed.', es: 'Después persigue queries con spills si hace falta.' },
    ],
    caution: { en: 'More files only help if size and growth are balanced.', es: 'Más archivos solo ayudan si tamaño y growth están equilibrados.' },
    query: `SELECT wait_type, wait_duration_ms, resource_description
FROM sys.dm_os_waiting_tasks
WHERE wait_type LIKE 'PAGELATCH%'
  AND (
    resource_description LIKE '2:1:1%'
    OR resource_description LIKE '2:1:2%'
    OR resource_description LIKE '2:1:3%'
  );

SELECT file_id, name, size, growth
FROM tempdb.sys.database_files;`,
    followUp: [
      { en: 'If waits fall after file fan-out, the diagnosis was right.', es: 'Si los waits caen tras repartir archivos, el diagnóstico era correcto.' },
      { en: 'If not, look for version store or spills.', es: 'Si no, busca version store o spills.' },
    ],
  },
  {
    id: 'spill',
    title: { en: 'Slow query with spill', es: 'Query lenta con spill' },
    question: {
      en: 'The query slows down, TempDB grows and the plan warns about spills. What is the likely path?',
      es: 'La query se frena, TempDB crece y el plan avisa de spills. ¿Cuál es la ruta probable?',
    },
    summary: {
      en: 'The query is writing worktables to TempDB because the grant is wrong.',
      es: 'La query escribe worktables en TempDB porque la grant no encaja.',
    },
    suspicion: {
      en: 'The DBA suspects grant or estimate, not raw I/O.',
      es: 'El DBA sospecha de grant o estimación, no de I/O bruto.',
    },
    badges: ['Sort warning', 'Hash warning', 'memory grant'],
    accent: 'amber',
    observations: [
      { label: { en: 'TempDB write latency', es: 'Latencia escritura TempDB' }, value: '6 ms', tone: 'emerald' },
      { label: { en: 'Granted memory', es: 'Memoria concedida' }, value: '64 MB', tone: 'amber' },
      { label: { en: 'Spill warning', es: 'Aviso spill' }, value: 'Sort spilled 4x', tone: 'rose' },
      { label: { en: 'Blocking', es: 'Bloqueo' }, value: '0', tone: 'emerald' },
    ],
    choices: [
      { id: 'grant', label: { en: 'Grant too small', es: 'Grant demasiado pequeño' }, explanation: { en: 'Correct: the operator could not stay in memory.', es: 'Correcto: el operador no pudo quedarse en memoria.' } },
      { id: 'log', label: { en: 'Log bottleneck', es: 'Cuello del log' }, explanation: { en: 'WRITELOG would tell a different story.', es: 'WRITELOG contaría otra historia.' } },
      { id: 'ag', label: { en: 'AG sync lag', es: 'Lag de AG' }, explanation: { en: 'This does not explain the spill warning.', es: 'Eso no explica la advertencia de spill.' } },
    ],
    correctChoiceId: 'grant',
    diagnosis: {
      en: 'Validate stats, cardinality and plan reuse before just adding memory.',
      es: 'Valida estadisticas, cardinalidad y reutilizacion de plan antes de limitarte a añadir memoria.',
    },
    dbaFocus: { en: 'Capture the live grant and the actual plan warning.', es: 'Captura la grant en vivo y la advertencia del plan actual.' },
    dbaActions: [
      { en: 'Query sys.dm_exec_query_memory_grants.', es: 'Consulta sys.dm_exec_query_memory_grants.' },
      { en: 'Open the actual plan and find the spill operator.', es: 'Abre el plan actual y encuentra el operador con spill.' },
      { en: 'Then validate stats and parameter sensitivity.', es: 'Después valida estadísticas y sensibilidad a parámetros.' },
    ],
    caution: { en: 'More RAM can hide the symptom and leave the estimate problem alive.', es: 'Más RAM puede tapar el síntoma y dejar vivo el problema de estimación.' },
    query: `SELECT session_id,
       requested_memory_kb,
       granted_memory_kb,
       wait_time_ms
FROM sys.dm_exec_query_memory_grants
ORDER BY requested_memory_kb DESC;

SET STATISTICS IO, TIME ON;
-- Re-run and inspect the actual execution plan for spill warnings.`,
    followUp: [
      { en: 'If estimates are wrong, fix stats or predicates first.', es: 'Si las estimaciones fallan, corrige estadísticas o predicados primero.' },
      { en: 'If the plan changes per parameter, suspect parameter sensitivity.', es: 'Si el plan cambia por parametro, sospecha de sensibilidad a parametros.' },
    ],
  },
  {
    id: 'cold-cache',
    title: { en: 'First load is slow', es: 'La primera carga va lenta' },
    question: {
      en: 'Execution 1 is slow and execution 2 is fast. What is the DBA checking first?',
      es: 'La ejecución 1 va lenta y la 2 rápida. ¿Qué mira primero el DBA?',
    },
    summary: {
      en: 'This smells like cold cache before it smells like blocking.',
      es: 'Esto huele antes a caché fría que a bloqueo.',
    },
    suspicion: {
      en: 'The DBA wants to separate cold cache from a bad scan.',
      es: 'El DBA quiere separar caché fría de un mal scan.',
    },
    badges: ['PAGEIOLATCH_SH', 'physical reads', 'Buffer Pool'],
    accent: 'cyan',
    observations: [
      { label: { en: 'Execution 1', es: 'Ejecucion 1' }, value: '18.4 sec', tone: 'rose' },
      { label: { en: 'Execution 2', es: 'Ejecucion 2' }, value: '1.2 sec', tone: 'emerald' },
      { label: { en: 'Physical reads', es: 'Lecturas físicas' }, value: '480,000', tone: 'amber' },
      { label: { en: 'Read latency', es: 'Latencia de lectura' }, value: '7 ms', tone: 'emerald' },
    ],
    choices: [
      { id: 'cache', label: { en: 'Cold cache', es: 'Caché fría' }, explanation: { en: 'Correct: pages are warm on the second run.', es: 'Correcto: las páginas quedan calientes en la segunda pasada.' } },
      { id: 'blocking', label: { en: 'Blocking chain', es: 'Cadena de bloqueos' }, explanation: { en: 'Blocking would not vanish because cache got warm.', es: 'El bloqueo no desaparece porque la caché se caliente.' } },
      { id: 'tempdb', label: { en: 'TempDB issue', es: 'Problema de TempDB' }, explanation: { en: 'This pattern is base-page I/O, not TempDB metadata.', es: 'Este patrón es I/O de páginas base, no metadatos de TempDB.' } },
    ],
    correctChoiceId: 'cache',
    diagnosis: {
      en: 'Now confirm whether the read volume itself is expected or if the plan scans too much.',
      es: 'Ahora confirma si el volumen de lectura era esperable o si el plan escanea demasiado.',
    },
    dbaFocus: { en: 'Measure physical versus logical reads.', es: 'Mide lecturas físicas frente a lógicas.' },
    dbaActions: [
      { en: 'Run with SET STATISTICS IO, TIME ON.', es: 'Ejecuta con SET STATISTICS IO, TIME ON.' },
      { en: 'Check PAGEIOLATCH waits during the first run only.', es: 'Mira PAGEIOLATCH solo durante la primera ejecución.' },
      { en: 'If logical reads are huge, review the plan next.', es: 'Si las lecturas lógicas son enormes, revisa el plan después.' },
    ],
    caution: { en: 'Cold cache is a symptom. It can still hide a bad scan.', es: 'La caché fría es un síntoma. Aún así puede esconder un mal scan.' },
    query: `SET STATISTICS IO, TIME ON;
SELECT ...
FROM ...
WHERE ...;

SELECT wait_type, wait_time_ms
FROM sys.dm_os_wait_stats
WHERE wait_type LIKE 'PAGEIOLATCH%';`,
    followUp: [
      { en: 'If logical reads stay massive, fix plan or index shape.', es: 'Si las lecturas lógicas siguen masivas, corrige la forma del plan o del índice.' },
      { en: 'If only physical reads are high at first, the cache story is enough.', es: 'Si solo son altas las físicas al principio, la historia de caché basta.' },
    ],
  },
  {
    id: 'writelog',
    title: { en: 'Commit path is slow', es: 'La ruta de commit va lenta' },
    question: {
      en: 'Short commits feel sticky and WRITELOG keeps appearing. What is the strong first suspicion?',
      es: 'Los commits cortos se sienten pegajosos y WRITELOG no deja de salir. ¿Cuál es la sospecha fuerte?',
    },
    summary: {
      en: 'The pain is on the log path, not on data reads.',
      es: 'El dolor está en la ruta del log, no en las lecturas de datos.',
    },
    suspicion: {
      en: 'The DBA wants to validate log latency, VLF layout and growth pattern.',
      es: 'El DBA quiere validar la latencia del log, el layout de VLF y el growth.',
    },
    badges: ['WRITELOG', 'VLF', 'autogrowth'],
    accent: 'violet',
    observations: [
      { label: { en: 'Log write latency', es: 'Latencia log' }, value: '14 ms', tone: 'rose' },
      { label: { en: 'Data write latency', es: 'Latencia datos' }, value: '4 ms', tone: 'emerald' },
      { label: { en: 'VLF count', es: 'Conteo VLF' }, value: '720', tone: 'rose' },
      { label: { en: 'Autogrowth', es: 'Autogrowth' }, value: '64 MB', tone: 'amber' },
    ],
    choices: [
      { id: 'log', label: { en: 'Log path / VLF issue', es: 'Ruta de log / VLF' }, explanation: { en: 'Correct: WRITELOG plus high log latency points here.', es: 'Correcto: WRITELOG más alta latencia de log apunta aquí.' } },
      { id: 'reads', label: { en: 'Random reads', es: 'Lecturas aleatorias' }, explanation: { en: 'That would show a different wait and latency pattern.', es: 'Eso mostraría otro patrón de waits y latencia.' } },
      { id: 'cpu', label: { en: 'CPU pressure', es: 'Presión de CPU' }, explanation: { en: 'CPU pressure would show runnable queues, not this.', es: 'La presión de CPU mostraría colas runnable, no esto.' } },
    ],
    correctChoiceId: 'log',
    diagnosis: {
      en: 'Treat it as a log-path problem first: latency, VLF fragmentation and tiny growth increments.',
      es: 'Tratalo primero como un problema de ruta de log: latencia, fragmentacion de VLF e incrementos de growth pequeños.',
    },
    dbaFocus: { en: 'Correlate WRITELOG with real log-file latency.', es: 'Correlaciona WRITELOG con la latencia real del fichero de log.' },
    dbaActions: [
      { en: 'Measure avg_write_ms on LOG files.', es: 'Mide avg_write_ms en los ficheros LOG.' },
      { en: 'Inspect VLF count with sys.dm_db_log_info.', es: 'Inspecciona los VLF con sys.dm_db_log_info.' },
      { en: 'Fix growth size before touching workload logic.', es: 'Corrige el growth antes de tocar la logica de la carga.' },
    ],
    caution: { en: 'Do not confuse slow storage in general with slow log writes in particular.', es: 'No confundas almacenamiento lento en general con escrituras lentas del log en particular.' },
    query: `SELECT DB_NAME(vfs.database_id) AS db_name,
       mf.name,
       CAST(vfs.io_stall_write_ms / NULLIF(vfs.num_of_writes, 0) AS decimal(10,2)) AS avg_write_ms
FROM sys.dm_io_virtual_file_stats(NULL, NULL) vfs
JOIN sys.master_files mf
  ON vfs.database_id = mf.database_id
 AND vfs.file_id = mf.file_id
WHERE mf.type_desc = 'LOG';

SELECT COUNT(*) AS vlf_count
FROM sys.dm_db_log_info(DB_ID());`,
    followUp: [
      { en: 'If latency stays high after fixing growth, revisit the storage tier.', es: 'Si la latencia sigue alta tras arreglar el growth, revisa la cabina.' },
      { en: 'If latency is fine, inspect batching and sync replica hardening.', es: 'Si la latencia está bien, inspecciona batching y endurecimiento en réplica síncrona.' },
    ],
  },
  {
    id: 'version-store',
    title: { en: 'TempDB grows and does not come back', es: 'TempDB crece y no vuelve' },
    question: {
      en: 'TempDB keeps growing under RCSI or Snapshot. What is the likely root cause?',
      es: 'TempDB no para de crecer bajo RCSI o Snapshot. ¿Cuál es la causa probable?',
    },
    summary: {
      en: 'Version store is pinned by long readers.',
      es: 'El version store está inmovilizado por lectores largos.',
    },
    suspicion: {
      en: 'The DBA now suspects old snapshot readers more than latch contention.',
      es: 'El DBA sospecha ahora más de lectores snapshot antiguos que de contención de latches.',
    },
    badges: ['version store', 'RCSI', 'snapshot'],
    accent: 'cyan',
    observations: [
      { label: { en: 'Version store', es: 'Version store' }, value: '14 GB', tone: 'rose' },
      { label: { en: 'Oldest snapshot', es: 'Snapshot más antigua' }, value: '47 min', tone: 'rose' },
      { label: { en: 'PAGELATCH waiters', es: 'Sesiones PAGELATCH' }, value: '1', tone: 'emerald' },
      { label: { en: 'Isolation', es: 'Aislamiento' }, value: 'RCSI', tone: 'amber' },
    ],
    choices: [
      { id: 'reader', label: { en: 'Long snapshot reader', es: 'Lector snapshot largo' }, explanation: { en: 'Correct: cleanup cannot reclaim versions yet.', es: 'Correcto: la limpieza todavía no puede recuperar versiones.' } },
      { id: 'files', label: { en: 'Too few TempDB files', es: 'Pocos archivos de TempDB' }, explanation: { en: 'That hurts metadata contention, not pinned version cleanup by itself.', es: 'Eso daña metadatos, no explica por si solo la limpieza inmovilizada.' } },
      { id: 'checkpoint', label: { en: 'Checkpoint issue', es: 'Problema de checkpoint' }, explanation: { en: 'Checkpoint does not pin row versions.', es: 'Checkpoint no inmoviliza row versions.' } },
    ],
    correctChoiceId: 'reader',
    diagnosis: {
      en: 'Find the oldest reader before simply adding more TempDB space.',
      es: 'Encuentra el lector más antiguo antes de limitarte a dar más espacio a TempDB.',
    },
    dbaFocus: { en: 'Identify the oldest snapshot transaction.', es: 'Identifica la transacción snapshot más antigua.' },
    dbaActions: [
      { en: 'Measure version_store_reserved_page_count.', es: 'Mide version_store_reserved_page_count.' },
      { en: 'Join snapshot transactions to live sessions.', es: 'Cruza transacciones snapshot con sesiones vivas.' },
      { en: 'Fix the reader pattern before growing TempDB.', es: 'Corrige el patrón del lector antes de hacer crecer TempDB.' },
    ],
    caution: { en: 'More TempDB space only buys time if the reader stays open.', es: 'Mas espacio en TempDB solo compra tiempo si el lector sigue abierto.' },
    query: `SELECT SUM(version_store_reserved_page_count) / 128.0 AS version_store_mb
FROM tempdb.sys.dm_db_file_space_usage;

SELECT transaction_id, session_id, elapsed_time_seconds
FROM sys.dm_tran_active_snapshot_database_transactions
ORDER BY elapsed_time_seconds DESC;`,
    followUp: [
      { en: 'If one report holds the oldest snapshot, fix that workload first.', es: 'Si un informe mantiene la snapshot más antigua, corrige esa carga primero.' },
      { en: 'If versions are low but waits are high, go back to metadata contention.', es: 'Si las versiones son bajas pero los waits altos, vuelve a la contención de metadatos.' },
    ],
  },
  {
    id: 'memory',
    title: { en: 'Memory pressure, not disk pressure', es: 'Presion de memoria, no de disco' },
    question: {
      en: 'Reads slow down but disk latency is decent. Which signal matters more now?',
      es: 'Las lecturas se frenan pero la latencia de disco es decente. ¿Qué señal importa más ahora?',
    },
    summary: {
      en: 'The engine is short on reusable buffers.',
      es: 'Al motor le faltan buffers reutilizables.',
    },
    suspicion: {
      en: 'The DBA suspects grants or max memory before blaming disks.',
      es: 'El DBA sospecha de grants o de memoria máxima antes de culpar a los discos.',
    },
    badges: ['Lazy writes/sec', 'Free list stalls/sec', 'PLE'],
    accent: 'amber',
    observations: [
      { label: { en: 'Read latency', es: 'Latencia lectura' }, value: '6 ms', tone: 'emerald' },
      { label: { en: 'Lazy writes/sec', es: 'Lazy writes/sec' }, value: '28', tone: 'rose' },
      { label: { en: 'Free list stalls/sec', es: 'Free list stalls/sec' }, value: '4', tone: 'rose' },
      { label: { en: 'PLE', es: 'PLE' }, value: '42 sec', tone: 'amber' },
    ],
    choices: [
      { id: 'memory', label: { en: 'Memory pressure', es: 'Presión de memoria' }, explanation: { en: 'Correct: the box is fighting for free buffers.', es: 'Correcto: la máquina pelea por buffers libres.' } },
      { id: 'tempdb', label: { en: 'TempDB file issue', es: 'Problema de archivos de TempDB' }, explanation: { en: 'That does not explain these counters by itself.', es: 'Eso no explica por si solo estos contadores.' } },
      { id: 'log', label: { en: 'Log bottleneck', es: 'Cuello de log' }, explanation: { en: 'WRITELOG is a different story.', es: 'WRITELOG es otra historia.' } },
    ],
    correctChoiceId: 'memory',
    diagnosis: {
      en: 'Inspect grants, clerks and max server memory before blaming storage.',
      es: 'Inspecciona grants, clerks y max server memory antes de culpar al almacenamiento.',
    },
    dbaFocus: { en: 'Prove the shortage of reusable buffers.', es: 'Demuestra la falta de buffers reutilizables.' },
    dbaActions: [
      { en: 'Read Lazy writes, Free list stalls and PLE together.', es: 'Lee juntos Lazy writes, Free list stalls y PLE.' },
      { en: 'Check memory grants and clerks.', es: 'Revisa memory grants y clerks.' },
      { en: 'Validate SQL memory versus host pressure.', es: 'Valida la memoria de SQL frente a la presión del host.' },
    ],
    caution: { en: 'A low PLE alone is not enough. The pattern matters.', es: 'Un PLE bajo por sí solo no basta. Importa el patrón.' },
    query: `SELECT counter_name, cntr_value
FROM sys.dm_os_performance_counters
WHERE counter_name IN ('Lazy writes/sec', 'Free list stalls/sec', 'Page life expectancy');

SELECT session_id, requested_memory_kb, granted_memory_kb, wait_time_ms
FROM sys.dm_exec_query_memory_grants
ORDER BY requested_memory_kb DESC;`,
    followUp: [
      { en: 'If grants are pending, chase the spill story next.', es: 'Si hay grants pendientes, persigue después la historia del spill.' },
      { en: 'If grants are calm, inspect clerks or host pressure.', es: 'Si las grants están tranquilas, inspecciona clerks o presión del host.' },
    ],
  },
  {
    id: 'checkpoint',
    title: { en: 'Periodic write bursts', es: 'Ráfagas periódicas de escritura' },
    question: {
      en: 'Writes spike every few minutes. What should the DBA correlate next?',
      es: 'Las escrituras se disparan cada pocos minutos. ¿Qué debe correlacionar ahora el DBA?',
    },
    summary: {
      en: 'This looks like checkpoint-driven flushing, not Lazy Writer panic.',
      es: 'Esto parece flushing empujado por checkpoint, no pánico de Lazy Writer.',
    },
    suspicion: {
      en: 'The DBA wants to prove recovery-driven flushing first.',
      es: 'El DBA quiere demostrar primero que el flushing lo empuja el recovery.',
    },
    badges: ['CHECKPOINT', 'Page writes/sec', 'Target Recovery Time'],
    accent: 'violet',
    observations: [
      { label: { en: 'Checkpoint pages/sec', es: 'Checkpoint pages/sec' }, value: '18,000', tone: 'rose' },
      { label: { en: 'Lazy writes/sec', es: 'Lazy writes/sec' }, value: '2', tone: 'emerald' },
      { label: { en: 'Write latency', es: 'Latencia escritura' }, value: '17 ms in burst', tone: 'amber' },
      { label: { en: 'Pattern', es: 'Patrón' }, value: 'Every 5 min', tone: 'amber' },
    ],
    choices: [
      { id: 'checkpoint', label: { en: 'Checkpoint burst', es: 'Ráfaga de checkpoint' }, explanation: { en: 'Correct: the counters line up with checkpoint.', es: 'Correcto: los contadores encajan con checkpoint.' } },
      { id: 'memory', label: { en: 'Lazy Writer pressure', es: 'Presión de Lazy Writer' }, explanation: { en: 'Lazy Writer is quiet here.', es: 'Aquí Lazy Writer está tranquilo.' } },
      { id: 'blocking', label: { en: 'Blocking by writers', es: 'Bloqueo por writers' }, explanation: { en: 'The periodic counter pattern points elsewhere first.', es: 'El patrón periódico de contadores apunta primero a otra cosa.' } },
    ],
    correctChoiceId: 'checkpoint',
    diagnosis: {
      en: 'Review target recovery time and the write burst source before tuning memory.',
      es: 'Revisa target recovery time y la fuente de la ráfaga antes de ajustar memoria.',
    },
    dbaFocus: { en: 'Tie the burst to recovery-driven flushing.', es: 'Ata la ráfaga al flushing guiado por recovery.' },
    dbaActions: [
      { en: 'Correlate Checkpoint pages/sec with Page writes/sec.', es: 'Correlaciona Checkpoint pages/sec con Page writes/sec.' },
      { en: 'Review target recovery time.', es: 'Revisa target recovery time.' },
      { en: 'If ETL matches the burst, inspect that workload too.', es: 'Si ETL coincide con la ráfaga, inspecciona también esa carga.' },
    ],
    caution: { en: 'Checkpoint and Lazy Writer write dirty pages for different reasons.', es: 'Checkpoint y Lazy Writer escriben páginas sucias por razones distintas.' },
    query: `SELECT counter_name, cntr_value
FROM sys.dm_os_performance_counters
WHERE counter_name IN ('Checkpoint pages/sec', 'Page writes/sec', 'Lazy writes/sec');

SELECT name, target_recovery_time_in_seconds
FROM sys.databases
WHERE database_id > 4;`,
    followUp: [
      { en: 'If one database owns the burst, start there.', es: 'Si una base domina la ráfaga, empieza por ahí.' },
      { en: 'If all databases hurt together, revisit the shared write path.', es: 'Si todas las bases duelen a la vez, revisa la ruta de escritura compartida.' },
    ],
  },
];
