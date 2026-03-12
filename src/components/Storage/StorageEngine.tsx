import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, File, Database, ArrowRight, ArrowLeft, Play, Save, History, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';

type ViewState = 'overview' | 'extent' | 'page';

interface ExtentData {
    id: number;
    type: 'Uniform' | 'Mixed';
    allocated: boolean;
}

type PageTone = 'emerald' | 'blue' | 'amber' | 'rose' | 'violet' | 'gray';

interface ExtentPageCell {
    id: number;
    allocated: boolean;
    owner: string;
    tone: PageTone;
    usedPct: number; // 0..100
}

export function StorageEngine() {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'files' | 'backups'>('files');
    const [viewState, setViewState] = useState<ViewState>('overview');
    const [selectedExtent, setSelectedExtent] = useState<number | null>(null);
    const [selectedPage, setSelectedPage] = useState<number | null>(null);
    const [gamLog, setGamLog] = useState<string | null>(null);

    // Backup State
    const [recoveryMode, setRecoveryMode] = useState<'Simple' | 'Full'>('Full');
    const [logFullness, setLogFullness] = useState(0); // 0 to 100
    const [backupLog, setBackupLog] = useState<{ time: string, msg: string }[]>([]);

    const [extents, setExtents] = useState<ExtentData[]>(
        Array.from({ length: 12 }, (_, i) => ({
            id: i,
            type: i % 3 === 0 ? 'Mixed' : 'Uniform',
            allocated: i < 4
        }))
    );

    const pagesArray = Array.from({ length: 8 }, (_, i) => i);
    const PAGE_STYLE: Record<
        PageTone,
        {
            border: string;
            hoverBorder: string;
            bar: string;
            fill: string;
            badge: string;
            hoverIcon: string;
            tag: string;
            row: string;
            rowCode: string;
        }
    > = {
        emerald: {
            border: 'border-emerald-500/30',
            hoverBorder: 'hover:border-emerald-400/60',
            bar: 'bg-emerald-500/20',
            fill: 'bg-emerald-400',
            badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
            hoverIcon: 'group-hover:text-emerald-400/60',
            tag: 'text-emerald-400',
            row: 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400',
            rowCode: 'text-emerald-400',
        },
        blue: {
            border: 'border-blue-500/30',
            hoverBorder: 'hover:border-blue-400/60',
            bar: 'bg-blue-500/20',
            fill: 'bg-blue-400',
            badge: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
            hoverIcon: 'group-hover:text-blue-300/70',
            tag: 'text-blue-300',
            row: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-400',
            rowCode: 'text-blue-300',
        },
        amber: {
            border: 'border-amber-500/30',
            hoverBorder: 'hover:border-amber-400/60',
            bar: 'bg-amber-500/20',
            fill: 'bg-amber-400',
            badge: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
            hoverIcon: 'group-hover:text-amber-300/70',
            tag: 'text-amber-300',
            row: 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400',
            rowCode: 'text-amber-300',
        },
        rose: {
            border: 'border-rose-500/30',
            hoverBorder: 'hover:border-rose-400/60',
            bar: 'bg-rose-500/20',
            fill: 'bg-rose-400',
            badge: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
            hoverIcon: 'group-hover:text-rose-300/70',
            tag: 'text-rose-300',
            row: 'bg-rose-500/10 border-rose-500/30 hover:border-rose-400',
            rowCode: 'text-rose-300',
        },
        violet: {
            border: 'border-violet-500/30',
            hoverBorder: 'hover:border-violet-400/60',
            bar: 'bg-violet-500/20',
            fill: 'bg-violet-400',
            badge: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
            hoverIcon: 'group-hover:text-violet-300/70',
            tag: 'text-violet-300',
            row: 'bg-violet-500/10 border-violet-500/30 hover:border-violet-400',
            rowCode: 'text-violet-300',
        },
        gray: {
            border: 'border-white/15',
            hoverBorder: 'hover:border-white/25',
            bar: 'bg-white/10',
            fill: 'bg-white/30',
            badge: 'border-white/10 bg-black/30 text-white/60',
            hoverIcon: 'group-hover:text-white/30',
            tag: 'text-white/60',
            row: 'bg-white/5 border-white/10 hover:border-white/20',
            rowCode: 'text-white/60',
        },
    };

    const buildExtentPages = (ext: ExtentData): ExtentPageCell[] => {
        if (!ext.allocated) {
            return pagesArray.map((id) => ({
                id,
                allocated: false,
                owner: language === 'es' ? 'LIBRE' : 'FREE',
                tone: 'gray',
                usedPct: 0,
            }));
        }

        if (ext.type === 'Uniform') {
            return pagesArray.map((id) => ({
                id,
                allocated: true,
                owner: language === 'es' ? 'OBJ U' : 'OBJ U',
                tone: 'emerald',
                usedPct: 55 + ((ext.id * 11 + id * 7) % 40),
            }));
        }

        const owners: { owner: string; tone: PageTone }[] = [
            { owner: language === 'es' ? 'OBJ A' : 'OBJ A', tone: 'blue' },
            { owner: language === 'es' ? 'OBJ B' : 'OBJ B', tone: 'amber' },
            { owner: language === 'es' ? 'OBJ C' : 'OBJ C', tone: 'rose' },
            { owner: language === 'es' ? 'OBJ D' : 'OBJ D', tone: 'violet' },
        ];

        const allocatedCount = Math.min(7, 3 + (ext.id % 3)); // always leave at least 1 free page

        return pagesArray.map((id) => {
            const allocated = id < allocatedCount;
            if (!allocated) {
                return {
                    id,
                    allocated: false,
                    owner: language === 'es' ? 'LIBRE' : 'FREE',
                    tone: 'gray',
                    usedPct: 0,
                };
            }

            const selectedOwner = owners[(ext.id + id) % owners.length];
            return {
                id,
                allocated: true,
                owner: selectedOwner.owner,
                tone: selectedOwner.tone,
                usedPct: 55 + ((ext.id * 13 + id * 17) % 40),
            };
        });
    };
    const ui = language === 'es'
        ? {
            filesAndPages: 'Archivos y paginas',
            overviewDesc: 'SQL Server almacena los datos en paginas de 8 KB y extents de 64 KB.',
            backToFiles: 'Volver a Archivos',
            backToExtent: 'Volver al Extent',
            viewingExtent: 'Viendo el extent {id}. Un extent es un conjunto de 8 paginas contiguas.',
            viewingPage: 'Viendo la pagina {id}. Unidad de 8 KB con cabecera, datos y slot array.',
            dataFile: 'Archivo de datos .MDF',
            dataFileDesc: 'Los archivos de datos se dividen logicamente en paginas (8 KB) y extents (64 KB). Las primeras paginas se reservan para metadatos estructurales.',
            allocationMaps: 'Mapas de asignacion',
            extentsView: 'Vista de extents',
            extentContains: 'Contiene 8 paginas contiguas de 8 KB (64 KB en total)',
            waitingBackup: 'Esperando actividad de backup...',
            transactionLog: 'Estado del transaction log (.LDF)',
            transactionLogDesc: 'Observa como cambia el uso del log segun el modelo de recuperacion y los backups.',
            logFileFull: 'LOG FILE FULL!',
            allocFree: 'Libre en GAM',
            allocMixed: 'Extent mixto (SGAM)',
            allocUniform: 'Uniforme - asignado en GAM',
            allocBitMixed: 'SGAM bit = 1 - quedan paginas libres',
            allocBitAllocated: 'GAM bit = 0 - asignado',
            allocBitFree: 'GAM bit = 1 - libre',
            pageHeader: 'Cabecera',
            prevPage: 'Pagina anterior',
            nextPage: 'Pagina siguiente',
            pageHeaderTitle: 'Cabecera de pagina (96 bytes)',
            dataRowsTitle: 'Filas de datos (8060 bytes)',
            freeSpace: 'Espacio libre para inserts y updates',
            slotArray: 'Slot array',
            recoveryModels: 'Modelos de recuperacion',
            checkpointSimple: 'CHECKPOINT: log truncado automaticamente (modo simple)',
            usedPct: '{pct}% usado',
        }
        : {
            filesAndPages: 'Files & Pages',
            overviewDesc: 'SQL Server stores data in 8KB Pages and 64KB Extents.',
            backToFiles: 'Back to Files',
            backToExtent: 'Back to Extent',
            viewingExtent: 'Viewing Extent {id}. An extent is a collection of 8 contiguous pages.',
            viewingPage: 'Viewing Page {id}. 8KB structural unit showing header, data and slot array.',
            dataFile: '.MDF Data File',
            dataFileDesc: 'Data files are logically divided into pages (8KB) and extents (64KB). The first pages are reserved for structural metadata.',
            allocationMaps: 'Allocation Maps',
            extentsView: 'Extents View',
            extentContains: 'Contains 8 contiguous 8KB pages (Total 64KB)',
            waitingBackup: 'Waiting for backup activity...',
            transactionLog: 'Transaction Log (.LDF) Status',
            transactionLogDesc: 'Watch how different recovery models affect the transaction log size.',
            logFileFull: 'LOG FILE FULL!',
            allocFree: 'Free in GAM',
            allocMixed: 'Mixed Extent (SGAM)',
            allocUniform: 'Uniform - allocated in GAM',
            allocBitMixed: 'SGAM bit = 1 - still has free pages',
            allocBitAllocated: 'GAM bit = 0 - allocated',
            allocBitFree: 'GAM bit = 1 - free',
            pageHeader: 'Header',
            prevPage: 'PrevPage',
            nextPage: 'NextPage',
            pageHeaderTitle: 'Page Header (96 Bytes)',
            dataRowsTitle: 'Data Rows (8060 Bytes)',
            freeSpace: 'Free space available for inserts and updates',
            slotArray: 'Slot Array',
            recoveryModels: 'Recovery Models',
            checkpointSimple: 'CHECKPOINT: Log auto-truncated (Simple Mode)',
            usedPct: '{pct}% used',
        };

    const allocateExtent = () => {
        const freeExtentIndex = extents.findIndex(e => !e.allocated);
        if (freeExtentIndex === -1) return; // All allocated

        const newExtents = [...extents];
        newExtents[freeExtentIndex].allocated = true;
        setExtents(newExtents);

        const logText = t('extentAllocatedLog').replace('{id}', freeExtentIndex.toString());
        setGamLog(logText);
        setTimeout(() => setGamLog(null), 3000);
    };

    // Simulate database activity filling the log
    useEffect(() => {
        if (activeTab !== 'backups') return;

        const interval = setInterval(() => {
            setLogFullness(prev => {
                const newVal = prev + Math.floor(Math.random() * 5) + 2;
                if (recoveryMode === 'Simple' && newVal > 60) {
                    addBackupLog(ui.checkpointSimple);
                    return 10;
                }
                return Math.min(newVal, 100);
            });
        }, 1500);

        return () => clearInterval(interval);
    }, [activeTab, recoveryMode]);

    const addBackupLog = (msg: string) => {
        setBackupLog(prev => [{ time: new Date().toLocaleTimeString(), msg }, ...prev].slice(0, 5));
    };

    const takeFullBackup = () => {
        addBackupLog(t('backupLogActivity').replace('{type}', 'FULL (.bak)'));
        if (recoveryMode === 'Simple') {
            setLogFullness(10);
        }
    };

    const takeTrnBackup = () => {
        if (recoveryMode !== 'Full') return;
        addBackupLog(t('backupLogActivity').replace('{type}', 'LOG (.trn)'));
        addBackupLog(t('logBackupDesc'));
        setLogFullness(10); // Truncate log
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col gap-4 relative">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                            {t('storageEngine')}
                        </h2>
                        <p className="text-muted-foreground mt-2 flex items-center gap-2 flex-wrap">
                            {activeTab === 'files' && viewState === 'overview' && ui.overviewDesc}
                            {activeTab === 'files' && viewState === 'extent' && (
                                <>
                                    <button
                                        onClick={() => setViewState('overview')}
                                        className="hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded"
                                    >
                                        <ArrowLeft className="w-3 h-3" /> {ui.backToFiles}
                                    </button>
                                    <span>{ui.viewingExtent.replace('{id}', String(selectedExtent))}</span>
                                </>
                            )}
                            {activeTab === 'files' && viewState === 'page' && (
                                <>
                                    <button
                                        onClick={() => setViewState('extent')}
                                        className="hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded"
                                    >
                                        <ArrowLeft className="w-3 h-3" /> {ui.backToExtent}
                                    </button>
                                    <span>{ui.viewingPage.replace('{id}', String(selectedPage))}</span>
                                </>
                            )}
                            {activeTab === 'backups' && t('backupsDesc')}
                        </p>
                    </div>
                </div>

                <div className="flex p-1 bg-white/5 rounded-xl w-fit glass-panel border border-white/10">
                    <button
                        onClick={() => setActiveTab('files')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'files' ? "bg-emerald-500 text-white shadow-glow" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <HardDrive className="w-4 h-4" />
                        {ui.filesAndPages}
                    </button>
                    <button
                        onClick={() => setActiveTab('backups')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'backups' ? "bg-amber-500 text-white shadow-glow" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <History className="w-4 h-4" />
                        {t('backupsTitle')}
                    </button>
                </div>
            </div>

            <div className="flex-1 glass-panel rounded-2xl relative overflow-hidden flex flex-col p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

                <AnimatePresence mode="wait">
                    {activeTab === 'files' && viewState === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex-1 flex flex-col gap-8 h-full overflow-y-auto pr-1"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                {/* File Layout */}
                                <div className="col-span-1 lg:col-span-2 glass-panel p-6 border-emerald-500/30">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400">
                                        <Database className="w-5 h-5" /> {ui.dataFile}
                                    </h3>
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground bg-black/20 p-3 rounded-lg">
                                            {ui.dataFileDesc}
                                        </p>
                                        <div className="flex gap-2 p-2 bg-black/40 rounded-xl overflow-x-auto border border-white/5">
                                            {[
                                                language === 'es' ? 'Cabecera (0)' : 'Header (0)',
                                                'PFS (1)',
                                                'GAM (2)',
                                                'SGAM (3)',
                                            ].map((p, i) => (
                                                <div key={i} className="flex-shrink-0 w-24 h-32 bg-amber-500/20 border border-amber-500/50 rounded-lg flex flex-col items-center justify-center text-center p-2 text-xs font-bold text-amber-200 shadow-glow">
                                                    <File className="w-6 h-6 mb-2 opacity-50" />
                                                    {p}
                                                </div>
                                            ))}
                                            <div className="flex-shrink-0 w-12 flex items-center justify-center text-muted-foreground">...</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Allocation Maps Explanation */}
                                <div className="glass-panel p-6 border-amber-500/30 flex flex-col gap-4 relative">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-amber-400">{ui.allocationMaps}</h3>
                                        <button
                                            onClick={allocateExtent}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg border border-amber-500/50 text-xs font-bold transition-all"
                                        >
                                            <Play className="w-3 h-3" /> {t('allocateExtent')}
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {gamLog && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute top-16 left-6 right-6 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 p-2 rounded text-xs text-center font-mono z-10 backdrop-blur-md"
                                            >
                                                {gamLog}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                        <div className="flex-1 space-y-3 text-sm">
                                            <div className="bg-black/20 p-3 rounded-lg border-l-2 border-emerald-500">
                                                <strong>GAM</strong> (Global Allocation Map):<br />
                                            {language === 'es'
                                                ? 'Marca que extents estan asignados. 1 bit por extent. 1 = libre, 0 = asignado.'
                                                : 'Tracks allocated extents. 1 bit per extent. 1 = Free, 0 = Allocated.'}
                                            </div>
                                            <div className="bg-black/20 p-3 rounded-lg border-l-2 border-blue-500">
                                                <strong>SGAM</strong> (Shared GAM):<br />
                                            {language === 'es'
                                                ? 'Marca extents mixtos con paginas libres. 1 = mixto y con espacio disponible.'
                                                : 'Tracks mixed extents with free pages. 1 = Mixed and has free pages.'}
                                            </div>
                                            <div className="bg-black/20 p-3 rounded-lg border-l-2 border-purple-500">
                                            <strong>PFS</strong> ({language === 'es' ? 'Page Free Space' : 'Page Free Space'}):<br />
                                            {language === 'es'
                                                ? 'Controla uso de espacio (0%, 50%, 80%, 95%, 100%) y tipo de pagina. 1 byte por pagina.'
                                                : 'Tracks space usage (0%, 50%, 80%, 95%, 100%) and page type. 1 byte per page.'}
                                            </div>
                                        </div>
                                </div>
                            </div>

                            {/* Extents Grid */}
                            <div className="glass-panel p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold mb-4">{ui.extentsView}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    {extents.map((extent) => (
                                        <motion.div
                                            key={extent.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setSelectedExtent(extent.id);
                                                setViewState('extent');
                                            }}
                                            className={cn(
                                                "aspect-square rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-colors relative group",
                                                extent.allocated
                                                    ? (extent.type === 'Mixed' ? "border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20" : "border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20")
                                                    : "border-gray-500/30 bg-gray-500/10 hover:bg-gray-500/20 opacity-50"
                                            )}
                                        >
                                            <HardDrive className={cn("w-8 h-8 mb-2",
                                                !extent.allocated ? "text-gray-400" :
                                                    extent.type === 'Mixed' ? "text-blue-400" : "text-emerald-400"
                                            )} />
                                            <span className="font-bold">Extent {extent.id}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase absolute bottom-2">
                                                {extent.allocated ? extent.type : t('extentFree')}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'files' && viewState === 'extent' && (
                        <motion.div
                            key="extent"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col p-8 overflow-y-auto h-full"
                        >
                            {selectedExtent !== null && (() => {
                                const ext = extents[selectedExtent];
                                const isMixed = ext.type === 'Mixed';
                                const isAlloc = ext.allocated;
                                return (
                                <div className={cn(
                                    "w-full glass-panel p-8 rounded-2xl",
                                    !isAlloc ? "border-gray-500/40 bg-gray-500/5" :
                                    isMixed ? "border-blue-500/40 bg-blue-500/5" :
                                             "border-emerald-500/40 bg-emerald-500/5"
                                )}>
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className={cn("text-2xl font-bold",
                                                !isAlloc ? "text-gray-400" :
                                                isMixed ? "text-blue-400" : "text-emerald-400"
                                            )}>Extent {selectedExtent}</h3>
                                            <p className="text-muted-foreground">{ui.extentContains}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={cn("px-3 py-1.5 rounded-lg text-sm font-bold border",
                                                !isAlloc ? "bg-gray-500/20 border-gray-500/30 text-gray-300" :
                                                isMixed ? "bg-blue-500/20 border-blue-500/40 text-blue-300" :
                                                           "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                                            )}>
                                                {!isAlloc ? ui.allocFree : isMixed ? ui.allocMixed : ui.allocUniform}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60 font-mono">
                                                {isMixed ? ui.allocBitMixed : isAlloc ? ui.allocBitAllocated : ui.allocBitFree}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-6">
                                        {buildExtentPages(ext).map((page) => (
                                            <motion.div
                                                key={page.id}
                                                whileHover={{ scale: 1.05, y: -5 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setSelectedPage(page.id);
                                                    setViewState('page');
                                                }}
                                                className={cn(
                                                    "aspect-[3/4] bg-white/5 border rounded-xl flex flex-col hover:shadow-glow transition-all cursor-pointer overflow-hidden group",
                                                    PAGE_STYLE[page.tone].border,
                                                    PAGE_STYLE[page.tone].hoverBorder,
                                                )}
                                            >
                                                <div className="h-8 bg-black/40 border-b border-white/10 flex items-center justify-between px-2 text-xs font-bold">
                                                    <span className="text-muted-foreground group-hover:text-white">
                                                        {ui.pageHeader} {page.id}
                                                    </span>
                                                    <span className={cn("px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold", PAGE_STYLE[page.tone].badge)}>
                                                        {page.owner}
                                                    </span>
                                                </div>
                                                <div className="flex-1 p-2 flex flex-col gap-1">
                                                    <div className={cn("h-2 rounded", PAGE_STYLE[page.tone].bar)} />
                                                    <div className={cn("h-2 rounded w-3/4", PAGE_STYLE[page.tone].bar)} />
                                                    <div className={cn("h-2 rounded w-5/6", PAGE_STYLE[page.tone].bar)} />
                                                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full", PAGE_STYLE[page.tone].fill)}
                                                            style={{ width: `${page.usedPct}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex-1" />
                                                    <div className="flex justify-center">
                                                        <File className={cn("w-8 h-8 text-white/20 transition-colors", PAGE_STYLE[page.tone].hoverIcon)} />
                                                    </div>
                                                    <div className="flex-1" />
                                                </div>
                                                <div className="h-6 bg-black/40 border-t border-white/10 flex items-center justify-end px-2 text-[10px] text-muted-foreground">
                                                    {language === 'es' ? 'Slot array' : 'Offset Array'}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                                );
                            })()}
                        </motion.div>
                    )}

                    {activeTab === 'files' && viewState === 'page' && (
                        <motion.div
                            key="page"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex-1 flex items-center justify-center"
                        >
                            <div className="flex items-center gap-8 w-full">
                                {selectedExtent !== null && selectedPage !== null && (() => {
                                    const extent = extents[selectedExtent];
                                    const pageCell = buildExtentPages(extent)[selectedPage] ?? buildExtentPages(extent)[0];
                                    const pageTone = pageCell.tone;
                                    const style = PAGE_STYLE[pageTone];
                                    const isFreePage = !pageCell.allocated;

                                    return (
                                        <>
                                            {/* Previous Page Pointer */}
                                            <div
                                                onClick={() => setSelectedPage(Math.max(0, selectedPage! - 1))}
                                                className="flex flex-col items-center gap-2 opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
                                            >
                                                <div className="px-4 py-8 bg-white/5 border border-white/10 rounded-xl border-dashed">
                                                    <ArrowLeft className="w-8 h-8 text-muted-foreground" />
                                                </div>
                                                <span className="text-xs font-mono">{ui.prevPage}</span>
                                            </div>

                                            {/* Main Page Anatomy */}
                                            <div className="flex-1 glass-panel p-6 rounded-2xl border-white/20 flex flex-col gap-4 shadow-glass bg-gradient-to-b from-white/10 to-transparent">
                                                <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/10">
                                                    <span className="font-bold text-lg">{ui.pageHeaderTitle}</span>
                                                    <span className={cn("text-xs font-mono", style.tag)}>
                                                        PageID: 1:{selectedExtent}{selectedPage} ({pageCell.owner})
                                                    </span>
                                                </div>

                                                <div className="flex-1 bg-black/20 rounded-lg border border-white/5 p-4 flex flex-col gap-3 min-h-[300px]">
                                                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">{ui.dataRowsTitle}</div>
                                                    {isFreePage ? (
                                                        <div className="flex-1 border-2 border-dashed border-white/10 rounded flex items-center justify-center text-muted-foreground text-sm">
                                                            {language === 'es'
                                                                ? 'Pagina libre: aun no pertenece a ningun objeto (mixed extent con paginas disponibles).'
                                                                : 'Free page: not owned by any object yet (mixed extent with free pages).'}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {[1, 2, 3].map((row) => (
                                                                <div
                                                                    key={row}
                                                                    className={cn(
                                                                        "p-3 rounded flex items-center justify-between group transition-colors border",
                                                                        style.row,
                                                                    )}
                                                                >
                                                                    <div className="flex gap-4 items-center">
                                                                        <span className={cn("text-xs font-mono bg-black/40 px-2 py-1 rounded", style.rowCode)}>
                                                                            0x0{row}
                                                                        </span>
                                                                        <span className="text-sm">John Doe | 555-010{row} | Active</span>
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground">Len: 142</span>
                                                                </div>
                                                            ))}
                                                            <div className="flex-1 border-2 border-dashed border-white/10 rounded flex items-center justify-center text-muted-foreground text-sm">
                                                                {ui.freeSpace}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="bg-black/40 p-3 rounded-lg border border-white/10 flex flex-row-reverse gap-2 items-center">
                                                    <span className="font-bold text-sm ml-4">{ui.slotArray}</span>
                                                    {[1, 2, 3].map((slot) => (
                                                        <div
                                                            key={slot}
                                                            className="w-12 h-6 bg-white/10 rounded flex items-center justify-center text-xs font-mono border border-white/20"
                                                        >
                                                            0x{96 + (slot * 142)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Next Page Pointer */}
                                            <div
                                                onClick={() => setSelectedPage(Math.min(7, selectedPage! + 1))}
                                                className="flex flex-col items-center gap-2 opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
                                            >
                                                <div className="px-4 py-8 bg-white/5 border border-white/10 rounded-xl border-dashed">
                                                    <ArrowRight className="w-8 h-8 text-muted-foreground" />
                                                </div>
                                                <span className="text-xs font-mono">{ui.nextPage}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'backups' && (
                        <motion.div
                            key="backups"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full w-full grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pb-4"
                        >
                            {/* Recovery Model Selection */}
                            <div className="flex flex-col gap-6">
                                <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                                            <ShieldCheck className="w-5 h-5" /> {ui.recoveryModels}
                                        </h3>
                                        <button
                                            onClick={() => setRecoveryMode(prev => prev === 'Full' ? 'Simple' : 'Full')}
                                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/10"
                                        >
                                            {t('switchRecoveryMode')}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={cn(
                                            "p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-2",
                                            recoveryMode === 'Simple' ? "border-emerald-500 bg-emerald-500/10 shadow-glow" : "border-white/10 bg-white/5 opacity-50 hover:opacity-80"
                                        )} onClick={() => setRecoveryMode('Simple')}>
                                            <h4 className="font-bold text-emerald-400 text-lg">{t('simpleRecovery')}</h4>
                                            <p className="text-xs text-muted-foreground">{t('simpleDesc')}</p>
                                        </div>
                                        <div className={cn(
                                            "p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-2",
                                            recoveryMode === 'Full' ? "border-amber-500 bg-amber-500/10 shadow-glow" : "border-white/10 bg-white/5 opacity-50 hover:opacity-80"
                                        )} onClick={() => setRecoveryMode('Full')}>
                                            <h4 className="font-bold text-amber-400 text-lg">{t('fullRecovery')}</h4>
                                            <p className="text-xs text-muted-foreground">{t('fullDesc')}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-4">
                                        <button
                                            onClick={takeFullBackup}
                                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-glowBlue flex items-center justify-center gap-2"
                                        >
                                            <Save className="w-5 h-5" /> {t('btnFullBackup')}
                                        </button>
                                        <button
                                            onClick={takeTrnBackup}
                                            disabled={recoveryMode === 'Simple'}
                                            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all shadow-glow disabled:opacity-30 disabled:hover:bg-amber-600 flex items-center justify-center gap-2"
                                        >
                                            <Save className="w-5 h-5" /> {t('btnLogBackup')}
                                        </button>
                                    </div>
                                    {recoveryMode === 'Simple' && (
                                        <p className="text-xs text-center text-rose-400 mt-[-8px]">{t('trnRequired')}</p>
                                    )}
                                </div>

                                {/* Activity Log */}
                                <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col border-white/5">
                                    <h3 className="text-lg font-bold mb-4">{t('activityLog')}</h3>
                                    <div className="flex-1 bg-black/40 rounded-xl p-4 overflow-y-auto space-y-2 border border-white/5 font-mono text-xs">
                                        <AnimatePresence>
                                            {backupLog.length === 0 && <p className="text-muted-foreground/50 italic text-center mt-8">{ui.waitingBackup}</p>}
                                            {backupLog.map((log, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="p-2 bg-white/5 rounded border-l-2 border-amber-500"
                                                >
                                                    <span className="text-muted-foreground mr-2">[{log.time}]</span>
                                                    <span className="text-amber-200">{log.msg}</span>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Log Visualization */}
                            <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2 text-indigo-400">
                                    <Database className="w-5 h-5" /> {ui.transactionLog}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    {ui.transactionLogDesc}
                                </p>

                                <div className="flex-1 flex flex-col justify-end relative rounded-xl border-4 border-white/10 p-2 bg-black/40 overflow-hidden">
                                    {logFullness > 90 && (
                                        <div className="absolute inset-0 bg-red-500/20 z-10 flex items-center justify-center animate-pulse backdrop-blur-sm">
                                            <span className="text-red-400 font-bold text-2xl flex items-center gap-2 bg-black/50 p-4 rounded-xl">
                                                <AlertTriangle /> {ui.logFileFull}
                                            </span>
                                        </div>
                                    )}

                                    {/* Virtual Log Files (VLFs) representation */}
                                    <div className="absolute inset-0 flex flex-col-reverse justify-between opacity-20 pointer-events-none p-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                            <div key={i} className="h-[12%] border-b-2 border-dashed border-white/50 w-full" />
                                        ))}
                                    </div>

                                    <div className="w-full bg-white/5 rounded-lg flex-1 overflow-hidden relative border border-white/10 flex flex-col-reverse">
                                        <motion.div
                                            className={cn(
                                                "w-full transition-all duration-300 relative",
                                                logFullness > 80 ? "bg-red-500/50" : logFullness > 50 ? "bg-amber-500/50" : "bg-indigo-500/50"
                                            )}
                                            style={{ height: `${logFullness}%` }}
                                        >
                                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-30" />
                                        </motion.div>
                                    </div>

                                    <div className="flex justify-between items-center mt-4 px-2">
                                        <div className="font-mono text-xs text-muted-foreground">0%</div>
                                        <div className="font-bold text-lg font-mono tracking-wider">
                                            {ui.usedPct.replace('{pct}', String(logFullness))}
                                        </div>
                                        <div className="font-mono text-xs text-muted-foreground">100%</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
