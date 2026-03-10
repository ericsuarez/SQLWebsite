import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Zap, FileWarning, ShieldCheck, HardDrive, Cpu, Code2, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { TSqlModal } from '../Shared/TSqlModal';
import { REAL_CASES } from './realCasesData';
import { RealCaseScenario } from './RealCaseScenario';

export function DBAScenarios() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'pageSplit' | 'ifi' | 'creation' | 'realCases'>('pageSplit');

    // Page Split
    const [fillFactor, setFillFactor] = useState(100);
    const [pages, setPages] = useState<number[][]>([[1, 2, 3, 4, 5]]);
    const maxRows = 6;

    // IFI
    const [ifiEnabled, setIfiEnabled] = useState(false);
    const [dbStatus, setDbStatus] = useState<'idle' | 'creating' | 'done'>('idle');
    const [progress, setProgress] = useState(0);
    const [isTsqlOpen, setIsTsqlOpen] = useState(false);

    const insertRow = () => {
        let np = [...pages]; let lp = [...np[np.length - 1]];
        const max = Math.ceil(maxRows * (fillFactor / 100));
        if (lp.length >= max) {
            const mid = Math.floor(lp.length / 2);
            np[np.length - 1] = lp.slice(0, mid);
            np.push([...lp.slice(mid), lp.slice(mid).length + mid + 1]);
        } else { lp.push(lp.length + 1); np[np.length - 1] = lp; }
        setPages(np);
    };
    const resetPages = () => setPages([[1, 2]]);
    const createDatabase = () => { setDbStatus('creating'); setProgress(0); };
    const frag = Math.round(pages.length > 1 ? (pages.filter(p => (p.length / maxRows) < 0.8).length / pages.length) * 100 : 0);

    useEffect(() => {
        if (dbStatus === 'creating') {
            const step = ifiEnabled ? 100 : 5;
            const iv = setInterval(() => setProgress(p => { if (p >= 100) { clearInterval(iv); setDbStatus('done'); return 100; } return Math.min(100, p + step); }), 100);
            return () => clearInterval(iv);
        }
    }, [dbStatus, ifiEnabled]);

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-orange-400">{t('dbaTitle')}</h2>
                <p className="text-muted-foreground">{t('dbaDescription')}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3">
                {(['pageSplit', 'ifi', 'creation'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={cn('px-4 py-2 rounded-lg font-bold transition-all text-sm', activeTab === tab ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-white/5 text-muted-foreground hover:bg-white/10')}>
                        {t(tab === 'pageSplit' ? 'tabPageSplit' : tab === 'ifi' ? 'tabIfi' : 'tabCreation')}
                    </button>
                ))}
                <button onClick={() => setActiveTab('realCases')}
                    className={cn('px-4 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-1.5', activeTab === 'realCases' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-muted-foreground hover:bg-white/10')}>
                    <AlertTriangle className="w-3.5 h-3.5" />{t('tabRealCases')}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">

                {/* PAGE SPLIT */}
                {activeTab === 'pageSplit' && (
                    <div className="glass-panel p-6 rounded-2xl border-rose-500/30 flex flex-col gap-6">
                        <div className="flex justify-between items-start flex-col lg:flex-row gap-4">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                                    <FileWarning className="w-5 h-5 text-rose-400" />{t('pageSplitTitle')}
                                    <button onClick={() => setIsTsqlOpen(true)} className="ml-4 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"><Code2 className="w-3.5 h-3.5" />{t('viewTsql')}</button>
                                </h3>
                                <p className="text-sm text-muted-foreground">{t('pageSplitDesc')}</p>
                            </div>
                            <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/10 flex-wrap">
                                <div className="flex flex-col gap-1 w-32">
                                    <label className="text-xs text-muted-foreground font-bold">{t('fillfactorLabel')}: {fillFactor}%</label>
                                    <input type="range" min="50" max="100" step="10" value={fillFactor} onChange={e => setFillFactor(Number(e.target.value))} className="accent-rose-500" />
                                </div>
                                <div className="flex flex-col px-2">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('fragmentationLabel')}</span>
                                    <span className={cn('text-xl font-black', frag > 50 ? 'text-rose-500' : frag > 20 ? 'text-amber-500' : 'text-emerald-500')}>{frag}%</span>
                                </div>
                                <button onClick={insertRow} className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded font-bold transition-colors">{t('insertRowBtn')}</button>
                                <button onClick={resetPages} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-muted-foreground rounded transition-colors">{t('resetBtn')}</button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 items-start">
                            {pages.map((page, i) => (
                                <motion.div key={i} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                    className={cn('w-44 h-60 border-2 rounded-xl flex flex-col p-2 gap-1 bg-black/40', page.length >= Math.ceil(maxRows * (fillFactor / 100)) ? 'border-rose-500/50' : 'border-emerald-500/30')}>
                                    <div className="text-xs font-bold text-center border-b border-white/10 pb-1 mb-1 text-muted-foreground">Page {i + 1}</div>
                                    {page.map((row, j) => (
                                        <motion.div key={row} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/20 text-emerald-300 text-xs p-1.5 rounded border border-emerald-500/30 flex justify-between">
                                            <span>{t('rowData')}</span><span className="opacity-50">#{j + 1}</span>
                                        </motion.div>
                                    ))}
                                    <div className="flex-1" />
                                    <div className="text-[10px] text-muted-foreground/50 border-t border-white/10 pt-1 mt-1 flex justify-between px-1">
                                        <span>{t('usedLabel')}: {Math.round((page.length / maxRows) * 100)}%</span>
                                        <span className={page.length >= Math.ceil(maxRows * (fillFactor / 100)) ? 'text-rose-400 font-bold' : ''}>{t('maxLabel')}: {fillFactor}%</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* IFI */}
                {activeTab === 'ifi' && (
                    <div className="glass-panel p-6 rounded-2xl border-orange-500/30 flex flex-col gap-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-orange-400">
                            <ShieldCheck className="w-5 h-5" />{t('ifiTitle')}
                            <button onClick={() => setIsTsqlOpen(true)} className="ml-4 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"><Code2 className="w-3.5 h-3.5" />{t('viewTsql')}</button>
                        </h3>
                        <p className="text-muted-foreground">{t('ifiDesc')}</p>
                        <div className="bg-black/40 p-6 rounded-xl border border-white/10 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn('w-12 h-6 rounded-full p-1 cursor-pointer transition-colors', ifiEnabled ? 'bg-emerald-500' : 'bg-white/10')} onClick={() => setIfiEnabled(x => !x)}>
                                        <motion.div className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: ifiEnabled ? 24 : 0 }} />
                                    </div>
                                    <span className="font-bold">{t('enableIfi')}</span>
                                </div>
                                <button onClick={createDatabase} disabled={dbStatus === 'creating'} className="px-6 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300 rounded-lg font-bold transition-all disabled:opacity-50">{t('allocateBtn')}</button>
                            </div>
                            {dbStatus !== 'idle' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className={dbStatus === 'done' ? 'text-emerald-400' : 'text-orange-400 animate-pulse'}>{dbStatus === 'creating' ? (ifiEnabled ? 'Calling SetFileValidData()...' : t('zeroingDisk')) : t('allocationComplete')}</span>
                                        <span className="text-muted-foreground">10,000 MB</span>
                                    </div>
                                    <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                        <motion.div className={cn('h-full', ifiEnabled ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-orange-500')} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        {!ifiEnabled && dbStatus === 'creating' && <p className="text-xs text-rose-400">{t('noticeDelay')}</p>}
                                        <div className="flex items-center gap-2 text-xs font-mono ml-auto bg-black/50 px-3 py-1.5 rounded text-muted-foreground border border-white/10">
                                            <Cpu className="w-3 h-3 text-cyan-400" />{t('apiCallLabel')}
                                            <span className={ifiEnabled ? 'text-emerald-400 font-bold' : 'text-orange-400'}>{ifiEnabled ? 'SetFileValidData(hFile, 10GB)' : 'WriteFile(hFile, 0x00...)'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* CREATION */}
                {activeTab === 'creation' && (
                    <div className="glass-panel p-6 rounded-2xl border-purple-500/30 flex flex-col gap-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400"><Database className="w-5 h-5" />{t('dbCreationTitle')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-black/40 p-5 border border-white/10 rounded-xl space-y-4">
                                <h4 className="font-bold text-emerald-400 flex items-center gap-2"><HardDrive className="w-4 h-4" />{t('mdfTitle')}</h4>
                                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-2"><li>{t('mdfDesc1')}</li><li>{t('mdfDesc2')}</li><li>{t('mdfDesc3')}</li><li>{t('mdfDesc4')}</li></ul>
                            </div>
                            <div className="bg-black/40 p-5 border border-white/10 rounded-xl space-y-4">
                                <h4 className="font-bold text-amber-400 flex items-center gap-2"><Zap className="w-4 h-4" />{t('ldfTitle')}</h4>
                                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-2"><li>{t('ldfDesc1')}</li><li>{t('ldfDesc2')}</li><li>{t('ldfDesc3')}</li><li><strong className="text-rose-400">{t('ldfDesc4')}</strong></li></ul>
                            </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg font-mono text-sm border border-white/10">
                            <span className="text-blue-400">CREATE DATABASE</span> <span className="text-white">SalesDB</span><br />
                            <span className="text-blue-400">ON PRIMARY</span><br />
                            &nbsp;&nbsp;(<span className="text-purple-400">NAME</span> = <span className="text-emerald-300">'SalesDB_Data'</span>,<br />
                            &nbsp;&nbsp;&nbsp;<span className="text-purple-400">FILENAME</span> = <span className="text-emerald-300">'D:\Data\SalesDB.mdf'</span>,<br />
                            &nbsp;&nbsp;&nbsp;<span className="text-purple-400">SIZE</span> = <span className="text-white">10GB</span>, <span className="text-purple-400">FILEGROWTH</span> = <span className="text-white">1GB</span>)<br />
                            <span className="text-blue-400">LOG ON</span><br />
                            &nbsp;&nbsp;(<span className="text-purple-400">NAME</span> = <span className="text-emerald-300">'SalesDB_Log'</span>,<br />
                            &nbsp;&nbsp;&nbsp;<span className="text-purple-400">FILENAME</span> = <span className="text-emerald-300">'L:\Logs\SalesDB_log.ldf'</span>,<br />
                            &nbsp;&nbsp;&nbsp;<span className="text-purple-400">SIZE</span> = <span className="text-white">2GB</span>, <span className="text-purple-400">FILEGROWTH</span> = <span className="text-white">500MB</span>);
                        </div>
                    </div>
                )}

                {/* REAL CASES — delegates to RealCaseScenario */}
                {activeTab === 'realCases' && (
                    <div className="flex flex-col gap-4">
                        <div className="glass-panel p-5 rounded-2xl border-cyan-500/30">
                            <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2 mb-1"><AlertTriangle className="w-5 h-5" />{t('realCasesTitle')}</h3>
                            <p className="text-sm text-muted-foreground">{t('realCasesDesc')}</p>
                        </div>
                        <RealCaseScenario cases={REAL_CASES} />
                    </div>
                )}
            </div>

            <TSqlModal
                isOpen={isTsqlOpen}
                onClose={() => setIsTsqlOpen(false)}
                title={activeTab === 'pageSplit' ? t('dbaTsqlSplitTitle') : activeTab === 'ifi' ? t('dbaTsqlIfiTitle') : ''}
                description={activeTab === 'pageSplit' ? t('dbaTsqlSplitDesc') : activeTab === 'ifi' ? t('dbaTsqlIfiDesc') : ''}
                diagnosticScript={{
                    '2019': activeTab === 'pageSplit'
                        ? `SELECT dm.index_id, dm.avg_fragmentation_in_percent\nFROM sys.dm_db_index_physical_stats (DB_ID(), NULL, NULL, NULL, 'LIMITED') dm\nWHERE avg_fragmentation_in_percent > 10.0;`
                        : `SELECT servicename, instant_file_initialization_enabled FROM sys.dm_server_services;`,
                    '2022': activeTab === 'pageSplit'
                        ? `SELECT dm.index_id, dm.avg_fragmentation_in_percent\nFROM sys.dm_db_index_physical_stats (DB_ID(), NULL, NULL, NULL, 'LIMITED') dm\nWHERE avg_fragmentation_in_percent > 10.0;`
                        : `SELECT servicename, instant_file_initialization_enabled FROM sys.dm_server_services;`,
                    '2025': activeTab === 'pageSplit'
                        ? `SELECT dm.index_id, dm.avg_fragmentation_in_percent\nFROM sys.dm_db_index_physical_stats (DB_ID(), NULL, NULL, NULL, 'LIMITED') dm\nWHERE avg_fragmentation_in_percent > 10.0;`
                        : `SELECT servicename, instant_file_initialization_enabled FROM sys.dm_server_services;`,
                }}
                remediationTitle={activeTab === 'pageSplit' ? t('dbaRemediationSplitTitle') : t('dbaRemediationIfiTitle')}
                remediationScript={{
                    '2019': activeTab === 'pageSplit' ? `ALTER INDEX ALL ON TableName REBUILD WITH (FILLFACTOR = 80, ONLINE = ON);` : `-- Enable via Local Security Policy`,
                    '2022': activeTab === 'pageSplit' ? `ALTER INDEX ALL ON TableName REBUILD WITH (FILLFACTOR = 80, ONLINE = ON, RESUMABLE = ON);` : `-- Enable via Local Security Policy`,
                    '2025': activeTab === 'pageSplit' ? `ALTER INDEX ALL ON TableName REBUILD WITH (FILLFACTOR = 80, ONLINE = ON, RESUMABLE = ON);` : `-- Enable via Local Security Policy`,
                }}
            />
        </div>
    );
}
