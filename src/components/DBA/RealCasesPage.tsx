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
            ? 'Incidentes transversales de SQL Server mas una ruta guiada para decidir que sospechar, que query lanzar y como avanzaria un DBA en una incidencia real.'
            : 'Cross-layer SQL Server incidents plus a guided route for deciding what to suspect, which query to run, and how a DBA would move through a real incident.';
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
                <p className="text-muted-foreground mt-2">{description}</p>
            </div>
            <div className="glass-panel rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                    {language === 'es' ? 'Cobertura de escenarios' : 'Scenario coverage'}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/80">
                    {language === 'es'
                        ? 'Aqui tienes dos capas: primero la ruta guiada para entrenar sospecha DBA y despues los escenarios transversales de produccion. TempDB, Missing Index y XE siguen con modulo dedicado para no duplicar simuladores.'
                        : 'You now have two layers here: the guided DBA suspicion route first, and the cross-layer production incidents after that. TempDB, missing-index analysis and XE still keep their own modules to avoid duplicate simulators.'}
                </p>
            </div>
            <IncidentDecisionLab />
            <div className="flex-1 min-h-0">
                <RealCaseScenario cases={visibleCases} />
            </div>
        </div>
    );
}
