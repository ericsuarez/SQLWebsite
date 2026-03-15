import { useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { ModuleId, SurfaceId } from './moduleCatalog';

interface RootLayoutProps {
  currentSurface: SurfaceId;
  currentModule: ModuleId | null;
  onModuleChange: (id: ModuleId) => void;
  onSurfaceChange: (surface: SurfaceId) => void;
  onNavigateToModule: (surface: SurfaceId, moduleId: ModuleId) => void;
  children: ReactNode;
}

export function RootLayout({
  currentSurface,
  currentModule,
  onModuleChange,
  onSurfaceChange,
  onNavigateToModule,
  children,
}: RootLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleModuleChange = (module: ModuleId) => {
    onModuleChange(module);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="relative flex min-h-dvh w-full overflow-x-clip bg-[#0b1011] font-sans text-zinc-50 selection:bg-teal-500/30">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-12%] top-[-12%] h-[34rem] w-[34rem] rounded-full bg-teal-500/12 blur-[140px]" />
        <div className="absolute right-[-10%] top-[8%] h-[30rem] w-[30rem] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[18%] h-[28rem] w-[28rem] rounded-full bg-lime-500/10 blur-[140px]" />
      </div>

      {isMobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <Sidebar
        currentSurface={currentSurface}
        currentModule={currentModule}
        onModuleChange={handleModuleChange}
        onSurfaceChange={onSurfaceChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
        searchQuery={searchQuery}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="relative z-0 flex min-w-0 flex-1 flex-col overflow-x-clip">
        <Header
          currentSurface={currentSurface}
          currentModule={currentModule}
          onSurfaceChange={onSurfaceChange}
          onNavigateToModule={onNavigateToModule}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="relative flex-1 overflow-x-clip overflow-y-auto overscroll-y-auto px-3 py-3 sm:px-4 md:px-6 md:py-5">
          <div className="min-h-full w-full pb-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
