export interface LocalizedText {
  en: string;
  es: string;
}

export type IncidentQuickPackId = 'blocking' | 'cpu' | 'waits' | 'memory' | 'tempdb' | 'io-log' | 'ha-dr';
export type QueryAccent = 'emerald' | 'amber' | 'blue' | 'violet' | 'rose' | 'cyan';

export interface IncidentQueryScript {
  id: 'detect' | 'deep' | 'action';
  title: LocalizedText;
  description: LocalizedText;
  accent: QueryAccent;
  code: string;
}

export interface IncidentQuickPack {
  id: IncidentQuickPackId;
  title: LocalizedText;
  symptom: LocalizedText;
  summary: LocalizedText;
  whenToUse: LocalizedText;
  caution: LocalizedText;
  badges: string[];
  quickSteps: LocalizedText[];
  watchItems: LocalizedText[];
  scripts: IncidentQueryScript[];
}

export const INCIDENT_QUERY_PACKS: IncidentQuickPack[] = [
  {
    id: 'blocking',
    title: { en: 'Blocking & locks', es: 'Bloqueos y locks' },
    symptom: {
      en: 'Sessions pile up in LCK_M_* waits and users say everything is frozen.',
      es: 'Las sesiones se apilan en waits LCK_M_* y los usuarios dicen que todo está congelado.',
    },
    summary: {
      en: 'Find the head blocker, read the SQL, confirm the open transaction, then decide whether KILL is justified.',
      es: 'Encuentra el bloqueador raíz, lee el SQL, confirma la transacción abierta y luego decide si KILL está justificado.',
    },
    whenToUse: {
      en: 'Use it when active requests are suspended behind one or two SPIDs.',
      es: 'Úsalo cuando las requests activas quedan suspendidas detrás de uno o dos SPID.',
    },
    caution: {
      en: 'Do not kill first and ask later. Validate the business transaction and rollback cost first.',
      es: 'No mates primero y preguntes después. Valida antes la transacción de negocio y el coste del rollback.',
    },
    badges: ['LCK_M_X', 'LCK_M_S', 'blocking_session_id', 'open_tran'],
    quickSteps: [
      { en: 'Find the head blocker, not only the victims.', es: 'Encuentra el bloqueador raíz, no solo las víctimas.' },
      { en: 'Read the blocker SQL and command.', es: 'Lee el SQL y el comando del bloqueador.' },
      { en: 'Confirm whether it owns an open transaction.', es: 'Confirma si mantiene una transacción abierta.' },
      { en: 'Only then decide whether to KILL.', es: 'Solo entonces decide si hacer KILL.' },
    ],
    watchItems: [
      { en: 'A harmless SELECT is often just the victim.', es: 'Un SELECT inocente suele ser solo la víctima.' },
      { en: 'Idle transactions after UPDATE/DELETE are a classic root cause.', es: 'Las transacciones inactivas tras UPDATE/DELETE son una causa clásica.' },
      { en: 'If this repeats, the fix is app design, not permanent killing.', es: 'Si esto se repite, la solución es el diseño de la app, no matar sesiones siempre.' },
    ],
    scripts: [
      {
        id: 'detect',
        title: { en: 'Fast detection', es: 'Detección rápida' },
        description: {
          en: 'Shows blocked sessions, blockers and current SQL text.',
          es: 'Muestra sesiones bloqueadas, bloqueadores y texto SQL actual.',
        },
        accent: 'rose',
        code: `SELECT r.session_id,
       r.blocking_session_id,
       r.status,
       r.wait_type,
       r.wait_time / 1000.0 AS wait_sec,
       DB_NAME(r.database_id) AS db_name,
       txt.text AS sql_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) txt
WHERE r.session_id > 50
  AND (r.blocking_session_id > 0 OR EXISTS (
        SELECT 1
        FROM sys.dm_exec_requests r2
        WHERE r2.blocking_session_id = r.session_id
      ))
ORDER BY r.blocking_session_id DESC, r.wait_time DESC;`,
      },
      {
        id: 'deep',
        title: { en: 'Open transaction check', es: 'Chequeo de transacción abierta' },
        description: {
          en: 'Confirms if the blocker is holding an open transaction.',
          es: 'Confirma si el bloqueador mantiene una transacción abierta.',
        },
        accent: 'amber',
        code: `DBCC OPENTRAN;

SELECT st.session_id,
       at.transaction_begin_time,
       DATEDIFF(SECOND, at.transaction_begin_time, SYSDATETIME()) AS tran_age_sec
FROM sys.dm_tran_session_transactions st
JOIN sys.dm_tran_active_transactions at
  ON st.transaction_id = at.transaction_id
WHERE st.session_id = <blocking_spid>;`,
      },
      {
        id: 'action',
        title: { en: 'Safe KILL workflow', es: 'Flujo seguro de KILL' },
        description: {
          en: 'Template to cancel only after validation and monitor rollback progress.',
          es: 'Plantilla para cancelar solo tras validar y monitorizar el rollback.',
        },
        accent: 'cyan',
        code: `-- Revalidate before canceling
SELECT session_id, blocking_session_id, wait_type, command
FROM sys.dm_exec_requests
WHERE session_id IN (<blocking_spid>, <victim_spid>);

KILL <blocking_spid>;
KILL <blocking_spid> WITH STATUSONLY;`,
      },
    ],
  },
  {
    id: 'cpu',
    title: { en: 'CPU runaway', es: 'CPU disparada' },
    symptom: {
      en: 'CPU stays high and the server feels slow without obvious blocking.',
      es: 'La CPU se queda alta y el servidor va lento sin bloqueos evidentes.',
    },
    summary: {
      en: 'Separate active CPU burners from historical cache offenders and tie the incident to one query or plan.',
      es: 'Separa los consumidores activos de CPU de los ofensores históricos en caché y ata la incidencia a una query o plan.',
    },
    whenToUse: {
      en: 'Use it when SOS_SCHEDULER_YIELD rises or runnable queues start growing.',
      es: 'Úsalo cuando sube SOS_SCHEDULER_YIELD o empiezan a crecer las colas runnable.',
    },
    caution: {
      en: 'Do not flush the whole plan cache during the incident unless you know exactly why.',
      es: 'No vacíes toda la plan cache durante la incidencia salvo que sepas exactamente por qué.',
    },
    badges: ['SOS_SCHEDULER_YIELD', 'cpu_time', 'query_hash', 'plan_handle'],
    quickSteps: [
      { en: 'Find the active CPU burner first.', es: 'Encuentra primero el consumidor activo de CPU.' },
      { en: 'Compare it with top cached offenders.', es: 'Compáralo con los ofensores principales en caché.' },
      { en: 'Capture query_hash or plan_handle.', es: 'Captura query_hash o plan_handle.' },
      { en: 'Only then decide whether to cancel or force a different plan.', es: 'Solo entonces decide si cancelar o forzar un plan distinto.' },
    ],
    watchItems: [
      { en: 'High CPU with low waits often means a bad plan shape, not I/O.', es: 'CPU alta con pocos waits suele significar un mal plan, no I/O.' },
      { en: 'Cache averages can hide one terrible current execution.', es: 'Las medias en caché pueden ocultar una ejecución actual terrible.' },
      { en: 'Cardinality mistakes are common behind sudden CPU cliffs.', es: 'Los errores de cardinalidad son frecuentes detrás de los picos bruscos de CPU.' },
    ],
    scripts: [
      {
        id: 'detect',
        title: { en: 'Active CPU burners', es: 'Consumidores activos de CPU' },
        description: {
          en: 'Shows current requests with highest CPU and reads.',
          es: 'Muestra las requests actuales con más CPU y lecturas.',
        },
        accent: 'amber',
        code: `SELECT TOP (15)
       r.session_id,
       r.status,
       r.command,
       r.cpu_time,
       r.total_elapsed_time,
       r.logical_reads,
       txt.text AS sql_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) txt
WHERE r.session_id > 50
ORDER BY r.cpu_time DESC, r.logical_reads DESC;`,
      },
      {
        id: 'deep',
        title: { en: 'Top CPU in cache', es: 'Top CPU en caché' },
        description: {
          en: 'Finds historical CPU-heavy statements in plan cache.',
          es: 'Encuentra sentencias históricas con mucha CPU en plan cache.',
        },
        accent: 'violet',
        code: `SELECT TOP (20)
       qs.execution_count,
       qs.total_worker_time / 1000.0 AS total_cpu_ms,
       (qs.total_worker_time / NULLIF(qs.execution_count, 0)) / 1000.0 AS avg_cpu_ms,
       qs.query_hash,
       qs.plan_handle,
       SUBSTRING(txt.text,
                 (qs.statement_start_offset / 2) + 1,
                 CASE WHEN qs.statement_end_offset = -1
                      THEN LEN(CONVERT(nvarchar(max), txt.text)) * 2
                      ELSE (qs.statement_end_offset - qs.statement_start_offset)
                 END / 2) AS sql_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) txt
ORDER BY qs.total_worker_time DESC;`,
      },
      {
        id: 'action',
        title: { en: 'Targeted mitigation', es: 'Mitigación dirigida' },
        description: {
          en: 'Capture the plan first, then cancel only the validated runaway request.',
          es: 'Captura primero el plan y luego cancela solo la request validada que se haya desbocado.',
        },
        accent: 'cyan',
        code: `SELECT r.session_id,
       r.plan_handle,
       qp.query_plan
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_query_plan(r.plan_handle) qp
WHERE r.session_id = <spid>;

KILL <spid>;`,
      },
    ],
  },
  {
    id: 'waits',
    title: { en: 'Waits & schedulers', es: 'Waits y schedulers' },
    symptom: {
      en: 'The server is slow everywhere and you need to know which resource class is really gating progress.',
      es: 'El servidor va lento en todas partes y necesitas saber qué clase de recurso está frenando el progreso.',
    },
    summary: {
      en: 'Start with filtered wait stats, then check live waiting tasks and runnable queues so you can separate CPU, lock, latch and I/O pressure.',
      es: 'Empieza con wait stats filtrados y luego revisa waiting tasks y colas runnable para separar CPU, locks, latches e I/O.',
    },
    whenToUse: {
      en: 'Use it when there is no single smoking gun and the incident looks cross-cutting.',
      es: 'Úsalo cuando no hay una pistola humeante clara y la incidencia parece transversal.',
    },
    caution: {
      en: 'Do not reset wait stats in the middle of the incident just to clean the view.',
      es: 'No resetees wait stats en mitad de la incidencia solo para limpiar la vista.',
    },
    badges: ['wait_stats', 'waiting_tasks', 'runnable_queue_count', 'THREADPOOL'],
    quickSteps: [
      { en: 'Read top waits after filtering noise.', es: 'Lee los waits principales tras filtrar ruido.' },
      { en: 'Check who is waiting right now.', es: 'Mira quién está esperando ahora mismo.' },
      { en: 'Look at runnable queues per scheduler.', es: 'Revisa las colas runnable por scheduler.' },
      { en: 'Map the wait family to CPU, lock, latch, I/O or memory.', es: 'Mapea la familia de waits a CPU, lock, latch, I/O o memoria.' },
    ],
    watchItems: [
      { en: 'Historical waits tell the workload story, not just the last query.', es: 'Los waits históricos cuentan la historia de la carga, no solo de la última query.' },
      { en: 'Waiting tasks show the live edge of the incident.', es: 'Waiting tasks muestran el borde vivo de la incidencia.' },
      { en: 'Long runnable queues without lock waits usually point to CPU pressure.', es: 'Colas runnable largas sin waits de lock suelen apuntar a presión de CPU.' },
    ],
    scripts: [
      {
        id: 'detect',
        title: { en: 'Filtered top waits', es: 'Top waits filtrados' },
        description: {
          en: 'Shows the wait families consuming the most total time.',
          es: 'Muestra las familias de waits que más tiempo total están consumiendo.',
        },
        accent: 'violet',
        code: `SELECT TOP (20)
       wait_type,
       wait_time_ms / 1000.0 AS wait_sec,
       (wait_time_ms - signal_wait_time_ms) / 1000.0 AS resource_sec,
       signal_wait_time_ms / 1000.0 AS signal_sec,
       waiting_tasks_count
FROM sys.dm_os_wait_stats
WHERE wait_type NOT IN (
  'SLEEP_TASK','BROKER_TO_FLUSH','XE_DISPATCHER_WAIT',
  'REQUEST_FOR_DEADLOCK_SEARCH','LAZYWRITER_SLEEP',
  'SLEEP_BPOOL_FLUSH','FT_IFTS_SCHEDULER_IDLE_WAIT'
)
ORDER BY wait_time_ms DESC;`,
      },
      {
        id: 'deep',
        title: { en: 'Live waiting tasks', es: 'Waiting tasks en vivo' },
        description: {
          en: 'Shows who is waiting now, on what, and behind whom.',
          es: 'Muestra quién espera ahora, en qué y detrás de quién.',
        },
        accent: 'rose',
        code: `SELECT TOP (25)
       wt.session_id,
       wt.wait_type,
       wt.wait_duration_ms / 1000.0 AS wait_sec,
       wt.blocking_session_id,
       wt.resource_description,
       txt.text AS sql_text
FROM sys.dm_os_waiting_tasks wt
LEFT JOIN sys.dm_exec_requests er
  ON wt.session_id = er.session_id
OUTER APPLY sys.dm_exec_sql_text(er.sql_handle) txt
ORDER BY wt.wait_duration_ms DESC;`,
      },
      {
        id: 'action',
        title: { en: 'Scheduler pressure check', es: 'Chequeo de presión en schedulers' },
        description: {
          en: 'Confirms whether the incident is CPU/runnable pressure rather than lock or I/O blocking.',
          es: 'Confirma si la incidencia es presión de CPU/runnable y no bloqueo por locks o I/O.',
        },
        accent: 'cyan',
        code: `SELECT scheduler_id,
       cpu_id,
       current_tasks_count,
       runnable_tasks_count,
       current_workers_count,
       active_workers_count,
       load_factor
FROM sys.dm_os_schedulers
WHERE scheduler_id < 255
ORDER BY runnable_tasks_count DESC, current_tasks_count DESC;`,
      },
    ],
  },
  {
    id: 'memory',
    title: { en: 'Memory & grants', es: 'Memoria y grants' },
    symptom: {
      en: 'Queries queue for memory, spills rise, or the box looks full without a clear blocker.',
      es: 'Las queries se ponen a cola por memoria, suben los spills o la máquina parece llena sin un bloqueador claro.',
    },
    summary: {
      en: 'Check pending grants first, then map them to active sessions and finally see whether SQL thinks physical memory is low.',
      es: 'Primero revisa grants pendientes, luego mapea esos grants a sesiones activas y al final mira si SQL detecta poca memoria física.',
    },
    whenToUse: {
      en: 'Use it when reports stall, RESOURCE_SEMAPHORE appears, or spills become visible.',
      es: 'Úsalo cuando se atascan informes, aparece RESOURCE_SEMAPHORE o se hacen visibles los spills.',
    },
    caution: {
      en: 'Do not change max server memory blindly during the incident.',
      es: 'No cambies max server memory a ciegas durante la incidencia.',
    },
    badges: ['RESOURCE_SEMAPHORE', 'grants_pending', 'memory_clerks', 'MEMPHYSICAL_LOW'],
    quickSteps: [
      { en: 'Check if grants are actually pending.', es: 'Comprueba si realmente hay grants pendientes.' },
      { en: 'Map grants back to active sessions.', es: 'Mapea los grants a las sesiones activas.' },
      { en: 'See who owns memory: grants, clerks or buffer pool.', es: 'Mira quién posee la memoria: grants, clerks o buffer pool.' },
      { en: 'Confirm whether SQL sees low physical memory.', es: 'Confirma si SQL ve poca memoria física.' },
    ],
    watchItems: [
      { en: 'High memory use is not the same as bad memory pressure.', es: 'Usar mucha memoria no es lo mismo que tener mala presión de memoria.' },
      { en: 'RESOURCE_SEMAPHORE points to workspace memory, not always to bad max memory.', es: 'RESOURCE_SEMAPHORE apunta a memoria de trabajo, no siempre a un mal max memory.' },
      { en: 'The host or hypervisor can be the real trigger.', es: 'El host o el hipervisor pueden ser el disparador real.' },
    ],
    scripts: [
      {
        id: 'detect',
        title: { en: 'Pending grants now', es: 'Grants pendientes ahora' },
        description: {
          en: 'Shows whether queries are waiting for workspace memory.',
          es: 'Muestra si las queries están esperando memoria de trabajo.',
        },
        accent: 'cyan',
        code: `SELECT *
FROM sys.dm_exec_query_memory_grants
ORDER BY requested_memory_kb DESC;

SELECT counter_name, cntr_value
FROM sys.dm_os_performance_counters
WHERE object_name LIKE '%Memory Manager%'
  AND counter_name IN ('Memory Grants Pending', 'Memory Grants Outstanding');`,
      },
      {
        id: 'deep',
        title: { en: 'Requests + grant consumers', es: 'Requests + consumidores de grant' },
        description: {
          en: 'Joins active requests with their grant and SQL text.',
          es: 'Une las requests activas con su grant y texto SQL.',
        },
        accent: 'amber',
        code: `SELECT r.session_id,
       r.status,
       r.wait_type,
       r.cpu_time,
       mg.requested_memory_kb,
       mg.granted_memory_kb,
       mg.used_memory_kb,
       txt.text AS sql_text
FROM sys.dm_exec_requests r
LEFT JOIN sys.dm_exec_query_memory_grants mg
  ON r.session_id = mg.session_id
OUTER APPLY sys.dm_exec_sql_text(r.sql_handle) txt
WHERE r.session_id > 50
ORDER BY mg.requested_memory_kb DESC, r.cpu_time DESC;`,
      },
      {
        id: 'action',
        title: { en: 'Clerks + memory state', es: 'Clerks + estado de memoria' },
        description: {
          en: 'Confirms whether the pressure is grants, clerks or low physical memory.',
          es: 'Confirma si la presión viene de grants, clerks o poca memoria física.',
        },
        accent: 'violet',
        code: `SELECT TOP (15)
       type,
       name,
       pages_kb / 1024.0 AS mb
FROM sys.dm_os_memory_clerks
ORDER BY pages_kb DESC;

SELECT process_physical_memory_low,
       process_virtual_memory_low,
       physical_memory_in_use_kb / 1024 AS sql_process_mb
FROM sys.dm_os_process_memory;`,
      },
    ],
  },
  {
    id: 'tempdb',
    title: { en: 'TempDB & spills', es: 'TempDB y spills' },
    symptom: {
      en: 'TempDB grows fast, PAGELATCH waits appear, or a report suddenly starts spilling to disk.',
      es: 'TempDB crece rápido, aparecen waits PAGELATCH o un informe empieza a hacer spill a disco.',
    },
    summary: {
      en: 'Separate allocation contention, version store growth and workspace spills so you do not mix three different TempDB incidents.',
      es: 'Separa contención de asignación, crecimiento del version store y spills de workspace para no mezclar tres incidencias distintas de TempDB.',
    },
    whenToUse: {
      en: 'Use it when TempDB grows unexpectedly or PAGELATCH_UP/EX rises.',
      es: 'Úsalo cuando TempDB crece sin esperarlo o sube PAGELATCH_UP/EX.',
    },
    caution: {
      en: 'Do not shrink TempDB in panic. First prove what is consuming it.',
      es: 'No hagas shrink a TempDB por pánico. Primero demuestra qué lo está consumiendo.',
    },
    badges: ['PAGELATCH_UP', 'PFS', 'GAM', 'SGAM', 'version_store'],
    quickSteps: [
      { en: 'See who is consuming TempDB space right now.', es: 'Mira quién consume espacio de TempDB ahora mismo.' },
      { en: 'Check whether version store is the driver.', es: 'Comprueba si el version store es el causante.' },
      { en: 'If waits are PAGELATCH_*, prove allocation-page contention.', es: 'Si los waits son PAGELATCH_*, demuestra la contención en páginas de asignación.' },
      { en: 'Only after that decide between tuning, more files or cleanup.', es: 'Solo después decide entre tuning, más archivos o limpieza.' },
    ],
    watchItems: [
      { en: 'A spill incident is different from TempDB allocation contention.', es: 'Una incidencia por spill es distinta de la contención de asignación en TempDB.' },
      { en: 'Version store often comes from long readers or snapshot semantics.', es: 'El version store suele venir de lectores largos o semánticas snapshot.' },
      { en: 'TempDB symptoms often start upstream in memory grants or bad plans.', es: 'Los síntomas de TempDB suelen empezar aguas arriba en grants o malos planes.' },
    ],
    scripts: [
      {
        id: 'detect',
        title: { en: 'TempDB consumers now', es: 'Consumidores actuales de TempDB' },
        description: {
          en: 'Shows session-level TempDB usage and current SQL.',
          es: 'Muestra uso de TempDB por sesión y SQL actual.',
        },
        accent: 'blue',
        code: `SELECT s.session_id,
       (su.user_objects_alloc_page_count - su.user_objects_dealloc_page_count) * 8 / 1024.0 AS user_obj_mb,
       (su.internal_objects_alloc_page_count - su.internal_objects_dealloc_page_count) * 8 / 1024.0 AS internal_obj_mb,
       txt.text AS sql_text
FROM sys.dm_db_session_space_usage su
JOIN sys.dm_exec_sessions s
  ON su.session_id = s.session_id
LEFT JOIN sys.dm_exec_requests r
  ON s.session_id = r.session_id
OUTER APPLY sys.dm_exec_sql_text(r.sql_handle) txt
WHERE s.session_id > 50
ORDER BY internal_obj_mb DESC, user_obj_mb DESC;`,
      },
      {
        id: 'deep',
        title: { en: 'Version store + grants', es: 'Version store + grants' },
        description: {
          en: 'Checks whether version store or large memory grants are driving TempDB.',
          es: 'Comprueba si el version store o grants grandes están empujando TempDB.',
        },
        accent: 'violet',
        code: `SELECT *
FROM sys.dm_tran_version_store_space_usage
ORDER BY reserved_space_kb DESC;

SELECT TOP (20)
       session_id,
       requested_memory_kb,
       granted_memory_kb,
       used_memory_kb
FROM sys.dm_exec_query_memory_grants
ORDER BY requested_memory_kb DESC;`,
      },
      {
        id: 'action',
        title: { en: 'Allocation contention proof', es: 'Prueba de contención de asignación' },
        description: {
          en: 'Confirms whether PAGELATCH waits are landing on TempDB allocation pages.',
          es: 'Confirma si los waits PAGELATCH están cayendo sobre páginas de asignación de TempDB.',
        },
        accent: 'rose',
        code: `SELECT wt.session_id,
       wt.wait_type,
       wt.resource_description
FROM sys.dm_os_waiting_tasks wt
WHERE wt.wait_type LIKE 'PAGELATCH%'
  AND wt.resource_description LIKE '2:%'
ORDER BY wt.wait_duration_ms DESC;`,
      },
    ],
  },
  {
    id: 'io-log',
    title: { en: 'I/O & transaction log', es: 'I/O y log de transacciones' },
    symptom: {
      en: 'PAGEIOLATCH or WRITELOG climbs, commits stall and storage latency looks suspicious.',
      es: 'Suben PAGEIOLATCH o WRITELOG, los commits se frenan y la latencia de almacenamiento parece sospechosa.',
    },
    summary: {
      en: 'Measure file latency first, then inspect pending I/O and log space/reuse status so you can separate data I/O pain from log hardening pain.',
      es: 'Primero mide la latencia por archivo y luego revisa I/O pendiente y estado del log para separar dolor de datos de dolor al endurecer el log.',
    },
    whenToUse: {
      en: 'Use it when users complain that save hangs, backups slow down, or reads start waiting on disk.',
      es: 'Úsalo cuando los usuarios dicen que guardar se queda colgado, los backups van lentos o las lecturas esperan al disco.',
    },
    caution: {
      en: 'Do not assume storage is fine because somebody said so. Measure it from SQL Server first.',
      es: 'No des por hecho que el storage está bien porque alguien lo diga. Mídelo primero desde SQL Server.',
    },
    badges: ['PAGEIOLATCH_SH', 'WRITELOG', 'io_stall', 'log_reuse_wait_desc'],
    quickSteps: [
      { en: 'Measure latency per file inside SQL.', es: 'Mide la latencia por archivo dentro de SQL.' },
      { en: 'Separate data-file pain from log-file pain.', es: 'Separa el dolor de data files del de log files.' },
      { en: 'Check whether pending I/O is piling up.', es: 'Comprueba si se acumula I/O pendiente.' },
      { en: 'Then confirm log space and reuse state.', es: 'Luego confirma espacio y estado del log.' },
    ],
    watchItems: [
      { en: 'WRITELOG means log flush latency, not generic disk pain.', es: 'WRITELOG significa latencia al endurecer el log, no un dolor genérico de disco.' },
      { en: 'PAGEIOLATCH means reading pages from disk, not latch contention in memory.', es: 'PAGEIOLATCH significa leer páginas desde disco, no contención de latch en memoria.' },
      { en: 'Small autogrowth or shared busy volumes often sit behind slow commits.', es: 'Autogrowth pequeño o volúmenes compartidos y saturados suelen estar detrás de commits lentos.' },
    ],
    scripts: [
      {
        id: 'detect',
        title: { en: 'File latency by database', es: 'Latencia por archivo y base' },
        description: {
          en: 'Measures average read/write latency for MDF, NDF and LDF files.',
          es: 'Mide la latencia media de lectura/escritura para MDF, NDF y LDF.',
        },
        accent: 'blue',
        code: `SELECT DB_NAME(vfs.database_id) AS db_name,
       mf.type_desc,
       mf.physical_name,
       CASE WHEN vfs.num_of_reads = 0 THEN 0
            ELSE vfs.io_stall_read_ms / vfs.num_of_reads END AS avg_read_ms,
       CASE WHEN vfs.num_of_writes = 0 THEN 0
            ELSE vfs.io_stall_write_ms / vfs.num_of_writes END AS avg_write_ms
FROM sys.dm_io_virtual_file_stats(NULL, NULL) vfs
JOIN sys.master_files mf
  ON vfs.database_id = mf.database_id
 AND vfs.file_id = mf.file_id
ORDER BY avg_write_ms DESC, avg_read_ms DESC;`,
      },
      {
        id: 'deep',
        title: { en: 'Pending I/O + waits', es: 'I/O pendiente + waits' },
        description: {
          en: 'Shows live pending I/O and the waits usually associated with it.',
          es: 'Muestra el I/O pendiente en vivo y los waits que suelen acompañarlo.',
        },
        accent: 'amber',
        code: `SELECT *
FROM sys.dm_io_pending_io_requests;

SELECT TOP (20)
       wait_type,
       wait_time_ms / 1000.0 AS wait_sec,
       waiting_tasks_count
FROM sys.dm_os_wait_stats
WHERE wait_type IN ('PAGEIOLATCH_SH','PAGEIOLATCH_EX','PAGEIOLATCH_UP','WRITELOG','IO_COMPLETION')
ORDER BY wait_time_ms DESC;`,
      },
      {
        id: 'action',
        title: { en: 'Log state check', es: 'Chequeo del estado del log' },
        description: {
          en: 'Confirms whether the transaction log is near full or blocked from reuse.',
          es: 'Confirma si el transaction log está casi lleno o bloqueado para su reutilización.',
        },
        accent: 'cyan',
        code: `SELECT name,
       recovery_model_desc,
       log_reuse_wait_desc
FROM sys.databases
ORDER BY name;

SELECT DB_NAME(database_id) AS db_name,
       total_log_size_mb,
       used_log_space_mb,
       used_log_space_in_percent
FROM sys.dm_db_log_space_usage;`,
      },
    ],
  },
  {
    id: 'ha-dr',
    title: { en: 'Always On / DR', es: 'Always On / DR' },
    symptom: {
      en: 'A replica lags, failover confidence is low, or the business asks whether the primary is protected right now.',
      es: 'Una réplica va retrasada, hay poca confianza en un failover o negocio pregunta si el primario está protegido ahora mismo.',
    },
    summary: {
      en: 'Check synchronization state, send/redo queues and last hardened LSN before talking about failover or zero data loss.',
      es: 'Revisa estado de sincronización, colas de envío/redo y last hardened LSN antes de hablar de failover o cero pérdida de datos.',
    },
    whenToUse: {
      en: 'Use it during AG incidents, DR tests or before any controlled failover.',
      es: 'Úsalo durante incidencias de AG, pruebas de DR o antes de cualquier failover controlado.',
    },
    caution: {
      en: 'Do not fail over because the secondary looks green. Validate queues and app path first.',
      es: 'No hagas failover porque la secundaria se vea verde. Valida antes colas y camino de la app.',
    },
    badges: ['synchronization_state_desc', 'log_send_queue_size', 'redo_queue_size', 'last_hardened_lsn'],
    quickSteps: [
      { en: 'Check the real sync state of every replica.', es: 'Comprueba el estado real de sincronización de cada réplica.' },
      { en: 'Read send and redo queues, not only the role.', es: 'Lee colas de envío y redo, no solo el rol.' },
      { en: 'Confirm last hardened LSN before talking about data loss.', es: 'Confirma el último LSN endurecido antes de hablar de pérdida de datos.' },
      { en: 'Validate listener and app path after any failover action.', es: 'Valida listener y camino de la app tras cualquier failover.' },
    ],
    watchItems: [
      { en: 'A connected replica is not necessarily a protected replica.', es: 'Una réplica conectada no es necesariamente una réplica protegida.' },
      { en: 'Large send queue means the secondary is already behind.', es: 'Una cola de envío grande significa que la secundaria ya va atrasada.' },
      { en: 'For DR, the recovery point matters more than the role color.', es: 'Para DR, el punto de recuperación importa más que el color del rol.' },
    ],
    scripts: [
      {
        id: 'detect',
        title: { en: 'Replica state overview', es: 'Vista general del estado de réplicas' },
        description: {
          en: 'Shows role, health and synchronization state.',
          es: 'Muestra rol, salud y estado de sincronización.',
        },
        accent: 'blue',
        code: `SELECT ar.replica_server_name,
       ars.role_desc,
       ars.connected_state_desc,
       ars.operational_state_desc,
       drs.synchronization_state_desc,
       drs.synchronization_health_desc,
       DB_NAME(drs.database_id) AS db_name
FROM sys.dm_hadr_availability_replica_states ars
JOIN sys.availability_replicas ar
  ON ars.replica_id = ar.replica_id
LEFT JOIN sys.dm_hadr_database_replica_states drs
  ON ars.replica_id = drs.replica_id
ORDER BY ar.replica_server_name, db_name;`,
      },
      {
        id: 'deep',
        title: { en: 'LSN and queue depth', es: 'LSN y profundidad de colas' },
        description: {
          en: 'Shows send/redo backlog and last hardened markers.',
          es: 'Muestra backlog de envío/redo y marcadores de last hardened.',
        },
        accent: 'violet',
        code: `SELECT ar.replica_server_name,
       DB_NAME(drs.database_id) AS db_name,
       drs.synchronization_state_desc,
       drs.log_send_queue_size,
       drs.redo_queue_size,
       drs.last_hardened_lsn,
       drs.end_of_log_lsn,
       drs.last_commit_time
FROM sys.dm_hadr_database_replica_states drs
JOIN sys.availability_replicas ar
  ON drs.replica_id = ar.replica_id
ORDER BY drs.log_send_queue_size DESC, drs.redo_queue_size DESC;`,
      },
      {
        id: 'action',
        title: { en: 'Failover readiness check', es: 'Chequeo de preparación para failover' },
        description: {
          en: 'Quick validation pack before or after a controlled failover.',
          es: 'Pack rápido de validación antes o después de un failover controlado.',
        },
        accent: 'emerald',
        code: `SELECT ag.name,
       ar.replica_server_name,
       ars.role_desc,
       ars.connected_state_desc
FROM sys.availability_groups ag
JOIN sys.availability_replicas ar
  ON ag.group_id = ar.group_id
JOIN sys.dm_hadr_availability_replica_states ars
  ON ar.replica_id = ars.replica_id;

SELECT dns_name, port
FROM sys.availability_group_listeners;`,
      },
    ],
  },
];
