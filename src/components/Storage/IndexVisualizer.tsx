import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, ListOrdered, Table2, Code2, ChevronRight, CheckCircle2, XCircle, GitCompare, BarChart3, ArrowDown, Hash } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { TSqlModal } from '../Shared/TSqlModal';

// ── Mock B-Tree data ──────────────────────────────────────────────────────────
const SAMPLE_TABLE = [
    { id: 1,  name: 'Alice',   dept: 'Finance',    salary: 80000 },
    { id: 3,  name: 'Carlos',  dept: 'IT',         salary: 95000 },
    { id: 5,  name: 'Elena',   dept: 'Finance',    salary: 72000 },
    { id: 7,  name: 'Frank',   dept: 'HR',         salary: 62000 },
    { id: 9,  name: 'Grace',   dept: 'IT',         salary: 110000 },
    { id: 12, name: 'Henry',   dept: 'Finance',    salary: 88000 },
    { id: 15, name: 'Isabella',dept: 'HR',         salary: 55000 },
    { id: 18, name: 'James',   dept: 'IT',         salary: 102000 },
    { id: 22, name: 'Karen',   dept: 'Finance',    salary: 91000 },
    { id: 27, name: 'Leo',     dept: 'HR',         salary: 48000 },
    { id: 31, name: 'Mia',     dept: 'IT',         salary: 130000 },
    { id: 35, name: 'Noah',    dept: 'Finance',    salary: 76000 },
];

// B-Tree root/branch/leaf pages for clustered index (by Id)
const CLUSTERED_BTREE = {
    root:   { page: 'P-1 (Root)', keys: ['1-18', '18-35'], level: 0 },
    branch: [
        { page: 'P-2 (Branch)', keys: ['1', '5', '9', '12'], level: 1 },
        { page: 'P-3 (Branch)', keys: ['18', '22', '27', '31', '35'], level: 1 },
    ],
    leaves: [
        { page: 'L-1', keys: [1, 5], level: 2, hasData: true },
        { page: 'L-2', keys: [7, 9, 12], level: 2, hasData: true },
        { page: 'L-3', keys: [15, 18], level: 2, hasData: true },
        { page: 'L-4', keys: [22, 27], level: 2, hasData: true },
        { page: 'L-5', keys: [31, 35], level: 2, hasData: true },
    ],
};

// Non-clustered: separate key→RID pointers
const NONCLUSTERED_BTREE = {
    root:   { page: 'NCI-1 (Root)', keys: ['48k-91k', '91k-130k'], level: 0 },
    branch: [
        { page: 'NCI-2 (Branch)', keys: ['48k', '62k', '72k', '76k'], level: 1 },
        { page: 'NCI-3 (Branch)', keys: ['80k', '88k', '91k', '102k'], level: 1 },
        { page: 'NCI-4 (Branch)', keys: ['110k', '130k'], level: 1 },
    ],
    leaves: [
        { page: 'NL-1', salary: 48000, rid: 'RID→L-5', level: 2, hasData: false },
        { page: 'NL-2', salary: 55000, rid: 'RID→L-3', level: 2, hasData: false },
        { page: 'NL-3', salary: 62000, rid: 'RID→L-1', level: 2, hasData: false },
        { page: 'NL-4', salary: 72000, rid: 'RID→L-1', level: 2, hasData: false },
        { page: 'NL-5', salary: 76000, rid: 'RID→L-5', level: 2, hasData: false },
        { page: 'NL-6', salary: 80000, rid: 'RID→L-1', level: 2, hasData: false },
    ],
};

type IndexView = 'compare' | 'clustered' | 'nonclustered';

export function IndexVisualizer() {
    const { t } = useLanguage();
    const [activeView, setActiveView] = useState<IndexView>('compare');
    const [isTsqlOpen, setIsTsqlOpen] = useState(false);
    const [searchId, setSearchId] = useState<string>('');
    const [searchActive, setSearchActive] = useState(false);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);
    const [searchMode, setSearchMode] = useState<'ci' | 'nci'>('ci');

    const doSearch = (mode: 'ci' | 'nci') => {
        const id = parseInt(searchId);
        const row = SAMPLE_TABLE.find(r => r.id === id);
        setSearchMode(mode);
        setHighlightedId(row ? row.id : -1);
        setSearchActive(true);
        setTimeout(() => setSearchActive(false), 3000);
    };

    const found = highlightedId !== null ? SAMPLE_TABLE.find(r => r.id === highlightedId) : null;

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
                <button
                    onClick={() => setIsTsqlOpen(true)}
                    className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                >
                    <Code2 className="w-4 h-4" /> {t('viewTsql')}
                </button>
            </div>

            {/* Tab bar */}
            <div className="flex p-1 bg-white/5 rounded-xl w-fit glass-panel border border-white/10">
                {([
                    { id: 'compare',       label: t('indexTabCompare'),     icon: GitCompare },
                    { id: 'clustered',     label: t('indexTabClustered'),   icon: ListOrdered },
                    { id: 'nonclustered',  label: t('indexTabNonClustered'),icon: Hash },
                ] as {id:IndexView; label:string; icon:any}[]).map(tab => (
                    <button key={tab.id} onClick={() => setActiveView(tab.id)}
                        className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                            activeView === tab.id
                                ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                : 'text-muted-foreground hover:text-white hover:bg-white/5')}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">

                    {/* ── COMPARE VIEW ──────────────────────────────────────────────────── */}
                    {activeView === 'compare' && (
                        <motion.div key="compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Clustered card */}
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
                                    {([
                                        [true,  t('ciPro1')],
                                        [true,  t('ciPro2')],
                                        [true,  t('ciPro3')],
                                        [false, t('ciCon1')],
                                        [false, t('ciCon2')],
                                    ] as [boolean, string][]).map(([ok, txt]) => (
                                        <div key={txt} className="flex items-start gap-2 text-sm">
                                            {ok
                                                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                                : <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />}
                                            <span className={ok ? 'text-white/80' : 'text-white/50'}>{txt}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-auto bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs font-mono text-emerald-300 leading-relaxed">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Leaf Pages contain:</div>
                                    {`[Key + ALL row data columns] → disk seek = 0 extra reads`}
                                </div>
                            </div>

                            {/* Non-Clustered card */}
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
                                    {([
                                        [true,  t('nciPro1')],
                                        [true,  t('nciPro2')],
                                        [true,  t('nciPro3')],
                                        [false, t('nciCon1')],
                                        [false, t('nciCon2')],
                                    ] as [boolean, string][]).map(([ok, txt]) => (
                                        <div key={txt} className="flex items-start gap-2 text-sm">
                                            {ok
                                                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                                : <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />}
                                            <span className={ok ? 'text-white/80' : 'text-white/50'}>{txt}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-auto bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-xs font-mono text-cyan-300 leading-relaxed">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1">Leaf Pages contain:</div>
                                    {`[Key + RID/Clustered Key] → extra lookup = +1 read`}
                                </div>
                            </div>

                            {/* Side-by-side performance table */}
                            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-amber-400" /> {t('indexPerfComparison')}
                                </h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-2 px-3 text-muted-foreground font-bold text-xs uppercase">{t('indexScenario')}</th>
                                                <th className="text-center py-2 px-3 text-emerald-400 font-bold text-xs uppercase">{t('clusteredTitle')}</th>
                                                <th className="text-center py-2 px-3 text-cyan-400 font-bold text-xs uppercase">{t('nonClusteredTitle')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {([
                                                [t('perfPointLookup'),    '✅ 1 read',            '⚠️ 2 reads (lookup)'],
                                                [t('perfRangeScan'),      '✅ Sequential pages',   '⚠️ Random I/O hops'],
                                                [t('perfCovering'),       '⚠️ Always full row',   '✅ Include columns'],
                                                [t('perfInsertPerf'),     '⚠️ Page splits risk',  '✅ Separate structure'],
                                                [t('perfCount'),          '1 per table',           'Up to 999 per table'],
                                            ] as [string, string, string][]).map(([sc, ci, nci]) => (
                                                <tr key={sc} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-2.5 px-3 text-white/80">{sc}</td>
                                                    <td className="py-2.5 px-3 text-center text-white/70 font-mono text-xs">{ci}</td>
                                                    <td className="py-2.5 px-3 text-center text-white/70 font-mono text-xs">{nci}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── CLUSTERED INDEX VIEW ────────────────────────────────────────── */}
                    {activeView === 'clustered' && (
                        <motion.div key="clustered" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex flex-col gap-6">
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-emerald-500">
                                <h3 className="text-xl font-bold text-emerald-400 mb-2">{t('clusteredTitle')}</h3>
                                <p className="text-sm text-muted-foreground mb-6">{t('clusteredSimDesc')}</p>

                                {/* B-Tree diagram */}
                                <div className="flex flex-col items-center gap-0">
                                    {/* Root */}
                                    <div className="bg-emerald-500/20 border-2 border-emerald-500/60 rounded-xl px-6 py-3 text-sm font-bold text-emerald-300 text-center">
                                        {CLUSTERED_BTREE.root.page}<br />
                                        <span className="text-[10px] font-mono text-white/50">{CLUSTERED_BTREE.root.keys.join(' | ')}</span>
                                    </div>
                                    <div className="flex gap-20 relative mt-0">
                                        <div className="absolute top-0 left-1/4 right-1/4 h-6 border-t-2 border-l-2 border-r-2 border-emerald-500/30 rounded-t-lg" />
                                    </div>
                                    {/* Branch */}
                                    <div className="flex gap-6 mt-6">
                                        {CLUSTERED_BTREE.branch.map((b, i) => (
                                            <div key={i} className="bg-blue-500/15 border border-blue-500/40 rounded-xl px-4 py-2.5 text-center">
                                                <div className="text-xs font-bold text-blue-300">{b.page}</div>
                                                <div className="text-[10px] font-mono text-white/40 mt-1">{b.keys.join(' | ')}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Arrow */}
                                    <ArrowDown className="w-4 h-4 text-white/30 mt-2" />
                                    {/* Leaf pages - DATA INCLUDED */}
                                    <div className="flex gap-2 mt-2 flex-wrap justify-center">
                                        {CLUSTERED_BTREE.leaves.map((lf, i) => {
                                            const rows = SAMPLE_TABLE.filter(r => lf.keys.includes(r.id));
                                            return (
                                                <div key={i} className="bg-black/40 border-2 border-emerald-500/30 rounded-xl p-3 min-w-[130px]">
                                                    <div className="text-[10px] font-bold text-emerald-400 mb-2 text-center border-b border-white/10 pb-1">{lf.page}</div>
                                                    {rows.map(r => (
                                                        <div key={r.id} className={cn(
                                                            'text-[10px] font-mono py-0.5 px-1 rounded transition-all',
                                                            highlightedId === r.id && searchMode === 'ci'
                                                                ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                                                                : 'text-white/60')}>
                                                            {r.id} | {r.name.substring(0, 6)} | {(r.salary/1000).toFixed(0)}k
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 text-[11px] text-emerald-400/70 font-mono border border-emerald-500/20 bg-emerald-500/5 rounded-lg px-4 py-2">
                                        ↑ Leaf pages contain FULL ROW DATA — 0 extra lookups needed
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="mt-6 flex items-center gap-3">
                                    <Search className="w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="number" placeholder="Search by ID (1-35)"
                                        value={searchId} onChange={e => setSearchId(e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50"
                                    />
                                    <button onClick={() => doSearch('ci')}
                                        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                                        <Zap className="w-3.5 h-3.5" /> {t('indexSearch')}
                                    </button>
                                </div>
                                {searchActive && (
                                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                        className={cn('mt-3 rounded-xl p-3 text-sm flex items-center gap-3',
                                            found ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                                                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300')}>
                                        {found ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                                        {found
                                            ? `${t('indexFoundIn')} → Root → Branch → Leaf page. ${t('indexCiHits')}: 1`
                                            : t('indexNotFound')}
                                    </motion.div>
                                )}
                            </div>

                            {/* Sample data table */}
                            <div className="glass-panel rounded-2xl overflow-hidden">
                                <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 bg-black/20">
                                    <Table2 className="w-4 h-4 text-emerald-400" />
                                    <span className="font-bold text-sm text-emerald-400">{t('indexSampleTable')}: Employees</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs font-mono">
                                        <thead><tr className="border-b border-white/10 bg-black/20">
                                            {['Id (PK/CI)', 'Name', 'Dept', 'Salary'].map(h => (
                                                <th key={h} className="text-left py-2 px-4 text-muted-foreground">{h}</th>
                                            ))}
                                        </tr></thead>
                                        <tbody>
                                            {SAMPLE_TABLE.map(r => (
                                                <tr key={r.id} className={cn('border-b border-white/5 hover:bg-white/5 transition-colors',
                                                    highlightedId === r.id && searchMode === 'ci' ? 'bg-emerald-500/15' : '')}>
                                                    <td className="py-1.5 px-4 text-emerald-300 font-bold">{r.id}</td>
                                                    <td className="py-1.5 px-4 text-white/80">{r.name}</td>
                                                    <td className="py-1.5 px-4 text-sky-300">{r.dept}</td>
                                                    <td className="py-1.5 px-4 text-amber-300">${r.salary.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── NON-CLUSTERED INDEX VIEW ─────────────────────────────────────── */}
                    {activeView === 'nonclustered' && (
                        <motion.div key="nonclustered" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex flex-col gap-6">
                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-cyan-500">
                                <h3 className="text-xl font-bold text-cyan-400 mb-2">{t('nonClusteredTitle')}</h3>
                                <p className="text-sm text-muted-foreground mb-6">{t('nonClusteredSimDesc')}</p>

                                {/* Side-by-side: NCI + Heap/CI table */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {/* NCI B-Tree */}
                                    <div>
                                        <div className="text-[10px] font-bold uppercase text-cyan-400 mb-3">{t('nciStructure')}</div>
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-cyan-500/20 border-2 border-cyan-500/60 rounded-xl px-5 py-2.5 text-sm font-bold text-cyan-300 text-center">
                                                {NONCLUSTERED_BTREE.root.page}
                                            </div>
                                            <div className="flex gap-3 flex-wrap justify-center">
                                                {NONCLUSTERED_BTREE.branch.map((b, i) => (
                                                    <div key={i} className="bg-blue-500/15 border border-blue-500/40 rounded-lg px-3 py-2 text-center">
                                                        <div className="text-[10px] font-bold text-blue-300">{b.page}</div>
                                                        <div className="text-[9px] font-mono text-white/40">{b.keys.join(' | ')}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <ArrowDown className="w-4 h-4 text-white/30" />
                                            {/* Leaf nodes with RID pointers */}
                                            <div className="flex gap-2 flex-wrap justify-center">
                                                {NONCLUSTERED_BTREE.leaves.map((lf, i) => (
                                                    <div key={i} className="bg-black/40 border border-cyan-500/30 rounded-xl p-2 text-center min-w-[90px]">
                                                        <div className="text-[9px] font-bold text-cyan-400 mb-1">{lf.page}</div>
                                                        <div className="text-[10px] font-mono text-white/70">${(lf.salary/1000).toFixed(0)}k</div>
                                                        <div className="text-[9px] text-amber-400 mt-1 font-mono">{lf.rid}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-2 text-[11px] text-amber-400/70 font-mono border border-amber-500/20 bg-amber-500/5 rounded-lg px-4 py-2 text-center">
                                                ↑ Leaf pages contain Key + RID pointer only → extra lookup needed!
                                            </div>
                                        </div>
                                    </div>

                                    {/* Covering Index example */}
                                    <div className="flex flex-col gap-4">
                                        <div className="text-[10px] font-bold uppercase text-amber-400 mb-1">{t('coveringIndexTitle')}</div>
                                        <div className="bg-black/30 border border-amber-500/30 rounded-xl p-4 space-y-3">
                                            <p className="text-sm text-white/80 leading-relaxed">{t('coveringIndexDesc')}</p>
                                            <div className="font-mono text-xs bg-black/60 p-3 rounded-lg text-amber-300 leading-relaxed whitespace-pre">{
`-- Without INCLUDE: key lookup needed
CREATE NONCLUSTERED INDEX IX_Emp_Salary
ON Employees(Salary);

-- With INCLUDE: covering index, 0 lookups
CREATE NONCLUSTERED INDEX IX_Emp_Salary_Cov
ON Employees(Salary)
INCLUDE (Name, Dept);`}
                                            </div>
                                        </div>

                                        {/* Lookup cost visualizer */}
                                        <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                                            <div className="text-xs font-bold text-white mb-3">{t('lookupCostTitle')}</div>
                                            <div className="space-y-3">
                                                {[
                                                    { label: t('ciLookup'), reads: 3, color: 'bg-emerald-500', note: t('ciLookupNote') },
                                                    { label: t('nciLookup'), reads: 6, color: 'bg-amber-500', note: t('nciLookupNote') },
                                                    { label: t('coveringLookup'), reads: 3, color: 'bg-cyan-500', note: t('coveringLookupNote') },
                                                ].map(({ label, reads, color, note }) => (
                                                    <div key={label}>
                                                        <div className="flex justify-between text-[11px] mb-1">
                                                            <span className="text-white/80">{label}</span>
                                                            <span className="font-mono text-muted-foreground">{reads} {t('logicalReads')}</span>
                                                        </div>
                                                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${(reads / 6) * 100}%` }}
                                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                                className={cn('h-full rounded-full', color)} />
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground mt-0.5">{note}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fragmentation explainer */}
                            <div className="glass-panel p-6 rounded-2xl border-l-4 border-rose-500">
                                <h4 className="text-base font-bold text-rose-400 mb-3 flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4" /> {t('fragTitle')}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    {([
                                        ['0–10%', t('fragLow'), 'text-emerald-400', 'border-emerald-500/30'],
                                        ['10–30%', t('fragMed'), 'text-amber-400', 'border-amber-500/30'],
                                        ['>30%', t('fragHigh'), 'text-rose-400', 'border-rose-500/30'],
                                    ] as [string, string, string, string][]).map(([pct, action, color, border]) => (
                                        <div key={pct} className={`bg-black/30 border ${border} rounded-xl p-4`}>
                                            <div className={`text-2xl font-black ${color} mb-1`}>{pct}</div>
                                            <div className="text-white/70 text-xs">{action}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 font-mono text-xs bg-black/40 p-4 rounded-xl text-white/70 leading-relaxed">
                                    {`-- Check fragmentation\nSELECT object_name(object_id) AS tbl,\n  index_id, avg_fragmentation_in_percent, page_count\nFROM sys.dm_db_index_physical_stats\n  (DB_ID(), NULL, NULL, NULL, 'LIMITED')\nWHERE avg_fragmentation_in_percent > 10\nORDER BY avg_fragmentation_in_percent DESC;\n\n-- Reorganize (<30%) vs Rebuild (>30%)\nALTER INDEX IX_Emp_Salary ON Employees REORGANIZE;\nALTER INDEX IX_Emp_Salary ON Employees REBUILD WITH (ONLINE = ON);`}
                                </div>
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
                    '2019': `-- Check index usage statistics\nSELECT\n  OBJECT_NAME(i.object_id) AS table_name,\n  i.name AS index_name,\n  i.type_desc,\n  ius.user_seeks, ius.user_scans, ius.user_lookups,\n  ius.user_updates\nFROM sys.indexes i\nLEFT JOIN sys.dm_db_index_usage_stats ius\n  ON i.object_id = ius.object_id AND i.index_id = ius.index_id\n  AND ius.database_id = DB_ID()\nWHERE OBJECTPROPERTY(i.object_id,'IsUserTable') = 1\nORDER BY ius.user_seeks + ius.user_scans DESC;\n\n-- Missing index recommendations\nSELECT TOP 10\n  ROUND(gs.avg_total_user_cost * gs.avg_user_impact\n        * (gs.user_seeks + gs.user_scans), 0) AS benefit_score,\n  d.statement AS table_name,\n  d.equality_columns, d.inequality_columns, d.included_columns\nFROM sys.dm_db_missing_index_details d\nJOIN sys.dm_db_missing_index_groups g ON d.index_handle = g.index_handle\nJOIN sys.dm_db_missing_index_group_stats gs ON g.index_group_handle = gs.group_handle\nORDER BY benefit_score DESC;`,
                    '2022': `-- Check index usage statistics\nSELECT\n  OBJECT_NAME(i.object_id) AS table_name,\n  i.name AS index_name,\n  i.type_desc,\n  ius.user_seeks, ius.user_scans, ius.user_lookups,\n  ius.user_updates\nFROM sys.indexes i\nLEFT JOIN sys.dm_db_index_usage_stats ius\n  ON i.object_id = ius.object_id AND i.index_id = ius.index_id\n  AND ius.database_id = DB_ID()\nWHERE OBJECTPROPERTY(i.object_id,'IsUserTable') = 1\nORDER BY ius.user_seeks + ius.user_scans DESC;\n\n-- Missing index recommendations\nSELECT TOP 10\n  ROUND(gs.avg_total_user_cost * gs.avg_user_impact\n        * (gs.user_seeks + gs.user_scans), 0) AS benefit_score,\n  d.statement AS table_name,\n  d.equality_columns, d.inequality_columns, d.included_columns\nFROM sys.dm_db_missing_index_details d\nJOIN sys.dm_db_missing_index_groups g ON d.index_handle = g.index_handle\nJOIN sys.dm_db_missing_index_group_stats gs ON g.index_group_handle = gs.group_handle\nORDER BY benefit_score DESC;`,
                    '2025': `-- Check index usage statistics\nSELECT\n  OBJECT_NAME(i.object_id) AS table_name,\n  i.name AS index_name,\n  i.type_desc,\n  ius.user_seeks, ius.user_scans, ius.user_lookups,\n  ius.user_updates\nFROM sys.indexes i\nLEFT JOIN sys.dm_db_index_usage_stats ius\n  ON i.object_id = ius.object_id AND i.index_id = ius.index_id\n  AND ius.database_id = DB_ID()\nWHERE OBJECTPROPERTY(i.object_id,'IsUserTable') = 1\nORDER BY ius.user_seeks + ius.user_scans DESC;`
                }}
                remediationTitle={t('indexRemediationTitle')}
                remediationScript={{
                    '2019': `-- Create Clustered Index (Primary Key)\nCREATE CLUSTERED INDEX CIX_Employees_Id\nON Employees(EmployeeId);\n\n-- Create Non-Clustered Index with covering columns\nCREATE NONCLUSTERED INDEX IX_Employees_Salary\nON Employees(Salary)\nINSIDE (Name, Department);\n\n-- Check fragmentation and rebuild/reorganize\nALTER INDEX IX_Employees_Salary ON Employees\nREBUILD WITH (FILLFACTOR = 80, ONLINE = ON);`,
                    '2022': `-- Create Clustered Index (Primary Key)\nCREATE CLUSTERED INDEX CIX_Employees_Id\nON Employees(EmployeeId);\n\n-- Create Non-Clustered Index with covering columns  \nCREATE NONCLUSTERED INDEX IX_Employees_Salary\nON Employees(Salary)\nINCLUDE (Name, Department);\n\n-- 2022: Resumable index rebuild\nALTER INDEX IX_Employees_Salary ON Employees\nREBUILD WITH (RESUMABLE = ON, MAX_DURATION = 60, ONLINE = ON);`,
                    '2025': `-- Create Clustered Index\nCREATE CLUSTERED INDEX CIX_Employees_Id\nON Employees(EmployeeId);\n\n-- Create Non-Clustered covering index\nCREATE NONCLUSTERED INDEX IX_Employees_Salary\nON Employees(Salary)\nINCLUDE (Name, Department);\n\n-- 2025: Intelligent index management\nALTER INDEX IX_Employees_Salary ON Employees\nREBUILD WITH (RESUMABLE = ON, ONLINE = ON);`
                }}
            />
        </div>
    );
}
