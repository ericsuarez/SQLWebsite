import { ArrowRight, Cpu, Database, PlayCircle, Radar, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { SURFACE_DEFINITIONS } from '../Layout/moduleCatalog';
import { cn } from '../../lib/utils';

function pick(language: 'en' | 'es', value: { en: string; es: string }) {
  return language === 'es' ? value.es : value.en;
}

export function PhaseZeroLanding() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const cards = [
    {
      surface: SURFACE_DEFINITIONS.learn,
      preview:
        language === 'es'
          ? ['Arquitectura y bases del motor', 'Memoria, índices y optimizador', 'Nivel 1, 2 y 3 con XP visual']
          : ['Engine architecture and storage', 'Memory, indexes, and optimizer', 'Level 1, 2 and 3 with visual XP'],
    },
    {
      surface: SURFACE_DEFINITIONS.labs,
      preview:
        language === 'es'
          ? ['Labs de incidencias guiadas', 'Play fullscreen para seguir la query', 'TLog, TempDB, Jobs y operador del plan']
          : ['Guided incident labs', 'Fullscreen play views', 'TLog, TempDB, Jobs, and plan operators'],
    },
    {
      surface: SURFACE_DEFINITIONS.diagnose,
      preview:
        language === 'es'
          ? ['Queries rápidas y triage', 'Extended Events y postmortems', 'Runbooks de HA/DR y checklist operativo']
          : ['Quick queries and triage', 'Extended Events and postmortems', 'HA/DR runbooks and operational checks'],
    },
  ];
  const surfaceDots = {
    learn: 'bg-teal-300',
    labs: 'bg-amber-300',
    diagnose: 'bg-lime-300',
    library: 'bg-cyan-300',
  } as const;

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(132,204,22,0.12),transparent_30%),linear-gradient(180deg,#0a0f10_0%,#111718_100%)] text-zinc-100">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-[-8%] top-[-10%] h-[36rem] w-[36rem] rounded-full bg-teal-500/10 blur-[140px]" />
        <div className="absolute right-[-10%] top-[8%] h-[34rem] w-[34rem] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[18%] h-[28rem] w-[28rem] rounded-full bg-lime-500/10 blur-[140px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#0c1112]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-3">
            <div className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-2">
              <Database className="h-5 w-5 text-teal-300" />
            </div>
            <div className="text-left">
              <div className="text-lg font-black tracking-tight text-white">
                SQLLab<span className="text-amber-300">.dev</span>
              </div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                {language === 'es' ? 'Simulación visual de SQL Server' : 'Visual SQL Server simulation'}
              </div>
            </div>
          </button>

          <div className="hidden items-center gap-6 text-sm font-medium text-white/58 md:flex">
            <a href="#ruta" className="transition-colors hover:text-white">
              {language === 'es' ? 'Ruta' : 'Route'}
            </a>
            <a href="#filosofia" className="transition-colors hover:text-white">
              {language === 'es' ? 'Filosofía' : 'Philosophy'}
            </a>
            <button
              onClick={() => navigate('/library')}
              className="rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-white transition-colors hover:bg-white/10"
            >
              {language === 'es' ? 'Biblioteca técnica' : 'Technical library'}
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-16 sm:px-6 sm:pt-24">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.05fr)_360px] xl:items-start">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-sm font-medium text-teal-200">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              {language === 'es' ? 'Plataforma de simulación visual' : 'Visual simulation platform'}
            </div>
            <h1 className="mt-6 text-5xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl xl:text-7xl">
              {language === 'es' ? 'Entiende SQL Server' : 'Understand SQL Server'}
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-amber-200 to-lime-300 bg-clip-text text-transparent">
                {language === 'es' ? 'viendo sus entrañas' : 'by watching its internals'}
              </span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/68 sm:text-xl">
              {language === 'es'
                ? 'Aprende arquitectura, practica troubleshooting y diagnostica incidencias sin tocar una producción real. SQLLab enseña el porqué técnico antes del parche rápido.'
                : 'Learn architecture, practice troubleshooting, and diagnose incidents without touching a real production system. SQLLab teaches the why before the quick fix.'}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/learn')}
                className="inline-flex items-center gap-2 rounded-2xl border border-teal-500/30 bg-teal-500/15 px-6 py-3 text-sm font-black text-teal-100 transition-all hover:bg-teal-500/25"
              >
                <PlayCircle className="h-5 w-5" />
                {language === 'es' ? 'Empezar por Nivel 1' : 'Start with Level 1'}
              </button>
              <button
                onClick={() => navigate('/library')}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-6 py-3 text-sm font-black text-white transition-all hover:bg-white/10"
              >
                <Radar className="h-5 w-5 text-lime-300" />
                {language === 'es' ? 'Entrar al workspace' : 'Enter workspace'}
              </button>
            </div>
          </div>

          <div className="glass-panel overflow-hidden border border-white/10 p-5">
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/42">
                <ShieldCheck className="h-4 w-4 text-lime-300" />
                {language === 'es' ? 'Qué es y qué no es' : 'What it is and what it is not'}
              </div>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-lime-500/20 bg-lime-500/10 p-4">
                  <div className="text-sm font-black text-white">100% Client-Side</div>
                  <p className="mt-2 text-sm leading-7 text-white/74">
                    {language === 'es'
                      ? 'Todo el motor que ves está simulado en React. No hay conexión a una base real ni riesgo de romper nada.'
                      : 'Everything you see is simulated in React. There is no live database connection and no risk of breaking anything.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-white">
                    <Cpu className="h-4 w-4 text-amber-300" />
                    {language === 'es' ? 'Enfocado en el porqué' : 'Focused on the why'}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-white/74">
                    {language === 'es'
                      ? 'No es otro visor de queries. Es una forma visual de entender por qué una query, un wait o un commit se comportan así.'
                      : 'This is not another query runner. It is a visual way to understand why a query, wait, or commit behaves the way it does.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="ruta" className="mt-24">
          <div className="max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">
              {language === 'es' ? 'Fase 0' : 'Phase 0'}
            </div>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              {language === 'es' ? 'El camino del DBA, sin mezclarlo todo' : 'The DBA path, without mixing everything together'}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">
              {language === 'es'
                ? 'Tres puertas distintas para que cada usuario sepa por dónde empezar: aprender el motor, practicar bajo presión o diagnosticar una incidencia real.'
                : 'Three clear doors so every user knows where to start: learn the engine, practice under pressure, or diagnose a real incident.'}
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {cards.map(({ surface, preview }) => {
              const Icon = surface.icon;
              return (
                <button
                  key={surface.id}
                  onClick={() => navigate(surface.route)}
                  className={cn(
                    'group rounded-[1.75rem] border p-6 text-left transition-all hover:-translate-y-1',
                    surface.cardClassName,
                    'shadow-[0_25px_80px_rgba(0,0,0,0.22)]'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <Icon className={cn('h-6 w-6', surface.textClassName)} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/35 transition-transform group-hover:translate-x-1 group-hover:text-white/75" />
                  </div>

                  <div className="mt-5">
                    <div className={cn('text-[11px] font-black uppercase tracking-[0.18em]', surface.textClassName)}>
                      {pick(language, surface.kicker)}
                    </div>
                    <h3 className="mt-2 text-2xl font-black text-white">{pick(language, surface.title)}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/74">{pick(language, surface.description)}</p>
                  </div>

                  <div className="mt-5 space-y-2">
                    {preview.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-white/62">
                        <span className={cn('h-1.5 w-1.5 rounded-full', surfaceDots[surface.id])} />
                        {item}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section id="filosofia" className="mt-24">
          <div className="glass-panel grid gap-6 border border-white/10 p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:p-8">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">
                {language === 'es' ? 'Filosofía del producto' : 'Product philosophy'}
              </div>
              <h2 className="mt-3 text-3xl font-black text-white">
                {language === 'es' ? 'Simulación, no producción' : 'Simulation, not production'}
              </h2>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-teal-500/20 bg-teal-500/10 p-4">
                  <div className="text-sm font-black text-white">{language === 'es' ? 'Aprende viendo' : 'Learn by watching'}</div>
                  <p className="mt-2 text-sm leading-7 text-white/74">
                    {language === 'es'
                      ? 'El motor, la memoria, los waits y el log se ven y se siguen, no se intuyen leyendo solo texto.'
                      : 'The engine, memory, waits, and log can be seen and followed, not just inferred from static text.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-lime-500/20 bg-lime-500/10 p-4">
                  <div className="text-sm font-black text-white">{language === 'es' ? 'Practica sin romper nada' : 'Practice without breaking anything'}</div>
                  <p className="mt-2 text-sm leading-7 text-white/74">
                    {language === 'es'
                      ? 'Puedes simular bloqueos, spill, WRITELOG o contención de TempDB sin tocar una instancia real.'
                      : 'You can simulate blocking, spills, WRITELOG, or TempDB contention without touching a real instance.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b1112] p-4 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/8 pb-3">
                <div className="h-3 w-3 rounded-full bg-rose-400/50" />
                <div className="h-3 w-3 rounded-full bg-amber-300/50" />
                <div className="h-3 w-3 rounded-full bg-lime-300/50" />
                <span className="ml-2 text-xs font-mono text-white/42">phase-zero-simulator.tsx</span>
              </div>
              <div className="mt-4 space-y-3 font-mono text-sm">
                <div className="text-white/66">
                  &gt; <span className="text-teal-300">SELECT</span> * <span className="text-teal-300">FROM</span> FactSales
                </div>
                <div className="text-lime-300">↳ Parsing... [0.01ms]</div>
                <div className="text-lime-300">↳ Binding... [0.03ms]</div>
                <div className="text-amber-300">↳ Optimizer: seek + key lookup detectado</div>
                <div className="text-rose-300">↳ Runtime: PAGEIOLATCH + 28,140 logical reads</div>
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-6 text-white/76">
                  <strong className="text-rose-200">{language === 'es' ? 'Lección:' : 'Lesson:'}</strong>{' '}
                  {language === 'es'
                    ? 'entiende primero la forma del plan y la presión que genera antes de tocar la query.'
                    : 'understand the plan shape and the pressure it creates before touching the query.'}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
