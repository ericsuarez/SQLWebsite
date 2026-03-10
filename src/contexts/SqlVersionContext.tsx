import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SqlVersion = '2019' | '2022' | '2025';

interface SqlVersionContextType {
    version: SqlVersion;
    setVersion: (version: SqlVersion) => void;
}

const SqlVersionContext = createContext<SqlVersionContextType | undefined>(undefined);

export function SqlVersionProvider({ children }: { children: ReactNode }) {
    const [version, setVersion] = useState<SqlVersion>('2022'); // Default to 2022

    return (
        <SqlVersionContext.Provider value={{ version, setVersion }}>
            {children}
        </SqlVersionContext.Provider>
    );
}

export function useSqlVersion() {
    const context = useContext(SqlVersionContext);
    if (context === undefined) {
        throw new Error('useSqlVersion must be used within a SqlVersionProvider');
    }
    return context;
}
