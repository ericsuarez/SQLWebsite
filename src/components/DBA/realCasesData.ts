export interface SpidCard {
  spid: number;
  labelKey?: string;
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
  schema: string;
  query: string;
  detectionQuery: string;
  resolutionKey: string;
  steps: CaseStep[];
}

export const REAL_CASES: RealCase[] = [
  {
    id: 'blocker',
    icon: '🔒',
    color: 'amber',
    nameKey: 'caseBlocker',
    descKey: 'caseBlockerDesc',
    schema: `CREATE TABLE Orders (
  OrderID   INT IDENTITY PRIMARY KEY,
  CustomerID INT NOT NULL,
  Status    CHAR(1) DEFAULT 'N',
  Amount    DECIMAL(10,2)
);`,
    query: `-- SPID 52 (blocker)
BEGIN TRAN
  UPDATE Orders
  SET Status = 'P'
  WHERE OrderID = 1001;
-- Never commits → holds X lock

-- SPID 53 (waiter)
UPDATE Orders SET Amount = 99.99
WHERE OrderID = 1001; -- LCK_M_X wait`,
    detectionQuery: `SELECT r.session_id, r.blocking_session_id,
       r.wait_type, r.wait_time/1000 AS wait_sec,
       t.text AS sql_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id > 0;`,
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
    schema: `CREATE TABLE EventLog (
  LogID   INT IDENTITY(1,1) PRIMARY KEY, -- sequential!
  EventAt DATETIME DEFAULT GETDATE(),
  Source  VARCHAR(50),
  Message VARCHAR(200)
);`,
    query: `-- 8 threads in parallel inserts:
INSERT INTO EventLog (Source, Message)
VALUES ('API', 'User login');
-- All generate sequential LogID values
-- → all target the SAME last B-tree page`,
    detectionQuery: `SELECT wait_type, waiting_tasks_count,
       wait_time_ms / 1000.0 AS wait_sec
FROM sys.dm_os_wait_stats
WHERE wait_type LIKE 'PAGELATCH%'
ORDER BY wait_time_ms DESC;`,
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
    schema: `CREATE TABLE Products (
  ProductID INT PRIMARY KEY,
  Name      VARCHAR(100),
  Price     DECIMAL(10,2),
  Stock     INT
);
-- ~5 million rows`,
    query: `-- Parameterised query compiled once:
SELECT ProductID, Name, Price
FROM Products
WHERE Price BETWEEN @MinPrice AND @MaxPrice;
-- Plan cached in sys.dm_exec_cached_plans`,
    detectionQuery: `SELECT TOP 20 qs.execution_count,
       qs.total_worker_time/qs.execution_count AS avg_cpu,
       SUBSTRING(st.text,1,120) AS sql_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY avg_cpu DESC;`,
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
    schema: `-- Using temp tables in stored procs:
CREATE TABLE #TempResult (
  ID    INT,
  Value VARCHAR(100)
);
-- TempDB must allocate space for #TempResult
-- via GAM/SGAM allocation pages`,
    query: `-- 16 sessions call this stored proc simultaneously:
EXEC usp_GetUserReport @UserID = ?;
-- Inside: SELECT INTO #TempResult ...
-- Each call creates + drops temp table
-- All 16 hit TempDB allocation pages at once`,
    detectionQuery: `-- TempDB file count vs logical CPUs
SELECT COUNT(*) AS tempdb_files
FROM sys.master_files WHERE database_id = 2 AND type = 0;

-- Allocation page contention
SELECT wait_type, waiting_tasks_count, wait_time_ms
FROM sys.dm_os_wait_stats
WHERE wait_type IN ('PAGELATCH_UP','PAGELATCH_EX')
ORDER BY wait_time_ms DESC;`,
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
    schema: `-- SalesDB files on same spindle:
-- D:\Data\SalesDB.mdf   (data - random I/O)
-- D:\Data\SalesDB.ldf   (log  - sequential I/O)
-- ⚠ Both compete for same disk head`,
    query: `-- High-volume write workload:
BEGIN TRAN
  INSERT INTO Sales (CustomerID, Amount, SaleDate)
  VALUES (1001, 249.99, GETDATE());
  -- Log record written to LDF first (WAL)
  -- Data page dirtied in buffer pool
COMMIT;
-- WRITELOG wait = LDF I/O latency`,
    detectionQuery: `SELECT DB_NAME(vfs.database_id) AS db,
       mf.physical_name,
       vfs.io_stall_read_ms,
       vfs.io_stall_write_ms,
       vfs.num_of_writes
FROM sys.dm_io_virtual_file_stats(NULL,NULL) vfs
JOIN sys.master_files mf
  ON vfs.file_id = mf.file_id
 AND vfs.database_id = mf.database_id
ORDER BY vfs.io_stall_write_ms DESC;`,
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
    schema: `CREATE TABLE SalesHistory (
  RowID      BIGINT IDENTITY PRIMARY KEY,
  SaleDate   DATE,
  RegionID   TINYINT,
  Amount     DECIMAL(12,2)
);
-- 50M rows, data skew: Region 1 = 48M rows`,
    query: `-- DOP=8 chosen by optimizer (cost=4200)
SELECT RegionID, SUM(Amount) AS Total
FROM SalesHistory
WHERE SaleDate >= '2020-01-01'
GROUP BY RegionID
ORDER BY Total DESC;
-- One partition (Region 1) has 95% of data`,
    detectionQuery: `SELECT wait_type, waiting_tasks_count,
       wait_time_ms/1000.0 AS wait_sec
FROM sys.dm_os_wait_stats
WHERE wait_type IN ('CXPACKET','CXCONSUMER')
ORDER BY wait_time_ms DESC;`,
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
    schema: `-- SalesDB log file configuration (BAD):
-- FILENAME = 'D:\Logs\SalesDB.ldf'
-- SIZE = 100MB        ← too small
-- FILEGROWTH = 10%   ← % not MB!
-- After 2 years → 9,000 VLFs created`,
    query: `-- Batch INSERT that triggers auto-growth:
INSERT INTO Sales
SELECT * FROM StagingImport; -- 2M rows

-- When LDF fills → auto-growth fires
-- SYNCHRONOUS operation blocks all writers!
-- Recovery scans every VLF on restart`,
    detectionQuery: `-- Count VLFs (aim for < 50)
DBCC LOGINFO;

-- Find auto-growth events
SELECT DatabaseName, Filename,
       (IntegerData*8.0/1024) AS growth_MB,
       StartTime
FROM fn_trace_gettable(CONVERT(varchar(150),
  (SELECT TOP 1 path FROM sys.traces
   WHERE is_default=1)), DEFAULT)
WHERE EventClass IN (92,93)
ORDER BY StartTime DESC;`,
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
    schema: `CREATE TABLE Orders (
  OrderID    INT IDENTITY PRIMARY KEY,
  CustomerID INT NOT NULL,  -- 1=10M rows, 7=3 rows
  OrderDate  DATE,
  Amount     DECIMAL(10,2),
  INDEX IX_CustID (CustomerID)
);`,
    query: `-- Stored proc compiled first for CustomerID=7
CREATE PROC GetOrders @CustID INT AS
  SELECT OrderID, Amount
  FROM Orders
  WHERE CustomerID = @CustID;
-- Plan: INDEX SEEK (good for 3 rows)
-- Reused for @CustID=1 → 10M rows via seeks
-- Should use: TABLE SCAN for large customers`,
    detectionQuery: `SELECT qs.execution_count, qs.total_elapsed_time,
       qp.query_plan,
       SUBSTRING(st.text,1,150) AS sql
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
WHERE st.text LIKE '%GetOrders%'
ORDER BY qs.total_elapsed_time DESC;`,
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
    schema: `-- SQL Server VM on overcommitted ESXi host:
-- Host:  8 physical CPUs
-- VMs:   5 × 8 vCPUs = 40 vCPUs total
-- Ratio: 5:1 overcommit (> 1:1 recommended)
-- SQL RAM: 64 GB, no Memory Reservation set`,
    query: `-- Query runs fine in isolation but randomly
-- slows 10× under host load:
SELECT TOP 100 *
FROM LargeTable
ORDER BY CreatedAt DESC;
-- No SQL waits visible! DBA confused.
-- Root cause: CPU Ready in hypervisor layer`,
    detectionQuery: `-- SQL shows SOS_SCHEDULER_YIELD (indirect sign):
SELECT scheduler_id, cpu_id,
       current_tasks_count,
       runnable_tasks_count,
       pending_disk_io_count
FROM sys.dm_os_schedulers
WHERE status = 'VISIBLE ONLINE';

-- Real metric: VMware esxtop → CPURD% > 5%
-- Hyper-V: "Hyper-V Hypervisor VP\\CPU Wait Time"`,
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
    id: 'missingindex',
    icon: '📋',
    color: 'emerald',
    nameKey: 'caseMissingIndex',
    descKey: 'caseMissingIndexDesc',
    schema: `CREATE TABLE Sales (
  SaleID     BIGINT IDENTITY PRIMARY KEY,
  RegionID   TINYINT NOT NULL,  -- values 1–20
  SaleDate   DATE NOT NULL,
  CustomerID INT,
  Amount     DECIMAL(12,2)
);
-- 10 million rows. No index on RegionID.`,
    query: `-- Report query — runs every hour:
SELECT RegionID, SUM(Amount) AS Revenue
FROM Sales
WHERE RegionID = 5
  AND SaleDate >= '2024-01-01'
GROUP BY RegionID;
-- Execution plan: Clustered Index Scan (10M pages!)
-- Duration: 28 seconds. Users complain.`,
    detectionQuery: `SELECT TOP 10
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
    resolutionKey: 'missingIndexBestPractice',
    steps: [
      { logKey: 'missLog1', phase: 'execute', spids: [{ spid: 140, status: 'suspended', waitType: 'PAGEIOLATCH_SH', labelKey: 'missSpid140Wait1' }], sqlos: { schedulers: 4, workers: 2, runnable: 0, suspended: 2, waitType: 'PAGEIOLATCH_SH', waitMs: 28000 }, buffer: { totalPages: 1200, usedPages: 1180, dirtyPages: 0, evictedPages: 800 }, highlight: 'io' },
      { logKey: 'missLog2', phase: 'wait', spids: [{ spid: 140, status: 'suspended', waitType: 'PAGEIOLATCH_SH', labelKey: 'missSpid140Wait2' }], sqlos: { schedulers: 4, workers: 2, runnable: 0, suspended: 2, waitType: 'PAGEIOLATCH_SH', waitMs: 28000 }, buffer: { totalPages: 1200, usedPages: 1200, dirtyPages: 0, evictedPages: 1100 }, highlight: 'io' },
      { logKey: 'missLog3', phase: 'optimize', spids: [{ spid: 140, status: 'running', labelKey: 'missSpid140Optimize' }], sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 1200, usedPages: 600, dirtyPages: 0, evictedPages: 0 } },
      { logKey: 'missLog4', phase: 'done', spids: [{ spid: 140, status: 'running', labelKey: 'missSpid140Running2' }], sqlos: { schedulers: 4, workers: 1, runnable: 1, suspended: 0 }, buffer: { totalPages: 1200, usedPages: 120, dirtyPages: 0, evictedPages: 0 } },
    ],
  },
];

export const CASE_RESOLUTION_SCRIPTS: Record<string, string> = {
  blocker: `-- Find the full blocker chain
SELECT r.session_id, r.blocking_session_id,
       r.wait_type, r.wait_time/1000 AS wait_sec,
       t.text AS sql_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id > 0;

-- Kill the root blocker
KILL <blocking_session_id>;

-- Long-term: keep transactions SHORT in app code.`,

  latch: `-- Switch PK to sequential GUIDs
ALTER TABLE EventLog
  DROP CONSTRAINT PK_EventLog;
ALTER TABLE EventLog
  ADD CONSTRAINT PK_EventLog
  PRIMARY KEY (LogID DEFAULT NEWSEQUENTIALID());

-- Or partition the table across multiple filegroups`,

  plan: `-- Force stable plan via Query Store
EXEC sp_query_store_force_plan
  @query_id = 42, @plan_id = 7;

-- Or hint the query:
SELECT ... OPTION(OPTIMIZE FOR UNKNOWN);

-- Long-term: increase max server memory`,

  tempdb: `-- Add TempDB data files equally sized
ALTER DATABASE tempdb ADD FILE
  (NAME='tempdev2',
   FILENAME='T:\tempdb2.ndf',
   SIZE=4096MB, FILEGROWTH=512MB);
-- Repeat: 1 file per logical CPU (max 8)
-- All files MUST be the same size`,

  ldf: `-- Move LDF to dedicated volume (offline)
ALTER DATABASE SalesDB MODIFY FILE
  (NAME = 'SalesDB_Log',
   FILENAME = 'L:\Logs\SalesDB_log.ldf');
-- Restart SQL Server to apply
-- Verify: SELECT physical_name FROM sys.master_files`,

  cxpacket: `-- Set instance MAXDOP
EXEC sp_configure 'max degree of parallelism', 4;
EXEC sp_configure 'cost threshold for parallelism', 50;
RECONFIGURE;

-- Per query:
SELECT ... OPTION(MAXDOP 2);

-- Or set via ALTER DATABASE SCOPED CONFIGURATION`,

  autogrowth: `-- Fix file sizes and growth
ALTER DATABASE SalesDB MODIFY FILE
  (NAME='SalesDB_Log',
   SIZE=10240MB, FILEGROWTH=1024MB);

-- Check VLF count (aim for <50)
DBCC LOGINFO;

-- Rebuild VLFs: shrink then expand
-- (maintenance window required)`,

  paramsniff: `-- Option 1: optimize for unknown
CREATE OR ALTER PROC GetOrders @CustID INT AS
  SELECT OrderID, Amount FROM Orders
  WHERE CustomerID = @CustID
  OPTION(OPTIMIZE FOR (@CustID UNKNOWN));

-- Option 2: Query Store plan forcing
EXEC sp_query_store_force_plan
  @query_id = N, @plan_id = M;`,

  virt: `-- Check scheduler pressure
SELECT scheduler_id, runnable_tasks_count,
       pending_disk_io_count
FROM sys.dm_os_schedulers
WHERE status = 'VISIBLE ONLINE';

-- VMware: Set CPU Reservation = all vCPUs
-- Set Memory Reservation = full VM RAM
-- Disable balloon/swap memory drivers
-- Monitor: CPURD% < 5% in esxtop`,

  missingindex: `-- Create the suggested covering index
CREATE NONCLUSTERED INDEX IX_Sales_Region_Date
  ON Sales (RegionID, SaleDate)
  INCLUDE (CustomerID, Amount);

-- Validate impact before:
-- user_seeks × avg_total_user_cost × avg_user_impact
-- Avoid creating every suggested index!`,
};
