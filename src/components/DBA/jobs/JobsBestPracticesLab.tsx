import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, ClipboardList, Shield, TriangleAlert, Wrench } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { JOB_TSQL_SNIPPETS } from '../../../data/industryJobsData';
import { cn } from '../../../lib/utils';
import { CopyCodeBlock } from '../../Shared/CopyCodeBlock';
import { DBAActionBoard } from '../../Shared/DBAActionBoard';
import { GuidedLabPanel } from '../../Shared/GuidedLabPanel';

type OwnerId = 'sa' | 'service' | 'user';
type WindowId = 'offpeak' | 'peak';
type StrategyId = 'ola' | 'maintenance-plan';

function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const LAB_PRESETS = [
  {
    id: 'fragile',
    title: { en: 'Fragile job', es: 'Job frágil' },
    detail: {
      en: 'A realistic bad setup: personal owner, no notifications, peak window and maintenance plan.',
      es: 'Un mal setup realista: owner personal, sin notificaciones, ventana de pico y maintenance plan.',
    },
    state: {
      strategy: 'maintenance-plan' as const,
      owner: 'user' as const,
      notify: false,
      logToTable: false,
      separateJobs: false,
      windowId: 'peak' as const,
      retries: 0,
    },
  },
  {
    id: 'baseline',
    title: { en: 'Baseline DBA', es: 'Baseline DBA' },
    detail: {
      en: 'A decent operational baseline: Ola, notifications, logging and off-peak scheduling.',
      es: 'Una baseline operativa decente: Ola, notificaciones, logging y ejecución off-peak.',
    },
    state: {
      strategy: 'ola' as const,
      owner: 'service' as const,
      notify: true,
      logToTable: true,
      separateJobs: true,
      windowId: 'offpeak' as const,
      retries: 2,
    },
  },
  {
    id: 'hardened',
    title: { en: 'Hardened runbook', es: 'Runbook endurecido' },
    detail: {
      en: 'A setup you can explain and operate: stable owner, alerts, retries, split jobs and low-risk window.',
      es: 'Un setup que puedes explicar y operar: owner estable, alertas, retries, jobs separados y ventana de bajo riesgo.',
    },
    state: {
      strategy: 'ola' as const,
      owner: 'sa' as const,
      notify: true,
      logToTable: true,
      separateJobs: true,
      windowId: 'offpeak' as const,
      retries: 4,
    },
  },
] as const;

const GUIDE_STEPS = [
  {
    title: { en: 'Break the job on purpose', es: 'Rompe el job a propósito' },
    detail: {
      en: 'Start from a fragile setup so you can see which options create operational risk.',
      es: 'Empieza por un setup frágil para ver qué opciones crean riesgo operativo.',
    },
  },
  {
    title: { en: 'Stabilize the basics', es: 'Estabiliza lo básico' },
    detail: {
      en: 'Fix owner, notifications, retries and schedule before chasing advanced ideas.',
      es: 'Arregla owner, notificaciones, retries y horario antes de perseguir ideas avanzadas.',
    },
  },
  {
    title: { en: 'Choose the right maintenance strategy', es: 'Elige la estrategia correcta' },
    detail: {
      en: 'The key lesson is that job design and maintenance strategy are part of the same reliability story.',
      es: 'La lección clave es que el diseño del job y la estrategia de mantenimiento forman la misma historia de fiabilidad.',
    },
  },
  {
    title: { en: 'Leave a runbook behind', es: 'Deja un runbook detrás' },
    detail: {
      en: 'You have learned the lab when you can explain who owns the job, how it alerts and how you would validate failure.',
      es: 'Has aprendido el lab cuando sabes explicar quién es el owner, cómo alerta y cómo validarías un fallo.',
    },
  },
] as const;

interface JobsBestPracticesLabProps {
  compact?: boolean;
}

export function JobsBestPracticesLab({ compact = false }: JobsBestPracticesLabProps) {
  const { language } = useLanguage();
  const [strategy, setStrategy] = useState<StrategyId>('ola');
  const [owner, setOwner] = useState<OwnerId>('sa');
  const [notify, setNotify] = useState(true);
  const [logToTable, setLogToTable] = useState(true);
  const [separateJobs, setSeparateJobs] = useState(true);
  const [windowId, setWindowId] = useState<WindowId>('offpeak');
  const [retries, setRetries] = useState(2);

  const applyPreset = (presetId: (typeof LAB_PRESETS)[number]['id']) => {
    const preset = LAB_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setStrategy(preset.state.strategy);
    setOwner(preset.state.owner);
    setNotify(preset.state.notify);
    setLogToTable(preset.state.logToTable);
    setSeparateJobs(preset.state.separateJobs);
    setWindowId(preset.state.windowId);
    setRetries(preset.state.retries);
  };

  const { risk, warnings } = useMemo(() => {
    let score = 0;
    const items: Array<{ severity: 'critical' | 'warning' | 'info'; es: string; en: string }> = [];

    if (strategy === 'maintenance-plan') {
      score += 28;
      items.push({
        severity: 'critical',
        en: 'Maintenance Plans tend to rebuild too much, generating unnecessary log and IO.',
        es: 'Los Maintenance Plans suelen reconstruir de mas, generando log e IO innecesarios.',
      });
    }
    if (owner === 'user') {
      score += 18;
      items.push({
        severity: 'warning',
        en: 'Job owner as a human user can break when the account is disabled or rotated.',
        es: 'Owner del job como usuario humano puede romper al deshabilitar/rotar la cuenta.',
      });
    }
    if (!notify) {
      score += 16;
      items.push({
        severity: 'warning',
        en: 'No operator notification: failures can go unnoticed.',
        es: 'Sin notificacion a operador: los fallos pueden pasar desapercibidos.',
      });
    }
    if (!logToTable) {
      score += 10;
      items.push({
        severity: 'info',
        en: 'No logging: you lose auditability and trend analysis.',
        es: 'Sin logging: pierdes auditoria y analisis de tendencias.',
      });
    }
    if (!separateJobs) {
      score += 12;
      items.push({
        severity: 'info',
        en: 'One big job for everything makes retries and isolation harder.',
        es: 'Un job gigante para todo dificulta retries y aislamiento.',
      });
    }
    if (windowId === 'peak') {
      score += 14;
      items.push({
        severity: 'warning',
        en: 'Running heavy maintenance during peak hours increases latency and blocking risk.',
        es: 'Correr mantenimiento pesado en horas pico sube latencia y riesgo de bloqueos.',
      });
    }
    if (retries <= 0) {
      score += 8;
      items.push({
        severity: 'info',
        en: 'Zero retries: transient IO/network issues may become incidents.',
        es: 'Cero retries: problemas transitorios de IO/red pueden convertirse en incidente.',
      });
    }

    return { risk: clamp(0, score, 100), warnings: items };
  }, [logToTable, notify, owner, retries, separateJobs, strategy, windowId]);

  const health = 100 - risk;
  const healthStyle = health >= 80 ? 'text-emerald-300' : health >= 55 ? 'text-amber-300' : 'text-rose-300';
  const guideStep = health >= 85 ? 3 : health >= 65 ? 2 : health >= 40 ? 1 : 0;
  const dbaFocus =
    health < 40
      ? {
          en: 'This job is fragile. A senior DBA would treat it as an incident waiting to happen, not as “maintenance configured”.',
          es: 'Este job es fragil. Un DBA senior lo trataria como una incidencia esperando ocurrir, no como “mantenimiento configurado”.',
        }
      : health < 75
        ? {
            en: 'The job works, but it is still operationally weak. The DBA now removes silent-failure paths and narrows risk during peak hours.',
            es: 'El job funciona, pero sigue siendo debil operativamente. Ahora el DBA elimina vias de fallo silencioso y reduce riesgo en horas pico.',
          }
        : {
            en: 'The setup is healthy enough. The next DBA move is leaving traceability, tested restores and a clean runbook behind.',
            es: 'La configuracion es razonablemente sana. El siguiente paso DBA es dejar trazabilidad, restores probados y un runbook limpio.',
          };

  const dbaActions =
    health < 40
      ? [
          {
            en: 'Move ownership away from personal users and wire notifications before the next failure goes silent.',
            es: 'Saca el ownership de usuarios personales y conecta notificaciones antes de que el siguiente fallo pase en silencio.',
          },
          {
            en: 'Stop using one giant maintenance plan for everything and split backup, integrity and index work.',
            es: 'Deja de usar un maintenance plan gigante para todo y separa backup, integrity e index work.',
          },
          {
            en: 'Take the job out of peak hours before tuning anything else.',
            es: 'Saca el job de horas pico antes de tunear cualquier otra cosa.',
          },
        ]
      : health < 75
        ? [
            {
              en: 'Keep the strategy but harden retries, output logging and operator visibility.',
              es: 'Mantén la estrategia pero endurece retries, output logging y visibilidad para el operador.',
            },
            {
              en: 'Review whether the maintenance window still matches the real write workload.',
              es: 'Revisa si la ventana de mantenimiento sigue encajando con la carga real de escrituras.',
            },
            {
              en: 'Document what should happen when the job fails, not only when it succeeds.',
              es: 'Documenta qué debe pasar cuando el job falla, no solo cuando sale bien.',
            },
          ]
        : [
            {
              en: 'Validate restore drills and msdb retention so the job history remains useful under pressure.',
              es: 'Valida restores de prueba y la retencion de msdb para que el historial del job siga siendo util bajo presion.',
            },
            {
              en: 'Review index, backup and integrity runtimes separately instead of trusting one green status.',
              es: 'Revisa por separado los tiempos de index, backup e integrity en lugar de fiarte de un solo estado verde.',
            },
            {
              en: 'Leave a runbook with owner, alert path and first-response commands for the next DBA on call.',
              es: 'Deja un runbook con owner, ruta de alerta y comandos de primera respuesta para el siguiente DBA de guardia.',
            },
          ];
  const healthChip =
    health >= 80
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
      : health >= 55
        ? 'border-amber-500/25 bg-amber-500/10 text-amber-200'
        : 'border-rose-500/25 bg-rose-500/10 text-rose-200';

  return (
    <div className={cn('grid gap-4 lg:gap-6 h-full', compact ? 'xl:grid-cols-[minmax(0,1.08fr)_340px]' : 'xl:grid-cols-[minmax(0,1.14fr)_420px]')}>
      <div className={cn('glass-panel rounded-2xl border border-white/10 p-4 sm:p-6', compact && 'min-h-0 overflow-hidden flex flex-col')}>
        {!compact ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-emerald-300 flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                {language === 'es' ? 'Lab: buenas practicas de Jobs (SQL Agent)' : 'Lab: SQL Agent job best practices'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {language === 'es'
                  ? 'Configura un job ficticio y mira como cambian los riesgos: owner, notificaciones, logging, ventanas y estrategia (Ola vs Maintenance Plan).'
                  : 'Configure a fake job and watch risk change: owner, notifications, logging, windows and strategy (Ola vs Maintenance Plan).'}
              </p>
            </div>
            <span className={cn('rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', healthChip)}>
              {language === 'es' ? 'salud' : 'health'} {health}%
            </span>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200">
              {language === 'es' ? 'Play: configuracion en vivo' : 'Play: live configuration'}
            </div>
            <p className="mt-2 text-xs text-white/75">
              {language === 'es'
                ? 'Cambia opciones del job y mira como se mueve el riesgo operativo al instante.'
                : 'Change job options and watch operational risk move instantly.'}
            </p>
          </div>
        )}

        {!compact ? <div className="mt-5">
          <GuidedLabPanel
            language={language}
            compact={compact}
            accent="emerald"
            title={{ en: 'How to work this lab', es: 'Cómo trabajar este lab' }}
            objective={{
              en: 'Learn to read a job as an operational system: ownership, alerting, logging and maintenance strategy all matter together.',
              es: 'Aprende a leer un job como un sistema operativo: ownership, alertas, logging y estrategia de mantenimiento importan juntos.',
            }}
            watchItems={[
              {
                en: 'A healthy score is not cosmetic: it means fewer silent failures and easier recovery.',
                es: 'Una salud alta no es cosmética: significa menos fallos silenciosos y recuperación más fácil.',
              },
              {
                en: 'Do not judge only the maintenance command. Judge the whole runbook around it.',
                es: 'No juzgues solo el comando de mantenimiento. Juzga todo el runbook que lo rodea.',
              },
              {
                en: 'Use the presets below to compare a bad setup against a production-worthy one.',
                es: 'Usa los presets de abajo para comparar un setup malo contra uno digno de producción.',
              },
            ]}
            steps={GUIDE_STEPS}
            currentStep={guideStep}
            footer={{
              en: 'If you can explain why a job will fail loudly instead of silently, the lab already did its job.',
              es: 'Si sabes explicar por qué un job fallará de forma visible y no silenciosa, el lab ya hizo su trabajo.',
            }}
          />
        </div> : null}

        <div className={cn('mt-5 grid gap-3', compact ? 'sm:grid-cols-3' : 'lg:grid-cols-3')}>
          {LAB_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className="rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="text-sm font-bold text-white">{language === 'es' ? preset.title.es : preset.title.en}</div>
              {!compact ? <p className="mt-2 text-sm leading-7 text-white/70">{language === 'es' ? preset.detail.es : preset.detail.en}</p> : null}
            </button>
          ))}
        </div>

        <div className={cn('mt-6 grid gap-4 lg:grid-cols-2', compact && 'min-h-0 flex-1')}>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              {language === 'es' ? 'Configuracion' : 'Configuration'}
            </div>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-bold text-white/65">{language === 'es' ? 'Estrategia' : 'Strategy'}</div>
                  <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
                    {(
                      [
                        { id: 'ola', label: { en: 'Ola', es: 'Ola' }, icon: Wrench },
                        { id: 'maintenance-plan', label: { en: 'Maintenance Plan', es: 'Maintenance Plan' }, icon: TriangleAlert },
                      ] as const
                    ).map((opt) => {
                      const Icon = opt.icon;
                      const isActive = strategy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setStrategy(opt.id)}
                          className={cn(
                            'rounded-xl px-3 py-2 text-xs font-bold transition-all flex items-center gap-2',
                            isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {language === 'es' ? opt.label.es : opt.label.en}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-white/65">{language === 'es' ? 'Owner' : 'Owner'}</div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'sa', label: 'sa' },
                        { id: 'service', label: language === 'es' ? 'servicio' : 'service' },
                        { id: 'user', label: language === 'es' ? 'usuario' : 'user' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setOwner(opt.id)}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-xs font-bold transition-all',
                          owner === opt.id ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-black/20 text-white/55 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-bold text-white/65">{language === 'es' ? 'Ventana' : 'Window'}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'offpeak', label: { en: 'Off-peak', es: 'Off-peak' } },
                        { id: 'peak', label: { en: 'Peak', es: 'Pico' } },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setWindowId(opt.id)}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-xs font-bold transition-all',
                          windowId === opt.id ? 'border-white/20 bg-white/10 text-white' : 'border-white/10 bg-black/20 text-white/55 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {language === 'es' ? opt.label.es : opt.label.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-white/65">{language === 'es' ? 'Retries' : 'Retries'}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={retries}
                      onChange={(e) => setRetries(Number(e.target.value))}
                      className="accent-emerald-400 w-full"
                    />
                    <span className={cn('w-10 text-right text-sm font-black', healthStyle)}>{retries}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { id: 'notify', label: { en: 'Notify', es: 'Notificar' }, icon: Bell, value: notify, set: setNotify },
                  { id: 'log', label: { en: 'Logging', es: 'Logging' }, icon: CheckCircle2, value: logToTable, set: setLogToTable },
                  { id: 'split', label: { en: 'Separate jobs', es: 'Separar jobs' }, icon: Shield, value: separateJobs, set: setSeparateJobs },
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => opt.set(!opt.value)}
                      className={cn(
                        'rounded-2xl border p-3 text-left transition-all',
                        opt.value ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-white/10 bg-black/20 hover:bg-white/5'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4', opt.value ? 'text-emerald-300' : 'text-white/45')} />
                          <div className="text-xs font-bold text-white/70">{language === 'es' ? opt.label.es : opt.label.en}</div>
                        </div>
                        <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', opt.value ? 'border-emerald-500/20 bg-black/25 text-emerald-200' : 'border-white/10 bg-white/5 text-white/45')}>
                          {opt.value ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={cn('rounded-3xl border border-white/10 bg-black/20 p-5', compact && 'min-h-0 overflow-y-auto')}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                {language === 'es' ? 'Riesgos' : 'Risks'}
              </div>
              <div className={cn('text-2xl font-black', healthStyle)}>{health}%</div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${clamp(0, health, 100)}%` }}
                transition={{ duration: 0.5 }}
                className={cn(
                  'h-full rounded-full',
                  health >= 80 ? 'bg-gradient-to-r from-emerald-400 to-cyan-300' : health >= 55 ? 'bg-gradient-to-r from-amber-400 to-orange-300' : 'bg-gradient-to-r from-rose-500 to-amber-300'
                )}
              />
            </div>

            <div className="mt-4">
              <AnimatePresence initial={false}>
                {warnings.length ? (
                  <div className="grid gap-3">
                    {warnings.map((w) => (
                      <motion.div
                        key={w.en}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className={cn(
                          'rounded-3xl border p-4 text-sm leading-7',
                          w.severity === 'critical'
                            ? 'border-rose-500/20 bg-rose-500/10 text-white/85'
                            : w.severity === 'warning'
                              ? 'border-amber-500/20 bg-amber-500/10 text-white/85'
                              : 'border-white/10 bg-black/25 text-white/70'
                        )}
                      >
                        {language === 'es' ? w.es : w.en}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    key="no-warnings"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-white/80"
                  >
                    {language === 'es'
                      ? 'Config bastante sana. Ahora asegurate de: restores probados, retention en msdb, y alertas a operador.'
                      : 'This looks healthy. Next: tested restores, msdb retention, and operator alerts.'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {!compact ? <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="glass-panel rounded-2xl border border-white/10 p-6">
            <h4 className="text-lg font-bold text-white">{language === 'es' ? 'Plantillas T-SQL (copiar y pegar)' : 'T-SQL templates (copy/paste)'}</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === 'es'
                ? 'Ejemplos de ejecucion tipica para mantenimiento y health-check.'
                : 'Typical execution examples for maintenance and health-check.'}
            </p>
            <div className="mt-5 space-y-4">
              <CopyCodeBlock code={JOB_TSQL_SNIPPETS.olaBackups} accent="emerald" />
              <CopyCodeBlock code={JOB_TSQL_SNIPPETS.blitz} accent="cyan" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              {language === 'es' ? 'Checklist rapido' : 'Quick checklist'}
            </div>
            <div className="mt-4 grid gap-3">
              {[
                {
                  en: 'Owner = sa or a stable service principal (avoid personal accounts)',
                  es: 'Owner = sa o principal de servicio estable (evita cuentas personales)',
                },
                {
                  en: 'Retries + output logging + operator notifications',
                  es: 'Retries + logging de salida + notificaciones a operador',
                },
                {
                  en: 'Separate backup / integrity / index jobs, schedule off-peak',
                  es: 'Separa backup / integrity / index, programa off-peak',
                },
                {
                  en: 'Log to table and keep msdb history retention sane',
                  es: 'Loguea a tabla y mantén retention de msdb con sentido',
                },
              ].map((row) => (
                <div key={row.en} className="rounded-3xl border border-white/10 bg-black/25 p-4 text-sm text-white/75">
                  {language === 'es' ? row.es : row.en}
                </div>
              ))}
            </div>
          </div>
        </div> : null}
      </div>

      {compact ? (
        <div className="grid min-h-0 h-full gap-4 xl:grid-rows-[auto_minmax(0,1fr)_auto]">
          <div className="glass-panel rounded-2xl border border-white/10 p-4">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                { label: language === 'es' ? 'Salud' : 'Health', value: `${health}%` },
                { label: language === 'es' ? 'Riesgo' : 'Risk', value: `${risk}%` },
                { label: language === 'es' ? 'Estrategia' : 'Strategy', value: strategy === 'ola' ? 'Ola' : 'Maintenance Plan' },
              ].map((cell) => (
                <div key={cell.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{cell.label}</div>
                  <div className="mt-2 text-base font-black text-white">{cell.value}</div>
                </div>
              ))}
            </div>
          </div>

          <DBAActionBoard
            language={language}
            accent={health >= 80 ? 'emerald' : health >= 55 ? 'amber' : 'rose'}
            title={{ en: 'What the DBA does now', es: 'Que hace ahora el DBA' }}
            focus={dbaFocus}
            actions={dbaActions}
            caution={{
              en: 'A green job that nobody can audit or restore around is still not production-grade.',
              es: 'Un job verde que nadie puede auditar ni rodear con restores sigue sin ser de nivel produccion.',
            }}
          />

          <div className="glass-panel rounded-2xl border border-white/10 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
              {language === 'es' ? 'Script operativo' : 'Operational script'}
            </div>
            <div className="mt-3">
              <CopyCodeBlock
                code={strategy === 'ola' ? JOB_TSQL_SNIPPETS.olaBackups : JOB_TSQL_SNIPPETS.blitz}
                accent={strategy === 'ola' ? 'emerald' : 'cyan'}
                contentClassName="max-h-[220px]"
              />
            </div>
          </div>
        </div>
      ) : null}

      {!compact ? <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-lg font-bold text-white">{language === 'es' ? 'Tip pro' : 'Pro tip'}</h4>
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/70">
            {language === 'es' ? 'runbook' : 'runbook'}
          </span>
        </div>
        <p className="mt-3 text-sm leading-7 text-white/75">
          {language === 'es'
            ? 'La diferencia entre un DBA senior y un incendio es: jobs con visibilidad, alertas y runbooks. Los scripts de Ola/Brent ayudan, pero lo que escala es el proceso.'
            : 'The difference between senior DBA work and firefighting is: visible jobs, alerts and runbooks. Ola/Brent help, but process is what scales.'}
        </p>
      </div> : null}
    </div>
  );
}
