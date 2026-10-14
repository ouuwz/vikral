import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Check, ChevronRight, CircleAlert, ExternalLink, Plus, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { brandsApi } from '../api/brands';
import type { AppPlatform, Brand, BrandInput, MobileApp, SocialAccount, SocialPlatform, VerificationStatus } from '../types/brand';

const socialPlatforms: SocialPlatform[] = ['Instagram', 'Facebook', 'X', 'LinkedIn', 'YouTube', 'TikTok'];
const appPlatforms: AppPlatform[] = ['Google Play', 'Apple App Store', 'Other'];
const emptyInput: BrandInput = { name: '', officialWebsite: '', industry: '', description: '', logoUrl: '', aliases: [], trustedDomains: [], socialAccounts: [], mobileApps: [] };
const newSocial = (): SocialAccount => ({ platform: 'Instagram', handle: '', profileUrl: '', verificationStatus: 'unverified', evidenceNote: '' });
const newApp = (): MobileApp => ({ platform: 'Google Play', appName: '', packageId: '', bundleId: '', publisher: '', storeUrl: '', verificationStatus: 'unverified', evidenceNote: '' });

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const label = status === 'verified' ? 'manually marked' : 'unverified';
  return <span className={`verification-badge verification-badge--${status}`}><span aria-hidden="true" />{label}</span>;
}

export default function BrandProfilesPage() {
  const reduceMotion = useReducedMotion();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selected, setSelected] = useState<Brand | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BrandInput>(emptyInput);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setBrands(await brandsApi.list()); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load brand profiles.'); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const openCreate = () => { setSelected(null); setForm({ ...emptyInput }); setEditing(true); setNotice(''); };
  const openEdit = (brand: Brand) => { setSelected(brand); setForm({ ...brand }); setEditing(true); setNotice(''); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const saved = selected ? await brandsApi.update(selected.id, form) : await brandsApi.create(form);
      setBrands((current) => selected ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setSelected(saved); setEditing(false); setNotice(selected ? 'Brand profile updated.' : 'Brand profile created.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save this brand profile.'); } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!selected) return;
    try { await brandsApi.remove(selected.id); setBrands((current) => current.filter((item) => item.id !== selected.id)); setSelected(null); setEditing(false); setConfirmDelete(false); setNotice('Brand profile deleted.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to delete this brand profile.'); setConfirmDelete(false); }
  };
  const updateList = (field: 'aliases' | 'trustedDomains', index: number, value: string) => setForm((current) => ({ ...current, [field]: current[field].map((item, itemIndex) => itemIndex === index ? value : item) }));
  const addList = (field: 'aliases' | 'trustedDomains') => setForm((current) => ({ ...current, [field]: [...current[field], ''] }));
  const removeList = (field: 'aliases' | 'trustedDomains', index: number) => setForm((current) => ({ ...current, [field]: current[field].filter((_, itemIndex) => itemIndex !== index) }));

  return (
    <main className="brands-shell">
      <header className="brands-header">
        <a className="brands-back" href="/"><ArrowLeft size={15} aria-hidden="true" /> Overview</a>
        <div className="brands-header-meta"><span className="eyebrow-dot" aria-hidden="true" /> Vikral workspace <span className="header-divider" /> Phase 2</div>
      </header>
      <section className="brands-content" aria-labelledby="brands-title">
        <motion.div className="brands-intro" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="page-eyebrow">Digital identity management</p>
          <h1 id="brands-title">Brand Profiles</h1>
          <p>Build a trusted reference for your brand identity, official domains, social accounts, and mobile applications.</p>
          <button className="button button-primary" type="button" onClick={openCreate}><Plus size={16} aria-hidden="true" /> Create Brand Profile</button>
        </motion.div>
        {notice && <div className="status-message status-message--success" role="status"><Check size={16} /> {notice}</div>}
        {error && <div className="status-message status-message--error" role="alert"><CircleAlert size={16} /> {error}</div>}
        <div className="brands-layout">
          <section className="brand-list-panel" aria-label="Saved brand profiles">
            <div className="section-heading"><div><p className="section-kicker">Saved profiles</p><h2>{brands.length} {brands.length === 1 ? 'brand' : 'brands'}</h2></div></div>
            {loading ? <div className="empty-state">Loading profiles...</div> : brands.length === 0 ? <div className="empty-state"><ShieldCheck size={25} /><strong>No brand profiles yet</strong><span>Create your first profile to establish a trusted identity baseline.</span></div> :
              <div className="brand-cards">{brands.map((brand) => <button className={`brand-card${selected?.id === brand.id ? ' brand-card--selected' : ''}`} key={brand.id} type="button" onClick={() => { setSelected(brand); setEditing(false); }}><span className="brand-card-mark">{brand.name.slice(0, 1).toUpperCase()}</span><span className="brand-card-copy"><strong>{brand.name}</strong><small>{brand.industry || 'Industry not specified'}</small><small>{brand.socialAccounts.length + brand.mobileApps.length} digital assets</small></span><ChevronRight size={17} aria-hidden="true" /></button>)}</div>}
          </section>
          <section className="brand-detail-panel">
            {editing ? <BrandForm form={form} setForm={setForm} onSubmit={save} onCancel={() => setEditing(false)} saving={saving} updateList={updateList} addList={addList} removeList={removeList} /> : selected ? <BrandDetail brand={selected} onEdit={() => openEdit(selected)} onDelete={() => setConfirmDelete(true)} /> : <div className="detail-placeholder"><ShieldCheck size={29} /><h2>Select a profile</h2><p>Choose a saved brand to review its trusted identity and assets.</p></div>}
          </section>
        </div>
      </section>
      <AnimatePresence>{confirmDelete && <motion.div className="confirm-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><button className="dialog-close" type="button" onClick={() => setConfirmDelete(false)} aria-label="Cancel delete"><X size={18} /></button><p className="page-eyebrow">Permanent action</p><h2 id="delete-title">Delete {selected?.name}?</h2><p>This removes the saved profile and its asset records from Vikral. This action cannot be undone.</p><div className="confirm-actions"><button className="button button-secondary" type="button" onClick={() => setConfirmDelete(false)}>Cancel</button><button className="button button-danger" type="button" onClick={() => void remove()}><Trash2 size={15} /> Delete profile</button></div></div></motion.div>}</AnimatePresence>
    </main>
  );
}

function BrandForm({ form, setForm, onSubmit, onCancel, saving, updateList, addList, removeList }: { form: BrandInput; setForm: React.Dispatch<React.SetStateAction<BrandInput>>; onSubmit: (event: React.FormEvent) => void; onCancel: () => void; saving: boolean; updateList: (field: 'aliases' | 'trustedDomains', index: number, value: string) => void; addList: (field: 'aliases' | 'trustedDomains') => void; removeList: (field: 'aliases' | 'trustedDomains', index: number) => void }) {
  return <form className="brand-form" onSubmit={onSubmit}><div className="form-heading"><div><p className="section-kicker">Profile editor</p><h2>{form.name ? `Edit ${form.name}` : 'Create brand profile'}</h2></div><button className="icon-button" type="button" onClick={onCancel} aria-label="Close editor"><X size={18} /></button></div><fieldset><legend>Brand identity</legend><div className="form-grid"><label>Brand name *<input required maxLength={120} value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} /></label><label>Industry<input maxLength={100} value={form.industry} onChange={(e) => setForm((v) => ({ ...v, industry: e.target.value }))} /></label><label>Official website<input type="url" placeholder="https://" value={form.officialWebsite} onChange={(e) => setForm((v) => ({ ...v, officialWebsite: e.target.value }))} /></label><label>Logo URL <span className="optional-label">(optional)</span><input type="url" placeholder="https://" value={form.logoUrl} onChange={(e) => setForm((v) => ({ ...v, logoUrl: e.target.value }))} /></label></div><label>Description<textarea maxLength={2000} rows={4} value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} /></label></fieldset><RepeatableList title="Aliases" values={form.aliases} field="aliases" updateList={updateList} addList={addList} removeList={removeList} /><RepeatableList title="Trusted domains" values={form.trustedDomains} field="trustedDomains" updateList={updateList} addList={addList} removeList={removeList} placeholder="example.com" /><fieldset><legend>Social accounts</legend>{form.socialAccounts.map((item, index) => <SocialEditor key={index} item={item} onChange={(next) => setForm((v) => ({ ...v, socialAccounts: v.socialAccounts.map((current, itemIndex) => itemIndex === index ? next : current) }))} onRemove={() => setForm((v) => ({ ...v, socialAccounts: v.socialAccounts.filter((_, itemIndex) => itemIndex !== index) }))} />)}<button className="add-row" type="button" onClick={() => setForm((v) => ({ ...v, socialAccounts: [...v.socialAccounts, newSocial()] }))}><Plus size={15} /> Add social account</button></fieldset><fieldset><legend>Mobile applications</legend>{form.mobileApps.map((item, index) => <AppEditor key={index} item={item} onChange={(next) => setForm((v) => ({ ...v, mobileApps: v.mobileApps.map((current, itemIndex) => itemIndex === index ? next : current) }))} onRemove={() => setForm((v) => ({ ...v, mobileApps: v.mobileApps.filter((_, itemIndex) => itemIndex !== index) }))} />)}<button className="add-row" type="button" onClick={() => setForm((v) => ({ ...v, mobileApps: [...v.mobileApps, newApp()] }))}><Plus size={15} /> Add mobile app</button></fieldset><div className="form-actions"><button className="button button-secondary" type="button" onClick={onCancel}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}><Save size={15} /> {saving ? 'Saving...' : 'Save profile'}</button></div></form>;
}

function RepeatableList({ title, values, field, updateList, addList, removeList, placeholder = 'Add an alias' }: { title: string; values: string[]; field: 'aliases' | 'trustedDomains'; updateList: BrandProfilesPageProps['updateList']; addList: BrandProfilesPageProps['addList']; removeList: BrandProfilesPageProps['removeList']; placeholder?: string }) {
  return <fieldset><legend>{title}</legend>{values.map((value, index) => <div className="repeat-row" key={`${field}-${index}`}><input value={value} placeholder={placeholder} onChange={(e) => updateList(field, index, e.target.value)} /><button className="icon-button" type="button" onClick={() => removeList(field, index)} aria-label={`Remove ${title.toLowerCase().slice(0, -1)}`}><Trash2 size={15} /></button></div>)}<button className="add-row" type="button" onClick={() => addList(field)}><Plus size={15} /> Add {title.toLowerCase().slice(0, -1)}</button></fieldset>;
}

type BrandProfilesPageProps = { updateList: (field: 'aliases' | 'trustedDomains', index: number, value: string) => void; addList: (field: 'aliases' | 'trustedDomains') => void; removeList: (field: 'aliases' | 'trustedDomains', index: number) => void };
function SocialEditor({ item, onChange, onRemove }: { item: SocialAccount; onChange: (item: SocialAccount) => void; onRemove: () => void }) {
  return <div className="asset-editor"><div className="asset-editor-top"><strong>Social account</strong><button className="icon-button" type="button" onClick={onRemove} aria-label="Remove social account"><Trash2 size={15} /></button></div><div className="form-grid"><label>Platform<select value={item.platform} onChange={(e) => onChange({ ...item, platform: e.target.value as SocialPlatform })}>{socialPlatforms.map((platform) => <option key={platform}>{platform}</option>)}</select></label><label>Handle<input required value={item.handle} placeholder="@handle" onChange={(e) => onChange({ ...item, handle: e.target.value })} /></label><label>Profile URL<input type="url" value={item.profileUrl} onChange={(e) => onChange({ ...item, profileUrl: e.target.value })} /></label><label>Verification<select value={item.verificationStatus} onChange={(e) => onChange({ ...item, verificationStatus: e.target.value as VerificationStatus })}><option value="unverified">Unverified</option><option value="verified">Manually marked verified</option></select></label></div><label>Evidence note<textarea rows={2} maxLength={500} value={item.evidenceNote} onChange={(e) => onChange({ ...item, evidenceNote: e.target.value })} /></label></div>;
}

function AppEditor({ item, onChange, onRemove }: { item: MobileApp; onChange: (item: MobileApp) => void; onRemove: () => void }) {
  return <div className="asset-editor"><div className="asset-editor-top"><strong>Mobile application</strong><button className="icon-button" type="button" onClick={onRemove} aria-label="Remove mobile app"><Trash2 size={15} /></button></div><div className="form-grid"><label>Platform<select value={item.platform} onChange={(e) => onChange({ ...item, platform: e.target.value as AppPlatform })}>{appPlatforms.map((platform) => <option key={platform}>{platform}</option>)}</select></label><label>App name<input required value={item.appName} onChange={(e) => onChange({ ...item, appName: e.target.value })} /></label><label>Publisher<input required value={item.publisher} onChange={(e) => onChange({ ...item, publisher: e.target.value })} /></label><label>Verification<select value={item.verificationStatus} onChange={(e) => onChange({ ...item, verificationStatus: e.target.value as VerificationStatus })}><option value="unverified">Unverified</option><option value="verified">Manually marked verified</option></select></label><label>Package ID<input value={item.packageId} placeholder="com.example.app" onChange={(e) => onChange({ ...item, packageId: e.target.value })} /></label><label>Bundle ID<input value={item.bundleId} onChange={(e) => onChange({ ...item, bundleId: e.target.value })} /></label><label>Store URL<input type="url" value={item.storeUrl} onChange={(e) => onChange({ ...item, storeUrl: e.target.value })} /></label></div><label>Evidence note<textarea rows={2} maxLength={500} value={item.evidenceNote} onChange={(e) => onChange({ ...item, evidenceNote: e.target.value })} /></label></div>;
}

function BrandDetail({ brand, onEdit, onDelete }: { brand: Brand; onEdit: () => void; onDelete: () => void }) {
  return <div className="brand-detail"><div className="detail-heading"><div className="detail-brand-mark">{brand.name.slice(0, 1).toUpperCase()}</div><div><p className="section-kicker">Brand profile</p><h2>{brand.name}</h2><p>{brand.industry || 'Industry not specified'}</p></div><div className="detail-actions"><button className="icon-button" type="button" onClick={onEdit} aria-label="Edit brand"><span className="edit-label">Edit</span></button><button className="icon-button icon-button--danger" type="button" onClick={onDelete} aria-label="Delete brand"><Trash2 size={16} /></button></div></div><p className="detail-description">{brand.description || 'No description has been added for this profile.'}</p><AssetSection title="Identity" items={[brand.officialWebsite && <a key="website" href={brand.officialWebsite} target="_blank" rel="noreferrer">{brand.officialWebsite} <ExternalLink size={13} /></a>, brand.logoUrl && <a key="logo" href={brand.logoUrl} target="_blank" rel="noreferrer">Logo asset <ExternalLink size={13} /></a>].filter(Boolean)} empty="No official links added." /><AssetSection title="Aliases" items={brand.aliases.map((item) => <span key={item} className="detail-chip">{item}</span>)} empty="No aliases added." /><AssetSection title="Trusted domains" items={brand.trustedDomains.map((item) => <span key={item} className="detail-chip">{item}</span>)} empty="No trusted domains added." /><section className="detail-section"><div className="detail-section-heading"><h3>Social accounts</h3><span>{brand.socialAccounts.length}</span></div>{brand.socialAccounts.length ? <div className="asset-list">{brand.socialAccounts.map((item) => <AssetRow key={`${item.platform}-${item.handle}`} title={`${item.platform} · ${item.handle}`} url={item.profileUrl} status={item.verificationStatus} note={item.evidenceNote} />)}</div> : <p className="muted">No social accounts added.</p>}</section><section className="detail-section"><div className="detail-section-heading"><h3>Mobile applications</h3><span>{brand.mobileApps.length}</span></div>{brand.mobileApps.length ? <div className="asset-list">{brand.mobileApps.map((item) => <AssetRow key={`${item.platform}-${item.appName}`} title={item.appName} subtitle={`${item.platform} · ${item.publisher}`} url={item.storeUrl} status={item.verificationStatus} note={item.evidenceNote} />)}</div> : <p className="muted">No mobile apps added.</p>}</section></div>;
}

function AssetSection({ title, items, empty }: { title: string; items: React.ReactNode[]; empty: string }) { return <section className="detail-section"><div className="detail-section-heading"><h3>{title}</h3></div>{items.length ? <div className="detail-chips">{items}</div> : <p className="muted">{empty}</p>}</section>; }
function AssetRow({ title, subtitle, url, status, note }: { title: string; subtitle?: string; url?: string; status: VerificationStatus; note?: string }) { return <div className="asset-row"><div><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}{note && <small>{note}</small>}</div><div>{url && <a className="asset-link" href={url} target="_blank" rel="noreferrer" aria-label={`Open ${title}`}><ExternalLink size={14} /></a>}<VerificationBadge status={status} /></div></div>; }
