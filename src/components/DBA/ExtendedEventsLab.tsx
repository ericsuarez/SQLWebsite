import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, ArrowRight, Pause, Play, Radar, RotateCcw, Search } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { XEVENT_LABS, type LocalizedCaseText } from './realCasesData';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';
import { DBAActionBoard } from '../Shared/DBAActionBoard';

type ViewMode = 'intro' | 'play';

interface StageDefinition {
  id: 'configure' | 'capture' | 'incident' | 'analyze';
  badge: string;
  title: LocalizedCaseText;
  detail: LocalizedCaseText;
  tone: string;
  chip: string;
}

interface StageSnapshot {
  incoming: LocalizedCaseText;
  evidence: LocalizedCaseText;
  focus: LocalizedCaseText;
  actions: LocalizedCaseText[];
  caution: LocalizedCaseText;
}

interface StreamRow {
  time: string;
  label: LocalizedCaseText;
  detail: LocalizedCaseText;
  tone: string;
}

const STAGES: StageDefinition[] = [
  {
    id: 'configure',
    badge: 'STEP 1',
    title: { en: 'Arm the session', es: 'Armar la sesión' },
    detail: { en: 'Define the capture before the problem vanishes.', es: 'Definir la captura antes de que el problema desaparezca.' },
    tone: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
    chip: 'border-orange-500/25 bg-orange-500/10 text-orange-200',
  },
  {
    id: 'capture',
    badge: 'STEP 2',
    title: { en: 'Capture live', es: 'Capturar en vivo' },
    detail: { en: 'XE writes evidence while the workload is still active.', es: 'XE escribe evidencia mientras la carga sigue activa.' },
    tone: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
    chip: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200',
  },
  {
    id: 'incident',
    badge: 'STEP 3',
    title: { en: 'Incident hits', es: 'Golpea la incidencia' },
    detail: { en: 'The timeout, block or deadlock disappears from DMVs.', es: 'El timeout, bloqueo o deadlock desaparece de las DMVs.' },
    tone: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    chip: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
  },
  {
    id: 'analyze',
    badge: 'STEP 4',
    title: { en: 'Read and decide', es: 'Leer y decidir' },
    detail: { en: 'Read the file and decide the next DBA action.', es: 'Leer el fichero y decidir la siguiente acción DBA.' },
    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    chip: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
  },
];

const PLAYBOOK: Record<string, StageSnapshot[]> = {
  'attention-timeouts': [
    {
      incoming: { en: 'The app reports random timeouts and no live request remains when you connect.', es: 'La app reporta timeouts aleatorios y ya no queda request viva cuando te conectas.' },
      evidence: { en: 'You prepare sqlserver.attention plus caller metadata before the incident.', es: 'Preparas sqlserver.attention más metadatos del llamador antes de la incidencia.' },
      focus: { en: 'Capture who cancelled first and with which SQL text.', es: 'Captura quién canceló primero y con qué SQL text.' },
      actions: [
        { en: 'Keep the event list minimal so the session is cheap.', es: 'Mantén la lista de eventos mínima para que la sesión sea barata.' },
        { en: 'Add only useful actions: app, session, db and sql_text.', es: 'Añade solo actions útiles: app, sesión, base y sql_text.' },
        { en: 'Write to event_file if you need durable evidence.', es: 'Escribe a event_file si necesitas evidencia duradera.' },
      ],
      caution: { en: 'ATTENTION proves cancellation, not the whole root cause.', es: 'ATTENTION demuestra la cancelación, no toda la causa raíz.' },
    },
    {
      incoming: { en: 'The same endpoint keeps sending the slow RPC while XE is active.', es: 'El mismo endpoint sigue enviando el RPC lento mientras XE está activo.' },
      evidence: { en: 'rpc_completed and attention land in the file with client metadata.', es: 'rpc_completed y attention caen en el fichero con metadatos del cliente.' },
      focus: { en: 'Validate the capture while the workload is still alive.', es: 'Valida la captura mientras la carga sigue viva.' },
      actions: [
        { en: 'Confirm the file grows and events keep arriving.', es: 'Confirma que el fichero crece y que siguen llegando eventos.' },
        { en: 'Watch whether one caller repeats the pattern.', es: 'Observa si un mismo llamador repite el patrón.' },
        { en: 'Note the time window for later correlation.', es: 'Apunta la ventana temporal para correlacionarla después.' },
      ],
      caution: { en: 'Do not stop the session after the first hit if the issue is intermittent.', es: 'No pares la sesión tras el primer hit si el problema es intermitente.' },
    },
    {
      incoming: { en: 'A request crosses the timeout and the client sends ATTENTION.', es: 'Una request supera el timeout y el cliente envía ATTENTION.' },
      evidence: { en: 'XE keeps the cancelled SQL and caller after the request vanishes from DMVs.', es: 'XE conserva el SQL cancelado y el llamador aunque la request desaparezca de las DMVs.' },
      focus: { en: 'Separate engine slowness from app impatience.', es: 'Separa lentitud real del motor de impaciencia de la app.' },
      actions: [
        { en: 'Compare the attention timestamp with the last completed batch.', es: 'Compara el timestamp del attention con el último batch completado.' },
        { en: 'Read the exact SQL text tied to the cancellation.', es: 'Lee el SQL exacto ligado a la cancelación.' },
        { en: 'Decide whether the next stop is plan analysis or timeout review.', es: 'Decide si el siguiente paso es analizar el plan o revisar el timeout.' },
      ],
      caution: { en: 'A timeout is a symptom. The engine path still needs proof.', es: 'Un timeout es un síntoma. La ruta del motor aún necesita prueba.' },
    },
    {
      incoming: { en: 'The incident is over, but the file now lets you build the runbook.', es: 'La incidencia ya terminó, pero el fichero te deja construir el runbook.' },
      evidence: { en: 'Readback exposes caller, SQL text and timing in one place.', es: 'La lectura expone llamador, SQL text y tiempo en un solo punto.' },
      focus: { en: 'Turn evidence into the next operational step.', es: 'Convierte la evidencia en el siguiente paso operativo.' },
      actions: [
        { en: 'Isolate the statement and caller pair.', es: 'Aísla la pareja sentencia-llamador.' },
        { en: 'Plan the follow-up capture if you still need plan or waits.', es: 'Planifica la captura siguiente si aún necesitas plan o waits.' },
        { en: 'Document the evidence path for the next incident.', es: 'Documenta la ruta de evidencia para la siguiente incidencia.' },
      ],
      caution: { en: 'If you cannot name caller, SQL and time window, the investigation is incomplete.', es: 'Si no puedes nombrar llamador, SQL y ventana temporal, la investigación está incompleta.' },
    },
  ],
  'blocked-process': [
    {
      incoming: { en: 'Users report freezes, but the blocker is gone when you connect.', es: 'Los usuarios reportan congelaciones, pero el bloqueador ya no está cuando te conectas.' },
      evidence: { en: 'blocked_process_report is armed before the chain disappears.', es: 'blocked_process_report queda armado antes de que la cadena desaparezca.' },
      focus: { en: 'Persist the whole graph, not just the victim symptom.', es: 'Persiste el grafo completo, no solo el síntoma de la víctima.' },
      actions: [
        { en: 'Set the threshold high enough to avoid noise.', es: 'Pon el threshold lo bastante alto para evitar ruido.' },
        { en: 'Send the report to event_file for post-mortem review.', es: 'Envía el reporte a event_file para revisarlo después.' },
        { en: 'Capture blocker, victim and resource context.', es: 'Captura bloqueador, víctima y contexto del recurso.' },
      ],
      caution: { en: 'A very low threshold creates noise, not evidence.', es: 'Un threshold demasiado bajo crea ruido, no evidencia.' },
    },
    {
      incoming: { en: 'An open transaction holds the lock while waiters pile up.', es: 'Una transacción abierta retiene el lock mientras se apilan los waiters.' },
      evidence: { en: 'XE persists the blocker chain while the incident is still hot.', es: 'XE persiste la cadena de bloqueo mientras la incidencia sigue caliente.' },
      focus: { en: 'Preserve the blocker-victim relationship before it clears.', es: 'Preserva la relación bloqueador-víctima antes de que se limpie.' },
      actions: [
        { en: 'Confirm the event count is moving.', es: 'Confirma que el contador de eventos se mueve.' },
        { en: 'Watch whether the same SPID stays at the head.', es: 'Observa si el mismo SPID sigue a la cabeza.' },
        { en: 'Prepare the open transaction check if the blocker survives.', es: 'Prepara el chequeo de transacción abierta si el bloqueador sobrevive.' },
      ],
      caution: { en: 'Manual DMV snapshots arrive late in this kind of incident.', es: 'Las capturas manuales de DMV llegan tarde en este tipo de incidencia.' },
    },
    {
      incoming: { en: 'The blocker commits or rolls back and live DMVs clear out.', es: 'El bloqueador hace commit o rollback y las DMVs se vacían.' },
      evidence: { en: 'The XML graph still keeps blocker, victims and resource.', es: 'El grafo XML sigue conservando bloqueador, víctimas y recurso.' },
      focus: { en: 'Rebuild the chain from evidence, not from memory.', es: 'Reconstruye la cadena desde la evidencia, no desde la memoria.' },
      actions: [
        { en: 'Read which SPID owned the resource and for how long.', es: 'Lee qué SPID poseía el recurso y durante cuánto tiempo.' },
        { en: 'Tie the graph to the SQL or transaction pattern.', es: 'Ata el grafo al SQL o al patrón transaccional.' },
        { en: 'Decide whether the fix is code, isolation, index or scope.', es: 'Decide si la corrección es código, aislamiento, índice o alcance.' },
      ],
      caution: { en: 'Do not stop at “there was blocking”; name object and root blocker.', es: 'No te quedes en “había bloqueo”; nombra objeto y bloqueador raíz.' },
    },
    {
      incoming: { en: 'Now you can turn the XML into an operational response.', es: 'Ahora puedes convertir el XML en una respuesta operativa.' },
      evidence: { en: 'Readback gives you blocker, victim and resource in one artifact.', es: 'La lectura te da bloqueador, víctima y recurso en un solo artefacto.' },
      focus: { en: 'Close with a repeatable workflow: prove, validate, then act.', es: 'Cierra con un flujo repetible: demostrar, validar y después actuar.' },
      actions: [
        { en: 'Parse the XML and isolate blocker, victim and object.', es: 'Parsea el XML y aísla bloqueador, víctima y objeto.' },
        { en: 'Validate rollback cost if KILL is on the table.', es: 'Valida el coste de rollback si KILL está sobre la mesa.' },
        { en: 'Document the safe response for the next time.', es: 'Documenta la respuesta segura para la próxima vez.' },
      ],
      caution: { en: 'KILL is only one branch of the runbook, not the whole lesson.', es: 'KILL es solo una rama del runbook, no toda la lección.' },
    },
  ],
  'deadlock-graph': [
    {
      incoming: { en: 'The app logs 1205, but the deadlock dies instantly.', es: 'La app registra 1205, pero el deadlock muere al instante.' },
      evidence: { en: 'xml_deadlock_report is armed before the collision.', es: 'xml_deadlock_report queda armado antes de la colisión.' },
      focus: { en: 'Without graph there is no real deadlock evidence.', es: 'Sin grafo no hay evidencia real de deadlock.' },
      actions: [
        { en: 'Enable the minimum deadlock capture path.', es: 'Habilita la ruta mínima de captura de deadlocks.' },
        { en: 'Persist to event_file so the XML survives.', es: 'Persiste a event_file para que el XML sobreviva.' },
        { en: 'Agree that the graph, not the app error, drives the fix.', es: 'Acordad que el grafo, no el error de la app, guía la corrección.' },
      ],
      caution: { en: 'The error code alone does not explain lock order.', es: 'El código de error por sí solo no explica el orden de locks.' },
    },
    {
      incoming: { en: 'Two sessions invert resource order and approach the collision point.', es: 'Dos sesiones invierten el orden de recursos y se acercan al punto de colisión.' },
      evidence: { en: 'XE is already listening when the cycle forms.', es: 'XE ya está escuchando cuando se forma el ciclo.' },
      focus: { en: 'You need owner, waiter and resource order, not just the victim SPID.', es: 'Necesitas owner, waiter y orden de recursos, no solo el SPID víctima.' },
      actions: [
        { en: 'Correlate which app action leads to the inversion.', es: 'Correlaciona qué acción de la app lleva a la inversión.' },
        { en: 'Watch whether the same objects repeat.', es: 'Observa si se repiten siempre los mismos objetos.' },
        { en: 'Prepare the likely fix branch: order, retry or indexing.', es: 'Prepara la rama probable de corrección: orden, retry o indexación.' },
      ],
      caution: { en: 'One victim SPID is not the pattern.', es: 'Un solo SPID víctima no es el patrón.' },
    },
    {
      incoming: { en: 'SQL resolves the cycle and kills one session.', es: 'SQL resuelve el ciclo y mata una sesión.' },
      evidence: { en: 'The XML graph captures victim, owners, resources and lock order.', es: 'El grafo XML captura víctima, owners, recursos y orden de locks.' },
      focus: { en: 'Explain exactly why the cycle formed.', es: 'Explica exactamente por qué se formó el ciclo.' },
      actions: [
        { en: 'Read victim and survivor together with the resources they crossed on.', es: 'Lee víctima y superviviente junto con los recursos donde chocaron.' },
        { en: 'Check whether access order or missing indexes increased lock hold time.', es: 'Comprueba si el orden de acceso o la falta de índices alargó la retención.' },
        { en: 'Decide between retry logic, query rewrite or schema change.', es: 'Decide entre retry logic, reescritura de query o cambio de esquema.' },
      ],
      caution: { en: 'The engine already solved this deadlock. Your job is to stop the next one.', es: 'El motor ya resolvió este deadlock. Tu trabajo es evitar el siguiente.' },
    },
    {
      incoming: { en: 'The graph is ready to become an engineering fix.', es: 'El grafo ya está listo para convertirse en una corrección de ingeniería.' },
      evidence: { en: 'Readback gives the XML you need to explain the cycle.', es: 'La lectura te da el XML que necesitas para explicar el ciclo.' },
      focus: { en: 'Close only when you can explain victim, order and preventive change.', es: 'Cierra solo cuando puedas explicar víctima, orden y cambio preventivo.' },
      actions: [
        { en: 'Extract the resource sequence and document the conflict.', es: 'Extrae la secuencia de recursos y documenta el conflicto.' },
        { en: 'Build the follow-up concurrency test.', es: 'Construye la prueba siguiente de concurrencia.' },
        { en: 'Store graph and remediation in the incident record.', es: 'Guarda el grafo y la remediación en el registro de incidencia.' },
      ],
      caution: { en: '“We will monitor it” is not a finished fix.', es: '“Lo vigilaremos” no es una corrección terminada.' },
    },
  ],
};

const STREAMS: Record<string, StreamRow[]> = {
  'attention-timeouts': [
    { time: '00:00', label: { en: 'XE session armed', es: 'Sesión XE armada' }, detail: { en: 'attention + rpc_completed ready with app metadata.', es: 'attention + rpc_completed listos con metadatos de la app.' }, tone: 'border-orange-500/25 bg-orange-500/10 text-orange-200' },
    { time: '00:07', label: { en: 'Workload enters', es: 'Entra la carga' }, detail: { en: 'The same caller starts sending the slow RPC.', es: 'El mismo llamador empieza a enviar el RPC lento.' }, tone: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200' },
    { time: '00:19', label: { en: 'ATTENTION fires', es: 'Salta ATTENTION' }, detail: { en: 'The client cancels before the DBA can catch it live.', es: 'El cliente cancela antes de que el DBA pueda verlo en vivo.' }, tone: 'border-rose-500/25 bg-rose-500/10 text-rose-200' },
    { time: '00:28', label: { en: 'Readback closes the case', es: 'La lectura cierra el caso' }, detail: { en: 'XE readback exposes caller, SQL and timing.', es: 'La lectura XE expone llamador, SQL y tiempo.' }, tone: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' },
  ],
  'blocked-process': [
    { time: '00:00', label: { en: 'Threshold ready', es: 'Threshold listo' }, detail: { en: 'blocked_process_report is ready to persist blocker chains.', es: 'blocked_process_report está listo para persistir cadenas.' }, tone: 'border-orange-500/25 bg-orange-500/10 text-orange-200' },
    { time: '00:09', label: { en: 'Waiters pile up', es: 'Se apilan waiters' }, detail: { en: 'One open transaction becomes the head blocker.', es: 'Una transacción abierta se convierte en el bloqueador raíz.' }, tone: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200' },
    { time: '00:21', label: { en: 'Graph survives', es: 'El grafo sobrevive' }, detail: { en: 'DMVs clear out, but the XML is still there.', es: 'Las DMVs se vacían, pero el XML sigue ahí.' }, tone: 'border-rose-500/25 bg-rose-500/10 text-rose-200' },
    { time: '00:33', label: { en: 'Root blocker isolated', es: 'Bloqueador raíz aislado' }, detail: { en: 'Readback exposes blocker, victims and resource.', es: 'La lectura expone bloqueador, víctimas y recurso.' }, tone: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' },
  ],
  'deadlock-graph': [
    { time: '00:00', label: { en: 'Trap armed', es: 'Trampa armada' }, detail: { en: 'xml_deadlock_report is active before the clash.', es: 'xml_deadlock_report está activo antes del choque.' }, tone: 'border-orange-500/25 bg-orange-500/10 text-orange-200' },
    { time: '00:11', label: { en: 'Access order diverges', es: 'Diverge el orden' }, detail: { en: 'Two sessions lock resources in opposite order.', es: 'Dos sesiones bloquean recursos en orden inverso.' }, tone: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200' },
    { time: '00:15', label: { en: 'Victim selected', es: 'Víctima elegida' }, detail: { en: 'SQL breaks the cycle immediately.', es: 'SQL rompe el ciclo al instante.' }, tone: 'border-rose-500/25 bg-rose-500/10 text-rose-200' },
    { time: '00:24', label: { en: 'Graph explains the cycle', es: 'El grafo explica el ciclo' }, detail: { en: 'Victim, owners, resources and order are preserved.', es: 'Quedan preservados víctima, owners, recursos y orden.' }, tone: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' },
  ],
};

function pick(language: 'en' | 'es', value: LocalizedCaseText) {
  return language === 'es' ? value.es : value.en;
}

export function ExtendedEventsLab() {
  const { language, t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  const [activeLabId, setActiveLabId] = useState(XEVENT_LABS[0]?.id ?? '');
  const [activeStage, setActiveStage] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const activeLab = useMemo(() => XEVENT_LABS.find((lab) => lab.id === activeLabId) ?? XEVENT_LABS[0], [activeLabId]);
  const playbook = PLAYBOOK[activeLab?.id ?? 'attention-timeouts'] ?? PLAYBOOK['attention-timeouts'];
  const stream = STREAMS[activeLab?.id ?? 'attention-timeouts'] ?? STREAMS['attention-timeouts'];
  const snapshot = playbook[activeStage] ?? playbook[0];
  const currentStage = STAGES[activeStage] ?? STAGES[0];
  const visibleRows = stream.slice(0, activeStage + 1);
  const evidenceScore = Math.round(((activeStage + 1) / STAGES.length) * 100);

  useEffect(() => {
    if (viewMode !== 'play' || !autoPlay) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveStage((current) => {
        if (current >= STAGES.length - 1) {
          setAutoPlay(false);
          return current;
        }
        return current + 1;
      });
    }, 2200);

    return () => window.clearInterval(timer);
  }, [autoPlay, viewMode]);

  useEffect(() => {
    setActiveStage(0);
    setAutoPlay(false);
  }, [activeLabId]);

  if (!activeLab) {
    return null;
  }

  if (viewMode === 'intro') {
    return (
      <div className="flex min-h-full flex-col gap-5">
        <div className="glass-panel relative overflow-hidden border border-white/10 p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.12),transparent_34%)]" />
          <div className="relative z-10">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
              {language === 'es' ? 'Briefing del lab' : 'Lab briefing'}
            </div>
            <h3 className="mt-2 flex items-center gap-3 text-2xl font-bold text-white">
              <Radar className="h-6 w-6 text-orange-300" />
              {t('tabXEvents')}
            </h3>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/80">
              {language === 'es'
                ? 'Primero eliges el escenario y entiendes qué evidencia quieres conservar. Después entras en play para quedarte solo con el flujo útil: evento, SQL, fichero y siguiente decisión del DBA.'
                : 'Choose the scenario first and understand which evidence you want to preserve. Then enter play to keep only the useful flow: event, SQL, file, and the DBA next move.'}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: language === 'es' ? 'Qué verás' : 'What you will see',
                  body: language === 'es' ? 'Cómo se arma XE, cómo entra la incidencia y qué prueba deja.' : 'How XE is armed, how the incident enters, and which proof remains.',
                },
                {
                  title: language === 'es' ? 'Qué hará el DBA' : 'What the DBA will do',
                  body: language === 'es' ? 'Definir eventos mínimos, validar la captura y convertir la evidencia en acción.' : 'Define the minimum events, validate capture, and convert evidence into action.',
                },
                {
                  title: language === 'es' ? 'Cómo se usa' : 'How to use it',
                  body: language === 'es' ? 'Briefing corto y luego play grande sin scroll de página.' : 'Short briefing, then a large play mode with no page scroll.',
                },
              ].map((card) => (
                <div key={card.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">{card.title}</div>
                  <p className="mt-2 text-sm leading-7 text-white/75">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {XEVENT_LABS.map((lab) => (
            <button
              key={lab.id}
              onClick={() => {
                setActiveLabId(lab.id);
                setViewMode('play');
              }}
              className="glass-panel rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-white">{pick(language, lab.title)}</div>
                <ArrowRight className="h-4 w-4 text-white/50" />
              </div>
              <p className="mt-3 text-sm leading-7 text-white/70">{pick(language, lab.summary)}</p>
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-7 text-white/65">
                {pick(language, lab.why)}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {lab.badges.map((badge) => (
                  <span key={`${lab.id}-${badge}`} className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                    {badge}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-4 lg:h-[calc(100dvh-10.5rem)]">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          {XEVENT_LABS.map((lab) => {
            const isActive = lab.id === activeLab.id;
            return (
              <button
                key={lab.id}
                onClick={() => setActiveLabId(lab.id)}
                className={cn(
                  'flex w-full items-center justify-start gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all sm:w-auto',
                  isActive ? 'border border-white/20 bg-white/10 text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                )}
              >
                <Radar className={cn('h-4 w-4', isActive ? 'text-orange-300' : 'text-muted-foreground')} />
                {pick(language, lab.title)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setActiveStage(0);
              setAutoPlay(false);
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
            {language === 'es' ? 'Reset' : 'Reset'}
          </button>
          <button
            onClick={() => setAutoPlay((current) => !current)}
            className={cn('rounded-xl border px-3 py-2 text-xs font-bold transition-all', autoPlay ? 'border-orange-500/30 bg-orange-500/15 text-orange-300' : 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300')}
          >
            {autoPlay ? <Pause className="mr-1 inline h-3.5 w-3.5" /> : <Play className="mr-1 inline h-3.5 w-3.5" />}
            {autoPlay ? (language === 'es' ? 'Pausar' : 'Pause') : language === 'es' ? 'Auto Play' : 'Auto Play'}
          </button>
          <button
            onClick={() => setViewMode('intro')}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
          >
            {language === 'es' ? 'Descripción' : 'Description'}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="glass-panel min-h-0 overflow-hidden rounded-3xl border border-white/10 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                {activeLab.badges.map((badge) => (
                  <span key={`${activeLab.id}-play-${badge}`} className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                    {badge}
                  </span>
                ))}
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">{pick(language, activeLab.title)}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/80">{pick(language, activeLab.summary)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
                {language === 'es' ? 'Evidencia cerrada' : 'Evidence captured'}
              </div>
              <div className="mt-1 text-2xl font-black text-white">{evidenceScore}%</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-4">
            {STAGES.map((stage, index) => {
              const isActive = index === activeStage;
              const isPast = index < activeStage;
              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    setAutoPlay(false);
                    setActiveStage(index);
                  }}
                  className={cn('rounded-2xl border p-4 text-left transition-all', isActive ? stage.tone : isPast ? 'border-white/20 bg-white/[0.06] text-white/80' : 'border-white/10 bg-black/20 text-white/55')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{stage.badge}</span>
                    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]', isActive ? stage.chip : 'border-white/10 bg-black/20 text-white/45')}>
                      {isActive ? (language === 'es' ? 'ahora' : 'now') : isPast ? 'ok' : language === 'es' ? 'ir' : 'go'}
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-black">{pick(language, stage.title)}</div>
                  <p className="mt-2 text-xs leading-6">{pick(language, stage.detail)}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
            <div className="flex min-h-0 flex-col gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                  <Activity className="h-4 w-4 text-cyan-300" />
                  {language === 'es' ? 'Lo que entra al motor' : 'What enters the engine'}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/85">{pick(language, snapshot.incoming)}</p>
              </div>

              <div className="min-h-0 rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                    {language === 'es' ? 'Stream de eventos' : 'Event stream'}
                  </div>
                  <div className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]', stream[activeStage]?.tone ?? STAGES[0].chip)}>
                    {stream[activeStage]?.time ?? stream[0].time}
                  </div>
                </div>
                <div className="mt-4 flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
                  <AnimatePresence mode="popLayout">
                    {visibleRows.map((row, index) => (
                      <motion.div
                        key={`${activeLab.id}-${row.time}-${index}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        className={cn('rounded-2xl border p-4', row.tone)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-black text-white">{pick(language, row.label)}</div>
                          <div className="font-mono text-[11px] text-white/60">{row.time}</div>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/75">{pick(language, row.detail)}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-4">
              <div className={cn('rounded-3xl border p-5', currentStage.tone)}>
                <div className="text-[11px] font-black uppercase tracking-[0.22em]">
                  {language === 'es' ? 'Evidencia visible ahora' : 'Visible evidence now'}
                </div>
                <h4 className="mt-2 text-xl font-black text-white">{pick(language, currentStage.title)}</h4>
                <p className="mt-3 text-sm leading-7 text-white/85">{pick(language, snapshot.evidence)}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                  {activeStage < 2 ? <AlertTriangle className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                  {activeStage < 2 ? (language === 'es' ? 'Script de captura' : 'Capture script') : language === 'es' ? 'Script de lectura' : 'Readback script'}
                </div>
                <div className="mt-4">
                  <CopyCodeBlock
                    code={pick(language, activeStage < 2 ? activeLab.sessionScript : activeLab.readbackScript)}
                    accent={activeStage < 2 ? 'amber' : 'blue'}
                    contentClassName="max-h-[240px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel min-h-0 overflow-hidden rounded-3xl border border-white/10 p-4 sm:p-5">
          <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
            <DBAActionBoard
              language={language}
              accent={activeStage === 0 ? 'amber' : activeStage === 1 ? 'cyan' : activeStage === 2 ? 'rose' : 'emerald'}
              title={{ en: 'What the DBA does now', es: 'Qué hace ahora el DBA' }}
              focus={snapshot.focus}
              actions={snapshot.actions}
              caution={snapshot.caution}
            />

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                {language === 'es' ? 'Cuándo usar este lab' : 'When to use this lab'}
              </div>
              <p className="mt-3 text-sm leading-7 text-white/75">{pick(language, activeLab.why)}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                {language === 'es' ? 'Checklist de salida' : 'Exit checklist'}
              </div>
              <div className="mt-3 space-y-3">
                {[
                  language === 'es' ? 'Evento exacto que dio la evidencia' : 'Exact event that produced the evidence',
                  language === 'es' ? 'SQL, llamador y ventana temporal aislados' : 'SQL, caller and time window isolated',
                  language === 'es' ? 'Siguiente acción operativa definida' : 'Next operational step defined',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-7 text-white/75">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
