import { AlertTriangle, CheckCircle2, CircleAlert, Clock3, ExternalLink, ShieldCheck } from 'lucide-react';
import type { DetectionResult, DetectionSignal } from '../types/detection';

type AnalysisResultProps = {
  result: DetectionResult | null;
  emptyTitle?: string;
  emptyDescription?: string;
};

const aiFailureStatuses = new Set(['disabled', 'not_configured', 'timeout', 'error', 'invalid_response', 'unavailable', 'failed']);

function label(value: string) {
  return value.replaceAll('_', ' ');
}

function safeScore(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function EvidenceValue({ value }: { value: string }) {
  return isHttpUrl(value)
    ? <a className="analysis-evidence-link" href={value} target="_blank" rel="noreferrer">{value}<ExternalLink size={12} aria-hidden="true" /></a>
    : <span>{value}</span>;
}

function EvidenceRow({ signal }: { signal: DetectionSignal }) {
  const hasEvidence = Boolean(signal.evidenceValue || signal.evidenceSource);
  if (!hasEvidence) return null;
  return <details className="analysis-evidence-row">
    <summary><span><strong>{label(signal.code)}</strong><small>{signal.category || 'Signal evidence'}</small></span><span className="analysis-evidence-status">Supplied evidence</span></summary>
    <div className="analysis-evidence-detail">
      {signal.evidenceValue && <p><b>Evidence</b><EvidenceValue value={signal.evidenceValue} /></p>}
      {signal.evidenceSource && <p><b>Source</b><span>{signal.evidenceSource}</span></p>}
      <p><b>Why it matters</b><span>{signal.explanation}</span></p>
      <p><b>Verification</b><span>Not independently verified by Vikral.</span></p>
    </div>
  </details>;
}

function SignalChart({ signals }: { signals: DetectionSignal[] }) {
  const contributions = signals.map((signal) => signal.contribution).filter(Number.isFinite);
  const maxContribution = Math.max(...contributions, 0);
  const hasContributions = contributions.length === signals.length && signals.length > 0;
  return <div className="analysis-signal-chart">
    {signals.map((signal) => {
      const contribution = Number.isFinite(signal.contribution) ? signal.contribution : null;
      const width = contribution !== null && maxContribution > 0 ? Math.max(8, (Math.abs(contribution) / maxContribution) * 100) : 0;
      return <div className="analysis-signal" key={signal.code}>
        <div className="analysis-signal-heading"><strong>{label(signal.code)}</strong>{contribution !== null && <b>{contribution > 0 ? '+' : ''}{contribution}</b>}</div>
        {hasContributions && <div className="analysis-signal-track" role="img" aria-label={`${label(signal.code)} contributes ${contribution} points`}><span style={{ width: `${width}%` }} /></div>}
        <p>{signal.explanation}</p>
      </div>;
    })}
  </div>;
}

function AiAnalysis({ ai, limitations }: { ai: DetectionResult['aiAnalysis']; limitations: string[] }) {
  const findings = Array.isArray(ai.contextualFindings) ? ai.contextualFindings : [];
  const missingEvidence = Array.isArray(ai.missingEvidence) ? ai.missingEvidence : [];
  const hasAiContent = Boolean(ai.summary || findings.length || missingEvidence.length || limitations.length);
  const statusCopy = ai.status === 'completed' ? 'AI interpretation completed' : aiFailureStatuses.has(ai.status) ? 'Deterministic result preserved' : 'AI status unavailable';
  return <section className="analysis-section analysis-ai" aria-labelledby="analysis-ai-title">
    <div className="analysis-section-heading"><div><span className="analysis-kicker">Interpretation layer</span><h3 id="analysis-ai-title">AI contextual analysis</h3></div><span className={`analysis-status analysis-status--${ai.status}`}><span aria-hidden="true" />{statusCopy}</span></div>
    <p className="analysis-disclaimer">AI interpretation is separate from the deterministic engine and uses only evidence included in this response.</p>
    {ai.summary && <p className="analysis-ai-summary">{ai.summary}</p>}
    {findings.map((finding) => { const supportingEvidence = Array.isArray(finding.supportingEvidence) ? finding.supportingEvidence : []; const findingLimitations = Array.isArray(finding.limitations) ? finding.limitations : []; return <article className="analysis-finding" key={finding.code}><div><strong>{label(finding.code)}</strong><p>{finding.explanation}</p></div>{supportingEvidence.length > 0 && <p className="analysis-reference"><b>Evidence references</b>{supportingEvidence.join(', ')}</p>}{findingLimitations.length > 0 && <p className="analysis-reference"><b>Finding limitations</b>{findingLimitations.join(' ')}</p>}</article>; })}
    {missingEvidence.length > 0 && <div className="analysis-note"><b>Missing evidence</b><span>{missingEvidence.join(' ')}</span></div>}
    {!hasAiContent && <p className="analysis-muted">No contextual analysis was supplied for this response.</p>}
  </section>;
}

export default function AnalysisResult({ result, emptyTitle = 'Analysis appears here', emptyDescription = 'Submit a candidate to review signals, evidence, and next actions.' }: AnalysisResultProps) {
  if (!result) return <section className="analysis-result analysis-result--empty"><ShieldCheck size={30} aria-hidden="true" /><h2>{emptyTitle}</h2><p>{emptyDescription}</p></section>;

  const score = safeScore(result.finalPriorityScore);
  const exclusion = result.trustedAssetExclusion || { excluded: false };
  const excluded = exclusion.excluded;
  const signals = Array.isArray(result.deterministicSignals) ? result.deterministicSignals : [];
  const limitations = Array.isArray(result.limitations) ? result.limitations : [];
  const ai = result.aiAnalysis || { status: 'unavailable' as const, contextualFindings: [], missingEvidence: [] };
  const candidate = result.candidate || { candidateName: 'Unnamed candidate', sourceType: 'website' as const };
  const platform = candidate.platform || label(result.sourceType);
  const recommendation = ai.recommendation === 'monitor'
    ? 'Continue monitoring the submitted evidence.'
    : ai.recommendation === 'review'
      ? 'Compare the candidate with registered official assets and gather independent evidence before escalation.'
      : 'Review missing evidence and any domain or identifier mismatch before deciding on escalation.';

  return <section className="analysis-result" aria-label="Threat analysis result">
    <header className="analysis-hero">
      <div className="analysis-identity"><span className="analysis-kicker">Threat analysis result</span><h2>{candidate.candidateName || 'Unnamed candidate'}</h2><p>{candidate.handle || 'No handle provided'} <span aria-hidden="true">·</span> {platform} <span aria-hidden="true">·</span> {result.matchedBrand?.name || 'Brand unavailable'}</p></div>
      <div className={`analysis-score analysis-score--${result.priority}`} aria-label={score === null ? `Review priority ${result.priority}, score unavailable` : `Review priority score ${score} of 100`}><div className="analysis-score-ring" style={{ '--score-angle': `${(score ?? 0) * 3.6}deg` } as React.CSSProperties}><strong>{excluded ? '—' : score ?? '—'}</strong><span>/ 100</span></div><small>Review priority</small></div>
    </header>
    <div className="analysis-meta" aria-label="Analysis summary"><span><b>Priority</b><strong>{label(result.priority)}</strong></span><span><b>Signals</b><strong>{signals.length}</strong></span><span><b>Source</b><strong>{platform}</strong></span><span><b>Analyzed</b><strong>{result.analyzedAt && !Number.isNaN(Date.parse(result.analyzedAt)) ? new Date(result.analyzedAt).toLocaleString() : 'Unavailable'}</strong></span></div>
    {excluded ? <div className="analysis-callout analysis-callout--success"><CheckCircle2 size={18} aria-hidden="true" /><span><b>Trusted asset excluded</b><small>{exclusion.matchedAsset || 'Matched registered asset'}: {exclusion.reason || 'The candidate matched a trusted asset.'} Manual status is not independent authenticity proof.</small></span></div> : <div className="analysis-callout analysis-callout--review"><AlertTriangle size={18} aria-hidden="true" /><span>Review priority only. This result does not establish that the candidate is fraudulent or malicious.</span></div>}
    <section className="analysis-section" aria-labelledby="analysis-signals-title"><div className="analysis-section-heading"><div><span className="analysis-kicker">Deterministic engine</span><h3 id="analysis-signals-title">Signal contribution</h3></div><span className="analysis-count">{signals.length} returned</span></div>{signals.length ? <SignalChart signals={signals} /> : <p className="analysis-muted">No supported suspicious signals were returned.</p>}</section>
    <section className="analysis-section" aria-labelledby="analysis-evidence-title"><div className="analysis-section-heading"><div><span className="analysis-kicker">Evidence explorer</span><h3 id="analysis-evidence-title">What supports this result</h3></div></div>{signals.some((signal) => signal.evidenceValue || signal.evidenceSource) ? <div className="analysis-evidence-list">{signals.map((signal) => <EvidenceRow signal={signal} key={`${signal.code}-evidence`} />)}</div> : <p className="analysis-muted">No evidence references were supplied in this response. Missing evidence is not confirmation of absence.</p>}</section>
    <AiAnalysis ai={ai} limitations={limitations} />
    <section className="analysis-section" aria-labelledby="analysis-next-title"><div className="analysis-section-heading"><div><span className="analysis-kicker">Review guidance</span><h3 id="analysis-next-title">Recommended next actions</h3></div><Clock3 size={17} aria-hidden="true" /></div><p className="analysis-recommendation">{recommendation}</p></section>
    {limitations.length > 0 && <section className="analysis-section" aria-labelledby="analysis-limitations-title"><div className="analysis-section-heading"><div><span className="analysis-kicker">Boundaries</span><h3 id="analysis-limitations-title">Limitations</h3></div><CircleAlert size={17} aria-hidden="true" /></div><ul className="analysis-limitations">{limitations.map((item) => <li key={item}>{item}</li>)}</ul></section>}
  </section>;
}