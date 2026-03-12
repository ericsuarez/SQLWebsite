export interface LocalizedText {
  en: string;
  es: string;
}

export interface SystemDatabaseAction {
  id: 'server-config' | 'new-database' | 'jobs-and-history' | 'workspace-spill';
  target: 'master' | 'model' | 'msdb' | 'tempdb';
  label: LocalizedText;
  detail: LocalizedText;
}

export interface SystemDatabaseGuide {
  id: 'master' | 'model' | 'msdb' | 'tempdb';
  name: 'master' | 'model' | 'msdb' | 'tempdb';
  accent: 'rose' | 'blue' | 'violet' | 'amber';
  headline: LocalizedText;
  summary: LocalizedText;
  bestFor: LocalizedText[];
  avoid: LocalizedText[];
  workflow: LocalizedText;
  note?: LocalizedText;
  badges: string[];
  script: string;
}

export const SYSTEM_DATABASE_ACTIONS: SystemDatabaseAction[] = [
  {
    id: 'server-config',
    target: 'master',
    label: {
      en: 'Create login / change instance config',
      es: 'Crear login / cambiar configuración',
    },
    detail: {
      en: 'Server-level metadata lives in master, so logins, linked servers, endpoints and global settings land here first.',
      es: 'La metadata a nivel instancia vive en master, así que logins, linked servers, endpoints y settings globales aterrizan aquí.',
    },
  },
  {
    id: 'new-database',
    target: 'model',
    label: {
      en: 'Create a new database',
      es: 'Crear una base nueva',
    },
    detail: {
      en: 'New databases inherit defaults from model. TempDB is also recreated from model on startup.',
      es: 'Las bases nuevas heredan valores por defecto desde model. TempDB también se recrea desde model al arrancar.',
    },
  },
  {
    id: 'jobs-and-history',
    target: 'msdb',
    label: {
      en: 'Run Agent jobs / inspect backups',
      es: 'Lanzar jobs / revisar backups',
    },
    detail: {
      en: 'Jobs, alerts, operators, Database Mail and backup history are tracked in msdb.',
      es: 'Jobs, alertas, operadores, Database Mail y el historial de backups se registran en msdb.',
    },
  },
  {
    id: 'workspace-spill',
    target: 'tempdb',
    label: {
      en: 'Sort, hash or temp table spill',
      es: 'Sort, hash o temp table spill',
    },
    detail: {
      en: 'Workspace activity and row versioning spill into TempDB. Keep it sized and isolated, but learn the internals in the dedicated TempDB module.',
      es: 'La actividad de workspace y row versioning cae en TempDB. Hay que dimensionarlo bien, pero los internals están en el módulo dedicado de TempDB.',
    },
  },
];

export const SYSTEM_DATABASE_GUIDES: SystemDatabaseGuide[] = [
  {
    id: 'master',
    name: 'master',
    accent: 'rose',
    headline: {
      en: 'The control plane of the instance',
      es: 'El plano de control de la instancia',
    },
    summary: {
      en: 'master is the database SQL Server needs first. It holds instance metadata, server principals, endpoints, linked servers and the map of every database file known to the instance.',
      es: 'master es la base que SQL Server necesita primero. Guarda metadata de instancia, principals del servidor, endpoints, linked servers y el mapa de todos los ficheros conocidos por la instancia.',
    },
    bestFor: [
      {
        en: 'Back it up after login, endpoint, linked server or configuration changes.',
        es: 'Haz backup tras cambios de logins, endpoints, linked servers o configuración.',
      },
      {
        en: 'Use it to inventory databases, file locations and instance-level security.',
        es: 'Usala para inventariar bases, rutas de ficheros y seguridad a nivel instancia.',
      },
      {
        en: 'Keep it small and boring: predictable is better than clever here.',
        es: 'Mantenla pequeña y aburrida: aquí lo predecible vale más que lo ingenioso.',
      },
    ],
    avoid: [
      {
        en: 'Do not create user tables or application data here.',
        es: 'No metas tablas de usuario ni datos de aplicación aquí.',
      },
      {
        en: 'Do not restore master casually; build number and startup sequence matter.',
        es: 'No restaures master a la ligera; importan la build y la secuencia de arranque.',
      },
    ],
    workflow: {
      en: 'If the instance must remember it before any user database opens, master is usually involved.',
      es: 'Si la instancia debe recordarlo antes de abrir cualquier base de usuario, normalmente interviene master.',
    },
    badges: ['Instance metadata', 'Logins', 'Linked Servers', 'Startup critical'],
    script: `SELECT name, create_date, compatibility_level, state_desc
FROM sys.databases
ORDER BY database_id;

SELECT name, type_desc, is_disabled
FROM sys.server_principals
WHERE type IN ('S', 'U', 'G')
ORDER BY name;

BACKUP DATABASE master
TO DISK = N'E:\\SQLBackups\\master_full.bak'
WITH INIT, COMPRESSION, CHECKSUM, STATS = 5;`,
  },
  {
    id: 'model',
    name: 'model',
    accent: 'blue',
    headline: {
      en: 'The template that silently shapes new databases',
      es: 'La plantilla que moldea en silencio las bases nuevas',
    },
    summary: {
      en: 'model is copied when SQL Server creates a new database, and TempDB also uses it during startup. Any default left here can multiply across the estate.',
      es: 'model se copia cuando SQL Server crea una base nueva, y TempDB también la usa durante el arranque. Cualquier valor por defecto aquí se multiplica por todo el entorno.',
    },
    bestFor: [
      {
        en: 'Set sane file growth and disable options like AUTO_CLOSE or AUTO_SHRINK.',
        es: 'Deja filegrowth razonable y desactiva opciones como AUTO_CLOSE o AUTO_SHRINK.',
      },
      {
        en: 'Use it only for lightweight defaults that every new database should inherit.',
        es: 'Usala solo para defaults ligeros que deban heredar todas las bases nuevas.',
      },
      {
        en: 'Review model before standardizing deployment templates across teams.',
        es: 'Revisa model antes de estandarizar plantillas de despliegue entre equipos.',
      },
    ],
    avoid: [
      {
        en: 'Do not bloat it with big objects, test tables or heavy seed data.',
        es: 'No la infles con objetos grandes, tablas de prueba o seed data pesada.',
      },
      {
        en: 'Do not hide one-off app requirements in model; encode them in deployment scripts instead.',
        es: 'No escondas requisitos puntuales de una app en model; dejalos en los scripts de despliegue.',
      },
    ],
    workflow: {
      en: 'Touch model only when the default should apply again and again to future databases, not to solve a one-time deployment shortcut.',
      es: 'Toca model solo cuando el valor por defecto deba aplicarse una y otra vez a futuras bases, no para ahorrar un despliegue puntual.',
    },
    badges: ['Template DB', 'New database defaults', 'TempDB bootstrap', 'Filegrowth policy'],
    script: `SELECT name,
       recovery_model_desc,
       page_verify_option_desc,
       is_auto_close_on,
       is_auto_shrink_on
FROM sys.databases
WHERE name = N'model';

ALTER DATABASE model
MODIFY FILE (NAME = modeldev, SIZE = 256MB, FILEGROWTH = 64MB);
GO
ALTER DATABASE model SET AUTO_CLOSE OFF;
GO
ALTER DATABASE model SET AUTO_SHRINK OFF;`,
  },
  {
    id: 'msdb',
    name: 'msdb',
    accent: 'violet',
    headline: {
      en: 'The operations diary for SQL Server Agent and backups',
      es: 'El diario operativo de SQL Server Agent y los backups',
    },
    summary: {
      en: 'msdb tracks jobs, schedules, operators, Database Mail, backup history and several automation features. If a DBA asks what ran, when it failed or what backup exists, msdb is often the answer.',
      es: 'msdb registra jobs, schedules, operadores, Database Mail, historial de backups y varias piezas de automatización. Si un DBA pregunta qué corrió, cuándo falló o qué backup existe, muchas veces la respuesta está en msdb.',
    },
    bestFor: [
      {
        en: 'Query backup history before any restore or DR drill.',
        es: 'Consulta el historial de backups antes de cualquier restore o simulacro de DR.',
      },
      {
        en: 'Use it to audit SQL Agent jobs, schedules, alerts and operators.',
        es: 'Usala para auditar jobs, schedules, alertas y operadores de SQL Server Agent.',
      },
      {
        en: 'Purge old backup and job history so msdb does not grow without control.',
        es: 'Purga histórico viejo de backups y jobs para que msdb no crezca sin control.',
      },
    ],
    avoid: [
      {
        en: 'Do not let backup history grow forever; restore reporting will get noisy and slower.',
        es: 'No dejes el historial de backups crecer para siempre; los reportes y consultas empeoran.',
      },
      {
        en: 'Do not turn msdb into a custom application database just because it already exists.',
        es: 'No conviertas msdb en una base de aplicación solo porque ya existe.',
      },
    ],
    workflow: {
      en: 'When automation, notifications or historical evidence matter, inspect msdb before guessing.',
      es: 'Cuando importan la automatización, las notificaciones o la evidencia histórica, mira msdb antes de adivinar.',
    },
    badges: ['SQL Agent', 'Backup history', 'Database Mail', 'Operators'],
    script: `EXEC msdb.dbo.sp_help_job;

SELECT TOP (20)
       database_name,
       backup_finish_date,
       CASE type
         WHEN 'D' THEN 'FULL'
         WHEN 'I' THEN 'DIFF'
         WHEN 'L' THEN 'LOG'
         ELSE type
       END AS backup_type,
       backup_size / 1024.0 / 1024.0 AS backup_size_mb
FROM msdb.dbo.backupset
ORDER BY backup_finish_date DESC;

EXEC msdb.dbo.sp_delete_backuphistory
     @oldest_date = DATEADD(day, -30, GETDATE());`,
  },
  {
    id: 'tempdb',
    name: 'tempdb',
    accent: 'amber',
    headline: {
      en: 'Shared workspace, not a place to live permanently',
      es: 'Workspace compartido, no un sitio para vivir',
    },
    summary: {
      en: 'TempDB serves temp tables, worktables, spills and row versioning for the whole instance. It is recreated on startup, so treat it like fast shared scratch space, not durable storage.',
      es: 'TempDB sirve temp tables, worktables, spills y row versioning para toda la instancia. Se recrea al arrancar, así que trátala como scratch space rápido compartido, no como almacenamiento duradero.',
    },
    bestFor: [
      {
        en: 'Pre-size files, keep equal growth settings and monitor version store pressure.',
        es: 'Pre-dimensiona los ficheros, deja growth uniforme y vigila la presión del version store.',
      },
      {
        en: 'Use it for temp objects and workspace needs, not for data you must keep.',
        es: 'Usala para objetos temporales y workspace, no para datos que debas conservar.',
      },
      {
        en: 'Send people to the dedicated TempDB module for allocation map internals and latch contention.',
        es: 'Manda al módulo dedicado de TempDB cuando quieras ver allocation maps e internals de contención.',
      },
    ],
    avoid: [
      {
        en: 'Do not rely on TempDB for durable objects or deployment state.',
        es: 'No dependas de TempDB para objetos duraderos ni para estado de despliegue.',
      },
      {
        en: 'Do not leave it at tiny autogrowth defaults on a busy server.',
        es: 'No la dejes con autogrowth diminuto en un servidor con carga.',
      },
    ],
    workflow: {
      en: 'Keep this section operational and let the low-level latch story live only once in the dedicated TempDB and I/O module.',
      es: 'Mantengo esta vista operativa y dejo la historia de latches e internals una sola vez en el módulo dedicado de TempDB e I/O.',
    },
    note: {
      en: 'Deep dive note: PFS, GAM, SGAM, PAGELATCH_UP and file-count guidance already live in TempDB & Advanced I/O to avoid duplication here.',
      es: 'Nota: PFS, GAM, SGAM, PAGELATCH_UP y la guía de número de ficheros ya viven en TempDB & Advanced I/O para no duplicarlos aquí.',
    },
    badges: ['Workspace', 'Version store', 'Spills', 'Recreated on startup'],
    script: `SELECT name,
       size / 128.0 AS size_mb,
       FILEPROPERTY(name, 'SpaceUsed') / 128.0 AS used_mb,
       growth / 128.0 AS growth_mb
FROM tempdb.sys.database_files;

SELECT SUM(version_store_reserved_page_count) * 8.0 / 1024 AS version_store_mb,
       SUM(user_object_reserved_page_count) * 8.0 / 1024 AS user_objects_mb,
       SUM(internal_object_reserved_page_count) * 8.0 / 1024 AS internal_objects_mb
FROM sys.dm_db_file_space_usage;`,
  },
];

export interface DisasterRecoveryStep {
  id: string;
  title: LocalizedText;
  detail: LocalizedText;
  hint: LocalizedText;
}

export interface DisasterRecoveryScenario {
  id: 'pitr' | 'corruption' | 'ag-failover';
  title: LocalizedText;
  headline: LocalizedText;
  summary: LocalizedText;
  preferredPath: LocalizedText;
  firstMove: LocalizedText;
  trap: LocalizedText;
  rpo: string;
  rto: string;
  badges: string[];
  steps: DisasterRecoveryStep[];
  diagnosticScript: string;
  recoveryScript: string;
  validationScript: string;
}

export const DR_GOLDEN_RULES: LocalizedText[] = [
  {
    en: 'Freeze writes first. A calm system is easier to recover than an active one.',
    es: 'Primero congela escrituras. Un sistema quieto se recupera mejor que uno en movimiento.',
  },
  {
    en: 'If the log is still reachable, try to capture the tail before destructive work.',
    es: 'Si el log sigue accesible, intenta capturar el tail antes de hacer nada destructivo.',
  },
  {
    en: 'For logical mistakes, restore to a side database first and compare before replacing production.',
    es: 'Ante errores lógicos, restaura primero a una base lateral y compara antes de tocar producción.',
  },
  {
    en: 'Validate with DBCC CHECKDB, application smoke tests and backup chain evidence before reopening traffic.',
    es: 'Valida con DBCC CHECKDB, smoke tests de la aplicación y evidencia de la cadena de backup antes de reabrir tráfico.',
  },
];

export const DISASTER_RECOVERY_SCENARIOS: DisasterRecoveryScenario[] = [
  {
    id: 'pitr',
    title: {
      en: 'Accidental delete / point in time',
      es: 'Borrado accidental / point in time',
    },
    headline: {
      en: 'Recover to the exact minute without replaying the bad change',
      es: 'Recupera hasta el minuto exacto sin volver a aplicar el cambio malo',
    },
    summary: {
      en: 'Use the backup chain plus the tail of the log to restore up to a safe timestamp, ideally into a side database first.',
      es: 'Usa la cadena de backups mas el tail del log para restaurar hasta un instante seguro, idealmente en una base lateral primero.',
    },
    preferredPath: {
      en: 'Full + Diff + Log chain with STOPAT',
      es: 'Cadena Full + Diff + Log con STOPAT',
    },
    firstMove: {
      en: 'Stop application writes and identify the last good timestamp.',
      es: 'Para las escrituras de la aplicación e identifica el último instante sano.',
    },
    trap: {
      en: 'Do not overwrite production immediately if you can restore to a side database and compare first.',
      es: 'No pises producción de inmediato si puedes restaurar a una base lateral y comparar primero.',
    },
    rpo: 'Seconds to minutes',
    rto: 'Minutes to controlled restore',
    badges: ['STOPAT', 'Tail-log backup', 'Backup chain', 'Side restore'],
    steps: [
      {
        id: 'freeze',
        title: {
          en: 'Freeze the blast radius',
          es: 'Congela el radio del daño',
        },
        detail: {
          en: 'Stop jobs, disable application writes and capture the exact time or transaction window where the data was still valid.',
          es: 'Detén jobs, desactiva escrituras de la aplicación y captura la hora exacta o la ventana en la que los datos aún eran válidos.',
        },
        hint: {
          en: 'Every extra write after the incident makes the recovery target harder to choose.',
          es: 'Cada escritura adicional tras el incidente complica elegir el punto de recuperación.',
        },
      },
      {
        id: 'inventory',
        title: {
          en: 'Inventory the backup chain',
          es: 'Inventaria la cadena de backups',
        },
        detail: {
          en: 'Verify the latest full, differential and log backups in msdb before touching restore commands.',
          es: 'Verifica el último full, diferencial y logs en msdb antes de lanzar restores.',
        },
        hint: {
          en: 'Missing one log backup breaks the chain.',
          es: 'Si falta un log backup, la cadena se rompe.',
        },
      },
      {
        id: 'tail',
        title: {
          en: 'Capture the tail of the log',
          es: 'Captura el tail del log',
        },
        detail: {
          en: 'If the database is still reachable, back up the tail-log so the final transactions are not lost.',
          es: 'Si la base sigue accesible, haz tail-log backup para no perder las últimas transacciones.',
        },
        hint: {
          en: 'This is the piece people skip when they panic.',
          es: 'Esta es la pieza que la gente suele saltarse cuando entra en pánico.',
        },
      },
      {
        id: 'restore',
        title: {
          en: 'Restore to a safe timestamp',
          es: 'Restaura al instante sano',
        },
        detail: {
          en: 'Restore full, optional diff and logs with NORECOVERY until the last step, then STOPAT just before the bad change.',
          es: 'Restaura full, diferencial opcional y logs con NORECOVERY hasta el final, y usa STOPAT justo antes del cambio malo.',
        },
        hint: {
          en: 'Use a side database when you need data comparison before cutover.',
          es: 'Usa una base lateral cuando necesites comparar datos antes del cambio definitivo.',
        },
      },
      {
        id: 'validate',
        title: {
          en: 'Validate and reopen traffic',
          es: 'Valida y reabre tráfico',
        },
        detail: {
          en: 'Run consistency and business checks, then redirect the application only after you confirm the restored state is correct.',
          es: 'Ejecuta checks de consistencia y negocio, y redirige la aplicación solo cuando confirmes que el estado restaurado es correcto.',
        },
        hint: {
          en: 'Technical restore success does not guarantee business correctness.',
          es: 'Que el restore técnicamente funcione no garantiza que el negocio esté correcto.',
        },
      },
    ],
    diagnosticScript: `SELECT TOP (20)
       bs.database_name,
       bs.backup_start_date,
       bs.backup_finish_date,
       CASE bs.type
         WHEN 'D' THEN 'FULL'
         WHEN 'I' THEN 'DIFF'
         WHEN 'L' THEN 'LOG'
         ELSE bs.type
       END AS backup_type,
       bs.first_lsn,
       bs.last_lsn,
       bmf.physical_device_name
FROM msdb.dbo.backupset AS bs
JOIN msdb.dbo.backupmediafamily AS bmf
  ON bs.media_set_id = bmf.media_set_id
WHERE bs.database_name = N'YourDatabase'
ORDER BY bs.backup_finish_date DESC;`,
    recoveryScript: `BACKUP LOG [YourDatabase]
TO DISK = N'\\\\backupshare\\YourDatabase_tail.trn'
WITH NORECOVERY, CHECKSUM, STATS = 5;
GO
RESTORE DATABASE [YourDatabase_DR]
FROM DISK = N'\\\\backupshare\\YourDatabase_full.bak'
WITH MOVE N'YourDatabase' TO N'F:\\SQLData\\YourDatabase_DR.mdf',
     MOVE N'YourDatabase_log' TO N'G:\\SQLLog\\YourDatabase_DR.ldf',
     NORECOVERY, REPLACE, STATS = 5;
GO
RESTORE DATABASE [YourDatabase_DR]
FROM DISK = N'\\\\backupshare\\YourDatabase_diff.bak'
WITH NORECOVERY, STATS = 5;
GO
RESTORE LOG [YourDatabase_DR]
FROM DISK = N'\\\\backupshare\\YourDatabase_tail.trn'
WITH STOPAT = '2026-03-12T10:42:00', RECOVERY, STATS = 5;`,
    validationScript: `DBCC CHECKDB (N'YourDatabase_DR') WITH NO_INFOMSGS, PHYSICAL_ONLY;

SELECT name, state_desc, recovery_model_desc
FROM sys.databases
WHERE name = N'YourDatabase_DR';

SELECT TOP (50) *
FROM [YourDatabase_DR].dbo.YourCriticalTable
ORDER BY YourBusinessKey;`,
  },
  {
    id: 'corruption',
    title: {
      en: 'Page or file corruption',
      es: 'Corrupción de página o fichero',
    },
    headline: {
      en: 'Restore clean media fast and keep repair as the absolute last resort',
      es: 'Restaura medio limpio rápido y deja repair como último recurso',
    },
    summary: {
      en: 'When storage or page corruption appears, preserve evidence, capture what is still recoverable and restore from known-good backups instead of improvising repair.',
      es: 'Cuando aparece corrupción de storage o páginas, conserva evidencia, captura lo que siga recuperable y restaura desde backups buenos en vez de improvisar reparaciones.',
    },
    preferredPath: {
      en: 'Restore clean chain, then validate',
      es: 'Restaurar cadena limpia y después validar',
    },
    firstMove: {
      en: 'Collect errors, suspect pages and storage evidence before changing too much.',
      es: 'Recoge errores, suspect pages y evidencia de storage antes de cambiar demasiado.',
    },
    trap: {
      en: 'Do not jump to REPAIR_ALLOW_DATA_LOSS while valid backups still exist.',
      es: 'No saltes a REPAIR_ALLOW_DATA_LOSS mientras existan backups válidos.',
    },
    rpo: 'Depends on last clean log backup',
    rto: 'Restore time plus validation',
    badges: ['suspect_pages', 'CHECKDB', 'Tail-log if possible', 'Avoid repair first'],
    steps: [
      {
        id: 'evidence',
        title: {
          en: 'Capture evidence',
          es: 'Captura evidencia',
        },
        detail: {
          en: 'Read the error log, gather suspect page information and identify whether the issue is isolated or wide storage damage.',
          es: 'Lee el error log, recoge suspect pages e identifica si el problema es aislado o un daño amplio de storage.',
        },
        hint: {
          en: 'The hardware story matters as much as the database story here.',
          es: 'Aquí importa tanto la historia del hardware como la de la base.',
        },
      },
      {
        id: 'stabilize',
        title: {
          en: 'Stabilize the workload',
          es: 'Estabiliza la carga',
        },
        detail: {
          en: 'Reduce writes, stop dependent jobs and decide whether a tail-log backup is still possible.',
          es: 'Reduce escrituras, para jobs dependientes y decide si aún es posible un tail-log backup.',
        },
        hint: {
          en: 'Extra writes on damaged media can make the incident worse.',
          es: 'Más escrituras sobre medio dañado pueden empeorar el incidente.',
        },
      },
      {
        id: 'restore-plan',
        title: {
          en: 'Build the restore plan',
          es: 'Monta el plan de restore',
        },
        detail: {
          en: 'Locate the last known-good full or diff backup and every log backup after it.',
          es: 'Localiza el último full o diferencial sano y todos los log backups posteriores.',
        },
        hint: {
          en: 'The fastest path is usually restore, not repair.',
          es: 'La vía más rápida suele ser restore, no repair.',
        },
      },
      {
        id: 'recover',
        title: {
          en: 'Recover onto clean storage',
          es: 'Recupera sobre storage limpio',
        },
        detail: {
          en: 'Restore the chain to healthy storage, then recover the database only at the final step.',
          es: 'Restaura la cadena sobre storage sano y recupera la base solo al final.',
        },
        hint: {
          en: 'If the original storage is suspect, do not put the restored copy back on the same risk surface.',
          es: 'Si el storage original es sospechoso, no pongas la copia restaurada sobre el mismo riesgo.',
        },
      },
      {
        id: 'trust',
        title: {
          en: 'Rebuild trust before cutover',
          es: 'Reconstruye la confianza antes del cutover',
        },
        detail: {
          en: 'Run CHECKDB, confirm application behavior and reopen traffic only after the restored copy proves stable.',
          es: 'Ejecuta CHECKDB, confirma el comportamiento de la aplicación y abre tráfico solo cuando la copia restaurada demuestre estabilidad.',
        },
        hint: {
          en: 'Restored does not mean trusted until validated.',
          es: 'Restaurado no significa fiable hasta validar.',
        },
      },
    ],
    diagnosticScript: `SELECT *
FROM msdb.dbo.suspect_pages
ORDER BY last_update_date DESC;

DBCC CHECKDB (N'YourDatabase') WITH NO_INFOMSGS, PHYSICAL_ONLY;

EXEC xp_readerrorlog 0, 1, N'823';
EXEC xp_readerrorlog 0, 1, N'824';
EXEC xp_readerrorlog 0, 1, N'825';`,
    recoveryScript: `BACKUP LOG [YourDatabase]
TO DISK = N'\\\\backupshare\\YourDatabase_tail.trn'
WITH NORECOVERY, CHECKSUM, STATS = 5;
GO
RESTORE DATABASE [YourDatabase]
FROM DISK = N'\\\\backupshare\\YourDatabase_full.bak'
WITH NORECOVERY, REPLACE, STATS = 5;
GO
RESTORE DATABASE [YourDatabase]
FROM DISK = N'\\\\backupshare\\YourDatabase_diff.bak'
WITH NORECOVERY, STATS = 5;
GO
RESTORE LOG [YourDatabase]
FROM DISK = N'\\\\backupshare\\YourDatabase_tail.trn'
WITH RECOVERY, STATS = 5;
GO
DBCC CHECKDB (N'YourDatabase') WITH NO_INFOMSGS, PHYSICAL_ONLY;`,
    validationScript: `DBCC CHECKDB (N'YourDatabase') WITH NO_INFOMSGS;

SELECT database_id, name, state_desc
FROM sys.databases
WHERE name = N'YourDatabase';

SELECT TOP (20) *
FROM sys.dm_io_virtual_file_stats(DB_ID(N'YourDatabase'), NULL);`,
  },
  {
    id: 'ag-failover',
    title: {
      en: 'Primary site outage / AG failover',
      es: 'Caída del primario / failover AG',
    },
    headline: {
      en: 'Promote the best secondary and then reconcile the gap',
      es: 'Promociona la mejor secundaria y luego reconcilia la brecha',
    },
    summary: {
      en: 'Always On gives you a faster DR path, but the exact procedure changes with synchronous vs asynchronous commit and whether the primary is still reachable.',
      es: 'Always On te da una ruta DR más rápida, pero el procedimiento cambia según synchronous o asynchronous commit y según si el primario sigue accesible.',
    },
    preferredPath: {
      en: 'Planned failover when possible, forced failover only with eyes open',
      es: 'Failover planeado si se puede, forzado solo con los ojos abiertos',
    },
    firstMove: {
      en: 'Measure synchronization state and business tolerance before forcing anything.',
      es: 'Mide el estado de sincronización y la tolerancia del negocio antes de forzar nada.',
    },
    trap: {
      en: 'Do not use FORCE_FAILOVER_ALLOW_DATA_LOSS without explicitly accepting the data gap risk.',
      es: 'No uses FORCE_FAILOVER_ALLOW_DATA_LOSS sin aceptar de forma explícita el riesgo de pérdida.',
    },
    rpo: 'Zero in sync, non-zero in async',
    rto: 'Seconds to minutes',
    badges: ['HADR DMVs', 'Failover', 'Data movement', 'Redo queue'],
    steps: [
      {
        id: 'assess',
        title: {
          en: 'Assess the replica set',
          es: 'Evalúa el conjunto de réplicas',
        },
        detail: {
          en: 'Check synchronization state, hardening lag and which secondary is the safest promotion target.',
          es: 'Revisa estado de sincronización, hardening lag y qué secundaria es el objetivo más seguro para promocionar.',
        },
        hint: {
          en: 'The best secondary is not always the nearest one; it is the one with the healthiest data position.',
          es: 'La mejor secundaria no siempre es la más cercana, sino la que tiene la posición de datos más sana.',
        },
      },
      {
        id: 'route',
        title: {
          en: 'Choose planned vs forced failover',
          es: 'Elige failover planeado o forzado',
        },
        detail: {
          en: 'If the primary still participates and commit is synchronized, do a planned failover. If the site is gone, you may need force failover and accept a gap.',
          es: 'Si el primario aún participa y el commit está sincronizado, haz failover planeado. Si el sitio ha caído, puede tocar failover forzado y asumir la brecha.',
        },
        hint: {
          en: 'This is the decision that defines your real RPO.',
          es: 'Esta decisión define tu RPO real.',
        },
      },
      {
        id: 'promote',
        title: {
          en: 'Promote the secondary',
          es: 'Promociona la secundaria',
        },
        detail: {
          en: 'Execute the failover, bring the listener and application routing to the new primary and observe redo/data movement state.',
          es: 'Ejecuta el failover, lleva el listener y el enrutado de la aplicación al nuevo primario y observa redo/data movement.',
        },
        hint: {
          en: 'Application redirection is part of the DR plan, not an afterthought.',
          es: 'Redirigir la aplicación forma parte del plan de DR, no es un detalle posterior.',
        },
      },
      {
        id: 'repair-topology',
        title: {
          en: 'Repair the topology',
          es: 'Repara la topología',
        },
        detail: {
          en: 'Resume suspended data movement, reseed if required and decide how to reintroduce the old primary.',
          es: 'Reanuda data movement suspendido, vuelve a seed si hace falta y decide cómo reintroducir el primario antiguo.',
        },
        hint: {
          en: 'After an async forced failover, reconciliation is operational work, not magic.',
          es: 'Tras un failover forzado en async, la reconciliación es trabajo operativo, no magia.',
        },
      },
      {
        id: 'stabilize-new-primary',
        title: {
          en: 'Stabilize the new primary',
          es: 'Estabiliza el nuevo primario',
        },
        detail: {
          en: 'Validate jobs, read-only routing, backups and monitoring on the new topology before declaring the incident closed.',
          es: 'Valida jobs, read-only routing, backups y monitorización en la nueva topología antes de cerrar el incidente.',
        },
        hint: {
          en: 'A failover is not finished when the app connects; it is finished when operations are stable again.',
          es: 'Un failover no termina cuando conecta la app, sino cuando la operación vuelve a estar estable.',
        },
      },
    ],
    diagnosticScript: `SELECT ar.replica_server_name,
       rs.synchronization_state_desc,
       rs.synchronization_health_desc,
       rs.last_hardened_lsn,
       rs.log_send_queue_size,
       rs.redo_queue_size
FROM sys.dm_hadr_database_replica_states AS rs
JOIN sys.availability_replicas AS ar
  ON rs.replica_id = ar.replica_id
ORDER BY ar.replica_server_name;`,
    recoveryScript: `-- Planned failover
ALTER AVAILABILITY GROUP [YourAG]
FAILOVER;
GO

-- Last resort only
ALTER AVAILABILITY GROUP [YourAG]
FORCE_FAILOVER_ALLOW_DATA_LOSS;
GO

ALTER DATABASE [YourDatabase] SET HADR RESUME;`,
    validationScript: `SELECT replica_server_name,
       role_desc,
       connected_state_desc,
       operational_state_desc
FROM sys.dm_hadr_availability_replica_states AS ars
JOIN sys.availability_replicas AS ar
  ON ars.replica_id = ar.replica_id;

SELECT name, state_desc
FROM sys.databases
WHERE replica_id IS NOT NULL;

EXEC msdb.dbo.sp_help_job;`,
  },
];
