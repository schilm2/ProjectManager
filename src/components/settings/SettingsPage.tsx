import { useState, useEffect, useCallback } from 'react';
import { Database } from 'sql.js';
import { syncProjects, SyncProgress } from '../../services/syncProjects';

interface LMStudioModel {
  id: string;
  object: string;
  owned_by: string;
  loaded: boolean;
}

const DEFAULT_URL = 'http://localhost:1234';
const STORAGE_KEY_URL = 'lmstudio-url';
const STORAGE_KEY_MODEL = 'lmstudio-model';

interface SettingsPageProps {
  db: Database;
}

export function SettingsPage({ db }: SettingsPageProps) {
  const [baseUrl, setBaseUrl] = useState(() =>
    localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_URL
  );
  const [models, setModels] = useState<LMStudioModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(() =>
    localStorage.getItem(STORAGE_KEY_MODEL) || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<SyncProgress[]>([]);

  const fetchModels = useCallback(async (rawUrl: string) => {
    setLoading(true);
    setError(null);
    setConnected(false);
    setModels([]);

    const url = rawUrl.replace(/\/+$/, '').replace(/\/v1\/models$/, '');

    try {
      const res = await fetch(`${url}/v1/models`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json = await res.json();
      const allModels: Array<Omit<LMStudioModel, 'loaded'>> = json.data ?? [];

      let loadedIds = new Set<string>();
      try {
        const loadedRes = await fetch(`${url}/lmstudio/v1/models/loaded`);
        if (loadedRes.ok) {
          const loadedJson = await loadedRes.json();
          const loadedModels: Array<{ id: string }> = loadedJson.data ?? [];
          loadedIds = new Set(loadedModels.map(m => m.id));
        }
      } catch {
        // Endpoint not available in older LM Studio versions
      }

      const fetched: LMStudioModel[] = allModels.map(m => ({
        ...m,
        loaded: loadedIds.has(m.id),
      }));

      setModels(fetched);
      setConnected(true);

      const savedModel = localStorage.getItem(STORAGE_KEY_MODEL) || '';
      if (savedModel && fetched.some(m => m.id === savedModel)) {
        setSelectedModel(savedModel);
      } else if (fetched.length > 0) {
        const firstLoaded = fetched.find(m => m.loaded);
        setSelectedModel(firstLoaded ? firstLoaded.id : fetched[0].id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verbindung fehlgeschlagen';
      setError(message);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels(baseUrl);
  }, []);

  function handleConnect() {
    localStorage.setItem(STORAGE_KEY_URL, baseUrl);
    fetchModels(baseUrl);
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY_URL, baseUrl);
    localStorage.setItem(STORAGE_KEY_MODEL, selectedModel);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncLog([]);
    try {
      await syncProjects(db, (progress) => {
        setSyncLog(prev => {
          const existing = prev.findIndex(
            p => p.projectName === progress.projectName
          );
          if (existing >= 0) {
            return prev.map((p, i) => i === existing ? progress : p);
          }
          return [...prev, progress];
        });
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>Einstellungen</h2>
      </div>

      <section className="settings-section">
        <h3 className="settings-section-title">LM Studio</h3>
        <p className="settings-section-desc">
          Verbinde dich mit LM Studio, um lokale LLMs zu verwenden.
        </p>

        <div className="settings-card">
          <div className="form-group">
            <label htmlFor="lmstudio-url">Server URL</label>
            <div className="settings-url-row">
              <input
                id="lmstudio-url"
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="http://localhost:1234"
              />
              <button
                className="btn btn-primary"
                onClick={handleConnect}
                disabled={loading}
              >
                {loading ? 'Verbinde...' : 'Verbinden'}
              </button>
            </div>
          </div>

          {error && (
            <div className="settings-status settings-status-error">
              <span className="settings-status-dot error" />
              {error}
            </div>
          )}

          {connected && (
            <div className="settings-status settings-status-ok">
              <span className="settings-status-dot ok" />
              Verbunden — {models.length} {models.length === 1 ? 'Modell' : 'Modelle'} verfügbar
            </div>
          )}

          {models.length > 0 && (
            <div className="form-group">
              <label>Verfügbare Modelle</label>
              <div className="models-list">
                {models.map(m => (
                  <div
                    key={m.id}
                    className={`model-item${selectedModel === m.id ? ' selected' : ''}${m.loaded ? ' loaded' : ''}`}
                    onClick={() => setSelectedModel(m.id)}
                  >
                    <span className={`model-status-dot ${m.loaded ? 'active' : 'inactive'}`} />
                    <span className="model-name">{m.id}</span>
                    {m.loaded && <span className="model-badge">Geladen</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {connected && models.length > 0 && (
            <div className="settings-actions">
              <button className="btn btn-primary" onClick={handleSave}>
                Speichern
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section-title">Projekte synchronisieren</h3>
        <p className="settings-section-desc">
          Aktualisiert die Projektbeschreibungen automatisch auf Basis neuer ToDos und Notizen.
          Nur aktive Projekte mit neuen oder geänderten Einträgen werden synchronisiert.
        </p>

        <div className="settings-card">
          <div className="settings-actions">
            <button
              className="btn btn-primary"
              onClick={handleSync}
              disabled={syncing || !selectedModel}
            >
              {syncing ? 'Synchronisiere...' : 'Projekte synchronisieren'}
            </button>
            {!selectedModel && (
              <span className="settings-hint">
                Bitte zuerst ein LLM-Modell auswählen.
              </span>
            )}
          </div>

          {syncLog.length > 0 && (
            <div className="sync-log">
              {syncLog.map((entry, idx) => (
                <div key={idx} className={`sync-log-entry sync-log-${entry.status}`}>
                  <span className="sync-log-icon">
                    {entry.status === 'syncing' && '⟳'}
                    {entry.status === 'done' && '✓'}
                    {entry.status === 'skipped' && '–'}
                    {entry.status === 'error' && '✗'}
                  </span>
                  <span className="sync-log-name">{entry.projectName}</span>
                  <span className="sync-log-status">
                    {entry.status === 'syncing' && 'wird synchronisiert...'}
                    {entry.status === 'done' && 'aktualisiert'}
                    {entry.status === 'skipped' && 'keine Änderungen'}
                    {entry.status === 'error' && entry.error}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
