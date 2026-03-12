import { useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { REAL_CASES, XEVENT_LABS, type LocalizedCaseText } from '../DBA/realCasesData';
import { RealCaseScenario } from '../DBA/RealCaseScenario';
import { Activity, AlertTriangle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

export function RealCasesPage() {
    const { t, language } = useLanguage();
    const [activeLabId, setActiveLabId] = useState(XEVENT_LABS[0]?.id ?? '');
    const pick = (text: LocalizedCaseText) => language === 'es' ? text.es : text.en;
    const description =
        language === 'es'
            ? 'Solo incidentes transversales de SQL Server. TempDB y missing indexes viven ahora en sus modulos propios para evitar duplicados.'
            : 'Cross-layer SQL Server incidents only. TempDB and missing-index analysis now live in their own dedicated modules to avoid duplication.';
    const visibleCases = useMemo(
        () => REAL_CASES.filter((item) => item.id !== 'tempdb' && item.id !== 'missingindex'),
        []
    );
    const activeLab = XEVENT_LABS.find((lab) => lab.id === activeLabId) ?? XEVENT_LABS[0];

    return (
        <div className="flex flex-col h-full gap-5">
            <div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-rose-400 flex items-center gap-3">
                    <AlertTriangle className="w-7 h-7 text-cyan-400" />
                    {t('realCasesTitle')}
                </h2>
                <p className="text-muted-foreground mt-2">{description}</p>
            </div>
            <div className="glass-panel rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                    {language === 'es' ? 'Cobertura de escenarios' : 'Scenario coverage'}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/80">
                    {language === 'es'
                        ? 'Aqui quedan solo incidentes transversales de produccion. TempDB y Missing Index se han quitado de esta vista porque ya tienen modulo dedicado y se veian duplicados.'
                        : 'Only cross-layer production incidents remain here. TempDB and Missing Index were removed from this view because they already have dedicated modules and looked duplicated.'}
                </p>
            </div>
            {activeLab && (
                <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="glass-panel rounded-3xl border border-orange-500/20 bg-orange-500/10 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-300">
                            {language === 'es' ? 'Extended Events' : 'Extended Events'}
                        </p>
                        <h3 className="mt-3 text-xl font-bold text-white">
                            {language === 'es'
                                ? 'Laboratorios para incidentes que desaparecen antes de abrir una DMV'
                                : 'Labs for incidents that vanish before you open a DMV'}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-white/80">
                            {language === 'es'
                                ? 'Hay problemas que solo dejan evidencia si ya estabas capturando. Timeouts de cliente, deadlocks o bloqueos que duran segundos son mucho mas faciles de cazar con XE que con una foto tardia de DMVs.'
                                : 'Some problems only leave evidence if you were already capturing them. Client timeouts, deadlocks or short blocking bursts are far easier to catch with XE than with a late DMV snapshot.'}
                        </p>
                        <div className="mt-5 space-y-3">
                            {XEVENT_LABS.map((lab) => {
                                const isActive = lab.id === activeLab.id;
                                return (
                                    <button
                                        key={lab.id}
                                        onClick={() => setActiveLabId(lab.id)}
                                        className={cn(
                                            'w-full rounded-2xl border p-4 text-left transition-all',
                                            isActive
                                                ? 'border-orange-500/25 bg-orange-500/10 shadow-[0_0_22px_rgba(249,115,22,0.16)]'
                                                : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                                        )}
                                    >
                                        <div className="text-sm font-semibold text-white">{pick(lab.title)}</div>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {lab.badges.map((badge) => (
                                                <span
                                                    key={`${lab.id}-${badge}`}
                                                    className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55"
                                                >
                                                    {badge}
                                                </span>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <motion.div
                        key={activeLab.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel rounded-3xl border border-white/10 p-5"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="max-w-4xl">
                                <h3 className="text-2xl font-bold text-white">{pick(activeLab.title)}</h3>
                                <p className="mt-3 text-sm leading-7 text-white/80">{pick(activeLab.summary)}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {activeLab.badges.map((badge) => (
                                    <span
                                        key={`${activeLab.id}-top-${badge}`}
                                        className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-bold text-orange-300"
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">
                                    <AlertTriangle className="h-4 w-4" />
                                    {language === 'es' ? 'Por que importa' : 'Why it matters'}
                                </div>
                                <p className="mt-3 text-sm leading-7 text-white/80">{pick(activeLab.why)}</p>
                            </div>
                            <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                                    <Search className="h-4 w-4" />
                                    {language === 'es' ? 'Ideal para' : 'Best for'}
                                </div>
                                <p className="mt-3 text-sm leading-7 text-white/80">
                                    {language === 'es'
                                        ? 'Incidentes intermitentes, post-mortem y casos donde cuando llegas ya no queda sesi\u00f3n viva que mirar.'
                                        : 'Intermittent incidents, post-mortems and cases where no live session remains when you arrive.'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4 xl:grid-cols-2">
                            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-orange-300">
                                    <Activity className="h-4 w-4" />
                                    {language === 'es' ? 'Sesion XE lista para copiar' : 'Copy-ready XE session'}
                                </div>
                                <CopyCodeBlock code={pick(activeLab.sessionScript)} accent="amber" className="mt-4" />
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-300">
                                    <Search className="h-4 w-4" />
                                    {language === 'es' ? 'Lectura del event file' : 'Event file readback'}
                                </div>
                                <CopyCodeBlock code={pick(activeLab.readbackScript)} accent="blue" className="mt-4" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
            <div className="flex-1 min-h-0">
                <RealCaseScenario cases={visibleCases} />
            </div>
        </div>
    );
}
