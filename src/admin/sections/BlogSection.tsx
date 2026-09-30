import {useState} from 'react';
import {Pencil, Plus, Trash2, X} from 'lucide-react';
import {Field, SaveBar, StudioInput} from '../fields';
import {
  createBlogPost,
  deleteBlogPost,
  loadBlogPosts,
  updateBlogPost,
  type BlogPost,
  type BlogPostInput,
  type SaveResult,
} from '../../lib/content';

const CATEGORY_OPTIONS = ['Digital Marketing', 'AI Tools', 'Editing', 'Web Design'];

interface BlogSectionProps {
  posts: BlogPost[];
  onChange: (next: BlogPost[]) => void;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'post'
  );
}

function emptyDraft(): BlogPostInput {
  const today = new Date().toISOString().slice(0, 10);
  return {
    title: '',
    slug: '',
    category: 'Digital Marketing',
    date: today,
    read_time: '4 min read',
    excerpt: '',
    content: '',
    thumbnail_url: '',
    meta_title: '',
    meta_description: '',
    body: '',
    author: 'Sakshi Gill',
    published: true,
    published_at: today,
  };
}

/** New SEO columns mirror the legacy ones so both stay in step. */
function syncFields(patchValue: Partial<BlogPostInput>): Partial<BlogPostInput> {
  const out: Record<string, unknown> = {...patchValue};
  if (patchValue.meta_description !== undefined) out.excerpt = patchValue.meta_description;
  if (patchValue.excerpt !== undefined) out.meta_description = patchValue.excerpt;
  if (patchValue.body !== undefined) out.content = patchValue.body;
  if (patchValue.content !== undefined) out.body = patchValue.content;
  if (patchValue.published_at !== undefined) out.date = patchValue.published_at;
  if (patchValue.date !== undefined) out.published_at = patchValue.date;
  if (patchValue.meta_title === '' && patchValue.title) out.meta_title = patchValue.title;
  return out as Partial<BlogPostInput>;
}

export default function BlogSection({posts, onChange}: BlogSectionProps) {
  const [draft, setDraft] = useState<BlogPostInput | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{tone: 'ok' | 'bad'; text: string} | null>(null);

  const flash = (tone: 'ok' | 'bad', text: string) => {
    setNotice({tone, text});
    window.setTimeout(() => setNotice(null), 4000);
  };

  const patch = (p: Partial<BlogPostInput>) => {
    setDraft((current) => (current ? {...current, ...syncFields(p)} : current));
  };

  const startAdd = () => {
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const handleSave = async (): Promise<SaveResult> => {
    if (!draft) return {ok: false, error: 'Nothing to save.'};
    const title = draft.title.trim();
    if (title === '') return {ok: false, error: 'Title is required.'};

    const slug = draft.slug.trim() ? slugify(draft.slug.trim()) : slugify(title);
    const payload: BlogPostInput = syncFields({...draft, title, slug}) as BlogPostInput;

    if (editingId) {
      const result = await updateBlogPost(editingId, payload);
      if (!result.ok) return result;
      onChange(posts.map((p) => (p.id === editingId ? {...p, ...payload} : p)));
      flash('ok', 'Post updated.');
    } else {
      const result = await createBlogPost(payload);
      if (!result.ok) return result;
      const next: BlogPost = {...payload, id: result.id ?? slug, created_at: new Date().toISOString()};
      onChange([next, ...posts]);
      flash('ok', 'Post published.');
    }
    setDraft(null);
    setEditingId(null);
    return {ok: true};
  };

  const handleDelete = async (post: BlogPost) => {
    const confirmed = window.confirm(`Delete "${post.title || post.slug}"? This cannot be undone.`);
    if (!confirmed) return;
    const result = await deleteBlogPost(post.id);
    if (!result.ok) {
      flash('bad', result.error);
      return;
    }
    onChange(posts.filter((p) => p.id !== post.id));
    flash('ok', 'Post deleted.');
  };

  return (
    <div className="studio-editor">
      <div className="studio-group">
        <div className="studio-field-row">
          <span className="studio-field-row__label">Blog posts ({posts.length})</span>
          <button type="button" className="studio-ghost-btn" onClick={startAdd}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            <span>New post</span>
          </button>
        </div>

        {posts.length === 0 ? (
          <p className="studio-empty">No posts yet. Use “New post” to publish your first article.</p>
        ) : null}

        <div className="studio-postlist">
          {posts.map((post) => (
            <article className="studio-postlist__item" key={post.id}>
              <div className="studio-postlist__body">
                <h3 className="studio-postlist__title">{post.title || '(untitled)'}</h3>
                <p className="studio-postlist__meta">
                  {post.category || 'Uncategorised'} · {post.published_at || post.date}
                  {post.read_time ? ` · ${post.read_time}` : ''} · /blog/{post.slug}
                  {post.published === false ? ' · DRAFT' : ''}
                </p>
              </div>
              <div className="studio-postlist__actions">
                <button
                  type="button"
                  className="studio-btn studio-btn--secondary studio-btn--compact"
                  onClick={() => {
                    setDraft({
                      title: post.title,
                      slug: post.slug,
                      category: post.category ?? 'Digital Marketing',
                      date: post.published_at || post.date,
                      read_time: post.read_time ?? '',
                      excerpt: post.excerpt ?? '',
                      content: post.content ?? '',
                      thumbnail_url: post.thumbnail_url ?? '',
                      meta_title: post.meta_title ?? '',
                      meta_description: post.meta_description ?? post.excerpt ?? '',
                      body: post.body ?? post.content ?? '',
                      author: post.author ?? 'Sakshi Gill',
                      published: post.published !== false,
                      published_at: post.published_at || post.date,
                    });
                    setEditingId(post.id);
                  }}
                >
                  <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="studio-btn studio-btn--danger studio-btn--compact"
                  onClick={() => handleDelete(post)}
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
          <legend className="studio-group__legend">{editingId ? 'Edit post' : 'New post'}</legend>

          <Field label="Title" hint="Also used for the page title and the h1.">
            <StudioInput
              value={draft.title}
              placeholder="Best Digital Marketer in Kaithal"
              onChange={(value) => patch({title: value, slug: editingId ? draft.slug : slugify(value)})}
            />
          </Field>

          <Field label="Slug" hint="URL becomes /blog/<slug>. Leave blank to generate from the title.">
            <StudioInput value={draft.slug} onChange={(value) => patch({slug: value})} />
          </Field>

          <Field label="Category" hint="Pick an existing category or type a new one.">
            <input
              className="studio-input"
              list="studio-blog-categories"
              value={draft.category ?? ''}
              placeholder="Digital Marketing"
              onChange={(event) => patch({category: event.target.value})}
            />
            <datalist id="studio-blog-categories">
              {Array.from(new Set([...CATEGORY_OPTIONS, draft.category ?? '']))
                .filter(Boolean)
                .map((option) => (
                  <option value={option} key={option} />
                ))}
            </datalist>
          </Field>

          <Field label="Date">
            <StudioInput value={draft.date} onChange={(value) => patch({date: value})} />
          </Field>

          <Field label="Read time">
            <StudioInput value={draft.read_time ?? ''} onChange={(value) => patch({read_time: value})} />
          </Field>

          <Field label="Published" hint="Drafts are hidden from the blog and from search engines.">
            <select
              className="studio-select"
              value={draft.published === false ? 'no' : 'yes'}
              aria-label="Published"
              onChange={(event) => patch({published: event.target.value === 'yes'})}
            >
              <option value="yes">Published</option>
              <option value="no">Draft</option>
            </select>
          </Field>

          <Field label="Meta title" hint="Blank falls back to the post title. Aim for 50-60 characters.">
            <StudioInput
              value={draft.meta_title ?? ''}
              placeholder="Best Digital Marketer in Kaithal | Sakshi Gill"
              onChange={(value) => patch({meta_title: value})}
            />
          </Field>

          <Field label="Meta description" hint="Used for the meta description and Open Graph.">
            <StudioInput
              value={draft.meta_description ?? ''}
              placeholder="One or two sentences for search results."
              onChange={(value) => patch({meta_description: value})}
            />
          </Field>

          <Field label="Author" hint="Shown in the article header, byline box and JSON-LD.">
            <StudioInput value={draft.author ?? ''} onChange={(value) => patch({author: value})} />
          </Field>

          <Field label="Body" hint="HTML is allowed. Use h2 for subsections and p for paragraphs.">
            <textarea
              className="studio-textarea studio-textarea--tall"
              rows={16}
              value={draft.body ?? draft.content}
              onChange={(event) => patch({body: event.target.value})}
            />
          </Field>

          <div className="studio-savebar">
            <button type="button" className="studio-btn" onClick={handleSave}>
              <span>{editingId ? 'Save post' : 'Publish post'}</span>
            </button>
            <button
              type="button"
              className="studio-btn studio-btn--secondary"
              onClick={() => {
                setDraft(null);
                setEditingId(null);
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

      <SaveBar
        label="Reload posts from database"
        onSave={async (): Promise<SaveResult> => {
          const rows = await loadBlogPosts();
          if (rows) {
            onChange(rows);
            return {ok: true};
          }
          return {ok: false, error: 'Could not read posts from the database.'};
        }}
      />
    </div>
  );
}