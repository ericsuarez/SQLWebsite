import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Zap, FileWarning, HardDrive, Code2, Wrench } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { TSqlModal } from '../Shared/TSqlModal';
import { IndustryStandardJobs } from './IndustryStandardJobs';
export function DBAScenarios() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'pageSplit' | 'creation' | 'jobs'>('pageSplit');

    // Page Split
    const [fillFactor, setFillFactor] = useState(100);
    const [pages, setPages] = useState<number[][]>([[1, 2, 3, 4, 5]]);
    const maxRows = 6;

    const [isTsqlOpen, setIsTsqlOpen] = useState(false);

    const insertRow = () => {
        const np = [...pages]; const lp = [...np[np.length - 1]];
        const max = Math.ceil(maxRows * (fillFactor / 100));
        if (lp.length >= max) {
            const mid = Math.floor(lp.length / 2);
            np[np.length - 1] = lp.slice(0, mid);
            np.push([...lp.slice(mid), lp.slice(mid).length + mid + 1]);
        } else { lp.push(lp.length + 1); np[np.length - 1] = lp; }
        setPages(np);
    };
    const resetPages = () => setPages([[1, 2]]);
    const frag = Math.round(pages.length > 1 ? (pages.filter(p => (p.length / maxRows) < 0.8).length / pages.length) * 100 : 0);

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-orange-400">{t('dbaTitle')}</h2>
                <p className="text-muted-foreground">{t('dbaDescription')}</p>
            </div>

            <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3">
                {[
                    { id: 'pageSplit' as const, titleKey: 'tabPageSplit' as const, icon: FileWarning, active: 'bg-rose-500/20 text-rose-400 border border-rose-500/50' },
                    { id: 'creation' as const, titleKey: 'tabCreation' as const, icon: Database, active: 'bg-purple-500/20 text-purple-300 border border-purple-500/50' },
                    { id: 'jobs' as const, titleKey: 'tabIndustryJobs' as const, icon: Wrench, active: 'bg-amber-500/20 text-amber-300 border border-amber-500/50' },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-4 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-2',
                                isActive ? tab.active : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent'
                            )}
                        >
                            <Icon className={cn('w-4 h-4', isActive ? '' : 'text-muted-foreground')} />
                            {t(tab.titleKey)}
                        </button>
                    );
                })}
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

                {/* INDUSTRY JOBS */}
                {activeTab === 'jobs' && (
                    <div className="flex flex-col gap-6">
                        <IndustryStandardJobs />
                    </div>
                )}

            </div>

            <TSqlModal
                isOpen={isTsqlOpen}
                onClose={() => setIsTsqlOpen(false)}
                title={t('dbaTsqlSplitTitle')}
                description={t('dbaTsqlSplitDesc')}
                diagnosticScript={{
                    '2019': `SELECT dm.index_id, dm.avg_fragmentation_in_percent\nFROM sys.dm_db_index_physical_stats (DB_ID(), NULL, NULL, NULL, 'LIMITED') dm\nWHERE avg_fragmentation_in_percent > 10.0;`,
                    '2022': `SELECT dm.index_id, dm.avg_fragmentation_in_percent\nFROM sys.dm_db_index_physical_stats (DB_ID(), NULL, NULL, NULL, 'LIMITED') dm\nWHERE avg_fragmentation_in_percent > 10.0;`,
                    '2025': `SELECT dm.index_id, dm.avg_fragmentation_in_percent\nFROM sys.dm_db_index_physical_stats (DB_ID(), NULL, NULL, NULL, 'LIMITED') dm\nWHERE avg_fragmentation_in_percent > 10.0;`,
                }}
                remediationTitle={t('dbaRemediationSplitTitle')}
                remediationScript={{
                    '2019': `ALTER INDEX ALL ON TableName REBUILD WITH (FILLFACTOR = 80, ONLINE = ON);`,
                    '2022': `ALTER INDEX ALL ON TableName REBUILD WITH (FILLFACTOR = 80, ONLINE = ON, RESUMABLE = ON);`,
                    '2025': `ALTER INDEX ALL ON TableName REBUILD WITH (FILLFACTOR = 80, ONLINE = ON, RESUMABLE = ON);`,
                }}
            />
        </div>
    );
}
