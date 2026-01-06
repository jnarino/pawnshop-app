import React, { useCallback, useEffect, useRef, useState } from 'react';
import { parseAamva, AamvaData } from '@/app/shared/hooks/useIdScan';

interface Props {
    open: boolean;
    onClose: () => void;
    onScanned: (data: AamvaData, raw: string) => void;
    inactivityMs?: number;   // gap to auto-finish if no Enter
    debug?: boolean;
}

export const CustomerIdScanModal: React.FC<Props> = ({
    open,
    onClose,
    onScanned,
    inactivityMs = 150,
    debug = false
}) => {
    const [status, setStatus] = useState<'waiting' | 'parsing' | 'success' | 'error' | 'short' | 'timeout'>('waiting');
    const [message, setMessage] = useState('Ready – scan the ID now...');
    const [rawPreview, setRawPreview] = useState('');
    const bufferRef = useRef('');
    const timerRef = useRef<number | null>(null); // ✅ Use number for browser setTimeout
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

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newRaw = e.target.value;
        setRawPreview(newRaw);
        bufferRef.current = newRaw;

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = window.setTimeout(() => { // ✅ Explicitly use window.setTimeout
            const result = parseAamva(newRaw);

            if (result) {
                console.log('[IDScan] ✅ Successfully parsed ID:', {
                    name: `${result.firstName} ${result.lastName}`,
                    dob: result.dateOfBirth,
                    idNumber: result.idNumber
                });

                onScanned(result, newRaw);
                onClose();
            }
        }, inactivityMs) as unknown as number;
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