export interface LocalizedCaseText {
  en: string;
  es: string;
}

export interface SpidCard {
  spid: number;
  labelKey?: string;
  label?: LocalizedCaseText;
  status: 'running' | 'suspended' | 'evicted' | 'idle' | 'contention' | 'growth' | 'virt';
  waitType?: string;
  blockedBy?: number;
  planStatus?: 'cached' | 'evicted' | 'recompiling';
  extra?: string;
}

export type ExecPhase = 'parse' | 'bind' | 'optimize' | 'execute' | 'lock' | 'wait' | 'done' | 'error';

export interface SqlosState {
  schedulers: number;
  workers: number;
  runnable: number;
  suspended: number;
  waitType?: string;
  waitMs?: number;
}

export interface BufferState {
  totalPages: number;
  usedPages: number;
  dirtyPages: number;
  evictedPages: number;
}

export interface CaseStep {
  logKey: string;
  log?: LocalizedCaseText;
  spids: SpidCard[];
  phase?: ExecPhase;
  sqlos?: SqlosState;
  buffer?: BufferState;
  highlight?: 'query' | 'lock' | 'io' | 'plan' | 'wait';
}

export interface RealCase {
  id: string;
  icon: string;
  color: 'amber' | 'rose' | 'purple' | 'cyan' | 'red' | 'orange' | 'yellow' | 'blue' | 'violet' | 'emerald';
  nameKey: string;
  descKey: string;
  detailsKey: string;
  title?: LocalizedCaseText;
  description?: LocalizedCaseText;
  details?: LocalizedCaseText;
  resolution?: LocalizedCaseText;
  schema: LocalizedCaseText;
  query: LocalizedCaseText;
  detectionQuery: LocalizedCaseText;
  resolutionKey: string;
  detectionMode?: 'dmv' | 'xe' | 'hybrid' | 'hypervisor';
  detectionSummary?: LocalizedCaseText;
  xeWhy?: LocalizedCaseText;
  xeScript?: LocalizedCaseText;
  badges?: string[];
  steps: CaseStep[];
}

export interface XEventLab {
  id: string;
  title: LocalizedCaseText;
  summary: LocalizedCaseText;
  why: LocalizedCaseText;
  sessionScript: LocalizedCaseText;
  readbackScript: LocalizedCaseText;
  badges: string[];
}

export const REAL_CASES: RealCase[] = [
  {
    id: 'blocker',
    icon: '🔒',
    color: 'amber',
    nameKey: 'caseBlocker',
    descKey: 'caseBlockerDesc',
    detailsKey: 'caseBlockerExplain',
    schema: {
      en: `CREATE TABLE Orders (
  OrderID    INT IDENTITY PRIMARY KEY,
  CustomerID INT NOT NULL,
  Status     CHAR(1) DEFAULT 'N',
  Amount     DECIMAL(10,2)
);`,
      es: `CREATE TABLE Orders (
  OrderID    INT IDENTITY PRIMARY KEY,
  CustomerID INT NOT NULL,
  Status     CHAR(1) DEFAULT 'N',
  Amount     DECIMAL(10,2)
);`,
    },
    query: {
      en: `-- SPID 52 (root blocker)
BEGIN TRAN;
  UPDATE Orders
  SET Status = 'P'
  WHERE OrderID = 1001;
-- No COMMIT yet -> X lock stays active

-- SPID 53 (blocked session)
UPDATE Orders
SET Amount = 99.99
WHERE OrderID = 1001; -- waits on LCK_M_X`,
      es: `-- SPID 52 (bloqueador raiz)
BEGIN TRAN;
  UPDATE Orders
  SET Status = 'P'
  WHERE OrderID = 1001;
-- Sin COMMIT todavia -> el lock X sigue activo

-- SPID 53 (sesion bloqueada)
UPDATE Orders
SET Amount = 99.99
WHERE OrderID = 1001; -- queda esperando LCK_M_X`,
    },
    detectionQuery: {
      en: `SELECT r.session_id,
       r.blocking_session_id,
       r.wait_type,
       r.wait_time / 1000 AS wait_sec,
       t.text AS sql_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id > 0;`,
      es: `SELECT r.session_id,
       r.blocking_session_id,
       r.wait_type,
       r.wait_time / 1000 AS wait_sec,
       t.text AS sql_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id > 0;`,
    },
    resolutionKey: 'caseBlockerBestPractice',
    steps: [
      { logKey: 'blockerLog1', phase: 'execute', spids: [{ spid: 52, status: 'running', labelKey: 'blockerSpid52Running' }], sqlos: { schedulers: 4, workers: 2, runnable: 1, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 312, dirtyPages: 1, evictedPages: 0 } },
      { logKey: 'blockerLog2', phase: 'lock', spids: [{ spid: 52, status: 'running', labelKey: 'blockerSpid52Lock' }], sqlos: { schedulers: 4, workers: 2, runnable: 1, suspended: 0, waitType: 'none' }, buffer: { totalPages: 1000, usedPages: 312, dirtyPages: 1, evictedPages: 0 }, highlight: 'lock' },
      { logKey: 'blockerLog3', phase: 'wait', spids: [{ spid: 52, status: 'running', labelKey: 'blockerSpid52Lock' }, { spid: 53, status: 'suspended', waitType: 'LCK_M_X', blockedBy: 52 }, { spid: 54, status: 'suspended', waitType: 'LCK_M_X', blockedBy: 52 }], sqlos: { schedulers: 4, workers: 4, runnable: 1, suspended: 2, waitType: 'LCK_M_X', waitMs: 12400 }, buffer: { totalPages: 1000, usedPages: 312, dirtyPages: 1, evictedPages: 0 }, highlight: 'lock' },
      { logKey: 'blockerLog4', phase: 'done', spids: [{ spid: 52, status: 'idle', labelKey: 'blockerDone52' }, { spid: 53, status: 'running' }, { spid: 54, status: 'running' }], sqlos: { schedulers: 4, workers: 3, runnable: 2, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 312, dirtyPages: 2, evictedPages: 0 } },
    ],
  },
  {
    id: 'latch',
    icon: '💾',
    color: 'rose',
    nameKey: 'caseLatch',
    descKey: 'caseLatchDesc',
    detailsKey: 'caseLatchExplain',
    schema: {
      en: `CREATE TABLE EventLog (
  LogID   INT IDENTITY(1,1) PRIMARY KEY,
  EventAt DATETIME DEFAULT GETDATE(),
  Source  VARCHAR(50),
  Message VARCHAR(200)
);`,
      es: `CREATE TABLE EventLog (
  LogID   INT IDENTITY(1,1) PRIMARY KEY,
  EventAt DATETIME DEFAULT GETDATE(),
  Source  VARCHAR(50),
  Message VARCHAR(200)
);`,
    },
    query: {
      en: `-- 8 threads insert at the same time
INSERT INTO EventLog (Source, Message)
VALUES ('API', 'User login');

-- The clustered key is sequential
-- so every worker targets the same last page`,
      es: `-- 8 hilos insertan al mismo tiempo
INSERT INTO EventLog (Source, Message)
VALUES ('API', 'User login');

-- La clave clustered es secuencial
-- y todos terminan golpeando la misma ultima pagina`,
    },
    detectionQuery: {
      en: `SELECT wait_type,
       waiting_tasks_count,
       wait_time_ms / 1000.0 AS wait_sec
FROM sys.dm_os_wait_stats
WHERE wait_type LIKE 'PAGELATCH%'
ORDER BY wait_time_ms DESC;`,
      es: `SELECT wait_type,
       waiting_tasks_count,
       wait_time_ms / 1000.0 AS wait_sec
FROM sys.dm_os_wait_stats
WHERE wait_type LIKE 'PAGELATCH%'
ORDER BY wait_time_ms DESC;`,
    },
    resolutionKey: 'caseLatchBestPractice',
    steps: [
      { logKey: 'latchLog1', phase: 'execute', spids: [{ spid: 60, status: 'running' }, { spid: 61, status: 'running' }, { spid: 62, status: 'running' }, { spid: 63, status: 'running' }], sqlos: { schedulers: 4, workers: 8, runnable: 8, suspended: 0 }, buffer: { totalPages: 800, usedPages: 400, dirtyPages: 12, evictedPages: 0 } },
      { logKey: 'latchLog2', phase: 'lock', spids: [{ spid: 60, status: 'running', labelKey: 'latchSpid60Running' }, { spid: 61, status: 'suspended', waitType: 'PAGELATCH_EX' }, { spid: 62, status: 'suspended', waitType: 'PAGELATCH_EX' }, { spid: 63, status: 'suspended', waitType: 'PAGELATCH_EX' }], sqlos: { schedulers: 4, workers: 8, runnable: 1, suspended: 7, waitType: 'PAGELATCH_EX', waitMs: 850 }, buffer: { totalPages: 800, usedPages: 400, dirtyPages: 12, evictedPages: 0 }, highlight: 'lock' },
      { logKey: 'latchLog3', phase: 'execute', spids: [{ spid: 60, status: 'running' }, { spid: 61, status: 'running' }, { spid: 62, status: 'running' }, { spid: 63, status: 'running' }], sqlos: { schedulers: 4, workers: 8, runnable: 8, suspended: 0 }, buffer: { totalPages: 800, usedPages: 420, dirtyPages: 8, evictedPages: 0 } },
      { logKey: 'latchLog4', phase: 'done', spids: [{ spid: 60, status: 'running', labelKey: 'latchDone' }, { spid: 61, status: 'running', labelKey: 'latchDone' }, { spid: 62, status: 'idle' }, { spid: 63, status: 'idle' }], sqlos: { schedulers: 4, workers: 4, runnable: 2, suspended: 0 }, buffer: { totalPages: 800, usedPages: 430, dirtyPages: 4, evictedPages: 0 } },
    ],
  },
  {
    id: 'plan',
    icon: '🗑️',
    color: 'purple',
    nameKey: 'casePlanEviction',
    descKey: 'casePlanEvictionDesc',
    detailsKey: 'casePlanEvictionExplain',
    schema: {
      en: `CREATE TABLE Products (
  ProductID INT PRIMARY KEY,
  Name      VARCHAR(100),
  Price     DECIMAL(10,2),
  Stock     INT
);
-- About 5 million rows`,
      es: `CREATE TABLE Products (
  ProductID INT PRIMARY KEY,
  Name      VARCHAR(100),
  Price     DECIMAL(10,2),
  Stock     INT
);
-- Aproximadamente 5 millones de filas`,
    },
    query: {
      en: `-- Parameterized query compiled once
SELECT ProductID, Name, Price
FROM Products
WHERE Price BETWEEN @MinPrice AND @MaxPrice;

-- The plan lives in sys.dm_exec_cached_plans`,
      es: `-- Consulta parametrizada compilada una sola vez
SELECT ProductID, Name, Price
FROM Products
WHERE Price BETWEEN @MinPrice AND @MaxPrice;

-- El plan queda guardado en sys.dm_exec_cached_plans`,
    },
    detectionQuery: {
      en: `SELECT TOP 20
       qs.execution_count,
       qs.total_worker_time / qs.execution_count AS avg_cpu,
       SUBSTRING(st.text, 1, 120) AS sql_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY avg_cpu DESC;`,
      es: `SELECT TOP 20
       qs.execution_count,
       qs.total_worker_time / qs.execution_count AS avg_cpu,
       SUBSTRING(st.text, 1, 120) AS sql_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY avg_cpu DESC;`,
    },
    resolutionKey: 'casePlanBestPractice',
    steps: [
      { logKey: 'planLog1', phase: 'execute', spids: [{ spid: 70, status: 'running', planStatus: 'cached' }, { spid: 71, status: 'running', planStatus: 'cached' }], sqlos: { schedulers: 8, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 2400, usedPages: 2300, dirtyPages: 80, evictedPages: 0 } },
      { logKey: 'planLog2', phase: 'wait', spids: [{ spid: 70, status: 'evicted', planStatus: 'evicted' }, { spid: 71, status: 'evicted', planStatus: 'evicted' }], sqlos: { schedulers: 8, workers: 6, runnable: 2, suspended: 4, waitType: 'RESOURCE_SEMAPHORE', waitMs: 280 }, buffer: { totalPages: 2400, usedPages: 2390, dirtyPages: 120, evictedPages: 40 }, highlight: 'plan' },
      { logKey: 'planLog3', phase: 'optimize', spids: [{ spid: 70, status: 'running', planStatus: 'recompiling' }, { spid: 71, status: 'running', planStatus: 'recompiling' }], sqlos: { schedulers: 8, workers: 6, runnable: 4, suspended: 2, waitType: 'SOS_SCHEDULER_YIELD', waitMs: 120 }, buffer: { totalPages: 2400, usedPages: 2380, dirtyPages: 90, evictedPages: 30 }, highlight: 'plan' },
      { logKey: 'planLog4', phase: 'done', spids: [{ spid: 70, status: 'running', planStatus: 'cached' }, { spid: 71, status: 'running', planStatus: 'cached' }], sqlos: { schedulers: 8, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 2400, usedPages: 2200, dirtyPages: 30, evictedPages: 0 } },
    ],
  },
  {
    id: 'tempdb',
    icon: '🗃️',
    color: 'cyan',
    nameKey: 'caseTempDb',
    descKey: 'caseTempDbDesc',
    detailsKey: 'caseTempDbExplain',
    schema: {
      en: `-- Procedure that creates a temp table
CREATE TABLE #TempResult (
  ID    INT,
  Value VARCHAR(100)
);

-- TempDB must allocate pages through
-- PFS, GAM and SGAM metadata pages`,
      es: `-- Procedimiento que crea una tabla temporal
CREATE TABLE #TempResult (
  ID    INT,
  Value VARCHAR(100)
);

-- TempDB debe reservar paginas usando
-- las paginas PFS, GAM y SGAM`,
    },
    query: {
      en: `-- 16 sessions call this proc at once
EXEC usp_GetUserReport @UserID = ?;

-- Inside: SELECT ... INTO #TempResult
-- Every execution creates and drops the temp table
-- All workers hit TempDB metadata together`,
      es: `-- 16 sesiones llaman este proc al mismo tiempo
EXEC usp_GetUserReport @UserID = ?;

-- Dentro: SELECT ... INTO #TempResult
-- Cada ejecucion crea y borra la #temp
-- Todos golpean a la vez los metadatos de TempDB`,
    },
    detectionQuery: {
      en: `-- TempDB file count
SELECT COUNT(*) AS tempdb_files
FROM sys.master_files
WHERE database_id = 2
  AND type = 0;

-- Allocation page contention
SELECT wait_type, waiting_tasks_count, wait_time_ms
FROM sys.dm_os_wait_stats
WHERE wait_type IN ('PAGELATCH_UP', 'PAGELATCH_EX')
ORDER BY wait_time_ms DESC;`,
      es: `-- Numero de archivos de TempDB
SELECT COUNT(*) AS tempdb_files
FROM sys.master_files
WHERE database_id = 2
  AND type = 0;

-- Contencion en paginas de asignacion
SELECT wait_type, waiting_tasks_count, wait_time_ms
FROM sys.dm_os_wait_stats
WHERE wait_type IN ('PAGELATCH_UP', 'PAGELATCH_EX')
ORDER BY wait_time_ms DESC;`,
    },
    resolutionKey: 'tempdbBestPractice',
    steps: [
      { logKey: 'tempdbLog1', phase: 'execute', spids: [{ spid: 80, status: 'running', labelKey: 'tempdbSpid80Running1' }], sqlos: { schedulers: 16, workers: 16, runnable: 16, suspended: 0 }, buffer: { totalPages: 600, usedPages: 200, dirtyPages: 10, evictedPages: 0 } },
      { logKey: 'tempdbLog2', phase: 'wait', spids: [{ spid: 80, status: 'contention', waitType: 'PAGELATCH_UP', labelKey: 'tempdbSpid80Wait' }, { spid: 81, status: 'suspended', waitType: 'PAGELATCH_UP' }, { spid: 82, status: 'suspended', waitType: 'PAGELATCH_UP' }, { spid: 83, status: 'suspended', waitType: 'PAGELATCH_UP' }], sqlos: { schedulers: 16, workers: 16, runnable: 1, suspended: 15, waitType: 'PAGELATCH_UP', waitMs: 2300 }, buffer: { totalPages: 600, usedPages: 200, dirtyPages: 10, evictedPages: 0 }, highlight: 'wait' },
      { logKey: 'tempdbLog3', phase: 'execute', spids: [{ spid: 80, status: 'running', labelKey: 'tempdbSpid80Running2' }, { spid: 81, status: 'running', labelKey: 'tempdbSpid81Running2' }, { spid: 82, status: 'running', labelKey: 'tempdbSpid82Running2' }, { spid: 83, status: 'running', labelKey: 'tempdbSpid83Running2' }], sqlos: { schedulers: 16, workers: 16, runnable: 12, suspended: 4 }, buffer: { totalPages: 600, usedPages: 220, dirtyPages: 8, evictedPages: 0 } },
      { logKey: 'tempdbLog4', phase: 'done', spids: [{ spid: 80, status: 'running', labelKey: 'tempdbDone' }, { spid: 81, status: 'running', labelKey: 'tempdbDone' }, { spid: 82, status: 'running', labelKey: 'tempdbDone' }, { spid: 83, status: 'running', labelKey: 'tempdbDone' }], sqlos: { schedulers: 16, workers: 16, runnable: 16, suspended: 0 }, buffer: { totalPages: 600, usedPages: 230, dirtyPages: 4, evictedPages: 0 } },
    ],
  },
  {
    id: 'ldf',
    icon: '💿',
    color: 'red',
    nameKey: 'caseLdfPlacement',
    descKey: 'caseLdfPlacementDesc',
    detailsKey: 'caseLdfPlacementExplain',
    schema: {
      en: `-- Same spindle for data and log
-- D:\\Data\\SalesDB.mdf   -> random I/O
-- D:\\Data\\SalesDB.ldf   -> sequential I/O
-- Both workloads compete for the same storage path`,
      es: `-- Mismo volumen para datos y log
-- D:\\Data\\SalesDB.mdf   -> I/O aleatoria
-- D:\\Data\\SalesDB.ldf   -> I/O secuencial
-- Ambas cargas compiten por la misma ruta de almacenamiento`,
    },
    query: {
      en: `BEGIN TRAN;
  INSERT INTO Sales (CustomerID, Amount, SaleDate)
  VALUES (1001, 249.99, GETDATE());
  -- WAL: log record goes first
  -- data page stays dirty in buffer pool
COMMIT;

-- WRITELOG latency defines commit speed`,
      es: `BEGIN TRAN;
  INSERT INTO Sales (CustomerID, Amount, SaleDate)
  VALUES (1001, 249.99, GETDATE());
  -- WAL: el log se escribe antes que la pagina de datos
  -- la pagina queda sucia en el buffer pool
COMMIT;

-- La latencia WRITELOG marca la velocidad del commit`,
    },
    detectionQuery: {
      en: `SELECT DB_NAME(vfs.database_id) AS db_name,
       mf.physical_name,
       vfs.io_stall_read_ms,
       vfs.io_stall_write_ms,
       vfs.num_of_writes
FROM sys.dm_io_virtual_file_stats(NULL, NULL) vfs
JOIN sys.master_files mf
  ON vfs.file_id = mf.file_id
 AND vfs.database_id = mf.database_id
ORDER BY vfs.io_stall_write_ms DESC;`,
      es: `SELECT DB_NAME(vfs.database_id) AS db_name,
       mf.physical_name,
       vfs.io_stall_read_ms,
       vfs.io_stall_write_ms,
       vfs.num_of_writes
FROM sys.dm_io_virtual_file_stats(NULL, NULL) vfs
JOIN sys.master_files mf
  ON vfs.file_id = mf.file_id
 AND vfs.database_id = mf.database_id
ORDER BY vfs.io_stall_write_ms DESC;`,
    },
    resolutionKey: 'ldfBestPractice',
    steps: [
      { logKey: 'ldfLog1', phase: 'execute', spids: [{ spid: 90, status: 'running', labelKey: 'ldfSpid90Running1' }, { spid: 91, status: 'running', labelKey: 'ldfSpid91Running1' }], sqlos: { schedulers: 4, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 1200, usedPages: 400, dirtyPages: 20, evictedPages: 0 } },
      { logKey: 'ldfLog2', phase: 'wait', spids: [{ spid: 90, status: 'suspended', waitType: 'WRITELOG', labelKey: 'ldfSpid90Wait' }, { spid: 91, status: 'suspended', waitType: 'WRITELOG', labelKey: 'ldfSpid91Wait' }], sqlos: { schedulers: 4, workers: 4, runnable: 0, suspended: 4, waitType: 'WRITELOG', waitMs: 48 }, buffer: { totalPages: 1200, usedPages: 420, dirtyPages: 80, evictedPages: 0 }, highlight: 'io' },
      { logKey: 'ldfLog3', phase: 'error', spids: [{ spid: 90, status: 'suspended', waitType: 'WRITELOG', labelKey: 'ldfSpid90Wait2' }, { spid: 91, status: 'suspended', waitType: 'WRITELOG', labelKey: 'ldfSpid91Wait2' }], sqlos: { schedulers: 4, workers: 4, runnable: 0, suspended: 4, waitType: 'WRITELOG', waitMs: 48 }, buffer: { totalPages: 1200, usedPages: 420, dirtyPages: 80, evictedPages: 0 }, highlight: 'io' },
      { logKey: 'ldfLog4', phase: 'done', spids: [{ spid: 90, status: 'running', labelKey: 'ldfSpid90Running2' }, { spid: 91, status: 'running', labelKey: 'ldfSpid91Running2' }], sqlos: { schedulers: 4, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 1200, usedPages: 400, dirtyPages: 5, evictedPages: 0 } },
    ],
  },
  {
    id: 'cxpacket',
    icon: '🔀',
    color: 'orange',
    nameKey: 'caseCxpacket',
    descKey: 'caseCxpacketDesc',
    detailsKey: 'caseCxpacketExplain',
    schema: {
      en: `CREATE TABLE SalesHistory (
  RowID    BIGINT IDENTITY PRIMARY KEY,
  SaleDate DATE,
  RegionID TINYINT,
  Amount   DECIMAL(12,2)
);
-- 50M rows, heavy skew on RegionID = 1`,
      es: `CREATE TABLE SalesHistory (
  RowID    BIGINT IDENTITY PRIMARY KEY,
  SaleDate DATE,
  RegionID TINYINT,
  Amount   DECIMAL(12,2)
);
-- 50M de filas, con gran sesgo en RegionID = 1`,
    },
    query: {
      en: `-- Optimizer chooses DOP = 8
SELECT RegionID, SUM(Amount) AS Total
FROM SalesHistory
WHERE SaleDate >= '2020-01-01'
GROUP BY RegionID
ORDER BY Total DESC;

-- One worker gets most of the data`,
      es: `-- El optimizador elige DOP = 8
SELECT RegionID, SUM(Amount) AS Total
FROM SalesHistory
WHERE SaleDate >= '2020-01-01'
GROUP BY RegionID
ORDER BY Total DESC;

-- Un worker recibe casi toda la carga`,
    },
    detectionQuery: {
      en: `SELECT wait_type,
       waiting_tasks_count,
       wait_time_ms / 1000.0 AS wait_sec
FROM sys.dm_os_wait_stats
WHERE wait_type IN ('CXPACKET', 'CXCONSUMER')
ORDER BY wait_time_ms DESC;`,
      es: `SELECT wait_type,
       waiting_tasks_count,
       wait_time_ms / 1000.0 AS wait_sec
FROM sys.dm_os_wait_stats
WHERE wait_type IN ('CXPACKET', 'CXCONSUMER')
ORDER BY wait_time_ms DESC;`,
    },
    resolutionKey: 'cxpacketBestPractice',
    steps: [
      { logKey: 'cxpLog1', phase: 'optimize', spids: [{ spid: 100, status: 'running', labelKey: 'cxpSpid100Running1' }, { spid: 101, status: 'running', labelKey: 'cxpSpid101Running1' }, { spid: 102, status: 'running', labelKey: 'cxpSpid102Running1' }, { spid: 103, status: 'running', labelKey: 'cxpSpid103Running1' }], sqlos: { schedulers: 8, workers: 8, runnable: 8, suspended: 0 }, buffer: { totalPages: 3000, usedPages: 800, dirtyPages: 0, evictedPages: 0 } },
      { logKey: 'cxpLog2', phase: 'wait', spids: [{ spid: 100, status: 'suspended', waitType: 'CXPACKET', labelKey: 'cxpSpid100Wait1' }, { spid: 101, status: 'suspended', waitType: 'CXPACKET', labelKey: 'cxpSpid101Wait1' }, { spid: 102, status: 'suspended', waitType: 'CXPACKET', labelKey: 'cxpSpid102Wait1' }, { spid: 103, status: 'running', labelKey: 'cxpSpid103Running2' }], sqlos: { schedulers: 8, workers: 8, runnable: 1, suspended: 7, waitType: 'CXPACKET', waitMs: 34000 }, buffer: { totalPages: 3000, usedPages: 2800, dirtyPages: 0, evictedPages: 100 }, highlight: 'wait' },
      { logKey: 'cxpLog3', phase: 'optimize', spids: [{ spid: 100, status: 'running', labelKey: 'cxpSpid100Running1' }, { spid: 101, status: 'running', labelKey: 'cxpSpid101Running1' }, { spid: 102, status: 'running', labelKey: 'cxpSpid102Running1' }], sqlos: { schedulers: 8, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 3000, usedPages: 1800, dirtyPages: 0, evictedPages: 50 } },
      { logKey: 'cxpLog4', phase: 'done', spids: [{ spid: 100, status: 'running', labelKey: 'latchDone' }, { spid: 101, status: 'idle' }, { spid: 102, status: 'idle' }], sqlos: { schedulers: 8, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 3000, usedPages: 1400, dirtyPages: 0, evictedPages: 0 } },
    ],
  },
  {
    id: 'autogrowth',
    icon: '📈',
    color: 'yellow',
    nameKey: 'caseAutoGrowth',
    descKey: 'caseAutoGrowthDesc',
    detailsKey: 'caseAutoGrowthExplain',
    schema: {
      en: `-- Poor log file configuration
-- FILENAME   = 'D:\\Logs\\SalesDB.ldf'
-- SIZE       = 100MB
-- FILEGROWTH = 10%
-- After years -> thousands of tiny VLFs`,
      es: `-- Configuracion mala del log
-- FILENAME   = 'D:\\Logs\\SalesDB.ldf'
-- SIZE       = 100MB
-- FILEGROWTH = 10%
-- Tras anos -> miles de VLFs pequenos`,
    },
    query: {
      en: `-- Batch load that fills the log
INSERT INTO Sales
SELECT *
FROM StagingImport; -- 2M rows

-- Log autogrowth is synchronous
-- all writers pause until growth ends`,
      es: `-- Carga por lotes que llena el log
INSERT INTO Sales
SELECT *
FROM StagingImport; -- 2M filas

-- El autogrowth del log es sincrono
-- todos los escritores esperan hasta que termina`,
    },
    detectionQuery: {
      en: `-- Count VLFs
DBCC LOGINFO;

-- Find autogrowth events
SELECT DatabaseName,
       Filename,
       (IntegerData * 8.0 / 1024) AS growth_mb,
       StartTime
FROM fn_trace_gettable(
  CONVERT(varchar(150), (SELECT TOP 1 path FROM sys.traces WHERE is_default = 1)),
  DEFAULT
)
WHERE EventClass IN (92, 93)
ORDER BY StartTime DESC;`,
      es: `-- Contar VLFs
DBCC LOGINFO;

-- Buscar eventos de autogrowth
SELECT DatabaseName,
       Filename,
       (IntegerData * 8.0 / 1024) AS growth_mb,
       StartTime
FROM fn_trace_gettable(
  CONVERT(varchar(150), (SELECT TOP 1 path FROM sys.traces WHERE is_default = 1)),
  DEFAULT
)
WHERE EventClass IN (92, 93)
ORDER BY StartTime DESC;`,
    },
    resolutionKey: 'autoGrowthBestPractice',
    steps: [
      { logKey: 'autoLog1', phase: 'execute', spids: [{ spid: 110, status: 'running', labelKey: 'autoSpid110Running1' }], sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 800, usedPages: 600, dirtyPages: 200, evictedPages: 0 } },
      { logKey: 'autoLog2', phase: 'wait', spids: [{ spid: 110, status: 'growth', waitType: 'LOG_GROW', labelKey: 'autoSpid110Wait1' }, { spid: 111, status: 'suspended', waitType: 'LOGBUFFER' }, { spid: 112, status: 'suspended', waitType: 'LOGBUFFER' }], sqlos: { schedulers: 4, workers: 4, runnable: 0, suspended: 4, waitType: 'LOGBUFFER', waitMs: 5400 }, buffer: { totalPages: 800, usedPages: 780, dirtyPages: 200, evictedPages: 0 }, highlight: 'io' },
      { logKey: 'autoLog3', phase: 'error', spids: [{ spid: 110, status: 'suspended', waitType: 'RECOVERY', labelKey: 'autoSpid110Error1' }], sqlos: { schedulers: 4, workers: 1, runnable: 0, suspended: 1 }, buffer: { totalPages: 800, usedPages: 0, dirtyPages: 0, evictedPages: 800 } },
      { logKey: 'autoLog4', phase: 'done', spids: [{ spid: 110, status: 'running', labelKey: 'autoSpid110Running2' }, { spid: 111, status: 'running' }], sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 800, usedPages: 400, dirtyPages: 20, evictedPages: 0 } },
    ],
  },
  {
    id: 'paramsniff',
    icon: '🔍',
    color: 'blue',
    nameKey: 'caseParamSniff',
    descKey: 'caseParamSniffDesc',
    detailsKey: 'caseParamSniffExplain',
    schema: {
      en: `CREATE TABLE Orders (
  OrderID    INT IDENTITY PRIMARY KEY,
  CustomerID INT NOT NULL,
  OrderDate  DATE,
  Amount     DECIMAL(10,2),
  INDEX IX_CustID (CustomerID)
);
-- Customer 1 is huge, customer 7 is tiny`,
      es: `CREATE TABLE Orders (
  OrderID    INT IDENTITY PRIMARY KEY,
  CustomerID INT NOT NULL,
  OrderDate  DATE,
  Amount     DECIMAL(10,2),
  INDEX IX_CustID (CustomerID)
);
-- El cliente 1 es enorme y el 7 es pequeno`,
    },
    query: {
      en: `CREATE OR ALTER PROC GetOrders @CustID INT AS
SELECT OrderID, Amount
FROM Orders
WHERE CustomerID = @CustID;

-- First compile happens for @CustID = 7
-- The same plan is reused for @CustID = 1`,
      es: `CREATE OR ALTER PROC GetOrders @CustID INT AS
SELECT OrderID, Amount
FROM Orders
WHERE CustomerID = @CustID;

-- La primera compilacion ocurre para @CustID = 7
-- El mismo plan se reutiliza luego para @CustID = 1`,
    },
    detectionQuery: {
      en: `SELECT qs.execution_count,
       qs.total_elapsed_time,
       qp.query_plan,
       SUBSTRING(st.text, 1, 150) AS sql_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
WHERE st.text LIKE '%GetOrders%'
ORDER BY qs.total_elapsed_time DESC;`,
      es: `SELECT qs.execution_count,
       qs.total_elapsed_time,
       qp.query_plan,
       SUBSTRING(st.text, 1, 150) AS sql_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
WHERE st.text LIKE '%GetOrders%'
ORDER BY qs.total_elapsed_time DESC;`,
    },
    resolutionKey: 'paramSniffBestPractice',
    steps: [
      { logKey: 'paramLog1', phase: 'optimize', spids: [{ spid: 120, status: 'running', labelKey: 'paramSpid120Running1', planStatus: 'cached' }], sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 100, dirtyPages: 0, evictedPages: 0 }, highlight: 'plan' },
      { logKey: 'paramLog2', phase: 'execute', spids: [{ spid: 121, status: 'suspended', waitType: 'ASYNC_IO_COMP', labelKey: 'paramSpid121Wait1', planStatus: 'cached' }], sqlos: { schedulers: 4, workers: 4, runnable: 1, suspended: 3, waitType: 'ASYNC_IO_COMP', waitMs: 28000 }, buffer: { totalPages: 1000, usedPages: 980, dirtyPages: 0, evictedPages: 200 }, highlight: 'plan' },
      { logKey: 'paramLog3', phase: 'error', spids: [{ spid: 121, status: 'suspended', waitType: 'ASYNC_IO_COMP', labelKey: 'paramSpid121Error1' }], sqlos: { schedulers: 4, workers: 4, runnable: 1, suspended: 3, waitType: 'ASYNC_IO_COMP', waitMs: 28000 }, buffer: { totalPages: 1000, usedPages: 980, dirtyPages: 0, evictedPages: 300 }, highlight: 'io' },
      { logKey: 'paramLog4', phase: 'done', spids: [{ spid: 121, status: 'running', labelKey: 'paramSpid121Running2', planStatus: 'cached' }], sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 500, dirtyPages: 0, evictedPages: 0 } },
    ],
  },
  {
    id: 'virt',
    icon: '☁️',
    color: 'violet',
    nameKey: 'caseVirtualization',
    descKey: 'caseVirtualizationDesc',
    detailsKey: 'caseVirtualizationExplain',
    schema: {
      en: `-- SQL Server VM on an overcommitted host
-- Host:  8 physical CPUs
-- VMs:   5 x 8 vCPUs = 40 vCPUs
-- Ratio: 5:1 overcommit
-- SQL RAM: 64 GB, no memory reservation`,
      es: `-- VM de SQL Server sobre un host sobreasignado
-- Host:  8 CPUs fisicas
-- VMs:   5 x 8 vCPUs = 40 vCPUs
-- Ratio: 5:1 de sobreasignacion
-- SQL RAM: 64 GB, sin reserva de memoria`,
    },
    query: {
      en: `SELECT TOP 100 *
FROM LargeTable
ORDER BY CreatedAt DESC;

-- The query looks normal in SQL
-- but the hypervisor is stealing CPU time`,
      es: `SELECT TOP 100 *
FROM LargeTable
ORDER BY CreatedAt DESC;

-- La consulta parece normal dentro de SQL
-- pero el hipervisor esta reteniendo CPU`,
    },
    detectionQuery: {
      en: `-- SQL side
SELECT scheduler_id,
       cpu_id,
       current_tasks_count,
       runnable_tasks_count,
       pending_disk_io_count
FROM sys.dm_os_schedulers
WHERE status = 'VISIBLE ONLINE';

-- Hypervisor side:
-- VMware esxtop -> CPURD% > 5%
-- Hyper-V -> Hyper-V Hypervisor VP\\CPU Wait Time`,
      es: `-- Lado SQL
SELECT scheduler_id,
       cpu_id,
       current_tasks_count,
       runnable_tasks_count,
       pending_disk_io_count
FROM sys.dm_os_schedulers
WHERE status = 'VISIBLE ONLINE';

-- Lado hipervisor:
-- VMware esxtop -> CPURD% > 5%
-- Hyper-V -> Hyper-V Hypervisor VP\\CPU Wait Time`,
    },
    resolutionKey: 'virtBestPractice',
    steps: [
      { logKey: 'virtLog1', phase: 'execute', spids: [{ spid: 130, status: 'running', labelKey: 'virtSpid130Running1' }], sqlos: { schedulers: 8, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 500, dirtyPages: 10, evictedPages: 0 } },
      { logKey: 'virtLog2', phase: 'wait', spids: [{ spid: 130, status: 'virt', waitType: 'CPU READY', labelKey: 'virtSpid130Wait1' }, { spid: 131, status: 'virt', waitType: 'CPU READY', labelKey: 'virtSpid131Wait1' }], sqlos: { schedulers: 8, workers: 8, runnable: 8, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 500, dirtyPages: 10, evictedPages: 0 }, highlight: 'wait' },
      { logKey: 'virtLog3', phase: 'wait', spids: [{ spid: 130, status: 'suspended', waitType: 'PAGEIOLATCH_SH', labelKey: 'virtSpid130Wait2' }, { spid: 131, status: 'suspended', waitType: 'WRITELOG', labelKey: 'virtSpid131Wait2' }], sqlos: { schedulers: 8, workers: 8, runnable: 0, suspended: 8, waitType: 'PAGEIOLATCH_SH', waitMs: 450 }, buffer: { totalPages: 1000, usedPages: 500, dirtyPages: 10, evictedPages: 0 }, highlight: 'io' },
      { logKey: 'virtLog4', phase: 'error', spids: [{ spid: 132, status: 'evicted', waitType: 'RESOURCE_SEMAPHORE', labelKey: 'virtSpid132Error1' }], sqlos: { schedulers: 8, workers: 8, runnable: 0, suspended: 8, waitType: 'RESOURCE_SEMAPHORE', waitMs: 900 }, buffer: { totalPages: 1000, usedPages: 500, dirtyPages: 10, evictedPages: 300 }, highlight: 'plan' },
      { logKey: 'virtLog5', phase: 'done', spids: [{ spid: 130, status: 'running', labelKey: 'virtSpid130Running2' }, { spid: 131, status: 'running', labelKey: 'virtSpid131Running2' }], sqlos: { schedulers: 8, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 700, dirtyPages: 5, evictedPages: 0 } },
    ],
  },
  {
    id: 'balloon',
    icon: '🎈',
    color: 'blue',
    nameKey: 'caseVirtualization',
    descKey: 'caseVirtualizationDesc',
    detailsKey: 'caseVirtualizationExplain',
    title: {
      en: 'Virtualization Balloon Memory',
      es: 'Balloon Memory en virtualizaci\u00f3n',
    },
    description: {
      en: 'The host starts reclaiming RAM and the balloon driver inflates inside the guest. SQL Server sees external pressure, PLE falls, physical reads rise and the real culprit is outside the engine.',
      es: 'El host empieza a reclamar RAM y el driver de balloon infla memoria dentro de la VM. SQL Server ve presi\u00f3n externa, cae el PLE, suben las lecturas f\u00edsicas y el culpable real est\u00e1 fuera del motor.',
    },
    details: {
      en: 'This is not classic bad T-SQL. Useful guest memory shrinks first, Windows pages harder, and only then SQL starts showing PAGEIOLATCH, plan churn and memory grant pressure. If you look only at DMVs, the story starts too late.',
      es: 'Esto no es el t\u00edpico problema de T-SQL. Primero se encoge la memoria \u00fatil del guest, luego Windows pagina m\u00e1s agresivamente y solo despu\u00e9s SQL empieza a mostrar PAGEIOLATCH, churn de planes y presi\u00f3n de memory grants. Si miras solo las DMVs, la historia empieza demasiado tarde.',
    },
    resolution: {
      en: 'Reserve memory for the SQL VM, disable ballooning for this workload, leave headroom for the OS and keep max server memory below the guest limit so Windows does not have to page under host reclaim.',
      es: 'Reserva memoria para la VM de SQL, deshabilita el ballooning en esta carga, deja margen al SO y ajusta max server memory por debajo del l\u00edmite del guest para que Windows no tenga que paginar cuando el host reclame RAM.',
    },
    detectionMode: 'hypervisor',
    detectionSummary: {
      en: 'You need both guest evidence and hypervisor counters. SQL alone only shows the secondary effects.',
      es: 'Necesitas evidencia del guest y contadores del hipervisor. SQL por s\u00ed solo ense\u00f1a los efectos secundarios.',
    },
    badges: ['BALLOON', 'PAGEFILE', 'EXTERNAL PRESSURE', 'HYPERVISOR'],
    schema: {
      en: `-- SQL Server VM
-- Guest RAM: 64 GB
-- SQL max server memory: 60 GB
-- Host overcommit starts reclaiming memory
-- Balloon driver grows inside the guest`,
      es: `-- VM de SQL Server
-- RAM del guest: 64 GB
-- SQL max server memory: 60 GB
-- El host entra en sobreasignaci\u00f3n y empieza a reclamar memoria
-- El balloon driver crece dentro del guest`,
    },
    query: {
      en: `SELECT SUM(Amount)
FROM dbo.LargeFactTable
WHERE BusinessDate >= DATEADD(day, -7, SYSUTCDATETIME());

-- The query itself is ordinary
-- but the guest is losing resident memory under the covers`,
      es: `SELECT SUM(Amount)
FROM dbo.LargeFactTable
WHERE BusinessDate >= DATEADD(day, -7, SYSUTCDATETIME());

-- La consulta es normal
-- pero el guest est\u00e1 perdiendo memoria residente por debajo`,
    },
    detectionQuery: {
      en: `-- Guest side: external pressure and paging symptoms
SELECT *
FROM sys.dm_os_ring_buffers
WHERE ring_buffer_type = 'RING_BUFFER_RESOURCE_MONITOR';

SELECT counter_name, cntr_value
FROM sys.dm_os_performance_counters
WHERE object_name LIKE '%Buffer Manager%'
  AND counter_name IN ('Page life expectancy', 'Free list stalls/sec');

-- Hypervisor side:
-- VMware: MEMCTL / MCTLSZ
-- Hyper-V: Dynamic Memory Balancer, Pressure, Guest Visible Physical Memory`,
      es: `-- Lado guest: presi\u00f3n externa y s\u00edntomas de paginaci\u00f3n
SELECT *
FROM sys.dm_os_ring_buffers
WHERE ring_buffer_type = 'RING_BUFFER_RESOURCE_MONITOR';

SELECT counter_name, cntr_value
FROM sys.dm_os_performance_counters
WHERE object_name LIKE '%Buffer Manager%'
  AND counter_name IN ('Page life expectancy', 'Free list stalls/sec');

-- Lado hipervisor:
-- VMware: MEMCTL / MCTLSZ
-- Hyper-V: Dynamic Memory Balancer, Pressure, Guest Visible Physical Memory`,
    },
    resolutionKey: 'virtBestPractice',
    steps: [
      {
        logKey: 'queryEvent',
        log: {
          en: 'The workload starts normally. Buffer pool residency is healthy and the query enters the engine without obvious waits.',
          es: 'La carga empieza normal. La residencia del buffer pool es sana y la consulta entra al motor sin esperas evidentes.',
        },
        phase: 'execute',
        spids: [
          { spid: 150, status: 'running', label: { en: 'Reporting query starts', es: 'Arranca la consulta de reporting' } },
        ],
        sqlos: { schedulers: 8, workers: 4, runnable: 4, suspended: 0 },
        buffer: { totalPages: 2400, usedPages: 1800, dirtyPages: 40, evictedPages: 0 },
      },
      {
        logKey: 'queryEvent',
        log: {
          en: 'Host memory reclaim begins. The balloon driver steals guest pages, so SQL workers look runnable but the VM is losing usable RAM.',
          es: 'Empieza la reclamaci\u00f3n de memoria del host. El balloon driver roba p\u00e1ginas al guest, as\u00ed que los workers parecen sanos pero la VM pierde RAM utilizable.',
        },
        phase: 'wait',
        spids: [
          { spid: 150, status: 'virt', waitType: 'HOST_MEMORY_RECLAIM', label: { en: 'Guest memory being reclaimed', es: 'Se est\u00e1 reclamando memoria del guest' } },
          { spid: 151, status: 'virt', waitType: 'HOST_MEMORY_RECLAIM', label: { en: 'Second worker under ballooning', es: 'Segundo worker bajo ballooning' } },
        ],
        sqlos: { schedulers: 8, workers: 8, runnable: 7, suspended: 1, waitType: 'HOST_MEMORY_RECLAIM', waitMs: 1200 },
        buffer: { totalPages: 2400, usedPages: 1780, dirtyPages: 42, evictedPages: 120 },
        highlight: 'wait',
      },
      {
        logKey: 'queryEvent',
        log: {
          en: 'Windows starts paging. SQL now sees PAGEIOLATCH and memory grant pressure because pages that used to be resident are no longer really available.',
          es: 'Windows empieza a paginar. SQL ahora ve PAGEIOLATCH y presi\u00f3n de memory grants porque p\u00e1ginas que antes estaban residentes ya no est\u00e1n realmente disponibles.',
        },
        phase: 'wait',
        spids: [
          { spid: 150, status: 'suspended', waitType: 'PAGEIOLATCH_SH', label: { en: 'Reading pages back from disk', es: 'Releyendo p\u00e1ginas desde disco' } },
          { spid: 151, status: 'evicted', waitType: 'RESOURCE_SEMAPHORE', label: { en: 'Grant pressure under paging', es: 'Presi\u00f3n de grants bajo paginaci\u00f3n' }, planStatus: 'evicted' },
        ],
        sqlos: { schedulers: 8, workers: 10, runnable: 2, suspended: 8, waitType: 'PAGEIOLATCH_SH', waitMs: 4800 },
        buffer: { totalPages: 2400, usedPages: 1600, dirtyPages: 60, evictedPages: 520 },
        highlight: 'io',
      },
      {
        logKey: 'queryEvent',
        log: {
          en: 'The incident now looks like an internal SQL memory problem, but the original trigger was the hypervisor balloon, not the query text.',
          es: 'El incidente ya parece un problema interno de memoria en SQL, pero el disparador original fue el balloon del hipervisor, no el texto de la consulta.',
        },
        phase: 'error',
        spids: [
          { spid: 150, status: 'evicted', waitType: 'RESOURCE_SEMAPHORE', label: { en: 'Plan churn and grant waits', es: 'Churn de planes y espera por grants' }, planStatus: 'evicted' },
          { spid: 151, status: 'suspended', waitType: 'PAGEIOLATCH_SH', label: { en: 'Physical reads keep climbing', es: 'Las lecturas f\u00edsicas siguen subiendo' } },
        ],
        sqlos: { schedulers: 8, workers: 10, runnable: 1, suspended: 9, waitType: 'RESOURCE_SEMAPHORE', waitMs: 6200 },
        buffer: { totalPages: 2400, usedPages: 1420, dirtyPages: 70, evictedPages: 700 },
        highlight: 'plan',
      },
      {
        logKey: 'queryEvent',
        log: {
          en: 'After reserving VM memory and giving Windows room to breathe, the same workload returns to a predictable path.',
          es: 'Tras reservar memoria para la VM y dejar margen a Windows, la misma carga vuelve a un camino predecible.',
        },
        phase: 'done',
        spids: [
          { spid: 150, status: 'running', label: { en: 'Stable after memory reservation', es: 'Estable tras reservar memoria' } },
          { spid: 151, status: 'running', label: { en: 'No more balloon reclaim', es: 'Sin m\u00e1s reclamaci\u00f3n por balloon' } },
        ],
        sqlos: { schedulers: 8, workers: 4, runnable: 4, suspended: 0 },
        buffer: { totalPages: 2400, usedPages: 1820, dirtyPages: 30, evictedPages: 20 },
      },
    ],
  },
  {
    id: 'attention',
    icon: '🎯',
    color: 'orange',
    nameKey: 'queryEvent',
    descKey: 'queryEvent',
    detailsKey: 'queryEvent',
    title: {
      en: 'Client Timeout / Attention Event',
      es: 'Timeout de cliente / evento Attention',
    },
    description: {
      en: 'The query disappears before the DBA arrives. DMVs are empty because the client already cancelled the request. Extended Events keeps the only durable trail.',
      es: 'La consulta desaparece antes de que llegue el DBA. Las DMVs est\u00e1n vac\u00edas porque el cliente ya cancel\u00f3 la petici\u00f3n. Extended Events deja el \u00fanico rastro duradero.',
    },
    details: {
      en: 'Intermittent timeouts are classic ghosts. By the time someone opens sys.dm_exec_requests, the SPID is gone. You need sqlserver.attention plus completion events and client actions to prove who cancelled what and when.',
      es: 'Los timeouts intermitentes son fantasmas cl\u00e1sicos. Cuando alguien abre sys.dm_exec_requests, el SPID ya no existe. Necesitas sqlserver.attention junto con eventos de finalizaci\u00f3n y acciones de cliente para demostrar qui\u00e9n cancel\u00f3 qu\u00e9 y cu\u00e1ndo.',
    },
    resolution: {
      en: 'Capture the timeout with XE, correlate it to the caller, then decide whether the fix belongs in indexing, parameter handling, app timeout settings or transaction design.',
      es: 'Captura el timeout con XE, correlaci\u00f3nalo con el llamador y despu\u00e9s decide si la correcci\u00f3n est\u00e1 en el \u00edndice, en el manejo de par\u00e1metros, en el timeout de la app o en el dise\u00f1o de la transacci\u00f3n.',
    },
    detectionMode: 'xe',
    detectionSummary: {
      en: 'DMVs only show you the live request. XE keeps the cancelled request after it is gone.',
      es: 'Las DMVs solo ense\u00f1an la petici\u00f3n viva. XE conserva la petici\u00f3n cancelada cuando ya no existe.',
    },
    xeWhy: {
      en: 'Use Extended Events when the symptom is over before you can open a DMV. Attention, deadlocks and intermittent app timeouts live here.',
      es: 'Usa Extended Events cuando el s\u00edntoma ya ha terminado antes de abrir una DMV. Attention, deadlocks y timeouts intermitentes de aplicaci\u00f3n viven aqu\u00ed.',
    },
    xeScript: {
      en: `CREATE EVENT SESSION [TrackAttentionTimeouts] ON SERVER
ADD EVENT sqlserver.attention(
    ACTION(sqlserver.client_app_name, sqlserver.database_name, sqlserver.session_id, sqlserver.sql_text)),
ADD EVENT sqlserver.rpc_completed(
    ACTION(sqlserver.client_app_name, sqlserver.database_name, sqlserver.session_id, sqlserver.sql_text)
    WHERE (duration > 5000000)),
ADD EVENT sqlserver.sql_batch_completed(
    ACTION(sqlserver.client_app_name, sqlserver.database_name, sqlserver.session_id, sqlserver.sql_text)
    WHERE (duration > 5000000))
ADD TARGET package0.event_file(SET filename = N'E:\\XE\\TrackAttentionTimeouts.xel');
GO
ALTER EVENT SESSION [TrackAttentionTimeouts] ON SERVER STATE = START;`,
      es: `CREATE EVENT SESSION [TrackAttentionTimeouts] ON SERVER
ADD EVENT sqlserver.attention(
    ACTION(sqlserver.client_app_name, sqlserver.database_name, sqlserver.session_id, sqlserver.sql_text)),
ADD EVENT sqlserver.rpc_completed(
    ACTION(sqlserver.client_app_name, sqlserver.database_name, sqlserver.session_id, sqlserver.sql_text)
    WHERE (duration > 5000000)),
ADD EVENT sqlserver.sql_batch_completed(
    ACTION(sqlserver.client_app_name, sqlserver.database_name, sqlserver.session_id, sqlserver.sql_text)
    WHERE (duration > 5000000))
ADD TARGET package0.event_file(SET filename = N'E:\\XE\\TrackAttentionTimeouts.xel');
GO
ALTER EVENT SESSION [TrackAttentionTimeouts] ON SERVER STATE = START;`,
    },
    badges: ['XE ONLY', 'ATTENTION', 'TIMEOUT', 'CLIENT CANCEL'],
    schema: {
      en: `CREATE OR ALTER PROC dbo.GetCustomerLedger
  @CustomerId INT
AS
BEGIN
  SELECT TOP (5000) *
  FROM dbo.CustomerLedger
  WHERE CustomerId = @CustomerId
  ORDER BY LedgerDate DESC;
END;`,
      es: `CREATE OR ALTER PROC dbo.GetCustomerLedger
  @CustomerId INT
AS
BEGIN
  SELECT TOP (5000) *
  FROM dbo.CustomerLedger
  WHERE CustomerId = @CustomerId
  ORDER BY LedgerDate DESC;
END;`,
    },
    query: {
      en: `-- Application timeout = 30 seconds
EXEC dbo.GetCustomerLedger @CustomerId = 42;

-- If the app cancels first, the SPID disappears
-- and the DMV evidence is already gone`,
      es: `-- Timeout de la aplicaci\u00f3n = 30 segundos
EXEC dbo.GetCustomerLedger @CustomerId = 42;

-- Si la app cancela antes, el SPID desaparece
-- y la evidencia de DMVs ya no existe`,
    },
    detectionQuery: {
      en: `SELECT
    object_name,
    event_data = CONVERT(XML, event_data)
FROM sys.fn_xe_file_target_read_file(
    'E:\\XE\\TrackAttentionTimeouts*.xel',
    NULL, NULL, NULL)
ORDER BY event_data.value('(event/@timestamp)[1]', 'datetime2') DESC;`,
      es: `SELECT
    object_name,
    event_data = CONVERT(XML, event_data)
FROM sys.fn_xe_file_target_read_file(
    'E:\\XE\\TrackAttentionTimeouts*.xel',
    NULL, NULL, NULL)
ORDER BY event_data.value('(event/@timestamp)[1]', 'datetime2') DESC;`,
    },
    resolutionKey: 'queryEvent',
    steps: [
      {
        logKey: 'queryEvent',
        log: {
          en: 'The request starts and looks ordinary while the application waits for a response.',
          es: 'La petici\u00f3n arranca y parece normal mientras la aplicaci\u00f3n espera respuesta.',
        },
        phase: 'execute',
        spids: [{ spid: 160, status: 'running', label: { en: 'Ledger proc running', es: 'Proc de ledger en ejecuci\u00f3n' } }],
        sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 },
        buffer: { totalPages: 1800, usedPages: 920, dirtyPages: 8, evictedPages: 0 },
      },
      {
        logKey: 'queryEvent',
        log: {
          en: 'The client timeout fires first and sends an ATTENTION to SQL Server.',
          es: 'El timeout del cliente salta primero y env\u00eda un ATTENTION a SQL Server.',
        },
        phase: 'wait',
        spids: [{ spid: 160, status: 'suspended', waitType: 'ATTENTION', label: { en: 'Client cancelled request', es: 'El cliente cancel\u00f3 la petici\u00f3n' } }],
        sqlos: { schedulers: 4, workers: 2, runnable: 1, suspended: 1, waitType: 'ATTENTION', waitMs: 30000 },
        buffer: { totalPages: 1800, usedPages: 940, dirtyPages: 8, evictedPages: 0 },
        highlight: 'query',
      },
      {
        logKey: 'queryEvent',
        log: {
          en: 'The SPID vanishes from live DMVs. Operations only sees a complaint and no active blocker to inspect.',
          es: 'El SPID desaparece de las DMVs en vivo. Operaciones solo ve la queja y ning\u00fan bloqueador activo que inspeccionar.',
        },
        phase: 'error',
        spids: [{ spid: 160, status: 'idle', label: { en: 'Request already gone', es: 'La petici\u00f3n ya desapareci\u00f3' } }],
        sqlos: { schedulers: 4, workers: 1, runnable: 1, suspended: 0 },
        buffer: { totalPages: 1800, usedPages: 940, dirtyPages: 8, evictedPages: 0 },
        highlight: 'query',
      },
      {
        logKey: 'queryEvent',
        log: {
          en: 'Reading the XE file reveals the attention event, the client app name and the SQL text that was cancelled.',
          es: 'Al leer el fichero XE aparecen el evento attention, el nombre de la aplicaci\u00f3n cliente y el SQL que fue cancelado.',
        },
        phase: 'done',
        spids: [{ spid: 161, status: 'running', label: { en: 'DBA reading XE evidence', es: 'DBA leyendo evidencia XE' } }],
        sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 },
        buffer: { totalPages: 1800, usedPages: 950, dirtyPages: 4, evictedPages: 0 },
      },
      {
        logKey: 'queryEvent',
        log: {
          en: 'After correlating the caller, you can fix the real issue instead of guessing at a query that no longer exists.',
          es: 'Tras correlacionar el llamador, ya puedes corregir el problema real en vez de adivinar sobre una consulta que ya no existe.',
        },
        phase: 'done',
        spids: [{ spid: 161, status: 'running', label: { en: 'Timeout now reproducible and understood', es: 'El timeout ya es reproducible y entendible' } }],
        sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 },
        buffer: { totalPages: 1800, usedPages: 920, dirtyPages: 2, evictedPages: 0 },
      },
    ],
  },
  {
    id: 'missingindex',
    icon: '📋',
    color: 'emerald',
    nameKey: 'caseMissingIndex',
    descKey: 'caseMissingIndexDesc',
    detailsKey: 'caseMissingIndexExplain',
    schema: {
      en: `CREATE TABLE Sales (
  SaleID     BIGINT IDENTITY PRIMARY KEY,
  RegionID   TINYINT NOT NULL,
  SaleDate   DATE NOT NULL,
  CustomerID INT,
  Amount     DECIMAL(12,2)
);
-- 10 million rows, no useful index for the report`,
      es: `CREATE TABLE Sales (
  SaleID     BIGINT IDENTITY PRIMARY KEY,
  RegionID   TINYINT NOT NULL,
  SaleDate   DATE NOT NULL,
  CustomerID INT,
  Amount     DECIMAL(12,2)
);
-- 10 millones de filas y sin un indice util para el informe`,
    },
    query: {
      en: `SELECT RegionID, SUM(Amount) AS Revenue
FROM Sales
WHERE RegionID = 5
  AND SaleDate >= '2024-01-01'
GROUP BY RegionID;

-- Current plan: clustered index scan`,
      es: `SELECT RegionID, SUM(Amount) AS Revenue
FROM Sales
WHERE RegionID = 5
  AND SaleDate >= '2024-01-01'
GROUP BY RegionID;

-- Plan actual: clustered index scan`,
    },
    detectionQuery: {
      en: `SELECT TOP 10
  ROUND(s.avg_total_user_cost * s.avg_user_impact
    * (s.user_seeks + s.user_scans), 0) AS score,
  d.statement AS table_name,
  d.equality_columns,
  d.inequality_columns,
  d.included_columns
FROM sys.dm_db_missing_index_details d
JOIN sys.dm_db_missing_index_groups g
  ON d.index_handle = g.index_handle
JOIN sys.dm_db_missing_index_group_stats s
  ON g.index_group_handle = s.group_handle
ORDER BY score DESC;`,
      es: `SELECT TOP 10
  ROUND(s.avg_total_user_cost * s.avg_user_impact
    * (s.user_seeks + s.user_scans), 0) AS score,
  d.statement AS table_name,
  d.equality_columns,
  d.inequality_columns,
  d.included_columns
FROM sys.dm_db_missing_index_details d
JOIN sys.dm_db_missing_index_groups g
  ON d.index_handle = g.index_handle
JOIN sys.dm_db_missing_index_group_stats s
  ON g.index_group_handle = s.group_handle
ORDER BY score DESC;`,
    },
    resolutionKey: 'missingIndexBestPractice',
    steps: [
      { logKey: 'missLog1', phase: 'execute', spids: [{ spid: 140, status: 'suspended', waitType: 'PAGEIOLATCH_SH', labelKey: 'missSpid140Wait1' }], sqlos: { schedulers: 4, workers: 2, runnable: 0, suspended: 2, waitType: 'PAGEIOLATCH_SH', waitMs: 28000 }, buffer: { totalPages: 1200, usedPages: 1180, dirtyPages: 0, evictedPages: 800 }, highlight: 'io' },
      { logKey: 'missLog2', phase: 'wait', spids: [{ spid: 140, status: 'suspended', waitType: 'PAGEIOLATCH_SH', labelKey: 'missSpid140Wait2' }], sqlos: { schedulers: 4, workers: 2, runnable: 0, suspended: 2, waitType: 'PAGEIOLATCH_SH', waitMs: 28000 }, buffer: { totalPages: 1200, usedPages: 1200, dirtyPages: 0, evictedPages: 1100 }, highlight: 'io' },
      { logKey: 'missLog3', phase: 'optimize', spids: [{ spid: 140, status: 'running', labelKey: 'missSpid140Optimize' }], sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 1200, usedPages: 600, dirtyPages: 0, evictedPages: 0 } },
      { logKey: 'missLog4', phase: 'done', spids: [{ spid: 140, status: 'running', labelKey: 'missSpid140Running2' }], sqlos: { schedulers: 4, workers: 1, runnable: 1, suspended: 0 }, buffer: { totalPages: 1200, usedPages: 120, dirtyPages: 0, evictedPages: 0 } },
    ],
  },
];

export const CASE_RESOLUTION_SCRIPTS: Record<string, LocalizedCaseText> = {
  blocker: {
    en: `-- Find the full blocker chain
SELECT r.session_id,
       r.blocking_session_id,
       r.wait_type,
       r.wait_time / 1000 AS wait_sec,
       t.text AS sql_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id > 0;

-- Kill the root blocker only if required
KILL <blocking_session_id>;`,
    es: `-- Localiza la cadena completa de bloqueo
SELECT r.session_id,
       r.blocking_session_id,
       r.wait_type,
       r.wait_time / 1000 AS wait_sec,
       t.text AS sql_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id > 0;

-- Mata al bloqueador raiz solo si es necesario
KILL <blocking_session_id>;`,
  },
  latch: {
    en: `-- Reduce hot-page pressure
-- Option 1: redesign the clustered key
-- Option 2: partition or spread the write target

SELECT *
FROM sys.dm_os_wait_stats
WHERE wait_type LIKE 'PAGELATCH%';`,
    es: `-- Reduce la presion sobre la ultima pagina
-- Opcion 1: redisenar la clave clustered
-- Opcion 2: particionar o repartir el punto de escritura

SELECT *
FROM sys.dm_os_wait_stats
WHERE wait_type LIKE 'PAGELATCH%';`,
  },
  plan: {
    en: `-- Force a stable plan via Query Store
EXEC sp_query_store_force_plan
  @query_id = 42,
  @plan_id = 7;

-- Or hint the query
SELECT ... OPTION(OPTIMIZE FOR UNKNOWN);`,
    es: `-- Fuerza un plan estable con Query Store
EXEC sp_query_store_force_plan
  @query_id = 42,
  @plan_id = 7;

-- O aplica una pista
SELECT ... OPTION(OPTIMIZE FOR UNKNOWN);`,
  },
  tempdb: {
    en: `-- Add equally sized TempDB data files
ALTER DATABASE tempdb ADD FILE
  (NAME = 'tempdev2',
   FILENAME = 'T:\\tempdb2.ndf',
   SIZE = 4096MB,
   FILEGROWTH = 512MB);

-- Repeat until the layout is balanced`,
    es: `-- Agrega archivos de datos de TempDB del mismo tamano
ALTER DATABASE tempdb ADD FILE
  (NAME = 'tempdev2',
   FILENAME = 'T:\\tempdb2.ndf',
   SIZE = 4096MB,
   FILEGROWTH = 512MB);

-- Repite hasta equilibrar el reparto`,
  },
  ldf: {
    en: `-- Move the LDF to a dedicated volume
ALTER DATABASE SalesDB MODIFY FILE
  (NAME = 'SalesDB_Log',
   FILENAME = 'L:\\Logs\\SalesDB_log.ldf');

-- Restart SQL Server to apply the change`,
    es: `-- Mueve el LDF a un volumen dedicado
ALTER DATABASE SalesDB MODIFY FILE
  (NAME = 'SalesDB_Log',
   FILENAME = 'L:\\Logs\\SalesDB_log.ldf');

-- Reinicia SQL Server para aplicar el cambio`,
  },
  cxpacket: {
    en: `-- Instance-level settings
EXEC sp_configure 'max degree of parallelism', 4;
EXEC sp_configure 'cost threshold for parallelism', 50;
RECONFIGURE;

-- Per query
SELECT ... OPTION (MAXDOP 2);`,
    es: `-- Ajustes a nivel de instancia
EXEC sp_configure 'max degree of parallelism', 4;
EXEC sp_configure 'cost threshold for parallelism', 50;
RECONFIGURE;

-- Por consulta
SELECT ... OPTION (MAXDOP 2);`,
  },
  autogrowth: {
    en: `-- Fix file size and growth policy
ALTER DATABASE SalesDB MODIFY FILE
  (NAME = 'SalesDB_Log',
   SIZE = 10240MB,
   FILEGROWTH = 1024MB);

-- Review VLF count
DBCC LOGINFO;`,
    es: `-- Corrige el tamano y la politica de crecimiento
ALTER DATABASE SalesDB MODIFY FILE
  (NAME = 'SalesDB_Log',
   SIZE = 10240MB,
   FILEGROWTH = 1024MB);

-- Revisa el numero de VLFs
DBCC LOGINFO;`,
  },
  paramsniff: {
    en: `-- Option 1: optimize for unknown
CREATE OR ALTER PROC GetOrders @CustID INT AS
SELECT OrderID, Amount
FROM Orders
WHERE CustomerID = @CustID
OPTION (OPTIMIZE FOR (@CustID UNKNOWN));

-- Option 2: Query Store plan forcing`,
    es: `-- Opcion 1: optimize for unknown
CREATE OR ALTER PROC GetOrders @CustID INT AS
SELECT OrderID, Amount
FROM Orders
WHERE CustomerID = @CustID
OPTION (OPTIMIZE FOR (@CustID UNKNOWN));

-- Opcion 2: forzar plan con Query Store`,
  },
  virt: {
    en: `-- Check scheduler pressure
SELECT scheduler_id,
       runnable_tasks_count,
       pending_disk_io_count
FROM sys.dm_os_schedulers
WHERE status = 'VISIBLE ONLINE';

-- Then verify the hypervisor counters`,
    es: `-- Revisa la presion de scheduler
SELECT scheduler_id,
       runnable_tasks_count,
       pending_disk_io_count
FROM sys.dm_os_schedulers
WHERE status = 'VISIBLE ONLINE';

-- Despues valida los contadores del hipervisor`,
  },
  missingindex: {
    en: `-- Create the suggested covering index
CREATE NONCLUSTERED INDEX IX_Sales_Region_Date
  ON Sales (RegionID, SaleDate)
  INCLUDE (CustomerID, Amount);

-- Validate impact before creating it`,
    es: `-- Crea el indice cubriente sugerido
CREATE NONCLUSTERED INDEX IX_Sales_Region_Date
  ON Sales (RegionID, SaleDate)
  INCLUDE (CustomerID, Amount);

-- Valida el impacto antes de crearlo`,
  },
};

export const XEVENT_LABS: XEventLab[] = [
  {
    id: 'attention-timeouts',
    title: {
      en: 'Client Timeouts',
      es: 'Timeouts de cliente',
    },
    summary: {
      en: 'Intermittent cancellations vanish from DMVs. Capture sqlserver.attention plus completed batches to prove which caller gave up first.',
      es: 'Las cancelaciones intermitentes desaparecen de las DMVs. Captura sqlserver.attention junto con batches completados para demostrar qu\u00e9 llamador se rindi\u00f3 primero.',
    },
    why: {
      en: 'Use this when the complaint says “it timed out” but no long-running request is still alive when you investigate.',
      es: 'Usa esto cuando la queja dice “ha hecho timeout” pero ya no queda ninguna petici\u00f3n larga viva cuando investigas.',
    },
    sessionScript: {
      en: `CREATE EVENT SESSION [XE_AttentionLab] ON SERVER
ADD EVENT sqlserver.attention(
    ACTION(sqlserver.client_app_name, sqlserver.database_name, sqlserver.session_id, sqlserver.sql_text)),
ADD EVENT sqlserver.rpc_completed(
    ACTION(sqlserver.client_app_name, sqlserver.database_name, sqlserver.session_id, sqlserver.sql_text)
    WHERE (duration > 5000000))
ADD TARGET package0.event_file(SET filename = N'E:\\XE\\XE_AttentionLab.xel');
GO
ALTER EVENT SESSION [XE_AttentionLab] ON SERVER STATE = START;`,
      es: `CREATE EVENT SESSION [XE_AttentionLab] ON SERVER
ADD EVENT sqlserver.attention(
    ACTION(sqlserver.client_app_name, sqlserver.database_name, sqlserver.session_id, sqlserver.sql_text)),
ADD EVENT sqlserver.rpc_completed(
    ACTION(sqlserver.client_app_name, sqlserver.database_name, sqlserver.session_id, sqlserver.sql_text)
    WHERE (duration > 5000000))
ADD TARGET package0.event_file(SET filename = N'E:\\XE\\XE_AttentionLab.xel');
GO
ALTER EVENT SESSION [XE_AttentionLab] ON SERVER STATE = START;`,
    },
    readbackScript: {
      en: `SELECT object_name,
       CONVERT(XML, event_data) AS event_data
FROM sys.fn_xe_file_target_read_file(
    'E:\\XE\\XE_AttentionLab*.xel', NULL, NULL, NULL);`,
      es: `SELECT object_name,
       CONVERT(XML, event_data) AS event_data
FROM sys.fn_xe_file_target_read_file(
    'E:\\XE\\XE_AttentionLab*.xel', NULL, NULL, NULL);`,
    },
    badges: ['ATTENTION', 'XE ONLY', 'CLIENT APP'],
  },
  {
    id: 'blocked-process',
    title: {
      en: 'Blocking That Ends Before You Arrive',
      es: 'Bloqueos que terminan antes de que llegues',
    },
    summary: {
      en: 'Long blocking chains often disappear before anyone can inspect sys.dm_exec_requests. blocked_process_report keeps the graph.',
      es: 'Las cadenas largas de bloqueo suelen desaparecer antes de poder inspeccionar sys.dm_exec_requests. blocked_process_report conserva el grafo.',
    },
    why: {
      en: 'Use this when users report freezes but the blocker is gone by the time you connect.',
      es: 'Usa esto cuando los usuarios reportan congelaciones pero el bloqueador ya no existe cuando te conectas.',
    },
    sessionScript: {
      en: `EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'blocked process threshold (s)', 5;
RECONFIGURE;
GO
CREATE EVENT SESSION [XE_BlockedProcessLab] ON SERVER
ADD EVENT sqlserver.blocked_process_report
ADD TARGET package0.event_file(SET filename = N'E:\\XE\\XE_BlockedProcessLab.xel');
GO
ALTER EVENT SESSION [XE_BlockedProcessLab] ON SERVER STATE = START;`,
      es: `EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'blocked process threshold (s)', 5;
RECONFIGURE;
GO
CREATE EVENT SESSION [XE_BlockedProcessLab] ON SERVER
ADD EVENT sqlserver.blocked_process_report
ADD TARGET package0.event_file(SET filename = N'E:\\XE\\XE_BlockedProcessLab.xel');
GO
ALTER EVENT SESSION [XE_BlockedProcessLab] ON SERVER STATE = START;`,
    },
    readbackScript: {
      en: `SELECT CONVERT(XML, event_data) AS blocked_process_report
FROM sys.fn_xe_file_target_read_file(
    'E:\\XE\\XE_BlockedProcessLab*.xel', NULL, NULL, NULL);`,
      es: `SELECT CONVERT(XML, event_data) AS blocked_process_report
FROM sys.fn_xe_file_target_read_file(
    'E:\\XE\\XE_BlockedProcessLab*.xel', NULL, NULL, NULL);`,
    },
    badges: ['BLOCKED PROCESS', 'GRAPH', 'POST-MORTEM'],
  },
  {
    id: 'deadlock-graph',
    title: {
      en: 'Deadlock Graphs',
      es: 'Grafos de deadlock',
    },
    summary: {
      en: 'A deadlock is gone the moment SQL resolves it. The XML graph is what tells you victim, resources and lock order.',
      es: 'Un deadlock desaparece en el mismo instante en que SQL lo resuelve. El grafo XML es lo que te dice v\u00edctima, recursos y orden de locks.',
    },
    why: {
      en: 'Use this when you need resource-level evidence, not just error 1205 in the app log.',
      es: 'Usa esto cuando necesitas evidencia a nivel de recurso, no solo el error 1205 en el log de la app.',
    },
    sessionScript: {
      en: `CREATE EVENT SESSION [XE_DeadlockLab] ON SERVER
ADD EVENT sqlserver.xml_deadlock_report
ADD TARGET package0.event_file(SET filename = N'E:\\XE\\XE_DeadlockLab.xel');
GO
ALTER EVENT SESSION [XE_DeadlockLab] ON SERVER STATE = START;`,
      es: `CREATE EVENT SESSION [XE_DeadlockLab] ON SERVER
ADD EVENT sqlserver.xml_deadlock_report
ADD TARGET package0.event_file(SET filename = N'E:\\XE\\XE_DeadlockLab.xel');
GO
ALTER EVENT SESSION [XE_DeadlockLab] ON SERVER STATE = START;`,
    },
    readbackScript: {
      en: `SELECT CONVERT(XML, event_data) AS deadlock_graph
FROM sys.fn_xe_file_target_read_file(
    'E:\\XE\\XE_DeadlockLab*.xel', NULL, NULL, NULL);`,
      es: `SELECT CONVERT(XML, event_data) AS deadlock_graph
FROM sys.fn_xe_file_target_read_file(
    'E:\\XE\\XE_DeadlockLab*.xel', NULL, NULL, NULL);`,
    },
    badges: ['XML DEADLOCK REPORT', 'XE', 'LOCK ORDER'],
  },
];
