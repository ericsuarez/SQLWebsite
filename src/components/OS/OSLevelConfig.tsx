import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Cpu,
  HardDrive,
  Info,
  Layers,
  Network,
  Server,
  Shield,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { OS_CONFIG_ITEMS } from '../../data/advancedSQLData';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';
import { IfiLab } from './labs/IfiLab';
import { LpimLab } from './labs/LpimLab';

const ICONS: Record<string, any> = {
  HardDrive,
  Server,
  Layers,
  Zap,
  Network,
  Shield,
  Cpu,
};

type CategoryId = 'virtualization' | 'network' | 'policy' | 'power';

const CATEGORY_SUMMARY: Record<CategoryId, { es: string; en: string }> = {
  virtualization: {
    es: 'Controladores, layout de disco y tamano de transferencia antes de llegar a SQL Server.',
    en: 'Controllers, disk layout and transfer size before the request even reaches SQL Server.',
  },
  network: {
    es: 'Distribucion de interrupciones y colas de red para evitar cuellos de CPU 0.',
    en: 'Interrupt distribution and network queues to avoid CPU 0 bottlenecks.',
  },
  policy: {
    es: 'Politicas de seguridad del sistema que cambian como SQL reserva memoria y archivos.',
    en: 'Security policies that change how SQL reserves memory and files.',
  },
  power: {
    es: 'Frecuencia efectiva de CPU y comportamiento del host bajo carga sostenida.',
    en: 'Effective CPU frequency and host behavior under sustained load.',
  },
};

const PLAYBOOK: Record<
  string,
  {
    script: string;
    checks: { es: string; en: string }[];
    failure: { es: string; en: string }[];
  }
> = {
  queueDepth: {
    script: `-- SQL: detecta latencia anomala por archivo
SELECT DB_NAME(database_id) AS db_name,
       file_id,
       io_stall_read_ms,
       io_stall_write_ms,
       num_of_reads,
       num_of_writes
FROM sys.dm_io_virtual_file_stats(NULL, NULL)
ORDER BY io_stall_write_ms DESC;`,
    checks: [
      { es: 'Comprueba queue depth del HBA, PVSCSI o controlador virtual.', en: 'Check HBA, PVSCSI or virtual controller queue depth.' },
      { es: 'Relaciona WRITELOG y PAGEIOLATCH con la ruta de almacenamiento.', en: 'Relate WRITELOG and PAGEIOLATCH waits to the storage path.' },
      { es: 'Si la cabina es rapida pero la cola es corta, el cuello esta antes del disco.', en: 'If the array is fast but the queue is short, the bottleneck is before the disk.' },
    ],
    failure: [
      { es: 'La query pide I/O', en: 'The query asks for I/O' },
      { es: 'El controlador no acepta suficientes requests simultaneas', en: 'The controller cannot accept enough simultaneous requests' },
      { es: 'SQL acumula waits aun con discos rapidos', en: 'SQL piles up waits even with fast disks' },
    ],
  },
  ntfsAlloc: {
    script: `fsutil fsinfo ntfsinfo D:
-- Verifica "Bytes Per Cluster" = 65536`,
    checks: [
      { es: '64 KB alinea mejor con extents de SQL Server.', en: '64 KB aligns better with SQL Server extents.' },
      { es: '4 KB multiplica trabajo del sistema de archivos.', en: '4 KB multiplies filesystem work.' },
      { es: 'Revisalo antes de mover MDF, NDF y TempDB.', en: 'Review it before placing MDF, NDF and TempDB.' },
    ],
    failure: [
      { es: 'Mas metadatos por extent', en: 'More metadata work per extent' },
      { es: 'Mayor latencia aleatoria', en: 'Higher random latency' },
      { es: 'Mas fragmentacion del volumen', en: 'More volume fragmentation' },
    ],
  },
  pvscsi: {
    script: `-- VMware / Hypervisor
esxtop
-- Revisar CPU Ready, cola de controlador y latencia del adaptador`,
    checks: [
      { es: 'Evita emulacion pesada en VMs de alto I/O.', en: 'Avoids heavy emulation on high-I/O VMs.' },
      { es: 'Se nota sobre todo en TempDB, LDF y backups.', en: 'Most visible on TempDB, LDF and backups.' },
      { es: 'Separar OS, data y log sigue siendo necesario.', en: 'Separating OS, data and log still matters.' },
    ],
    failure: [
      { es: 'Mas CPU Ready y menos throughput real', en: 'More CPU Ready and less real throughput' },
      { es: 'Mayor latencia por capa de virtualizacion', en: 'Higher latency in the virtualization layer' },
      { es: 'SQL parece lento sin que la DMV explique todo', en: 'SQL looks slow and DMVs do not explain everything' },
    ],
  },
  scatterGather: {
    script: `Get-NetAdapterAdvancedProperty -Name "*"
| Where-Object { $_.DisplayName -match 'Scatter|Gather' }`,
    checks: [
      { es: 'Importa cuando el host mueve muchos buffers a disco.', en: 'Important when the host moves many buffers to disk.' },
      { es: 'Reduce CPU para I/O compuesto.', en: 'Reduces CPU cost for composite I/O.' },
      { es: 'Si esta desactivado, la CPU hace mas trabajo por request.', en: 'If disabled, CPU does more work per request.' },
    ],
    failure: [
      { es: 'Mas CPU por cada I/O', en: 'More CPU per I/O' },
      { es: 'Menor throughput en cargas pesadas', en: 'Lower throughput under heavy load' },
      { es: 'TempDB y backups tardan mas', en: 'TempDB and backups take longer' },
    ],
  },
  maxTransferSize: {
    script: `BACKUP DATABASE SalesDB
TO DISK = 'X:\\Backups\\SalesDB.bak'
WITH COMPRESSION,
     MAXTRANSFERSIZE = 2097152,
     BUFFERCOUNT = 64;`,
    checks: [
      { es: 'Tiene impacto directo en backup y restore.', en: 'Directly affects backup and restore.' },
      { es: 'Conviene validar contra el destino y el driver.', en: 'Validate it against the destination and the driver.' },
      { es: 'Un valor bajo desperdicia ancho de banda disponible.', en: 'A low value wastes available bandwidth.' },
    ],
    failure: [
      { es: 'Backups lentos aun con disco rapido', en: 'Slow backups even with fast storage' },
      { es: 'Restore excesivamente largo', en: 'Restore takes too long' },
      { es: 'CPU infrautilizada mientras espera I/O', en: 'CPU stays underused while waiting for I/O' },
    ],
  },
  rss: {
    script: `Get-NetAdapterRss
Set-NetAdapterRss -Name "Ethernet" -Enabled $true`,
    checks: [
      { es: 'Distribuye interrupciones de red entre varios cores.', en: 'Distributes network interrupts across multiple cores.' },
      { es: 'Evita saturar CPU 0 con TDS, backups y AGs.', en: 'Avoids saturating CPU 0 with TDS, backups and AG traffic.' },
      { es: 'Importante en NICs de 10 GbE o mas.', en: 'Important on 10 GbE or faster NICs.' },
    ],
    failure: [
      { es: 'CPU 0 al 100%', en: 'CPU 0 pinned at 100%' },
      { es: 'Cola de red creciente', en: 'Network queue keeps growing' },
      { es: 'Respuesta irregular del servidor', en: 'Server response becomes erratic' },
    ],
  },
  vmq: {
    script: `Get-NetAdapterVmq
Set-NetAdapterVmq -Name "Ethernet" -Enabled $true`,
    checks: [
      { es: 'Especialmente util en entornos virtualizados con trafico intenso.', en: 'Especially useful in virtualized environments with heavy traffic.' },
      { es: 'Reduce trabajo del host en la vSwitch.', en: 'Reduces host work in the vSwitch.' },
      { es: 'Debe validarse con la version del driver.', en: 'Must be validated against the driver version.' },
    ],
    failure: [
      { es: 'Latencia de red inestable', en: 'Unstable network latency' },
      { es: 'Paquetes descartados', en: 'Dropped packets' },
      { es: 'Mas CPU en el host que en SQL', en: 'More CPU on the host than in SQL' },
    ],
  },
  lpim: {
    script: `SELECT sql_memory_model_desc,
       committed_kb / 1024 AS committed_mb,
       committed_target_kb / 1024 AS target_mb
FROM sys.dm_os_sys_info;

DBCC MEMORYSTATUS;`,
    checks: [
      { es: 'Evita que Windows pagine el Buffer Pool.', en: 'Prevents Windows from paging out the Buffer Pool.' },
      { es: 'No sustituye a configurar bien max server memory.', en: 'Does not replace proper max server memory sizing.' },
      { es: 'Combinalo con reserva de RAM sana para el OS.', en: 'Combine it with healthy RAM reservation for the OS.' },
    ],
    failure: [
      { es: 'PLE se desploma', en: 'PLE collapses' },
      { es: 'Disco ocupado paginando memoria', en: 'Disk gets busy paging memory' },
      { es: 'El servidor parece caerse por escalones', en: 'The server falls off a performance cliff' },
    ],
  },
  ifi: {
    script: `SELECT servicename,
       instant_file_initialization_enabled
FROM sys.dm_server_services;`,
    checks: [
      { es: 'Acelera crecimiento de archivos de datos, no del log.', en: 'Speeds up data file growth, not log growth.' },
      { es: 'Clave en restores, CREATE DATABASE y autogrowth de MDF/NDF.', en: 'Key for restores, CREATE DATABASE and MDF/NDF autogrowth.' },
      { es: 'El LDF sigue inicializandose con ceros.', en: 'The LDF still has to be zero initialized.' },
    ],
    failure: [
      { es: 'Restore y CREATE DATABASE muy lentos', en: 'Restore and CREATE DATABASE become very slow' },
      { es: 'Autogrowth visible para la aplicacion', en: 'Autogrowth becomes visible to the application' },
      { es: 'Ventanas de mantenimiento mas largas', en: 'Maintenance windows get longer' },
    ],
  },
  bypassTraverse: {
    script: `whoami /priv
icacls D:\\SQLData`,
    checks: [
      { es: 'Importa cuando la ruta de datos tiene varias carpetas.', en: 'Matters when data paths go through deep folder trees.' },
      { es: 'El servicio puede tener NTFS y aun asi fallar por politica.', en: 'The service can have NTFS rights and still fail because of policy.' },
      { es: 'Revisalo si aparecen Access Denied al arrancar.', en: 'Review it if startup shows Access Denied.' },
    ],
    failure: [
      { es: 'El servicio no arranca', en: 'The service does not start' },
      { es: 'Attach Database falla', en: 'Attach Database fails' },
      { es: 'Acceso denegado aunque el archivo exista', en: 'Access denied even though the file exists' },
    ],
  },
  powerPlan: {
    script: `powercfg /L
powercfg /S SCHEME_MIN`,
    checks: [
      { es: 'Balanced baja frecuencia y castiga CPU-bound workloads.', en: 'Balanced lowers frequency and hurts CPU-bound workloads.' },
      { es: 'Muy visible en OLTP con mucha compilacion y waits SOS.', en: 'Very visible on OLTP with lots of compilation and SOS waits.' },
      { es: 'Se ve como CPU lenta, no siempre como CPU alta.', en: 'It looks like a slow CPU, not always a busy CPU.' },
    ],
    failure: [
      { es: 'Todas las consultas tardan mas', en: 'All queries take longer' },
      { es: 'El host nunca alcanza turbo sostenido', en: 'The host never reaches sustained turbo frequency' },
      { es: 'Parece un problema de SQL cuando es del host', en: 'It looks like a SQL issue but it is a host issue' },
    ],
  },
};

function formatValue(value: number | boolean | string, unit?: string) {
  if (typeof value === 'boolean') {
    return value ? 'ON' : 'OFF';
  }

  return `${value}${unit ? ` ${unit}` : ''}`;
}

export function OSLevelConfig() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<CategoryId>('virtualization');
  const [activeItemId, setActiveItemId] = useState(OS_CONFIG_ITEMS[0]?.id ?? '');

  const activeItems = OS_CONFIG_ITEMS.filter((item) => item.category === activeTab);

  useEffect(() => {
    setActiveItemId(activeItems[0]?.id ?? '');
  }, [activeTab]);

  const activeItem = activeItems.find((item) => item.id === activeItemId) ?? activeItems[0];
  const playbook = PLAYBOOK[activeItem.id];

  return (
    <div className="flex min-h-full flex-col gap-4 text-slate-200 sm:gap-6">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="mb-2 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
              {t('tabOsConfig')}
            </h2>
            <p className="max-w-5xl text-sm text-muted-foreground">{t('osConfigMainDesc')}</p>
          </div>
          <Server className="h-12 w-12 text-indigo-500/30" />
        </div>

        <div className="relative z-10 mt-6 flex flex-wrap gap-2">
          {([
            { id: 'virtualization', icon: Server, labelKey: 'catVirtualization', color: 'text-blue-400' },
            { id: 'network', icon: Network, labelKey: 'catNetwork', color: 'text-emerald-400' },
            { id: 'policy', icon: Shield, labelKey: 'catPolicy', color: 'text-rose-400' },
            { id: 'power', icon: Cpu, labelKey: 'catPower', color: 'text-amber-400' },
          ] as const).map((category) => {
            const Icon = category.icon;
            const isActive = category.id === activeTab;

            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition-all',
                  isActive
                    ? 'border-white/20 bg-white/10 text-white shadow-glow'
                    : 'border-white/10 bg-black/20 text-muted-foreground hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? category.color : 'text-white/40')} />
                {t(category.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="glass-panel flex min-h-0 flex-col gap-4 rounded-3xl border border-white/10 p-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
              {language === 'es' ? 'Vista de categoria' : 'Category overview'}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {language === 'es' ? CATEGORY_SUMMARY[activeTab].es : CATEGORY_SUMMARY[activeTab].en}
            </p>
          </div>

          <div className="overflow-y-auto pr-1">
            <div className="grid gap-3">
              {activeItems.map((item, index) => {
                const ItemIcon = ICONS[item.icon] || Info;
                const isActive = item.id === activeItem.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveItemId(item.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'rounded-2xl border p-4 text-left transition-all',
                      isActive
                        ? 'border-indigo-500/40 bg-indigo-500/10 shadow-[0_0_24px_rgba(99,102,241,0.16)]'
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('mt-0.5 rounded-2xl border p-2', isActive ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' : 'border-white/10 bg-white/5 text-white/40')}>
                        <ItemIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white">{t(item.titleKey)}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {language === 'es' ? 'Objetivo:' : 'Target:'} {formatValue(item.recommendedValue, item.unit)}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="grid min-h-0 gap-6 xl:grid-cols-[minmax(0,1.12fr)_360px]">
          <div className="glass-panel overflow-y-auto rounded-3xl border border-white/10 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{t(activeItem.titleKey)}</h3>
                <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
                  {t(activeItem.descKey)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                  {language === 'es' ? 'Valor habitual' : 'Typical value'}
                </p>
                <div className="mt-3 min-h-[2.6rem] text-xl font-black leading-tight text-white/70 sm:text-2xl break-words">
                  {formatValue(activeItem.defaultValue, activeItem.unit)}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                  {language === 'es' ? 'Objetivo' : 'Target'}
                </p>
                <div className="mt-3 min-h-[2.6rem] text-xl font-black leading-tight text-emerald-300 sm:text-2xl break-words">
                  {formatValue(activeItem.recommendedValue, activeItem.unit)}
                </div>
              </div>

              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-300">
                  {language === 'es' ? 'Zona peligrosa' : 'Danger zone'}
                </p>
                <div className="mt-3 min-h-[2.3rem] text-base font-black leading-tight text-rose-300 sm:text-lg break-words">
                  {activeItem.dangerZone ?? (language === 'es' ? 'Depende del host' : 'Depends on the host')}
                </div>
              </div>
            </div>

            {activeItem.id === 'ifi' && (
              <div className="mt-6">
                <IfiLab />
              </div>
            )}

            {activeItem.id === 'lpim' && (
              <div className="mt-6">
                <LpimLab />
              </div>
            )}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  {language === 'es' ? 'Checklist rapido' : 'Quick checklist'}
                </p>
                <div className="space-y-3">
                  {playbook.checks.map((check) => (
                    <div key={check.es} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <p className="text-sm text-white/75">{language === 'es' ? check.es : check.en}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  {language === 'es' ? 'Patron de fallo' : 'Failure pattern'}
                </p>
                <div className="space-y-3">
                  {playbook.failure.map((step, index) => (
                    <div key={step.es} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[10px] font-black text-indigo-300">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white/75">{language === 'es' ? step.es : step.en}</p>
                        {index < playbook.failure.length - 1 && (
                          <div className="ml-2 mt-3 h-5 w-px bg-gradient-to-b from-indigo-400/50 to-transparent" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                {language === 'es' ? 'Comando o consulta de verificacion' : 'Verification command or query'}
              </p>
              <CopyCodeBlock code={playbook.script} accent="blue" />
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-6">
            <div className="glass-panel rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-300">
                {t('impactWhenMisconfigured')}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-rose-200/90">{t(activeItem.impactKey)}</p>
            </div>

            <div className="glass-panel rounded-3xl border border-white/10 bg-black/30 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                {language === 'es' ? 'Lectura recomendada' : 'Recommended read'}
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-sm font-bold text-white">
                    {language === 'es' ? 'Diagnostica primero el host' : 'Diagnose the host first'}
                  </div>
                  <p className="mt-1 text-sm text-white/65">
                    {language === 'es'
                      ? 'Si aqui esta mal, las DMVs de SQL solo muestran el sintoma.'
                      : 'If this layer is wrong, SQL DMVs only show the symptom.'}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {language === 'es' ? 'Cruza waits con infraestructura' : 'Cross waits with infrastructure'}
                  </div>
                  <p className="mt-1 text-sm text-white/65">
                    {language === 'es'
                      ? 'WRITELOG, PAGEIOLATCH o CPU Ready rara vez se entienden mirando una sola capa.'
                      : 'WRITELOG, PAGEIOLATCH or CPU Ready are rarely understood by looking at just one layer.'}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {language === 'es' ? 'Deja constancia del valor objetivo' : 'Record the target value'}
                  </div>
                  <p className="mt-1 text-sm text-white/65">
                    {language === 'es'
                      ? 'Mantener una baseline evita volver a descubrir el mismo problema.'
                      : 'Keeping a baseline prevents rediscovering the same issue again.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
