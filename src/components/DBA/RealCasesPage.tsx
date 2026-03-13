import { useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { REAL_CASES } from '../DBA/realCasesData';
import { RealCaseScenario } from '../DBA/RealCaseScenario';
import { IncidentDecisionLab } from './IncidentDecisionLab';
import { AlertTriangle } from 'lucide-react';

export function RealCasesPage() {
    const { t, language } = useLanguage();
    const description =
        language === 'es'
            ? 'Ruta visual para decidir rapido y, debajo, escenarios reales de produccion.'
            : 'Visual route for fast triage first, then cross-layer production incidents.';
    const visibleCases = useMemo(
        () =>
            REAL_CASES.filter(
                (item) =>
                    item.id !== 'tempdb' &&
                    item.id !== 'missingindex' &&
                    item.id !== 'attention' &&
                    item.detectionMode !== 'xe'
            ),
        []
    );

    return (
        <div className="flex min-h-full flex-col gap-5">
            <div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-rose-400 flex items-center gap-3">
                    <AlertTriangle className="w-7 h-7 text-cyan-400" />
                    {t('realCasesTitle')}
                </h2>
                <p className="mt-2 text-sm leading-7 text-white/72">{description}</p>
            </div>
            <div className="glass-panel rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                    {[
                        {
                            title: language === 'es' ? '1. Decide rapido' : '1. Fast decision',
                            body: language === 'es' ? 'Sintoma, evidencia y query correcta.' : 'Symptom, evidence, and the right query.',
                        },
                        {
                            title: language === 'es' ? '2. Valida' : '2. Validate',
                            body: language === 'es' ? 'Confirma si el cuello es real o aparente.' : 'Confirm whether the bottleneck is real or only apparent.',
                        },
                        {
                            title: language === 'es' ? '3. Baja a produccion' : '3. Drop into production',
                            body: language === 'es' ? 'Despues pasa a los escenarios completos.' : 'Then move into the full production scenarios.',
                        },
                    ].map((card) => (
                        <div key={card.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">{card.title}</div>
                            <p className="mt-2 text-sm leading-7 text-white/78">{card.body}</p>
                        </div>
                    ))}
                </div>
            </div>
            <IncidentDecisionLab />
            <div className="flex-1 min-h-0">
                <RealCaseScenario cases={visibleCases} />
            </div>
        </div>
    );
}
