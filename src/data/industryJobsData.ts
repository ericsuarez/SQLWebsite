import type { LocalizedText } from './advancedSQLData';

export interface OlaIndexSample {
  id: string;
  name: string;
  fragPct: number;
  pages: number;
  sizeMb: number;
  writesPerMin: number;
}

export const OLA_DEFAULT_THRESHOLDS = {
  reorganizeFromPct: 5,
  rebuildFromPct: 30,
} as const;

export const OLA_INDEX_SAMPLES: OlaIndexSample[] = [
  { id: 'ix_orders_customer', name: 'IX_Orders_CustomerId', fragPct: 2, pages: 8200, sizeMb: 640, writesPerMin: 1800 },
  { id: 'ix_orders_date', name: 'IX_Orders_OrderDate', fragPct: 15, pages: 14100, sizeMb: 980, writesPerMin: 1100 },
  { id: 'ix_invoice_lines', name: 'IX_InvoiceLines_ProductId', fragPct: 45, pages: 26800, sizeMb: 2100, writesPerMin: 620 },
];

export type FindingSeverity = 'critical' | 'warning' | 'info' | 'good';

export interface HealthFinding {
  id: string;
  severity: FindingSeverity;
  badge: string;
  title: LocalizedText;
  summary: LocalizedText;
  why: LocalizedText;
  fix: LocalizedText;
  tsql: string;
  tags: string[];
}

export const BLITZ_FINDINGS: HealthFinding[] = [
  {
    id: 'poison_wait',
    severity: 'critical',
    badge: 'P1',
    title: { en: 'Poison Wait Detected', es: 'Poison wait detectado' },
    summary: {
      en: 'A single wait type dominates total wait time. This often points to a single root cause.',
      es: 'Un tipo de espera domina el total. Suele apuntar a una causa raiz clara.',
    },
    why: {
      en: 'When one wait is overwhelming everything else, you can focus remediation: storage for WRITELOG, memory for PAGEIOLATCH, blocking for LCK*, etc.',
      es: 'Cuando una espera aplasta al resto, puedes focalizar la remediacion: storage para WRITELOG, memoria para PAGEIOLATCH, blocking para LCK*, etc.',
    },
    fix: {
      en: 'Validate the top wait with DMVs, then drill into the driving sessions/queries before changing global settings.',
      es: 'Valida el top wait con DMVs y baja a sesiones/queries que lo causan antes de tocar settings globales.',
    },
    tsql: `-- Top waits (high level)
SELECT TOP (15)
       wait_type,
       waiting_tasks_count,
       wait_time_ms,
       100.0 * wait_time_ms / SUM(wait_time_ms) OVER () AS pct
FROM sys.dm_os_wait_stats
WHERE wait_type NOT LIKE 'SLEEP%'
ORDER BY wait_time_ms DESC;`,
    tags: ['WAIT_STATS', 'ROOT_CAUSE', 'P1'],
  },
  {
    id: 'plan_cache_eraser',
    severity: 'warning',
    badge: 'P2',
    title: { en: 'Plan Cache Eraser', es: 'Borrador de plan cache' },
    summary: {
      en: 'Frequent plan cache clears or recompile storms can cause CPU spikes and latency.',
      es: 'Limpiezas frecuentes del plan cache o tormentas de recompilacion causan picos de CPU y latencia.',
    },
    why: {
      en: 'If plans keep getting thrown away, the server spends time compiling instead of executing. It also increases plan volatility.',
      es: 'Si se tiran planes continuamente, el servidor compila en vez de ejecutar. Aumenta la volatilidad del rendimiento.',
    },
    fix: {
      en: 'Look for DBCC FREEPROCCACHE usage, excessive recompile causes, or forced parameterization changes.',
      es: 'Busca uso de DBCC FREEPROCCACHE, causas de recompilacion excesiva o cambios de parameterization.',
    },
    tsql: `-- Compile activity snapshot
SELECT TOP (50)
       cntr_value AS compilations_per_sec
FROM sys.dm_os_performance_counters
WHERE counter_name = 'SQL Compilations/sec'
  AND instance_name = '';`,
    tags: ['COMPILATION', 'CPU', 'VOLATILITY'],
  },
  {
    id: 'missing_indexes',
    severity: 'info',
    badge: 'P3',
    title: { en: 'Missing Indexes (Review Carefully)', es: 'Missing indexes (revisar con cuidado)' },
    summary: {
      en: 'Missing-index DMVs can suggest helpful indexes, but they can also create write amplification if applied blindly.',
      es: 'Las DMVs de missing index pueden sugerir indices utiles, pero aplicarlas sin criterio crea write amplification.',
    },
    why: {
      en: 'Missing-index suggestions ignore maintenance cost, duplicates, and query patterns. Use them as leads, not as auto-fixes.',
      es: 'Las sugerencias ignoran coste de mantenimiento, duplicados y patrones de consulta. Son pistas, no autoparches.',
    },
    fix: {
      en: 'Validate with Query Store / plan cache, check write rates, and consolidate indexes.',
      es: 'Valida con Query Store / plan cache, revisa tasa de escrituras y consolida indices.',
    },
    tsql: `-- Missing index leads (triage)
SELECT TOP (25)
       migs.avg_total_user_cost,
       migs.avg_user_impact,
       mid.statement,
       mid.equality_columns,
       mid.inequality_columns,
       mid.included_columns
FROM sys.dm_db_missing_index_group_stats AS migs
JOIN sys.dm_db_missing_index_groups AS mig
  ON migs.group_handle = mig.index_group_handle
JOIN sys.dm_db_missing_index_details AS mid
  ON mig.index_handle = mid.index_handle
ORDER BY migs.avg_user_impact DESC;`,
    tags: ['INDEX', 'TUNING'],
  },
  {
    id: 'green_baseline',
    severity: 'good',
    badge: 'OK',
    title: { en: 'Backups Look Healthy', es: 'Backups saludables' },
    summary: {
      en: 'RPO/RTO objectives are supported by recent full/diff/log backups.',
      es: 'Los objetivos RPO/RTO estan soportados por backups full/diff/log recientes.',
    },
    why: {
      en: 'Backups are the foundation. Everything else (HA, tuning) is secondary if you cannot restore.',
      es: 'El backup es la base. El resto (HA, tuning) es secundario si no puedes restaurar.',
    },
    fix: {
      en: 'Keep validating restores regularly and ensure copy-only workflows are understood.',
      es: 'Sigue validando restores y asegurate de entender copy-only y su impacto.',
    },
    tsql: `-- Backup recency
SELECT TOP (20)
       database_name,
       type,
       backup_finish_date
FROM msdb.dbo.backupset
ORDER BY backup_finish_date DESC;`,
    tags: ['BACKUP', 'RPO', 'RTO'],
  },
];

export interface BlitzCacheRow {
  id: string;
  severity: FindingSeverity;
  queryLabel: string;
  database: string;
  cpuMs: number;
  durationMs: number;
  reads: number;
  writes: number;
  executions: number;
  flags: string[];
  summary: LocalizedText;
  fix: LocalizedText;
  tsql: string;
}

export const BLITZCACHE_ROWS: BlitzCacheRow[] = [
  {
    id: 'q1',
    severity: 'critical',
    queryLabel: 'OrdersByCustomer',
    database: 'SalesDB',
    cpuMs: 842000,
    durationMs: 1630000,
    reads: 12800000,
    writes: 22000,
    executions: 460,
    flags: ['Missing index', 'Key lookup', 'High reads'],
    summary: {
      en: 'High logical reads and repeated key lookups amplify CPU and buffer pool pressure.',
      es: 'Lecturas logicas altas y key lookups repetidos amplifican CPU y presion del buffer pool.',
    },
    fix: {
      en: 'Make the index covering (INCLUDE) or rewrite to reduce lookups; validate with Query Store before forcing a plan.',
      es: 'Haz el indice covering (INCLUDE) o reescribe para reducir lookups; valida con Query Store antes de forzar plan.',
    },
    tsql: `-- Find top queries by reads (example)
SELECT TOP (20)
       qs.total_logical_reads,
       qs.execution_count,
       SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
         ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(st.text) ELSE qs.statement_end_offset END - qs.statement_start_offset)/2)+1) AS statement_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY qs.total_logical_reads DESC;`,
  },
  {
    id: 'q2',
    severity: 'warning',
    queryLabel: 'InventorySearch',
    database: 'SalesDB',
    cpuMs: 312000,
    durationMs: 920000,
    reads: 4200000,
    writes: 9000,
    executions: 1200,
    flags: ['Implicit conversion', 'Parameter sniffing'],
    summary: {
      en: 'Implicit conversions can prevent index seeks and cause unstable plans with parameter sniffing.',
      es: 'Conversiones implicitas pueden impedir seeks y causar planes inestables con parameter sniffing.',
    },
    fix: {
      en: 'Fix data type mismatches and consider PSP/optimize-for patterns; avoid overusing RECOMPILE.',
      es: 'Arregla mismatch de tipos y considera patrones PSP/optimize-for; evita abusar de RECOMPILE.',
    },
    tsql: `-- Spot implicit conversions in cached plans (high level)
SELECT TOP (25)
       qs.total_worker_time,
       qs.execution_count,
       qp.query_plan
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
WHERE CONVERT(nvarchar(max), qp.query_plan) LIKE '%CONVERT_IMPLICIT%'
ORDER BY qs.total_worker_time DESC;`,
  },
  {
    id: 'q3',
    severity: 'info',
    queryLabel: 'NightlyETL',
    database: 'DW',
    cpuMs: 120000,
    durationMs: 210000,
    reads: 980000,
    writes: 540000,
    executions: 6,
    flags: ['Large write', 'Minimal logging?'],
    summary: {
      en: 'ETL writes are expected, but watch log growth, VLF count, and backup log cadence.',
      es: 'Escrituras ETL son esperables, pero vigila growth del log, VLFs y la cadencia de log backups.',
    },
    fix: {
      en: 'Align the ETL window with log backups and check autogrowth settings; consider batching to reduce spikes.',
      es: 'Alinea la ventana ETL con log backups y revisa autogrowth; considera batching para reducir picos.',
    },
    tsql: `-- Log growth settings (quick check)
SELECT name, size*8/1024 AS size_mb, growth, is_percent_growth
FROM sys.database_files;`,
  },
];

export const JOB_TSQL_SNIPPETS = {
  olaIndexOptimize: `-- Ola Hallengren (usage example)
EXECUTE dbo.IndexOptimize
  @Databases = 'USER_DATABASES',
  @FragmentationLevel1 = 5,
  @FragmentationLevel2 = 30,
  @FragmentationLow = NULL,
  @FragmentationMedium = 'INDEX_REORGANIZE',
  @FragmentationHigh = 'INDEX_REBUILD_ONLINE,INDEX_REBUILD_OFFLINE',
  @UpdateStatistics = 'ALL',
  @LogToTable = 'Y';`,
  olaIntegrity: `-- Ola Hallengren (usage example)
EXECUTE dbo.DatabaseIntegrityCheck
  @Databases = 'USER_DATABASES',
  @LogToTable = 'Y';`,
  olaBackups: `-- Ola Hallengren (usage example)
EXECUTE dbo.DatabaseBackup
  @Databases = 'USER_DATABASES',
  @BackupType = 'FULL',
  @Verify = 'Y',
  @CleanupTime = 168,
  @LogToTable = 'Y';`,
  blitz: `-- First Responder Kit (usage example)
EXECUTE dbo.sp_Blitz;`,
  blitzCache: `-- First Responder Kit (usage example)
EXECUTE dbo.sp_BlitzCache @SortOrder = 'cpu';`,
} as const;

