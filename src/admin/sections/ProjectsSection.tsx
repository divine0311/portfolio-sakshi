import {useState} from 'react';
import {ExternalLink, Pencil, Plus, Trash2, X} from 'lucide-react';
import {Field, SaveBar, StudioInput, StudioTextarea} from '../fields';
import {
  deleteProject,
  saveProject,
  saveSiteContent,
  type Project,
  type SaveResult,
  type SiteContent,
  type SiteContentUpdate,
} from '../../lib/content';

interface ProjectsSectionProps {
  content: SiteContent;
  onPatch: (patch: SiteContentUpdate) => void;
  projects: Project[];
  onProjectsChange: (next: Project[]) => void;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'project'
  );
}

function emptyProject(key: string): Project {
  return {
    key,
    kicker: 'New Project',
    title: '',
    url: '',
    beneficial_title: '',
    benefits: [],
    position: 99,
  };
}

export default function ProjectsSection({
  content,
  onPatch,
  projects,
  onProjectsChange,
}: ProjectsSectionProps) {
  const [draft, setDraft] = useState<Project | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{tone: 'ok' | 'bad'; text: string} | null>(null);

  const flash = (tone: 'ok' | 'bad', text: string) => {
    setNotice({tone, text});
    window.setTimeout(() => setNotice(null), 4000);
  };

  const updateProject = (key: string, patch: Partial<Project>) => {
    onProjectsChange(projects.map((item) => (item.key === key ? {...item, ...patch} : item)));
    setDraft((current) => (current && current.key === key ? {...current, ...patch} : current));
  };

  const startAdd = () => {
    const taken = new Set(projects.map((project) => project.key));
    let n = projects.length + 1;
    while (taken.has(`project-${n}`)) n += 1;
    setEditingKey(null);
    setDraft(emptyProject(`project-${n}`));
  };

  const startEdit = (project: Project) => {
    setDraft({...project});
    setEditingKey(project.key);
  };

  const handleSaveDraft = async (): Promise<SaveResult> => {
    if (!draft) return {ok: false, error: 'Nothing to save.'};
    if (draft.title.trim() === '') return {ok: false, error: 'Project title is required.'};
    if (draft.url.trim() !== '' && !/^https?:\/\//i.test(draft.url.trim())) {
      return {ok: false, error: 'Link must start with http:// or https://'};
    }
    if (!/^https?:\/\//i.test(draft.url.trim())) {
      return {ok: false, error: 'A live link is required so the project can be opened on the site.'};
    }

    setBusy(true);
    const result = await saveProject({
      ...draft,
      title: draft.title.trim(),
      url: draft.url.trim(),
      benefits: draft.benefits.map((benefit) => benefit.trim()).filter(Boolean),
    });
    setBusy(false);
    if (!result.ok) return result;

    if (editingKey && editingKey !== draft.key) {
      const removed = await deleteProject(editingKey);
      if (!removed.ok) return removed;
      onProjectsChange(
        projects.filter((item) => item.key !== editingKey).map((item) => (item.key === draft.key ? draft : item)),
      );
    } else {
      onProjectsChange(
        projects.some((item) => item.key === draft.key)
          ? projects.map((item) => (item.key === draft.key ? draft : item))
          : [...projects, draft],
      );
    }
    flash('ok', editingKey ? 'Project updated.' : 'Project added.');
    setDraft(null);
    setEditingKey(null);
    return {ok: true};
  };

  const handleDelete = async (project: Project) => {
    const confirmed = window.confirm(
      `Delete "${project.title || project.key}"? This removes it from the live site and cannot be undone.`,
    );
    if (!confirmed) return;

    setBusy(true);
    const result = await deleteProject(project.key);
    setBusy(false);
    if (!result.ok) {
      flash('bad', result.error);
      return;
    }
    onProjectsChange(projects.filter((item) => item.key !== project.key));
    flash('ok', 'Project deleted.');
  };

  return (
    <div className="studio-editor">
      <fieldset className="studio-group">
        <legend className="studio-group__legend">Section header</legend>
        <Field label="Label">
          <StudioInput value={content.projects_label} onChange={(value) => onPatch({projects_label: value})} />
        </Field>
        <Field label="Heading">
          <StudioInput value={content.projects_heading} onChange={(value) => onPatch({projects_heading: value})} />
        </Field>
        <Field label="Subtitle">
          <StudioTextarea
            rows={2}
            value={content.projects_subtitle}
            onChange={(value) => onPatch({projects_subtitle: value})}
          />
        </Field>
        <SaveBar
          label="Save header"
          onSave={() =>
            saveSiteContent({
              projects_label: content.projects_label,
              projects_heading: content.projects_heading,
              projects_subtitle: content.projects_subtitle,
            })
          }
        />
      </fieldset>

      <div className="studio-group">
        <div className="studio-field-row">
          <span className="studio-field-row__label">Projects ({projects.length})</span>
          <button type="button" className="studio-ghost-btn" onClick={startAdd} disabled={busy}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            <span>Add project</span>
          </button>
        </div>

        {projects.length === 0 ? <p className="studio-empty">No projects yet. Use “Add project” to create one.</p> : null}

        <div className="studio-postlist">
          {projects.map((project) => (
            <article className="studio-postlist__item" key={project.key}>
              <div className="studio-postlist__body">
                <h3 className="studio-postlist__title">{project.title || '(untitled project)'}</h3>
                <p className="studio-postlist__meta">
                  {project.kicker || 'No kicker'}
                  {project.url ? (
                    <>
                      {' · '}
                      <a href={project.url} target="_blank" rel="noopener noreferrer">
                        {project.url.replace(/^https?:\/\//, '')} <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="studio-postlist__actions">
                <button type="button" className="studio-btn studio-btn--secondary studio-btn--compact" onClick={() => startEdit(project)}>
                  <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="studio-btn studio-btn--danger studio-btn--compact"
                  onClick={() => handleDelete(project)}
                  disabled={busy}
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
          <legend className="studio-group__legend">{editingKey ? 'Edit project' : 'New project'}</legend>

          <Field label="Project title">
            <StudioInput
              value={draft.title}
              placeholder="Typing Rush"
              onChange={(value) => updateProject(draft.key, {title: value})}
            />
          </Field>
          <Field label="Kicker" hint="The small label above the project name.">
            <StudioInput value={draft.kicker} onChange={(value) => updateProject(draft.key, {kicker: value})} />
          </Field>
          <Field label="Live link" hint="Required — the site links to this.">
            <StudioInput
              value={draft.url}
              placeholder="https://your-app.vercel.app"
              onChange={(value) => updateProject(draft.key, {url: value})}
            />
          </Field>
          <Field label="Benefits heading">
            <StudioInput
              value={draft.beneficial_title}
              placeholder="Why this project is beneficial"
              onChange={(value) => updateProject(draft.key, {beneficial_title: value})}
            />
          </Field>
          <Field label="Key benefits" hint="One per line, written as “Label: description”.">
            <StudioTextarea
              rows={5}
              value={draft.benefits.join('\n')}
              onChange={(value) => updateProject(draft.key, {benefits: value.split('\n')})}
            />
          </Field>
          <Field label="Key" hint="Stable id. Changing it renames the project.">
            <StudioInput value={draft.key} onChange={(value) => updateProject(draft.key, {key: slugify(value)})} />
          </Field>

          <div className="studio-savebar">
            <button type="button" className="studio-btn" onClick={handleSaveDraft} disabled={busy}>
              <span>{busy ? 'Saving…' : editingKey ? 'Save project' : 'Add project'}</span>
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
    </div>
  );
}
