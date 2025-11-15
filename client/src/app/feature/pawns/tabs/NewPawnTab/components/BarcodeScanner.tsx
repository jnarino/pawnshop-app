import { useBarcodeScan } from '@/app/shared/hooks/useBarcodeScan';

interface Props {
  enabled: boolean;
  onScan: (code: string) => void;
  onToggle: (enabled: boolean) => void;
}

// ✅ Single Responsibility: Barcode scanning functionality
export function BarcodeScanner({ enabled, onScan, onToggle }: Props) {
  useBarcodeScan({
    enabled,
    onBarcode: onScan,
    allowRegex: /^[A-Z0-9\-]+$/i
  });

  return (
    <div style={{ 
      padding: '16px', 
      borderTop: '1px solid #eee',
      marginTop: '16px'
    }}>
      <button 
        type="button" 
        onClick={() => onToggle(!enabled)}
        style={{ 
          background: enabled ? '#d32f2f' : '#666',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {enabled ? 'Stop Scan' : 'Scan Barcode'}
      </button>
      {enabled && (
        <p style={{ 
          marginTop: '8px', 
          fontSize: '14px', 
          color: '#666' 
        }}>
          Barcode scanner active - scan a barcode to populate serial number
        </p>
      )}
    </div>
  );
}
