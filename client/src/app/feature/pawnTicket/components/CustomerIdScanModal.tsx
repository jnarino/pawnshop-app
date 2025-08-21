import React, { useCallback, useEffect, useRef, useState } from 'react';
import { parseAamva, AamvaData } from '../../../shared/hooks/useIdScan';

interface Props {
    open: boolean;
    onClose: () => void;
    onScanned: (data: AamvaData, raw: string) => void;
    inactivityMs?: number;   // gap to auto-finish if no Enter
    minLength?: number;      // minimum chars to consider a scan
    debug?: boolean;
}

export const CustomerIdScanModal: React.FC<Props> = ({
    open,
    onClose,
    onScanned,
    inactivityMs = 150,
    minLength = 40,
    debug = false
}) => {
    const [status, setStatus] = useState<'waiting' | 'parsing' | 'success' | 'error' | 'short' | 'timeout'>('waiting');
    const [message, setMessage] = useState('Ready – scan the ID now...');
    const [rawPreview, setRawPreview] = useState('');
    const bufferRef = useRef('');
    const timerRef = useRef<number | null>(null);
    const areaRef = useRef<HTMLTextAreaElement | null>(null);

    const reset = useCallback(() => {
        bufferRef.current = '';
        setRawPreview('');
        setStatus('waiting');
        setMessage('Ready – scan the ID now...');
    }, []);

    useEffect(() => {
        if (open) {
            reset();
            // Slight delay to ensure rendering before focusing
            setTimeout(() => {
                areaRef.current?.focus();
                areaRef.current?.select();
            }, 10);
        }
    }, [open, reset]);

    const finalize = useCallback((cause: 'enter' | 'timeout') => {
        const raw = bufferRef.current;
        // NEW: log raw scan content
        console.log('[IDScan][raw][cause=' + cause + '][length=' + raw.length + ']', raw);
        if (debug) console.debug('[IDScan debug raw]', raw);

        if (raw.length < minLength) {
            setStatus(cause === 'timeout' ? 'timeout' : 'short');
            setMessage(cause === 'timeout'
                ? 'Timed out (no Enter). Scan seems incomplete.'
                : `Input too short (${raw.length} chars) – not a license.`);
            return;
        }
        setStatus('parsing');
        setMessage('Parsing ID...');
        const parsed = parseAamva(raw);
        console.log('***************this is a test!!!!!!!!!!!');
        console.log('[IDScan][parsed]', parsed);
        if (parsed) {
            setStatus('success');
            setMessage('ID parsed successfully');
            setTimeout(() => {
                onScanned(parsed, raw);
                onClose();
            }, 250);
        } else {
            setStatus('error');
            setMessage('Could not parse ID data');
        }
    }, [minLength, onScanned, onClose, debug]);

    // Inactivity timeout management
    const scheduleInactivity = useCallback(() => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
            if (status === 'waiting') finalize('timeout');
        }, inactivityMs);
    }, [finalize, inactivityMs, status]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        let val = e.target.value;
        // If scanner sends newline at end -> finalize
        if (val.includes('\n')) {
            bufferRef.current = val;
            setRawPreview(val);
            finalize('enter');
            return;
        }
        bufferRef.current = val;
        setRawPreview(val);
        scheduleInactivity();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // User can press ESC to cancel
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, []);

    if (!open) return null;

    return (
        <div className="idscan-overlay">
            <div className="idscan-modal">
                <h3>ID Scan</h3>
                <div className={`idscan-status idscan-${status}`}>{message}</div>
                <textarea
                    ref={areaRef}
                    className="idscan-capture"
                    value={rawPreview}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    placeholder="(Hidden capture area – the scan text will appear briefly here)"
                />
                {debug && rawPreview && (
                    <pre className="idscan-debug">
                        {rawPreview.replace(/\r/g, '\\r').replace(/\n/g, '\\n\n')}
                    </pre>
                )}
                <div className="idscan-actions">
                    {status === 'error' || status === 'short' || status === 'timeout' ? (
                        <button type="button" onClick={reset}>Try Again</button>
                    ) : null}
                    <button type="button" onClick={onClose}>
                        {status === 'success' ? 'Close' : 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
};