import { useLanguage } from '../../contexts/LanguageContext';
import { REAL_CASES } from '../DBA/realCasesData';
import { RealCaseScenario } from '../DBA/RealCaseScenario';
import { AlertTriangle } from 'lucide-react';

export function RealCasesPage() {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col h-full gap-5">
            <div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-rose-400 flex items-center gap-3">
                    <AlertTriangle className="w-7 h-7 text-cyan-400" />
                    {t('realCasesTitle')}
                </h2>
                <p className="text-muted-foreground mt-2">{t('realCasesDesc')}</p>
            </div>
            <div className="flex-1 min-h-0">
                <RealCaseScenario cases={REAL_CASES} />
            </div>
        </div>
    );
}
