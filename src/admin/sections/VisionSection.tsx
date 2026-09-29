import {Field, SaveBar, StudioInput, StudioTextarea} from '../fields';
import {saveSiteContent, type SiteContent, type SiteContentUpdate} from '../../lib/content';

interface VisionSectionProps {
  content: SiteContent;
  onPatch: (patch: SiteContentUpdate) => void;
}

export default function VisionSection({content, onPatch}: VisionSectionProps) {
  return (
    <div className="studio-editor">
      <p className="studio-note">
        This is the closing statement on the home page. Keep it short and personal — it is the last thing
        a visitor reads before your contact form.
      </p>

      <fieldset className="studio-group">
        <legend className="studio-group__legend">Vision text</legend>
        <Field label="Subheading">
          <StudioInput value={content.vision_subheading} onChange={(value) => onPatch({vision_subheading: value})} />
        </Field>
        <Field label="Headline">
          <StudioTextarea
            rows={2}
            value={content.vision_headline}
            onChange={(value) => onPatch({vision_headline: value})}
          />
        </Field>
        <Field label="Paragraph">
          <StudioTextarea
            rows={7}
            value={content.vision_paragraph}
            onChange={(value) => onPatch({vision_paragraph: value})}
          />
        </Field>
      </fieldset>

      <SaveBar
        onSave={() =>
          saveSiteContent({
            vision_subheading: content.vision_subheading,
            vision_headline: content.vision_headline,
            vision_paragraph: content.vision_paragraph,
          })
        }
        label="Save vision"
      />
    </div>
  );
}
