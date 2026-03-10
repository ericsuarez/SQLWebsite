import React from 'react';
import { RootLayout } from './components/Layout/RootLayout';
import { AnimatePresence, motion } from 'framer-motion';

import { ArchitectureOverview } from './components/Architecture/ArchitectureOverview';
import { StorageEngine } from './components/Storage/StorageEngine';
import { MemoryOperations } from './components/Memory/MemoryOperations';
import { QueryExecution } from './components/Execution/QueryExecution';
import { DBAScenarios } from './components/DBA/DBAScenarios';
import { HighAvailability } from './components/HA/HighAvailability';

function App() {
  return (
    <RootLayout>
      {(currentModule) => (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentModule}
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {currentModule === 'architecture' ? (
              <ArchitectureOverview />
            ) : currentModule === 'storage' ? (
              <StorageEngine />
            ) : currentModule === 'memory' ? (
              <MemoryOperations />
            ) : currentModule === 'execution' ? (
              <QueryExecution />
            ) : currentModule === 'dba' ? (
              <DBAScenarios />
            ) : currentModule === 'ha' ? (
              <HighAvailability />
            ) : (
              <div className="w-full h-full flex items-center justify-center glass-panel rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <div className="text-center p-8 z-10">
                  <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 mb-4 capitalize">
                    {(currentModule as string).replace('-', ' ')} Module
                  </h2>
                  <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                    Interactive simulation content for the {currentModule as string} layer will be loaded here.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </RootLayout>
  );
}

export default App;
