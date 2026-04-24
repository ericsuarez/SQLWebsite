import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Box, ChevronRight, Cpu, Database, DatabaseBackup, FileText, HardDrive, LayoutTemplate, MonitorIcon, Play, Save, Server, Settings, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TranslationKey } from '../../i18n/translations';
import {
    SYSTEM_DATABASE_ACTIONS,
    SYSTEM_DATABASE_GUIDES,
    type LocalizedText,
} from '../../data/platformGuidesData';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

const layers: { id: string; titleKey: TranslationKey; icon: any; color: string; bg: string }[] = [
    { id: 'client', titleKey: 'layerClient', icon: MonitorIcon, color: 'border-blue-500/50', bg: 'bg-blue-500/10' },
    { id: 'os', titleKey: 'layerOS', icon: Cpu, color: 'border-purple-500/50', bg: 'bg-purple-500/10' },
    { id: 'engine', titleKey: 'layerEngine', icon: Database, color: 'border-emerald-500/50', bg: 'bg-emerald-500/10' },
    { id: 'storage', titleKey: 'layerStorage', icon: HardDrive, color: 'border-amber-500/50', bg: 'bg-amber-500/10' },
];

const architectureSections = [
    {
        id: 'engine' as const,
        accent: 'border-teal-500/25 bg-teal-500/10 text-teal-200',
        panel: 'border-teal-500/25 bg-teal-500/10',
        icon: Server,
        order: '01',
        title: {
            en: 'Architecture Core',
            es: 'Arquitectura Core',
        },
        summary: {
            en: 'Layers, parser, optimizer, execution path, and how the request moves through the engine.',
            es: 'Capas, parser, optimizer, ruta de ejecución y cómo se mueve la petición por el motor.',
        },
    },
    {
        id: 'sysdbs' as const,
        accent: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
        panel: 'border-amber-500/25 bg-amber-500/10',
        icon: DatabaseBackup,
        order: '02',
        title: {
            en: 'System Databases',
            es: 'Bases del sistema',
        },
        summary: {
            en: 'master, model, msdb, and tempdb: what each one owns and how a DBA should use them.',
            es: 'master, model, msdb y tempdb: qué controla cada una y cómo debería usarlas un DBA.',
        },
    },
    {
        id: 'files' as const,
        accent: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
        panel: 'border-emerald-500/25 bg-emerald-500/10',
        icon: Save,
        order: '03',
        title: {
            en: 'Database Files',
            es: 'Ficheros de base de datos',
        },
        summary: {
            en: 'MDF, NDF, and LDF roles so the physical layout makes sense before storage internals.',
            es: 'Roles de MDF, NDF y LDF para que el layout físico tenga sentido antes de bajar a storage internals.',
        },
    },
];

export function ArchitectureOverview() {
    const [activeTab, setActiveTab] = useState<'engine' | 'sysdbs' | 'files'>('engine');
    const [activeLayer, setActiveLayer] = useState<string | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [activeSystemDb, setActiveSystemDb] = useState<(typeof SYSTEM_DATABASE_GUIDES)[number]['id']>('master');
    const [activeSystemAction, setActiveSystemAction] = useState<(typeof SYSTEM_DATABASE_ACTIONS)[number]['id']>('server-config');
    const { t, language } = useLanguage();

    const pick = (text: LocalizedText) => language === 'es' ? text.es : text.en;
    const currentSectionIndex = architectureSections.findIndex((section) => section.id === activeTab);
    const currentSection = architectureSections[currentSectionIndex] ?? architectureSections[0];
    const previousSection = currentSectionIndex > 0 ? architectureSections[currentSectionIndex - 1] : undefined;
    const nextSection = currentSectionIndex < architectureSections.length - 1 ? architectureSections[currentSectionIndex + 1] : undefined;

    const activeSystemDbGuide =
        SYSTEM_DATABASE_GUIDES.find((guide) => guide.id === activeSystemDb) ?? SYSTEM_DATABASE_GUIDES[0];
    const activeSystemActionGuide =
        SYSTEM_DATABASE_ACTIONS.find((action) => action.id === activeSystemAction) ?? SYSTEM_DATABASE_ACTIONS[0];

    const systemDbStyles = {
        master: {
            card: 'border-rose-500/25 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.12)]',
            badge: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
            icon: Settings,
        },
        model: {
            card: 'border-blue-500/25 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.12)]',
            badge: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
            icon: LayoutTemplate,
        },
        msdb: {
            card: 'border-violet-500/25 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.12)]',
            badge: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
            icon: Box,
        },
        tempdb: {
            card: 'border-amber-500/25 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.12)]',
            badge: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
            icon: Cpu,
        },
    } as const;

    const simulateFlow = () => {
        if (isSimulating) return;
        setIsSimulating(true);
        setActiveLayer('client');

        setTimeout(() => setActiveLayer('os'), 1500);
        setTimeout(() => setActiveLayer('engine'), 3000);
        setTimeout(() => setActiveLayer('storage'), 4500);

        setTimeout(() => {
            setIsSimulating(false);
        }, 6000);
    };

    return (
        <div className="relative flex min-h-full flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                            {t('archTitle')}
                        </h2>
                        <p className="text-muted-foreground mt-2 max-w-4xl">
                            {t('archDescription')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-4">
                <aside className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="glass-panel rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                            <BookOpen className="h-4 w-4 text-teal-300" />
                            {language === 'es' ? 'Subapartados' : 'Subsections'}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-white/62">
                            {language === 'es'
                                ? 'Entra por un bloque cada vez. Aquí eliges la parte de arquitectura que quieres ver y avanzas con anterior o siguiente.'
                                : 'Go through one block at a time. Choose the architecture area you want and move with previous or next.'}
                        </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {architectureSections.map((section) => {
                                const Icon = section.icon;
                                const isActive = section.id === activeTab;

                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveTab(section.id)}
                                        className={cn(
                                            'w-full rounded-2xl border p-3 text-left transition-all',
                                            isActive
                                                ? `${section.panel} shadow-[0_20px_50px_rgba(0,0,0,0.18)]`
                                                : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                                                <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-white/50')} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                                                        {section.order}
                                                    </span>
                                                    {isActive ? (
                                                        <span className={cn('rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]', section.accent)}>
                                                            {language === 'es' ? 'activo' : 'active'}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="mt-2 text-base font-bold text-white">{pick(section.title)}</div>
                                                <p className="mt-2 text-sm leading-6 text-white/60">{pick(section.summary)}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="glass-panel rounded-2xl p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                            {language === 'es' ? 'Progreso del bloque' : 'Block progress'}
                        </div>
                        <h3 className="mt-3 text-lg font-bold text-white">{pick(currentSection.title)}</h3>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-teal-400 via-amber-300 to-emerald-300"
                                style={{ width: `${((currentSectionIndex + 1) / architectureSections.length) * 100}%` }}
                            />
                        </div>
                        <p className="mt-4 text-sm leading-7 text-white/62">{pick(currentSection.summary)}</p>

                        <div className="mt-4 flex gap-2 xl:flex-col">
                            <button
                                onClick={() => previousSection && setActiveTab(previousSection.id)}
                                disabled={!previousSection}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {language === 'es' ? 'Anterior' : 'Previous'}
                            </button>
                            <button
                                onClick={() => nextSection && setActiveTab(nextSection.id)}
                                disabled={!nextSection}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {language === 'es' ? 'Siguiente' : 'Next'}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </aside>

                <div className="relative min-h-0 flex-1">
                    <AnimatePresence mode="wait">
                        {activeTab === 'engine' && (
                        <motion.div
                            key="engine"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="min-h-full flex flex-col"
                        >
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={simulateFlow}
                                    disabled={isSimulating}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-500/50 font-bold transition-all disabled:opacity-50"
                                >
                                    <Play className="w-4 h-4" /> {t('simulateFlow')}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] gap-6 flex-1">
                                {/* Interactive Diagram */}
                                <div className="glass-panel relative flex min-h-[520px] flex-col justify-center gap-3 rounded-2xl p-4 sm:min-h-[560px] sm:p-5 xl:min-h-[600px]">
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                                    {layers.map((layer, index) => {
                                        const Icon = layer.icon;
                                        const isActive = activeLayer === layer.id;
                                        return (
                                            <React.Fragment key={layer.id}>
                                                <motion.div
                                                    onClick={() => setActiveLayer(layer.id)}
                                                    whileHover={{ scale: 1.02, y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`w-full rounded-xl border-2 p-4 cursor-pointer transition-all duration-300 relative z-10 sm:p-5 ${isActive ? `${layer.bg} ${layer.color} shadow-glow` : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 rounded-lg bg-black/20">
                                                            <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-white/80'}`}>
                                                                {t(layer.titleKey)}
                                                            </h3>
                                                        </div>
                                                        {isActive && (
                                                            <motion.div layoutId="activeIndicator" className="w-2 h-2 rounded-full bg-white shadow-glow" />
                                                        )}
                                                    </div>
                                                </motion.div>

                                                {/* Arrow between layers */}
                                                {index < layers.length - 1 && (
                                                    <div className="flex h-5 flex-col items-center justify-center z-0 opacity-50 sm:h-6">
                                                        <div className="w-0.5 h-full bg-gradient-to-b from-white/30 to-transparent" />
                                                        <ChevronRight className="w-4 h-4 text-white/50 rotate-90 -mt-2" />
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>

                                {/* Details Panel */}
                                <div className="glass-panel relative flex min-h-[520px] flex-col rounded-2xl p-5 sm:min-h-[560px] sm:p-6 xl:min-h-[600px]">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

                                    {activeLayer ? (
                                        <motion.div
                                            key={activeLayer}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-6 w-full"
                                        >
                                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                                {t(layers.find(l => l.id === activeLayer)?.titleKey as TranslationKey)}
                                            </h3>

                                            <div className="prose prose-invert prose-sm max-w-none">
                                                {activeLayer === 'client' && (
                                                    <>
                                                        <p>{t('clientDesc1')}</p>
                                                        <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                                            <li>{t('clientDesc2')}</li>
                                                            <li>{t('clientDesc3')}</li>
                                                        </ul>
                                                    </>
                                                )}
                                                {activeLayer === 'os' && (
                                                    <>
                                                        <p>{t('osDesc1')}</p>
                                                        <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                                            <li>{t('osDesc2')}</li>
                                                            <li>{t('osDesc3')}</li>
                                                            <li>{t('osDesc4')}</li>
                                                        </ul>
                                                    </>
                                                )}
                                                {activeLayer === 'engine' && (
                                                    <>
                                                        <p>{t('engineDesc1')}</p>
                                                        <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                                            <li><strong>Parser:</strong> {t('engineDesc2').replace('Parser: ', '').replace('Analizador: ', '')}</li>
                                                            <li><strong>Algebrizer:</strong> {t('engineDesc3').replace('Algebrizer: ', '')}</li>
                                                            <li><strong>Optimizer:</strong> {t('engineDesc4').replace('Optimizer: ', '').replace('Optimizador: ', '')}</li>
                                                            <li><strong>Query Executor:</strong> {t('engineDesc5').replace('Query Executor: ', '').replace('Ejecutor: ', '')}</li>
                                                        </ul>
                                                    </>
                                                )}
                                                {activeLayer === 'storage' && (
                                                    <>
                                                        <p>{t('storageDesc1')}</p>
                                                        <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                                            <li><strong>Access Methods:</strong> {t('storageDesc2').replace('Access Methods: ', '')}</li>
                                                            <li><strong>Transaction Manager:</strong> {t('storageDesc3').replace('Transaction Manager: ', '')}</li>
                                                            <li><strong>Buffer Manager:</strong> {t('storageDesc4').replace('Buffer Manager: ', '')}</li>
                                                        </ul>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="flex-1 flex w-full flex-col items-center justify-center text-center text-muted-foreground gap-4 mx-auto max-w-xl">
                                            <Database className="w-16 h-16 opacity-20" />
                                            <p>{t('selectLayerPrompt')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                        )}

                        {activeTab === 'sysdbs' && (
                        <motion.div
                            key="sysdbs"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full w-full overflow-y-auto pb-8"
                        >
                            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                                <div className="space-y-6">
                                    <div className="glass-panel rounded-3xl p-5">
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {t('sysDbsDesc')}
                                        </p>
                                        <div className="mt-5 space-y-3">
                                            {SYSTEM_DATABASE_GUIDES.map((guide) => {
                                                const style = systemDbStyles[guide.id];
                                                const Icon = style.icon;
                                                const isActive = activeSystemDb === guide.id;

                                                return (
                                                    <motion.button
                                                        key={guide.id}
                                                        whileHover={{ y: -2 }}
                                                        onClick={() => {
                                                            setActiveSystemDb(guide.id);
                                                            const relatedAction = SYSTEM_DATABASE_ACTIONS.find((action) => action.target === guide.id);
                                                            if (relatedAction) {
                                                                setActiveSystemAction(relatedAction.id);
                                                            }
                                                        }}
                                                        className={cn(
                                                            'w-full rounded-3xl border p-4 text-left transition-all',
                                                            isActive ? style.card : 'border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/[0.06]'
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border', style.badge)}>
                                                                    <Icon className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-mono text-lg font-bold text-white">{guide.name}</div>
                                                                    <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                                                                        {pick(guide.headline)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {isActive && <div className="mt-2 h-2.5 w-2.5 rounded-full bg-white shadow-glow" />}
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="glass-panel rounded-3xl p-5">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                                            {language === 'es' ? 'Ruta de una acción' : 'Action route'}
                                        </p>
                                        <h3 className="mt-3 text-lg font-bold text-white">
                                            {language === 'es'
                                                ? 'Qué base del sistema toca primero cada tarea'
                                                : 'Which system database a task touches first'}
                                        </h3>
                                        <div className="mt-4 space-y-3">
                                            {SYSTEM_DATABASE_ACTIONS.map((action) => {
                                                const isActive = activeSystemAction === action.id;
                                                const targetStyle = systemDbStyles[action.target];

                                                return (
                                                    <button
                                                        key={action.id}
                                                        onClick={() => {
                                                            setActiveSystemAction(action.id);
                                                            setActiveSystemDb(action.target);
                                                        }}
                                                        className={cn(
                                                            'w-full rounded-2xl border px-4 py-3 text-left transition-all',
                                                            isActive
                                                                ? `${targetStyle.card} border-current`
                                                                : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span className="text-sm font-semibold text-white">{pick(action.label)}</span>
                                                            <span className={cn('rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', targetStyle.badge)}>
                                                                {action.target}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeSystemDb}
                                        initial={{ opacity: 0, x: 16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -16 }}
                                        className="space-y-6"
                                    >
                                        <div className="glass-panel rounded-3xl p-6">
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div className="max-w-4xl">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl border', systemDbStyles[activeSystemDbGuide.id].badge)}>
                                                            {React.createElement(systemDbStyles[activeSystemDbGuide.id].icon, { className: 'h-6 w-6' })}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-mono text-3xl font-bold text-white">{activeSystemDbGuide.name}</h3>
                                                            <p className="mt-1 text-lg text-white/90">{pick(activeSystemDbGuide.headline)}</p>
                                                        </div>
                                                    </div>
                                                    <p className="mt-5 text-sm leading-7 text-white/75">
                                                        {pick(activeSystemDbGuide.summary)}
                                                    </p>
                                                </div>
                                                <div className="flex max-w-sm flex-wrap gap-2">
                                                    {activeSystemDbGuide.badges.map((badge) => (
                                                        <span
                                                            key={badge}
                                                            className={cn(
                                                                'rounded-full border px-3 py-1 text-[11px] font-bold',
                                                                systemDbStyles[activeSystemDbGuide.id].badge
                                                            )}
                                                        >
                                                            {badge}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                                                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                                                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                                                        {language === 'es' ? 'Operación seleccionada' : 'Selected action'}
                                                    </p>
                                                    <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] md:items-center">
                                                        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                                            <div className="text-sm font-semibold text-white">{pick(activeSystemActionGuide.label)}</div>
                                                            <p className="mt-2 text-sm leading-6 text-white/65">
                                                                {pick(activeSystemActionGuide.detail)}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center justify-center text-white/35">
                                                            <HardDrive className="h-6 w-6" />
                                                        </div>
                                                        <div className={cn('rounded-2xl border p-4', systemDbStyles[activeSystemDbGuide.id].card)}>
                                                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                                                                {language === 'es' ? 'Aterriza en' : 'Lands on'}
                                                            </div>
                                                            <div className="mt-2 font-mono text-2xl font-bold text-white">
                                                                {activeSystemDbGuide.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={cn('rounded-3xl border p-5', systemDbStyles[activeSystemDbGuide.id].card)}>
                                                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                                                        {language === 'es' ? 'Regla de uso' : 'Operating rule'}
                                                    </div>
                                                    <p className="mt-4 text-sm leading-7 text-white/80">
                                                        {pick(activeSystemDbGuide.workflow)}
                                                    </p>
                                                    {activeSystemDbGuide.note && (
                                                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/70">
                                                            {pick(activeSystemDbGuide.note)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                                            <div className="space-y-6">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="glass-panel rounded-3xl p-5">
                                                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                                                            <ShieldCheck className="h-4 w-4" />
                                                            {language === 'es' ? 'Úsala para' : 'Use it for'}
                                                        </div>
                                                        <div className="mt-4 space-y-3">
                                                            {activeSystemDbGuide.bestFor.map((item, index) => (
                                                                <div key={`${activeSystemDbGuide.id}-best-${index}`} className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-4 text-sm leading-6 text-white/80">
                                                                    {pick(item)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="glass-panel rounded-3xl p-5">
                                                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            {language === 'es' ? 'Evita esto' : 'Avoid this'}
                                                        </div>
                                                        <div className="mt-4 space-y-3">
                                                            {activeSystemDbGuide.avoid.map((item, index) => (
                                                                <div key={`${activeSystemDbGuide.id}-avoid-${index}`} className="rounded-2xl border border-amber-500/15 bg-amber-500/10 p-4 text-sm leading-6 text-white/80">
                                                                    {pick(item)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="glass-panel rounded-3xl p-5">
                                                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                                                    {language === 'es' ? 'T-SQL listo para copiar' : 'Copy-paste T-SQL'}
                                                </div>
                                                <p className="mt-2 text-sm leading-6 text-white/65">
                                                    {language === 'es'
                                                        ? 'Chequeos rápidos y una operación típica para trabajar correctamente con esta base del sistema.'
                                                        : 'Quick checks and a typical operation for working safely with this system database.'}
                                                </p>
                                                <CopyCodeBlock
                                                    code={activeSystemDbGuide.script}
                                                    accent={activeSystemDbGuide.accent}
                                                    className="mt-4"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                        )}

                        {activeTab === 'files' && (
                        <motion.div
                            key="files"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full w-full flex flex-col gap-6"
                        >
                            <p className="text-muted-foreground text-lg">{t('dbFilesDesc')}</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-4 border-b-4 border-emerald-500 hover:bg-white/5 transition-colors">
                                    <Database className="w-12 h-12 text-emerald-400" />
                                    <div>
                                        <h3 className="text-xl font-bold font-mono">{t('mdfExt')}</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{t('mdfDesc1')}</p>
                                    </div>
                                </div>
                                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-4 border-b-4 border-cyan-500 hover:bg-white/5 transition-colors">
                                    <Database className="w-12 h-12 text-cyan-400" />
                                    <div>
                                        <h3 className="text-xl font-bold font-mono">{t('ndfExt')}</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{t('mdfDesc4')}</p>
                                    </div>
                                </div>
                                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-4 border-b-4 border-amber-500 hover:bg-white/5 transition-colors">
                                    <FileText className="w-12 h-12 text-amber-400" />
                                    <div>
                                        <h3 className="text-xl font-bold font-mono">{t('ldfExt')}</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{t('ldfDesc1')} {t('ldfDesc2')}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
