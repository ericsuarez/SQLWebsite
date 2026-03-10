import { X, Code2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSqlVersion } from '../../contexts/SqlVersionContext';

interface TSqlModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    // Scripts can vary by version or be static strings
    diagnosticScript: string | Record<'2019' | '2022' | '2025', string>;
    remediationScript?: string | Record<'2019' | '2022' | '2025', string>;
    remediationTitle?: string;
}

export function TSqlModal({ isOpen, onClose, title, description, diagnosticScript, remediationScript, remediationTitle }: TSqlModalProps) {
    const { t } = useLanguage();
    const { version } = useSqlVersion();
    const [copiedDiagnostic, setCopiedDiagnostic] = useState(false);
    const [copiedRemediation, setCopiedRemediation] = useState(false);

    if (!isOpen) return null;

    const copyToClipboard = async (text: string, isDiagnostic: boolean) => {
        try {
            await navigator.clipboard.writeText(text);
            if (isDiagnostic) {
                setCopiedDiagnostic(true);
                setTimeout(() => setCopiedDiagnostic(false), 2000);
            } else {
                setCopiedRemediation(true);
                setTimeout(() => setCopiedRemediation(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const getScriptText = (script: string | Record<'2019' | '2022' | '2025', string>) => {
        if (typeof script === 'string') return script;
        return script[version];
    };

    const diagText = getScriptText(diagnosticScript);
    const remText = remediationScript ? getScriptText(remediationScript) : null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col glass-panel rounded-2xl border-white/20 shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b border-white/10 bg-white/5">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-400">
                                <Code2 className="w-6 h-6" />
                                {title}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Diagnostic Script */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-emerald-400">{t('diagnosticQuery')}</h3>
                                <button
                                    onClick={() => copyToClipboard(diagText, true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    {copiedDiagnostic ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedDiagnostic ? t('copied') : t('copy')}
                                </button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl pointer-events-none" />
                                <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-sm font-mono overflow-x-auto text-emerald-300">
                                    <code>{diagText}</code>
                                </pre>
                            </div>
                        </div>

                        {/* Remediation Script (if any) */}
                        {remText && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-amber-400">{remediationTitle || t('remediationQuery')}</h3>
                                    <button
                                        onClick={() => copyToClipboard(remText, false)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                    >
                                        {copiedRemediation ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedRemediation ? t('copied') : t('copy')}
                                    </button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-xl pointer-events-none" />
                                    <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-sm font-mono overflow-x-auto text-amber-300">
                                        <code>{remText}</code>
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
