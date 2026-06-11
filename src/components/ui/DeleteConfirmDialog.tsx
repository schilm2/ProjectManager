interface DeleteConfirmDialogProps {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ itemName, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Löschen bestätigen</h3>
        <p>Möchtest du <strong>{itemName}</strong> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>Löschen</button>
        </div>
      </div>
    </div>
  );
}
