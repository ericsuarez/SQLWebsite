import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, File, Database, ArrowRight, ArrowLeft, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';

type ViewState = 'overview' | 'extent' | 'page';

interface ExtentData {
    id: number;
    type: 'Uniform' | 'Mixed';
    allocated: boolean;
}

export function StorageEngine() {
    const { t } = useLanguage();
    const [viewState, setViewState] = useState<ViewState>('overview');
    const [selectedExtent, setSelectedExtent] = useState<number | null>(null);
    const [selectedPage, setSelectedPage] = useState<number | null>(null);
    const [gamLog, setGamLog] = useState<string | null>(null);

    const [extents, setExtents] = useState<ExtentData[]>(
        Array.from({ length: 12 }, (_, i) => ({
            id: i,
            type: i % 3 === 0 ? 'Mixed' : 'Uniform',
            allocated: i < 4
        }))
    );

    const pagesArray = Array.from({ length: 8 }, (_, i) => i);

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

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col gap-2 relative">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                    Storage Engine Details
                </h2>
                <p className="text-muted-foreground flex items-center gap-2">
                    {viewState === 'overview' && 'SQL Server stores data in 8KB Pages and 64KB Extents.'}
                    {viewState === 'extent' && (
                        <>
                            <button
                                onClick={() => setViewState('overview')}
                                className="hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded"
                            >
                                <ArrowLeft className="w-3 h-3" /> Back to Files
                            </button>
                            <span>Viewing Extent {selectedExtent}. An extent is a collection of 8 contiguous pages.</span>
                        </>
                    )}
                    {viewState === 'page' && (
                        <>
                            <button
                                onClick={() => setViewState('extent')}
                                className="hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded"
                            >
                                <ArrowLeft className="w-3 h-3" /> Back to Extent
                            </button>
                            <span>Viewing Page {selectedPage}. 8KB structural unit showing header, data, and slot array.</span>
                        </>
                    )}
                </p>
            </div>

            <div className="flex-1 glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

                <AnimatePresence mode="wait">
                    {viewState === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex-1 flex flex-col gap-8 h-full overflow-y-auto"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                {/* File Layout */}
                                <div className="col-span-1 lg:col-span-2 glass-panel p-6 border-emerald-500/30">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400">
                                        <Database className="w-5 h-5" /> .MDF Data File
                                    </h3>
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground bg-black/20 p-3 rounded-lg">
                                            Data files are logically divided into pages (8KB) and extents (64KB). The first few pages are reserved for structural metadata.
                                        </p>
                                        <div className="flex gap-2 p-2 bg-black/40 rounded-xl overflow-x-auto border border-white/5">
                                            {['Header (0)', 'PFS (1)', 'GAM (2)', 'SGAM (3)'].map((p, i) => (
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
                                        <h3 className="text-xl font-bold text-amber-400">Allocation Maps</h3>
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
                                            Tracks allocated extents. 1 bit per extent. 1 = Free, 0 = Allocated.
                                        </div>
                                        <div className="bg-black/20 p-3 rounded-lg border-l-2 border-blue-500">
                                            <strong>SGAM</strong> (Shared GAM):<br />
                                            Tracks mixed extents with free pages. 1 = Mixed and has free pages.
                                        </div>
                                        <div className="bg-black/20 p-3 rounded-lg border-l-2 border-purple-500">
                                            <strong>PFS</strong> (Page Free Space):<br />
                                            Tracks space usage (0%, 50%, 80%, 95%, 100%) and page type. 1 byte per page.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Extents Grid */}
                            <div className="glass-panel p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold mb-4">Extents View</h3>
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

                    {viewState === 'extent' && (
                        <motion.div
                            key="extent"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col items-center justify-center p-8"
                        >
                            <div className="w-full max-w-4xl glass-panel p-8 rounded-2xl border-emerald-500/40 bg-emerald-500/5">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-bold text-emerald-400">Extent {selectedExtent}</h3>
                                        <p className="text-muted-foreground">Contains 8 contiguous 8KB pages (Total 64KB)</p>
                                    </div>
                                    <div className="px-4 py-2 bg-black/40 rounded-lg text-sm border border-white/10">
                                        Status: <span className={cn(
                                            "font-bold",
                                            selectedExtent !== null && extents[selectedExtent].allocated ? "text-emerald-400" : "text-gray-400"
                                        )}>
                                            {selectedExtent !== null && extents[selectedExtent].allocated ? "Allocated in GAM" : "Free in GAM"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-6">
                                    {pagesArray.map((i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ scale: 1.05, y: -5 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setSelectedPage(i);
                                                setViewState('page');
                                            }}
                                            className="aspect-[3/4] bg-white/5 border border-white/20 rounded-xl flex flex-col hover:border-emerald-400/50 hover:shadow-glow transition-all cursor-pointer overflow-hidden group"
                                        >
                                            <div className="h-8 bg-black/40 border-b border-white/10 flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:text-white">
                                                Header {i}
                                            </div>
                                            <div className="flex-1 p-2 flex flex-col gap-1">
                                                <div className="h-2 bg-emerald-500/20 rounded" />
                                                <div className="h-2 bg-emerald-500/20 rounded w-3/4" />
                                                <div className="h-2 bg-emerald-500/20 rounded w-5/6" />
                                                <div className="flex-1" />
                                                <div className="flex justify-center">
                                                    <File className="w-8 h-8 text-white/20 group-hover:text-emerald-400/50 transition-colors" />
                                                </div>
                                                <div className="flex-1" />
                                            </div>
                                            <div className="h-6 bg-black/40 border-t border-white/10 flex items-center justify-end px-2 text-[10px] text-muted-foreground">
                                                Offset Array
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {viewState === 'page' && (
                        <motion.div
                            key="page"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex-1 flex items-center justify-center"
                        >
                            <div className="flex items-center gap-8 w-full max-w-5xl">
                                {/* Previous Page Pointer */}
                                <div className="flex flex-col items-center gap-2 opacity-50 cursor-pointer hover:opacity-100 transition-opacity">
                                    <div className="px-4 py-8 bg-white/5 border border-white/10 rounded-xl border-dashed">
                                        <ArrowLeft className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <span className="text-xs font-mono">PrevPage</span>
                                </div>

                                {/* Main Page Anatomy */}
                                <div className="flex-1 glass-panel p-6 rounded-2xl border-white/20 flex flex-col gap-4 shadow-glass bg-gradient-to-b from-white/10 to-transparent">
                                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/10">
                                        <span className="font-bold text-lg">Page Header (96 Bytes)</span>
                                        <span className="text-xs font-mono text-emerald-400">PageID: 1:123{selectedPage}</span>
                                    </div>

                                    <div className="flex-1 bg-black/20 rounded-lg border border-white/5 p-4 flex flex-col gap-3 min-h-[300px]">
                                        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Data Rows (8060 Bytes)</div>
                                        {[1, 2, 3].map((row) => (
                                            <div key={row} className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded flex items-center justify-between group hover:border-emerald-400 transition-colors">
                                                <div className="flex gap-4 items-center">
                                                    <span className="text-xs font-mono bg-black/40 px-2 py-1 rounded text-emerald-400">0x0{row}</span>
                                                    <span className="text-sm">John Doe | 555-010{row} | Active</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">Len: 142</span>
                                            </div>
                                        ))}
                                        <div className="flex-1 border-2 border-dashed border-white/10 rounded flex items-center justify-center text-muted-foreground text-sm">
                                            Free Space (Available for Inserts/Updates)
                                        </div>
                                    </div>

                                    <div className="bg-black/40 p-3 rounded-lg border border-white/10 flex flex-row-reverse gap-2 items-center">
                                        <span className="font-bold text-sm ml-4">Slot Array</span>
                                        {[1, 2, 3].map((slot) => (
                                            <div key={slot} className="w-12 h-6 bg-white/10 rounded flex items-center justify-center text-xs font-mono border border-white/20">
                                                0x{96 + (slot * 142)}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Next Page Pointer */}
                                <div className="flex flex-col items-center gap-2 opacity-50 cursor-pointer hover:opacity-100 transition-opacity">
                                    <div className="px-4 py-8 bg-white/5 border border-white/10 rounded-xl border-dashed">
                                        <ArrowRight className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <span className="text-xs font-mono">NextPage</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
