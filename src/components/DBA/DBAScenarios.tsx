import { Clock3, ShieldCheck, Wrench } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export function DBAScenarios() {
  const { t, language } = useLanguage();
  const description =
    language === 'es'
      ? 'Vista de ownership DBA para dejar claro que vive en cada modulo y evitar duplicados de contenido.'
      : 'DBA ownership view to make module boundaries clear and avoid duplicate content.';

  const ownershipCards = [
    {
      icon: Wrench,
      tone: 'text-amber-300 border-amber-500/20 bg-amber-500/10',
      title: language === 'es' ? 'Este modulo' : 'This module',
      text:
        language === 'es'
          ? 'Mapa de ownership, runbooks y decisiones operativas para no mezclar temas entre modulos.'
          : 'Ownership map, runbooks and operational decisions so topics stay separated across modules.',
    },
    {
      icon: Clock3,
      tone: 'text-cyan-300 border-cyan-500/20 bg-cyan-500/10',
      title: language === 'es' ? 'Movido a otros modulos' : 'Moved elsewhere',
      text:
        language === 'es'
          ? 'Page splits e indices viven en Indices. CREATE DATABASE, IFI y crecimiento de archivos viven en Storage/OS Config.'
          : 'Page splits and indexes live in Indexes. CREATE DATABASE, IFI and file growth live in Storage/OS Config.',
    },
    {
      icon: ShieldCheck,
      tone: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10',
      title: language === 'es' ? 'Sin duplicados' : 'No duplicates',
      text:
        language === 'es'
          ? 'TempDB, WAL/VLFs, replicacion e historia de versiones quedan en sus modulos propios para que cada tema tenga un solo sitio.'
          : 'TempDB, WAL/VLFs, replication and version history stay in their own modules so each topic has a single home.',
    },
  ];

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-orange-400">
          {t('dbaTitle')}
        </h2>
        <p className="text-muted-foreground max-w-5xl">{description}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {ownershipCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`glass-panel rounded-3xl border p-5 ${card.tone}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-2.5">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-black uppercase tracking-[0.18em]">{card.title}</div>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/80">{card.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
