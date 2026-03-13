import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ChartBar, Cpu, Database, FileSearch, GitMerge } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';
import { DBAActionBoard } from '../Shared/DBAActionBoard';

interface LocalText {
  en: string;
  es: string;
}

type OperatorLabId = 'nested-loops' | 'hash-match' | 'sort' | 'index-seek' | 'index-scan' | 'key-lookup';
type OperatorProfileId = 'healthy' | 'pathological';
type OperatorViewMode = 'intro' | 'play';

interface OperatorStage {
  title: LocalText;
  detail: LocalText;
  durationMs: number;
}

interface OperatorProfile {
  label: LocalText;
  scenario: LocalText;
  query: string;
  estimatedRows: number;
  actualRows: number;
  cpuMs: number;
  elapsedMs: number;
  logicalReads: number;
  memoryGrantMb: number;
  tempdbMb: number;
  chosen: LocalText;
  slow: LocalText;
  watch: LocalText[];
  tsql: string;
  stages: OperatorStage[];
}

interface OperatorLab {
  id: OperatorLabId;
  icon: typeof Activity;
  label: LocalText;
  summary: LocalText;
  accent: {
    button: string;
    badge: string;
    panel: string;
    text: string;
    bar: string;
  };
  profiles: Record<OperatorProfileId, OperatorProfile>;
}

const OPERATOR_LABS: OperatorLab[] = [
  {
    id: 'nested-loops',
    icon: GitMerge,
    label: { en: 'Nested Loops', es: 'Nested Loops' },
    summary: {
      en: 'Excellent with very few outer rows and a cheap inner seek.',
      es: 'Excelente con muy pocas filas externas y un seek interno barato.',
    },
    accent: {
      button: 'border-amber-500/30 bg-amber-500/15',
      badge: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
      panel: 'border-amber-500/20 bg-amber-500/10',
      text: 'text-amber-300',
      bar: 'bg-amber-400',
    },
    profiles: {
      healthy: {
        label: { en: 'Selective join', es: 'Join selectivo' },
        scenario: {
          en: '18 outer rows, all hitting an indexed inner side.',
          es: '18 filas externas, todas entrando en una parte interna indexada.',
        },
        query: "SELECT c.CustomerID, o.OrderID FROM Sales.Customers c JOIN Sales.Orders o ON c.CustomerID = o.CustomerID WHERE c.RegionID = 7;",
        estimatedRows: 20,
        actualRows: 18,
        cpuMs: 11,
        elapsedMs: 18,
        logicalReads: 142,
        memoryGrantMb: 0.5,
        tempdbMb: 0,
        chosen: {
          en: 'The optimizer expects a tiny outer input and prefers repeated cheap seeks over hash startup cost.',
          es: 'El optimizador espera una entrada externa diminuta y prefiere seeks baratos repetidos antes que pagar el arranque de un hash.',
        },
        slow: {
          en: 'It is not slow here. The problem begins when the outer side grows and every loop multiplies inner work.',
          es: 'Aqui no va lento. El problema empieza cuando crece la parte externa y cada vuelta multiplica el trabajo interno.',
        },
        watch: [
          { en: 'Estimated vs Actual Rows on the outer input', es: 'Estimated vs Actual Rows en la entrada externa' },
          { en: 'Inner operator executions', es: 'Numero de ejecuciones del operador interno' },
          { en: 'Hidden key lookups behind the loop', es: 'Key lookups ocultos detras del loop' },
        ],
        tsql: "SET STATISTICS IO, TIME ON;\nSELECT c.CustomerID, o.OrderID\nFROM Sales.Customers c\nJOIN Sales.Orders o ON c.CustomerID = o.CustomerID\nWHERE c.RegionID = 7\nOPTION (RECOMPILE);",
        stages: [
          { title: { en: 'Outer input', es: 'Entrada externa' }, detail: { en: 'The outer seek returns only 18 rows.', es: 'El seek externo devuelve solo 18 filas.' }, durationMs: 4 },
          { title: { en: 'Inner probes', es: 'Probes internos' }, detail: { en: '18 indexed probes stay cheap.', es: '18 probes indexados siguen siendo baratos.' }, durationMs: 9 },
          { title: { en: 'Output', es: 'Salida' }, detail: { en: 'Rows are emitted with no spill.', es: 'Las filas salen sin spill.' }, durationMs: 5 },
        ],
      },
      pathological: {
        label: { en: 'Lookup storm', es: 'Tormenta de lookups' },
        scenario: {
          en: 'The cached plan expected 40 rows but a skewed value returned 8,400.',
          es: 'El plan cacheado esperaba 40 filas, pero un valor sesgado devolvio 8.400.',
        },
        query: "SELECT o.OrderID, od.ProductID FROM Sales.Orders o JOIN Sales.OrderDetail od ON o.OrderID = od.OrderID WHERE o.CustomerID = @CustomerID;",
        estimatedRows: 40,
        actualRows: 8400,
        cpuMs: 286,
        elapsedMs: 412,
        logicalReads: 28140,
        memoryGrantMb: 0.8,
        tempdbMb: 0,
        chosen: {
          en: 'The estimate looked selective, so loops looked cheaper than building a hash table.',
          es: 'La estimacion parecia selectiva, asi que loops parecia mas barato que construir una tabla hash.',
        },
        slow: {
          en: '8,400 inner probes multiplied the cost of every seek. This is the classic shape behind painful lookup explosions.',
          es: '8.400 probes internos multiplicaron el coste de cada seek. Esta es la forma clasica de una explosion dolorosa de lookups.',
        },
        watch: [
          { en: 'Actual rows vs estimate', es: 'Filas reales vs estimadas' },
          { en: 'Inner side executions in the plan', es: 'Ejecuciones de la parte interna en el plan' },
          { en: 'Logical reads and lookup count', es: 'Logical reads y numero de lookups' },
        ],
        tsql: "SET STATISTICS IO, TIME ON;\nDECLARE @CustomerID int = 42;\nSELECT o.OrderID, od.ProductID\nFROM Sales.Orders o\nJOIN Sales.OrderDetail od ON o.OrderID = od.OrderID\nWHERE o.CustomerID = @CustomerID\nOPTION (RECOMPILE);",
        stages: [
          { title: { en: 'Outer rows', es: 'Filas externas' }, detail: { en: 'Far more rows arrive than planned.', es: 'Llegan muchas mas filas de las previstas.' }, durationMs: 56 },
          { title: { en: 'Repeated probes', es: 'Probes repetidos' }, detail: { en: 'The inner seek repeats 8,400 times.', es: 'El seek interno se repite 8.400 veces.' }, durationMs: 284 },
          { title: { en: 'Fetch pressure', es: 'Presion de fetch' }, detail: { en: 'Extra page touches finish the damage.', es: 'Los toques extra de pagina rematan el dano.' }, durationMs: 72 },
        ],
      },
    },
  },
  {
    id: 'hash-match',
    icon: Cpu,
    label: { en: 'Hash Match', es: 'Hash Match' },
    summary: {
      en: 'Strong for big unsorted joins, but very sensitive to bad memory grants.',
      es: 'Muy potente para joins grandes no ordenados, pero muy sensible a grants de memoria malos.',
    },
    accent: {
      button: 'border-violet-500/30 bg-violet-500/15',
      badge: 'border-violet-500/25 bg-violet-500/10 text-violet-200',
      panel: 'border-violet-500/20 bg-violet-500/10',
      text: 'text-violet-300',
      bar: 'bg-violet-400',
    },
    profiles: {
      healthy: {
        label: { en: 'Hash in memory', es: 'Hash en memoria' },
        scenario: {
          en: 'Large inputs arrive unsorted, but the memory grant is enough.',
          es: 'Llegan entradas grandes sin ordenar, pero el memory grant es suficiente.',
        },
        query: "SELECT s.SalesOrderID, p.ProductID FROM FactSales s JOIN DimProduct p ON s.ProductKey = p.ProductKey WHERE s.OrderDateKey BETWEEN 20250101 AND 20250131;",
        estimatedRows: 120000,
        actualRows: 128400,
        cpuMs: 148,
        elapsedMs: 196,
        logicalReads: 9020,
        memoryGrantMb: 64,
        tempdbMb: 0,
        chosen: {
          en: 'The inputs are large and unsorted, so hash avoids thousands of random seeks.',
          es: 'Las entradas son grandes y no ordenadas, asi que hash evita miles de seeks aleatorios.',
        },
        slow: {
          en: 'Startup cost is higher than loops, but stable because everything stays in RAM.',
          es: 'El coste inicial es mayor que loops, pero se mantiene estable porque todo cabe en RAM.',
        },
        watch: [
          { en: 'Granted Memory vs Used Memory', es: 'Granted Memory vs Used Memory' },
          { en: 'Hash build/probe distribution', es: 'Distribucion build/probe del hash' },
          { en: 'Spill warnings', es: 'Advertencias de spill' },
        ],
        tsql: "SET STATISTICS IO, TIME ON;\nSELECT s.SalesOrderID, p.ProductID\nFROM FactSales s\nJOIN DimProduct p ON s.ProductKey = p.ProductKey\nWHERE s.OrderDateKey BETWEEN 20250101 AND 20250131\nOPTION (HASH JOIN, RECOMPILE);",
        stages: [
          { title: { en: 'Build', es: 'Build' }, detail: { en: 'Rows from the smaller side become buckets in memory.', es: 'Las filas de la parte pequena se convierten en buckets en memoria.' }, durationMs: 68 },
          { title: { en: 'Probe', es: 'Probe' }, detail: { en: 'The larger side probes the hash table.', es: 'La parte grande hace probe contra la tabla hash.' }, durationMs: 89 },
          { title: { en: 'Return', es: 'Salida' }, detail: { en: 'Matches flow out with no tempdb.', es: 'Las coincidencias salen sin usar tempdb.' }, durationMs: 39 },
        ],
      },
      pathological: {
        label: { en: 'Hash spill', es: 'Hash con spill' },
        scenario: {
          en: 'The memory grant is too small, so partitions spill to tempdb.',
          es: 'El memory grant es demasiado pequeno, asi que las particiones hacen spill a tempdb.',
        },
        query: "SELECT c.CustomerID, SUM(f.Amount) FROM FactSales f JOIN DimCustomer c ON f.CustomerKey = c.CustomerKey GROUP BY c.CustomerID;",
        estimatedRows: 90000,
        actualRows: 275000,
        cpuMs: 438,
        elapsedMs: 728,
        logicalReads: 21980,
        memoryGrantMb: 16,
        tempdbMb: 384,
        chosen: {
          en: 'The join is still too large for loops, so the optimizer keeps hash even with a weak grant.',
          es: 'El join sigue siendo demasiado grande para loops, asi que el optimizador mantiene hash incluso con un grant flojo.',
        },
        slow: {
          en: 'The operator writes partitions to tempdb and reads them back. Elapsed time jumps far more than CPU.',
          es: 'El operador escribe particiones en tempdb y luego las relee. El tiempo total sube mucho mas que la CPU.',
        },
        watch: [
          { en: 'Hash Warning / spill level', es: 'Hash Warning / nivel de spill' },
          { en: 'Tempdb workfiles', es: 'Workfiles de tempdb' },
          { en: 'Grant feedback opportunities', es: 'Posibilidades de grant feedback' },
        ],
        tsql: "SET STATISTICS IO, TIME ON;\nSELECT c.CustomerID, SUM(f.Amount)\nFROM FactSales f\nJOIN DimCustomer c ON f.CustomerKey = c.CustomerKey\nGROUP BY c.CustomerID\nOPTION (HASH JOIN, RECOMPILE);",
        stages: [
          { title: { en: 'Build starts', es: 'Empieza el build' }, detail: { en: 'The hash table grows beyond the grant.', es: 'La tabla hash crece mas alla del grant.' }, durationMs: 134 },
          { title: { en: 'Spill', es: 'Spill' }, detail: { en: 'Partitions are flushed to tempdb.', es: 'Las particiones se vuelcan a tempdb.' }, durationMs: 406 },
          { title: { en: 'Probe after spill', es: 'Probe tras el spill' }, detail: { en: 'The probe resumes with much more I/O.', es: 'El probe continua con mucho mas I/O.' }, durationMs: 188 },
        ],
      },
    },
  },
  {
    id: 'sort',
    icon: ChartBar,
    label: { en: 'Sort', es: 'Sort' },
    summary: {
      en: 'Cheap in memory, very expensive when tempdb has to carry the order.',
      es: 'Barato en memoria, muy caro cuando tempdb tiene que cargar con la ordenacion.',
    },
    accent: {
      button: 'border-rose-500/30 bg-rose-500/15',
      badge: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
      panel: 'border-rose-500/20 bg-rose-500/10',
      text: 'text-rose-300',
      bar: 'bg-rose-400',
    },
    profiles: {
      healthy: {
        label: { en: 'In-memory sort', es: 'Sort en memoria' },
        scenario: {
          en: 'The rowset fits in memory and returns quickly.',
          es: 'El conjunto cabe en memoria y vuelve rapido.',
        },
        query: "SELECT TOP (5000) Name, OrderTotal FROM Sales.Invoice ORDER BY OrderTotal DESC;",
        estimatedRows: 5000,
        actualRows: 5000,
        cpuMs: 24,
        elapsedMs: 33,
        logicalReads: 880,
        memoryGrantMb: 8,
        tempdbMb: 0,
        chosen: {
          en: 'The parent operator needs ordered rows and no index already provides that order.',
          es: 'El operador padre necesita filas ordenadas y ningun indice entrega ya ese orden.',
        },
        slow: {
          en: 'It adds latency because it must accumulate rows first, but it stays reasonable while it fits in memory.',
          es: 'Anade latencia porque debe acumular filas antes, pero sigue siendo razonable mientras cabe en memoria.',
        },
        watch: [
          { en: 'Memory grant size', es: 'Tamano del memory grant' },
          { en: 'Sort warning', es: 'Sort warning' },
          { en: 'Could an index remove the sort?', es: 'Puede un indice eliminar el sort?' },
        ],
        tsql: "SET STATISTICS IO, TIME ON;\nSELECT TOP (5000) Name, OrderTotal\nFROM Sales.Invoice\nORDER BY OrderTotal DESC\nOPTION (RECOMPILE);",
        stages: [
          { title: { en: 'Read rows', es: 'Lee filas' }, detail: { en: 'Rows enter the sort buffer.', es: 'Las filas entran en el buffer del sort.' }, durationMs: 8 },
          { title: { en: 'Order in RAM', es: 'Ordena en RAM' }, detail: { en: 'Everything stays inside the grant.', es: 'Todo permanece dentro del grant.' }, durationMs: 17 },
          { title: { en: 'Return', es: 'Salida' }, detail: { en: 'Ordered rows are returned directly.', es: 'Las filas ordenadas se devuelven directamente.' }, durationMs: 8 },
        ],
      },
      pathological: {
        label: { en: 'Sort spill', es: 'Sort con spill' },
        scenario: {
          en: 'The sort receives many more rows than planned and spills runs to tempdb.',
          es: 'El sort recibe muchas mas filas de las previstas y derrama runs a tempdb.',
        },
        query: "SELECT CustomerID, OrderDate, Amount FROM Sales.Invoice WHERE OrderDate >= '2024-01-01' ORDER BY Amount DESC;",
        estimatedRows: 40000,
        actualRows: 310000,
        cpuMs: 501,
        elapsedMs: 942,
        logicalReads: 33820,
        memoryGrantMb: 24,
        tempdbMb: 620,
        chosen: {
          en: 'The order is still required, but the actual row count is far above the estimate.',
          es: 'El orden sigue siendo obligatorio, pero el numero real de filas esta muy por encima de la estimacion.',
        },
        slow: {
          en: 'Sorted runs hit tempdb and then need an external merge. This is why Sort can suddenly dominate the query.',
          es: 'Los runs ordenados pegan en tempdb y luego exigen un merge externo. Por eso Sort puede dominar de repente toda la consulta.',
        },
        watch: [
          { en: 'Sort Warning and spill details', es: 'Sort Warning y detalle del spill' },
          { en: 'Granted vs used memory', es: 'Memoria concedida vs usada' },
          { en: 'Tempdb pressure', es: 'Presion sobre tempdb' },
        ],
        tsql: "SET STATISTICS IO, TIME ON;\nSELECT CustomerID, OrderDate, Amount\nFROM Sales.Invoice\nWHERE OrderDate >= '2024-01-01'\nORDER BY Amount DESC\nOPTION (RECOMPILE);",
        stages: [
          { title: { en: 'Rows pile up', es: 'Se acumulan filas' }, detail: { en: 'The operator receives far more data than planned.', es: 'El operador recibe mucha mas informacion de la prevista.' }, durationMs: 126 },
          { title: { en: 'Runs spill', es: 'Se derraman runs' }, detail: { en: 'Sorted runs are written to tempdb.', es: 'Los runs ordenados se escriben en tempdb.' }, durationMs: 624 },
          { title: { en: 'Merge', es: 'Merge' }, detail: { en: 'The spilled runs are merged back.', es: 'Los runs derramados se fusionan de nuevo.' }, durationMs: 192 },
        ],
      },
    },
  },
  {
    id: 'index-seek',
    icon: Activity,
    label: { en: 'Index Seek', es: 'Index Seek' },
    summary: {
      en: 'Seek means precise navigation, but not always low work.',
      es: 'Seek significa navegacion precisa, pero no siempre poco trabajo.',
    },
    accent: {
      button: 'border-emerald-500/30 bg-emerald-500/15',
      badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
      panel: 'border-emerald-500/20 bg-emerald-500/10',
      text: 'text-emerald-300',
      bar: 'bg-emerald-400',
    },
    profiles: {
      healthy: {
        label: { en: 'True selective seek', es: 'Seek realmente selectivo' },
        scenario: {
          en: 'Equality on the leading key and the index covers the query.',
          es: 'Igualdad sobre la clave principal y el indice cubre la consulta.',
        },
        query: "SELECT Name, Dept FROM dbo.Employees WHERE Salary = 62000;",
        estimatedRows: 1,
        actualRows: 1,
        cpuMs: 2,
        elapsedMs: 4,
        logicalReads: 3,
        memoryGrantMb: 0,
        tempdbMb: 0,
        chosen: {
          en: 'The predicate is highly selective and SQL can walk directly to the target leaf page.',
          es: 'El predicado es muy selectivo y SQL puede caminar directo hasta la hoja objetivo.',
        },
        slow: {
          en: 'It is ideal here. The cost stays tiny because the range is narrow and there is no lookup.',
          es: 'Aqui es ideal. El coste sigue siendo minimo porque el rango es estrecho y no hay lookup.',
        },
        watch: [
          { en: 'Seek Predicate vs Predicate', es: 'Seek Predicate vs Predicate' },
          { en: 'Logical reads', es: 'Logical reads' },
          { en: 'Coverage of requested columns', es: 'Cobertura de las columnas pedidas' },
        ],
        tsql: "SET STATISTICS IO, TIME ON;\nSELECT Name, Dept\nFROM dbo.Employees\nWHERE Salary = 62000\nOPTION (RECOMPILE);",
        stages: [
          { title: { en: 'Navigate tree', es: 'Navega el arbol' }, detail: { en: 'Root, branch and leaf pages are touched.', es: 'Se tocan raiz, rama y hoja.' }, durationMs: 1 },
          { title: { en: 'Read leaf', es: 'Lee la hoja' }, detail: { en: 'The target leaf is read directly.', es: 'La hoja objetivo se lee directamente.' }, durationMs: 2 },
          { title: { en: 'Return row', es: 'Devuelve la fila' }, detail: { en: 'No extra fetch is needed.', es: 'No hace falta ningun fetch extra.' }, durationMs: 1 },
        ],
      },
      pathological: {
        label: { en: 'Seek but still expensive', es: 'Seek pero caro' },
        scenario: {
          en: 'The operator enters via seek, then reads a wide range and filters late.',
          es: 'El operador entra por seek, luego lee un rango amplio y filtra tarde.',
        },
        query: "SELECT Name, Dept, Notes FROM dbo.Employees WHERE Salary >= 50000 AND Salary < 120000 AND Dept LIKE 'F%';",
        estimatedRows: 45,
        actualRows: 1860,
        cpuMs: 61,
        elapsedMs: 88,
        logicalReads: 1920,
        memoryGrantMb: 0,
        tempdbMb: 0,
        chosen: {
          en: 'There is still a seekable range on Salary, so the optimizer enters through the index.',
          es: 'Sigue habiendo un rango que permite seek sobre Salary, asi que el optimizador entra por el indice.',
        },
        slow: {
          en: 'The range is wide and Dept LIKE is residual. SQL reads a lot more rows than it finally returns.',
          es: 'El rango es amplio y Dept LIKE es residual. SQL lee muchas mas filas de las que termina devolviendo.',
        },
        watch: [
          { en: 'Actual Rows Read vs Actual Rows', es: 'Actual Rows Read vs Actual Rows' },
          { en: 'Residual predicates', es: 'Predicados residuales' },
          { en: 'Seek label hiding expensive range reads', es: 'La etiqueta Seek ocultando lecturas caras de rango' },
        ],
        tsql: "SET STATISTICS IO, TIME ON;\nSELECT Name, Dept, Notes\nFROM dbo.Employees\nWHERE Salary >= 50000\n  AND Salary < 120000\n  AND Dept LIKE 'F%'\nOPTION (RECOMPILE);",
        stages: [
          { title: { en: 'Position on key', es: 'Se posiciona en la clave' }, detail: { en: 'The first matching key is found quickly.', es: 'La primera clave coincidente se encuentra rapido.' }, durationMs: 5 },
          { title: { en: 'Read wide range', es: 'Lee un rango amplio' }, detail: { en: 'Many leaf rows are consumed.', es: 'Se consumen muchas filas de hoja.' }, durationMs: 56 },
          { title: { en: 'Residual filter', es: 'Filtro residual' }, detail: { en: 'Rows are discarded only after the read.', es: 'Las filas se descartan solo despues de leerlas.' }, durationMs: 27 },
        ],
      },
    },
  },
  {
    id: 'index-scan',
    icon: Database,
    label: { en: 'Index Scan', es: 'Index Scan' },
    summary: {
      en: 'A scan is sometimes the right answer. It becomes bad when SQL reads everything for almost nothing.',
      es: 'A veces un scan es la respuesta correcta. Se vuelve malo cuando SQL lee casi todo para devolver casi nada.',
    },
    accent: {
      button: 'border-cyan-500/30 bg-cyan-500/15',
      badge: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200',
      panel: 'border-cyan-500/20 bg-cyan-500/10',
      text: 'text-cyan-300',
      bar: 'bg-cyan-400',
    },
    profiles: {
      healthy: {
        label: { en: 'Wide reporting scan', es: 'Scan correcto de reporting' },
        scenario: {
          en: 'The query needs a large portion of the table, so sequential reads are fine.',
          es: 'La consulta necesita una gran parte de la tabla, asi que las lecturas secuenciales tienen sentido.',
        },
        query: "SELECT OrderDate, Amount FROM FactSales WHERE OrderDate BETWEEN '2025-01-01' AND '2025-03-31';",
        estimatedRows: 240000,
        actualRows: 248400,
        cpuMs: 58,
        elapsedMs: 91,
        logicalReads: 6400,
        memoryGrantMb: 0,
        tempdbMb: 0,
        chosen: {
          en: 'Reading a big contiguous range once is cheaper than thousands of random seeks.',
          es: 'Leer un rango grande contiguo una sola vez sale mejor que miles de seeks aleatorios.',
        },
        slow: {
          en: 'A scan still reads a lot, but here the work matches the business need.',
          es: 'Un scan sigue leyendo mucho, pero aqui ese trabajo encaja con la necesidad real.',
        },
        watch: [
          { en: 'Rows returned vs table size', es: 'Filas devueltas frente al tamano de la tabla' },
          { en: 'Sequential I/O pattern', es: 'Patron de I/O secuencial' },
          { en: 'Whether a narrower index exists', es: 'Si existe un indice mas estrecho' },
        ],
        tsql: "SET STATISTICS IO, TIME ON;\nSELECT OrderDate, Amount\nFROM FactSales\nWHERE OrderDate BETWEEN '2025-01-01' AND '2025-03-31'\nOPTION (RECOMPILE);",
        stages: [
          { title: { en: 'Open scan', es: 'Abre el scan' }, detail: { en: 'SQL positions at the first page.', es: 'SQL se posiciona en la primera pagina.' }, durationMs: 11 },
          { title: { en: 'Read sequentially', es: 'Lee en secuencia' }, detail: { en: 'Pages are consumed one after another.', es: 'Las paginas se consumen una tras otra.' }, durationMs: 59 },
          { title: { en: 'Stream rows', es: 'Envia filas' }, detail: { en: 'Rows flow out continuously.', es: 'Las filas salen de forma continua.' }, durationMs: 21 },
        ],
      },
      pathological: {
        label: { en: 'Scan for one customer', es: 'Scan para un solo cliente' },
        scenario: {
          en: 'A missing index forces a scan even though the query only needs one customer.',
          es: 'La falta de indice obliga a un scan aunque la consulta solo necesita un cliente.',
        },
        query: "SELECT * FROM Sales.Orders WHERE CustomerID = 42;",
        estimatedRows: 1,
        actualRows: 14,
        cpuMs: 152,
        elapsedMs: 364,
        logicalReads: 18940,
        memoryGrantMb: 0,
        tempdbMb: 0,
        chosen: {
          en: 'No useful index starts with CustomerID, so the optimizer has no selective path.',
          es: 'Ningun indice util empieza por CustomerID, asi que el optimizador no tiene ruta selectiva.',
        },
        slow: {
          en: 'Almost the whole structure is read to return 14 rows. This is exactly the kind of waste missing-index DMVs highlight.',
          es: 'Se lee casi toda la estructura para devolver 14 filas. Este es justo el desperdicio que resaltan las DMVs de missing indexes.',
        },
        watch: [
          { en: 'Pages read vs rows returned', es: 'Paginas leidas vs filas devueltas' },
          { en: 'Missing index recommendations', es: 'Recomendaciones de missing index' },
          { en: 'Residual filter after scan', es: 'Filtro residual despues del scan' },
        ],
        tsql: "SET STATISTICS IO, TIME ON;\nSELECT *\nFROM Sales.Orders\nWHERE CustomerID = 42\nOPTION (RECOMPILE);",
        stages: [
          { title: { en: 'Open full scan', es: 'Abre el scan completo' }, detail: { en: 'Without a seekable index, SQL scans many pages.', es: 'Sin un indice que permita seek, SQL escanea muchas paginas.' }, durationMs: 54 },
          { title: { en: 'Test every row', es: 'Prueba cada fila' }, detail: { en: 'Rows are checked one by one against CustomerID.', es: 'Las filas se comprueban una a una contra CustomerID.' }, durationMs: 238 },
          { title: { en: 'Return tiny result', es: 'Devuelve poco resultado' }, detail: { en: 'After all that work, only 14 rows survive.', es: 'Despues de todo ese trabajo, solo sobreviven 14 filas.' }, durationMs: 72 },
        ],
      },
    },
  },
  {
    id: 'key-lookup',
    icon: FileSearch,
    label: { en: 'Key Lookup', es: 'Key Lookup' },
    summary: {
      en: 'Harmless for a handful of rows. Brutal when it repeats thousands of times.',
      es: 'Inofensivo para unas pocas filas. Brutal cuando se repite miles de veces.',
    },
    accent: {
      button: 'border-fuchsia-500/30 bg-fuchsia-500/15',
      badge: 'border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-200',
      panel: 'border-fuchsia-500/20 bg-fuchsia-500/10',
      text: 'text-fuchsia-300',
      bar: 'bg-fuchsia-400',
    },
    profiles: {
      healthy: {
        label: { en: 'Few-row lookup', es: 'Lookup de pocas filas' },
        scenario: {
          en: 'A non-covering index finds 3 rows, so the extra clustered fetch is acceptable.',
          es: 'Un indice no cubriente encuentra 3 filas, asi que el fetch extra al clustered es aceptable.',
        },
        query: "SELECT Name, Dept, Salary FROM dbo.Employees WHERE Salary = 62000;",
        estimatedRows: 1,
        actualRows: 3,
        cpuMs: 6,
        elapsedMs: 9,
        logicalReads: 7,
        memoryGrantMb: 0,
        tempdbMb: 0,
        chosen: {
          en: 'The nonclustered index narrows the search quickly and only a few clustered fetches remain.',
          es: 'El indice no clusterizado acota rapido la busqueda y solo quedan unos pocos fetches al clustered.',
        },
        slow: {
          en: 'It stays cheap here because the lookup count is tiny.',
          es: 'Aqui sigue siendo barato porque el numero de lookups es minimo.',
        },
        watch: [
          { en: 'Executions of the Key Lookup operator', es: 'Ejecuciones del operador Key Lookup' },
          { en: 'Could INCLUDE columns remove it?', es: 'Podrian columnas INCLUDE eliminarlo?' },
          { en: 'Reads from the clustered side', es: 'Lecturas del lado clustered' },
        ],
        tsql: "SET STATISTICS IO, TIME ON;\nSELECT Name, Dept, Salary\nFROM dbo.Employees\nWHERE Salary = 62000\nOPTION (RECOMPILE);",
        stages: [
          { title: { en: 'Find key', es: 'Encuentra la clave' }, detail: { en: 'The NCI finds the target row ids.', es: 'El NCI encuentra los row ids objetivo.' }, durationMs: 3 },
          { title: { en: 'Fetch clustered row', es: 'Fetch al clustered' }, detail: { en: 'Only 3 clustered fetches are required.', es: 'Solo hacen falta 3 fetches al clustered.' }, durationMs: 4 },
          { title: { en: 'Return full row', es: 'Devuelve la fila completa' }, detail: { en: 'Missing columns are now available.', es: 'Las columnas faltantes ya estan disponibles.' }, durationMs: 2 },
        ],
      },
      pathological: {
        label: { en: 'Lookup explosion', es: 'Explosion de lookups' },
        scenario: {
          en: '12,000 row ids come back from the NCI and every one of them hits the clustered key.',
          es: 'Vuelven 12.000 row ids desde el NCI y cada uno golpea la clave clustered.',
        },
        query: "SELECT SalesOrderID, CustomerID, ShipAddress, ShipPostalCode FROM Sales.Orders WHERE Status = 'Open';",
        estimatedRows: 250,
        actualRows: 12000,
        cpuMs: 566,
        elapsedMs: 882,
        logicalReads: 41760,
        memoryGrantMb: 0,
        tempdbMb: 0,
        chosen: {
          en: 'The optimizer thought Status = Open would return a modest row count, so the NCI path looked fine.',
          es: 'El optimizador penso que Status = Open devolveria pocas filas, asi que la ruta por NCI parecia razonable.',
        },
        slow: {
          en: '12,000 random fetches create huge read amplification. A covering index or even one scan can be cheaper than this storm.',
          es: '12.000 fetches aleatorios crean una amplificacion enorme de lecturas. Un indice cubriente o incluso un scan unico puede salir mas barato que esta tormenta.',
        },
        watch: [
          { en: 'Actual executions of Key Lookup', es: 'Ejecuciones reales de Key Lookup' },
          { en: 'Returned rows vs lookup count', es: 'Filas devueltas vs numero de lookups' },
          { en: 'INCLUDE columns or better key order', es: 'Columnas INCLUDE o mejor orden de clave' },
        ],
        tsql: "SET STATISTICS IO, TIME ON;\nSELECT SalesOrderID, CustomerID, ShipAddress, ShipPostalCode\nFROM Sales.Orders\nWHERE Status = 'Open'\nOPTION (RECOMPILE);",
        stages: [
          { title: { en: 'Get row ids', es: 'Obtiene row ids' }, detail: { en: 'The NCI returns thousands of matches.', es: 'El NCI devuelve miles de coincidencias.' }, durationMs: 118 },
          { title: { en: 'Random clustered hits', es: 'Golpes aleatorios al clustered' }, detail: { en: 'Every row id forces a clustered fetch.', es: 'Cada row id fuerza un fetch al clustered.' }, durationMs: 604 },
          { title: { en: 'Return wide rows', es: 'Devuelve filas anchas' }, detail: { en: 'The query finally gets the missing columns.', es: 'La consulta finalmente obtiene las columnas faltantes.' }, durationMs: 160 },
        ],
      },
    },
  },
];

function pickText(language: 'en' | 'es', text: LocalText) {
  return language === 'es' ? text.es : text.en;
}

function dbaBoardForOperator(profile: OperatorProfile, stage: OperatorStage) {
  return {
    title: { en: 'What the DBA checks now', es: 'Qué mira ahora el DBA' },
    focus:
      stage === profile.stages[0]
        ? {
            en: 'Validate whether the estimated shape still matches the real row volume before touching the plan.',
            es: 'Valida si la forma estimada sigue encajando con el volumen real antes de tocar el plan.',
          }
        : {
            en: 'Stay on the live operator cost: rows, reads, grant or tempdb, not on the logical name alone.',
            es: 'Quédate en el coste real del operador: filas, lecturas, grant o tempdb, no solo en el nombre lógico.',
          },
    actions: [
      { en: `Compare estimated rows ${profile.estimatedRows.toLocaleString('en-US')} vs actual rows ${profile.actualRows.toLocaleString('en-US')}.`, es: `Compara filas estimadas ${profile.estimatedRows.toLocaleString('es-ES')} vs reales ${profile.actualRows.toLocaleString('es-ES')}.` },
      { en: `Check the dominant cost signal: ${profile.logicalReads.toLocaleString('en-US')} reads, ${profile.memoryGrantMb} MB grant, ${profile.tempdbMb} MB tempdb.`, es: `Comprueba la señal dominante: ${profile.logicalReads.toLocaleString('es-ES')} lecturas, ${profile.memoryGrantMb} MB grant, ${profile.tempdbMb} MB tempdb.` },
      { en: 'Decide whether the next test is better stats, a different index, or a different plan shape.', es: 'Decide si la siguiente prueba es mejores estadísticas, otro índice o una forma de plan distinta.' },
    ],
    caution: {
      en: 'A cheap-looking operator name can still be the runtime bottleneck if row count or spill reality changed.',
      es: 'Un operador con nombre aparentemente barato puede ser el cuello de botella real si cambian las filas o aparece spill.',
    },
    accent: profile.tempdbMb > 0 ? 'rose' as const : profile.actualRows > profile.estimatedRows * 10 ? 'amber' as const : 'emerald' as const,
  };
}

export function PlanOperatorLab() {
  const { language } = useLanguage();
  const [viewMode, setViewMode] = useState<OperatorViewMode>('intro');
  const [activeOperatorId, setActiveOperatorId] = useState<OperatorLabId>('nested-loops');
  const [activeProfileId, setActiveProfileId] = useState<OperatorProfileId>('pathological');
  const [activeStage, setActiveStage] = useState(0);
  const [playing, setPlaying] = useState(false);

  const operator = OPERATOR_LABS.find((item) => item.id === activeOperatorId) ?? OPERATOR_LABS[0];
  const profile = operator.profiles[activeProfileId];
  const stage = profile.stages[activeStage] ?? profile.stages[0];
  const totalMs = profile.stages.reduce((sum, item) => sum + item.durationMs, 0);
  const elapsedToStage = profile.stages.slice(0, activeStage + 1).reduce((sum, item) => sum + item.durationMs, 0);
  const progressPct = totalMs === 0 ? 0 : Math.round((elapsedToStage / totalMs) * 100);
  const rowDelta = profile.estimatedRows === 0 ? profile.actualRows : Math.round(profile.actualRows / profile.estimatedRows);
  const board = dbaBoardForOperator(profile, stage);

  useEffect(() => {
    setActiveStage(0);
    setPlaying(false);
  }, [activeOperatorId, activeProfileId]);

  useEffect(() => {
    if (!playing) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveStage((current) => {
        if (current >= profile.stages.length - 1) {
          setPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, 1500);

    return () => window.clearInterval(timer);
  }, [playing, profile.stages.length]);

  if (viewMode === 'intro') {
    return (
      <div className="glass-panel mt-8 rounded-3xl border border-fuchsia-500/20 p-4 sm:p-6">
        <div className="max-w-4xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-fuchsia-300/80">
            {language === 'es' ? 'Briefing del lab' : 'Lab briefing'}
          </div>
          <h3 className="mt-2 text-2xl font-black text-white">
            {language === 'es' ? 'Operadores del plan y coste real' : 'Plan operators and real cost'}
          </h3>
          <p className="mt-3 text-sm leading-7 text-white/75">
            {language === 'es'
              ? 'Primero eliges el operador y entiendes qué señal vas a mirar. Después entras en play para quedarte solo con query, fases, métricas y lo que validaría un DBA antes de cambiar el plan.'
              : 'Choose the operator first and understand which signal you will watch. Then enter play to keep only query, stages, metrics, and what a DBA would validate before changing the plan.'}
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            {
              title: language === 'es' ? 'Qué verás' : 'What you will see',
              body: language === 'es' ? 'Fases del operador, tiempo acumulado, filas reales y presión de memoria o tempdb.' : 'Operator stages, accumulated time, actual rows, and memory or tempdb pressure.',
            },
            {
              title: language === 'es' ? 'Qué hará el DBA' : 'What the DBA will do',
              body: language === 'es' ? 'Comparar estimado vs real, aislar la señal dominante y decidir la siguiente prueba.' : 'Compare estimated vs actual, isolate the dominant signal, and decide the next test.',
            },
            {
              title: language === 'es' ? 'Cómo se usa' : 'How to use it',
              body: language === 'es' ? 'Briefing corto y luego play grande, sin repetir la teoría arriba.' : 'Short briefing and then a large play mode, without repeating theory on top.',
            },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{card.title}</div>
              <p className="mt-2 text-sm leading-7 text-white/75">{card.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: 'Nested Loops',
              body: language === 'es' ? 'Por cada fila externa dispara una búsqueda interna. Muy bueno con pocas filas; muy malo si se multiplica.' : 'For each outer row it launches an inner lookup. Great with few rows; bad when it multiplies.',
            },
            {
              title: 'Index Seek',
              body: language === 'es' ? 'Entra por el árbol del índice hasta la clave o rango concreto. Seek no siempre significa poco trabajo.' : 'Walks the index tree to a specific key or range. Seek does not always mean low work.',
            },
            {
              title: 'Index Scan',
              body: language === 'es' ? 'Lee muchas o todas las páginas del índice. Puede ser correcto si la consulta realmente necesita mucho volumen.' : 'Reads many or all index pages. It can be right if the query really needs a lot of volume.',
            },
            {
              title: 'Key Lookup',
              body: language === 'es' ? 'Tras un seek, va al clustered o heap a buscar columnas faltantes. Pocas veces es barato; miles, duele mucho.' : 'After a seek, it goes to the clustered index or heap for missing columns. Cheap a few times; painful thousands of times.',
            },
            {
              title: 'Hash Match',
              body: language === 'es' ? 'Construye una tabla hash para joins o agregados grandes. Si el grant falla, derrama a tempdb.' : 'Builds a hash table for large joins or aggregates. If the grant fails, it spills to tempdb.',
            },
            {
              title: 'Sort',
              body: language === 'es' ? 'Ordena filas cuando ningún índice ya entrega el orden correcto. Si no cabe, usa tempdb.' : 'Orders rows when no index already gives the right order. If it does not fit, it uses tempdb.',
            },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-black text-white">{card.title}</div>
              <p className="mt-2 text-sm leading-7 text-white/75">{card.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {OPERATOR_LABS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === operator.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveOperatorId(item.id);
                  setViewMode('play');
                }}
                className={cn('rounded-3xl border p-4 text-left transition-all', isActive ? `${item.accent.button} ${item.accent.text} border-current/40` : 'border-white/10 bg-black/20 hover:border-white/20 hover:text-white')}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div className="text-sm font-black text-white">{pickText(language, item.label)}</div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                    {pickText(language, item.profiles.pathological.label)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/65">{pickText(language, item.summary)}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <button
            onClick={() => setViewMode('play')}
            className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/15 px-5 py-3 text-sm font-black text-fuchsia-200 transition-all hover:bg-fuchsia-500/25"
          >
            {language === 'es' ? 'Entrar en Play' : 'Enter Play'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel mt-8 rounded-3xl border border-fuchsia-500/20 p-4 sm:p-6 xl:h-[calc(100dvh-18rem)]">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-white/60">
            {language === 'es' ? 'Estimate no es runtime' : 'Estimate is not runtime'}
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-white/60">
            {language === 'es' ? 'Filas, lecturas y spill mandan' : 'Rows, reads and spill rule'}
          </span>
        </div>

        <button
          onClick={() => setViewMode('intro')}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white"
        >
          {language === 'es' ? 'Descripción' : 'Description'}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {OPERATOR_LABS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === operator.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveOperatorId(item.id)}
              className={cn(
                'flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition-all',
                isActive ? `${item.accent.button} ${item.accent.text} border-current/40` : 'border-white/10 bg-black/20 text-white/65 hover:border-white/20 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {pickText(language, item.label)}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['healthy', 'pathological'] as OperatorProfileId[]).map((profileId) => {
          const isActive = profileId === activeProfileId;
          return (
            <button
              key={profileId}
              onClick={() => setActiveProfileId(profileId)}
              className={cn('rounded-full border px-4 py-1.5 text-xs font-bold transition-all', isActive ? operator.accent.badge : 'border-white/10 bg-black/20 text-white/55 hover:text-white')}
            >
              {pickText(language, operator.profiles[profileId].label)}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid min-h-0 gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <div className={cn('min-h-0 rounded-3xl border p-4 sm:p-5', operator.accent.panel)}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className={cn('text-sm font-bold', operator.accent.text)}>
                {pickText(language, operator.label)} - {pickText(language, profile.label)}
              </div>
              <p className="mt-2 text-sm leading-7 text-white/80">{pickText(language, operator.summary)}</p>
              <p className="mt-2 text-sm leading-7 text-white/65">{pickText(language, profile.scenario)}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPlaying((value) => !value)}
                className={cn('rounded-2xl border px-4 py-2 text-sm font-bold transition-all', playing ? 'border-rose-500/30 bg-rose-500/15 text-rose-200' : operator.accent.badge)}
              >
                {playing ? (language === 'es' ? 'Pausar' : 'Pause') : 'Play'}
              </button>
              <button
                onClick={() => {
                  setPlaying(false);
                  setActiveStage(0);
                }}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold text-white/65 transition-all hover:border-white/20 hover:text-white"
              >
                {language === 'es' ? 'Reiniciar' : 'Reset'}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4 font-mono text-xs leading-6 text-cyan-200">
            {profile.query}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                  {language === 'es' ? 'Tiempo acumulado del operador' : 'Accumulated operator time'}
                </div>
                <div className="mt-1 text-lg font-black text-white">{elapsedToStage} ms / {totalMs} ms</div>
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white/60">
                {progressPct}% {language === 'es' ? 'completado' : 'complete'}
              </div>
            </div>

            <div className="mt-4 h-2 rounded-full bg-white/10">
              <motion.div className={cn('h-2 rounded-full', operator.accent.bar)} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {profile.stages.map((item, index) => (
              <button
                key={`${operator.id}-${activeProfileId}-${index}`}
                onClick={() => {
                  setPlaying(false);
                  setActiveStage(index);
                }}
                className={cn('rounded-2xl border p-4 text-left transition-all', index === activeStage ? `${operator.accent.panel} border-current/30` : index < activeStage ? 'border-white/10 bg-white/[0.05]' : 'border-white/10 bg-black/20 hover:border-white/20')}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                    {language === 'es' ? `Fase ${index + 1}` : `Stage ${index + 1}`}
                  </span>
                  <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]', index === activeStage ? operator.accent.badge : 'border-white/10 bg-black/20 text-white/50')}>
                    {item.durationMs} ms
                  </span>
                </div>
                <div className="mt-3 text-sm font-bold text-white">{pickText(language, item.title)}</div>
                <p className="mt-2 text-sm leading-7 text-white/65">{pickText(language, item.detail)}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
              {language === 'es' ? 'Lo que esta pasando ahora' : 'What is happening now'}
            </div>
            <h4 className="mt-2 text-xl font-black text-white">{pickText(language, stage.title)}</h4>
            <p className="mt-3 text-sm leading-7 text-white/75">{pickText(language, stage.detail)}</p>
          </div>
        </div>

        <div className="min-h-0 space-y-4 xl:overflow-y-auto xl:pr-1">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              { label: language === 'es' ? 'Elapsed real' : 'Actual elapsed', value: `${profile.elapsedMs} ms` },
              { label: 'CPU', value: `${profile.cpuMs} ms` },
              { label: language === 'es' ? 'Lecturas logicas' : 'Logical reads', value: profile.logicalReads.toLocaleString(language === 'es' ? 'es-ES' : 'en-US') },
              { label: language === 'es' ? 'Memoria / tempdb' : 'Memory / tempdb', value: `${profile.memoryGrantMb} MB / ${profile.tempdbMb} MB` },
              { label: language === 'es' ? 'Filas estimadas' : 'Estimated rows', value: profile.estimatedRows.toLocaleString(language === 'es' ? 'es-ES' : 'en-US') },
              { label: language === 'es' ? 'Filas reales' : 'Actual rows', value: `${profile.actualRows.toLocaleString(language === 'es' ? 'es-ES' : 'en-US')} (${rowDelta}x)` },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{metric.label}</div>
                <div className="mt-2 text-xl font-black text-white">{metric.value}</div>
              </div>
            ))}
          </div>

          <DBAActionBoard
            language={language}
            accent={board.accent}
            title={board.title}
            focus={board.focus}
            actions={board.actions}
            caution={board.caution}
          />

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
              {language === 'es' ? 'Por que lo eligio' : 'Why it was chosen'}
            </div>
            <p className="mt-3 text-sm leading-7 text-white/75">{pickText(language, profile.chosen)}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
              {language === 'es' ? 'Por que tarda' : 'Why it gets expensive'}
            </div>
            <p className="mt-3 text-sm leading-7 text-white/75">{pickText(language, profile.slow)}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
              {language === 'es' ? 'Que mirar en el plan real' : 'What to check in the actual plan'}
            </div>
            <div className="mt-3 space-y-3 text-sm leading-7 text-white/75">
              {profile.watch.map((item) => (
                <div key={item.en} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  {pickText(language, item)}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
              {language === 'es' ? 'Pruebalo con STATISTICS IO, TIME' : 'Test it with STATISTICS IO, TIME'}
            </div>
            <div className="mt-3">
              <CopyCodeBlock code={profile.tsql} accent="violet" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
