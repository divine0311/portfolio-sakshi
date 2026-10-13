import {useRef, useState, type ReactNode} from 'react';
import {RefreshCw, Save, Trash2, Upload} from 'lucide-react';
import {Field, RepeatList, StudioInput, StudioTextarea} from '../fields';
import {
  saveSiteContent,
  type SaveResult,
  type SiteContent,
  type SiteContentUpdate,
} from '../../lib/content';
import {
  deleteSiteImage,
  IMAGE_SLOTS,
  isUploadedImageUrl,
  MAX_UPLOAD_BYTES,
  saveSiteImage,
  SLOT_DEFAULTS,
  uploadSiteImage,
  type ImageSlot,
  type SiteImage,
} from '../../lib/images';

interface ImagesSectionProps {
  content: SiteContent;
  onPatch: (patch: SiteContentUpdate) => void;
  images: SiteImage[];
  onImagesChange: (next: SiteImage[]) => void;
  storageReady: boolean;
}

type Meta = {alt: string; heading: string; description: string};

/** The site_content columns that belong to each image slot. */
function contentPatch(slot: ImageSlot, content: SiteContent): SiteContentUpdate {
  if (slot === 'hero') {
    return {
      hero_name: content.hero_name,
      hero_roles: content.hero_roles,
      hero_tagline: content.hero_tagline,
    };
  }
  if (slot === 'about') return {who_am_i_story: content.who_am_i_story};
  return {journey_quotes: content.journey_quotes};
}

function slotFields(
  slot: ImageSlot,
  content: SiteContent,
  onPatch: (patch: SiteContentUpdate) => void,
): ReactNode {
  if (slot === 'hero') {
    return (
      <>
        <Field label="Your name">
          <StudioInput
            value={content.hero_name}
            placeholder="Sakshi Gill"
            onChange={(value) => onPatch({hero_name: value})}
          />
        </Field>
        <RepeatList
          label="Roles"
          hint="One per line. These cycle through under your name."
          items={content.hero_roles}
          onChange={(next) => onPatch({hero_roles: next})}
          placeholder="Digital Marketer"
          addLabel="Add role"
        />
        <Field label="Tagline">
          <StudioTextarea
            rows={2}
            value={content.hero_tagline}
            onChange={(value) => onPatch({hero_tagline: value})}
          />
        </Field>
      </>
    );
  }

  if (slot === 'about') {
    return (
      <Field label="My story">
        <StudioTextarea
          rows={6}
          value={content.who_am_i_story}
          onChange={(value) => onPatch({who_am_i_story: value})}
        />
      </Field>
    );
  }

  return (
    <RepeatList
      label="Journey quotes"
      hint="One per line. These rotate alongside the journey image."
      items={content.journey_quotes}
      onChange={(next) => onPatch({journey_quotes: next})}
      placeholder="Design is thinking made visible."
      addLabel="Add quote"
    />
  );
}

export default function ImagesSection({
  content,
  onPatch,
  images,
  onImagesChange,
  storageReady,
}: ImagesSectionProps) {
  const inputs = useRef<Partial<Record<ImageSlot, HTMLInputElement | null>>>({});
  const [activeSlot, setActiveSlot] = useState<ImageSlot>('hero');
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Partial<Record<ImageSlot, Meta>>>({});
  const [urlDrafts, setUrlDrafts] = useState<Partial<Record<ImageSlot, string>>>({});
  const [notice, setNotice] = useState<{tone: 'ok' | 'bad'; text: string} | null>(null);

  const flash = (tone: 'ok' | 'bad', text: string) => {
    setNotice({tone, text});
    window.setTimeout(() => setNotice(null), 5000);
  };

  const find = (slot: ImageSlot): SiteImage | undefined => images.find((image) => image.slot === slot);
  const meta = (slot: ImageSlot): Meta => drafts[slot] ?? find(slot) ?? {alt: '', heading: '', description: ''};

  const patchMeta = (slot: ImageSlot, patch: Partial<Meta>) => {
    setDrafts((current) => ({...current, [slot]: {...meta(slot), ...patch}}));
  };

  const applyRow = (slot: ImageSlot, patch: Partial<SiteImage>) => {
    onImagesChange(images.map((image) => (image.slot === slot ? {...image, ...patch} : image)));
  };

  const forgetDraft = (slot: ImageSlot) => {
    setDrafts((current) => {
      const next = {...current};
      delete next[slot];
      return next;
    });
  };

  const handleFile = async (slot: ImageSlot, file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const result = await uploadSiteImage(slot, file);
    setBusy(false);

    if (!result.ok) {
      flash('bad', result.error);
      return;
    }
    const {loadSiteImages} = await import('../../lib/images');
    const fresh = await loadSiteImages();
    if (fresh.length > 0) onImagesChange(fresh);
    flash('ok', 'Image uploaded. Press “Save text” to keep your captions too.');
  };

  /** Writes whatever URL is in the "Picture URL" box straight to the database. */
  const handleUrlUpdate = async (slot: ImageSlot): Promise<void> => {
    const current = find(slot);
    const typed = (urlDrafts[slot] ?? current?.url ?? '').trim();
    setBusy(true);
    const result = await saveSiteImage({
      slot,
      url: typed,
      storage_path: '',
      alt: meta(slot).alt,
      heading: meta(slot).heading,
      description: meta(slot).description,
    });
    setBusy(false);
    if (!result.ok) {
      flash('bad', result.error);
      return;
    }
    applyRow(slot, {url: typed, storage_path: ''});
    setUrlDrafts((currentUrl) => ({...currentUrl, [slot]: typed}));
    flash('ok', 'Picture URL saved.');
  };

  const handleDelete = async (slot: ImageSlot) => {
    const current = find(slot);
    if (!current) return;
    if (!window.confirm('Delete this picture from the site? The section falls back to the default image.')) {
      return;
    }

    setBusy(true);
    const result = await deleteSiteImage(slot, current.storage_path);
    setBusy(false);
    if (!result.ok) {
      flash('bad', result.error);
      return;
    }
    applyRow(slot, {url: slot === 'hero' ? SLOT_DEFAULTS[slot] : '', storage_path: ''});
    setUrlDrafts((currentUrl) => ({...currentUrl, [slot]: ''}));
    flash('ok', 'Picture deleted.');
  };

  /** Saves the image caption row and the matching body text in one go. */
  const handleSave = async (slot: ImageSlot): Promise<SaveResult> => {
    const value = meta(slot);
    const current = find(slot);

    const imageResult = await saveSiteImage({
      slot,
      url: current?.url ?? '',
      storage_path: current?.storage_path ?? '',
      alt: value.alt,
      heading: value.heading,
      description: value.description,
    });
    if (!imageResult.ok) return imageResult;

    const textResult = await saveSiteContent(contentPatch(slot, content));
    if (!textResult.ok) return textResult;

    applyRow(slot, {alt: value.alt, heading: value.heading, description: value.description});
    forgetDraft(slot);
    return {ok: true};
  };

  const current = find(activeSlot);
  const live = activeSlot === 'hero' || isUploadedImageUrl(current?.url);
  const previewUrl = live ? current?.url || SLOT_DEFAULTS[activeSlot] : '';
  const value = meta(activeSlot);
  const activeLabel = IMAGE_SLOTS.find((slot) => slot.id === activeSlot)?.label ?? '';

  return (
    <div className="studio-editor">
      {storageReady ? null : (
        <p className="studio-note studio-note--warn">
          Image storage is not ready yet. Run <code>supabase/admin-security.sql</code> and{' '}
          <code>supabase/part-b-images.sql</code> in the Supabase SQL editor, then reload. Until then
          uploads are disabled and the default images are shown.
        </p>
      )}

      <div className="studio-pilltabs" role="tablist" aria-label="Image sections">
        {IMAGE_SLOTS.map(({id, label}) => (
          <button
            type="button"
            key={id}
            role="tab"
            aria-selected={id === activeSlot}
            className={`studio-pilltab ${id === activeSlot ? 'studio-pilltab--active' : ''}`}
            onClick={() => setActiveSlot(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <fieldset className="studio-group">
        <legend className="studio-group__legend">{activeLabel}</legend>
        <p className="studio-note">{IMAGE_SLOTS.find((slot) => slot.id === activeSlot)?.hint}</p>

        {activeSlot === 'hero' ? null : isUploadedImageUrl(current?.url) ? (
          <p className="studio-note studio-note--ok">
            This picture is <strong>live on the site</strong>.
          </p>
        ) : (
          <p className="studio-note studio-note--warn">
            No custom picture here yet — the site is using the default. Upload one and it appears
            automatically.
          </p>
        )}

        <div className="studio-imagerow">
          <div className="studio-imagerow__preview">
            {previewUrl ? (
              <img src={previewUrl} alt={value.alt || activeLabel} />
            ) : (
              <p className="studio-empty">No picture on the site</p>
            )}
          </div>

          <div className="studio-imagerow__actions">
            <input
              ref={(node) => {
                inputs.current[activeSlot] = node;
              }}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              className="studio-file"
              onChange={(event) => {
                void handleFile(activeSlot, event.target.files?.[0]);
                event.target.value = '';
              }}
            />

            <button
              type="button"
              className="studio-btn"
              disabled={busy || !storageReady}
              onClick={() => inputs.current[activeSlot]?.click()}
            >
              <Upload size={16} strokeWidth={2} aria-hidden="true" />
              <span>{busy ? 'Uploading…' : 'Add / replace image'}</span>
            </button>

            <button
              type="button"
              className="studio-btn studio-btn--secondary"
              disabled={busy || !storageReady}
              onClick={() => void handleUrlUpdate(activeSlot)}
            >
              <RefreshCw size={16} strokeWidth={2} aria-hidden="true" />
              <span>{busy ? 'Updating…' : 'Update image URL'}</span>
            </button>

            {current?.storage_path || previewUrl ? (
              <button
                type="button"
                className="studio-btn studio-btn--danger"
                disabled={busy}
                onClick={() => handleDelete(activeSlot)}
              >
                <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                <span>Delete image</span>
              </button>
            ) : (
              <span className="studio-badge">
                {activeSlot === 'hero' ? 'Using default' : 'Not shown'}
              </span>
            )}

            <p className="studio-hint">
              JPG, PNG, WebP, GIF or AVIF. Max {Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.
            </p>
          </div>
        </div>

        <Field label="Picture URL" hint="Or paste an image link here, then press Update image URL.">
          <StudioInput
            value={urlDrafts[activeSlot] ?? current?.url ?? ''}
            placeholder="https://example.com/photo.jpg"
            onChange={(next) => setUrlDrafts((c) => ({...c, [activeSlot]: next}))}
          />
        </Field>

        <Field label="Heading" hint="The label shown next to the image.">
          <StudioInput
            value={value.heading}
            placeholder="My Journey"
            onChange={(next) => patchMeta(activeSlot, {heading: next})}
          />
        </Field>
        <Field label="Alt text" hint="Describes the image for screen readers and SEO.">
          <StudioInput
            value={value.alt}
            placeholder="Sakshi Gill"
            onChange={(next) => patchMeta(activeSlot, {alt: next})}
          />
        </Field>
        <Field label="Description" hint="A short line of supporting copy.">
          <StudioTextarea
            rows={2}
            value={value.description}
            onChange={(next) => patchMeta(activeSlot, {description: next})}
          />
        </Field>

        {slotFields(activeSlot, content, onPatch)}

        <SaveBar label="Save text" onSave={() => handleSave(activeSlot)} />
      </fieldset>

      {notice ? (
        <p className={notice.tone === 'ok' ? 'studio-saved' : 'studio-error'} role="status">
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}

interface SaveBarProps {
  onSave: () => Promise<SaveResult>;
  label: string;
}

function SaveBar({onSave, label}: SaveBarProps) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const run = async () => {
    setBusy(true);
    setDone(false);
    const result = await onSave();
    setBusy(false);
    if (result.ok) {
      setDone(true);
      window.setTimeout(() => setDone(false), 2600);
    }
  };

  return (
    <div className="studio-savebar">
      <button type="button" className="studio-btn" onClick={run} disabled={busy}>
        <Save size={16} strokeWidth={2} aria-hidden="true" />
        <span>{busy ? 'Saving…' : label}</span>
      </button>
      {done ? (
        <span className="studio-saved" role="status">
          Saved!
        </span>
      ) : null}
    </div>
  );
}
