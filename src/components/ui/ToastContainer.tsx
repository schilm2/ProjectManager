import { useToast } from '../../context/ToastContext';
import './toast.css';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            <span>{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Close">
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
