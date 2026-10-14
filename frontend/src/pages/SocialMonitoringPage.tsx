import { ArrowLeft, CircleAlert, Clock3, Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { detectionApi } from '../api/detection';
import type { Brand } from '../types/brand';
import type { CandidateInput, DetectionResult } from '../types/detection';
import type { BlueskyProfile } from '../types/provider';
import AnalysisResult from '../components/AnalysisResult';

const platforms = ['Instagram', 'Facebook', 'X', 'LinkedIn', 'YouTube', 'TikTok', 'Other'];
const blankCandidate: CandidateInput = { sourceType: 'social', candidateName: '', handle: '', url: '', description: '', platform: '' };

export default function SocialMonitoringPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState('');
  const [candidate, setCandidate] = useState<CandidateInput>(blankCandidate);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [recent, setRecent] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [blueskyQuery, setBlueskyQuery] = useState('');
  const [blueskyProfiles, setBlueskyProfiles] = useState<BlueskyProfile[]>([]);
  const [blueskySearching, setBlueskySearching] = useState(false);
  const [blueskyError, setBlueskyError] = useState('');
  const [selectedBlueskyProfile, setSelectedBlueskyProfile] = useState('');

  useEffect(() => {
    Promise.all([detectionApi.listBrands(), detectionApi.listAnalyses()])
      .then(([brandItems, analyses]) => {
        setBrands(brandItems);
        setBrandId(brandItems[0]?.id ?? '');
        setRecent(analyses);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load monitoring data.'))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: keyof CandidateInput, value: string) => setCandidate((current) => ({ ...current, [field]: value }));
  const analyze = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setAnalyzing(true);
    try {
      const analysis = await detectionApi.analyze(brandId, {
        ...candidate,
        handle: candidate.handle?.trim() || undefined,
        url: candidate.url?.trim() || undefined,
        description: candidate.description?.trim() || undefined,
        platform: candidate.platform?.trim() || undefined,
        observedAt: candidate.observedAt || undefined,
      });
      setResult(analysis);
      setRecent((current) => [analysis, ...current.filter((item) => item.analysisId !== analysis.analysisId)]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to analyze the submitted profile.');
    } finally {
      setAnalyzing(false);
    }
  };

  const showAnalysis = async (analysisId: string) => {
    setHistoryError('');
    try {
      setResult(await detectionApi.getAnalysis(analysisId));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (cause) {
      setHistoryError(cause instanceof Error ? cause.message : 'Unable to open this analysis.');
    }
  };

  const searchBluesky = async (event: React.FormEvent) => {
    event.preventDefault();
    setBlueskyError('');
    setBlueskyProfiles([]);
    setBlueskySearching(true);
    try {
      setBlueskyProfiles(await detectionApi.searchBlueskyProfiles(blueskyQuery, 10));
    } catch (cause) {
      setBlueskyError(cause instanceof Error ? cause.message : 'Unable to search Bluesky public profiles.');
    } finally {
      setBlueskySearching(false);
    }
  };

  const analyzeBluesky = async (profile: BlueskyProfile) => {
    setBlueskyError('');
    setSelectedBlueskyProfile(profile.selectionId);
    setAnalyzing(true);
    try {
      const analysis = await detectionApi.analyzeBlueskyProfile(brandId, profile.selectionId);
      setResult(analysis);
      setRecent((current) => [analysis, ...current.filter((item) => item.analysisId !== analysis.analysisId)]);
    } catch (cause) {
      setBlueskyError(cause instanceof Error ? cause.message : 'Unable to analyze the Bluesky profile.');
    } finally {
      setAnalyzing(false);
      setSelectedBlueskyProfile('');
    }
  };

  return <main className="monitoring-shell">
    <header className="monitoring-header">
      <a className="brands-back" href="/"><ArrowLeft size={15} /> Vikral overview</a>
      <span className="brands-header-meta"><span className="eyebrow-dot" /> Social Monitoring <span className="header-divider" /> Phase 4</span>
    </header>
    <section className="monitoring-content" aria-labelledby="monitoring-title">
      <div className="monitoring-intro">
        <p className="page-eyebrow">Manual profile assessment</p>
        <h1 id="monitoring-title">Social Monitoring</h1>
        <p>Analyze submitted social profile information for potential brand impersonation. Vikral does not fetch or independently verify profile URLs.</p>
        <button className="button button-primary" type="button" onClick={() => document.getElementById('social-analysis-form')?.scrollIntoView({ behavior: 'smooth' })}>
          Start a new analysis <Search size={15} />
        </button>
      </div>
      {error && <div className="status-message status-message--error" role="alert"><CircleAlert size={16} /> {error}</div>}
      <section className="bluesky-search-panel" aria-labelledby="bluesky-search-title">
        <div className="section-heading"><div><p className="section-kicker">Live public source</p><h2 id="bluesky-search-title">Search Bluesky profiles</h2></div><Search size={20} /></div>
        <p className="monitoring-note">Searches Bluesky's public AppView API. Results are retrieved profile metadata, not proof of ownership, authenticity, or safety.</p>
        <form className="bluesky-search-form" onSubmit={searchBluesky}>
          <label>Profile name or handle<input required maxLength={100} value={blueskyQuery} onChange={(event) => setBlueskyQuery(event.target.value)} placeholder="brand or handle" /></label>
          <button className="button button-primary" type="submit" disabled={blueskySearching}>{blueskySearching ? 'Searching Bluesky...' : 'Search Bluesky'}</button>
        </form>
        {blueskyError && <p className="history-error" role="alert">{blueskyError}</p>}
        {!blueskySearching && blueskyQuery && !blueskyError && blueskyProfiles.length === 0 && <div className="bluesky-empty">No public Bluesky profiles matched this search.</div>}
        {blueskyProfiles.length > 0 && <div className="bluesky-results">{blueskyProfiles.map((profile) => <article className="bluesky-result" key={profile.selectionId}><div><strong>{profile.displayName || profile.handle}</strong><span>@{profile.handle}</span>{profile.description && <p>{profile.description}</p>}<small>Retrieved from Bluesky public API · {profile.did}</small></div><button className="button button-secondary" type="button" disabled={!brandId || analyzing} onClick={() => void analyzeBluesky(profile)}>{selectedBlueskyProfile === profile.selectionId ? 'Analyzing...' : 'Analyze profile'}</button></article>)}</div>}
      </section>
      <div className="monitoring-layout">
        <form className="monitoring-form" id="social-analysis-form" onSubmit={analyze}>
          <div className="form-heading"><div><p className="section-kicker">Profile analysis</p><h2>Review a submission</h2></div><Search size={20} /></div>
          <label>Registered brand<select required value={brandId} onChange={(event) => setBrandId(event.target.value)} disabled={loading || brands.length === 0}><option value="">Select a brand</option>{brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}</select></label>
          <div className="form-grid">
            <label>Platform<select required value={candidate.platform} onChange={(event) => update('platform', event.target.value)}><option value="">Select a platform</option>{platforms.map((platform) => <option value={platform} key={platform}>{platform}</option>)}</select></label>
            <label>Candidate profile name<input required maxLength={200} value={candidate.candidateName} onChange={(event) => update('candidateName', event.target.value)} /></label>
            <label>Username or handle <span className="optional-label">(optional)</span><input maxLength={200} placeholder="@handle" value={candidate.handle} onChange={(event) => update('handle', event.target.value)} /></label>
            <label>Profile URL <span className="optional-label">(optional)</span><input type="url" placeholder="https://" value={candidate.url} onChange={(event) => update('url', event.target.value)} /></label>
            <label>Observed date/time <span className="optional-label">(optional)</span><input type="datetime-local" value={candidate.observedAt ? candidate.observedAt.slice(0, 16) : ''} onChange={(event) => update('observedAt', event.target.value ? new Date(event.target.value).toISOString() : '')} /></label>
          </div>
          <label>Profile description or bio <span className="optional-label">(optional)</span><textarea rows={5} maxLength={2000} value={candidate.description} onChange={(event) => update('description', event.target.value)} /></label>
          <p className="monitoring-note">This is a user-submitted assessment. URLs and descriptions are treated as evidence text; Vikral does not visit or execute them.</p>
          <button className="button button-primary" type="submit" disabled={loading || analyzing || !brandId}>{analyzing ? 'Analyzing profile...' : 'Analyze profile'}</button>
        </form>
        <AnalysisResult result={result} emptyTitle="Analysis appears here" emptyDescription="Submit profile details to review signals, evidence, and recommended next action." />
      </div>
      <section className="recent-analyses" aria-labelledby="recent-title">
        <div className="section-heading"><div><p className="section-kicker">Persisted history</p><h2 id="recent-title">Recent analyses</h2></div><Clock3 size={19} /></div>
        {historyError && <p className="history-error" role="alert">{historyError}</p>}
        {!recent.length ? <div className="monitoring-empty"><Clock3 size={22} /><p>No submitted analyses yet.</p><span>Completed profile reviews will appear here.</span></div> : <div className="analysis-history">{recent.map((analysis) => <button className="analysis-history-row" type="button" key={analysis.analysisId} onClick={() => void showAnalysis(analysis.analysisId)}><span><strong>{analysis.candidate.candidateName}</strong><small>{analysis.candidate.platform || 'Social'} · {analysis.candidate.handle || 'No handle'} · {analysis.matchedBrand.name}</small></span><span className={`history-score history-score--${analysis.priority}`}>{analysis.trustedAssetExclusion.excluded ? 'Excluded' : `${analysis.finalPriorityScore}/100`}<small>{analysis.priority}</small></span><Eye size={16} /></button>)}</div>}
      </section>
    </section>
  </main>;
}

