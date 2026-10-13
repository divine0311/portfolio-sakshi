import {useEffect, useState} from 'react';
import {Plus, X} from 'lucide-react';
import {Field, StudioInput} from '../fields';
import {saveCapability, type Capability, type CapabilityTool, type SaveResult} from '../../lib/content';

interface CapabilitiesSectionProps {
  capabilities: Capability[];
  onChange: (next: Capability[]) => void;
}

export default function CapabilitiesSection({capabilities, onChange}: CapabilitiesSectionProps) {
  const [groups, setGroups] = useState<Capability[]>(capabilities);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{tone: 'ok' | 'bad'; text: string} | null>(null);

  useEffect(() => {
    setGroups(capabilities);
  }, [capabilities]);

  const flash = (tone: 'ok' | 'bad', text: string) => {
    setNotice({tone, text});
    window.setTimeout(() => setNotice(null), 4000);
  };

  const setTitle = (key: string, title: string) => {
    setGroups((current) => current.map((group) => (group.key === key ? {...group, title} : group)));
  };

  const removeTool = (key: string, index: number) => {
    setGroups((current) =>
      current.map((group) =>
        group.key === key ? {...group, tools: group.tools.filter((_, i) => i !== index)} : group,
      ),
    );
  };

  const addTool = (key: string) => {
    const name = (inputs[key] ?? '').trim();
    if (!name) return;
    const tool: CapabilityTool = {name, icon: 'sparkles'};
    setGroups((current) =>
      current.map((group) => (group.key === key ? {...group, tools: [...group.tools, tool]} : group)),
    );
    setInputs((current) => ({...current, [key]: ''}));
  };

  const handleSave = async (): Promise<SaveResult> => {
    setBusy(true);
    for (const group of groups) {
      const result = await saveCapability(
        group.key,
        group.title.trim(),
        group.tools.filter((tool) => tool.name.trim() !== ''),
      );
      if (!result.ok) {
        setBusy(false);
        return result;
      }
    }
    setBusy(false);
    onChange(groups);
    flash('ok', 'Tools saved.');
    return {ok: true};
  };

  return (
    <div className="studio-editor">
      {groups.map((group) => (
        <fieldset className="studio-group" key={group.key}>
          <legend className="studio-group__legend">{group.title || '(untitled)'}</legend>

          <Field label="Capability title">
            <StudioInput value={group.title} onChange={(value) => setTitle(group.key, value)} />
          </Field>

          <div className="studio-field-row">
            <span className="studio-field-row__label">Tools ({group.tools.length})</span>
          </div>

          <div className="studio-chip-list">
            {group.tools.map((tool, index) => (
              <span className="studio-chip" key={`${tool.name}-${index}`}>
                {tool.name}
                <button
                  type="button"
                  className="studio-chip__remove"
                  aria-label={`Remove ${tool.name || 'tool'}`}
                  onClick={() => removeTool(group.key, index)}
                >
                  <X size={13} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </span>
            ))}
            {group.tools.length === 0 ? <p className="studio-empty">No tools yet.</p> : null}
          </div>

          <div className="studio-inline-add">
            <input
              className="studio-input"
              value={inputs[group.key] ?? ''}
              placeholder="Add a tool, e.g. Notion"
              onChange={(event) => setInputs((current) => ({...current, [group.key]: event.target.value}))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTool(group.key);
                }
              }}
            />
            <button type="button" className="studio-ghost-btn" onClick={() => addTool(group.key)}>
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
              <span>Add tool</span>
            </button>
          </div>
        </fieldset>
      ))}

      <div className="studio-savebar">
        <button type="button" className="studio-btn" onClick={handleSave} disabled={busy}>
          <span>{busy ? 'Saving…' : 'Save changes'}</span>
        </button>
      </div>

      {notice ? (
        <p className={notice.tone === 'ok' ? 'studio-saved' : 'studio-error'} role="status">
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
