import { useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { REAL_CASES } from '../DBA/realCasesData';
import { RealCaseScenario } from '../DBA/RealCaseScenario';
import { AlertTriangle } from 'lucide-react';

export function RealCasesPage() {
    const { t, language } = useLanguage();
    const description =
        language === 'es'
            ? 'Solo incidentes transversales de SQL Server. TempDB, Missing Index y Extended Events viven ahora en modulos propios para evitar duplicados.'
            : 'Cross-layer SQL Server incidents only. TempDB, missing-index analysis and Extended Events now live in their own dedicated modules to avoid duplication.';
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
                        ? 'Aqui quedan solo incidentes transversales de produccion. TempDB, Missing Index y XE se han quitado de esta vista porque ya tienen modulo dedicado y se veian duplicados.'
                        : 'Only cross-layer production incidents remain here. TempDB, Missing Index and XE were removed from this view because they already have dedicated modules and looked duplicated.'}
                </p>
            </div>
            <div className="flex-1 min-h-0">
                <RealCaseScenario cases={visibleCases} />
            </div>
        </div>
    );
}
