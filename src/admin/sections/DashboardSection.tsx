import type {Capability, Project, SiteContent} from '../../lib/content';
import type {SiteImage} from '../../lib/images';

interface DashboardSectionProps {
  content: SiteContent;
  projects: Project[];
  capabilities: Capability[];
  images: SiteImage[];
  loading: boolean;
}

function countTools(capabilities: Capability[]): number {
  return capabilities.reduce((total, capability) => total + capability.tools.length, 0);
}

function countQualifications(content: SiteContent): number {
  return [
    content.qualification_1_title,
    content.qualification_2_title,
    content.qualification_3_title,
  ].filter((title) => title.trim() !== '').length;
}

export default function DashboardSection({
  content,
  projects,
  capabilities,
  images,
  loading,
}: DashboardSectionProps) {
  const stats = [
    {label: 'Projects', value: projects.length},
    {label: 'Images', value: images.filter((image) => image.url.trim() !== '').length},
    {label: 'Qualifications', value: countQualifications(content)},
    {label: 'Tools', value: countTools(capabilities)},
  ];

  return (
    <div className="studio-editor">
      <div className="studio-stats">
        {stats.map((stat) => (
          <div className="studio-stat" key={stat.label}>
            <p className="studio-stat__value">{loading ? '—' : stat.value}</p>
            <p className="studio-stat__label">{stat.label}</p>
          </div>
        ))}
      </div>

      <p className="studio-note">
        Welcome back{content.hero_name ? `, ${content.hero_name}` : ''}. Everything you save here appears on
        the public portfolio straight away. Start with <strong>Projects</strong> to add work, or{' '}
        <strong>Images</strong> to swap the visuals on the home page.
      </p>

      <p className="studio-note">
        Tip: your contact form keeps every enquiry in the Supabase <code>contact_messages</code> table and
        emails you through Resend, so nothing is lost even if a visitor never leaves the page.
      </p>
    </div>
  );
}
