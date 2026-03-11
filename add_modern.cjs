const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const enKeys = `
        // Modern Features
        modMainDesc: 'Over the last decade, SQL Server has evolved from a traditional RDBMS into a modern data platform. Explore the architectural breakthroughs that powers the latest versions.',

        modAdrTitle: 'Accelerated Database Recovery (ADR)',
        modAdrDesc: 'Completely redesigns the SQL Server recovery process. Long-running transactions no longer cause an hours-long rollback.',
        modAdrDetail: 'ADR introduces the Persisted Version Store (PVS) and Logical Revert. Instead of physically undoing the transaction log backwards, SQL Server just marks the row versions in the PVS as aborted. Rollbacks that used to take days now finish in milliseconds.',

        modIqpTitle: 'Intelligent Query Processing (IQP)',
        modIqpDesc: 'A family of features where the Query Optimizer learns from past executions and dynamically fixes bad plans at runtime.',
        modIqpDetail: 'Includes Memory Grant Feedback (adjusts RAM grants on subsequent executions to fix spills), Adaptive Joins (switches between Hash/Nested Loop mid-flight based on actual row counts), and Interleaved Execution for multi-statement functions.',

        modHybridTitle: 'Hybrid Buffer Pool',
        modHybridDesc: 'Allows SQL Server to directly access data pages residing on Persistent Memory (PMEM) devices without copying them into RAM first.',
        modHybridDetail: 'Traditional SQL Server must read a page from disk into the Buffer Pool (RAM) before it can be read. With Hybrid Buffer Pool on PMEM, the data file IS the memory. SQL Server accesses the file via memory-mapped I/O (mmap), completely bypassing the traditional read path.',

        modHekatonTitle: 'Hekaton (In-Memory OLTP)',
        modHekatonDesc: 'A completely lock-free, latch-free, memory-optimized engine designed for extreme transaction processing throughput.',
        modHekatonDetail: 'Tables are stored entirely in RAM using lock-free Bw-Trees. Row data is versioned (Multi-Version Concurrency Control). Stored Procedures are natively compiled in C into a DLL for absolute zero interpretation overhead. Unmatched speed for hot tables.',

        modSqlpalTitle: 'SQLPAL (SQL Server on Linux)',
        modSqlpalDesc: 'How Microsoft ported 10 million lines of C++ code, deeply tied to the Windows API, to run natively on Linux.',
        modSqlpalDetail: 'Instead of rewriting the engine, Microsoft built the SQL Platform Abstraction Layer (SQLPAL), an evolution of the Drawbridge research project. SQLPAL acts as a lightweight Library OS, translating Windows API calls (via a Picoprocess) into host Linux syscalls with negligible overhead.',
`;

const esKeys = `
        // Modern Features
        modMainDesc: 'En la última década, SQL Server ha evolucionado enormemente. Explora los avances de arquitectura a nivel de motor que potencian las versiones modernas.',

        modAdrTitle: 'Accelerated Database Recovery (ADR)',
        modAdrDesc: 'Rediseña drásticamente el proceso de recuperación de SQL Server. Las transacciones gigantescas ya no provocan un Rollback de horas.',
        modAdrDetail: 'ADR introduce el Persisted Version Store (PVS) y Revocación Lógica. En vez de deshacer el Transaction Log físicamente hacia atrás, SQL Server simplemente marca las versiones en el PVS como abortadas. Los rollbacks que tardaban días ahora acaban en milisegundos.',

        modIqpTitle: 'Intelligent Query Processing (IQP)',
        modIqpDesc: 'El Optimizador de Consultas aprende de ejecuciones pasadas y arregla automáticamente malos planes de ejecución en tiempo real.',
        modIqpDetail: 'Incluye Memory Grant Feedback (ajusta concesiones de RAM a iteraciones futuras), Adaptive Joins (cambia entre Hash / Nested Loop en pleno vuelo basado en filas reales), e Interleaved Execution.',

        modHybridTitle: 'Hybrid Buffer Pool (PMEM)',
        modHybridDesc: 'Permite a SQL Server acceder directamente a páginas de datos en dispositivos PMEM (Memoria Persistente) sin copiarlas a RAM previamente.',
        modHybridDetail: 'Para leer datos, el SQL tradicional debe cargar la página en el Buffer Pool. Con Memory-Mapped I/O sobre dispositivos PMEM, el archivo de datos ES la memoria. SQL accede a los bytes directamente omitiendo la capa de software I/O.',

        modHekatonTitle: 'Hekaton (In-Memory OLTP)',
        modHekatonDesc: 'Un motor optimizado 100% en memoria, libre de latches y locks (Lock-free), diseñado para carga transaccional extrema.',
        modHekatonDetail: 'Las tablas viven enteramente en RAM usando árboles Bw lock-free. Multiversión (MVCC). Los Stored Procedures son compilados nativamente a código máquina C (archivos DLL) para tener una capa de interpretación absolutamente CERO.',

        modSqlpalTitle: 'SQLPAL (SQL Server on Linux)',
        modSqlpalDesc: 'Cómo Microsoft logró que 10 millones de líneas de código C++, atadas a la API de Windows, corran nativas en entornos Linux.',
        modSqlpalDetail: 'En vez de reescribir todo, Microsoft creó el SQL Platform Abstraction Layer (SQLPAL), nacido del proyecto Drawbridge. SQLPAL funciona como un SO de librería muy ligero, traduciendo llamadas API de Windows a syscalls de Linux sin apenas pérdida de rendimiento.',
`;

// Insert after waitOledbFix
content = content.replace(/(waitOledbFix:\s*'.*?',)/, "$1\n" + enKeys);
content = content.replace(/(waitOledbFix:\s*'.*?',\s*(?:\r\n|\n|.)*?)(waitOledbFix:\s*'.*?',)/, "$1$2\n" + esKeys);

fs.writeFileSync(targetFile, content);
console.log('Successfully injected Modern Features translation keys!');
