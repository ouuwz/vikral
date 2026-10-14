import { Activity, AlertTriangle, ArrowUpRight, BarChart3, CircleAlert, Clock3, Layers3, RefreshCw, ShieldCheck, Smartphone, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { detectionApi } from '../api/detection';
import type { DashboardOverview } from '../types/dashboard';

const labels = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' } as const;
const sources = { social: 'Social monitoring', website: 'Website analysis', mobile_app: 'Mobile app monitoring', other: 'Other analysis' } as const;

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setLoading(true);
    setError('');
    detectionApi.getDashboard().then(setOverview).catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load dashboard data.')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  return <main className="dashboard-shell">
    <header className="dashboard-header"><a className="brands-back" href="/"><ShieldCheck size={16} /> Vikral overview</a><span className="brands-header-meta"><span className="eyebrow-dot" /> Threat Intelligence <span className="header-divider" /> Dashboard</span></header>
    <section className="dashboard-content" aria-labelledby="dashboard-title">
      <div className="dashboard-intro"><div><p className="page-eyebrow">Unified workspace</p><h1 id="dashboard-title">Threat Intelligence</h1><p>Review recorded brand analyses across social and mobile-app monitoring. These figures describe analysis activity and review priority, not confirmed incidents.</p></div><button className="icon-button" type="button" onClick={load} disabled={loading} aria-label="Refresh dashboard"><RefreshCw size={16} className={loading ? 'dashboard-spin' : ''} /></button></div>
      {error && <div className="status-message status-message--error" role="alert"><CircleAlert size={16} /> {error} <button className="dashboard-retry" type="button" onClick={load}>Retry</button></div>}
      {loading && !overview ? <DashboardLoading /> : overview ? <DashboardContent overview={overview} /> : <div className="dashboard-empty"><Activity size={24} /><h2>No dashboard data available</h2><p>Try refreshing the dashboard when the backend is available.</p></div>}
    </section>
  </main>;
}

function DashboardLoading() {
  return <div className="dashboard-loading" aria-label="Loading dashboard"><span /><span /><span /><span /></div>;
}

function DashboardContent({ overview }: { overview: DashboardOverview }) {
  const metricCards = [
    ['Registered brands', overview.metrics.totalBrands, Users],
    ['Recorded analyses', overview.metrics.totalAnalyses, Activity],
    ['High-priority findings', overview.metrics.highPriorityFindings, AlertTriangle],
    ['Critical findings', overview.metrics.criticalPriorityFindings, CircleAlert],
  ] as const;
  const totalRisk = Object.values(overview.riskDistribution).reduce((sum, value) => sum + value, 0);
  const maxTrend = Math.max(...overview.trend.points.map((point) => point.count), 1);
  return <>
    <div className="dashboard-metrics">{metricCards.map(([label, metric, Icon]) => <article className="dashboard-metric" key={label}><Icon size={17} /><strong>{metric.value}</strong><span>{label}</span><small>{metric.definition}</small></article>)}</div>
    <div className="dashboard-quick-actions"><a href="/brands"><Layers3 size={17} /><span>Brand Management</span><ArrowUpRight size={14} /></a><a href="/detection"><BarChart3 size={17} /><span>Detection Lab</span><ArrowUpRight size={14} /></a><a href="/social-monitoring"><Users size={17} /><span>Social Monitoring</span><ArrowUpRight size={14} /></a><a href="/app-monitoring"><Smartphone size={17} /><span>App Monitoring</span><ArrowUpRight size={14} /></a></div>
    <div className="dashboard-grid">
      <section className="dashboard-panel"><div className="dashboard-panel-heading"><div><p className="section-kicker">Risk distribution</p><h2>Recorded priorities</h2></div><span>{totalRisk} analyses</span></div>{totalRisk ? <div className="risk-bars">{(Object.keys(labels) as Array<keyof typeof labels>).map((priority) => <div className="risk-bar" key={priority}><div><span>{labels[priority]}</span><b>{overview.riskDistribution[priority]}</b></div><i><em className={`risk-fill risk-fill--${priority}`} style={{ width: `${Math.max((overview.riskDistribution[priority] / totalRisk) * 100, overview.riskDistribution[priority] ? 4 : 0)}%` }} /></i></div>)}</div> : <PanelEmpty text="No recorded analyses yet." />}</section>
      <section className="dashboard-panel"><div className="dashboard-panel-heading"><div><p className="section-kicker">Source distribution</p><h2>Analysis coverage</h2></div><span>Recorded analyses</span></div>{overview.sourceDistribution.length ? <div className="source-list">{overview.sourceDistribution.map((source) => <div className="source-row" key={source.sourceType}><span>{sources[source.sourceType] ?? source.sourceType}</span><b>{source.count}</b></div>)}</div> : <PanelEmpty text="No source data yet." />}<p className="dashboard-footnote">Counts represent saved analyses, not the number of profiles or apps on the internet.</p></section>
      <section className="dashboard-panel dashboard-panel--wide"><div className="dashboard-panel-heading"><div><p className="section-kicker">Recent activity</p><h2>Latest analyses</h2></div><Clock3 size={18} /></div>{overview.recentAnalyses.length ? <div className="dashboard-activity">{overview.recentAnalyses.map((analysis) => <a className="dashboard-activity-row" href={analysis.sourceType === 'mobile_app' ? '/app-monitoring' : analysis.sourceType === 'social' ? '/social-monitoring' : '/detection'} key={analysis.analysisId}><span><strong>{analysis.candidateName}</strong><small>{analysis.brandName} · {analysis.platform || analysis.sourceType}</small></span><span className={`dashboard-priority dashboard-priority--${analysis.priority}`}>{analysis.score}/100 <small>{analysis.priority}</small></span><time dateTime={analysis.analyzedAt}>{new Date(analysis.analyzedAt).toLocaleString()}</time><ArrowUpRight size={14} /></a>)}</div> : <PanelEmpty text="No recent activity. Completed analyses will appear here." />}</section>
      <section className="dashboard-panel dashboard-panel--wide"><div className="dashboard-panel-heading"><div><p className="section-kicker">Analysis volume</p><h2>Recent trend</h2></div><span>Last {overview.trend.windowDays} days · UTC</span></div>{overview.trend.available ? <div className="trend-chart" aria-label={`Analysis volume over the last ${overview.trend.windowDays} days`}>{overview.trend.points.map((point) => <div className="trend-column" key={point.date}><i style={{ height: `${Math.max((point.count / maxTrend) * 100, 8)}%` }} /><span>{point.count}</span><small>{point.date.slice(5)}</small></div>)}</div> : <PanelEmpty text={overview.trend.message ?? 'More history is needed for a reliable trend.'} />}</section>
    </div>
  </>;
}

function PanelEmpty({ text }: { text: string }) { return <div className="dashboard-panel-empty"><p>{text}</p></div>; }
