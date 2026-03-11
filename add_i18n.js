import * as fs from 'fs';
import * as path from 'path';

const tFile = 'c:/Users/erichack0rd/Desktop/SQLWebsite/src/i18n/translations.ts';
let tContent = fs.readFileSync(tFile, 'utf-8');

const newEnKeys = `
        // -- Real Cases Step Logs & Labels --
        // Blocker
        blockerSpid52Running: 'Blocker — X Lock acquired',
        blockerSpid52Lock: 'Holds X Lock — uncommitted',
        blockerLog1: 'SPID 52: BEGIN TRAN + UPDATE Orders SET Status=\\'P\\' WHERE OrderID=1001',
        blockerLog2: 'SPID 52 holds X Lock on row #1001. Transaction not committed. Lock stays.',
        blockerLog3: 'SPID 53 arrives: UPDATE same row → requests LCK_M_X → SUSPENDED',
        blockerLog4: 'DBA: KILL 52 — blocker terminated. X Lock released. Waiters resume.',
        blockerDone52: 'KILLED',

        // Latch
        latchSpid60Running: 'Holds PAGELATCH_EX',
        latchLog1: '8 threads start INSERT INTO EventLog — IDENTITY generates sequential keys.',
        latchLog2: 'All INSERTs go to the last B-tree page (page 1:8792). Only 1 thread can hold PAGELATCH_EX.',
        latchLog3: 'Fix: Change PK to NEWSEQUENTIALID() + multiple partitions → pages spread across files.',
        latchLog4: 'PAGELATCH wait eliminated. Throughput 8× improvement.',
        latchDone: 'Done ✓',

        // Plan
        planLog1: 'Plans for Products query cached. Memory = 18 GB used / 20 GB max. Stable.',
        planLog2: 'Memory pressure: buffer pool grows. Lazy Writer targets plan cache for eviction.',
        planLog3: 'New query arrives — plan missing → full recompile: Parse→Bind→Optimize→Execute. CPU spike.',
        planLog4: 'Plans re-cached. Fix: increase max server memory or use plan guides.',

        // TempDB
        tempdbSpid80Running1: 'tempdb / 1 file',
        tempdbSpid80Wait: 'GAM page (2:1)',
        tempdbSpid80Running2: 'file 1',
        tempdbSpid81Running2: 'file 2',
        tempdbSpid82Running2: 'file 3',
        tempdbSpid83Running2: 'file 4',
        tempdbLog1: 'Server: 16 vCPUs, TempDB = 1 data file (default). 16 sessions start stored proc.',
        tempdbLog2: 'All 16 sessions request allocation from same GAM page → PAGELATCH_UP serialised.',
        tempdbLog3: 'DBA adds 8 equal-size TempDB files (1 per CPU pair). Proportional Fill distributes traffic.',
        tempdbLog4: 'Contention eliminated. All files pre-sized equally. PAGELATCH_UP near zero.',
        tempdbDone: '✓',

        // LDF
        ldfSpid90Running1: 'D:\\\\ MDF write (random)',
        ldfSpid91Running1: 'D:\\\\ LDF write (Sequential)',
        ldfSpid90Wait: 'MDF — disk seek',
        ldfSpid91Wait: 'LDF — disk seek',
        ldfSpid90Wait2: 'io_stall_write_ms: 48',
        ldfSpid91Wait2: 'io_stall_write_ms: 48',
        ldfSpid90Running2: 'D:\\\\ MDF ✓',
        ldfSpid91Running2: 'L:\\\\ LDF (SSD) ✓',
        ldfLog1: 'SalesDB: MDF + LDF both on D:\\\\ (same HDD spindle). Write workload begins.',
        ldfLog2: 'Disk head must seek between random MDF and sequential LDF. WRITELOG wait climbs.',
        ldfLog3: 'io_stall_write_ms = 48ms (bad). Transactions slow. App timeouts begin.',
        ldfLog4: 'LDF moved to L:\\\\ dedicated SSD. io_stall_write_ms drops to 0.3ms. All clear.',

        // CXPACKET
        cxpSpid100Running1: 'Coordinator',
        cxpSpid101Running1: 'Worker 1',
        cxpSpid102Running1: 'Worker 2',
        cxpSpid103Running1: 'Worker 3',
        cxpSpid100Wait1: 'Coordinator — wait',
        cxpSpid101Wait1: 'Done, waiting',
        cxpSpid102Wait1: 'Done, waiting',
        cxpSpid103Running2: 'Scanning 48M rows…',
        cxpLog1: 'Optimizer picks DOP=8 parallel plan (cost=4200). 8 worker threads launched.',
        cxpLog2: 'Worker 3 gets Region 1 partition (48M rows). Others finish their slices and wait.',
        cxpLog3: 'DBA sets MAXDOP=4, Cost Threshold=50. Query replanned at DOP=4, balanced partitions.',
        cxpLog4: 'CXPACKET waits drop 80%. Query finishes faster. CPU used more efficiently.',

        // AutoGrowth
        autoSpid110Running1: 'INSERT 2M rows…',
        autoSpid110Wait1: 'Auto-growing LDF…',
        autoSpid110Error1: 'Scanning 9,000 VLFs…',
        autoSpid110Running2: 'VLFs: 8 ✓',
        autoLog1: 'LDF: 100MB, 10% growth. Years of small growths → 9,000 VLFs. INSERT batch starts.',
        autoLog2: 'LDF fills. Auto-growth fires: +10% = 200MB. Synchronous zeroing blocks all writes.',
        autoLog3: 'Server restart required. Recovery scans 9,000 VLFs sequentially → 45s delay.',
        autoLog4: 'Fix: Pre-size LDF=10 GB, FILEGROWTH=1 GB. DBCC LOGINFO → 8 VLFs. Restart: <2s.',

        // ParamSniff
        paramSpid120Running1: 'INDEX SEEK — 3 rows',
        paramSpid121Wait1: 'INDEX SEEK × 10M',
        paramSpid121Error1: 'Still running… 28s',
        paramSpid121Running2: 'Table Scan ✓ 0.6s',
        paramLog1: 'GetOrders @CustID=7 (rare customer, 3 rows). SQL compiles: INDEX SEEK plan. Cached.',
        paramLog2: 'GetOrders @CustID=1 (10M rows). Same plan reused: INDEX SEEK → 10M nested loops.',
        paramLog3: 'Duration: 28 seconds! Table scan for @CustID=1 would take 0.6s. Plan is wrong.',
        paramLog4: 'Fix: OPTION(OPTIMIZE FOR UNKNOWN) or Query Store plan forcing. Query: 0.6s now.',

        // Virt
        virtSpid130Running1: 'SQL VM — 8 vCPUs',
        virtSpid130Wait1: 'Waiting for pCPU… 18ms',
        virtSpid131Wait1: 'Waiting for pCPU… 18ms',
        virtSpid130Wait2: 'SCSI Queue Full',
        virtSpid131Wait2: 'SCSI Queue Full',
        virtSpid132Error1: 'Balloon inflating',
        virtSpid130Running2: 'Healthy VM ✓',
        virtSpid131Running2: 'Multi-SCSI ✓',
        virtLog1: 'SQL VM: 8 vCPUs assigned. Host has 8 pCPUs shared by 5 VMs. Normal load.',
        virtLog2: 'Host gets busy. Hypervisor cannot schedule SQL VM — CPU Ready builds up.',
        virtLog3: 'I/O spike hits! OS, Data, and Log are on a single SCSI controller. Queue depth maxes out at 64.',
        virtLog4: 'Host runs out of RAM. Memory balloon driver inflates inside SQL VM, stealing RAM back to the host!',
        virtLog5: 'Fix: Reserve vCPUs and full RAM. Disable ballooning. Separate OS, Data, Log to Paravirtual SCSI controllers. CPU Ready < 1%.',

        // MissingIndex
        missSpid140Wait1: 'Table Scan — 10M rows',
        missSpid140Wait2: 'Reading page 4,200,000…',
        missSpid140Optimize: 'Creating index…',
        missSpid140Running2: 'Index Seek ✓ 0.09s',
        missLog1: 'Query: SELECT SUM(Amount) WHERE RegionID=5. No index. Plan: Clustered Index Scan.',
        missLog2: 'Buffer pool fills loading 10M data pages. Existing pages evicted. 28 seconds elapsed.',
        missLog3: 'DBA: sys.dm_db_missing_index_details score=98,450. Index on (RegionID, SaleDate) suggested.',
        missLog4: 'CREATE INDEX applied. Plan: Index Seek (500 pages). Duration: 0.09 seconds.',
`;

const newEsKeys = `
        // -- Real Cases Step Logs & Labels --
        // Blocker
        blockerSpid52Running: 'Bloqueador — Bloqueo X adquirido',
        blockerSpid52Lock: 'Mantiene Bloqueo X — sin hacer commit',
        blockerLog1: 'SPID 52: BEGIN TRAN + UPDATE Orders SET Status=\\'P\\' WHERE OrderID=1001',
        blockerLog2: 'SPID 52 mantiene Bloqueo X en fila #1001. Transacción no commiteada. Bloqueo se mantiene.',
        blockerLog3: 'Llega SPID 53: UPDATE a la misma fila → solicita LCK_M_X → SUSPENDED',
        blockerLog4: 'DBA: KILL 52 — bloqueador terminado. Bloqueo X liberado. Esperas se reanudan.',
        blockerDone52: 'MATADO',

        // Latch
        latchSpid60Running: 'Mantiene PAGELATCH_EX',
        latchLog1: '8 hilos inician INSERT INTO EventLog — IDENTITY genera claves secuenciales.',
        latchLog2: 'Todos los INSERT van a la misma última página B-tree (1:8792). Solo 1 hilo puede mantener PAGELATCH_EX.',
        latchLog3: 'Arreglo: Cambiar PK a NEWSEQUENTIALID() + múltiples particiones → páginas repartidas entre archivos.',
        latchLog4: 'Espera de PAGELATCH eliminada. Rendimiento mejorado 8×.',
        latchDone: 'Hecho ✓',

        // Plan
        planLog1: 'Planes para Products ox cacheados. Memoria = 18 GB usados / 20 GB máx. Estable.',
        planLog2: 'Presión de memoria: sube el buffer pool. El Lazy Writer expulsa la caché de planes.',
        planLog3: 'Llega nueva consulta — sin plan → recompilación total: Parse→Bind→Optimize→Execute. Pico de CPU.',
        planLog4: 'Planes re-cacheados. Solución: subir memoria máx o forzar plan en Query Store.',

        // TempDB
        tempdbSpid80Running1: 'tempdb / 1 archivo',
        tempdbSpid80Wait: 'Página GAM (2:1)',
        tempdbSpid80Running2: 'archivo 1',
        tempdbSpid81Running2: 'archivo 2',
        tempdbSpid82Running2: 'archivo 3',
        tempdbSpid83Running2: 'archivo 4',
        tempdbLog1: 'Servidor: 16 vCPUs, TempDB = 1 archivo (defecto). 16 sesiones llaman al stored proc.',
        tempdbLog2: 'Las 16 sesiones piden alojamiento de la misma página GAM → PAGELATCH_UP serializado (contención).',
        tempdbLog3: 'DBA añade 8 archivos TempDB (1 por cada par de CPU). Proportional Fill reparte escrituras.',
        tempdbLog4: 'Contención eliminada. Archivos del mismo tamaño inicial. PAGELATCH_UP erradicado.',
        tempdbDone: '✓',

        // LDF
        ldfSpid90Running1: 'D:\\\\ MDF escribe (aleatorio)',
        ldfSpid91Running1: 'D:\\\\ LDF escribe (Secuencial)',
        ldfSpid90Wait: 'MDF — salto de disco',
        ldfSpid91Wait: 'LDF — salto de disco',
        ldfSpid90Wait2: 'io_stall_write_ms: 48',
        ldfSpid91Wait2: 'io_stall_write_ms: 48',
        ldfSpid90Running2: 'D:\\\\ MDF ✓',
        ldfSpid91Running2: 'L:\\\\ LDF (SSD) ✓',
        ldfLog1: 'SalesDB: MDF y LDF en D:\\\\ (mismo disco mecánico). Inicia la carga de escrituras.',
        ldfLog2: 'La aguja del disco debe saltar entre MDF (aleatorio) y LDF (secuencial). Las esperas WRITELOG suben.',
        ldfLog3: 'io_stall_write_ms = 48ms (malo). Las transacciones van lentas. Los timeouts de app se disparan.',
        ldfLog4: 'El LDF se sube a un SSD dedicado (L:\\\\). io_stall_write_ms baja a 0.3ms. Todo resuelto.',

        // CXPACKET
        cxpSpid100Running1: 'Coordinador',
        cxpSpid101Running1: 'Worker 1',
        cxpSpid102Running1: 'Worker 2',
        cxpSpid103Running1: 'Worker 3',
        cxpSpid100Wait1: 'Coordinador — espera',
        cxpSpid101Wait1: 'Terminado, espera',
        cxpSpid102Wait1: 'Terminado, espera',
        cxpSpid103Running2: 'Escaneando 48M filas…',
        cxpLog1: 'Optimizador elige plan paralelo DOP=8 (costo=4200). Se lanzan 8 hilos worker.',
        cxpLog2: 'El Worker 3 coge la partición de Región 1 (48M filas). Los demás acaban en segundos y se quedan en espera CXPACKET.',
        cxpLog3: 'DBA configura MAXDOP=4 y Umbral de Costo=50. La consulta replanificada en DOP=4 equilibra subyacentes.',
        cxpLog4: 'Las esperas CXPACKET bajan un 80%. Consulta acaba antes por menor overhead de hilos paralelos.',

        // AutoGrowth
        autoSpid110Running1: 'INSERT 2M filas…',
        autoSpid110Wait1: 'Auto-creciendo LDF…',
        autoSpid110Error1: 'Leyendo 9,000 VLFs…',
        autoSpid110Running2: 'VLFs: 8 ✓',
        autoLog1: 'LDF: 100MB, auto-grow 10%. Años subiendo → 9,000 VLFs creados. Carga de INSERT de 2M filas entra.',
        autoLog2: 'LDF se llena. Salta autogrowth: cede +10% (200MB). El formateo a ceros SINCRONIZADO bloquea la BD (LOG_GROW).',
        autoLog3: 'Servidor se reinicia forzadamente. La fase RECOVERY lee 9,000 VLFs secuencialmente → tarda 45s.',
        autoLog4: 'Fix: LDF pre-fijado en 10 GB, crecimiento a 1 GB. DBCC LOGINFO da 8 VLFs. Reinicios vuelan: <2s.',

        // ParamSniff
        paramSpid120Running1: 'INDEX SEEK — 3 filas',
        paramSpid121Wait1: 'INDEX SEEK × 10M',
        paramSpid121Error1: 'Aún corriendo… 28s',
        paramSpid121Running2: 'Table Scan ✓ 0.6s',
        paramLog1: 'GetOrders @CustID=7 (cliente raro, 3 filas). Compila: plan de BÚSQUEDA en ÍNDICE. Lo cachea.',
        paramLog2: 'GetOrders @CustID=1 (10M filas). Se reutiliza el mismo plan: Búsqueda Indexada → 10M de Key Lookups.',
        paramLog3: 'Duración: ¡28s! Un simple escaneo de tabla para @CustID=1 habría tardado 0.6s. Plan espantoso (Parameter Sniffing).',
        paramLog4: 'Arreglo: OPTION(OPTIMIZE FOR UNKNOWN) o Forzado de Plan en Query Store. Tiempo actual de 0.6s.',

        // Virt
        virtSpid130Running1: 'VM Servidor — 8 vCPUs',
        virtSpid130Wait1: 'Esperando CPU física… 18ms',
        virtSpid131Wait1: 'Esperando CPU física… 18ms',
        virtSpid130Wait2: 'Cola SCSI Llena',
        virtSpid131Wait2: 'Cola SCSI Llena',
        virtSpid132Error1: 'Inflado de Globos',
        virtSpid130Running2: 'VM Sana ✓',
        virtSpid131Running2: 'Multi-SCSI ✓',
        virtLog1: 'SQL VM: 8 vCPUs sobre host ESXi de 8 pCPUs totales compartido por 5 VMs. Carga normal transaccional.',
        virtLog2: 'El hipervisor no puede planificar la CPU de la VM de BD — el %CPURed (CPU Ready) se dispara enormemente. La BM va lentísima aunque SQL OS no vea bloqueos propios.',
        virtLog3: 'Pico de I/O! Tanto el disco S.O como MDF y el LOG pasan por la misma controladora SCSI. Saturación de Cola de LUN a los 64 comandos concurrenles.',
        virtLog4: 'Servidor Host VMWare sin RAM libre! El Controlador Globo "Memory Balloon" chupa mágicamente la cachë SQL Server desde dentro de Windows devolviéndosela al VMWare causando colapso masivo (RESOURCE_SEMAPHORE).',
        virtLog5: 'Resolución: Deshabilitar Ballooning / Fijo %100 Reserva de memoria. Reservar CPU 1-to-1 en CPU-Affinity. Usar N Controladores PVSCSI paralelos. CPU Ready es < 1% y los PageIoLaches desapareden.',

        // MissingIndex
        missSpid140Wait1: 'Escaneo completo de Tabla — 10M filas',
        missSpid140Wait2: 'Leyendo pág. 4,200,000…',
        missSpid140Optimize: 'Creando índice…',
        missSpid140Running2: 'Búsqueda por Índice ✓ 0.09s',
        missLog1: 'Query: SELECT SUM(Amount) WHERE RegionID=5. Faltan indices. El Optimizer opta por un Clustered Index Scan para toda la tabla.',
        missLog2: 'El Buffer Pool tiene que desechar GBs de caché útil (Planes, diccionarios, otras tablas) solo para leer del disco los mastodonticos 10M de renglones inútiles. Costó 28 Segundos de colapso.',
        missLog3: 'DBA usa sys.dm_db_missing_index_details y da puntaje 98,450%. Recomiendan Indexar (RegionID, SaleDate). Se lo envían al DevOps, luego de testeo se lanza.',
        missLog4: 'Se aplica NONCLUSTERED INDEX. Ahora el optimizador hace un INDEX SEEK directo tocando ¡Solo 500 páginas lógicas! El Coste y tiempo han caído a escasos 0.09 segundos. Faltaba un Índice.',
`;

tContent = tContent.replace("        queryEvent: 'Query Event',\n    },", "        queryEvent: 'Query Event'," + newEnKeys + "\n    },");
tContent = tContent.replace("        queryEvent: 'Evento de Query',\n    }", "        queryEvent: 'Evento de Query'," + newEsKeys + "\n    }");

fs.writeFileSync(tFile, tContent);
console.log('Done');
