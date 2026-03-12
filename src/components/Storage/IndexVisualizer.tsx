import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ListOrdered, Table2, Code2, ChevronRight, CheckCircle2, XCircle,
    GitCompare, BarChart3, Hash, Play, Pause, ChevronLeft,
    ChevronRight as ChevronRightIcon, Cpu, RotateCcw, ArrowRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { TSqlModal } from '../Shared/TSqlModal';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

// ── Sample data ───────────────────────────────────────────────────────────────
const TABLE = [
    { id: 1,  name: 'Alice',    dept: 'Finance', salary: 80000 },
    { id: 3,  name: 'Carlos',   dept: 'IT',      salary: 95000 },
    { id: 5,  name: 'Elena',    dept: 'Finance', salary: 72000 },
    { id: 7,  name: 'Frank',    dept: 'HR',      salary: 62000 },
    { id: 9,  name: 'Grace',    dept: 'IT',      salary: 110000 },
    { id: 12, name: 'Henry',    dept: 'Finance', salary: 88000 },
    { id: 15, name: 'Isabella', dept: 'HR',      salary: 55000 },
    { id: 18, name: 'James',    dept: 'IT',      salary: 102000 },
    { id: 22, name: 'Karen',    dept: 'Finance', salary: 91000 },
    { id: 27, name: 'Leo',      dept: 'HR',      salary: 48000 },
    { id: 31, name: 'Mia',      dept: 'IT',      salary: 130000 },
    { id: 35, name: 'Noah',     dept: 'Finance', salary: 76000 },
];

// ── Step definitions ─────────────────────────────────────────────────────────
interface SearchStep {
    title: { en: string; es: string };
    desc: { en: string; es: string };
    highlight: { level: 'root' | 'branch' | 'leaf' | 'table'; idx?: number };
    sql: { en: string; es: string };
    reads: number;
    found?: boolean;
}

// CI search scenarios
const CI_SCENARIOS: { query: string; steps: SearchStep[] }[] = [
    {
        query: 'SELECT * FROM Employees WHERE Id = 9',
        steps: [
            {
                title: { en: 'Root Page (P-1)', es: 'Página raíz (P-1)' },
                desc: {
                    en: 'SQL Server reads the root page. Keys: 1-18 | 18-35. Id=9 -> go LEFT branch.',
                    es: 'SQL Server lee la página raíz. Claves: 1-18 | 18-35. Id=9 -> rama IZQ.',
                },
                highlight: { level: 'root' },
                sql: {
                    en: 'Logical Read: Page P-1 (Root)\nCompare Id=9 vs split key 18 -> left branch',
                    es: 'Lectura lógica: Página P-1 (Raíz)\nComparar Id=9 vs clave de separación 18 -> rama izquierda',
                },
                reads: 1,
            },
            {
                title: { en: 'Branch Page (P-2)', es: 'Página rama (P-2)' },
                desc: {
                    en: 'Branch page covers Ids 1-18. Sub-keys: 1 | 5 | 9 | 12. Id=9 -> go to Leaf L-2.',
                    es: 'La rama cubre Ids 1-18. Subclaves: 1 | 5 | 9 | 12. Id=9 -> hoja L-2.',
                },
                highlight: { level: 'branch', idx: 0 },
                sql: {
                    en: 'Logical Read: Page P-2 (Branch)\nCompare 9 vs 5-12 -> Leaf L-2',
                    es: 'Lectura lógica: Página P-2 (Rama)\nComparar 9 con 5-12 -> Hoja L-2',
                },
                reads: 2,
            },
            {
                title: { en: 'Leaf Page (L-2) - DATA FOUND', es: 'Página hoja (L-2) - FILA ENCONTRADA' },
                desc: {
                    en: 'Leaf page L-2 contains the data rows for Ids 7, 9, 12. Row Id=9 is here. Full row returned - 0 extra reads.',
                    es: 'La hoja L-2 contiene las filas de Ids 7, 9, 12. La fila Id=9 está aquí. Fila completa devuelta - 0 lecturas extra.',
                },
                highlight: { level: 'leaf', idx: 1 },
                sql: {
                    en: 'Logical Read: Page L-2 (Leaf)\nRow Id=9 -> Grace | IT | $110,000\nTotal reads: 3 (Root->Branch->Leaf)',
                    es: 'Lectura lógica: Página L-2 (Hoja)\nFila Id=9 -> Grace | IT | $110,000\nLecturas totales: 3 (Raíz->Rama->Hoja)',
                },
                reads: 3,
                found: true,
            },
        ],
    },
    {
        query: 'SELECT * FROM Employees WHERE Id = 27',
        steps: [
            {
                title: { en: 'Root Page (P-1)', es: 'Página raíz (P-1)' },
                desc: { en: 'Root page read. Id=27 > split 18 -> go RIGHT branch.', es: 'Lectura de raíz. Id=27 > separación 18 -> rama DER.' },
                highlight: { level: 'root' },
                sql: { en: 'Logical Read: Page P-1 (Root)\nId=27 > 18 -> right branch P-3', es: 'Lectura lógica: Página P-1 (Raíz)\nId=27 > 18 -> rama derecha P-3' },
                reads: 1,
            },
            {
                title: { en: 'Branch Page (P-3)', es: 'Página rama (P-3)' },
                desc: {
                    en: 'Branch covers Ids 18-35. Sub-keys: 18 | 22 | 27 | 31 | 35. Id=27 -> Leaf L-4.',
                    es: 'La rama cubre Ids 18-35. Subclaves: 18 | 22 | 27 | 31 | 35. Id=27 -> hoja L-4.',
                },
                highlight: { level: 'branch', idx: 1 },
                sql: { en: 'Logical Read: Page P-3 (Branch)\nId=27 -> between 22 and 31 -> Leaf L-4', es: 'Lectura lógica: Página P-3 (Rama)\nId=27 -> entre 22 y 31 -> Hoja L-4' },
                reads: 2,
            },
            {
                title: { en: 'Leaf Page (L-4) - DATA FOUND', es: 'Página hoja (L-4) - FILA ENCONTRADA' },
                desc: { en: 'L-4 holds Ids 22, 27. Row Id=27 found with full data. No extra lookup.', es: 'L-4 contiene Ids 22, 27. Se encuentra Id=27 con datos completos. Sin lookup extra.' },
                highlight: { level: 'leaf', idx: 3 },
                sql: { en: 'Logical Read: Page L-4 (Leaf)\nRow Id=27 -> Leo | HR | $48,000\nTotal reads: 3', es: 'Lectura lógica: Página L-4 (Hoja)\nFila Id=27 -> Leo | HR | $48,000\nLecturas totales: 3' },
                reads: 3,
                found: true,
            },
        ],
    },
    {
        query: 'SELECT * FROM Employees WHERE Id BETWEEN 5 AND 12',
        steps: [
            {
                title: { en: 'Root Page - Range Scan Start', es: 'Página raíz - Inicio de range scan' },
                desc: { en: 'SQL finds the start of the range: Id=5. Navigates from root.', es: 'SQL localiza el inicio del rango: Id=5. Navega desde la raíz.' },
                highlight: { level: 'root' },
                sql: { en: 'Range Scan: find first key Id=5\nRoot: Id=5 < 18 -> left branch', es: 'Range scan: buscar primera clave Id=5\nRaíz: Id=5 < 18 -> rama izquierda' },
                reads: 1,
            },
            {
                title: { en: 'Branch -> Leaf L-1', es: 'Rama -> Hoja L-1' },
                desc: { en: 'Goes to L-1 which contains Id=1, 5. Picks up Id=5 (Elena).', es: 'Va a L-1 que contiene Id=1, 5. Toma Id=5 (Elena).' },
                highlight: { level: 'branch', idx: 0 },
                sql: { en: 'Branch P-2: Id=5 -> Leaf L-1\nPage L-1: rows 1,5 -> pick Id=5', es: 'Rama P-2: Id=5 -> Hoja L-1\nPágina L-1: filas 1,5 -> seleccionar Id=5' },
                reads: 2,
            },
            {
                title: { en: 'Leaf L-1 + L-2 - Sequential Scan', es: 'Hoja L-1 + L-2 - Escaneo secuencial' },
                desc: {
                    en: 'Follows the leaf-level linked list. Picks Ids 5, 7, 9, 12. All in 2 consecutive leaf reads - sequential I/O.',
                    es: 'Sigue la lista enlazada a nivel hoja. Recoge Ids 5, 7, 9, 12. Todo en 2 lecturas de hoja consecutivas - I/O secuencial.',
                },
                highlight: { level: 'leaf', idx: 0 },
                sql: {
                    en: 'L-1 -> 5 (Elena), L-2 -> 7 (Frank), 9 (Grace), 12 (Henry)\nTotal reads: 4 (sequential pages)',
                    es: 'L-1 -> 5 (Elena), L-2 -> 7 (Frank), 9 (Grace), 12 (Henry)\nLecturas totales: 4 (páginas secuenciales)',
                },
                reads: 4,
                found: true,
            },
        ],
    },
];

// NCI search scenarios (by Salary)
const NCI_SCENARIOS: { query: string; steps: SearchStep[] }[] = [
    {
        query: 'SELECT Name FROM Employees WHERE Salary = 62000',
        steps: [
            {
                title: { en: 'NCI Root (NCI-1)', es: 'Raíz NCI (NCI-1)' },
                desc: {
                    en: 'NCI is sorted by Salary. Root splits at 91k. Salary=62k < 91k -> left branch.',
                    es: 'El NCI está ordenado por Salary. La raíz separa en 91k. Salary=62k < 91k -> rama izquierda.',
                },
                highlight: { level: 'root' },
                sql: { en: 'NCI Root: 62k < 91k -> left branch NCI-2', es: 'Raíz NCI: 62k < 91k -> rama izquierda NCI-2' },
                reads: 1,
            },
            {
                title: { en: 'NCI Branch (NCI-2)', es: 'Rama NCI (NCI-2)' },
                desc: {
                    en: 'Branch covers 48k-91k. Keys: 48k | 62k | 72k | 76k. 62k -> Leaf NL-3.',
                    es: 'La rama cubre 48k-91k. Claves: 48k | 62k | 72k | 76k. 62k -> hoja NL-3.',
                },
                highlight: { level: 'branch', idx: 0 },
                sql: { en: 'NCI-2: 62k -> between 48k and 72k -> Leaf NL-3', es: 'NCI-2: 62k -> entre 48k y 72k -> Hoja NL-3' },
                reads: 2,
            },
            {
                title: { en: 'NCI Leaf NL-3 - Key Found + RID/CI key', es: 'Hoja NCI NL-3 - Clave encontrada + puntero' },
                desc: {
                    en: 'Salary=62k is found in NL-3. The leaf stores a RID/clustered key. A key lookup is needed to fetch Name.',
                    es: 'Se encuentra Salary=62k en NL-3. La hoja guarda el RID/clave clustered. Hace falta key lookup para obtener Name.',
                },
                highlight: { level: 'leaf', idx: 2 },
                sql: {
                    en: 'NL-3: Salary=62k found\nRID/CI key -> clustered index leaf L-2 (key lookup)',
                    es: 'NL-3: Salary=62k encontrado\nRID/clave clustered -> hoja del índice clustered L-2 (key lookup)',
                },
                reads: 3,
            },
            {
                title: { en: 'Key Lookup - CI Leaf L-2 (Frank)', es: 'Key Lookup - Hoja CI L-2 (Frank)' },
                desc: {
                    en: 'SQL uses the RID/clustered key to SEEK the clustered index and fetch missing columns. Often root/branch pages are cached, so the extra cost can look like +1 leaf read. Total: 4 reads.',
                    es: 'SQL usa el RID/clave clustered para hacer un SEEK en el clustered index y traer columnas faltantes. A menudo raíz/ramas ya están en memoria, así que el coste visible parece +1 lectura de hoja. Total: 4 lecturas.',
                },
                highlight: { level: 'table' },
                sql: {
                    en: 'Key Lookup: CI Leaf L-2\nRow: Frank | HR | $62,000\nExtra read -> total = 4 (NCI not covering)',
                    es: 'Key Lookup: Hoja CI L-2\nFila: Frank | HR | $62,000\nLectura extra -> total = 4 (NCI no cubriente)',
                },
                reads: 4,
                found: true,
            },
        ],
    },
    {
        query: 'SELECT Name,Dept FROM Employees WHERE Salary = 62000 -- COVERING',
        steps: [
            {
                title: { en: 'NCI Root (NCI-1)', es: 'Raíz NCI (NCI-1)' },
                desc: { en: 'Same traversal: Salary=62k < 91k -> left.', es: 'Misma ruta: Salary=62k < 91k -> izquierda.' },
                highlight: { level: 'root' },
                sql: { en: 'NCI Root: 62k < 91k -> left branch NCI-2', es: 'Raíz NCI: 62k < 91k -> rama izquierda NCI-2' },
                reads: 1,
            },
            {
                title: { en: 'NCI Branch (NCI-2)', es: 'Rama NCI (NCI-2)' },
                desc: { en: '62k -> Leaf NL-3 (same path as before).', es: '62k -> hoja NL-3 (misma ruta).' },
                highlight: { level: 'branch', idx: 0 },
                sql: { en: 'NCI-2 -> NL-3', es: 'NCI-2 -> NL-3' },
                reads: 2,
            },
            {
                title: { en: 'NCI Leaf NL-3 - FULLY SATISFIED', es: 'Hoja NCI NL-3 - SATISFECHO COMPLETAMENTE' },
                desc: {
                    en: 'With INCLUDE(Name, Dept) the leaf page already has Name and Dept. No key lookup. 3 reads total vs 4 before.',
                    es: 'Con INCLUDE(Name, Dept) la hoja ya tiene Name y Dept. Sin key lookup. 3 lecturas vs 4 antes.',
                },
                highlight: { level: 'leaf', idx: 2 },
                sql: {
                    en: 'Covering index: Name+Dept in leaf\nNO key lookup needed\nFrank | HR - Total reads: 3',
                    es: 'Índice cubriente: Name+Dept en la hoja\nNO se necesita key lookup\nFrank | HR - Lecturas totales: 3',
                },
                reads: 3,
                found: true,
            },
        ],
    },
];

// ── B-Tree node highlighter ───────────────────────────────────────────────────
function NodeBox({ label, sub, active, passed, color, activeColor }: {
    label: string; sub?: string; active: boolean; passed: boolean;
    color: string; activeColor: string;
}) {
    return (
        <motion.div animate={active ? { scale: [1, 1.06, 1], boxShadow: ['0 0 0px transparent', `0 0 20px ${activeColor}`, '0 0 0px transparent'] } : { scale: 1 }}
            transition={{ duration: 0.6, repeat: active ? Infinity : 0 }}
            className={cn('rounded-xl px-4 py-2.5 text-center border-2 transition-all duration-300 min-w-[120px]',
                active ? `bg-opacity-30 ${color} border-opacity-80` : passed ? 'bg-white/10 border-white/20' : 'bg-black/30 border-white/10')}>
            <div className={cn('text-xs font-bold', active ? 'text-white' : passed ? 'text-white/50' : 'text-white/40')}>{label}</div>
            {sub && <div className={cn('text-[9px] font-mono mt-0.5', active ? 'text-white/70' : 'text-white/25')}>{sub}</div>}
        </motion.div>
    );
}

// ── Step Player (shared for CI and NCI) ──────────────────────────────────────
function StepPlayer({ scenarios, accent, tree }: {
    scenarios: { query: string; steps: SearchStep[] }[];
    accent: { border: string; text: string; bg: string; activeColor: string; nodeColor: string };
    tree: 'clustered' | 'nonclustered';
}) {
    const { t, language } = useLanguage();
    const [scenIdx, setScenIdx] = useState(0);
    const [stepIdx, setStepIdx] = useState(0);
    const [playing, setPlaying] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const scenario = scenarios[scenIdx];
    const step = scenario.steps[stepIdx];
    const total = scenario.steps.length;
    const isLast = stepIdx === total - 1;

    const next = () => setStepIdx(i => Math.min(i + 1, total - 1));
    const prev = () => setStepIdx(i => Math.max(i - 1, 0));
    const reset = () => { setStepIdx(0); setPlaying(false); };

    const changeScen = (idx: number) => { setScenIdx(idx); setStepIdx(0); setPlaying(false); };

    useEffect(() => {
        if (playing) {
            timerRef.current = setInterval(() => {
                setStepIdx(i => {
                    if (i >= total - 1) { setPlaying(false); return i; }
                    return i + 1;
                });
            }, 1800);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [playing, total]);

    // Which nodes to highlight
    const hl = step.highlight;
    const rootActive  = hl.level === 'root';
    const branchActive = hl.level === 'branch';
    const leafActive  = hl.level === 'leaf';
    const tableActive = hl.level === 'table';

    return (
        <div className="flex flex-col gap-4">
            {/* Scenario selector */}
            <div className="flex flex-wrap gap-2">
                {scenarios.map((_, i) => (
                    <button key={i} onClick={() => changeScen(i)}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-mono transition-all border',
                            i === scenIdx
                                ? `${accent.bg} ${accent.text} border-opacity-50 ${accent.border}`
                                : 'bg-white/5 text-white/50 border-white/10 hover:text-white')}>
                        {i === 0 ? '▶' : i === 1 ? '▷' : '≥'} {language === 'es' ? 'Escenario' : 'Scenario'} {i + 1}
                    </button>
                ))}
            </div>

            {/* Query */}
            <div className={cn('rounded-xl px-4 py-2.5 border font-mono text-xs', accent.bg, accent.border)}>
                <span className="text-white/40 mr-2">SQL:</span>
                <span className={accent.text}>{scenario.query}</span>
            </div>

            {/* Step progress */}
            <div className="flex items-center gap-2">
                {scenario.steps.map((_, i) => (
                    <button key={i} onClick={() => setStepIdx(i)}
                        className={cn('h-2 rounded-full transition-all', i === stepIdx ? `w-8 ${accent.bg.replace('/10', '')}` : i < stepIdx ? 'w-4 bg-white/30' : 'w-4 bg-white/10')} />
                ))}
                <span className="ml-auto text-xs text-muted-foreground">{language === 'es' ? 'Paso' : 'Step'} {stepIdx + 1} / {total}</span>
            </div>

            {/* B-Tree visualization */}
            <div className="flex flex-col items-center gap-3 py-4 bg-black/20 rounded-2xl border border-white/5">
                {/* Root */}
                <NodeBox
                    label={language === 'es' ? 'RAIZ' : 'ROOT'}
                    sub={
                        tree === 'clustered'
                            ? language === 'es'
                                ? 'P-1 (Raíz)'
                                : 'P-1 (Root)'
                            : language === 'es'
                                ? 'NCI-1 (Raíz)'
                                : 'NCI-1 (Root)'
                    }
                    active={rootActive}
                    passed={stepIdx > 0}
                    color={accent.nodeColor} activeColor={accent.activeColor} />
                <div className={cn('w-px h-6 transition-all', stepIdx >= 1 ? 'bg-white/40' : 'bg-white/10')} />

                {/* Branch */}
                <div className="flex gap-8 items-center">
                    {(tree === 'clustered'
                        ? [
                            { label: language === 'es' ? 'RAMA IZQ' : 'BRANCH L', sub: 'P-2 (1-18)' },
                            { label: language === 'es' ? 'RAMA DER' : 'BRANCH R', sub: 'P-3 (18-35)' },
                        ]
                        : [
                            { label: language === 'es' ? 'RAMA IZQ' : 'BRANCH L', sub: 'NCI-2 (48k-91k)' },
                            { label: language === 'es' ? 'RAMA DER' : 'BRANCH R', sub: 'NCI-3 (91k-130k)' },
                        ]).map((b, i) => (
                        <NodeBox key={i} label={b.label} sub={b.sub}
                            active={branchActive && hl.idx === i}
                            passed={stepIdx > 1}
                            color={accent.nodeColor} activeColor={accent.activeColor} />
                    ))}
                </div>
                <div className={cn('w-px h-6 transition-all', stepIdx >= 2 ? 'bg-white/40' : 'bg-white/10')} />

                {/* Leaves */}
                <div className="flex gap-2 flex-wrap justify-center">
                    {(tree === 'clustered'
                        ? ['L-1\n(1,5)', 'L-2\n(7,9,12)', 'L-3\n(15,18)', 'L-4\n(22,27)', 'L-5\n(31,35)']
                        : ['NL-1\n(48k)', 'NL-2\n(55k)', 'NL-3\n(62k,72k)', 'NL-4\n(76k+)', 'NL-5\n(91k+)']).map((lbl, i) => {
                        const [lpage, sub] = lbl.split('\n');
                        return (
                            <NodeBox key={i} label={lpage} sub={sub}
                                active={leafActive && hl.idx === i}
                                passed={stepIdx >= 2}
                                color={accent.nodeColor} activeColor={accent.activeColor} />
                        );
                    })}
                </div>

                {/* Key lookup */}
                {tableActive && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mt-1">
                        <ArrowRight className="w-4 h-4 text-amber-400" />
                        <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-2 text-xs font-bold text-amber-300">
                            {language === 'es' ? 'KEY LOOKUP -> Hoja CI' : 'KEY LOOKUP -> CI Leaf'}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Step info box */}
            <AnimatePresence mode="wait">
                <motion.div key={`${scenIdx}-${stepIdx}`}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className={cn('rounded-2xl p-4 border', step.found
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : tableActive ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10')}>
                    <div className="flex items-start gap-3">
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                            step.found ? 'bg-emerald-500/20' : tableActive ? 'bg-amber-500/20' : 'bg-white/10')}>
                            {step.found
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                : tableActive ? <Cpu className="w-4 h-4 text-amber-400" />
                                : <ChevronRight className="w-4 h-4 text-white/60" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={cn('font-bold text-sm', step.found ? 'text-emerald-300' : tableActive ? 'text-amber-300' : 'text-white')}>{step.title[language]}</div>
                            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.desc[language]}</div>
                            <div className="mt-3 bg-black/40 rounded-xl p-3 font-mono text-[10px] text-white/60 whitespace-pre leading-relaxed">{step.sql[language]}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] text-muted-foreground">
                                    {language === 'es' ? 'Lecturas lógicas (hasta ahora):' : 'Logical reads so far:'}
                                </span>
                                <div className="flex gap-1">
                                    {Array.from({ length: step.reads }).map((_, i) => (
                                        <div key={i} className={cn('w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center',
                                            step.found && i === step.reads - 1 ? 'bg-emerald-500/40 text-emerald-300'
                                            : tableActive && i === step.reads - 1 ? 'bg-amber-500/40 text-amber-300'
                                            : 'bg-white/10 text-white/50')}>{i + 1}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-between">
                <button onClick={reset} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors">
                    <RotateCcw className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setPlaying(false); prev(); }} disabled={stepIdx === 0}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-sm rounded-lg flex items-center gap-1 disabled:opacity-30 transition-all">
                        <ChevronLeft className="w-4 h-4" /> {language === 'es' ? 'Anterior' : 'Prev'}
                    </button>
                    <button onClick={() => setPlaying(p => !p)}
                        className={cn('px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all',
                            playing ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : `${accent.bg} ${accent.text} border ${accent.border}`)}>
                        {playing
                            ? <><Pause className="w-4 h-4" /> {language === 'es' ? 'Pausa' : 'Pause'}</>
                            : <><Play className="w-4 h-4" /> {t('autoPlay')}</>}
                    </button>
                    <button onClick={() => { setPlaying(false); next(); }} disabled={isLast}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-sm rounded-lg flex items-center gap-1 disabled:opacity-30 transition-all">
                        {language === 'es' ? 'Siguiente' : 'Next'} <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className={cn('text-xs font-bold px-2 py-1 rounded', step.found ? 'text-emerald-400' : 'text-muted-foreground')}>
                    {step.reads} {language === 'es' ? 'lecturas' : 'reads'}
                </div>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
type IndexView = 'compare' | 'clustered' | 'nonclustered';

export function IndexVisualizer() {
    const { t, language } = useLanguage();
    const [activeView, setActiveView] = useState<IndexView>('compare');
    const [isTsqlOpen, setIsTsqlOpen] = useState(false);
    const missingIndexDemandQuery = `SELECT TOP 10
  ROUND(s.avg_total_user_cost * s.avg_user_impact * (s.user_seeks + s.user_scans), 0) AS demand_score,
  d.statement AS table_name,
  d.equality_columns,
  d.inequality_columns,
  d.included_columns
FROM sys.dm_db_missing_index_details d
JOIN sys.dm_db_missing_index_groups g
  ON d.index_handle = g.index_handle
JOIN sys.dm_db_missing_index_group_stats s
  ON g.index_group_handle = s.group_handle
ORDER BY demand_score DESC;`;

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                        {t('indexTitle')}
                    </h2>
                    <p className="text-muted-foreground mt-2">{t('indexDesc')}</p>
                </div>
                <button onClick={() => setIsTsqlOpen(true)}
                    className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                    <Code2 className="w-4 h-4" /> {t('viewTsql')}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-white/5 rounded-xl w-fit glass-panel border border-white/10">
                {([
                    { id: 'compare', label: t('indexTabCompare'), icon: GitCompare },
                    { id: 'clustered', label: t('indexTabClustered'), icon: ListOrdered },
                    { id: 'nonclustered', label: t('indexTabNonClustered'), icon: Hash },
                ] as { id: IndexView; label: string; icon: any }[]).map(tab => (
                    <button key={tab.id} onClick={() => setActiveView(tab.id)}
                        className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                            activeView === tab.id
                                ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                : 'text-muted-foreground hover:text-white hover:bg-white/5')}>
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
                <AnimatePresence mode="wait">

                    {/* ── COMPARE ─────────────────────────────────────────── */}
                    {activeView === 'compare' && (
                        <motion.div key="compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-emerald-500 flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-xl"><ListOrdered className="w-6 h-6 text-emerald-400" /></div>
                                    <div>
                                        <h3 className="text-xl font-bold text-emerald-400">{t('clusteredTitle')}</h3>
                                        <p className="text-xs text-muted-foreground">{t('clusteredSubtitle')}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{t('clusteredDesc')}</p>
                                <div className="space-y-2 mt-2">
                                    {([[true,t('ciPro1')],[true,t('ciPro2')],[true,t('ciPro3')],[false,t('ciCon1')],[false,t('ciCon2')]] as [boolean,string][]).map(([ok,txt])=>(
                                        <div key={txt} className="flex items-start gap-2 text-sm">
                                            {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0"/> : <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0"/>}
                                            <span className={ok?'text-white/80':'text-white/50'}>{txt}</span>
                                        </div>
                                    ))}
                                </div>
                                 <div className="mt-auto bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 font-mono text-xs text-emerald-300">
                                    <div className="text-[10px] font-bold uppercase text-emerald-400 mb-1">
                                        {language === 'es' ? 'Las páginas hoja contienen:' : 'Leaf pages contain:'}
                                    </div>
                                    {language === 'es' ? '[Clave + TODOS los datos] -> 0 lecturas extra' : '[Key + ALL row data] -> 0 extra reads'}
                                 </div>
                             </div>
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-cyan-500 flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-cyan-500/20 rounded-xl"><Hash className="w-6 h-6 text-cyan-400" /></div>
                                    <div>
                                        <h3 className="text-xl font-bold text-cyan-400">{t('nonClusteredTitle')}</h3>
                                        <p className="text-xs text-muted-foreground">{t('nonClusteredSubtitle')}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{t('nonClusteredDesc')}</p>
                                <div className="space-y-2 mt-2">
                                    {([[true,t('nciPro1')],[true,t('nciPro2')],[true,t('nciPro3')],[false,t('nciCon1')],[false,t('nciCon2')]] as [boolean,string][]).map(([ok,txt])=>(
                                        <div key={txt} className="flex items-start gap-2 text-sm">
                                            {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0"/> : <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0"/>}
                                            <span className={ok?'text-white/80':'text-white/50'}>{txt}</span>
                                        </div>
                                    ))}
                                </div>
                                 <div className="mt-auto bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 font-mono text-xs text-cyan-300">
                                    <div className="text-[10px] font-bold uppercase text-cyan-400 mb-1">
                                        {language === 'es' ? 'Las páginas hoja contienen:' : 'Leaf pages contain:'}
                                    </div>
                                    {language === 'es'
                                        ? '[Clave + RID/Clave clustered] -> lookup extra = +1 lectura'
                                        : '[Key + RID/CI Key] -> extra lookup = +1 read'}
                                 </div>
                             </div>
                            {/* Performance table */}
                            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-amber-400" /> {t('indexPerfComparison')}
                                </h4>
                                <table className="w-full text-sm">
                                    <thead><tr className="border-b border-white/10">
                                        <th className="text-left py-2 px-3 text-muted-foreground text-xs uppercase">{t('indexScenario')}</th>
                                        <th className="text-center py-2 px-3 text-emerald-400 text-xs uppercase">{t('clusteredTitle')}</th>
                                        <th className="text-center py-2 px-3 text-cyan-400 text-xs uppercase">{t('nonClusteredTitle')}</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-white/5">
                                        {([
                                            [
                                                t('perfPointLookup'),
                                                language === 'es' ? '✅ 3 lecturas (R->Rama->Hoja)' : '✅ 3 reads (R->B->L)',
                                                language === 'es' ? '⚠️ 4 lecturas (+lookup)' : '⚠️ 4 reads (+lookup)',
                                            ],
                                            [
                                                t('perfRangeScan'),
                                                language === 'es' ? '✅ Páginas secuenciales' : '✅ Sequential pages',
                                                language === 'es' ? '⚠️ Saltos de I/O aleatorio' : '⚠️ Random I/O hops',
                                            ],
                                            [
                                                t('perfCovering'),
                                                language === 'es' ? '⚠️ Siempre fila completa' : '⚠️ Always full row',
                                                language === 'es' ? '✅ Columnas INCLUDE' : '✅ INCLUDE columns',
                                            ],
                                            [
                                                t('perfInsertPerf'),
                                                language === 'es' ? '⚠️ Riesgo de page splits' : '⚠️ Page splits risk',
                                                language === 'es' ? '✅ Estructura separada' : '✅ Separate structure',
                                            ],
                                            [
                                                t('perfCount'),
                                                language === 'es' ? '1 por tabla' : '1 per table',
                                                language === 'es' ? 'Hasta 999 por tabla' : 'Up to 999 per table',
                                            ],
                                        ] as [string,string,string][]).map(([sc,ci,nci])=>(
                                            <tr key={sc} className="hover:bg-white/5">
                                                <td className="py-2.5 px-3 text-white/80">{sc}</td>
                                                <td className="py-2.5 px-3 text-center text-white/70 font-mono text-xs">{ci}</td>
                                                <td className="py-2.5 px-3 text-center text-white/70 font-mono text-xs">{nci}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-emerald-500/20">
                                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                                    <div>
                                        <h4 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5" />
                                            {language === 'es' ? 'Demanda de índices faltantes' : 'Missing index demand'}
                                        </h4>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {language === 'es'
                                                ? 'No solo mires si falta un indice: mira cuanto trabajo ahorraria realmente segun seeks, scans e impacto estimado.'
                                                : 'Do not just check whether an index is missing: check how much work it would really save using seeks, scans and estimated impact.'}
                                        </p>

                                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                                            {([
                                                ['Sales.RegionID, SaleDate', 98, { en: '18K logical reads -> 240', es: '18K lecturas lógicas -> 240' }],
                                                ['Orders.CustomerID', 74, { en: 'Daily scan -> reusable seek', es: 'Scan diario -> seek reutilizable' }],
                                                ['Products.Price INCLUDE(Name)', 61, { en: 'Lookup cost disappears', es: 'Desaparece el coste del lookup' }],
                                            ] as [string, number, { en: string; es: string }][]).map(([label, pct, note]) => (
                                                <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                                    <div className="text-sm font-bold text-white">{label}</div>
                                                    <div className="mt-3 h-2 rounded-full bg-white/10">
                                                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <div className="mt-2 text-xs text-emerald-300">
                                                        {pct}% {language === 'es' ? 'score de demanda' : 'demand score'}
                                                    </div>
                                                    <div className="mt-1 text-xs text-white/50">{note[language]}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                                            {language === 'es' ? 'Consulta DMV lista para copiar' : 'Ready-to-copy DMV query'}
                                        </p>
                                        <CopyCodeBlock code={missingIndexDemandQuery} accent="emerald" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── CLUSTERED ───────────────────────────────────────── */}
                    {activeView === 'clustered' && (
                        <motion.div key="clustered" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-emerald-500">
                                <h3 className="text-xl font-bold text-emerald-400 mb-1">
                                    {t('clusteredTitle')} {language === 'es' ? '- Búsqueda en B-Tree' : '- B-Tree search'}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-5">
                                    {language === 'es'
                                        ? 'Selecciona un escenario y recorre las páginas exactas que lee SQL Server.'
                                        : 'Select a scenario and step through the exact pages SQL Server reads.'}
                                </p>
                                <StepPlayer scenarios={CI_SCENARIOS} accent={{
                                    border: 'border-emerald-500/40', text: 'text-emerald-300',
                                    bg: 'bg-emerald-500/10', activeColor: '#10b981', nodeColor: 'bg-emerald-500/25 border-emerald-500',
                                 }} tree="clustered" />
                            </div>
                            <div className="glass-panel rounded-2xl overflow-hidden self-start">
                                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 bg-black/20">
                                    <Table2 className="w-4 h-4 text-emerald-400" />
                                    <span className="font-bold text-sm text-emerald-400">{t('indexSampleTable')}: Employees</span>
                                </div>
                                <table className="w-full text-xs font-mono">
                                    <thead><tr className="border-b border-white/10 bg-black/20">
                                        {(language === 'es' ? ['Id (PK/CI)', 'Nombre', 'Depto', 'Salario'] : ['Id (PK/CI)', 'Name', 'Dept', 'Salary']).map((h) => (
                                            <th key={h} className="text-left py-2 px-4 text-muted-foreground">{h}</th>
                                        ))}
                                    </tr></thead>
                                    <tbody>{TABLE.map(r=>(
                                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-1.5 px-4 text-emerald-300 font-bold">{r.id}</td>
                                            <td className="py-1.5 px-4 text-white/80">{r.name}</td>
                                            <td className="py-1.5 px-4 text-sky-300">{r.dept}</td>
                                            <td className="py-1.5 px-4 text-amber-300">${r.salary.toLocaleString()}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* ── NON-CLUSTERED ───────────────────────────────────── */}
                    {activeView === 'nonclustered' && (
                        <motion.div key="nonclustered" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex flex-col gap-6">
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-cyan-500">
                                <h3 className="text-xl font-bold text-cyan-400 mb-1">
                                    {t('nonClusteredTitle')} {language === 'es' ? '- Búsqueda en B-Tree' : '- B-Tree search'}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-5">
                                    {language === 'es' ? (
                                        <>
                                            Escenario 1: NCI sin columnas cubrientes: key lookup (+1 lectura).<br />
                                            Escenario 2: NCI con INCLUDE: 0 key lookup, ahorra 1 lectura.
                                        </>
                                    ) : (
                                        <>
                                            Scenario 1: NCI WITHOUT covering columns: key lookup (+1 read).<br />
                                            Scenario 2: NCI WITH INCLUDE: 0 key lookup, saves 1 read.
                                        </>
                                    )}
                                </p>
                                <StepPlayer scenarios={NCI_SCENARIOS} accent={{
                                    border: 'border-cyan-500/40', text: 'text-cyan-300',
                                    bg: 'bg-cyan-500/10', activeColor: '#06b6d4', nodeColor: 'bg-cyan-500/25 border-cyan-500',
                                 }} tree="nonclustered" />
                            </div>

                            {/* Fragmentation guide */}
                            <div className="glass-panel p-6 rounded-2xl border-l-4 border-rose-500">
                                <h4 className="text-base font-bold text-rose-400 mb-3 flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4" /> {t('fragTitle')}
                                </h4>
                                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                    {([['0–10%',t('fragLow'),'text-emerald-400','border-emerald-500/30'],
                                       ['10–30%',t('fragMed'),'text-amber-400','border-amber-500/30'],
                                       ['>30%',t('fragHigh'),'text-rose-400','border-rose-500/30']] as [string,string,string,string][]).map(([pct,action,color,border])=>(
                                        <div key={pct} className={`bg-black/30 border ${border} rounded-xl p-3`}>
                                            <div className={`text-xl font-black ${color}`}>{pct}</div>
                                            <div className="text-white/60 text-xs mt-1">{action}</div>
                                        </div>
                                    ))}
                                </div>
                                <pre className="font-mono text-xs bg-black/40 p-4 rounded-xl text-white/70 leading-relaxed overflow-x-auto">{
`-- Check fragmentation
SELECT object_name(object_id) AS tbl,
  index_id, avg_fragmentation_in_percent, page_count
FROM sys.dm_db_index_physical_stats
  (DB_ID(), NULL, NULL, NULL, 'LIMITED')
WHERE avg_fragmentation_in_percent > 10
ORDER BY avg_fragmentation_in_percent DESC;

-- Reorganize (<30%) vs Rebuild (>30%)
ALTER INDEX IX_Emp_Salary ON Employees REORGANIZE;
ALTER INDEX IX_Emp_Salary ON Employees REBUILD WITH (ONLINE = ON);`}
                                </pre>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <TSqlModal
                isOpen={isTsqlOpen}
                onClose={() => setIsTsqlOpen(false)}
                title={t('indexTsqlTitle')}
                description={t('indexTsqlDesc')}
                diagnosticScript={{
                    '2019': `-- Index usage stats\nSELECT OBJECT_NAME(i.object_id) AS tbl, i.name, i.type_desc,\n  ius.user_seeks, ius.user_scans, ius.user_lookups, ius.user_updates\nFROM sys.indexes i\nLEFT JOIN sys.dm_db_index_usage_stats ius\n  ON i.object_id=ius.object_id AND i.index_id=ius.index_id AND ius.database_id=DB_ID()\nWHERE OBJECTPROPERTY(i.object_id,'IsUserTable')=1\nORDER BY ius.user_seeks + ius.user_scans DESC;\n\n-- Missing index recommendations (scored)\nSELECT TOP 10\n  ROUND(gs.avg_total_user_cost*gs.avg_user_impact*(gs.user_seeks+gs.user_scans),0) AS score,\n  d.statement, d.equality_columns, d.included_columns\nFROM sys.dm_db_missing_index_details d\nJOIN sys.dm_db_missing_index_groups g ON d.index_handle=g.index_handle\nJOIN sys.dm_db_missing_index_group_stats gs ON g.index_group_handle=gs.group_handle\nORDER BY score DESC;`,
                    '2022': `-- Index usage stats\nSELECT OBJECT_NAME(i.object_id) AS tbl, i.name, i.type_desc,\n  ius.user_seeks, ius.user_scans, ius.user_lookups, ius.user_updates\nFROM sys.indexes i\nLEFT JOIN sys.dm_db_index_usage_stats ius\n  ON i.object_id=ius.object_id AND i.index_id=ius.index_id AND ius.database_id=DB_ID()\nWHERE OBJECTPROPERTY(i.object_id,'IsUserTable')=1\nORDER BY ius.user_seeks + ius.user_scans DESC;`,
                    '2025': `-- Index usage stats\nSELECT OBJECT_NAME(i.object_id) AS tbl, i.name, i.type_desc,\n  ius.user_seeks, ius.user_scans, ius.user_lookups, ius.user_updates\nFROM sys.indexes i\nLEFT JOIN sys.dm_db_index_usage_stats ius\n  ON i.object_id=ius.object_id AND i.index_id=ius.index_id AND ius.database_id=DB_ID()\nWHERE OBJECTPROPERTY(i.object_id,'IsUserTable')=1\nORDER BY ius.user_seeks + ius.user_scans DESC;`,
                }}
                remediationTitle={t('indexRemediationTitle')}
                remediationScript={{
                    '2019': `CREATE CLUSTERED INDEX CIX_Employees_Id ON Employees(Id);\n\nCREATE NONCLUSTERED INDEX IX_Employees_Salary\nON Employees(Salary)\nINCLUDE (Name, Dept);\n\nALTER INDEX IX_Employees_Salary ON Employees\nREBUILD WITH (FILLFACTOR = 80, ONLINE = ON);`,
                    '2022': `CREATE NONCLUSTERED INDEX IX_Employees_Salary\nON Employees(Salary)\nINCLUDE (Name, Dept);\n\nALTER INDEX IX_Employees_Salary ON Employees\nREBUILD WITH (RESUMABLE = ON, ONLINE = ON);`,
                    '2025': `CREATE NONCLUSTERED INDEX IX_Employees_Salary\nON Employees(Salary)\nINCLUDE (Name, Dept);\n\nALTER INDEX IX_Employees_Salary ON Employees\nREBUILD WITH (RESUMABLE = ON, ONLINE = ON);`,
                }}
            />
        </div>
    );
}
