const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'i18n', 'translations.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const enKeys = `
        // OS Level Config
        osConfigMainDesc: 'Explore critical OS-level settings that directly impact SQL Server performance. Misconfigurations here are often invisible to DBADMVs.',
        catVirtualization: 'Virtualization & Storage',
        catNetwork: 'Networking',
        catPolicy: 'Windows Policies',
        catPower: 'Power Management',
        impactWhenMisconfigured: 'Impact if Misconfigured:',

        osQueueDepthTitle: 'Storage Queue Depth',
        osQueueDepthDesc: 'The number of simultaneous I/O requests a storage adapter can process. Low queue depth creates a bottleneck before I/O reaches the physical disks.',
        osQueueDepthImpact: 'High WRITELOG and PAGEIOLATCH waits even on fast NVMe/SSD arrays.',

        osNtfsAllocTitle: 'NTFS Allocation Unit Size',
        osNtfsAllocDesc: 'The cluster size formatting of the disk. SQL Server reads/writes in 64KB extents. Formatting disks with the default 4KB cluster size forces the OS to do 16x more work per extent.',
        osNtfsAllocImpact: 'Increased disk queue length, higher I/O latency, and fragmented file systems.',

        osPvscsiTitle: 'VMware PVSCSI Controller',
        osPvscsiDesc: 'Paravirtualized SCSI controllers bypass heavy emulation, reducing CPU overhead and increasing I/O throughput for high-performance VMs.',
        osPvscsiImpact: 'High hypervisor CPU% (CPU Ready Time) and artificially capped storage IOPS.',

        osScatterGatherTitle: 'Scatter/Gather I/O',
        osScatterGatherDesc: 'Allows SQL Server to read non-contiguous memory blocks and write them to contiguous disk blocks (and vice versa) in a single DMA operation.',
        osScatterGatherImpact: 'Higher CPU usage and degraded I/O throughput under heavy load.',

        osMaxTransferTitle: 'Max Transfer Size',
        osMaxTransferDesc: 'Controls the maximum size of an I/O payload requested by SQL Server. Backup operations benefit massively from larger transfer sizes.',
        osMaxTransferImpact: 'Extremely slow database backups and restores.',

        osRssTitle: 'Receive Side Scaling (RSS)',
        osRssDesc: 'Distributes network processing load across multiple CPU cores rather than choking a single CPU (usually CPU 0).',
        osRssImpact: 'CPU 0 pinned at 100% processing network interrupts, while other CPUs sit idle. Sluggish overall server response.',

        osVmqTitle: 'Virtual Machine Queue (VMQ)',
        osVmqDesc: 'Allows the host network adapter to DMA packets directly into the guest VM memory, bypassing the host vSwitch overhead.',
        osVmqImpact: 'High network latency, dropped packets, and host CPU bottlenecks on 10GbE+ networks.',

        osLpimTitle: 'Lock Pages in Memory (AD Policy)',
        osLpimDesc: 'Prevents Windows from swapping SQL Server buffer pool memory out to the pagefile (pagefile.sys) when the OS feels memory pressure.',
        osLpimImpact: 'Sudden, massive performance cliffs. PLE drops to 0, disks thrash wildly (paging).',

        osIfiTitle: 'Instant File Initialization (AD Policy)',
        osIfiDesc: 'Allows SQL Server to bypass zeroing out newly allocated data file space. It does not apply to log files.',
        osIfiImpact: 'Database creations, restores, and auto-growths stall the entire application for minutes/hours.',

        osBypassTitle: 'Bypass Traverse Checking',
        osBypassDesc: 'Standard Windows policy granted to Everyone. If removed for security hardening, SQL Server service accounts may fail to access deeper directory trees where DB files live.',
        osBypassImpact: 'Service fails to start, or Attach Database operations fail with "Access Denied" despite having NTFS permissions on the target file.',

        osPowerPlanTitle: 'Windows Power Plan',
        osPowerPlanDesc: 'The OS power profile. "Balanced" (the default) allows Windows to dynamically downclock CPU cores to save energy.',
        osPowerPlanImpact: 'Processors run at 1.2GHz instead of 3.5GHz. All queries take 3x longer. The most common silent killer of SQL performance.',
`;

const esKeys = `
        // OS Level Config
        osConfigMainDesc: 'Explora configuraciones críticas a nivel de OS que impactan directamente en el rendimiento de SQL Server. Las malas configuraciones aquí suelen ser invisibles para las DMVs.',
        catVirtualization: 'Virtualización y Almacenamiento',
        catNetwork: 'Redes',
        catPolicy: 'Políticas de Windows',
        catPower: 'Energía',
        impactWhenMisconfigured: 'Impacto si está mal configurado:',

        osQueueDepthTitle: 'Profundidad de Cola (Queue Depth)',
        osQueueDepthDesc: 'El número de peticiones I/O simultáneas que un adaptador puede procesar. Una cola baja crea un cuello de botella antes de que el I/O llegue a los discos físicos.',
        osQueueDepthImpact: 'Altas esperas WRITELOG y PAGEIOLATCH incluso en cabinas NVMe/SSD rápidas.',

        osNtfsAllocTitle: 'Tamaño de Asignación NTFS',
        osNtfsAllocDesc: 'El tamaño del clúster del disco. SQL Server lee/escribe en extensiones de 64KB. Formatear discos a 4KB obliga al OS a hacer 16x más trabajo por extensión.',
        osNtfsAllocImpact: 'Mayor longitud de cola de disco, mayor latencia de I/O y sistemas de archivos fragmentados.',

        osPvscsiTitle: 'VMware Controlador PVSCSI',
        osPvscsiDesc: 'Los controladores Paravirtualizados SCSI evitan la costosa emulación, reduciendo el overhead de CPU e incrementando el throughput de I/O.',
        osPvscsiImpact: 'Alto uso de CPU del hipervisor (CPU Ready Time) y un límite artificial en los IOPS de almacenamiento.',

        osScatterGatherTitle: 'Scatter/Gather I/O',
        osScatterGatherDesc: 'Permite a SQL Server leer bloques no contiguos de memoria y escribirlos contiguos en disco (y viceversa) en una sola operación DMA.',
        osScatterGatherImpact: 'Mayor uso de CPU y rendimiento I/O degradado bajo carga pesada.',

        osMaxTransferTitle: 'Max Transfer Size',
        osMaxTransferDesc: 'Controla el tamaño máximo del payload I/O que pide SQL Server. Los Backups se benefician masivamente de tamaños grandes.',
        osMaxTransferImpact: 'Backups y restauraciones de base de datos extremadamente lentos.',

        osRssTitle: 'Receive Side Scaling (RSS)',
        osRssDesc: 'Distribuye la carga del procesamiento de red a través de múltiples núcleos de RAM en vez de asfixiar un solo CPU (normalmente el CPU 0).',
        osRssImpact: 'CPU 0 anclado al 100% procesando interrupciones de red. Respuesta del servidor en general muy lenta.',

        osVmqTitle: 'Virtual Machine Queue (VMQ)',
        osVmqDesc: 'Permite al adaptador de red DMAear paquetes directamente a la memoria de la VM, evitando el overhead del vSwitch del host.',
        osVmqImpact: 'Alta latencia de red, paquetes descartados, y cuellos de botella en la CPU del host en redes 10GbE+.',

        osLpimTitle: 'Lock Pages in Memory (Política AD)',
        osLpimDesc: 'Evita que Windows envíe la memoria del Buffer Pool de SQL Server al archivo de paginación (pagefile.sys) cuando el OS siente presión de memoria.',
        osLpimImpact: 'Caídas masivas y repentinas de rendimiento. El PLE (Page Life Expectancy) cae a 0, los discos enloquecen.',

        osIfiTitle: 'Instant File Initialization (Política AD)',
        osIfiDesc: 'Permite a SQL Server evitar escribir ceros en espacios de archivo de datos recién asignados. No aplica a los archivos de Log.',
        osIfiImpact: 'Las creaciones de BD, restauraciones, y crecimientos automáticos paralizan toda la aplicación por minutos u horas.',

        osBypassTitle: 'Bypass Traverse Checking',
        osBypassDesc: 'Política de Windows estándar para Todos. Si se quita, las cuentas de servicio de SQL Server pueden fallar al acceder a árboles de directorios profundos (donde viven los MDF/LDF).',
        osBypassImpact: 'El servicio falla al iniciar, o las operaciones de "Attach Database" fallan con "Access Denied".',

        osPowerPlanTitle: 'Plan de Energía de Windows',
        osPowerPlanDesc: 'El perfil de energía del OS. "Equilibrado" (por defecto) permite a Windows bajar la frecuencia de los CPUs para ahorrar energía.',
        osPowerPlanImpact: 'Procesadores corriendo a 1.2GHz en vez de 3.5GHz. Todas las consultas tardan 3x más. El asesino silencioso de SQL más común.',
`;

// Insert after tabModern: 'Modern Features',
content = content.replace(/(tabModern:\s*'Modern Features',)/, "$1\n" + enKeys);
content = content.replace(/(tabModern:\s*'Características Modernas',)/, "$1\n" + esKeys);

fs.writeFileSync(targetFile, content);
console.log('Successfully injected OS Config translation keys!');
