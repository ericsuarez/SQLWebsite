import { Search, Activity, Database } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSqlVersion, type SqlVersion } from '../../contexts/SqlVersionContext';

export function Header() {
    const { t, language, setLanguage } = useLanguage();
    const { version, setVersion } = useSqlVersion();
    return (
        <header className="h-16 border-b border-white/10 bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all duration-300"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">

                {/* SQL Version Switcher */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 hidden md:flex">
                    <Database className="w-3.5 h-3.5 text-muted-foreground ml-2 mr-1" />
                    {(['2019', '2022', '2025'] as SqlVersion[]).map(v => (
                        <button
                            key={v}
                            onClick={() => setVersion(v)}
                            className={`px-2 py-1 rounded text-xs font-bold transition-all ${version === v ? 'bg-purple-500/20 text-purple-400' : 'text-muted-foreground hover:text-white'}`}
                        >
                            SQL '{v.substring(2)}
                        </button>
                    ))}
                </div>

                <div className="w-px h-6 bg-white/10 hidden md:block" />

                {/* Language Switcher */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setLanguage('en')}
                        className={`px-2 py-1 min-w-[32px] rounded text-xs font-bold transition-all ${language === 'en' ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted-foreground hover:text-white'}`}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLanguage('es')}
                        className={`px-2 py-1 min-w-[32px] rounded text-xs font-bold transition-all ${language === 'es' ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted-foreground hover:text-white'}`}
                    >
                        ES
                    </button>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    {t('online')}
                </div>
            </div>
        </header>
    );
}
