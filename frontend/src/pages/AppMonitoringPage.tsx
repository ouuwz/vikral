import { AlertTriangle, ArrowLeft, CheckCircle2, CircleAlert, Clock3, Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { detectionApi } from '../api/detection';
import type { Brand } from '../types/brand';
import type { CandidateInput, DetectionResult } from '../types/detection';
import type { AppleAppListing } from '../types/provider';
import AnalysisResult from '../components/AnalysisResult';

const blankCandidate: CandidateInput = { sourceType: 'mobile_app', candidateName: '', platform: '', publisher: '', packageId: '', bundleId: '', url: '', description: '' };

export default function AppMonitoringPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState('');
  const [candidate, setCandidate] = useState<CandidateInput>(blankCandidate);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [recent, setRecent] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [appleTerm, setAppleTerm] = useState('');
  const [appleCountry, setAppleCountry] = useState('US');
  const [appleLimit, setAppleLimit] = useState('5');
  const [appleListings, setAppleListings] = useState<AppleAppListing[]>([]);
  const [appleSearching, setAppleSearching] = useState(false);
  const [appleError, setAppleError] = useState('');
  const [selectedAppleSelectionId, setSelectedAppleSelectionId] = useState('');

  useEffect(() => {
    Promise.all([detectionApi.listBrands(), detectionApi.listAnalyses()])
      .then(([brandItems, analyses]) => {
        setBrands(brandItems);
        setBrandId(brandItems[0]?.id ?? '');
        setRecent(analyses.filter((analysis) => analysis.sourceType === 'mobile_app'));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load application monitoring data.'))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: keyof CandidateInput, value: string) => {
    setSelectedAppleSelectionId('');
    setCandidate((current) => ({ ...current, [field]: value }));
  };
  const analyze = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setAnalyzing(true);
    try {
      const analysis = selectedAppleSelectionId
        ? await detectionApi.analyzeAppleApp(brandId, selectedAppleSelectionId)
        : await detectionApi.analyze(brandId, {
          ...candidate,
          publisher: candidate.publisher?.trim() || undefined,
          packageId: candidate.packageId?.trim() || undefined,
          bundleId: candidate.bundleId?.trim() || undefined,
          url: candidate.url?.trim() || undefined,
          description: candidate.description?.trim() || undefined,
          platform: candidate.platform?.trim() || undefined,
          observedAt: candidate.observedAt || undefined,
        });
      setResult(analysis);
      setRecent((current) => [analysis, ...current.filter((item) => item.analysisId !== analysis.analysisId)]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to analyze the submitted application.');
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

  const searchApple = async (event: React.FormEvent) => {
    event.preventDefault();
    setAppleError('');
    setAppleListings([]);
    setAppleSearching(true);
    try {
      setAppleListings(await detectionApi.searchAppleApps(appleTerm, appleCountry, Number(appleLimit)));
    } catch (cause) {
      setAppleError(cause instanceof Error ? cause.message : 'Unable to search the Apple App Store.');
    } finally {
      setAppleSearching(false);
    }
  };

  const useAppleListing = (listing: AppleAppListing) => {
    setCandidate({
      sourceType: 'mobile_app',
      candidateName: listing.appName,
      platform: listing.platform,
      publisher: listing.publisher,
      bundleId: listing.bundleId ?? '',
      packageId: '',
      url: listing.listingUrl ?? '',
      description: listing.genre ? `Apple category: ${listing.genre}` : '',
      observedAt: listing.collectionTime,
    });
    setSelectedAppleSelectionId(listing.selectionId);
    setAppleError('');
    document.getElementById('app-analysis-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const analyzeSelectedAppleListing = async (listing: AppleAppListing) => {
    if (!brandId) return;
    setError('');
    setResult(null);
    setAnalyzing(true);
    try {
      const analysis = await detectionApi.analyzeAppleApp(brandId, listing.selectionId);
      setSelectedAppleSelectionId(listing.selectionId);
      setResult(analysis);
      setRecent((current) => [analysis, ...current.filter((item) => item.analysisId !== analysis.analysisId)]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to analyze the Apple listing.');
    } finally {
      setAnalyzing(false);
    }
  };

  return <main className="app-monitoring-shell">
    <header className="app-monitoring-header"><a className="brands-back" href="/"><ArrowLeft size={15} /> Vikral overview</a><span className="brands-header-meta"><span className="eyebrow-dot" /> App Monitoring <span className="header-divider" /> Phase 5</span></header>
    <section className="app-monitoring-content" aria-labelledby="app-monitoring-title">
      <div className="app-monitoring-intro"><p className="page-eyebrow">Application assessment</p><h1 id="app-monitoring-title">Mobile App Monitoring</h1><p>Search Apple's public App Store catalog or submit Android and iOS metadata for potential brand impersonation. Vikral does not independently verify store listings.</p><button className="button button-primary" type="button" onClick={() => document.getElementById('app-analysis-form')?.scrollIntoView({ behavior: 'smooth' })}>Start a new analysis <Search size={15} /></button></div>
      {error && <div className="status-message status-message--error" role="alert"><CircleAlert size={16} /> {error}</div>}
      {!loading && brands.length === 0 && <div className="status-message status-message--notice" role="status"><CircleAlert size={16} /><span>No saved brand profile is available yet. <a href="/brands">Create a brand profile</a> before analyzing an Apple listing or submitting app metadata.</span></div>}
      <section className="apple-search-panel" aria-labelledby="apple-search-title">
        <div className="section-heading"><div><p className="section-kicker">Authorized provider</p><h2 id="apple-search-title">Search Apple App Store</h2></div><Search size={20} /></div>
        <p className="app-monitoring-note">Searches Apple's public iTunes Search API only. Returned listings are provider evidence, not proof of authenticity or safety.</p>
        <form className="apple-search-form" onSubmit={searchApple}>
          <label>Search term<input required maxLength={100} value={appleTerm} onChange={(event) => setAppleTerm(event.target.value)} placeholder="App or publisher name" /></label>
          <label>Storefront<input required maxLength={2} value={appleCountry} onChange={(event) => setAppleCountry(event.target.value.toUpperCase())} placeholder="US" /></label>
          <label>Results<select value={appleLimit} onChange={(event) => setAppleLimit(event.target.value)}><option value="1">1</option><option value="3">3</option><option value="5">5</option><option value="10">10</option></select></label>
          <button className="button button-primary" type="submit" disabled={appleSearching}>{appleSearching ? 'Searching Apple...' : 'Search Apple'}</button>
        </form>
        {appleError && <p className="history-error" role="alert">{appleError}</p>}
        {!appleSearching && appleTerm && !appleError && appleListings.length === 0 && <div className="apple-empty">No Apple App Store listings matched this search.</div>}
        {appleListings.length > 0 && <div className="apple-results">{appleListings.map((listing) => <article className="apple-result" key={listing.selectionId}><div><strong>{listing.appName}</strong><span>{listing.publisher}{listing.bundleId ? ` · ${listing.bundleId}` : ''}</span><small>{listing.genre ?? 'Software'} · Apple App Store · {new Date(listing.collectionTime).toLocaleString()}</small></div><div className="apple-result-actions"><button className="button button-secondary" type="button" onClick={() => useAppleListing(listing)}>Use metadata</button><button className="button button-primary" type="button" disabled={!brandId || analyzing} title={!brandId ? 'Create a brand profile before analyzing a listing.' : undefined} onClick={() => void analyzeSelectedAppleListing(listing)}>Analyze listing</button></div></article>)}</div>}
      </section>
      <div className="app-monitoring-layout">
        <form className="app-monitoring-form" id="app-analysis-form" onSubmit={analyze}>
          <div className="form-heading"><div><p className="section-kicker">Application analysis</p><h2>Review a submission</h2></div><Search size={20} /></div>
          <label>Registered brand<select required value={brandId} onChange={(event) => setBrandId(event.target.value)} disabled={loading || brands.length === 0}><option value="">Select a brand</option>{brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}</select></label>
          <div className="form-grid">
            <label>Platform<select required value={candidate.platform} onChange={(event) => update('platform', event.target.value)}><option value="">Select a platform</option><option>Android</option><option>iOS</option><option>Other</option></select></label>
            <label>App name<input required maxLength={200} value={candidate.candidateName} onChange={(event) => update('candidateName', event.target.value)} /></label>
            <label>Package ID <span className="optional-label">(optional)</span><input maxLength={160} placeholder="com.example.application" value={candidate.packageId} onChange={(event) => update('packageId', event.target.value)} /></label>
            <label>Bundle ID <span className="optional-label">(optional)</span><input maxLength={160} placeholder="com.example.application" value={candidate.bundleId} onChange={(event) => update('bundleId', event.target.value)} /></label>
            <label>Publisher or developer <span className="optional-label">(optional)</span><input maxLength={160} value={candidate.publisher} onChange={(event) => update('publisher', event.target.value)} /></label>
            <label>Store URL <span className="optional-label">(optional)</span><input type="url" placeholder="https://" value={candidate.url} onChange={(event) => update('url', event.target.value)} /></label>
            <label>Observed date/time <span className="optional-label">(optional)</span><input type="datetime-local" value={candidate.observedAt ? candidate.observedAt.slice(0, 16) : ''} onChange={(event) => update('observedAt', event.target.value ? new Date(event.target.value).toISOString() : '')} /></label>
          </div>
          <label>Description <span className="optional-label">(optional)</span><textarea rows={5} maxLength={2000} value={candidate.description} onChange={(event) => update('description', event.target.value)} /></label>
          <p className="app-monitoring-note">Manual submissions and Apple catalog results are treated as evidence, not authenticity proof. Vikral does not visit or execute submitted URLs.</p>
          <button className="button button-primary" type="submit" disabled={loading || analyzing || !brandId} title={!brandId ? 'Create a brand profile before submitting metadata.' : undefined}>{analyzing ? 'Analyzing application...' : 'Analyze application'}</button>
        </form>
        <AnalysisResult result={result} emptyTitle="Analysis appears here" emptyDescription="Submit app metadata to review signals, evidence, and recommended next action." />
      </div>
      <section className="app-recent-analyses" aria-labelledby="app-recent-title"><div className="section-heading"><div><p className="section-kicker">Persisted history</p><h2 id="app-recent-title">Recent application analyses</h2></div><Clock3 size={19} /></div>{historyError && <p className="history-error" role="alert">{historyError}</p>}{!recent.length ? <div className="app-monitoring-empty"><Clock3 size={22} /><p>No application analyses yet.</p><span>Completed app reviews will appear here.</span></div> : <div className="analysis-history">{recent.map((analysis) => <button className="analysis-history-row" type="button" key={analysis.analysisId} onClick={() => void showAnalysis(analysis.analysisId)}><span><strong>{analysis.candidate.candidateName}</strong><small>{analysis.candidate.platform || 'App'} · {analysis.candidate.packageId || analysis.candidate.bundleId || 'No identifier'} · {analysis.matchedBrand.name}</small></span><span className={`history-score history-score--${analysis.priority}`}>{analysis.trustedAssetExclusion.excluded ? 'Excluded' : `${analysis.finalPriorityScore}/100`}<small>{analysis.priority}</small></span><Eye size={16} /></button>)}</div>}</section>
    </section>
  </main>;
}

function AppResult({ result }: { result: DetectionResult | null }) {
  if (!result) return <section className="app-monitoring-result app-monitoring-result--empty"><CheckCircle2 size={30} /><h2>Analysis appears here</h2><p>Submit app metadata to review signals, score, limitations, and recommended next action.</p></section>;
  const excluded = result.trustedAssetExclusion.excluded;
  return <section className="app-monitoring-result"><div className="result-heading"><div><p className="section-kicker">Analysis result</p><h2>{excluded ? 'Trusted app excluded' : `${result.priority} review priority`}</h2></div><div className={`risk-score risk-score--${result.priority}`}>{excluded ? '—' : result.finalPriorityScore}<small>{excluded ? 'excluded' : 'of 100'}</small></div></div>{excluded ? <div className="exclusion-callout"><CheckCircle2 size={18} /><span><strong>{result.trustedAssetExclusion.matchedAsset}</strong><small>{result.trustedAssetExclusion.reason} Manual status is not independent authenticity proof.</small></span></div> : <div className="result-summary"><AlertTriangle size={18} /><span>Review priority only; this result does not establish that the application is fraudulent.</span></div>}<div className="result-section"><h3>Submitted application <span>{result.candidate.platform}</span></h3><p className="app-result-metadata"><strong>{result.candidate.candidateName}</strong><span>{result.candidate.publisher || 'Publisher not provided'}</span><span>{result.candidate.packageId || result.candidate.bundleId || 'No package or bundle ID provided'}</span></p></div><div className="result-section"><h3>Detected signals <span>{result.deterministicSignals.length}</span></h3>{result.deterministicSignals.length ? <div className="signal-list">{result.deterministicSignals.map((signal) => <div className="signal-row" key={signal.code}><span><strong>{signal.code.replaceAll('_', ' ')}</strong><small>{signal.explanation}</small></span><b>+{signal.contribution}</b></div>)}</div> : <p className="muted">No supported suspicious signals were found.</p>}</div><div className="result-section"><h3>AI context <span>{result.aiAnalysis.status}</span></h3><p className="muted">{result.aiAnalysis.summary}</p>{result.aiAnalysis.contextualFindings.map((finding) => <div className="ai-finding" key={finding.code}><strong>{finding.code.replaceAll('_', ' ')}</strong><p>{finding.explanation}</p><small>Evidence: {finding.supportingEvidence.join(', ') || 'None referenced'}</small></div>)}{result.aiAnalysis.missingEvidence.length > 0 && <p className="muted">Missing evidence: {result.aiAnalysis.missingEvidence.join(' ')}</p>}</div><div className="result-section"><h3>Recommended next action</h3><p className="muted">{result.aiAnalysis.recommendation === 'review' ? 'Review the application and gather additional evidence.' : result.aiAnalysis.recommendation === 'monitor' ? 'Continue monitoring the submitted evidence.' : 'Insufficient evidence for a stronger recommendation.'}</p></div><div className="result-section"><h3>Limitations</h3><ul className="limitations">{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div></section>;
}
