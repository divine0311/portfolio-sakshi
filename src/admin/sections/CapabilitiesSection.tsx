import {useState} from 'react';
import {Pencil, Plus, Trash2, X} from 'lucide-react';
import {Field, SaveBar, StudioInput} from '../fields';
import {
  deleteCapability,
  saveCapability,
  type Capability,
  type CapabilityTool,
  type SaveResult,
} from '../../lib/content';

const ICON_OPTIONS = [
  'sparkles', 'rocket', 'target', 'megaphone', 'search', 'mail', 'chat', 'bot',
  'code', 'image', 'video', 'camera', 'film', 'zap', 'users', 'play', 'at',
  'linkedin', 'pinterest', 'scissors', 'sliders', 'palette', 'pen', 'globe',
];

interface CapabilitiesSectionProps {
  capabilities: Capability[];
  onChange: (next: Capability[]) => void;
}

function slugify(value: string): string {
  return (
    value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) ||
    'capability'
  );
}

export default function CapabilitiesSection({capabilities, onChange}: CapabilitiesSectionProps) {
  const [draft, setDraft] = useState<Capability | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{tone: 'ok' | 'bad'; text: string} | null>(null);

  const flash = (tone: 'ok' | 'bad', text: string) => {
    setNotice({tone, text});
    window.setTimeout(() => setNotice(null), 4000);
  };

  const patchDraft = (patch: Partial<Capability>) => {
    setDraft((current) => (current ? {...current, ...patch} : current));
  };

  const patchDraftTool = (index: number, patch: Partial<CapabilityTool>) => {
    setDraft((current) =>
      current
        ? {...current, tools: current.tools.map((tool, i) => (i === index ? {...tool, ...patch} : tool))}
        : current,
    );
  };

  const startAdd = () => {
    const taken = new Set(capabilities.map((capability) => capability.key));
    let n = capabilities.length + 1;
    while (taken.has(`capability-${n}`)) n += 1;
    setEditingKey(null);
    setDraft({key: `capability-${n}`, title: '', tools: [], position: capabilities.length + 1});
  };

  const handleSaveDraft = async (): Promise<SaveResult> => {
    if (!draft) return {ok: false, error: 'Nothing to save.'};
    if (draft.title.trim() === '') return {ok: false, error: 'Capability title is required.'};
    const tools = draft.tools
      .map((tool) => ({name: tool.name.trim(), icon: tool.icon || 'sparkles'}))
      .filter((tool) => tool.name !== '');

    const result = await saveCapability(draft.key, draft.title.trim(), tools);
    if (!result.ok) return result;

    if (editingKey && editingKey !== draft.key) {
      const removed = await deleteCapability(editingKey);
      if (!removed.ok) return removed;
      onChange(
        capabilities
          .filter((item) => item.key !== editingKey)
          .map((item) => (item.key === draft.key ? draft : item)),
      );
    } else {
      onChange(
        capabilities.some((item) => item.key === draft.key)
          ? capabilities.map((item) => (item.key === draft.key ? draft : item))
          : [...capabilities, draft],
      );
    }
    flash('ok', editingKey ? 'Capability updated.' : 'Capability added.');
    setDraft(null);
    setEditingKey(null);
    return {ok: true};
  };

  const handleDelete = async (capability: Capability) => {
    const confirmed = window.confirm(
      `Delete "${capability.title || capability.key}" and its ${capability.tools.length} tools? This cannot be undone.`,
    );
    if (!confirmed) return;

    const result = await deleteCapability(capability.key);
    if (!result.ok) {
      flash('bad', result.error);
      return;
    }
    onChange(capabilities.filter((item) => item.key !== capability.key));
    flash('ok', 'Capability deleted.');
  };

  return (
    <div className="studio-editor">
      <div className="studio-group">
        <div className="studio-field-row">
          <span className="studio-field-row__label">Capabilities ({capabilities.length})</span>
          <button type="button" className="studio-ghost-btn" onClick={startAdd}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            <span>Add capability</span>
          </button>
        </div>

        {capabilities.length === 0 ? (
          <p className="studio-empty">No capabilities yet. Use “Add capability” to create one.</p>
        ) : null}

        <div className="studio-postlist">
          {capabilities.map((capability) => (
            <article className="studio-postlist__item" key={capability.key}>
              <div className="studio-postlist__body">
                <h3 className="studio-postlist__title">{capability.title || '(untitled)'}</h3>
                <p className="studio-postlist__meta">
                  {capability.tools.length} tools
                  {capability.tools.length ? `: ${capability.tools.map((tool) => tool.name).join(', ')}` : ''}
                </p>
              </div>
              <div className="studio-postlist__actions">
                <button
                  type="button"
                  className="studio-btn studio-btn--secondary studio-btn--compact"
                  onClick={() => {
                    setDraft({...capability, tools: capability.tools.map((tool) => ({...tool}))});
                    setEditingKey(capability.key);
                  }}
                >
                  <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="studio-btn studio-btn--danger studio-btn--compact"
                  onClick={() => handleDelete(capability)}
                >
                  <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                  <span>Delete</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {draft ? (
        <fieldset className="studio-group">
          <legend className="studio-group__legend">{editingKey ? 'Edit capability' : 'New capability'}</legend>

          <Field label="Title">
            <StudioInput
              value={draft.title}
              placeholder="Content Strategy"
              onChange={(value) => patchDraft({title: value})}
            />
          </Field>
          <Field label="Key" hint="Stable id. Changing it renames the capability.">
            <StudioInput value={draft.key} onChange={(value) => patchDraft({key: slugify(value)})} />
          </Field>

          <div className="studio-repeat">
            <div className="studio-repeat__head">
              <span className="studio-field-row__label">Tools</span>
            </div>
            <div className="studio-repeat__rows">
              {draft.tools.map((tool, index) => {
                const options = ICON_OPTIONS.includes(tool.icon) ? ICON_OPTIONS : [tool.icon, ...ICON_OPTIONS];
                return (
                  <div className="studio-repeat__row studio-repeat__row--tool" key={index}>
                    <StudioInput
                      value={tool.name}
                      placeholder="Tool name"
                      onChange={(value) => patchDraftTool(index, {name: value})}
                    />
                    <select
                      className="studio-select"
                      value={tool.icon}
                      aria-label={`Icon for tool ${index + 1}`}
                      onChange={(event) => patchDraftTool(index, {icon: event.target.value})}
                    >
                      {options.map((option) => (
                        <option value={option} key={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="studio-icon-btn"
                      aria-label={`Remove ${tool.name || 'tool'}`}
                      onClick={() => patchDraft({tools: draft.tools.filter((_, i) => i !== index)})}
                    >
                      <X size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="studio-ghost-btn"
              onClick={() => patchDraft({tools: [...draft.tools, {name: '', icon: 'sparkles'}]})}
            >
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
              <span>Add tool</span>
            </button>
          </div>

          <div className="studio-savebar">
            <button type="button" className="studio-btn" onClick={handleSaveDraft}>
              <span>{editingKey ? 'Save capability' : 'Add capability'}</span>
            </button>
            <button
              type="button"
              className="studio-btn studio-btn--secondary"
              onClick={() => {
                setDraft(null);
                setEditingKey(null);
              }}
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
              <span>Cancel</span>
            </button>
          </div>
        </fieldset>
      ) : null}

      {notice ? (
        <p className={notice.tone === 'ok' ? 'studio-saved' : 'studio-error'} role="status">
          {notice.text}
        </p>
      ) : null}

      {!draft ? <p className="studio-note">Tip: add a capability, then use Edit to attach tools to it.</p> : null}
      <SaveBar
        label="Save all capabilities"
        onSave={async (): Promise<SaveResult> => {
          for (const capability of capabilities) {
            const result = await saveCapability(
              capability.key,
              capability.title,
              capability.tools.filter((tool) => tool.name.trim() !== ''),
            );
            if (!result.ok) return result;
          }
          return {ok: true};
        }}
      />
    </div>
  );
}
