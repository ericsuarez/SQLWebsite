import type { LocalizedText } from './advancedSQLData';

export type ReleaseAreaId = 'engine' | 'query' | 'ha' | 'security' | 'platform' | 'ops';

export interface ReleaseAreaMeta {
  icon: string;
  title: LocalizedText;
}

export const RELEASE_AREA_META: Record<ReleaseAreaId, ReleaseAreaMeta> = {
  engine: {
    icon: 'Database',
    title: { en: 'Engine & Storage', es: 'Motor y almacenamiento' },
  },
  query: {
    icon: 'Activity',
    title: { en: 'Query Processing', es: 'Procesamiento de consultas' },
  },
  ha: {
    icon: 'Layers',
    title: { en: 'HA / DR', es: 'Alta disponibilidad' },
  },
  security: {
    icon: 'Shield',
    title: { en: 'Security', es: 'Seguridad' },
  },
  platform: {
    icon: 'Server',
    title: { en: 'Platform', es: 'Plataforma' },
  },
  ops: {
    icon: 'Settings',
    title: { en: 'Operations', es: 'Operacion' },
  },
};

export interface ReleaseAreaDetail {
  id: ReleaseAreaId;
  summary: LocalizedText;
  details: LocalizedText;
  points: LocalizedText[];
  badges: string[];
}

// Deep, low-level notes per major release. Keeps UI code clean and i18n-friendly.
export const SQL_SERVER_RELEASE_AREAS: Record<string, ReleaseAreaDetail[]> = {
  '2025': [
    {
      id: 'engine',
      summary: {
        en: 'Operational efficiency wave: tempdb governance + ZSTD backup compression reduce pain under concurrency and heavy maintenance.',
        es: 'Ola de eficiencia operativa: tempdb governance + compresion ZSTD reducen dolor con concurrencia y mantenimiento pesado.',
      },
      details: {
        en: 'This branch leans into fleet operations: make tempdb behavior more predictable, improve backup throughput/cost, and raise defaults that matter under sustained load.',
        es: 'Esta rama se centra en operar flotas: hacer tempdb mas predecible, mejorar throughput/coste de backups y subir defaults que importan bajo carga sostenida.',
      },
      points: [
        { en: 'TempDB governance to keep allocation pressure predictable during bursts', es: 'Tempdb governance para que la presion de asignacion sea predecible en picos' },
        { en: 'ZSTD backup compression for higher throughput and lower storage cost', es: 'Compresion ZSTD en backups para mas throughput y menos coste' },
        { en: 'Edition changes (Standard/Express) shift capacity planning assumptions', es: 'Cambios de edicion (Standard/Express) cambian supuestos de capacity planning' },
      ],
      badges: ['TempDB governance', 'ZSTD', 'Servicing'],
    },
    {
      id: 'query',
      summary: {
        en: 'AI-era query primitives: vector type/index + regex and controlled external REST invocation.',
        es: 'Primitivas de era AI: tipo/index vector + regex e invocacion REST externa controlada.',
      },
      details: {
        en: 'Relational workloads increasingly blend with similarity search and richer text processing. Adding vector primitives and safer integration surfaces reduces the need to offload everything to separate systems.',
        es: 'Los workloads relacionales se mezclan cada vez mas con busqueda por similitud y procesamiento de texto. Con primitivas vectoriales e integracion segura, reduces el offload a sistemas separados.',
      },
      points: [
        { en: 'Vector data type and functions for embedding workloads', es: 'Tipo vector y funciones para workloads de embeddings' },
        { en: 'Approximate vector index to accelerate similarity search', es: 'Indice vectorial aproximado para acelerar busqueda por similitud' },
        { en: 'Regex functions reduce CLR or app-side parsing overhead', es: 'Funciones regex reducen necesidad de CLR o parsing en la app' },
        { en: 'External REST endpoint invocation for controlled integrations', es: 'Invocacion de endpoints REST externos para integraciones controladas' },
      ],
      badges: ['Vectors', 'Regex', 'REST'],
    },
    {
      id: 'ha',
      summary: {
        en: 'HA is less about new primitives and more about safe fleet behavior: predictable patching, observability, and governance.',
        es: 'HA es menos primitivas nuevas y mas operacion segura de flota: parcheo predecible, observabilidad y gobierno.',
      },
      details: {
        en: 'At this maturity stage, Availability Groups remain the anchor. The differentiator is how safely you can operate upgrades and keep secondaries usable without surprises.',
        es: 'A este nivel de madurez, Availability Groups siguen siendo el ancla. La diferencia es operar upgrades de forma segura y usar secundarias sin sorpresas.',
      },
      points: [
        { en: 'Fleet-level patterns: automate patching and validate fast', es: 'Patrones de flota: automatiza parcheo y valida rapido' },
        { en: 'Treat secondaries as first-class (visibility + plan governance)', es: 'Trata secundarias como first-class (visibilidad + gobierno de planes)' },
      ],
      badges: ['Fleet HA', 'Governance'],
    },
    {
      id: 'security',
      summary: {
        en: 'Transport and defaults advance: TDS 8.0 + TLS 1.3 and stronger modern baselines.',
        es: 'Avanzan transporte y defaults: TDS 8.0 + TLS 1.3 y baselines modernas mas fuertes.',
      },
      details: {
        en: 'Security becomes defaults-first: stronger transport, better baseline posture, and integration features that keep isolation boundaries intact.',
        es: 'La seguridad pasa a defaults-first: transporte mas fuerte, mejor baseline y features de integracion sin romper aislamiento.',
      },
      points: [
        { en: 'TDS 8.0 with TLS 1.3 for modern transport security', es: 'TDS 8.0 con TLS 1.3 para seguridad de transporte moderna' },
        { en: 'Policy-driven hardening and safer out-of-the-box posture', es: 'Hardening por politicas y postura mas segura por defecto' },
      ],
      badges: ['TLS 1.3', 'Defaults'],
    },
    {
      id: 'platform',
      summary: {
        en: 'Platform integration expands: AI workflows, endpoints, and new primitives become part of the core product story.',
        es: 'Se expande la integracion de plataforma: workflows AI, endpoints y nuevas primitivas forman parte del core.',
      },
      details: {
        en: 'Modern SQL Server is operated as part of a platform, not a standalone box. Integration must be safe, observable, and predictable across environments.',
        es: 'SQL Server moderno se opera como parte de una plataforma, no como una caja aislada. La integracion debe ser segura, observable y predecible.',
      },
      points: [
        { en: 'External REST integration surfaces to connect services safely', es: 'Superficies REST externas para conectar servicios de forma segura' },
        { en: 'Vector primitives for AI-assisted application architectures', es: 'Primitivas vectoriales para arquitecturas con AI' },
      ],
      badges: ['Integration', 'AI platform'],
    },
    {
      id: 'ops',
      summary: {
        en: 'Version choice becomes ops-first: edition limits, servicing strategy, and stability controls dominate the decision.',
        es: 'Elegir version pasa a ser ops-first: limites por edicion, estrategia de servicing y controles de estabilidad dominan.',
      },
      details: {
        en: 'Features matter, but what your team can operate matters more: patch cadence, security posture, and predictable performance under change.',
        es: 'Las features importan, pero importa mas lo que tu equipo puede operar: cadence de parcheo, postura de seguridad y rendimiento predecible con cambios.',
      },
      points: [
        { en: 'Define CU/GDR policy and test strategy as part of SLOs', es: 'Define politica CU/GDR y estrategia de pruebas como parte de SLOs' },
        { en: 'Re-check edition caps (Standard/Express) and align with growth plans', es: 'Revisa limites por edicion (Standard/Express) y alinialos con crecimiento' },
      ],
      badges: ['Servicing', 'Edition limits'],
    },
  ],
  '2022': [
    {
      id: 'engine',
      summary: {
        en: 'Azure-connected engine: safer defaults (Query Store), internal VLF improvements, and hybrid capabilities.',
        es: 'Motor conectado con Azure: defaults mas seguros (Query Store), mejoras internas de VLFs y capacidades hibridas.',
      },
      details: {
        en: '2022 prioritizes resilience: keep plan history by default, improve internals that reduce recovery friction, and connect to Azure services without giving up on-prem control.',
        es: '2022 prioriza resiliencia: historial de planes por defecto, internos que reducen friccion en recovery y conexion con Azure sin perder control on-prem.',
      },
      points: [
        { en: 'Query Store enabled by default for new databases', es: 'Query Store habilitado por defecto en bases nuevas' },
        { en: 'VLF creation improvements reduce log over-fragmentation risk', es: 'Mejoras de creacion de VLFs reducen riesgo de sobre-fragmentacion' },
        { en: 'Hybrid ties such as Managed Instance link', es: 'Conexiones hibridas como Managed Instance link' },
      ],
      badges: ['Query Store default', 'VLFs', 'Hybrid'],
    },
    {
      id: 'query',
      summary: {
        en: 'Plan stability jumps: PSP optimization, DOP feedback and Query Store hints make tuning more surgical.',
        es: 'Salto en estabilidad: PSP optimization, DOP feedback y Query Store hints hacen el tuning mas quirurgico.',
      },
      details: {
        en: '2022 improves real-world plan behavior under skewed parameters and runtime variability. It also gives DBAs "governance knobs" to steer plan choices with evidence.',
        es: '2022 mejora el comportamiento real con parametros sesgados y variabilidad en runtime. Y da al DBA palancas de gobierno para guiar planes con evidencia.',
      },
      points: [
        { en: 'Parameter Sensitive Plan (PSP) optimization reduces parameter sniffing pain', es: 'Parameter Sensitive Plan (PSP) reduce dolor de parameter sniffing' },
        { en: 'DOP feedback adapts parallelism based on observed behavior', es: 'DOP feedback adapta paralelismo segun comportamiento observado' },
        { en: 'Query Store hints and better Query Store surfaces', es: 'Query Store hints y mejores superficies de Query Store' },
      ],
      badges: ['PSP', 'DOP feedback', 'Query Store'],
    },
    {
      id: 'ha',
      summary: {
        en: 'Secondaries become more "first-class": Query Store runs on readable replicas and hybrid patterns improve.',
        es: 'Secundarias mas first-class: Query Store en replicas legibles y mejores patrones hibridos.',
      },
      details: {
        en: 'If you offload reads to secondaries, you need the same visibility and governance. 2022 closes that gap and makes hybrid HA more practical for large estates.',
        es: 'Si haces offload de lecturas a secundarias, necesitas la misma visibilidad y gobierno. 2022 cierra esa brecha y hace HA hibrida mas practica.',
      },
      points: [
        { en: 'Query Store on readable secondaries', es: 'Query Store en secundarias legibles' },
        { en: 'Better hybrid story via Azure integration', es: 'Mejor historia hibrida via integracion con Azure' },
      ],
      badges: ['Secondaries', 'Hybrid HA'],
    },
    {
      id: 'security',
      summary: {
        en: 'Ledger era: integrity and tamper-evidence join encryption as core enterprise requirements.',
        es: 'Era Ledger: integridad y evidencia anti-manipulacion se suman al cifrado como requisito enterprise.',
      },
      details: {
        en: 'Ledger brings cryptographic proofs to relational systems. It complements encryption-at-rest/in-use features and supports regulated workloads needing stronger integrity guarantees.',
        es: 'Ledger trae pruebas criptograficas a sistemas relacionales. Complementa cifrado en reposo/en uso y soporta workloads regulados con mas garantias de integridad.',
      },
      points: [
        { en: 'Ledger for tamper-evidence workflows', es: 'Ledger para workflows de evidencia anti-manipulacion' },
        { en: 'Security posture continues improving for encrypted workloads', es: 'La postura de seguridad sigue mejorando para workloads cifrados' },
      ],
      badges: ['Ledger', 'Integrity'],
    },
    {
      id: 'platform',
      summary: {
        en: 'Hybrid platform: Managed Instance link and Azure-connected capabilities become central.',
        es: 'Plataforma hibrida: Managed Instance link y capacidades conectadas con Azure pasan a ser centrales.',
      },
      details: {
        en: 'This is the release that assumes hybrid is normal. It targets smoother transitions, shared governance, and better interoperability with Azure-managed services.',
        es: 'Este release asume que lo hibrido es normal. Apunta a transiciones mas suaves, gobierno compartido e interoperabilidad con servicios gestionados en Azure.',
      },
      points: [
        { en: 'Managed Instance link and connected services', es: 'Managed Instance link y servicios conectados' },
        { en: 'Cross-environment observability expectations', es: 'Expectativas de observabilidad cross-entorno' },
      ],
      badges: ['Azure', 'Hybrid'],
    },
    {
      id: 'ops',
      summary: {
        en: 'Ops maturity: plan governance as a product feature, plus safer defaults and richer diagnostics.',
        es: 'Madurez ops: gobierno de planes como feature del producto, defaults mas seguros y mejor diagnostico.',
      },
      details: {
        en: 'The real win is fewer operational foot-guns: Query Store by default, more plan stability controls, and better visibility across replicas and fleets.',
        es: 'La ganancia real es menos trampas operativas: Query Store por defecto, mas control de estabilidad y mejor visibilidad en replicas y flotas.',
      },
      points: [
        { en: 'Use Query Store to govern change across deployments and upgrades', es: 'Usa Query Store para gobernar cambios entre despliegues y upgrades' },
        { en: 'Treat stability controls as part of SRE/DBA discipline', es: 'Trata controles de estabilidad como disciplina SRE/DBA' },
      ],
      badges: ['Governance', 'Defaults'],
    },
  ],
  '2019': [
    {
      id: 'engine',
      summary: {
        en: 'Intelligent database wave: ADR + memory-optimized tempdb metadata tackle two classic production pain points.',
        es: 'Ola de base de datos inteligente: ADR + tempdb metadata memory-optimized atacan dos dolores clasicos de produccion.',
      },
      details: {
        en: '2019 delivers a tangible ops payoff for OLTP: crash recovery and rollback become less scary (ADR), and tempdb allocation contention can be reduced dramatically.',
        es: '2019 trae un payoff operativo claro en OLTP: crash recovery y rollback dan menos miedo (ADR) y la contencion de asignacion en tempdb puede bajar mucho.',
      },
      points: [
        { en: 'Accelerated Database Recovery (ADR) redesigns rollback and recovery economics', es: 'Accelerated Database Recovery (ADR) redisenia la economia de rollback y recovery' },
        { en: 'Memory-optimized tempdb metadata reduces PAGELATCH contention on allocation pages', es: 'Tempdb metadata memory-optimized reduce contencion PAGELATCH en paginas de asignacion' },
        { en: 'UTF-8 support broadens collation/storage flexibility', es: 'Soporte UTF-8 amplia flexibilidad de collations/storage' },
      ],
      badges: ['ADR', 'TempDB', 'UTF-8'],
    },
    {
      id: 'query',
      summary: {
        en: 'IQP expands: batch mode on rowstore and table variable deferred compilation make plans more stable by default.',
        es: 'IQP se amplia: batch mode en rowstore y deferred compilation en table variables hacen planes mas estables por defecto.',
      },
      details: {
        en: '2019 reduces common plan pathologies without rewriting queries. The optimizer and runtime learn better row counts and pick safer operator choices for mixed workloads.',
        es: '2019 reduce patologias comunes sin reescribir queries. Optimizador y runtime aprenden mejores cardinalidades y eligen operadores mas seguros en workloads mixtos.',
      },
      points: [
        { en: 'Batch mode on rowstore accelerates analytics on classic B-Tree tables', es: 'Batch mode en rowstore acelera analitica en tablas B-Tree clasicas' },
        { en: 'Table variable deferred compilation improves row estimates', es: 'Deferred compilation en table variables mejora estimaciones' },
        { en: 'More runtime feedback loops reduce spills and regressions', es: 'Mas feedback en runtime reduce spills y regresiones' },
      ],
      badges: ['IQP', 'Batch mode'],
    },
    {
      id: 'ha',
      summary: {
        en: 'A stable modern HA baseline: AG estates pair well with ADR/IQP improvements for real-world production.',
        es: 'Baseline HA moderno estable: entornos con AG se benefician de ADR/IQP en produccion real.',
      },
      details: {
        en: 'Many teams land on 2019 as a "modern but mature" branch: strong engine incentives and a servicing model that is well understood.',
        es: 'Muchos equipos aterrizan en 2019 como rama moderna pero madura: incentivos fuertes del motor y un servicing bien entendido.',
      },
      points: [
        { en: 'AG operational patterns stabilize with mature tooling and runbooks', es: 'Patrones operativos de AG se estabilizan con tooling y runbooks maduros' },
        { en: 'Secondaries become more usable for offloading reads', es: 'Las secundarias se vuelven mas utiles para offload de lectura' },
      ],
      badges: ['AG', 'Stability'],
    },
    {
      id: 'security',
      summary: {
        en: 'Encrypted workloads become more practical: secure enclaves expand Always Encrypted usability.',
        es: 'Workloads cifrados mas practicos: secure enclaves amplian usabilidad de Always Encrypted.',
      },
      details: {
        en: 'Always Encrypted with secure enclaves enables richer operations on protected data, narrowing the gap between security goals and developer usability.',
        es: 'Always Encrypted con secure enclaves permite mas operaciones sobre datos protegidos, cerrando brecha entre seguridad y usabilidad.',
      },
      points: [
        { en: 'Secure enclaves for broader query support on encrypted columns', es: 'Secure enclaves para mas soporte de queries en columnas cifradas' },
        { en: 'Better baseline security posture and auditing patterns', es: 'Mejor baseline de seguridad y patrones de auditoria' },
      ],
      badges: ['Encrypted', 'Enclaves'],
    },
    {
      id: 'platform',
      summary: {
        en: 'Hybrid and data platform expansion: polyglot data access, external tables, and Big Data Cluster-era patterns.',
        es: 'Expansion hibrida y de plataforma: acceso poliglota, external tables y patrones de era Big Data Cluster.',
      },
      details: {
        en: '2019 pushes SQL Server into broader ecosystems: virtualization of external data and Kubernetes-oriented deployment stories appear alongside classic engine operations.',
        es: '2019 empuja SQL Server a ecosistemas mas amplios: virtualizacion de datos externos y despliegue orientado a Kubernetes conviven con la operacion clasica.',
      },
      points: [
        { en: 'Data virtualization and external table patterns', es: 'Data virtualization y patrones de external tables' },
        { en: 'Big Data Cluster-era deployments and hybrid compute concepts', es: 'Despliegues de era Big Data Cluster y conceptos de compute hibrido' },
      ],
      badges: ['Hybrid', 'Platform'],
    },
    {
      id: 'ops',
      summary: {
        en: 'A strong production baseline: CU servicing + Query Store + ADR/IQP change the ROI of upgrading.',
        es: 'Un baseline fuerte de produccion: servicing por CU + Query Store + ADR/IQP cambian el ROI de actualizar.',
      },
      details: {
        en: 'Operationally, 2019 is often the "sweet spot": modern internals with a mature ecosystem and clear reasons to move off legacy branches.',
        es: 'Operativamente, 2019 suele ser el punto dulce: internos modernos con ecosistema maduro y razones claras para salir de legacy.',
      },
      points: [
        { en: 'Adopt Query Store as the standard and use it to validate upgrades', es: 'Estandariza Query Store y usalo para validar upgrades' },
        { en: 'Treat ADR as an ops feature (faster recovery), not only performance', es: 'Trata ADR como feature ops (recovery mas rapido), no solo rendimiento' },
      ],
      badges: ['Baseline', 'Upgrade ROI'],
    },
  ],
  '2017': [
    {
      id: 'engine',
      summary: {
        en: 'Cross-platform milestone: SQL Server reaches Linux/containers, plus engine features that reduce downtime like resumable index rebuild.',
        es: 'Hito cross-platform: SQL Server llega a Linux/containers, y aparecen features para reducir downtime como resumable index rebuild.',
      },
      details: {
        en: '2017 changes deployment reality. You can standardize the engine across OS footprints and adopt modern delivery patterns. It also introduces practical engine improvements that help large maintenance operations.',
        es: '2017 cambia la realidad de despliegue. Puedes estandarizar el motor en distintos SO y adoptar patrones modernos. Ademas trae mejoras practicas para mantenimientos grandes.',
      },
      points: [
        { en: 'SQL Server on Linux (SQLPAL) and containerized deployments', es: 'SQL Server en Linux (SQLPAL) y despliegue en contenedores' },
        { en: 'Resumable online index rebuild to survive interruptions', es: 'Resumable online index rebuild para sobrevivir interrupciones' },
        { en: 'Graph tables for relationship modeling', es: 'Graph tables para modelar relaciones' },
      ],
      badges: ['Linux', 'Containers', 'Resumable'],
    },
    {
      id: 'query',
      summary: {
        en: 'Adaptive Query Processing begins: runtime feedback reduces common plan failures (spills, bad joins, bad estimates).',
        es: 'Arranca Adaptive Query Processing: feedback en runtime reduce fallos comunes (spills, joins malos, malas estimaciones).',
      },
      details: {
        en: 'This is the first big IQP step: the engine learns from runtime and adjusts future executions. It shifts performance from purely static plans to adaptive behavior.',
        es: 'Es el primer gran paso de IQP: el motor aprende del runtime y ajusta ejecuciones futuras. Pasa de planes estaticos a comportamiento adaptativo.',
      },
      points: [
        { en: 'Memory grant feedback reduces spills and over-grants across executions', es: 'Memory grant feedback reduce spills y over-grants' },
        { en: 'Adaptive joins switch join strategy based on actual row counts', es: 'Adaptive joins cambia estrategia segun rows reales' },
        { en: 'Interleaved execution improves estimates for multi-statement TVFs', es: 'Interleaved execution mejora estimaciones en multi-statement TVFs' },
      ],
      badges: ['IQP', 'Adaptive'],
    },
    {
      id: 'ha',
      summary: {
        en: 'HA patterns expand into new footprints; the same logical AG concepts can be operated across broader infrastructure.',
        es: 'Los patrones HA se expanden a nuevos footprints; los conceptos de AG se operan en infra mas amplia.',
      },
      details: {
        en: 'Cross-platform deployments reshape HA operations: more automation, more standardization, and faster iteration, especially in container-style environments.',
        es: 'El despliegue cross-platform cambia la operacion HA: mas automatizacion, mas estandarizacion y ciclos mas rapidos, sobre todo en entornos tipo contenedor.',
      },
      points: [
        { en: 'Standardize HA topologies across OS boundaries', es: 'Estandariza topologias HA entre distintos SO' },
        { en: 'Operational focus: patch cadence and automation', es: 'Foco operativo: cadence de parcheo y automatizacion' },
      ],
      badges: ['Cross-platform', 'HA ops'],
    },
    {
      id: 'security',
      summary: {
        en: 'Security posture becomes more baseline-driven as the platform expands beyond classic Windows-only deployments.',
        es: 'La postura de seguridad se vuelve mas baseline-driven al salir del mundo Windows-only clasico.',
      },
      details: {
        en: 'Running on Linux/containers changes identity, patching and hardening workflows. Security becomes part of delivery automation rather than a one-time configuration step.',
        es: 'Ejecutar en Linux/containers cambia identidad, parcheo y hardening. La seguridad pasa a estar dentro de la automatizacion de despliegue.',
      },
      points: [
        { en: 'Hardening and identity practices adapt to Linux/container deployments', es: 'Hardening e identidad se adaptan a Linux/containers' },
        { en: 'Standardize transport encryption and configuration baselines', es: 'Estandariza cifrado de transporte y baselines de configuracion' },
      ],
      badges: ['Hardening', 'Baselines'],
    },
    {
      id: 'platform',
      summary: {
        en: 'Platform becomes a feature: Linux + Docker unlock CI/CD and ephemeral test environments.',
        es: 'La plataforma se vuelve feature: Linux + Docker desbloquean CI/CD y entornos de test efimeros.',
      },
      details: {
        en: '2017 is the release that changes how SQL Server is consumed: standardized images, infra-as-code, and easier reproducibility across dev/test/prod.',
        es: '2017 cambia como se consume SQL Server: imagenes estandar, infra-as-code y mas reproducibilidad entre dev/test/prod.',
      },
      points: [
        { en: 'Container images reduce drift and speed provisioning', es: 'Imagenes de contenedor reducen drift y aceleran provision' },
        { en: 'Linux footprints broaden where the engine can run', es: 'Linux amplia donde puede correr el motor' },
      ],
      badges: ['SQLPAL', 'DevOps'],
    },
    {
      id: 'ops',
      summary: {
        en: 'CU-first era becomes normal: operational excellence shifts to frequent patching, validation automation and observability pipelines.',
        es: 'Se normaliza la era CU-first: excelencia operativa pasa a parcheo frecuente, validacion automatizada y observabilidad.',
      },
      details: {
        en: 'In cross-platform estates, you win by being consistent: image builds, configuration baselines, and fast pre-prod validation. The engine becomes part of your delivery system.',
        es: 'En entornos cross-platform, ganas con consistencia: builds de imagen, baselines y validacion rapida en pre. El motor forma parte del sistema de delivery.',
      },
      points: [
        { en: 'Adopt disciplined CU patching with rapid regression checks', es: 'Adopta parcheo por CU con checks rapidos de regresion' },
        { en: 'Treat deployment artifacts (images, configs) as versioned assets', es: 'Trata artefactos (imagenes, configs) como assets versionados' },
      ],
      badges: ['CU model', 'Automation'],
    },
  ],
  '2016': [
    {
      id: 'engine',
      summary: {
        en: 'Operational leap: Query Store + temporal tables + JSON, plus a major security wave (Always Encrypted, RLS, DDM).',
        es: 'Salto operativo: Query Store + temporal tables + JSON, y gran ola de seguridad (Always Encrypted, RLS, DDM).',
      },
      details: {
        en: '2016 changes daily DBA life. Query Store provides plan history and runtime stats so you can diagnose regressions with evidence. The release also pushes the engine into modern app patterns with temporal + JSON.',
        es: '2016 cambia el dia a dia del DBA. Query Store da historial de planes y runtime para diagnosticar regresiones con evidencia. Ademas empuja el motor hacia patrones modernos con temporal + JSON.',
      },
      points: [
        { en: 'Query Store: plan history, runtime stats, and plan forcing', es: 'Query Store: historial, runtime stats y plan forcing' },
        { en: 'Temporal tables for time-travel/audit patterns', es: 'Temporal tables para patrones de auditoria y time-travel' },
        { en: 'JSON functions for modern payloads', es: 'Funciones JSON para payloads modernos' },
        { en: 'PolyBase and integration patterns', es: 'PolyBase y patrones de integracion' },
      ],
      badges: ['Query Store', 'Temporal', 'JSON'],
    },
    {
      id: 'query',
      summary: {
        en: 'Query Store turns "what changed?" into a measurable workflow: compare plans, detect regressions, force stability.',
        es: 'Query Store convierte "que cambio?" en workflow medible: comparas planes, detectas regresiones y fuerzas estabilidad.',
      },
      details: {
        en: 'This is a foundational capability for long-lived systems. It reduces guesswork, enables baselining, and gives teams a safer upgrade story going forward.',
        es: 'Capacidad base para sistemas longevos. Reduce el guesswork, habilita baselines y hace mas seguro actualizar a futuro.',
      },
      points: [
        { en: 'Plan forcing as a last-resort stabilization lever', es: 'Plan forcing como palanca de estabilizacion' },
        { en: 'Runtime stats per plan enable evidence-based tuning', es: 'Runtime stats por plan para tuning basado en evidencia' },
        { en: 'Better diagnosis of parameter sniffing and plan regressions', es: 'Mejor diagnostico de parameter sniffing y regresiones de plan' },
      ],
      badges: ['Plan forcing', 'Baselines'],
    },
    {
      id: 'ha',
      summary: {
        en: 'AG estates mature further; many teams standardize on 2016 as a stable long-term HA platform.',
        es: 'Los entornos con AG maduran; muchos equipos estandarizan en 2016 como plataforma HA estable a largo plazo.',
      },
      details: {
        en: '2016 often becomes a "workhorse" release: strong feature set, mature HA operations, and a servicing story many teams can sustain.',
        es: '2016 suele ser release de batalla: buen set de features, HA madura y servicing sostenible para equipos.',
      },
      points: [
        { en: 'Refinements that make AG operations more practical at scale', es: 'Refinamientos que hacen AG mas practico a escala' },
        { en: 'Better operational discipline around failover and monitoring', es: 'Mas disciplina operativa en failover y monitorizacion' },
      ],
      badges: ['HA maturity'],
    },
    {
      id: 'security',
      summary: {
        en: 'Major security wave: Always Encrypted, Row-Level Security, Dynamic Data Masking and improved auditing patterns.',
        es: 'Gran ola de seguridad: Always Encrypted, Row-Level Security, Dynamic Data Masking y mejores patrones de auditoria.',
      },
      details: {
        en: 'Security moves closer to the data. Instead of relying only on apps and perimeter, you can enforce access rules and protect sensitive columns at the engine level.',
        es: 'La seguridad se acerca al dato. En vez de depender solo de app y perimetro, puedes imponer reglas y proteger columnas sensibles en el motor.',
      },
      points: [
        { en: 'Always Encrypted protects sensitive columns from DBA visibility (client-side keys)', es: 'Always Encrypted protege columnas sensibles (keys en cliente)' },
        { en: 'Row-Level Security (RLS) for predicate-based access control', es: 'RLS para control de acceso por predicados' },
        { en: 'Dynamic Data Masking (DDM) for low-friction obfuscation', es: 'DDM para ofuscacion rapida' },
      ],
      badges: ['Always Encrypted', 'RLS', 'DDM'],
    },
    {
      id: 'platform',
      summary: {
        en: 'Modern data platform direction: JSON + PolyBase expand integration without abandoning relational guarantees.',
        es: 'Direccion de plataforma moderna: JSON + PolyBase amplian integracion sin perder garantias relacionales.',
      },
      details: {
        en: '2016 helps teams keep SQL Server as the trusted core while integrating semi-structured payloads and external sources more naturally.',
        es: '2016 ayuda a mantener SQL Server como core confiable integrando payloads semi-estructurados y fuentes externas con mas naturalidad.',
      },
      points: [
        { en: 'PolyBase external data patterns', es: 'Patrones PolyBase de datos externos' },
        { en: 'JSON interoperability for modern apps', es: 'Interoperabilidad JSON para apps modernas' },
      ],
      badges: ['Integration'],
    },
    {
      id: 'ops',
      summary: {
        en: 'Operationally transformative: Query Store turns performance triage into repeatable process.',
        es: 'Transformador en operacion: Query Store convierte triage de rendimiento en proceso repetible.',
      },
      details: {
        en: 'Once you have plan history, upgrades and changes are safer: you can detect regressions quickly and make decisions based on data.',
        es: 'Con historial de planes, upgrades y cambios son mas seguros: detectas regresiones rapido y decides con datos.',
      },
      points: [
        { en: 'Start capturing plan baselines before major upgrades', es: 'Empieza a capturar baselines de plan antes de upgrades' },
        { en: 'Codify tuning workflows (regression detection, plan forcing guardrails)', es: 'Estandariza workflows (detectar regresion, guardrails de forcing)' },
      ],
      badges: ['Operational leverage'],
    },
  ],
  '2014': [
    {
      id: 'engine',
      summary: {
        en: 'Bold performance branch: In-Memory OLTP (Hekaton) + clustered columnstore raise ceilings for OLTP and analytics.',
        es: 'Rama de rendimiento ambiciosa: In-Memory OLTP (Hekaton) + clustered columnstore suben el techo para OLTP y analitica.',
      },
      details: {
        en: '2014 is remembered for changing the "possible" performance envelope. Memory-optimized tables alter latching/logging behavior, while clustered columnstore brings compression and batch processing to mainstream analytics.',
        es: '2014 se recuerda por cambiar el techo de rendimiento. Las tablas memory-optimized alteran latching/logging, y clustered columnstore trae compresion y batch processing a la analitica.',
      },
      points: [
        { en: 'In-Memory OLTP: memory-optimized tables and natively compiled procs', es: 'In-Memory OLTP: tablas memory-optimized y procs nativas' },
        { en: 'Clustered columnstore for compression + batch execution', es: 'Clustered columnstore para compresion + batch execution' },
        { en: 'Buffer Pool Extension (SSD as read cache) for specific IO profiles', es: 'Buffer Pool Extension (SSD como read cache) para perfiles de IO concretos' },
        { en: 'Compatibility level 120 introduces the New Cardinality Estimator', es: 'Compatibility level 120 introduce el Nuevo Cardinality Estimator' },
      ],
      badges: ['Hekaton', 'Columnstore', 'New CE'],
    },
    {
      id: 'query',
      summary: {
        en: 'The New Cardinality Estimator (CE) changes plan choices and makes upgrade testing non-negotiable.',
        es: 'El Nuevo Cardinality Estimator (CE) cambia planes y hace obligatorio probar upgrades.',
      },
      details: {
        en: 'New CE improves many workloads but can regress others. Compatibility level becomes a safe rollout lever, and Query Store (later) becomes the natural companion for governance.',
        es: 'El nuevo CE mejora muchos workloads pero puede empeorar otros. El compatibility level se vuelve palanca de rollout y Query Store (despues) sera el aliado natural de gobierno.',
      },
      points: [
        { en: 'Upgrade risk: CE changes join order, memory grants and operator selection', es: 'Riesgo: el CE cambia join order, memory grants y operadores' },
        { en: 'Incremental statistics for partitioned tables improve manageability', es: 'Stats incrementales en tablas particionadas mejoran manageability' },
        { en: 'Batch mode execution accelerates scans/aggregations for analytics', es: 'Batch mode acelera scans/agregaciones en analitica' },
      ],
      badges: ['CE', 'Batch mode'],
    },
    {
      id: 'ha',
      summary: {
        en: 'AG adoption accelerates: refinements make HA operations more practical after the 2012 redesign.',
        es: 'Acelera adopcion de AG: refinamientos hacen HA mas practica tras el redisenio de 2012.',
      },
      details: {
        en: 'While AGs arrive in 2012, 2014 helps with "day 2" adoption: operational patterns, performance, and practical secondary usage keep improving.',
        es: 'AG llega en 2012, pero 2014 ayuda en el dia 2: patrones operativos, rendimiento y uso de secundarias siguen mejorando.',
      },
      points: [
        { en: 'More mature AG deployments and operational comfort', es: 'Despliegues AG mas maduros y mas comodidad operativa' },
        { en: 'Secondary usage patterns become more common', es: 'Patrones de uso de secundarias mas comunes' },
      ],
      badges: ['AG maturity'],
    },
    {
      id: 'security',
      summary: {
        en: 'Security continues evolving, but 2014 is remembered more for performance than policy.',
        es: 'La seguridad sigue evolucionando, pero 2014 se recuerda mas por rendimiento que por politicas.',
      },
      details: {
        en: 'Enterprises keep strengthening encryption and auditing, yet the defining narrative of 2014 is the new performance direction rather than a security wave.',
        es: 'Las empresas siguen reforzando cifrado y auditoria, pero la narrativa principal de 2014 es rendimiento, no seguridad.',
      },
      points: [
        { en: 'Stronger auditing and encryption hygiene become more common', es: 'Higiene de auditoria y cifrado mas comun' },
      ],
      badges: ['Security evolution'],
    },
    {
      id: 'platform',
      summary: {
        en: 'Hybrid thinking grows: more estates blend on-prem with early cloud integration patterns.',
        es: 'Crece el pensamiento hibrido: mas entornos mezclan on-prem con patrones cloud tempranos.',
      },
      details: {
        en: '2014 is often the performance-driven refresh that sets up later hybrid capabilities. Hardware modernization and platform readiness go together.',
        es: '2014 suele ser el refresh impulsado por rendimiento que prepara hibridos posteriores. Modernizacion de hardware y plataforma van juntas.',
      },
      points: [
        { en: 'Performance features drive hardware refresh decisions', es: 'Features de rendimiento impulsan refresh de hardware' },
        { en: 'Early hybrid patterns start to normalize', es: 'Patrones hibridos tempranos se normalizan' },
      ],
      badges: ['Hybrid'],
    },
    {
      id: 'ops',
      summary: {
        en: 'Operational bar rises: CE + in-memory features require baselines, testing, and controlled rollouts.',
        es: 'Sube el liston operativo: CE + in-memory requieren baselines, pruebas y rollouts controlados.',
      },
      details: {
        en: 'Teams learn to treat performance changes as a discipline: capture baselines, roll upgrades gradually, and use compatibility level strategically.',
        es: 'Los equipos aprenden a tratar cambios de rendimiento como disciplina: capturar baselines, actualizar gradual y usar compatibility level de forma estrategica.',
      },
      points: [
        { en: 'Use compatibility level to de-risk CE changes', es: 'Usa compatibility level para reducir riesgo de cambios CE' },
        { en: 'Validate critical workloads (memory grants, joins, tempdb pressure) after upgrade', es: 'Valida workloads criticos (memory grants, joins, presion tempdb) tras upgrade' },
      ],
      badges: ['Testing', 'Baselines'],
    },
  ],
  '2012': [
    {
      id: 'engine',
      summary: {
        en: 'Enterprise pivot: Always On availability groups + first-wave columnstore reshape HA and analytics.',
        es: 'Pivot enterprise: Always On availability groups + primera ola de columnstore cambian HA y analitica.',
      },
      details: {
        en: '2012 is the redesign release. HA becomes database-centric with AGs and analytics gets a new acceleration path with columnstore. Many long-lived estates anchor their HA architecture here.',
        es: '2012 es el release de redisenio. HA pasa a ser mas centrado en base con AGs y la analitica gana aceleracion con columnstore. Muchas enterprises anclan aqui su arquitectura HA.',
      },
      points: [
        { en: 'Always On availability groups (AG) as the new HA/DR reference', es: 'Always On availability groups (AG) como referencia HA/DR' },
        { en: 'Columnstore (first generation) for analytics acceleration', es: 'Columnstore (primera generacion) para acelerar analitica' },
        { en: 'Contained databases improve portability and reduce instance coupling', es: 'Contained databases mejoran portabilidad y reducen acoplamiento a instancia' },
      ],
      badges: ['AG', 'Columnstore', 'Enterprise'],
    },
    {
      id: 'query',
      summary: {
        en: 'T-SQL modernizes: richer windowing + paging constructs reduce complex workarounds.',
        es: 'T-SQL se moderniza: windowing + paging mas rico reduce workarounds complejos.',
      },
      details: {
        en: 'Language improvements change plan shapes and simplify common patterns (analytics, de-dup, paging). It reduces RBAR-like solutions and improves maintainability.',
        es: 'Las mejoras cambian la forma de los planes y simplifican patrones comunes (analitica, de-dup, paging). Reduce soluciones tipo RBAR y mejora mantenibilidad.',
      },
      points: [
        { en: 'LAG/LEAD and analytic window functions', es: 'LAG/LEAD y funciones analiticas window' },
        { en: 'OFFSET/FETCH paging support', es: 'Soporte de paging con OFFSET/FETCH' },
        { en: 'TRY_CONVERT, IIF, THROW for cleaner code', es: 'TRY_CONVERT, IIF, THROW para codigo mas limpio' },
      ],
      badges: ['Windowing', 'Paging'],
    },
    {
      id: 'ha',
      summary: {
        en: 'Availability Groups redefine HA/DR: multiple replicas, readable secondaries, listeners and new operational discipline.',
        es: 'Availability Groups redefinen HA/DR: multiples replicas, secundarias legibles, listeners y nueva disciplina operativa.',
      },
      details: {
        en: 'This is the shift from instance-focused HA to database-level protection and routing. It introduces new moving parts: quorum, cluster health, replica sync state and read routing.',
        es: 'Es el cambio de HA por instancia a proteccion a nivel base y routing. Introduce piezas nuevas: quorum, salud de cluster, estado de sincronizacion y read routing.',
      },
      points: [
        { en: 'Multiple replicas and flexible failover strategies', es: 'Multiples replicas y estrategias de failover flexibles' },
        { en: 'Readable secondaries for reporting/offload', es: 'Secundarias legibles para offload/reporting' },
        { en: 'New runbooks: seeding, listeners, backup preference, failover drills', es: 'Nuevos runbooks: seeding, listeners, backup preference, failover drills' },
      ],
      badges: ['AG', 'Runbooks'],
    },
    {
      id: 'security',
      summary: {
        en: 'Security posture becomes more structured: containment and auditing improve real-world governance.',
        es: 'La postura de seguridad se estructura: containment y auditoria mejoran el gobierno real.',
      },
      details: {
        en: 'Contained databases reduce cross-database dependencies and simplify portability. Auditing and compliance workflows become more standard in enterprise deployments.',
        es: 'Contained databases reducen dependencias cross-db y simplifican portabilidad. Auditoria y compliance se estandarizan mas en enterprise.',
      },
      points: [
        { en: 'Contained databases reduce instance coupling', es: 'Contained databases reducen acoplamiento a instancia' },
        { en: 'More mature auditing/compliance workflows', es: 'Workflows de auditoria/compliance mas maduros' },
      ],
      badges: ['Auditing', 'Contained'],
    },
    {
      id: 'platform',
      summary: {
        en: 'A decade anchor release: many vendor apps and enterprises standardize around 2012 due to AG adoption.',
        es: 'Release ancla de decada: muchos vendors/enterprises estandarizan en 2012 por adopcion de AG.',
      },
      details: {
        en: 'When AG becomes the standard, the platform choices around it persist. 2012 frequently appears in upgrade roadmaps because it shaped HA thinking for years.',
        es: 'Cuando AG se vuelve estandar, las decisiones de plataforma perduran. 2012 aparece mucho en roadmaps porque marco el pensamiento de HA durante anos.',
      },
      points: [
        { en: 'Enterprise deployment patterns stabilize around AG', es: 'Patrones enterprise se estabilizan alrededor de AG' },
        { en: 'Foundations for later analytics and engine improvements', es: 'Bases para mejoras posteriores de analitica y motor' },
      ],
      badges: ['Enterprise adoption'],
    },
    {
      id: 'ops',
      summary: {
        en: 'HA forces rigor: monitoring, automation and testing become part of normal operations.',
        es: 'HA fuerza rigor: monitorizacion, automatizacion y testing pasan a ser operacion normal.',
      },
      details: {
        en: 'AG estates require runbooks and drills. Patching, failover, backups and capacity planning must be validated continuously, not only when disaster strikes.',
        es: 'Entornos AG requieren runbooks y drills. Patching, failover, backups y capacity planning se validan continuamente, no solo en desastres.',
      },
      points: [
        { en: 'Monitoring for sync state, redo queues and replica health becomes mandatory', es: 'Monitorizar sync state, redo queue y salud de replicas se vuelve obligatorio' },
        { en: 'Practice failovers and automate the boring parts', es: 'Practica failovers y automatiza lo aburrido' },
      ],
      badges: ['HA ops', 'Runbooks'],
    },
  ],
  '2008': [
    {
      id: 'engine',
      summary: {
        en: 'Platform expansion era: compression, FILESTREAM and better backup options reshape storage economics and IO profiles.',
        es: 'Expansion de plataforma: compresion, FILESTREAM y mejores backups cambian economia de storage y perfiles de IO.',
      },
      details: {
        en: '2008/2008 R2 is remembered for making big estates cheaper and more governable: reduce IO with compression, add workload isolation, and improve manageability with policy-based administration.',
        es: '2008/2008 R2 se recuerda por abaratar y gobernar entornos grandes: menos IO con compresion, aislamiento de workload y admin por politicas.',
      },
      points: [
        { en: 'Row/page compression to cut IO and buffer pool footprint', es: 'Compresion row/page para reducir IO y huella en buffer pool' },
        { en: 'Backup compression improves throughput and storage cost', es: 'Compresion de backup mejora throughput y coste de storage' },
        { en: 'FILESTREAM enables large BLOB patterns with NTFS integration', es: 'FILESTREAM habilita patrones BLOB grandes integrando NTFS' },
        { en: 'Resource Governor introduces workload isolation and governance', es: 'Resource Governor introduce aislamiento y gobierno de workloads' },
      ],
      badges: ['Compression', 'Resource Governor', 'FILESTREAM'],
    },
    {
      id: 'query',
      summary: {
        en: 'T-SQL expands: TVPs + MERGE + spatial types change ETL and app parameterization patterns.',
        es: 'Se expande T-SQL: TVPs + MERGE + tipos espaciales cambian ETL y patrones de parametros.',
      },
      details: {
        en: 'Table-valued parameters reduce RBAR patterns and improve set-based design. Spatial types and indexes introduce new operator families and tuning considerations.',
        es: 'TVPs reducen patrones RBAR y mejoran diseno set-based. Spatial introduce nuevas familias de operadores y consideraciones de tuning.',
      },
      points: [
        { en: 'Table-valued parameters (TVP) for set input', es: 'Table-valued parameters (TVP) para entrada en conjunto' },
        { en: 'MERGE for upsert-style patterns (with known caveats)', es: 'MERGE para patrones tipo upsert (con caveats conocidos)' },
        { en: 'Spatial data types and spatial indexing', es: 'Tipos espaciales e indexacion espacial' },
      ],
      badges: ['TVP', 'MERGE', 'Spatial'],
    },
    {
      id: 'ha',
      summary: {
        en: 'Still pre-AG: mirroring/log shipping dominate; clustering and manageability keep improving.',
        es: 'Aun pre-AG: mirroring/log shipping dominan; clustering y manageability siguen mejorando.',
      },
      details: {
        en: 'HA strategy remains similar to 2005, but the platform around it matures: better tooling, better governance, and more standardized patterns at scale.',
        es: 'La estrategia HA es similar a 2005, pero la plataforma madura: mejor tooling, mas gobierno y patrones mas estandarizados a escala.',
      },
      points: [
        { en: 'Mirroring remains a common DB-level HA tool', es: 'Mirroring sigue como herramienta HA a nivel base' },
        { en: 'Clustering continues as infrastructure HA baseline', es: 'Clustering sigue como baseline de HA de infraestructura' },
      ],
      badges: ['Mirroring', 'Clustering'],
    },
    {
      id: 'security',
      summary: {
        en: 'TDE era begins: encryption-at-rest becomes a standard enterprise requirement.',
        es: 'Empieza la era TDE: cifrado en reposo se vuelve requisito enterprise comun.',
      },
      details: {
        en: 'Transparent Data Encryption changes the threat model: backups and data files are protected at rest, and compliance workflows get simpler for many estates.',
        es: 'Transparent Data Encryption cambia el modelo de amenazas: backups y data files se protegen en reposo, y compliance se simplifica en muchos entornos.',
      },
      points: [
        { en: 'Transparent Data Encryption (TDE) for at-rest encryption', es: 'Transparent Data Encryption (TDE) para cifrado en reposo' },
        { en: 'Better policy-driven security and auditing practices', es: 'Mejores practicas de seguridad/auditoria orientadas a politicas' },
      ],
      badges: ['TDE', 'Auditing'],
    },
    {
      id: 'platform',
      summary: {
        en: 'Standardization tooling: Policy-Based Management + PowerShell patterns become mainstream in large estates.',
        es: 'Tooling de estandarizacion: Policy-Based Management + patrones PowerShell se vuelven mainstream en entornos grandes.',
      },
      details: {
        en: 'This is a big step toward repeatable operations. You can detect configuration drift and enforce baselines across many servers.',
        es: 'Es un paso grande hacia operacion repetible. Puedes detectar drift y aplicar baselines en muchos servidores.',
      },
      points: [
        { en: 'Policy-Based Management for compliance and drift detection', es: 'Policy-Based Management para compliance y deteccion de drift' },
        { en: 'PowerShell automation becomes a DBA staple', es: 'La automatizacion PowerShell se vuelve basica para DBAs' },
      ],
      badges: ['PBM', 'PowerShell'],
    },
    {
      id: 'ops',
      summary: {
        en: 'Governance becomes real: isolate workloads, enforce standards, and build baselines with better tooling.',
        es: 'El gobierno se vuelve real: aislas workloads, impones estandares y haces baselines con mejor tooling.',
      },
      details: {
        en: 'Resource Governor + standardized configuration management changes how shared environments can be operated without constant firefighting.',
        es: 'Resource Governor + gestion estandar de configuracion cambia como operas entornos compartidos sin estar siempre apagando fuegos.',
      },
      points: [
        { en: 'Workload isolation with Resource Governor reduces noisy-neighbor issues', es: 'Aislamiento con Resource Governor reduce problemas de noisy-neighbor' },
        { en: 'Configuration baselines and drift checks become routine', es: 'Baselines y checks de drift pasan a ser rutina' },
      ],
      badges: ['Governance', 'Baselines'],
    },
  ],
  '2005': [
    {
      id: 'engine',
      summary: {
        en: 'Modern era begins: DMVs + row versioning foundations + partitioning reshape diagnostics and concurrency patterns.',
        es: 'Empieza la era moderna: DMVs + bases de row versioning + particionado cambian diagnostico y concurrencia.',
      },
      details: {
        en: 'For many DBAs, 2005 is the inflection point. Troubleshooting becomes systematic with DMVs, and new engine capabilities change how you design for concurrency and maintenance.',
        es: 'Para muchos DBAs, 2005 es el punto de inflexion. El troubleshooting se vuelve sistematico con DMVs, y nuevas capacidades cambian diseno de concurrencia y mantenimiento.',
      },
      points: [
        { en: 'DMVs introduce a modern observability layer (waits, IO, memory)', es: 'DMVs introducen observabilidad moderna (waits, IO, memoria)' },
        { en: 'Snapshot isolation and row-versioning model in TempDB', es: 'Snapshot isolation y row-versioning con versiones en TempDB' },
        { en: 'Partitioning enables sliding window patterns for large tables', es: 'Particionado habilita sliding window en tablas grandes' },
        { en: 'Online index operations become a practical enterprise tool', es: 'Operaciones online de indices pasan a ser herramienta enterprise practica' },
      ],
      badges: ['DMVs', 'Partitioning', 'Row versioning'],
    },
    {
      id: 'query',
      summary: {
        en: 'T-SQL expressiveness jumps: CTEs, APPLY, TRY...CATCH, and better windowing primitives for set-based patterns.',
        es: 'Salto de expresividad: CTEs, APPLY, TRY...CATCH y mejores primitivas de windowing para patrones set-based.',
      },
      details: {
        en: 'Query patterns become more composable and maintainable. These constructs also change plan shapes, so tuning benefits from learning the new iterator landscape.',
        es: 'Los patrones de consulta son mas composables y mantenibles. Estas construcciones cambian los planes, asi que el tuning se beneficia de entender nuevos iterators.',
      },
      points: [
        { en: 'CTEs + ROW_NUMBER enable de-dup and paging patterns', es: 'CTEs + ROW_NUMBER habilitan patrones de de-dup y paging' },
        { en: 'APPLY improves correlation patterns and TVF usage', es: 'APPLY mejora patrones correlacionados y uso de TVFs' },
        { en: 'TRY...CATCH improves transactional error handling', es: 'TRY...CATCH mejora manejo de errores transaccionales' },
      ],
      badges: ['CTE', 'APPLY', 'TRY...CATCH'],
    },
    {
      id: 'ha',
      summary: {
        en: 'Mirroring becomes mainstream, complementing clustering and log shipping with DB-level failover options.',
        es: 'Mirroring se vuelve mainstream, complementando clustering y log shipping con failover a nivel base.',
      },
      details: {
        en: 'Database mirroring reshapes HA planning: you can fail over at the database level and support automatic failover with a witness, which is a major leap from instance-only approaches.',
        es: 'Database mirroring cambia el planning HA: failover a nivel base y automatic failover con witness, un salto frente a enfoques solo por instancia.',
      },
      points: [
        { en: 'Mirroring modes (high safety / high performance) with optional witness', es: 'Modos de mirroring (high safety / high performance) con witness opcional' },
        { en: 'DB snapshots enable safer reporting and point-in-time reads', es: 'DB snapshots habilitan reporting mas seguro y lecturas point-in-time' },
        { en: 'Log shipping remains a simple DR pattern', es: 'Log shipping sigue como patron simple de DR' },
      ],
      badges: ['Mirroring', 'Snapshots'],
    },
    {
      id: 'security',
      summary: {
        en: 'Security primitives mature: stronger metadata, better permission analysis, and cryptographic objects used in more patterns.',
        es: 'Maduran primitivas de seguridad: mejor metadato, mejor analisis de permisos y mas uso de objetos criptograficos.',
      },
      details: {
        en: 'Many modern features arrive later, but 2005 sets the stage by strengthening the security surface and making permission management more structured for large estates.',
        es: 'Muchos features modernos llegan despues, pero 2005 sienta base reforzando la superficie y estructurando la gestion de permisos en entornos grandes.',
      },
      points: [
        { en: 'Broader use of certificates/keys for encryption patterns', es: 'Mas uso de certificados/keys en patrones de cifrado' },
        { en: 'Better tooling for permission analysis and metadata security', es: 'Mejor tooling para analizar permisos y seguridad de metadatos' },
      ],
      badges: ['Certificates', 'Permissions'],
    },
    {
      id: 'platform',
      summary: {
        en: 'SQLCLR and programmability expand the platform, while 64-bit adoption accelerates memory planning changes.',
        es: 'SQLCLR y programabilidad expanden la plataforma, y la adopcion 64-bit acelera cambios de planning de memoria.',
      },
      details: {
        en: 'SQLCLR enables specialized workloads near the data, but adds security/ops tradeoffs. This era also marks broader 64-bit adoption in production.',
        es: 'SQLCLR habilita workloads especiales cerca del dato, pero trae tradeoffs de seguridad/ops. Esta era marca mas adopcion 64-bit en produccion.',
      },
      points: [
        { en: 'SQLCLR for specialized string/crypto/parsing workloads', es: 'SQLCLR para workloads especiales (string/crypto/parsing)' },
        { en: '64-bit adoption grows, changing effective memory ceilings', es: 'Crece adopcion 64-bit, suben techos efectivos de memoria' },
      ],
      badges: ['SQLCLR', '64-bit'],
    },
    {
      id: 'ops',
      summary: {
        en: 'The DBA toolbox becomes modern: DMVs + wait stats enable systematic triage instead of guesswork.',
        es: 'El toolbox del DBA se vuelve moderno: DMVs + wait stats habilitan triage sistematico en vez de adivinar.',
      },
      details: {
        en: '2005 enables repeatable troubleshooting: waits, file stats, memory clerks, and plan cache analysis. This changes how incidents are handled and how capacity planning is done.',
        es: '2005 habilita troubleshooting repetible: waits, stats de archivos, memory clerks y plan cache. Cambia como gestionas incidentes y capacity planning.',
      },
      points: [
        { en: 'Wait stats become first-class operational signals', es: 'Wait stats se vuelven senales operativas first-class' },
        { en: 'Metadata visibility improves root-cause analysis', es: 'La visibilidad de metadatos mejora el root-cause analysis' },
      ],
      badges: ['DMVs', 'Wait stats'],
    },
  ],
  '2000': [
    {
      id: 'engine',
      summary: {
        en: 'Classic engine baseline: same foundational storage concepts, but minimal modern observability and self-healing.',
        es: 'Baseline clasico: mismos conceptos base de storage, pero con poca observabilidad moderna y poco self-healing.',
      },
      details: {
        en: 'SQL Server 2000 is the pre-DMV era. Core fundamentals still apply (8KB pages, extents, WAL), but daily operations relied heavily on PerfMon and trace with limited in-engine visibility.',
        es: 'SQL Server 2000 es la era pre-DMV. Los fundamentos siguen (paginas 8KB, extents, WAL), pero la operacion diaria dependia de PerfMon y trace con poca visibilidad del motor.',
      },
      points: [
        { en: 'Same core page/extent architecture as today', es: 'Misma arquitectura base de paginas/extents que hoy' },
        { en: 'Fewer automation and safety features for growth/maintenance', es: 'Menos automatizacion y safety para growth/mantenimiento' },
        { en: 'Troubleshooting required more manual collection and intuition', es: 'El troubleshooting exigia mas recoleccion manual e intuicion' },
      ],
      badges: ['Legacy engine', 'Migration'],
    },
    {
      id: 'query',
      summary: {
        en: 'Simpler language and optimizer surface: fewer constructs, fewer feedback loops, and more manual tuning practices.',
        es: 'Lenguaje y optimizador mas simples: menos construcciones, menos feedback y mas tuning manual.',
      },
      details: {
        en: 'Many constructs that modern tuning assumes (CTEs, APPLY, modern windowing) arrived later. Without Query Store or modern DMVs, plan analysis and regression handling were largely manual.',
        es: 'Muchas construcciones usadas hoy (CTEs, APPLY, windowing moderno) llegaron despues. Sin Query Store o DMVs modernas, analizar planes y regresiones era manual.',
      },
      points: [
        { en: 'No CTEs/APPLY and limited windowing compared to later releases', es: 'Sin CTEs/APPLY y windowing limitado' },
        { en: 'Manual handling of plan regressions and parameter issues', es: 'Gestion manual de regresiones de plan y problemas de parametros' },
      ],
      badges: ['Legacy optimizer'],
    },
    {
      id: 'ha',
      summary: {
        en: 'Pre-AG era: clustering + log shipping + replication were common building blocks, each solving different problems.',
        es: 'Era pre-AG: clustering + log shipping + replicacion eran piezas comunes, cada una para un problema distinto.',
      },
      details: {
        en: 'High availability strategy was infrastructure-led: clustering for instance protection and log shipping/replication for DR or reporting copies.',
        es: 'La estrategia HA era mas de infraestructura: clustering para proteger instancia y log shipping/replicacion para DR o reporting.',
      },
      points: [
        { en: 'Failover clustering as infrastructure HA baseline', es: 'Failover clustering como baseline de HA' },
        { en: 'Log shipping for DR with simple operational model', es: 'Log shipping para DR con modelo operativo simple' },
        { en: 'Replication for scale-out/reporting rather than HA replacement', es: 'Replicacion para scale-out/reporting, no sustituto de HA' },
      ],
      badges: ['Clustering', 'Log shipping', 'Replication'],
    },
    {
      id: 'security',
      summary: {
        en: 'Security baseline was more perimeter/instance focused, with fewer built-in encryption-at-rest and fine-grained controls.',
        es: 'Baseline mas perimetro/instancia, con menos cifrado en reposo y menos controles granulares integrados.',
      },
      details: {
        en: 'Modern security features like TDE, Always Encrypted, RLS and Ledger did not exist yet. Estates relied on network segmentation and careful permissions.',
        es: 'Features modernas como TDE, Always Encrypted, RLS o Ledger aun no existian. Se dependia de segmentacion de red y permisos cuidadosos.',
      },
      points: [
        { en: 'Fewer built-in encryption and compliance features', es: 'Menos features integradas de cifrado y compliance' },
        { en: 'Access control relied heavily on roles/ownership chains and app patterns', es: 'Control de acceso via roles/ownership chains y patrones de app' },
      ],
      badges: ['Legacy security'],
    },
    {
      id: 'platform',
      summary: {
        en: 'Windows-only and closer to the 32-bit/early 64-bit transition, with different hardware constraints.',
        es: 'Solo Windows y cercano a la transicion 32-bit/64-bit temprana, con limitaciones de hardware distintas.',
      },
      details: {
        en: 'Memory ceilings, fewer cores, and different storage expectations shaped architecture choices. Many estates today only touch 2000 during migrations.',
        es: 'Techos de memoria, menos cores y expectativas de storage distintas marcaban elecciones. Hoy se toca 2000 sobre todo por migraciones.',
      },
      points: [
        { en: 'Older IO stacks and controllers shaped performance profiles', es: 'Stacks IO/controladoras antiguas marcaban perfiles de rendimiento' },
        { en: 'Less standardized virtualization patterns compared to today', es: 'Virtualizacion menos estandar que hoy' },
      ],
      badges: ['Windows', 'Legacy hardware'],
    },
    {
      id: 'ops',
      summary: {
        en: 'Operations were manual and trace-driven: fewer in-engine signals meant heavier reliance on runbooks and discipline.',
        es: 'Operacion mas manual y basada en trace: menos senales del motor obligaban a runbooks y disciplina.',
      },
      details: {
        en: 'Keeping stability meant conservative changes and disciplined maintenance. Observability features that later became standard simply did not exist.',
        es: 'Mantener estabilidad exigia cambios conservadores y mantenimiento disciplinado. Las features de observabilidad modernas no existian.',
      },
      points: [
        { en: 'PerfMon + SQL Trace as primary troubleshooting tools', es: 'PerfMon + SQL Trace como herramientas principales' },
        { en: 'Index/statistics maintenance was more rigid and manual', es: 'Mantenimiento de indices/stats mas rigido y manual' },
        { en: 'Capacity planning focused on CPU/IO with fewer feedback loops', es: 'Capacity planning centrado en CPU/IO con menos feedback loops' },
      ],
      badges: ['Trace', 'Manual ops'],
    },
  ],
};
