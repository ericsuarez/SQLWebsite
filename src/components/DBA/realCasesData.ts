export interface SpidCard {
    spid: number;
    label?: string;
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
    log: string;
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
        resolutionKey: 'caseBlockerResolution',
        steps: [
            { log: 'SPID 52: BEGIN TRAN + UPDATE Orders SET Status=\'P\' WHERE OrderID=1001', phase: 'execute', spids: [{ spid: 52, status: 'running', label: 'Blocker — X Lock acquired' }], sqlos: { schedulers: 4, workers: 2, runnable: 1, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 312, dirtyPages: 1, evictedPages: 0 } },
            { log: 'SPID 52 holds X Lock on row #1001. Transaction not committed. Lock stays.', phase: 'lock', spids: [{ spid: 52, status: 'running', label: 'Holds X Lock — uncommitted' }], sqlos: { schedulers: 4, workers: 2, runnable: 1, suspended: 0, waitType: 'none' }, buffer: { totalPages: 1000, usedPages: 312, dirtyPages: 1, evictedPages: 0 }, highlight: 'lock' },
            { log: 'SPID 53 arrives: UPDATE same row → requests LCK_M_X → SUSPENDED', phase: 'wait', spids: [{ spid: 52, status: 'running', label: 'Holds X Lock' }, { spid: 53, status: 'suspended', waitType: 'LCK_M_X', blockedBy: 52 }, { spid: 54, status: 'suspended', waitType: 'LCK_M_X', blockedBy: 52 }], sqlos: { schedulers: 4, workers: 4, runnable: 1, suspended: 2, waitType: 'LCK_M_X', waitMs: 12400 }, buffer: { totalPages: 1000, usedPages: 312, dirtyPages: 1, evictedPages: 0 }, highlight: 'lock' },
            { log: 'DBA: KILL 52 — blocker terminated. X Lock released. Waiters resume.', phase: 'done', spids: [{ spid: 52, status: 'idle', label: 'KILLED' }, { spid: 53, status: 'running' }, { spid: 54, status: 'running' }], sqlos: { schedulers: 4, workers: 3, runnable: 2, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 312, dirtyPages: 2, evictedPages: 0 } },
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
        resolutionKey: 'caseLatchResolution',
        steps: [
            { log: '8 threads start INSERT INTO EventLog — IDENTITY generates sequential keys.', phase: 'execute', spids: [{ spid: 60, status: 'running' }, { spid: 61, status: 'running' }, { spid: 62, status: 'running' }, { spid: 63, status: 'running' }], sqlos: { schedulers: 4, workers: 8, runnable: 8, suspended: 0 }, buffer: { totalPages: 800, usedPages: 400, dirtyPages: 12, evictedPages: 0 } },
            { log: 'All INSERTs go to the last B-tree page (page 1:8792). Only 1 thread can hold PAGELATCH_EX.', phase: 'lock', spids: [{ spid: 60, status: 'running', label: 'Holds PAGELATCH_EX' }, { spid: 61, status: 'suspended', waitType: 'PAGELATCH_EX' }, { spid: 62, status: 'suspended', waitType: 'PAGELATCH_EX' }, { spid: 63, status: 'suspended', waitType: 'PAGELATCH_EX' }], sqlos: { schedulers: 4, workers: 8, runnable: 1, suspended: 7, waitType: 'PAGELATCH_EX', waitMs: 850 }, buffer: { totalPages: 800, usedPages: 400, dirtyPages: 12, evictedPages: 0 }, highlight: 'lock' },
            { log: 'Fix: Change PK to NEWSEQUENTIALID() + multiple partitions → pages spread across files.', phase: 'execute', spids: [{ spid: 60, status: 'running' }, { spid: 61, status: 'running' }, { spid: 62, status: 'running' }, { spid: 63, status: 'running' }], sqlos: { schedulers: 4, workers: 8, runnable: 8, suspended: 0 }, buffer: { totalPages: 800, usedPages: 420, dirtyPages: 8, evictedPages: 0 } },
            { log: 'PAGELATCH wait eliminated. Throughput 8× improvement.', phase: 'done', spids: [{ spid: 60, status: 'running', label: 'Done ✓' }, { spid: 61, status: 'running', label: 'Done ✓' }, { spid: 62, status: 'idle' }, { spid: 63, status: 'idle' }], sqlos: { schedulers: 4, workers: 4, runnable: 2, suspended: 0 }, buffer: { totalPages: 800, usedPages: 430, dirtyPages: 4, evictedPages: 0 } },
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
        resolutionKey: 'casePlanResolution',
        steps: [
            { log: 'Plans for Products query cached. Memory = 18 GB used / 20 GB max. Stable.', phase: 'execute', spids: [{ spid: 70, status: 'running', planStatus: 'cached' }, { spid: 71, status: 'running', planStatus: 'cached' }], sqlos: { schedulers: 8, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 2400, usedPages: 2300, dirtyPages: 80, evictedPages: 0 } },
            { log: 'Memory pressure: buffer pool grows. Lazy Writer targets plan cache for eviction.', phase: 'wait', spids: [{ spid: 70, status: 'evicted', planStatus: 'evicted' }, { spid: 71, status: 'evicted', planStatus: 'evicted' }], sqlos: { schedulers: 8, workers: 6, runnable: 2, suspended: 4, waitType: 'RESOURCE_SEMAPHORE', waitMs: 280 }, buffer: { totalPages: 2400, usedPages: 2390, dirtyPages: 120, evictedPages: 40 }, highlight: 'plan' },
            { log: 'New query arrives — plan missing → full recompile: Parse→Bind→Optimize→Execute. CPU spike.', phase: 'optimize', spids: [{ spid: 70, status: 'running', planStatus: 'recompiling' }, { spid: 71, status: 'running', planStatus: 'recompiling' }], sqlos: { schedulers: 8, workers: 6, runnable: 4, suspended: 2, waitType: 'SOS_SCHEDULER_YIELD', waitMs: 120 }, buffer: { totalPages: 2400, usedPages: 2380, dirtyPages: 90, evictedPages: 30 }, highlight: 'plan' },
            { log: 'Plans re-cached. Fix: increase max server memory or use plan guides.', phase: 'done', spids: [{ spid: 70, status: 'running', planStatus: 'cached' }, { spid: 71, status: 'running', planStatus: 'cached' }], sqlos: { schedulers: 8, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 2400, usedPages: 2200, dirtyPages: 30, evictedPages: 0 } },
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
            { log: 'Server: 16 vCPUs, TempDB = 1 data file (default). 16 sessions start stored proc.', phase: 'execute', spids: [{ spid: 80, status: 'running', label: 'tempdb / 1 file' }], sqlos: { schedulers: 16, workers: 16, runnable: 16, suspended: 0 }, buffer: { totalPages: 600, usedPages: 200, dirtyPages: 10, evictedPages: 0 } },
            { log: 'All 16 sessions request allocation from same GAM page → PAGELATCH_UP serialised.', phase: 'wait', spids: [{ spid: 80, status: 'contention', waitType: 'PAGELATCH_UP', label: 'GAM page (2:1)' }, { spid: 81, status: 'suspended', waitType: 'PAGELATCH_UP' }, { spid: 82, status: 'suspended', waitType: 'PAGELATCH_UP' }, { spid: 83, status: 'suspended', waitType: 'PAGELATCH_UP' }], sqlos: { schedulers: 16, workers: 16, runnable: 1, suspended: 15, waitType: 'PAGELATCH_UP', waitMs: 2300 }, buffer: { totalPages: 600, usedPages: 200, dirtyPages: 10, evictedPages: 0 }, highlight: 'wait' },
            { log: 'DBA adds 8 equal-size TempDB files (1 per CPU pair). Proportional Fill distributes traffic.', phase: 'execute', spids: [{ spid: 80, status: 'running', label: 'file 1' }, { spid: 81, status: 'running', label: 'file 2' }, { spid: 82, status: 'running', label: 'file 3' }, { spid: 83, status: 'running', label: 'file 4' }], sqlos: { schedulers: 16, workers: 16, runnable: 12, suspended: 4 }, buffer: { totalPages: 600, usedPages: 220, dirtyPages: 8, evictedPages: 0 } },
            { log: 'Contention eliminated. All files pre-sized equally. PAGELATCH_UP near zero.', phase: 'done', spids: [{ spid: 80, status: 'running', label: '✓' }, { spid: 81, status: 'running', label: '✓' }, { spid: 82, status: 'running', label: '✓' }, { spid: 83, status: 'running', label: '✓' }], sqlos: { schedulers: 16, workers: 16, runnable: 16, suspended: 0 }, buffer: { totalPages: 600, usedPages: 230, dirtyPages: 4, evictedPages: 0 } },
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
            { log: 'SalesDB: MDF + LDF both on D:\\ (same HDD spindle). Write workload begins.', phase: 'execute', spids: [{ spid: 90, status: 'running', label: 'D:\\ MDF write (random)' }, { spid: 91, status: 'running', label: 'D:\\ LDF write (Sequential)' }], sqlos: { schedulers: 4, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 1200, usedPages: 400, dirtyPages: 20, evictedPages: 0 } },
            { log: 'Disk head must seek between random MDF and sequential LDF. WRITELOG wait climbs.', phase: 'wait', spids: [{ spid: 90, status: 'suspended', waitType: 'WRITELOG', label: 'MDF — disk seek' }, { spid: 91, status: 'suspended', waitType: 'WRITELOG', label: 'LDF — disk seek' }], sqlos: { schedulers: 4, workers: 4, runnable: 0, suspended: 4, waitType: 'WRITELOG', waitMs: 48 }, buffer: { totalPages: 1200, usedPages: 420, dirtyPages: 80, evictedPages: 0 }, highlight: 'io' },
            { log: 'io_stall_write_ms = 48ms (bad). Transactions slow. App timeouts begin.', phase: 'error', spids: [{ spid: 90, status: 'suspended', waitType: 'WRITELOG', label: 'io_stall_write_ms: 48' }, { spid: 91, status: 'suspended', waitType: 'WRITELOG', label: 'io_stall_write_ms: 48' }], sqlos: { schedulers: 4, workers: 4, runnable: 0, suspended: 4, waitType: 'WRITELOG', waitMs: 48 }, buffer: { totalPages: 1200, usedPages: 420, dirtyPages: 80, evictedPages: 0 }, highlight: 'io' },
            { log: 'LDF moved to L:\\ dedicated SSD. io_stall_write_ms drops to 0.3ms. All clear.', phase: 'done', spids: [{ spid: 90, status: 'running', label: 'D:\\ MDF ✓' }, { spid: 91, status: 'running', label: 'L:\\ LDF (SSD) ✓' }], sqlos: { schedulers: 4, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 1200, usedPages: 400, dirtyPages: 5, evictedPages: 0 } },
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
            { log: 'Optimizer picks DOP=8 parallel plan (cost=4200). 8 worker threads launched.', phase: 'optimize', spids: [{ spid: 100, status: 'running', label: 'Coordinator' }, { spid: 101, status: 'running', label: 'Worker 1' }, { spid: 102, status: 'running', label: 'Worker 2' }, { spid: 103, status: 'running', label: 'Worker 3' }], sqlos: { schedulers: 8, workers: 8, runnable: 8, suspended: 0 }, buffer: { totalPages: 3000, usedPages: 800, dirtyPages: 0, evictedPages: 0 } },
            { log: 'Worker 3 gets Region 1 partition (48M rows). Others finish their slices and wait.', phase: 'wait', spids: [{ spid: 100, status: 'suspended', waitType: 'CXPACKET', label: 'Coordinator — wait' }, { spid: 101, status: 'suspended', waitType: 'CXPACKET', label: 'Done, waiting' }, { spid: 102, status: 'suspended', waitType: 'CXPACKET', label: 'Done, waiting' }, { spid: 103, status: 'running', label: 'Scanning 48M rows…' }], sqlos: { schedulers: 8, workers: 8, runnable: 1, suspended: 7, waitType: 'CXPACKET', waitMs: 34000 }, buffer: { totalPages: 3000, usedPages: 2800, dirtyPages: 0, evictedPages: 100 }, highlight: 'wait' },
            { log: 'DBA sets MAXDOP=4, Cost Threshold=50. Query replanned at DOP=4, balanced partitions.', phase: 'optimize', spids: [{ spid: 100, status: 'running', label: 'Coordinator' }, { spid: 101, status: 'running', label: 'Worker 1' }, { spid: 102, status: 'running', label: 'Worker 2' }], sqlos: { schedulers: 8, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 3000, usedPages: 1800, dirtyPages: 0, evictedPages: 50 } },
            { log: 'CXPACKET waits drop 80%. Query finishes faster. CPU used more efficiently.', phase: 'done', spids: [{ spid: 100, status: 'running', label: 'Done ✓' }, { spid: 101, status: 'idle' }, { spid: 102, status: 'idle' }], sqlos: { schedulers: 8, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 3000, usedPages: 1400, dirtyPages: 0, evictedPages: 0 } },
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
            { log: 'LDF: 100MB, 10% growth. Years of small growths → 9,000 VLFs. INSERT batch starts.', phase: 'execute', spids: [{ spid: 110, status: 'running', label: 'INSERT 2M rows…' }], sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 800, usedPages: 600, dirtyPages: 200, evictedPages: 0 } },
            { log: 'LDF fills. Auto-growth fires: +10% = 200MB. Synchronous zeroing blocks all writes.', phase: 'wait', spids: [{ spid: 110, status: 'growth', waitType: 'LOG_GROW', label: 'Auto-growing LDF…' }, { spid: 111, status: 'suspended', waitType: 'LOGBUFFER' }, { spid: 112, status: 'suspended', waitType: 'LOGBUFFER' }], sqlos: { schedulers: 4, workers: 4, runnable: 0, suspended: 4, waitType: 'LOGBUFFER', waitMs: 5400 }, buffer: { totalPages: 800, usedPages: 780, dirtyPages: 200, evictedPages: 0 }, highlight: 'io' },
            { log: 'Server restart required. Recovery scans 9,000 VLFs sequentially → 45s delay.', phase: 'error', spids: [{ spid: 110, status: 'suspended', waitType: 'RECOVERY', label: 'Scanning 9,000 VLFs…' }], sqlos: { schedulers: 4, workers: 1, runnable: 0, suspended: 1 }, buffer: { totalPages: 800, usedPages: 0, dirtyPages: 0, evictedPages: 800 } },
            { log: 'Fix: Pre-size LDF=10 GB, FILEGROWTH=1 GB. DBCC LOGINFO → 8 VLFs. Restart: <2s.', phase: 'done', spids: [{ spid: 110, status: 'running', label: 'VLFs: 8 ✓' }, { spid: 111, status: 'running' }], sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 800, usedPages: 400, dirtyPages: 20, evictedPages: 0 } },
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
            { log: 'GetOrders @CustID=7 (rare customer, 3 rows). SQL compiles: INDEX SEEK plan. Cached.', phase: 'optimize', spids: [{ spid: 120, status: 'running', label: 'INDEX SEEK — 3 rows', planStatus: 'cached' }], sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 100, dirtyPages: 0, evictedPages: 0 }, highlight: 'plan' },
            { log: 'GetOrders @CustID=1 (10M rows). Same plan reused: INDEX SEEK → 10M nested loops.', phase: 'execute', spids: [{ spid: 121, status: 'suspended', waitType: 'ASYNC_IO_COMP', label: 'INDEX SEEK × 10M', planStatus: 'cached' }], sqlos: { schedulers: 4, workers: 4, runnable: 1, suspended: 3, waitType: 'ASYNC_IO_COMP', waitMs: 28000 }, buffer: { totalPages: 1000, usedPages: 980, dirtyPages: 0, evictedPages: 200 }, highlight: 'plan' },
            { log: 'Duration: 28 seconds! Table scan for @CustID=1 would take 0.6s. Plan is wrong.', phase: 'error', spids: [{ spid: 121, status: 'suspended', waitType: 'ASYNC_IO_COMP', label: 'Still running… 28s' }], sqlos: { schedulers: 4, workers: 4, runnable: 1, suspended: 3, waitType: 'ASYNC_IO_COMP', waitMs: 28000 }, buffer: { totalPages: 1000, usedPages: 980, dirtyPages: 0, evictedPages: 300 }, highlight: 'io' },
            { log: 'Fix: OPTION(OPTIMIZE FOR UNKNOWN) or Query Store plan forcing. Query: 0.6s now.', phase: 'done', spids: [{ spid: 121, status: 'running', label: 'Table Scan ✓ 0.6s', planStatus: 'cached' }], sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 500, dirtyPages: 0, evictedPages: 0 } },
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
            { log: 'SQL VM: 8 vCPUs assigned. Host has 8 pCPUs shared by 5 VMs. Normal load.', phase: 'execute', spids: [{ spid: 130, status: 'running', label: 'SQL VM — 8 vCPUs' }], sqlos: { schedulers: 8, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 500, dirtyPages: 10, evictedPages: 0 } },
            { log: 'Host gets busy. Hypervisor cannot schedule SQL VM — CPU Ready builds up.', phase: 'wait', spids: [{ spid: 130, status: 'virt', waitType: 'CPU READY', label: 'Waiting for pCPU… 18ms' }, { spid: 131, status: 'virt', waitType: 'CPU READY', label: 'Waiting for pCPU… 18ms' }], sqlos: { schedulers: 8, workers: 8, runnable: 8, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 500, dirtyPages: 10, evictedPages: 0 }, highlight: 'wait' },
            { log: 'SQL DMVs show SOS_SCHEDULER_YIELD. No blocking visible. DBA confused — root cause in hypervisor.', phase: 'error', spids: [{ spid: 130, status: 'suspended', waitType: 'SOS_SCHEDULER_YIELD' }, { spid: 131, status: 'suspended', waitType: 'SOS_SCHEDULER_YIELD' }], sqlos: { schedulers: 8, workers: 8, runnable: 0, suspended: 8, waitType: 'SOS_SCHEDULER_YIELD', waitMs: 18 }, buffer: { totalPages: 1000, usedPages: 500, dirtyPages: 10, evictedPages: 0 } },
            { log: 'Fix: CPU Reservation = all vCPUs. Memory Reservation = 64 GB. CPU Ready < 1%.', phase: 'done', spids: [{ spid: 130, status: 'running', label: 'CPU Ready < 1% ✓' }, { spid: 131, status: 'running', label: 'CPU Ready < 1% ✓' }], sqlos: { schedulers: 8, workers: 4, runnable: 4, suspended: 0 }, buffer: { totalPages: 1000, usedPages: 500, dirtyPages: 5, evictedPages: 0 } },
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
            { log: 'Query: SELECT SUM(Amount) WHERE RegionID=5. No index. Plan: Clustered Index Scan.', phase: 'execute', spids: [{ spid: 140, status: 'suspended', waitType: 'PAGEIOLATCH_SH', label: 'Table Scan — 10M rows' }], sqlos: { schedulers: 4, workers: 2, runnable: 0, suspended: 2, waitType: 'PAGEIOLATCH_SH', waitMs: 28000 }, buffer: { totalPages: 1200, usedPages: 1180, dirtyPages: 0, evictedPages: 800 }, highlight: 'io' },
            { log: 'Buffer pool fills loading 10M data pages. Existing pages evicted. 28 seconds elapsed.', phase: 'wait', spids: [{ spid: 140, status: 'suspended', waitType: 'PAGEIOLATCH_SH', label: 'Reading page 4,200,000…' }], sqlos: { schedulers: 4, workers: 2, runnable: 0, suspended: 2, waitType: 'PAGEIOLATCH_SH', waitMs: 28000 }, buffer: { totalPages: 1200, usedPages: 1200, dirtyPages: 0, evictedPages: 1100 }, highlight: 'io' },
            { log: 'DBA: sys.dm_db_missing_index_details score=98,450. Index on (RegionID, SaleDate) suggested.', phase: 'optimize', spids: [{ spid: 140, status: 'running', label: 'Creating index…' }], sqlos: { schedulers: 4, workers: 2, runnable: 2, suspended: 0 }, buffer: { totalPages: 1200, usedPages: 600, dirtyPages: 0, evictedPages: 0 } },
            { log: 'CREATE INDEX applied. Plan: Index Seek (500 pages). Duration: 0.09 seconds.', phase: 'done', spids: [{ spid: 140, status: 'running', label: 'Index Seek ✓ 0.09s' }], sqlos: { schedulers: 4, workers: 1, runnable: 1, suspended: 0 }, buffer: { totalPages: 1200, usedPages: 120, dirtyPages: 0, evictedPages: 0 } },
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
