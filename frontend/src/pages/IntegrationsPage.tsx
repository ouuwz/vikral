import { ArrowLeft, CheckCircle2, CircleAlert, Clock3, PlugZap, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { detectionApi } from '../api/detection';
import type { ProviderHealth, ProviderStatus } from '../types/provider';

const statusLabel: Record<ProviderStatus, string> = {
  connected: 'Connected',
  not_configured: 'Not configured',
  unavailable: 'Unavailable',
  error: 'Error',
  disabled: 'Disabled',
};

export default function IntegrationsPage() {
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    detectionApi.getIntegrations()
      .then(setProviders)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load integration status.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return <main className="integrations-shell">
    <header className="integrations-header">
      <a className="brands-back" href="/"><ArrowLeft size={15} /> Vikral overview</a>
      <span className="brands-header-meta"><span className="eyebrow-dot" /> Data Sources <span className="header-divider" /> Phase 7</span>
    </header>
    <section className="integrations-content" aria-labelledby="integrations-title">
      <div className="integrations-intro">
        <div><p className="page-eyebrow">Evidence provenance</p><h1 id="integrations-title">Data Sources</h1><p>See which authorized provider adapters are available. Manual analysis remains active when no provider is configured.</p></div>
        <button className="icon-button" type="button" onClick={load} aria-label="Refresh data source status" disabled={loading}><RefreshCw size={16} className={loading ? 'integrations-spin' : ''} /></button>
      </div>
      {error && <div className="status-message status-message--error" role="alert"><CircleAlert size={16} /> {error}</div>}
      <section className="integration-panel">
        <div className="section-heading"><div><p className="section-kicker">Configured providers</p><h2>Integration health</h2></div><PlugZap size={20} /></div>
        {loading ? <div className="integration-empty">Loading provider status...</div> : providers.length === 0 ? <div className="integration-empty">No provider adapters are registered.</div> : <div className="integration-list">{providers.map((provider) => <article className="integration-card" key={provider.providerId}>
          <div className="integration-card-heading"><div><h3>{provider.displayName}</h3><p>{provider.providerId}</p></div><span className={`integration-status integration-status--${provider.status}`}><CheckCircle2 size={14} /> {statusLabel[provider.status]}</span></div>
          <dl><div><dt>Supported data</dt><dd>{provider.capabilities.join(', ')}</dd></div><div><dt>Configuration</dt><dd>{provider.configurationRequired ? 'Server configuration required' : 'No credentials required'}</dd></div><div><dt>Last successful sync</dt><dd>{provider.lastSuccessfulSync ? new Date(provider.lastSuccessfulSync).toLocaleString() : 'None'}</dd></div></dl>
          {provider.lastError && <p className="integration-note"><CircleAlert size={14} /> {provider.lastError}</p>}
          {provider.status === 'disabled' && <p className="integration-note"><Clock3 size={14} /> This adapter is isolated for automated tests and is not a production intelligence source.</p>}
        </article>)}</div>}
      </section>
      <section className="integration-panel integration-panel--note"><p className="section-kicker">Current limits</p><h2>Manual evidence stays available</h2><p>Vikral does not scrape private accounts, bypass access controls, or fetch submitted URLs. Provider credentials belong in backend environment variables and are never returned to the browser.</p></section>
    </section>
  </main>;
}
