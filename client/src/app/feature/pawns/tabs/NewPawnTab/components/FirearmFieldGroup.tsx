interface Props {
  draft: any; // ✅ Keep flexible for now
  onFieldChange: (field: string, value: any) => void; // ✅ Match the expected signature
}

// ✅ Single Responsibility: Firearm-specific form fields
export function FirearmFieldGroup({ draft, onFieldChange }: Props) {
  return (
    <>
      <div className="form-group">
        <label>Caliber</label>
        <input 
          value={draft.caliber || ''} 
          onChange={e => onFieldChange('caliber', e.target.value)} 
        />
      </div>
      
      <div className="form-group">
        <label>Action</label>
        <input 
          value={draft.action || ''} 
          onChange={e => onFieldChange('action', e.target.value)} 
          placeholder="e.g. Semi-auto, Bolt" 
        />
      </div>
      
      <div className="form-group">
        <label>Barrel Length</label>
        <input 
          value={draft.barrelLength || ''} 
          onChange={e => onFieldChange('barrelLength', e.target.value)} 
          placeholder="e.g. 16 in" 
        />
      </div>
      
      <div className="form-group">
        <label>Capacity</label>
        <input 
          value={draft.capacity || ''} 
          onChange={e => onFieldChange('capacity', e.target.value)} 
        />
      </div>
    </>
  );
}
