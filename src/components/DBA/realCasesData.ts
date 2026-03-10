export interface SpidCard {
    spid: number;
    label?: string;
    status: 'running' | 'suspended' | 'evicted' | 'idle' | 'contention' | 'growth' | 'virt';
    waitType?: string;
    blockedBy?: number;
    planStatus?: 'cached' | 'evicted' | 'recompiling';
    extra?: string;
}

export interface CaseStep {
    log: string;
    spids: SpidCard[];
}

export interface RealCase {
    id: string;
    icon: string;
    color: 'amber' | 'rose' | 'purple' | 'cyan' | 'red' | 'orange' | 'yellow' | 'blue' | 'violet' | 'emerald';
    nameKey: string;
    descKey: string;
    detectionQuery: string;
    resolutionKey: string;
    impactKey: string;
    steps: CaseStep[];
}

export const REAL_CASES: RealCase[] = [
    {
        id: 'blocker',
        icon: '🔒',
        color: 'amber',
        nameKey: 'caseBlocker',
        descKey: 'caseBlockerDesc',
        detectionQuery:
            `SELECT r.session_id, r.blocking_session_id,\n       r.wait_type, r.wait_time/1000 AS wait_sec,\n       t.text AS sql_text\nFROM sys.dm_exec_requests r\nCROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t\nWHERE r.blocking_session_id > 0;`,
        resolutionKey: 'caseBlockerResolution',
        impactKey: 'tempdbBestPractice',
        steps: [
            { log: 'SPID 52: BEGIN TRAN — UPDATE Orders SET status=\'P\' WHERE id=1001', spids: [{ spid: 52, status: 'running', label: 'Blocker' }] },
            { log: 'SPID 52 holds X Lock on row #1001. Transaction not committed.', spids: [{ spid: 52, status: 'running', label: 'Holds X Lock' }] },
            { log: 'SPID 53: SELECT … FOR UPDATE — requests LCK_M_X → SUSPENDED', spids: [{ spid: 52, status: 'running', label: 'Holds X Lock' }, { spid: 53, status: 'suspended', waitType: 'LCK_M_X', blockedBy: 52 }] },
            { log: 'SPID 54,55 also queue. Chain grows. Entire app appears frozen.', spids: [{ spid: 52, status: 'running', label: 'Holds X Lock' }, { spid: 53, status: 'suspended', waitType: 'LCK_M_X', blockedBy: 52 }, { spid: 54, status: 'suspended', waitType: 'LCK_M_X', blockedBy: 52 }, { spid: 55, status: 'suspended', waitType: 'LCK_M_X', blockedBy: 52 }] },
            { log: 'DBA: KILL 52 — blocker terminated. All locks released.', spids: [{ spid: 52, status: 'idle', label: 'KILLED' }, { spid: 53, status: 'running' }, { spid: 54, status: 'running' }, { spid: 55, status: 'running' }] },
        ],
    },
    {
        id: 'latch',
        icon: '💾',
        color: 'rose',
        nameKey: 'caseLatch',
        descKey: 'caseLatchDesc',
        detectionQuery:
            `SELECT wait_type, waiting_tasks_count,\n       wait_time_ms / 1000.0 AS wait_sec\nFROM sys.dm_os_wait_stats\nWHERE wait_type LIKE 'PAGELATCH%'\nORDER BY wait_time_ms DESC;`,
        resolutionKey: 'caseLatchResolution',
        impactKey: 'tempdbBestPractice',
        steps: [
            { log: '8 threads inserting rows with INT IDENTITY — sequential key, all target last page.', spids: [{ spid: 60, status: 'running' }, { spid: 61, status: 'running' }, { spid: 62, status: 'running' }, { spid: 63, status: 'running' }] },
            { log: 'All threads converge on page (1:8792). Only one can hold PAGELATCH_EX.', spids: [{ spid: 60, status: 'running' }, { spid: 61, status: 'suspended', waitType: 'PAGELATCH_EX' }, { spid: 62, status: 'suspended', waitType: 'PAGELATCH_EX' }, { spid: 63, status: 'suspended', waitType: 'PAGELATCH_EX' }] },
            { log: 'DBA detects via sys.dm_os_wait_stats: PAGELATCH_EX = #1 wait type.', spids: [{ spid: 60, status: 'running' }, { spid: 61, status: 'suspended', waitType: 'PAGELATCH_EX' }, { spid: 62, status: 'suspended', waitType: 'PAGELATCH_EX' }, { spid: 63, status: 'suspended', waitType: 'PAGELATCH_EX' }] },
            { log: 'Fix: Change PK to NEWSEQUENTIALID() or use multiple partitions. Contention drops.', spids: [{ spid: 60, status: 'running' }, { spid: 61, status: 'running' }, { spid: 62, status: 'running' }, { spid: 63, status: 'running' }] },
        ],
    },
    {
        id: 'plan',
        icon: '🗑️',
        color: 'purple',
        nameKey: 'casePlanEviction',
        descKey: 'casePlanEvictionDesc',
        detectionQuery:
            `SELECT TOP 20 qs.execution_count,\n       qs.total_worker_time/qs.execution_count AS avg_cpu,\n       SUBSTRING(st.text,1,120) AS sql_text\nFROM sys.dm_exec_query_stats qs\nCROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st\nORDER BY avg_cpu DESC;`,
        resolutionKey: 'casePlanResolution',
        impactKey: 'tempdbBestPractice',
        steps: [
            { log: 'Plans SPID 70,71 in cache. Memory stable.', spids: [{ spid: 70, status: 'running', planStatus: 'cached' }, { spid: 71, status: 'running', planStatus: 'cached' }] },
            { log: 'Memory pressure detected. Lazy Writer begins evicting plans from cache.', spids: [{ spid: 70, status: 'evicted', planStatus: 'evicted' }, { spid: 71, status: 'evicted', planStatus: 'evicted' }] },
            { log: 'New queries arrive. Plans missing → full recompilation. CPU spikes.', spids: [{ spid: 70, status: 'running', planStatus: 'recompiling' }, { spid: 71, status: 'running', planStatus: 'recompiling' }] },
            { log: 'Plans re-cached. Resolution: increase max server memory, use plan guides.', spids: [{ spid: 70, status: 'running', planStatus: 'cached' }, { spid: 71, status: 'running', planStatus: 'cached' }] },
        ],
    },
    {
        id: 'tempdb',
        icon: '🗃️',
        color: 'cyan',
        nameKey: 'caseTempDb',
        descKey: 'caseTempDbDesc',
        detectionQuery:
            `-- Check TempDB file count vs logical CPU count\nSELECT COUNT(*) AS tempdb_files\nFROM sys.master_files WHERE database_id = 2 AND type = 0;\n\n-- Check contention on allocation pages\nSELECT wait_type, waiting_tasks_count, wait_time_ms\nFROM sys.dm_os_wait_stats\nWHERE wait_type IN ('PAGELATCH_UP','PAGELATCH_EX')\nORDER BY wait_time_ms DESC;`,
        resolutionKey: 'tempdbBestPractice',
        impactKey: 'tempdbBestPractice',
        steps: [
            { log: 'Server has 16 logical CPUs. TempDB has only 1 data file (default install).', spids: [{ spid: 80, status: 'running', label: 'tempdb file 1' }] },
            { log: '16 sessions create temp tables simultaneously — all hit the same GAM/SGAM page.', spids: [{ spid: 80, status: 'contention', waitType: 'PAGELATCH_UP', label: 'GAM page (2:1)' }, { spid: 81, status: 'suspended', waitType: 'PAGELATCH_UP' }, { spid: 82, status: 'suspended', waitType: 'PAGELATCH_UP' }, { spid: 83, status: 'suspended', waitType: 'PAGELATCH_UP' }] },
            { log: 'DBA adds 8 equal-size TempDB data files (1 per CPU pair). Each gets its own GAM.', spids: [{ spid: 80, status: 'running', label: 'tempdb file 1' }, { spid: 81, status: 'running', label: 'tempdb file 2' }, { spid: 82, status: 'running', label: 'tempdb file 3' }, { spid: 83, status: 'running', label: 'tempdb file 4' }] },
            { log: 'Contention eliminated. Best: pre-size all files equally to prevent uneven round-robin.', spids: [{ spid: 80, status: 'running' }, { spid: 81, status: 'running' }, { spid: 82, status: 'running' }, { spid: 83, status: 'running' }] },
        ],
    },
    {
        id: 'ldf',
        icon: '💿',
        color: 'red',
        nameKey: 'caseLdfPlacement',
        descKey: 'caseLdfPlacementDesc',
        detectionQuery:
            `-- Check file locations\nSELECT name, type_desc, physical_name\nFROM sys.master_files\nORDER BY database_id, type;\n\n-- Check I/O latency by file\nSELECT DB_NAME(vfs.database_id) AS db,\n       mf.physical_name,\n       vfs.io_stall_read_ms, vfs.io_stall_write_ms\nFROM sys.dm_io_virtual_file_stats(NULL,NULL) vfs\nJOIN sys.master_files mf ON vfs.file_id = mf.file_id\n  AND vfs.database_id = mf.database_id\nORDER BY vfs.io_stall_write_ms DESC;`,
        resolutionKey: 'ldfBestPractice',
        impactKey: 'ldfBestPractice',
        steps: [
            { log: 'MDF and LDF both on D:\\ (same spindle). Normal operations begin.', spids: [{ spid: 90, status: 'running', label: 'D:\\ MDF write' }, { spid: 91, status: 'running', label: 'D:\\ LDF write' }] },
            { log: 'LDF sequential writes compete with MDF random I/O on the same disk head.', spids: [{ spid: 90, status: 'suspended', waitType: 'WRITELOG', label: 'MDF I/O wait' }, { spid: 91, status: 'suspended', waitType: 'WRITELOG', label: 'LDF I/O wait' }] },
            { log: 'io_stall_write_ms climbs. Transactions slow. Timeouts begin appearing in app logs.', spids: [{ spid: 90, status: 'suspended', waitType: 'WRITELOG', label: 'io_stall HIGH' }, { spid: 91, status: 'suspended', waitType: 'WRITELOG', label: 'io_stall HIGH' }] },
            { log: 'DBA moves LDF to dedicated L:\\ drive (SSD). io_stall drops immediately.', spids: [{ spid: 90, status: 'running', label: 'D:\\ MDF ✓' }, { spid: 91, status: 'running', label: 'L:\\ LDF ✓' }] },
        ],
    },
    {
        id: 'cxpacket',
        icon: '🔀',
        color: 'orange',
        nameKey: 'caseCxpacket',
        descKey: 'caseCxpacketDesc',
        detectionQuery:
            `SELECT wait_type, waiting_tasks_count,\n       wait_time_ms/1000.0 AS wait_sec\nFROM sys.dm_os_wait_stats\nWHERE wait_type IN ('CXPACKET','CXCONSUMER')\nORDER BY wait_time_ms DESC;\n\n-- Find parallelism-heavy queries\nSELECT TOP 10 total_worker_time, execution_count,\n  SUBSTRING(st.text,1,100) AS sql_text\nFROM sys.dm_exec_query_stats qs\nCROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st\nORDER BY total_worker_time DESC;`,
        resolutionKey: 'cxpacketBestPractice',
        impactKey: 'cxpacketBestPractice',
        steps: [
            { log: 'Large analytical query starts. SQL chooses DOP=8 parallel plan.', spids: [{ spid: 100, status: 'running', label: 'Coordinator' }, { spid: 101, status: 'running', label: 'Worker 1' }, { spid: 102, status: 'running', label: 'Worker 2' }, { spid: 103, status: 'running', label: 'Worker 3' }] },
            { log: 'Worker 3 hits a skewed partition (10× more rows). Others finish and wait.', spids: [{ spid: 100, status: 'suspended', waitType: 'CXPACKET', label: 'Coordinator wait' }, { spid: 101, status: 'suspended', waitType: 'CXPACKET', label: 'Done, waiting' }, { spid: 102, status: 'suspended', waitType: 'CXPACKET', label: 'Done, waiting' }, { spid: 103, status: 'running', label: 'Still scanning…' }] },
            { log: 'DBA sets MAXDOP=4 and Cost Threshold=50. Trivial queries no longer go parallel.', spids: [{ spid: 100, status: 'running', label: 'Coordinator' }, { spid: 101, status: 'running', label: 'Worker 1' }, { spid: 102, status: 'running', label: 'Worker 2' }] },
            { log: 'CXPACKET wait drops 80%. Query completes faster due to balanced partition.', spids: [{ spid: 100, status: 'running', label: 'Done ✓' }, { spid: 101, status: 'idle' }, { spid: 102, status: 'idle' }] },
        ],
    },
    {
        id: 'autogrowth',
        icon: '📈',
        color: 'yellow',
        nameKey: 'caseAutoGrowth',
        descKey: 'caseAutoGrowthDesc',
        detectionQuery:
            `-- Count VLFs in the log\nDBCC LOGINFO;\n-- (Aim for < 50 VLFs)\n\n-- Detect auto-growth events via default trace\nSELECT DatabaseName, Filename,\n       (IntegerData*8.0/1024) AS growth_MB,\n       StartTime\nFROM fn_trace_gettable(CONVERT(varchar(150),\n  (SELECT TOP 1 path FROM sys.traces WHERE is_default=1)),DEFAULT)\nWHERE EventClass IN (92,93) ORDER BY StartTime DESC;`,
        resolutionKey: 'autoGrowthBestPractice',
        impactKey: 'autoGrowthBestPractice',
        steps: [
            { log: 'LDF pre-sized at 100 MB with 10% auto-growth. After months: 9,000 VLFs created.', spids: [{ spid: 110, status: 'running', label: 'VLFs: 9,000' }] },
            { log: 'INSERT batch triggers auto-growth event — synchronous, blocks all log writes.', spids: [{ spid: 110, status: 'growth', waitType: 'LOG_GROW', label: 'Auto-growing…' }, { spid: 111, status: 'suspended', waitType: 'LOGBUFFER' }, { spid: 112, status: 'suspended', waitType: 'LOGBUFFER' }] },
            { log: 'Server restart: recovery scans all 9,000 VLFs. 45 second delay before DB online.', spids: [{ spid: 110, status: 'suspended', waitType: 'RECOVERY', label: 'Scanning VLFs…' }] },
            { log: 'Fix: shrink + recreate LDF pre-sized at 10 GB, 1 GB growth. DBCC LOGINFO → 8 VLFs.', spids: [{ spid: 110, status: 'running', label: 'VLFs: 8 ✓' }, { spid: 111, status: 'running' }, { spid: 112, status: 'running' }] },
        ],
    },
    {
        id: 'paramsniff',
        icon: '🔍',
        color: 'blue',
        nameKey: 'caseParamSniff',
        descKey: 'caseParamSniffDesc',
        detectionQuery:
            `-- Find bad cached plans\nSELECT qs.execution_count, qs.total_elapsed_time,\n       qp.query_plan,\n       SUBSTRING(st.text,1,150) AS sql\nFROM sys.dm_exec_query_stats qs\nCROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st\nCROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp\nWHERE st.text LIKE '%GetOrders%'\nORDER BY qs.total_elapsed_time DESC;`,
        resolutionKey: 'paramSniffBestPractice',
        impactKey: 'paramSniffBestPractice',
        steps: [
            { log: 'SP GetOrders @CustID=7 (rare). SQL compiles plan: INDEX SEEK (0 rows estimated OK).', spids: [{ spid: 120, status: 'running', label: 'Plan: INDEX SEEK', planStatus: 'cached' }] },
            { log: 'GetOrders @CustID=1 (common, millions of rows) — same cached plan reused.', spids: [{ spid: 121, status: 'suspended', waitType: 'ASYNC_IO_COMP', label: 'INDEX SEEK (bad plan)', planStatus: 'cached' }] },
            { log: 'INDEX SEEK with millions of lookups = slow. Table scan would be faster here.', spids: [{ spid: 121, status: 'suspended', waitType: 'ASYNC_IO_COMP', label: 'Loop join 4M rows' }] },
            { log: 'Fix: OPTION(OPTIMIZE FOR UNKNOWN). Query Store plan forcing for both params.', spids: [{ spid: 121, status: 'running', label: 'Table Scan ✓', planStatus: 'cached' }] },
        ],
    },
    {
        id: 'virt',
        icon: '☁️',
        color: 'violet',
        nameKey: 'caseVirtualization',
        descKey: 'caseVirtualizationDesc',
        detectionQuery:
            `-- SQL DMVs show waits but no SQL_wait_type:\n-- Check scheduler utilization\nSELECT scheduler_id, cpu_id,\n       current_tasks_count, runnable_tasks_count,\n       current_workers_count\nFROM sys.dm_os_schedulers\nWHERE status = 'VISIBLE ONLINE';\n\n-- CPU Ready is only visible in hypervisor:\n-- VMware: esxtop → CPURD% > 5% = problem\n-- Hyper-V: Perf Counter "Virtual Machine\\CPU Wait Time Per Dispatch"`,
        resolutionKey: 'virtBestPractice',
        impactKey: 'virtBestPractice',
        steps: [
            { log: 'SQL VM on overcommitted host. Host has 8 pCPUs, 5 VMs each assigned 8 vCPUs.', spids: [{ spid: 130, status: 'running', label: 'SQL VM: 8 vCPUs' }] },
            { log: 'Host gets busy. Hypervisor cannot schedule all VMs simultaneously. CPU Ready rises.', spids: [{ spid: 130, status: 'virt', waitType: 'CPU READY', label: 'Wait for pCPU' }, { spid: 131, status: 'virt', waitType: 'CPU READY', label: 'Wait for pCPU' }] },
            { log: 'SQL sees SOS_SCHEDULER_YIELD waits. Queries slow down. DMVs show no blocking.', spids: [{ spid: 130, status: 'suspended', waitType: 'SOS_SCHEDULER_YIELD' }, { spid: 131, status: 'suspended', waitType: 'SOS_SCHEDULER_YIELD' }] },
            { log: 'Fix: Reserve CPU/Memory in hypervisor. Do not overcommit. CPU Ready drops to <1%.', spids: [{ spid: 130, status: 'running', label: 'CPU Ready <1% ✓' }, { spid: 131, status: 'running', label: 'CPU Ready <1% ✓' }] },
        ],
    },
    {
        id: 'missingindex',
        icon: '📋',
        color: 'emerald',
        nameKey: 'caseMissingIndex',
        descKey: 'caseMissingIndexDesc',
        detectionQuery:
            `SELECT TOP 10\n  ROUND(s.avg_total_user_cost * s.avg_user_impact\n    * (s.user_seeks + s.user_scans), 0) AS score,\n  d.statement AS table_name,\n  d.equality_columns, d.inequality_columns,\n  d.included_columns\nFROM sys.dm_db_missing_index_details d\nJOIN sys.dm_db_missing_index_groups g ON d.index_handle = g.index_handle\nJOIN sys.dm_db_missing_index_group_stats s ON g.index_group_handle = s.group_handle\nORDER BY score DESC;`,
        resolutionKey: 'missingIndexBestPractice',
        impactKey: 'missingIndexBestPractice',
        steps: [
            { log: 'Query: SELECT * FROM Sales WHERE RegionID=5 AND Date > \'2024-01-01\'. No index on RegionID.', spids: [{ spid: 140, status: 'suspended', waitType: 'PAGEIOLATCH_SH', label: 'Table Scan 10M rows' }] },
            { log: 'Execution plan: Clustered Index Scan. 10M pages read. Duration: 28 seconds.', spids: [{ spid: 140, status: 'suspended', waitType: 'PAGEIOLATCH_SH', label: '10M page reads' }] },
            { log: 'DBA checks sys.dm_db_missing_index_details: score=98,450. Index on (RegionID, Date) suggested.', spids: [{ spid: 140, status: 'suspended', waitType: 'PAGEIOLATCH_SH', label: 'Still scanning…' }] },
            { log: 'CREATE INDEX IX_Sales_RegionDate ON Sales (RegionID, Date). Query now: Index Seek, 0.1s.', spids: [{ spid: 140, status: 'running', label: 'Index Seek 0.1s ✓' }] },
        ],
    },
];

export const CASE_BEST_PRACTICES: Record<string, string> = {
    blocker: `-- Find and kill blockers\nSELECT session_id, blocking_session_id, wait_type\nFROM sys.dm_exec_requests\nWHERE blocking_session_id > 0;\nKILL <blocking_session_id>;\n-- Long-term: fix app to keep transactions short.`,
    latch: `-- Switch to sequential GUIDs\nALTER TABLE Orders DROP CONSTRAINT PK_Orders;\nALTER TABLE Orders ADD CONSTRAINT PK_Orders\n  PRIMARY KEY (OrderID DEFAULT NEWSEQUENTIALID());\n-- Or partition the hot table.`,
    plan: `-- Force a stable plan via Query Store\nEXEC sp_query_store_force_plan @query_id=42, @plan_id=7;\n-- Or add query hint:\nSELECT ... OPTION(OPTIMIZE FOR UNKNOWN);`,
    tempdb: `-- Add TempDB files (run for each file)\nALTER DATABASE tempdb ADD FILE\n  (NAME='tempdev2', FILENAME='T:\\tempdb2.ndf',\n   SIZE=4096MB, FILEGROWTH=512MB);\n-- Repeat until files = logical CPU count (max 8).`,
    ldf: `-- Check current file placement\nSELECT name, physical_name FROM sys.master_files;\n-- Move LDF (offline required or use mirroring first)\nALTER DATABASE SalesDB MODIFY FILE\n  (NAME='SalesDB_Log', FILENAME='L:\\Logs\\SalesDB_log.ldf');`,
    cxpacket: `-- Set MAXDOP at instance and query level\nEXEC sp_configure 'max degree of parallelism', 4;\nEXEC sp_configure 'cost threshold for parallelism', 50;\nRECONFIGURE;\n-- Per query:\nSELECT ... OPTION(MAXDOP 1);`,
    autogrowth: `-- Pre-size and fix growth increment\nALTER DATABASE SalesDB MODIFY FILE\n  (NAME='SalesDB_Log', SIZE=10240MB, FILEGROWTH=1024MB);\n-- Check VLF count\nDBCC LOGINFO;\n-- Shrink + rebuild to reduce VLFs (maintenance window needed).`,
    paramsniff: `-- Option 1: optimize for unknown\nCREATE PROC GetOrders @CustID INT AS\n  SELECT ... WHERE CustomerID=@CustID\n  OPTION(OPTIMIZE FOR (@CustID UNKNOWN));\n-- Option 2: force via Query Store\nEXEC sp_query_store_force_plan @query_id=N, @plan_id=M;`,
    virt: `-- Check scheduler pressure\nSELECT scheduler_id, runnable_tasks_count,\n       pending_disk_io_count\nFROM sys.dm_os_schedulers\nWHERE status = 'VISIBLE ONLINE';\n-- In VMware: set CPU and Memory Reservation = max.\n-- Disable balloon/swap drivers for SQL VMs.`,
    missingindex: `-- Create the suggested index\nCREATE NONCLUSTERED INDEX IX_Sales_Region_Date\n  ON Sales (RegionID, Date)\n  INCLUDE (CustomerID, Amount);\n-- Always validate with actual execution plan first.`,
};
