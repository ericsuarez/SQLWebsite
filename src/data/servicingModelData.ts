import type { LocalizedText } from './advancedSQLData';

export type ServicingTrackId = 'sp-era' | 'cu-era';
export type ServicingLaneId = 'baseline' | 'gdr' | 'cu';

export type ServicingTone = 'lime' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'violet';

export interface ServicingExplainer {
  id: string;
  label: LocalizedText;
  tone: ServicingTone;
  summary: LocalizedText;
  includes: LocalizedText[];
  whenToUse: LocalizedText;
  pitfalls: LocalizedText[];
  badges: string[];
}

export interface ServicingNode {
  id: string;
  track: ServicingTrackId;
  lane: ServicingLaneId;
  order: number;
  explainerId: ServicingExplainer['id'];
  title: LocalizedText;
  subtitle: LocalizedText;
  badges?: string[];
}

export interface ServicingLane {
  id: ServicingLaneId;
  label: LocalizedText;
  description: LocalizedText;
  tone: ServicingTone;
}

export interface ServicingModel {
  track: ServicingTrackId;
  lanes: ServicingLane[];
  nodes: ServicingNode[];
  defaultNodeId: string;
  footnote: LocalizedText;
}

export const SERVICING_EXPLAINERS: ServicingExplainer[] = [
  {
    id: 'rtm',
    label: { en: 'RTM baseline', es: 'RTM (baseline)' },
    tone: 'lime',
    summary: {
      en: 'The initial release baseline. Every servicing branch starts here.',
      es: 'La version base (Release to Manufacturing). Toda rama de mantenimiento parte de aqui.',
    },
    includes: [
      { en: 'ProductVersion + initial build', es: 'ProductVersion + build inicial' },
      { en: 'Factory defaults and initial behavior', es: 'Comportamiento inicial y defaults de fabrica' },
      { en: 'No cumulative fixes yet', es: 'Sin fixes acumulados todavia' },
    ],
    whenToUse: {
      en: 'Only for labs or very short-lived installs. Production should move to a supported servicing baseline.',
      es: 'Solo para labs o instalaciones muy temporales. En produccion, mueve a una baseline soportada (CU/GDR/SP segun epoca).',
    },
    pitfalls: [
      { en: 'Bugs and early edge cases are most likely at RTM.', es: 'En RTM es donde mas probabilidad hay de bugs y esquinas.' },
      { en: 'You still need a build discipline: track KB and build numbers.', es: 'Necesitas disciplina de builds: KB, build y fecha.' },
    ],
    badges: ['ProductVersion', 'Build', 'Baseline'],
  },
  {
    id: 'sp',
    label: { en: 'Service Pack (SP)', es: 'Service Pack (SP)' },
    tone: 'emerald',
    summary: {
      en: 'A large rollup of fixes (and sometimes improvements). Common in older SQL Server lifecycles.',
      es: 'Gran rollup de fixes (y a veces mejoras). Era el lenguaje operativo tipico en versiones antiguas.',
    },
    includes: [
      { en: 'Rollup of fixes since RTM', es: 'Rollup de fixes desde RTM' },
      { en: 'Often a new servicing baseline', es: 'Suele marcar una nueva baseline' },
      { en: 'Followed by post-SP CUs and security updates', es: 'Despues llegan CUs post-SP y parches de seguridad' },
    ],
    whenToUse: {
      en: 'Relevant for legacy estates and upgrade history (2000-2016 era).',
      es: 'Relevante para entornos legacy y para entender historia de upgrades (era 2000-2016).',
    },
    pitfalls: [
      { en: 'SP cadence is slow; you can lag behind on important fixes.', es: 'Cadencia lenta; puedes quedarte atras en fixes importantes.' },
      { en: 'Teams sometimes treat SP as “safe” and stop patching. That is a risk.', es: 'Muchos equipos se quedan en un SP por “seguridad” y dejan de parchear: riesgo.' },
    ],
    badges: ['Legacy', 'Rollup', 'Baseline shift'],
  },
  {
    id: 'cu',
    label: { en: 'Cumulative Update (CU)', es: 'Cumulative Update (CU)' },
    tone: 'amber',
    summary: {
      en: 'A rolling train of fixes (and sometimes behavior improvements). Modern SQL Server servicing revolves around CUs.',
      es: 'Tren acumulativo de fixes (y a veces mejoras de comportamiento). El mantenimiento moderno gira alrededor de los CUs.',
    },
    includes: [
      { en: 'Includes all prior fixes in the CU branch', es: 'Incluye todos los fixes previos de la rama CU' },
      { en: 'Quality + performance fixes beyond security', es: 'Fixes de calidad y rendimiento mas alla de seguridad' },
      { en: 'Can unlock maturity for features (IQP/Query Store behaviors)', es: 'Puede madurar features (IQP / Query Store, etc.)' },
    ],
    whenToUse: {
      en: 'Default choice for most production systems with proper testing and change control.',
      es: 'Eleccion por defecto en la mayoria de producciones con testing y control de cambios.',
    },
    pitfalls: [
      { en: 'More change surface than GDR; test workloads and critical queries.', es: 'Mas superficie de cambio que GDR: prueba cargas y queries criticas.' },
      { en: 'Once you move to the CU branch, you generally cannot go back to GDR without uninstalling patches.', es: 'Si te mueves a rama CU, normalmente no puedes volver a GDR sin desinstalar updates.' },
    ],
    badges: ['Rollup', 'Feature maturity', 'Recommended'],
  },
  {
    id: 'gdr',
    label: { en: 'GDR branch', es: 'Rama GDR' },
    tone: 'cyan',
    summary: {
      en: 'Conservative servicing: security and a very small set of critical fixes, with minimal behavioral change.',
      es: 'Mantenimiento conservador: seguridad y un conjunto muy pequeno de fixes criticos, con minimo cambio de comportamiento.',
    },
    includes: [
      { en: 'Security fixes', es: 'Fixes de seguridad' },
      { en: 'Highly targeted critical fixes', es: 'Fixes criticos muy acotados' },
      { en: 'Lower regression risk profile', es: 'Perfil de menor riesgo de regresion' },
    ],
    whenToUse: {
      en: 'Risk-averse environments that prioritize minimal change, accepting slower access to non-security fixes.',
      es: 'Entornos muy conservadores que priorizan minimo cambio, aceptando tardar mas en fixes no-security.',
    },
    pitfalls: [
      { en: 'You may miss important non-security fixes and performance improvements.', es: 'Te pierdes fixes importantes no-security y mejoras de rendimiento.' },
      { en: 'You can move from GDR to CU by applying a CU, but not back without uninstall.', es: 'Puedes saltar de GDR a CU instalando un CU, pero no volver sin desinstalar.' },
    ],
    badges: ['Security-focused', 'Low change', 'Branch'],
  },
  {
    id: 'su',
    label: { en: 'Security Update (SU)', es: 'Security Update (SU)' },
    tone: 'rose',
    summary: {
      en: 'Security fixes shipped for both branches. The same security fix may exist as a GDR and as a CU-based update.',
      es: 'Fixes de seguridad publicados para ambas ramas. El mismo fix puede existir como GDR y como update sobre CU.',
    },
    includes: [
      { en: 'CVE fixes', es: 'Fixes de CVEs' },
      { en: 'Often released as separate KBs for GDR vs CU', es: 'A menudo sale como KBs diferentes para GDR vs CU' },
      { en: 'May be integrated into later CUs', es: 'Puede integrarse en CUs posteriores' },
    ],
    whenToUse: {
      en: 'Apply based on your chosen branch and your security SLA; keep a consistent patching strategy.',
      es: 'Aplica segun tu rama elegida y tu SLA de seguridad; mantén una estrategia consistente.',
    },
    pitfalls: [
      { en: 'Mixing GDR and CU packages incorrectly can lead to unexpected branch moves.', es: 'Mezclar paquetes GDR y CU sin control puede forzarte a cambiar de rama.' },
      { en: 'Track ProductUpdateReference / KB to avoid “mystery builds”.', es: 'Rastrea ProductUpdateReference / KB para evitar “builds misteriosas”.' },
    ],
    badges: ['CVE', 'KB', 'Branch-aware'],
  },
  {
    id: 'qfe',
    label: { en: 'Hotfix / QFE', es: 'Hotfix / QFE' },
    tone: 'violet',
    summary: {
      en: 'An on-demand targeted fix (usually from support). Often later rolled into a CU.',
      es: 'Fix puntual bajo demanda (normalmente via soporte). Suele acabar incluido en un CU posterior.',
    },
    includes: [
      { en: 'A narrow fix for a specific issue', es: 'Fix acotado para un problema concreto' },
      { en: 'May require a specific build baseline', es: 'Puede requerir una baseline concreta' },
      { en: 'Later absorbed into the next CU train', es: 'Acaba absorbiendose en el tren de CUs' },
    ],
    whenToUse: {
      en: 'Only when the issue is severe and confirmed, and waiting for the next CU is not viable.',
      es: 'Solo cuando el problema es serio y confirmado, y no puedes esperar al siguiente CU.',
    },
    pitfalls: [
      { en: 'Treat as code: document, test, and plan the next baseline update.', es: 'Tratalo como codigo: documenta, prueba y planifica el siguiente baseline.' },
      { en: 'Do not “collect hotfixes”; converge back to CU/GDR discipline.', es: 'No “colecciones hotfixes”; converge a disciplina de CU/GDR.' },
    ],
    badges: ['Support', 'Targeted', 'Converge back'],
  },
];

export const SERVICING_MODELS: Record<ServicingTrackId, ServicingModel> = {
  'sp-era': {
    track: 'sp-era',
    lanes: [
      {
        id: 'baseline',
        label: { en: 'SP baseline', es: 'Baseline SP' },
        description: {
          en: 'Older lifecycle: RTM -> SPs -> post-SP rollups.',
          es: 'Ciclo antiguo: RTM -> SPs -> rollups post-SP.',
        },
        tone: 'emerald',
      },
    ],
    nodes: [
      {
        id: 'sp-rtm',
        track: 'sp-era',
        lane: 'baseline',
        order: 0,
        explainerId: 'rtm',
        title: { en: 'RTM', es: 'RTM' },
        subtitle: { en: 'Initial baseline', es: 'Baseline inicial' },
      },
      {
        id: 'sp-sp1',
        track: 'sp-era',
        lane: 'baseline',
        order: 1,
        explainerId: 'sp',
        title: { en: 'SP1', es: 'SP1' },
        subtitle: { en: 'Service Pack level', es: 'Nivel de Service Pack' },
      },
      {
        id: 'sp-sp2',
        track: 'sp-era',
        lane: 'baseline',
        order: 2,
        explainerId: 'sp',
        title: { en: 'SP2', es: 'SP2' },
        subtitle: { en: 'Common estate baseline', es: 'Baseline habitual' },
      },
      {
        id: 'sp-postcu',
        track: 'sp-era',
        lane: 'baseline',
        order: 3,
        explainerId: 'cu',
        title: { en: 'Post-SP CU', es: 'CU post-SP' },
        subtitle: { en: 'Cumulative fixes', es: 'Fixes acumulativos' },
        badges: ['Post-SP'],
      },
      {
        id: 'sp-su',
        track: 'sp-era',
        lane: 'baseline',
        order: 4,
        explainerId: 'su',
        title: { en: 'Security update', es: 'Security update' },
        subtitle: { en: 'Security rollups', es: 'Parches de seguridad' },
      },
    ],
    defaultNodeId: 'sp-sp2',
    footnote: {
      en: 'In modern versions, CUs are the main vehicle. SP-level thinking remains useful for legacy estates and migrations.',
      es: 'En versiones modernas, los CUs son el vehiculo principal. El “pensamiento SP” sigue siendo util para legacy y migraciones.',
    },
  },
  'cu-era': {
    track: 'cu-era',
    lanes: [
      {
        id: 'baseline',
        label: { en: 'Baseline', es: 'Baseline' },
        description: {
          en: 'Start here, then choose a servicing branch.',
          es: 'Arrancas aqui y luego eliges rama de mantenimiento.',
        },
        tone: 'lime',
      },
      {
        id: 'gdr',
        label: { en: 'GDR branch', es: 'Rama GDR' },
        description: {
          en: 'Security-first, minimal change.',
          es: 'Seguridad primero, minimo cambio.',
        },
        tone: 'cyan',
      },
      {
        id: 'cu',
        label: { en: 'CU branch', es: 'Rama CU' },
        description: {
          en: 'Full fixes train + maturity improvements.',
          es: 'Tren de fixes + madurez de features.',
        },
        tone: 'amber',
      },
    ],
    nodes: [
      {
        id: 'cu-rtm',
        track: 'cu-era',
        lane: 'baseline',
        order: 0,
        explainerId: 'rtm',
        title: { en: 'RTM', es: 'RTM' },
        subtitle: { en: 'Initial baseline', es: 'Baseline inicial' },
      },
      {
        id: 'cu-gdr0',
        track: 'cu-era',
        lane: 'gdr',
        order: 0,
        explainerId: 'gdr',
        title: { en: 'GDR baseline', es: 'Baseline GDR' },
        subtitle: { en: 'Security-only cadence', es: 'Cadencia conservadora' },
        badges: ['GDR'],
      },
      {
        id: 'cu-gdr-su',
        track: 'cu-era',
        lane: 'gdr',
        order: 1,
        explainerId: 'su',
        title: { en: 'SU (GDR)', es: 'SU (GDR)' },
        subtitle: { en: 'Security update', es: 'Parche de seguridad' },
        badges: ['GDR'],
      },
      {
        id: 'cu-cu1',
        track: 'cu-era',
        lane: 'cu',
        order: 0,
        explainerId: 'cu',
        title: { en: 'CU1', es: 'CU1' },
        subtitle: { en: 'Rollup + fixes', es: 'Rollup + fixes' },
        badges: ['CU'],
      },
      {
        id: 'cu-cu2',
        track: 'cu-era',
        lane: 'cu',
        order: 1,
        explainerId: 'cu',
        title: { en: 'CU2', es: 'CU2' },
        subtitle: { en: 'More fixes', es: 'Mas fixes' },
        badges: ['CU'],
      },
      {
        id: 'cu-cu-su',
        track: 'cu-era',
        lane: 'cu',
        order: 2,
        explainerId: 'su',
        title: { en: 'SU (CU)', es: 'SU (CU)' },
        subtitle: { en: 'Security update', es: 'Parche de seguridad' },
        badges: ['CU'],
      },
      {
        id: 'cu-cu3',
        track: 'cu-era',
        lane: 'cu',
        order: 3,
        explainerId: 'cu',
        title: { en: 'CU3', es: 'CU3' },
        subtitle: { en: 'New baseline', es: 'Nueva baseline' },
        badges: ['CU'],
      },
      {
        id: 'cu-qfe',
        track: 'cu-era',
        lane: 'cu',
        order: 4,
        explainerId: 'qfe',
        title: { en: 'Hotfix', es: 'Hotfix' },
        subtitle: { en: 'On-demand fix', es: 'Fix puntual' },
        badges: ['QFE'],
      },
    ],
    defaultNodeId: 'cu-cu3',
    footnote: {
      en: 'Key rule: you can move from GDR to CU by applying a CU. Moving back from CU to GDR typically requires uninstalling updates.',
      es: 'Regla clave: de GDR puedes saltar a CU instalando un CU. Volver de CU a GDR normalmente requiere desinstalar updates.',
    },
  },
};

