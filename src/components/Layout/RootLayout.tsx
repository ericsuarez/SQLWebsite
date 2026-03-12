import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import type { ModuleId } from './Sidebar';
import { Header } from './Header';

export function RootLayout({ children }: { children: (currentModule: ModuleId) => ReactNode }) {
    const [currentModule, setCurrentModule] = useState<ModuleId>('architecture');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleModuleChange = (module: ModuleId) => {
        setCurrentModule(module);
        setIsMobileSidebarOpen(false);
    };

    return (
        <div className="relative flex min-h-dvh w-full overflow-x-clip bg-zinc-950 font-sans text-zinc-50 selection:bg-primary/30">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
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
                currentModule={currentModule}
                onModuleChange={handleModuleChange}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
                searchQuery={searchQuery}
                isMobileOpen={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            <div className="relative z-0 flex min-w-0 flex-1 flex-col overflow-x-clip">
                <Header
                    currentModule={currentModule}
                    onModuleChange={handleModuleChange}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    onOpenSidebar={() => setIsMobileSidebarOpen(true)}
                />

                <main className="relative flex-1 overflow-x-clip overflow-y-auto overscroll-y-auto px-3 py-3 sm:px-4 md:px-6 md:py-5">
                    <div className="w-full min-h-full pb-6">
                        {children(currentModule)}
                    </div>
                </main>
            </div>
        </div>
    );
}
