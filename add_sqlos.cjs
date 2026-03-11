const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const enKeys = `
        // SQLOS Deep Dive
        sqlosMainDesc: 'Dive into the SQL Server Operating System (SQLOS), the internal layer that manages memory, threading, and synchronization to bypass Windows OS limitations.',
        sqlosTabThreads: 'Thread States',
        sqlosTabSchedulers: 'Schedulers',
        sqlosTabSync: 'Synchronization',
        sqlosTabWaits: 'Waits',

        sqlosThreadsTitle: 'The SQLOS Thread State Machine',
        sqlosThreadsDesc: 'Unlike Windows preemptive scheduling, SQLOS uses cooperative scheduling. A thread must voluntarily yield the CPU.',
        sqlosRunning: 'RUNNING',
        sqlosRunningDesc: 'Actively executing instructions on a logical CPU. Only 1 thread per scheduler.',
        sqlosRunnable: 'RUNNABLE',
        sqlosRunnableDesc: 'Ready to run, waiting in the FIFO runnable queue for its turn on the CPU.',
        sqlosSuspended: 'SUSPENDED',
        sqlosSuspendedDesc: 'Sleeping. Waiting for a resource (I/O, lock, memory) before it can proceed.',

        sqlosSchedulersTitle: 'SQLOS Schedulers vs Windows',
        sqlosSchedulersDesc: 'SQLOS maps one scheduler per logical CPU core. It avoids context-switch overhead by keeping threads in user mode.',
        nonPreemptiveTitle: 'Cooperative Scheduling',
        nonPreemptiveDesc: 'Windows forces context switches (preemptive). SQLOS threads yield themselves when they need to wait or reach max quantum.',
        quantumTitle: 'Scheduler Quantum (4ms)',
        quantumDesc: 'A running thread is expected to yield the CPU within 4 milliseconds. If it goes rogue, you get non-yielding scheduler dumps.',
        schedulerAnatomy: 'Scheduler Anatomy',

        sqlosSyncTitle: 'Synchronization Primitives',
        sqlosSyncDesc: 'How SQL Server protects critical structures from concurrent corruption without deadlocking.',
        syncLevel: 'Protection Level',
        syncGranularity: 'Granularity',
        syncDuration: 'Duration',
        
        sqlosLockName: 'Locks',
        sqlosLockLevel: 'Logical (Data Integrity)',
        sqlosLockGranularity: 'Row, Page, Table, DB',
        sqlosLockDuration: 'Statement or Transaction',
        sqlosLockExample: 'BEGIN TRAN UPDATE Sales SET Qty=1; (Holds X lock on Row until COMMIT)',

        sqlosLatchName: 'Latches',
        sqlosLatchLevel: 'Physical (Memory Structures)',
        sqlosLatchGranularity: 'Buffer Pool Page, B-Tree',
        sqlosLatchDuration: 'Microseconds (Read/Write)',
        sqlosLatchExample: 'Reading a data page. Thread gets a SH latch, reads to CPU, releases latch instantly.',

        sqlosSpinlockName: 'Spinlocks',
        sqlosSpinlockLevel: 'Engine Internal Structures',
        sqlosSpinlockGranularity: 'Memory Allocators, Caches',
        sqlosSpinlockDuration: 'Nanoseconds',
        sqlosSpinlockExample: 'Thread spins in a tight loop on CPU trying to acquire it instead of yielding to save context switch cost.',

        sqlosWaitsTitle: 'The Wait Statistics',
        sqlosWaitsDesc: 'The Wait stats (sys.dm_os_wait_stats) are the single most important diagnostic tool. When a thread moves to SUSPENDED, the engine tracks why and for how long.',
        
        waitCatCpu: 'CPU / Scheduling',
        waitCatCpuDesc: 'Threads are waiting for CPU time, or waiting for parallel workers to finish.',
        waitSosYieldDesc: 'Thread exhausted its 4ms quantum and voluntarily yielded. Indicates heavy CPU load.',
        waitSosYieldFix: 'Check for inefficient querying (table scans), missing indexes, or under-provisioned CPUs.',
        waitCxpacketDesc: 'Parallel query synchronization. Fast threads wait for slow threads to finish their chunks.',
        waitCxpacketFix: 'Ensure MAXDOP is configured correctly per NUMA node, increase Cost Threshold (>50).',
        waitThreadpoolDesc: 'No worker threads available to process new connections. Extreme CPU or blocking crisis.',
        waitThreadpoolFix: 'Do NOT increase Max Worker Threads. Fix the root cause of the massive blocking or slow queries.',

        waitCatIo: 'Physical I/O',
        waitCatIoDesc: 'Threads are waiting for the disk subsystem to read/write pages.',
        waitPageioShDesc: 'Waiting to read a data page from disk into the buffer pool.',
        waitPageioShFix: 'Add memory, tune queries to read less, or upgrade storage to SSD/NVMe.',
        waitWritelogDesc: 'Waiting for a log flush to disk to harden a transaction (Write-Ahead Logging).',
        waitWritelogFix: 'Move LDF to dedicated fast storage, reduce small commits (batching), check VLF count.',
        waitAsyncIoDesc: 'Waiting for asynchronous background I/O operations, usually full/dif database backups.',
        waitAsyncIoFix: 'Generally normal during backups. If slow, check backup destination or enable IF/Backup Compression.',

        waitCatLock: 'Locking / Blocking',
        waitCatLockDesc: 'Threads waiting to acquire logical locks or physical memory latches.',
        waitLckMxDesc: 'Waiting to acquire an eXclusive lock to modify a row/page, but it is held by someone else.',
        waitLckMxFix: 'Shorten transactions. Use RCSI to prevent readers blocking writers.',
        waitLckMsDesc: 'Waiting to acquire a Shared lock to read a row/page, blocked by an X lock.',
        waitLckMsFix: 'Use RCSI/Snapshot isolation if stale reads are acceptable. Tune queries.',
        waitPagelatchDesc: 'Contention for physical memory pages (NOT disk). Usually TempDB allocation pages or hot index tail inserts.',
        waitPagelatchFix: 'Multiple TempDB data files. Avoid sequential GUIDs/INTs on hot insert tables.',

        waitCatNetwork: 'Network & Client',
        waitCatNetworkDesc: 'SQL Server is waiting on the client application or network interface.',
        waitAsyncNetDesc: 'SQL Server generated results faster than the client/network can consume them.',
        waitAsyncNetFix: 'App is "row-by-agonizing-row" processing. Fix app to fetch sets, or fix network bottlenecks.',
        waitOledbDesc: 'Waiting on a Linked Server or SSAS query to return data.',
        waitOledbFix: 'Tune the query on the remote linked server itself.',
`;

const esKeys = `
        // SQLOS Deep Dive
        sqlosMainDesc: 'Sumérgete en el SQL Server Operating System (SQLOS), la capa interna que gestiona memoria, hilos y sincronización para eludir limitaciones de Windows OS.',
        sqlosTabThreads: 'Hilos',
        sqlosTabSchedulers: 'Planificadores',
        sqlosTabSync: 'Sincronización',
        sqlosTabWaits: 'Esperas',

        sqlosThreadsTitle: 'La Máquina de Estados de Hilos (SQLOS)',
        sqlosThreadsDesc: 'A diferencia del planificador apropiativo de Windows, SQLOS usa un modelo cooperativo. Un hilo debe ceder voluntariamente la CPU.',
        sqlosRunning: 'RUNNING (Corriendo)',
        sqlosRunningDesc: 'Ejecutando instrucciones activamente en la CPU. Sólo 1 hilo por planificador.',
        sqlosRunnable: 'RUNNABLE (En Espera CPU)',
        sqlosRunnableDesc: 'Listo para correr, esperando en la cola FIFO su turno en la CPU.',
        sqlosSuspended: 'SUSPENDED (Suspendido)',
        sqlosSuspendedDesc: 'Durmiendo. Esperando un recurso (Disco, bloqueo, memoria) antes de continuar.',

        sqlosSchedulersTitle: 'Planificadores SQLOS vs Windows',
        sqlosSchedulersDesc: 'SQLOS mapea un scheduler por núcleo lógico. Evita el costoso cambio de contexto ("context switch") manteniendo los hilos en modo usuario.',
        nonPreemptiveTitle: 'Planificación Cooperativa',
        nonPreemptiveDesc: 'Windows fuerza cambios de contexto (Preemptivo). En SQLOS, los hilos se ceden a sí mismos cuando necesitan esperar o agotan su quantum.',
        quantumTitle: 'Quantum del Scheduler (4ms)',
        quantumDesc: 'Un hilo ejecutándose debe ceder la CPU en 4 milisegundos. Si se descontrola, genera volcados de memoria por scheduler.',
        schedulerAnatomy: 'Anatomía del Planificador',

        sqlosSyncTitle: 'Mecanismos de Sincronización',
        sqlosSyncDesc: 'Cómo SQL Server protege estructuras críticas de corrupción por concurrencia sin causar deadlocks.',
        syncLevel: 'Nivel',
        syncGranularity: 'Granularidad',
        syncDuration: 'Duración',
        
        sqlosLockName: 'Locks (Bloqueos)',
        sqlosLockLevel: 'Lógico (Integridad Datos)',
        sqlosLockGranularity: 'Fila, Página, Tabla, BD',
        sqlosLockDuration: 'Transacción',
        sqlosLockExample: 'BEGIN TRAN UPDATE Sales. (Mantiene un candado X en la Fila hasta el COMMIT)',

        sqlosLatchName: 'Latches',
        sqlosLatchLevel: 'Físico (Memoria RAM)',
        sqlosLatchGranularity: 'Página Buffer Pool, B-Tree',
        sqlosLatchDuration: 'Microsegundos',
        sqlosLatchExample: 'Leer una página. El hilo obtiene un latch SH, la lee a la CPU y lo suelta al instante.',

        sqlosSpinlockName: 'Spinlocks',
        sqlosSpinlockLevel: 'Motor (Estructuras Internas)',
        sqlosSpinlockGranularity: 'Allocators, Cachés',
        sqlosSpinlockDuration: 'Nanosegundos',
        sqlosSpinlockExample: 'El hilo "gira" frenéticamente en la CPU tratando de adquirirlo para evitar el costo de suspenderse.',

        sqlosWaitsTitle: 'Estadísticas de Espera (Waits)',
        sqlosWaitsDesc: 'Las Wait Stats (sys.dm_os_wait_stats) son el pilar del diagnóstico. Cuando un hilo se SUSPENDE, el motor anota el por qué y el cuánto.',
        
        waitCatCpu: 'CPU / Scheduling',
        waitCatCpuDesc: 'Los hilos esperan tiempo de CPU o esperan que los hilos en paralelo terminen.',
        waitSosYieldDesc: 'Un hilo agotó sus 4ms y cedió voluntariamente. Indica alta carga o consultas que queman CPU (Scans).',
        waitSosYieldFix: 'Revisar escaneos de índices, índices faltantes, o CPUs sub-dimensionadas.',
        waitCxpacketDesc: 'Sincronización paralela. Hilos rápidos esperan a que los más lentos terminen su tarea.',
        waitCxpacketFix: 'Asegure un MAXDOP correcto por nodo NUMA, aumente el Cost Threshold for Parallelism (>50).',
        waitThreadpoolDesc: 'Inanición de hilos ("Starvation"). No hay trabajadores para nuevas peticiones debido a un colapso gigantesco.',
        waitThreadpoolFix: 'NO aumentar Max Worker Threads. Cace el bloqueo masivo que atascó todos sus hilos.',

        waitCatIo: 'Disco (E/S)',
        waitCatIoDesc: 'Esperan que el frágil almacenamiento magnético o NVMe lea/escriba páginas.',
        waitPageioShDesc: 'Esperando leer página de datos en memoria (Physical I/O).',
        waitPageioShFix: 'Tuning de consultas (menos lecturas lógicas), más memoria RAM, o SSDs más rápidos.',
        waitWritelogDesc: 'Esperando que un COMMIT se afiance ("harden") en el Log de transacciones.',
        waitWritelogFix: 'LDF en almacenamiento puro dedicado. Reduce commits de 1 fila. Vigila los VLFs.',
        waitAsyncIoDesc: 'Esperas asíncronas de fondo. El 99% de las veces es un Backup ejecutándose.',
        waitAsyncIoFix: 'Normal. Si demora mucho tiempo, investigue su destino o habilite la Compresión.',

        waitCatLock: 'Bloqueos / Latches',
        waitCatLockDesc: 'Hilos enfrentados por obtener un mismo registro, o contención extrema de memoria.',
        waitLckMxDesc: 'Queremos modificar algo, pero alguien más lo tiene bloqueado de forma exclusiva (X).',
        waitLckMxFix: 'Transacciones lo más breves posible. Evite cursores. Considere aislamiento RCSI.',
        waitLckMsDesc: 'Queremos leer algo, pero una transacción lenta que lo modificó (X) aún no hace Commit.',
        waitLckMsFix: 'Aislamiento RCSI ayuda radicalmente a evitar lectores bloqueados por escritores.',
        waitPagelatchDesc: 'Contención física en RAM. Típicamente el TempDB o inserciones secuenciales pesadas (Last Page Insert).',
        waitPagelatchFix: 'Divida el TempDB en múltiples ficheros de datos. Use NEWSEQUENTIALID() inteligentemente.',

        waitCatNetwork: 'Red',
        waitCatNetworkDesc: 'SQL Server generó los resultados, pero la capa final es lenta en digerirlos.',
        waitAsyncNetDesc: 'Aplicativo consumiendo "Fila por Fila" (RBAR) o red colapsada.',
        waitAsyncNetFix: 'Que el ORM extraiga en lotes grandes. Rara vez es problema real de infraestructura de red.',
        waitOledbDesc: 'Consulta al Linked Server. SQL Server tirado en el sofá esperando respuesta del otro lado.',
        waitOledbFix: 'La consulta local es rápida. Entrar al servidor vinculado destino y afinar el motor ajeno.',
`;

// Insert after pmCtxSwitchDesc
content = content.replace(/(pmCtxSwitchDesc:\s*'.*?',)/, "$1\n" + enKeys);
content = content.replace(/(pmCtxSwitchDesc:\s*'.*?',\s*(?:\r\n|\n|.)*?)(pmCtxSwitchDesc:\s*'.*?',)/, "$1$2\n" + esKeys);

fs.writeFileSync(targetFile, content);
console.log('Successfully injected SQLOS translation keys!');
