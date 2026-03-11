const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const enKeys = `
        // PerfMon Visualizer
        pmMainDesc: 'Simulate high workloads and observe how critical SQL Server and Windows performance counters react. Healthy values vs Critical values.',
        pmStartStress: 'Simulate Heavy Workload',
        pmStopStress: 'Stop Workload',
        pmCatMemory: 'Memory Pressure',
        pmCatIo: 'I/O Bottleneck',
        pmCatCpu: 'CPU & Throughput',

        pmPleTitle: 'Page Life Expectancy',
        pmPleDesc: 'How long (in seconds) a data page stays in the Buffer Pool before being flushed to disk. A sudden drop indicates memory pressure or severe I/O thrashing.',
        pmLazyWritesTitle: 'Lazy Writes/sec',
        pmLazyWritesDesc: 'Number of times per second the Lazy Writer thread runs to free up memory by flushing dirty pages and aging out clean pages. High spikes mean RAM starvation.',
        pmFreeListTitle: 'Free List Stalls/sec',
        pmFreeListDesc: 'Number of times a query had to wait because there were no free pages in the Buffer Pool. Should always be zero. Anything else is critical memory pressure.',
        pmMemGrantsTitle: 'Memory Grants Pending',
        pmMemGrantsDesc: 'Number of queries waiting for workspace memory (for sorts, hashes). High values mean queries are bottlenecked and queueing for RAM.',

        pmDiskReadTitle: 'Avg. Disk sec/Read',
        pmDiskReadDesc: 'Latency for reading data from disk (in ms). Under 5ms is excellent. Over 15ms is a warning. Over 30ms means the storage subsystem is severely overwhelmed.',
        pmDiskWriteTitle: 'Avg. Disk sec/Write',
        pmDiskWriteDesc: 'Latency for writing data/log to disk (in ms). Transaction log writes are absolutely critical. If this spikes $> 5ms$, commits slow down globally.',
        pmDiskQueueTitle: 'Current Disk Queue Length',
        pmDiskQueueDesc: 'Number of I/O requests queued up. A consistent queue length > 2 per spindle indicates that disks cannot keep up with the workload.',

        pmBatchReqTitle: 'Batch Requests/sec',
        pmBatchReqDesc: 'General throughput metric. Number of T-SQL batches received per second. Helps establish a baseline. Sudden drops with high CPU indicate a blocking/locking cliff.',
        pmCompilationsTitle: 'SQL Compilations/sec',
        pmCompilationsDesc: 'Number of times queries had to be compiled. High values mean poor plan reuse (e.g., lack of parameterization), burning CPU on the Optimizer.',
        pmRecompTitle: 'SQL Re-Compilations/sec',
        pmRecompDesc: 'Number of statement recompiles due to schema changes, stale statistics, or OPTION(RECOMPILE). Very expensive CPU operation.',
        pmCtxSwitchTitle: 'Context Switches/sec',
        pmCtxSwitchDesc: 'Rate at which the OS switches threads on the CPUs. Extremely high numbers (> 50,000) heavily suggest MAXDOP/CXPACKET contention or an overloaded CPU.',
`;

const esKeys = `
        // PerfMon Visualizer
        pmMainDesc: 'Simula cargas de trabajo elevadas y observa cómo reaccionan los contadores críticos de rendimiento de SQL Server y Windows. Valores saludables vs Críticos.',
        pmStartStress: 'Simular Carga Pesada',
        pmStopStress: 'Detener Carga',
        pmCatMemory: 'Presión de Memoria',
        pmCatIo: 'Cuello de Botella E/S',
        pmCatCpu: 'CPU y Rendimiento',

        pmPleTitle: 'Page Life Expectancy (PLE)',
        pmPleDesc: 'Cuánto tiempo (en segs) se mantiene una página en el Buffer Pool. Una caída repentina indica presión de memoria o thrashing severo.',
        pmLazyWritesTitle: 'Lazy Writes/sec',
        pmLazyWritesDesc: 'Veces por segundo que el Lazy Writer vacía páginas sucias y envejece las limpias para liberar RAM. Picos altos = hambre de memoria.',
        pmFreeListTitle: 'Free List Stalls/sec',
        pmFreeListDesc: 'Veces que una consulta tuvo que esperar porque no había páginas libres en el Buffer Pool. Debe ser CERO. Un número mayor es crítico.',
        pmMemGrantsTitle: 'Memory Grants Pending',
        pmMemGrantsDesc: 'Número de consultas esperando memoria para su espacio de trabajo (ordenaciones, hashes). Valores altos = cuellos de botella por RAM.',

        pmDiskReadTitle: 'Avg. Disk sec/Read',
        pmDiskReadDesc: 'Latencia de lectura en disco (en ms). < 5ms es ideal. > 15ms es alerta. > 30ms significa un doloroso cuello de botella I/O.',
        pmDiskWriteTitle: 'Avg. Disk sec/Write',
        pmDiskWriteDesc: 'Latencia de escritura (en ms). Crítico para el Transaction Log. Si pasa de 5ms, los COMMITs y transacciones enteras se ralentizan a nivel global.',
        pmDiskQueueTitle: 'Current Disk Queue Length',
        pmDiskQueueDesc: 'Número de peticiones I/O en cola. Una cola consistente > 2 por disco físico indica almacenamiento saturado.',

        pmBatchReqTitle: 'Batch Requests/sec',
        pmBatchReqDesc: 'Métrica general de throughput. Batches T-SQL recibidos por segundo. Una caída súbita con alta CPU indica bloqueos severos.',
        pmCompilationsTitle: 'SQL Compilations/sec',
        pmCompilationsDesc: 'Veces que se tuvo que compilar una consulta. Valores altos significan mala reutilización de planes, quemando ciclos en el Optimizador.',
        pmRecompTitle: 'SQL Re-Compilations/sec',
        pmRecompDesc: 'Recompilaciones por cambios de esquema o estadísticas obsoletas. Es una operación de CPU extremadamente costosa.',
        pmCtxSwitchTitle: 'Context Switches/sec',
        pmCtxSwitchDesc: 'Ritmo en el que el OS cambia los hilos en las CPUs. Números altísimos (> 50,000) sugieren contención de MAXDOP/CXPACKET o hiper-saturación.',
`;

// Insert after osPowerPlanImpact
content = content.replace(/(osPowerPlanImpact:\s*'.*?',)/, "$1\n" + enKeys);
content = content.replace(/(osPowerPlanImpact:\s*'.*?',\s*(?:\r\n|\n|.)*?)(osPowerPlanImpact:\s*'.*?',)/, "$1$2\n" + esKeys);

fs.writeFileSync(targetFile, content);
console.log('Successfully injected PerfMon translation keys!');
