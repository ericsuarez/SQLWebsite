import type { LocalizedText } from './advancedSQLData';

export type ModernFeatureRelease = '2014' | '2019' | '2022' | '2025';
export type ModernFeatureTone = 'emerald' | 'blue' | 'amber' | 'cyan' | 'lime' | 'rose';

export interface ModernFeatureStage {
  id: string;
  label: LocalizedText;
  before: LocalizedText;
  after: LocalizedText;
}

export interface ModernFeatureMetric {
  label: LocalizedText;
  before: number;
  after: number;
  unit: string;
  preference: 'lower' | 'higher';
}

export interface ModernFeatureDefinition {
  id: string;
  release: ModernFeatureRelease;
  title: LocalizedText;
  summary: LocalizedText;
  detail: LocalizedText;
  scenario: LocalizedText;
  icon: string;
  tone: ModernFeatureTone;
  badges: string[];
  stages: ModernFeatureStage[];
  metrics: ModernFeatureMetric[];
  watchpoints: LocalizedText[];
  script: string;
}

export const MODERN_FEATURE_RELEASES: Array<{
  id: 'all' | ModernFeatureRelease;
  label: LocalizedText;
}> = [
  { id: 'all', label: { en: 'All releases', es: 'Todas las versiones' } },
  { id: '2014', label: { en: '2014', es: '2014' } },
  { id: '2019', label: { en: '2019', es: '2019' } },
  { id: '2022', label: { en: '2022', es: '2022' } },
  { id: '2025', label: { en: '2025', es: '2025' } },
];

export const MODERN_FEATURE_DEFINITIONS: ModernFeatureDefinition[] = [
  {
    id: 'hekaton',
    release: '2014',
    title: { en: 'Hekaton / In-Memory OLTP', es: 'Hekaton / In-Memory OLTP' },
    summary: {
      en: 'Moves the hottest OLTP tables away from classic latch and lock paths.',
      es: 'Saca las tablas OLTP mas calientes de las rutas clasicas de latch y lock.',
    },
    detail: {
      en: 'The real win is avoiding hot B-Tree contention with MVCC, latch-free structures and optional native compilation.',
      es: 'La ganancia real es evitar contencion en B-Tree caliente con MVCC, estructuras latch-free y compilacion nativa opcional.',
    },
    scenario: {
      en: 'Picture a ticketing table with inserts and point lookups under intense concurrency.',
      es: 'Piensa en una tabla de ticketing con inserts y busquedas puntuales bajo mucha concurrencia.',
    },
    icon: 'Zap',
    tone: 'amber',
    badges: ['Bw-Tree', 'MVCC', 'Native compiled proc'],
    stages: [
      {
        id: 'entry',
        label: { en: 'Hot row arrives', es: 'Llega una fila caliente' },
        before: {
          en: 'The request enters a classic disk-based table and heads toward latch and lock coordination.',
          es: 'La peticion entra en una tabla clasica en disco y camina hacia coordinacion por latch y lock.',
        },
        after: {
          en: 'The request lands on a memory-optimized table prepared for optimistic concurrency.',
          es: 'La peticion entra en una tabla memory-optimized preparada para concurrencia optimista.',
        },
      },
      {
        id: 'contention',
        label: { en: 'Concurrency control', es: 'Control de concurrencia' },
        before: {
          en: 'Workers compete for classic lock/latch paths around hot pages or index structures.',
          es: 'Los workers compiten por rutas clasicas de lock/latch alrededor de paginas o indices calientes.',
        },
        after: {
          en: 'MVCC versions reduce blocking and avoid the worst latch hotspots.',
          es: 'El versionado MVCC reduce bloqueos y evita los peores hotspots de latch.',
        },
      },
      {
        id: 'index',
        label: { en: 'Access path', es: 'Ruta de acceso' },
        before: {
          en: 'Classic B-Tree structures stay vulnerable to heavy write contention.',
          es: 'Las estructuras B-Tree clasicas siguen siendo vulnerables a contencion fuerte de escritura.',
        },
        after: {
          en: 'Latch-free structures keep the hot path shorter and more predictable.',
          es: 'Las estructuras latch-free mantienen la ruta caliente mas corta y predecible.',
        },
      },
      {
        id: 'commit',
        label: { en: 'Commit path', es: 'Ruta de commit' },
        before: {
          en: 'The engine pays more overhead per concurrent transaction on the hottest path.',
          es: 'El motor paga mas overhead por transaccion concurrente en la ruta mas caliente.',
        },
        after: {
          en: 'Durability still exists, but with less coordination on the hottest code paths.',
          es: 'La durabilidad sigue existiendo, pero con menos coordinacion en los caminos mas calientes.',
        },
      },
    ],
    metrics: [
      { label: { en: 'Latch pressure', es: 'Presion de latch' }, before: 86, after: 28, unit: '%', preference: 'lower' },
      { label: { en: 'Blocking risk', es: 'Riesgo de bloqueo' }, before: 78, after: 22, unit: '%', preference: 'lower' },
      { label: { en: 'OLTP throughput', es: 'Throughput OLTP' }, before: 38, after: 82, unit: '%', preference: 'higher' },
    ],
    watchpoints: [
      { en: 'Do not migrate everything. Reserve it for the truly hot tables or code paths.', es: 'No migres todo. Reservalo para las tablas o caminos realmente calientes.' },
      { en: 'Memory-optimized tables change backup, restore and checkpoint discipline.', es: 'Las tablas memory-optimized cambian la disciplina de backup, restore y checkpoint.' },
    ],
    script: `SELECT name,
       durability_desc,
       memory_optimized
FROM sys.tables
WHERE memory_optimized = 1;`,
  },
  {
    id: 'adr',
    release: '2019',
    title: { en: 'Accelerated Database Recovery', es: 'Accelerated Database Recovery' },
    summary: {
      en: 'Makes rollback and crash recovery far more predictable with a persistent version store.',
      es: 'Hace rollback y crash recovery mucho mas predecibles con persistent version store.',
    },
    detail: {
      en: 'ADR changes the shape of pain: instead of replaying or undoing long histories the old way, SQL Server can logically revert far faster.',
      es: 'ADR cambia la forma del dolor: en vez de rehacer o deshacer historiales largos como antes, SQL Server puede hacer logical revert mucho mas rapido.',
    },
    scenario: {
      en: 'Imagine a huge DELETE cancelled halfway through during business hours.',
      es: 'Imagina un DELETE enorme cancelado a mitad de ejecucion en horario laboral.',
    },
    icon: 'RotateCcw',
    tone: 'emerald',
    badges: ['PVS', 'Logical revert', 'Crash recovery'],
    stages: [
      {
        id: 'txn',
        label: { en: 'Long transaction', es: 'Transaccion larga' },
        before: {
          en: 'A large transaction starts generating a heavy undo burden for the future.',
          es: 'Una transaccion grande empieza a generar una carga de undo enorme para el futuro.',
        },
        after: {
          en: 'The transaction still logs changes, but row versions are tracked for faster logical recovery.',
          es: 'La transaccion sigue generando log, pero las versiones de fila quedan registradas para recuperacion logica rapida.',
        },
      },
      {
        id: 'cancel',
        label: { en: 'Cancel or crash', es: 'Cancelacion o crash' },
        before: {
          en: 'Rollback means walking back a large amount of work the hard way.',
          es: 'El rollback implica recorrer una gran cantidad de trabajo de la forma dura.',
        },
        after: {
          en: 'ADR can logically revert the transaction state much faster.',
          es: 'ADR puede revertir logicamente el estado de la transaccion mucho mas rapido.',
        },
      },
      {
        id: 'restart',
        label: { en: 'Database restart', es: 'Reinicio de base' },
        before: {
          en: 'Crash recovery stays tied to the size of the oldest active transaction history.',
          es: 'Crash recovery queda muy ligado al tamano del historial de la transaccion activa mas antigua.',
        },
        after: {
          en: 'Recovery time is far less sensitive to monster transactions.',
          es: 'El tiempo de recovery depende mucho menos de transacciones monstruo.',
        },
      },
      {
        id: 'stable',
        label: { en: 'Back online', es: 'Vuelta online' },
        before: {
          en: 'Users wait longer while the engine finishes painful undo work.',
          es: 'Los usuarios esperan mas mientras el motor termina trabajo de undo doloroso.',
        },
        after: {
          en: 'The database returns online faster and with a predictable recovery window.',
          es: 'La base vuelve online antes y con una ventana de recovery predecible.',
        },
      },
    ],
    metrics: [
      { label: { en: 'Rollback time', es: 'Tiempo de rollback' }, before: 94, after: 18, unit: '%', preference: 'lower' },
      { label: { en: 'Recovery stall', es: 'Bloqueo de recovery' }, before: 88, after: 26, unit: '%', preference: 'lower' },
      { label: { en: 'Operational predictability', es: 'Predictibilidad operativa' }, before: 34, after: 86, unit: '%', preference: 'higher' },
    ],
    watchpoints: [
      { en: 'ADR is strongest where long-running transactions were the source of recovery pain.', es: 'ADR brilla donde las transacciones largas eran la fuente del dolor de recovery.' },
      { en: 'It changes tempdb and version-store behavior, so monitor the new shape of the workload.', es: 'Cambia el comportamiento de tempdb y version store, asi que monitoriza la nueva forma de la carga.' },
    ],
    script: `ALTER DATABASE SalesDB
SET ACCELERATED_DATABASE_RECOVERY = ON;`,
  },
  {
    id: 'iqp',
    release: '2019',
    title: { en: 'Intelligent Query Processing', es: 'Intelligent Query Processing' },
    summary: {
      en: 'A family of optimizer/runtime corrections that improve grants, row estimates and join choices.',
      es: 'Una familia de correcciones de optimizador/runtime que mejora grants, estimaciones y joins.',
    },
    detail: {
      en: 'Repeated executions can stop paying forever for the same memory or cardinality mistakes.',
      es: 'Las ejecuciones repetidas dejan de pagar siempre por los mismos errores de memoria o cardinalidad.',
    },
    scenario: {
      en: 'Think of a reporting query that spills every morning because the first estimate is wrong.',
      es: 'Piensa en una query de reporting que hace spill cada manana porque la primera estimacion sale mal.',
    },
    icon: 'Brain',
    tone: 'blue',
    badges: ['MGF', 'Adaptive Join', 'CE correction'],
    stages: [
      {
        id: 'compile',
        label: { en: 'First compile', es: 'Primera compilacion' },
        before: {
          en: 'The optimizer guesses wrong and the plan starts life already biased.',
          es: 'El optimizador estima mal y el plan nace ya sesgado.',
        },
        after: {
          en: 'The first plan may be imperfect, but the engine is ready to learn from runtime evidence.',
          es: 'El primer plan puede ser imperfecto, pero el motor esta listo para aprender del runtime.',
        },
      },
      {
        id: 'execution',
        label: { en: 'Runtime', es: 'Runtime' },
        before: {
          en: 'Memory grants overshoot or undershoot and operators may spill to tempdb.',
          es: 'Los memory grants se quedan cortos o se pasan y los operadores pueden spillar a tempdb.',
        },
        after: {
          en: 'Adaptive choices and feedback capture what really happened during execution.',
          es: 'Las decisiones adaptativas y el feedback capturan lo que ocurrio de verdad durante la ejecucion.',
        },
      },
      {
        id: 'feedback',
        label: { en: 'Feedback', es: 'Feedback' },
        before: {
          en: 'The engine repeats the same mistake on the next run.',
          es: 'El motor repite el mismo error en la siguiente ejecucion.',
        },
        after: {
          en: 'Memory Grant Feedback and related features correct the next execution path.',
          es: 'Memory Grant Feedback y features relacionadas corrigen la siguiente ruta de ejecucion.',
        },
      },
      {
        id: 'steady',
        label: { en: 'Steady state', es: 'Estado estable' },
        before: {
          en: 'The query stays fragile under changing row counts and parameter mixes.',
          es: 'La query sigue fragil ante cambios de filas y mezcla de parametros.',
        },
        after: {
          en: 'Repeated executions become more stable and less wasteful.',
          es: 'Las ejecuciones repetidas se vuelven mas estables y con menos derroche.',
        },
      },
    ],
    metrics: [
      { label: { en: 'Tempdb spills', es: 'Spills en tempdb' }, before: 82, after: 24, unit: '%', preference: 'lower' },
      { label: { en: 'Grant waste', es: 'Desperdicio de grant' }, before: 76, after: 31, unit: '%', preference: 'lower' },
      { label: { en: 'Plan stability', es: 'Estabilidad del plan' }, before: 42, after: 84, unit: '%', preference: 'higher' },
    ],
    watchpoints: [
      { en: 'The exact win depends on workload shape and compatibility level.', es: 'La ganancia exacta depende de la forma del workload y del compatibility level.' },
      { en: 'When behavior changes, validate Query Store, grants and actual row counts instead of assuming magic.', es: 'Cuando cambie el comportamiento, valida Query Store, grants y filas reales en vez de asumir magia.' },
    ],
    script: `SELECT qs.last_grant_kb,
       qs.last_used_grant_kb,
       qs.last_ideal_grant_kb,
       st.text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
WHERE qs.last_grant_kb > 0
ORDER BY qs.last_grant_kb DESC;`,
  },
  {
    id: 'psp',
    release: '2022',
    title: { en: 'Parameter Sensitive Plan optimization', es: 'Parameter Sensitive Plan optimization' },
    summary: {
      en: 'Keeps multiple plan variants for different selectivity buckets instead of one compromise plan.',
      es: 'Mantiene varias variantes de plan segun selectividad en vez de un unico plan de compromiso.',
    },
    detail: {
      en: 'Classic parameter sniffing pain often comes from one plan trying to serve tiny and huge result sets equally badly.',
      es: 'El dolor clasico de parameter sniffing aparece cuando un solo plan intenta servir igual de mal conjuntos pequenos y enormes.',
    },
    scenario: {
      en: 'Imagine a procedure that sometimes returns 3 rows and sometimes 3 million.',
      es: 'Imagina un procedimiento que a veces devuelve 3 filas y a veces 3 millones.',
    },
    icon: 'Brain',
    tone: 'lime',
    badges: ['Dispatcher', 'Plan variants', 'Skewed parameters'],
    stages: [
      {
        id: 'sniff',
        label: { en: 'First sniff', es: 'Primer sniff' },
        before: {
          en: 'The first parameter value dominates the single cached plan.',
          es: 'El primer valor de parametro domina el unico plan cacheado.',
        },
        after: {
          en: 'The engine recognizes sensitivity and prepares a dispatcher path.',
          es: 'El motor reconoce sensibilidad y prepara una ruta con dispatcher.',
        },
      },
      {
        id: 'branch',
        label: { en: 'Branching', es: 'Ramificacion' },
        before: {
          en: 'Small and large executions collide on the same join and access choices.',
          es: 'Las ejecuciones pequenas y grandes chocan contra las mismas decisiones de join y acceso.',
        },
        after: {
          en: 'Different cardinality buckets get different candidate plans.',
          es: 'Distintos buckets de cardinalidad reciben planes candidatos distintos.',
        },
      },
      {
        id: 'pick',
        label: { en: 'Plan choice', es: 'Eleccion del plan' },
        before: {
          en: 'The wrong join or lookup strategy can dominate half the workload.',
          es: 'La estrategia incorrecta de join o lookup puede arruinar media carga.',
        },
        after: {
          en: 'The dispatcher routes the execution to the best variant for that parameter shape.',
          es: 'El dispatcher envia la ejecucion a la mejor variante para esa forma de parametro.',
        },
      },
      {
        id: 'steady',
        label: { en: 'Stable workload', es: 'Carga estable' },
        before: {
          en: 'Parameter skew keeps causing regressions and operator mismatches.',
          es: 'El sesgo de parametros sigue provocando regresiones y operadores inadecuados.',
        },
        after: {
          en: 'Skewed workloads stabilize without forcing one brittle plan for all cases.',
          es: 'Las cargas con sesgo se estabilizan sin imponer un plan fragil para todos los casos.',
        },
      },
    ],
    metrics: [
      { label: { en: 'Plan variance', es: 'Varianza de planes' }, before: 88, after: 27, unit: '%', preference: 'lower' },
      { label: { en: 'Logical reads waste', es: 'Desperdicio de lecturas' }, before: 79, after: 36, unit: '%', preference: 'lower' },
      { label: { en: 'Parameter stability', es: 'Estabilidad por parametro' }, before: 33, after: 87, unit: '%', preference: 'higher' },
    ],
    watchpoints: [
      { en: 'PSP helps when the core problem is parameter skew, not bad indexing or terrible predicates.', es: 'PSP ayuda cuando el problema base es el sesgo del parametro, no malos indices o predicados terribles.' },
      { en: 'Use Query Store to validate whether the multiple variants help the real workload.', es: 'Usa Query Store para validar si las variantes ayudan de verdad al workload.' },
    ],
    script: `SELECT qsp.plan_id,
       qsp.query_id,
       qsp.is_dispatcher_plan,
       qsp.compatibility_level
FROM sys.query_store_plan AS qsp
WHERE qsp.is_dispatcher_plan = 1;`,
  },
  {
    id: 'qs-hints',
    release: '2022',
    title: { en: 'Query Store hints', es: 'Query Store hints' },
    summary: {
      en: 'Lets the DBA steer compilation behavior without rewriting application code.',
      es: 'Permite al DBA guiar el comportamiento de compilacion sin reescribir codigo de la aplicacion.',
    },
    detail: {
      en: 'This is operational gold during regressions: you can apply a targeted hint from Query Store and keep the code pipeline out of the critical path.',
      es: 'Esto es oro operativo en una regresion: puedes aplicar un hint dirigido desde Query Store y sacar el pipeline de codigo del camino critico.',
    },
    scenario: {
      en: 'A deployment regresses a key report, but the app team cannot ship a code fix today.',
      es: 'Un despliegue rompe un informe critico, pero el equipo de aplicacion no puede sacar un fix hoy.',
    },
    icon: 'GitBranch',
    tone: 'rose',
    badges: ['Query Store', 'Operational override', 'No code change'],
    stages: [
      {
        id: 'capture',
        label: { en: 'Regression captured', es: 'Regresion capturada' },
        before: {
          en: 'You only know the query got slower, but changing code is slow.',
          es: 'Solo sabes que la query empeoro, pero cambiar codigo es lento.',
        },
        after: {
          en: 'Query Store already has the bad plan, runtime evidence and query identity.',
          es: 'Query Store ya tiene el plan malo, la evidencia runtime y la identidad de la query.',
        },
      },
      {
        id: 'decision',
        label: { en: 'DBA decision', es: 'Decision DBA' },
        before: {
          en: 'Your only short-term option may be plan forcing or waiting for a new deployment.',
          es: 'Tu unica opcion inmediata puede ser forzar plan o esperar a un nuevo despliegue.',
        },
        after: {
          en: 'The DBA can inject a specific hint directly from Query Store.',
          es: 'El DBA puede inyectar un hint especifico directamente desde Query Store.',
        },
      },
      {
        id: 'compile',
        label: { en: 'Next compile', es: 'Siguiente compilacion' },
        before: {
          en: 'The optimizer compiles again with the same risky defaults.',
          es: 'El optimizador recompila otra vez con los mismos defaults arriesgados.',
        },
        after: {
          en: 'Compilation honors the Query Store hint without touching the original query text.',
          es: 'La compilacion respeta el hint de Query Store sin tocar el texto original de la query.',
        },
      },
      {
        id: 'stability',
        label: { en: 'Stability window', es: 'Ventana de estabilidad' },
        before: {
          en: 'The workload remains exposed while teams coordinate a code change.',
          es: 'La carga sigue expuesta mientras los equipos coordinan un cambio de codigo.',
        },
        after: {
          en: 'You gain breathing room to stabilize production before touching code.',
          es: 'Ganas margen para estabilizar produccion antes de tocar codigo.',
        },
      },
    ],
    metrics: [
      { label: { en: 'Mitigation time', es: 'Tiempo de mitigacion' }, before: 87, after: 21, unit: '%', preference: 'lower' },
      { label: { en: 'Code dependency', es: 'Dependencia de codigo' }, before: 91, after: 18, unit: '%', preference: 'lower' },
      { label: { en: 'Operational control', es: 'Control operativo' }, before: 29, after: 88, unit: '%', preference: 'higher' },
    ],
    watchpoints: [
      { en: 'A Query Store hint is an operational tool, not a permanent substitute for understanding the root cause.', es: 'Un Query Store hint es una herramienta operativa, no un sustituto permanente de entender la causa raiz.' },
      { en: 'Track every hint you apply. Hidden overrides become future confusion very quickly.', es: 'Rastrea cada hint aplicado. Los overrides ocultos se convierten muy rapido en confusion futura.' },
    ],
    script: `EXEC sys.sp_query_store_set_hints
     @query_id = 42,
     @query_hints = N'OPTION(USE HINT(''DISABLE_OPTIMIZER_ROWGOAL''))';`,
  },
  {
    id: 'vector',
    release: '2025',
    title: { en: 'Vector search and vector index', es: 'Busqueda vectorial e indice vectorial' },
    summary: {
      en: 'Brings embedding-style similarity search into the engine so relational plus AI workloads stay together.',
      es: 'Lleva la busqueda por similitud basada en embeddings al motor para acercar carga relacional y AI.',
    },
    detail: {
      en: 'Instead of pushing every similarity lookup to another store, SQL Server can own more of the retrieval path.',
      es: 'En vez de empujar cada lookup de similitud a otro sistema, SQL Server puede asumir mas parte de la ruta de retrieval.',
    },
    scenario: {
      en: 'A support app stores ticket text plus embeddings and needs similar incidents in the same platform.',
      es: 'Una app de soporte guarda texto de tickets mas embeddings y necesita incidentes similares en la misma plataforma.',
    },
    icon: 'Sparkles',
    tone: 'cyan',
    badges: ['Vectors', 'ANN index', 'Similarity search'],
    stages: [
      {
        id: 'store',
        label: { en: 'Embedding stored', es: 'Embedding almacenado' },
        before: {
          en: 'Similarity data usually leaves SQL Server for a separate system.',
          es: 'Los datos de similitud suelen salir de SQL Server hacia un sistema separado.',
        },
        after: {
          en: 'The embedding can live in a native vector representation inside the engine.',
          es: 'El embedding puede vivir en una representacion vectorial nativa dentro del motor.',
        },
      },
      {
        id: 'index',
        label: { en: 'Index build', es: 'Construccion del indice' },
        before: {
          en: 'No engine-native approximate path exists for vector similarity.',
          es: 'No existe una ruta aproximada nativa del motor para similitud vectorial.',
        },
        after: {
          en: 'An approximate vector index prepares candidate search inside SQL Server.',
          es: 'Un indice vectorial aproximado prepara la busqueda de candidatos dentro de SQL Server.',
        },
      },
      {
        id: 'query',
        label: { en: 'Similarity query', es: 'Consulta de similitud' },
        before: {
          en: 'The app must orchestrate a second platform to find nearest neighbors.',
          es: 'La app debe orquestar una segunda plataforma para encontrar vecinos cercanos.',
        },
        after: {
          en: 'The query vector can search candidates directly from the relational platform.',
          es: 'El vector de consulta puede buscar candidatos directamente desde la plataforma relacional.',
        },
      },
      {
        id: 'join',
        label: { en: 'Relational join back', es: 'Join de vuelta a relacional' },
        before: {
          en: 'Returning to the relational row set requires cross-system stitching.',
          es: 'Volver al conjunto relacional exige coser datos entre sistemas.',
        },
        after: {
          en: 'Candidate ids stay close to the relational rows you already need.',
          es: 'Los ids candidatos se quedan cerca de las filas relacionales que ya necesitas.',
        },
      },
    ],
    metrics: [
      { label: { en: 'Cross-system hops', es: 'Saltos entre sistemas' }, before: 91, after: 23, unit: '%', preference: 'lower' },
      { label: { en: 'Retrieval latency', es: 'Latencia de retrieval' }, before: 76, after: 39, unit: '%', preference: 'lower' },
      { label: { en: 'Platform cohesion', es: 'Cohesion de plataforma' }, before: 31, after: 86, unit: '%', preference: 'higher' },
    ],
    watchpoints: [
      { en: 'Vector features solve similarity search, not every lookup pattern.', es: 'Las features vectoriales resuelven similitud, no cualquier lookup.' },
      { en: 'Approximate indexes trade exactness for speed. Validate recall against the business need.', es: 'Los indices aproximados intercambian exactitud por velocidad. Valida el recall segun la necesidad de negocio.' },
    ],
    script: `SELECT name,
       type_desc
FROM sys.objects
WHERE type_desc LIKE '%INDEX%'
ORDER BY name;`,
  },
  {
    id: 'zstd',
    release: '2025',
    title: { en: 'ZSTD backup compression', es: 'Compresion ZSTD en backups' },
    summary: {
      en: 'Pushes backup throughput and compression efficiency forward for large fleets and tight windows.',
      es: 'Empuja throughput y eficiencia de compresion en backups para flotas grandes y ventanas estrechas.',
    },
    detail: {
      en: 'Faster compression with better ratios changes backup windows, storage bills and restore logistics at scale.',
      es: 'Una compresion mas rapida y con mejor ratio cambia ventanas de backup, coste de almacenamiento y logistica de restore a escala.',
    },
    scenario: {
      en: 'A platform team backs up dozens of multi-terabyte databases every night.',
      es: 'Un equipo de plataforma hace backup cada noche de decenas de bases de varios terabytes.',
    },
    icon: 'Archive',
    tone: 'emerald',
    badges: ['ZSTD', 'Backup window', 'Storage cost'],
    stages: [
      {
        id: 'scan',
        label: { en: 'Backup scan', es: 'Escaneo del backup' },
        before: {
          en: 'Traditional compression pushes more time and CPU per protected GB.',
          es: 'La compresion tradicional empuja mas tiempo y CPU por cada GB protegido.',
        },
        after: {
          en: 'The backup stream enters a more efficient compression path.',
          es: 'El backup entra en una ruta de compresion mas eficiente.',
        },
      },
      {
        id: 'compress',
        label: { en: 'Compression step', es: 'Paso de compresion' },
        before: {
          en: 'Compression ratio or speed becomes the limiting factor of the window.',
          es: 'El ratio o la velocidad de compresion se convierten en el cuello de la ventana.',
        },
        after: {
          en: 'ZSTD improves the tradeoff between speed and size.',
          es: 'ZSTD mejora el equilibrio entre velocidad y tamano.',
        },
      },
      {
        id: 'write',
        label: { en: 'Write to media', es: 'Escritura a destino' },
        before: {
          en: 'More bytes and longer elapsed time increase storage pressure.',
          es: 'Mas bytes y mas tiempo elevan la presion de almacenamiento.',
        },
        after: {
          en: 'Fewer bytes leave the engine and the backup window tightens.',
          es: 'Salen menos bytes del motor y la ventana de backup se estrecha.',
        },
      },
      {
        id: 'fleet',
        label: { en: 'Fleet operations', es: 'Operacion de flota' },
        before: {
          en: 'Nightly backup schedules fight each other for the same infrastructure.',
          es: 'Los horarios nocturnos de backup pelean entre si por la misma infraestructura.',
        },
        after: {
          en: 'Backup logistics scale better across many databases and many servers.',
          es: 'La logistica del backup escala mejor entre muchas bases y muchos servidores.',
        },
      },
    ],
    metrics: [
      { label: { en: 'Backup window', es: 'Ventana de backup' }, before: 84, after: 47, unit: '%', preference: 'lower' },
      { label: { en: 'Stored bytes', es: 'Bytes almacenados' }, before: 79, after: 42, unit: '%', preference: 'lower' },
      { label: { en: 'Fleet efficiency', es: 'Eficiencia de flota' }, before: 37, after: 83, unit: '%', preference: 'higher' },
    ],
    watchpoints: [
      { en: 'Measure on your own hardware. Compression is still a CPU vs I/O trade.', es: 'Mide en tu propio hardware. La compresion sigue siendo un equilibrio CPU vs I/O.' },
      { en: 'Backup is not only speed. Test restore time and downstream tooling compatibility too.', es: 'Backup no es solo velocidad. Prueba tambien restore y compatibilidad del tooling aguas abajo.' },
    ],
    script: `BACKUP DATABASE SalesDB
TO DISK = 'X:\\Backups\\SalesDB_full.bak'
WITH COMPRESSION,
     STATS = 5;`,
  },
];
