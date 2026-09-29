import {Field, RepeatList, SaveBar, StudioInput, StudioTextarea} from '../fields';
import {saveSiteContent, type SiteContent, type SiteContentUpdate} from '../../lib/content';

interface QualificationsSectionProps {
  content: SiteContent;
  onPatch: (patch: SiteContentUpdate) => void;
}

const SLOTS = [1, 2, 3] as const;

export default function QualificationsSection({content, onPatch}: QualificationsSectionProps) {
  const patch: SiteContentUpdate = {};
  for (const slot of SLOTS) {
    patch[`qualification_${slot}_title`] = content[`qualification_${slot}_title`];
    patch[`qualification_${slot}_desc`] = content[`qualification_${slot}_desc`];
    patch[`qualification_${slot}_timing`] = content[`qualification_${slot}_timing`];
  }
  patch.journey_quotes = content.journey_quotes;

  return (
    <div className="studio-editor">
      {SLOTS.map((slot) => (
        <fieldset className="studio-group" key={slot}>
          <legend className="studio-group__legend">Qualification {slot}</legend>
          <Field label="Title">
            <StudioInput
              value={content[`qualification_${slot}_title`]}
              placeholder="Senior Creative Designer"
              onChange={(value) => onPatch({[`qualification_${slot}_title`]: value})}
            />
          </Field>
          <Field label="Timing" hint="When you did it, e.g. 2024 — Present.">
            <StudioInput
              value={content[`qualification_${slot}_timing`]}
              placeholder="2024 — Present"
              onChange={(value) => onPatch({[`qualification_${slot}_timing`]: value})}
            />
          </Field>
          <Field label="Description">
            <StudioTextarea
              rows={3}
              value={content[`qualification_${slot}_desc`]}
              onChange={(value) => onPatch({[`qualification_${slot}_desc`]: value})}
            />
          </Field>
        </fieldset>
      ))}

      <fieldset className="studio-group">
        <legend className="studio-group__legend">Journey quotes</legend>
        <RepeatList
          label="Quotes"
          hint="One per row. These rotate in the journey section on the home page."
          items={content.journey_quotes}
          onChange={(next) => onPatch({journey_quotes: next})}
          placeholder="Design is thinking made visible."
          addLabel="Add quote"
        />
      </fieldset>

      <SaveBar onSave={() => saveSiteContent(patch)} label="Save qualifications" />
    </div>
  );
}
