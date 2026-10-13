import {useState} from 'react';
import {GraduationCap, Pencil, Plus, Trash2, X} from 'lucide-react';
import {Field, StudioInput, StudioTextarea} from '../fields';
import {saveSiteContent, type SaveResult, type SiteContent, type SiteContentUpdate} from '../../lib/content';

interface QualificationsSectionProps {
  content: SiteContent;
  onPatch: (patch: SiteContentUpdate) => void;
}

const SLOTS = [1, 2, 3] as const;
type Slot = (typeof SLOTS)[number];

interface Qualification {
  title: string;
  institution: string;
  timing: string;
  desc: string;
}

function readSlot(content: SiteContent, slot: Slot): Qualification {
  return {
    title: content[`qualification_${slot}_title`],
    institution: content[`qualification_${slot}_institution`],
    timing: content[`qualification_${slot}_timing`],
    desc: content[`qualification_${slot}_desc`],
  };
}

function patchFor(slot: Slot, value: Qualification): SiteContentUpdate {
  return {
    [`qualification_${slot}_title`]: value.title,
    [`qualification_${slot}_institution`]: value.institution,
    [`qualification_${slot}_timing`]: value.timing,
    [`qualification_${slot}_desc`]: value.desc,
  };
}

function isEmpty(value: Qualification): boolean {
  return (
    value.title.trim() === '' &&
    value.institution.trim() === '' &&
    value.timing.trim() === '' &&
    value.desc.trim() === ''
  );
}

export default function QualificationsSection({content, onPatch}: QualificationsSectionProps) {
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [draft, setDraft] = useState<Qualification | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{tone: 'ok' | 'bad'; text: string} | null>(null);

  const flash = (tone: 'ok' | 'bad', text: string) => {
    setNotice({tone, text});
    window.setTimeout(() => setNotice(null), 4000);
  };

  const startAdd = () => {
    const empty = SLOTS.find((slot) => isEmpty(readSlot(content, slot)));
    const slot = empty ?? 1;
    if (!empty) flash('ok', 'All three slots are used. Edit one, or delete one first.');
    setEditingSlot(slot);
    setDraft(readSlot(content, slot));
  };

  const startEdit = (slot: Slot) => {
    setEditingSlot(slot);
    setDraft(readSlot(content, slot));
  };

  const closeEditor = () => {
    setEditingSlot(null);
    setDraft(null);
  };

  const handleSave = async (): Promise<SaveResult> => {
    if (!draft || editingSlot === null) return {ok: false, error: 'Nothing to save.'};
    if (draft.title.trim() === '') return {ok: false, error: 'A course or degree name is required.'};

    const clean: Qualification = {
      title: draft.title.trim(),
      institution: draft.institution.trim(),
      timing: draft.timing.trim(),
      desc: draft.desc.trim(),
    };

    setBusy(true);
    const result = await saveSiteContent(patchFor(editingSlot, clean));
    setBusy(false);
    if (!result.ok) return result;

    onPatch(patchFor(editingSlot, clean));
    flash('ok', 'Qualification saved.');
    closeEditor();
    return {ok: true};
  };

  const handleDelete = async (slot: Slot) => {
    const value = readSlot(content, slot);
    const confirmed = window.confirm(
      `Delete "${value.title || `Qualification ${slot}`}"? It is removed from the public roadmap.`,
    );
    if (!confirmed) return;

    const cleared: Qualification = {title: '', institution: '', timing: '', desc: ''};
    setBusy(true);
    const result = await saveSiteContent(patchFor(slot, cleared));
    setBusy(false);
    if (!result.ok) {
      flash('bad', result.error);
      return;
    }
    onPatch(patchFor(slot, cleared));
    if (editingSlot === slot) closeEditor();
    flash('ok', 'Qualification deleted.');
  };

  return (
    <div className="studio-editor">
      <div className="studio-grid-2">
        <div className="studio-group">
          <div className="studio-field-row">
            <span className="studio-field-row__label">Qualifications</span>
            <button type="button" className="studio-ghost-btn" onClick={startAdd} disabled={busy}>
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
              <span>Add qualification</span>
            </button>
          </div>

          <div className="studio-postlist">
            {SLOTS.map((slot) => {
              const value = readSlot(content, slot);
              const empty = isEmpty(value);
              return (
                <article className="studio-postlist__item" key={slot}>
                  <GraduationCap size={22} strokeWidth={2} aria-hidden="true" />
                  <div className="studio-postlist__body">
                    <h3 className="studio-postlist__title">
                      {empty ? '(empty slot)' : value.title || '(untitled)'}
                    </h3>
                    <p className="studio-postlist__meta">
                      {value.institution || 'No institute'}
                      {value.timing ? ` · ${value.timing}` : ''}
                    </p>
                  </div>
                  <div className="studio-postlist__actions">
                    <button
                      type="button"
                      className="studio-btn studio-btn--secondary studio-btn--compact"
                      onClick={() => startEdit(slot)}
                    >
                      <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                      <span>Edit</span>
                    </button>
                    {empty ? null : (
                      <button
                        type="button"
                        className="studio-btn studio-btn--danger studio-btn--compact"
                        onClick={() => handleDelete(slot)}
                        disabled={busy}
                      >
                        <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <fieldset className="studio-group">
          <legend className="studio-group__legend">
            {editingSlot === null ? 'Qualification details' : `Qualification ${editingSlot}`}
          </legend>

          {draft === null || editingSlot === null ? (
            <p className="studio-empty">
              Select a qualification to edit, or press “Add qualification”.
            </p>
          ) : (
            <>
              <Field label="Degree / course">
                <StudioInput
                  value={draft.title}
                  placeholder="Bachelor of Arts (B.A.)"
                  onChange={(value) => setDraft({...draft, title: value})}
                />
              </Field>
              <Field label="Institute">
                <StudioInput
                  value={draft.institution}
                  placeholder="Indira Gandhi College, Kurukshetra University"
                  onChange={(value) => setDraft({...draft, institution: value})}
                />
              </Field>
              <Field label="Year">
                <StudioInput
                  value={draft.timing}
                  placeholder="2023 — 2026"
                  onChange={(value) => setDraft({...draft, timing: value})}
                />
              </Field>
              <Field label="Description">
                <StudioTextarea
                  rows={4}
                  value={draft.desc}
                  onChange={(value) => setDraft({...draft, desc: value})}
                />
              </Field>

              <div className="studio-savebar">
                <button type="button" className="studio-btn" onClick={handleSave} disabled={busy}>
                  <span>{busy ? 'Saving…' : 'Save qualification'}</span>
                </button>
                <button type="button" className="studio-btn studio-btn--secondary" onClick={closeEditor}>
                  <X size={16} strokeWidth={2} aria-hidden="true" />
                  <span>Cancel</span>
                </button>
              </div>
            </>
          )}
        </fieldset>
      </div>

      {notice ? (
        <p className={notice.tone === 'ok' ? 'studio-saved' : 'studio-error'} role="status">
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
