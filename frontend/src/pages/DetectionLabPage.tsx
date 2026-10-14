import { ArrowLeft, CircleAlert, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { detectionApi } from '../api/detection';
import type { Brand } from '../types/brand';
import type { CandidateInput, DetectionResult, DetectionSourceType } from '../types/detection';
import AnalysisResult from '../components/AnalysisResult';

const blankCandidate: CandidateInput = { sourceType: 'social', candidateName: '', handle: '', url: '', description: '', publisher: '', packageId: '', bundleId: '', platform: '' };

export default function DetectionLabPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState('');
  const [candidate, setCandidate] = useState<CandidateInput>(blankCandidate);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    detectionApi.listBrands().then((items) => { setBrands(items); setBrandId(items[0]?.id ?? ''); }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load brands.')).finally(() => setLoading(false));
  }, []);

  const update = (field: keyof CandidateInput, value: string) => setCandidate((current) => ({ ...current, [field]: value }));
  const analyze = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setResult(null); setAnalyzing(true);
    try { setResult(await detectionApi.analyze(brandId, candidate)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to analyze candidate.'); } finally { setAnalyzing(false); }
  };

  return <main className="detection-shell">
    <header className="detection-header"><a className="brands-back" href="/brands"><ArrowLeft size={15} /> Brand Profiles</a><span className="brands-header-meta"><span className="eyebrow-dot" /> Detection Lab <span className="header-divider" /> Phase 3</span></header>
    <section className="detection-content" aria-labelledby="detection-title">
      <div className="detection-intro"><p className="page-eyebrow">Explainable threat assessment</p><h1 id="detection-title">Detection Lab</h1><p>Assess a candidate against a saved brand identity using deterministic signals. Results are review priorities, not proof of fraud.</p></div>
      {error && <div className="status-message status-message--error" role="alert"><CircleAlert size={16} /> {error}</div>}
      <div className="detection-layout">
        <form className="detection-form" onSubmit={analyze}><div className="form-heading"><div><p className="section-kicker">Candidate analysis</p><h2>Inspect an asset</h2></div><Search size={20} /></div><label>Protected brand<select required value={brandId} onChange={(event) => setBrandId(event.target.value)} disabled={loading || brands.length === 0}><option value="">Select a brand</option>{brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}</select></label><div className="form-grid"><label>Source type<select value={candidate.sourceType} onChange={(event) => setCandidate({ ...blankCandidate, sourceType: event.target.value as DetectionSourceType })}><option value="social">Social account</option><option value="website">Website</option><option value="mobile_app">Mobile app</option></select></label><label>Candidate name *<input required maxLength={200} value={candidate.candidateName} onChange={(event) => update('candidateName', event.target.value)} /></label><label>Handle<input value={candidate.handle} placeholder="@handle" onChange={(event) => update('handle', event.target.value)} /></label><label>Candidate URL<input type="url" placeholder="https://" value={candidate.url} onChange={(event) => update('url', event.target.value)} /></label><label>Platform<input value={candidate.platform} placeholder="Instagram, website..." onChange={(event) => update('platform', event.target.value)} /></label>{candidate.sourceType === 'mobile_app' && <><label>Publisher<input value={candidate.publisher} onChange={(event) => update('publisher', event.target.value)} /></label><label>Package ID<input value={candidate.packageId} placeholder="com.example.app" onChange={(event) => update('packageId', event.target.value)} /></label><label>Bundle ID<input value={candidate.bundleId} onChange={(event) => update('bundleId', event.target.value)} /></label></>}</div><label>Description<textarea rows={4} maxLength={2000} value={candidate.description} onChange={(event) => update('description', event.target.value)} /></label><p className="detection-note">URLs are analyzed as submitted. Vikral does not fetch candidate URLs or execute their content.</p><button className="button button-primary" type="submit" disabled={analyzing || !brandId}>{analyzing ? 'Analyzing...' : 'Run deterministic analysis'}</button></form>
        <AnalysisResult result={result} emptyTitle="Assessment appears here" emptyDescription="Submit a candidate to review signals, evidence, and recommended next action." />
      </div>
    </section>
  </main>;
}

