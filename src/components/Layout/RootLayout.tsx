import React, { useState } from 'react';
import { Sidebar, ModuleId } from './Sidebar';
import { Header } from './Header';

export function RootLayout({ children }: { children: (currentModule: ModuleId) => React.ReactNode }) {
    const [currentModule, setCurrentModule] = useState<ModuleId>('architecture');

    return (
        <div className="flex h-screen w-full bg-zinc-950 text-zinc-50 overflow-hidden font-sans selection:bg-primary/30">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
            </div>

            <Sidebar currentModule={currentModule} onModuleChange={setCurrentModule} />

            <div className="flex-1 flex flex-col relative z-0">
                <Header />

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 relative">
                    <div className="max-w-7xl mx-auto w-full h-full">
                        {children(currentModule)}
                    </div>
                </main>
            </div>
        </div>
    );
}
