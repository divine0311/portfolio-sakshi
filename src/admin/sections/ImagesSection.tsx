import {useRef, useState, type ReactNode} from 'react';
import {RotateCcw, Trash2, Upload} from 'lucide-react';
import {Field, RepeatList, SaveBar, StudioInput, StudioTextarea} from '../fields';
import {
  saveSiteContent,
  type SaveResult,
  type SiteContent,
  type SiteContentUpdate,
} from '../../lib/content';
import {
  deleteSiteImage,
  IMAGE_SLOTS,
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
  const [busySlot, setBusySlot] = useState<ImageSlot | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<ImageSlot, Meta>>>({});
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
    setBusySlot(slot);
    const result = await uploadSiteImage(slot, file);
    setBusySlot(null);

    if (!result.ok) {
      flash('bad', result.error);
      return;
    }
    // uploadSiteImage already wrote the row; mirror it into local state.
    const {loadSiteImages} = await import('../../lib/images');
    const fresh = await loadSiteImages();
    if (fresh.length > 0) onImagesChange(fresh);
    flash('ok', 'Image uploaded. Remember to press Save to keep the text too.');
  };

  const handleDelete = async (slot: ImageSlot) => {
    const current = find(slot);
    if (!current) return;
    if (
      !window.confirm(
        'Delete this image and restore the default? The heading, alt text and body text you set will be kept.',
      )
    ) {
      return;
    }

    setBusySlot(slot);
    const result = await deleteSiteImage(slot, current.storage_path);
    setBusySlot(null);
    if (!result.ok) {
      flash('bad', result.error);
      return;
    }
    applyRow(slot, {url: SLOT_DEFAULTS[slot], storage_path: ''});
    flash('ok', 'Image removed, default restored.');
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

  return (
    <div className="studio-editor">
      {storageReady ? null : (
        <p className="studio-note studio-note--warn">
          Image storage is not ready yet. Run <code>supabase/admin-security.sql</code> in the Supabase SQL
          editor, then reload this page. Until then uploads are disabled and the default images are shown.
        </p>
      )}

      <p className="studio-note">
        Each card below holds one section of the home page. Change the <strong>picture</strong> and the{' '}
        <strong>text</strong> in the same place, then press Save — both are written to the database together.
      </p>

      {IMAGE_SLOTS.map(({id: slot, label, hint}) => {
        const current = find(slot);
        const url = current?.url || SLOT_DEFAULTS[slot];
        const value = meta(slot);
        const busy = busySlot === slot;

        return (
          <fieldset className="studio-group" key={slot}>
            <legend className="studio-group__legend">{label}</legend>
            <p className="studio-note">{hint}</p>

            <div className="studio-imagerow">
              <div className="studio-imagerow__preview">
                <img src={url} alt={value.alt || label} />
              </div>

              <div className="studio-imagerow__actions">
                <input
                  ref={(node) => {
                    inputs.current[slot] = node;
                  }}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  className="studio-file"
                  onChange={(event) => {
                    void handleFile(slot, event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
                <button
                  type="button"
                  className="studio-btn"
                  disabled={busy || !storageReady}
                  onClick={() => inputs.current[slot]?.click()}
                >
                  <Upload size={16} strokeWidth={2} aria-hidden="true" />
                  <span>
                    {busy ? 'Uploading…' : current?.storage_path ? 'Replace image' : 'Upload image'}
                  </span>
                </button>
                {current?.storage_path ? (
                  <button
                    type="button"
                    className="studio-btn studio-btn--secondary"
                    disabled={busy}
                    onClick={() => handleDelete(slot)}
                  >
                    <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                    <span>Remove image</span>
                  </button>
                ) : (
                  <span className="studio-badge">Using default</span>
                )}
                <p className="studio-hint">
                  JPG, PNG, WebP, GIF or AVIF. Max {Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.
                </p>
              </div>
            </div>

            <Field label="Image heading" hint="Shown as the label next to the image.">
              <StudioInput
                value={value.heading}
                placeholder="My Journey"
                onChange={(next) => patchMeta(slot, {heading: next})}
              />
            </Field>
            <Field label="Image alt text" hint="Describes the image for screen readers and SEO.">
              <StudioInput
                value={value.alt}
                placeholder="Sakshi Gill"
                onChange={(next) => patchMeta(slot, {alt: next})}
              />
            </Field>
            <Field label="Image description" hint="A short line of supporting copy.">
              <StudioTextarea
                rows={2}
                value={value.description}
                onChange={(next) => patchMeta(slot, {description: next})}
              />
            </Field>

            {slotFields(slot, content, onPatch)}

            <SaveBar
              label={`Save ${label}`}
              onSave={() => handleSave(slot)}
            />

            {current?.storage_path ? (
              <button
                type="button"
                className="studio-linkbtn"
                onClick={() => {
                  applyRow(slot, {url: SLOT_DEFAULTS[slot], storage_path: ''});
                  forgetDraft(slot);
                  flash('ok', 'Preview reset locally — press Save to keep it.');
                }}
              >
                <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
                Reset preview to default
              </button>
            ) : null}
          </fieldset>
        );
      })}

      <fieldset className="studio-group">
        <legend className="studio-group__legend">Connect</legend>
        <p className="studio-note">
          Your contact block at the bottom of the page. Enquiries sent through the form also land in the{' '}
          <code>contact_messages</code> table and email you via Resend.
        </p>

        <Field label="Email">
          <StudioInput
            type="email"
            value={content.contact_email}
            onChange={(value) => onPatch({contact_email: value})}
          />
        </Field>
        <Field label="Phone">
          <StudioInput
            type="tel"
            value={content.contact_phone}
            onChange={(value) => onPatch({contact_phone: value})}
          />
        </Field>
        <Field label="LinkedIn" hint="Full profile URL, including https://">
          <StudioInput
            value={content.contact_linkedin}
            onChange={(value) => onPatch({contact_linkedin: value})}
          />
        </Field>

        <SaveBar
          label="Save connect"
          onSave={() =>
            saveSiteContent({
              contact_email: content.contact_email,
              contact_phone: content.contact_phone,
              contact_linkedin: content.contact_linkedin,
            })
          }
        />
      </fieldset>

      {notice ? (
        <p className={notice.tone === 'ok' ? 'studio-saved' : 'studio-error'} role="status">
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
