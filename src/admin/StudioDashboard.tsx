import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Eye,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Sparkles,
  Target,
  Telescope,
  Trophy,
} from 'lucide-react';
import {isSupabaseConfigured} from '../lib/supabase';
import {
  loadCapabilities,
  loadProjects,
  loadSiteContent,
  type Capability,
  type Project,
  type SiteContent,
  type SiteContentUpdate,
} from '../lib/content';
import {loadSiteImages, type SiteImage} from '../lib/images';
import {DEFAULT_CAPABILITIES, DEFAULT_PROJECTS, DEFAULT_SITE_CONTENT} from '../lib/defaults';
import DashboardSection from './sections/DashboardSection';
import ProjectsSection from './sections/ProjectsSection';
import ImagesSection from './sections/ImagesSection';
import QualificationsSection from './sections/QualificationsSection';
import CapabilitiesSection from './sections/CapabilitiesSection';
import VisionSection from './sections/VisionSection';
import SettingsSection from './sections/SettingsSection';

const NAV = [
  {id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard},
  {id: 'projects', label: 'Projects', Icon: Trophy},
  {id: 'images', label: 'Images', Icon: ImageIcon},
  {id: 'qualifications', label: 'Qualifications', Icon: Sparkles},
  {id: 'capabilities', label: 'Capabilities', Icon: Target},
  {id: 'vision', label: 'Vision', Icon: Telescope},
  {id: 'settings', label: 'Settings', Icon: Settings},
] as const;

type NavId = (typeof NAV)[number]['id'];

interface StudioDashboardProps {
  onLogout: () => void;
  email: string | null;
}

export default function StudioDashboard({onLogout, email}: StudioDashboardProps) {
  const [activeTab, setActiveTab] = useState<NavId>('dashboard');
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [capabilities, setCapabilities] = useState<Capability[]>(DEFAULT_CAPABILITIES);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [images, setImages] = useState<SiteImage[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!isSupabaseConfigured);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [site, caps, projs, imgs] = await Promise.all([
        loadSiteContent(),
        loadCapabilities(),
        loadProjects(),
        loadSiteImages(),
      ]);
      if (cancelled) return;
      if (site) setContent({...DEFAULT_SITE_CONTENT, ...site});
      else setOffline(true);
      if (caps && caps.length > 0) setCapabilities(caps);
      if (projs && projs.length > 0) setProjects(projs);
      if (imgs) setImages(imgs);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePatch = useCallback((patch: SiteContentUpdate) => {
    setContent((current) => ({...current, ...patch}));
  }, []);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term === '') return [];
    return NAV.filter((item) => item.label.toLowerCase().includes(term));
  }, [query]);

  const jumpTo = (id: NavId) => {
    setActiveTab(id);
    setQuery('');
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && matches.length > 0) {
      event.preventDefault();
      jumpTo(matches[0].id);
    }
    if (event.key === 'Escape') setQuery('');
  };

  const active = NAV.find((item) => item.id === activeTab);

  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <div className="studio-brand">
          <span className="studio-brand__name">Sakshi</span>
          <span className="studio-brand__role">Digital Marketer</span>
        </div>

        <nav className="studio-tabs" aria-label="Admin sections">
          {NAV.map(({id, label, Icon}) => {
            const isActive = id === activeTab;
            const isDimmed = query.trim() !== '' && !matches.some((match) => match.id === id);
            return (
              <button
                type="button"
                key={id}
                className={`studio-tab ${isActive ? 'studio-tab--active' : ''} ${isDimmed ? 'studio-tab--dim' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => jumpTo(id)}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                <span className="studio-tab__label">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="studio-sidebar__foot">
          <a className="studio-btn studio-btn--ghost studio-btn--compact" href="/" target="_blank" rel="noopener noreferrer">
            <Eye size={16} strokeWidth={2} aria-hidden="true" />
            <span>View site</span>
          </a>
          <button type="button" className="studio-btn studio-btn--ghost studio-btn--compact" onClick={onLogout}>
            <LogOut size={16} strokeWidth={2} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="studio-main">
        <div className="studio-search">
          <Search size={18} strokeWidth={2} aria-hidden="true" className="studio-search__icon" />
          <input
            className="studio-search__input"
            type="search"
            value={query}
            placeholder="Search or jump to a section…"
            aria-label="Search or jump to a section"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {matches.length > 0 ? (
            <ul className="studio-search__results">
              {matches.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => jumpTo(item.id)}>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {offline ? (
          <p className="studio-banner">
            {isSupabaseConfigured
              ? 'Supabase did not respond — the fields below show the built-in defaults and saving is disabled until it is reachable.'
              : 'Supabase is not configured yet — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart the dev server.'}
          </p>
        ) : null}

        <section className="studio-card">
          <header className="studio-card__head">
            <h2 className="studio-card__title">{active?.label}</h2>
            <span className={`studio-status ${offline ? 'studio-status--warn' : 'studio-status--ok'}`}>
              {loading ? 'Loading…' : offline ? 'Supabase offline' : 'Supabase connected'}
            </span>
          </header>

          {activeTab === 'dashboard' ? (
            <DashboardSection
              content={content}
              projects={projects}
              capabilities={capabilities}
              images={images}
              loading={loading}
            />
          ) : null}
          {activeTab === 'projects' ? (
            <ProjectsSection
              content={content}
              onPatch={handlePatch}
              projects={projects}
              onProjectsChange={setProjects}
            />
          ) : null}
          {activeTab === 'images' ? (
            <ImagesSection
              content={content}
              onPatch={handlePatch}
              images={images}
              onImagesChange={setImages}
              storageReady={!offline}
            />
          ) : null}
          {activeTab === 'qualifications' ? (
            <QualificationsSection content={content} onPatch={handlePatch} />
          ) : null}
          {activeTab === 'capabilities' ? (
            <CapabilitiesSection capabilities={capabilities} onChange={setCapabilities} />
          ) : null}
          {activeTab === 'vision' ? <VisionSection content={content} onPatch={handlePatch} /> : null}
          {activeTab === 'settings' ? <SettingsSection email={email} /> : null}
        </section>
      </main>
    </div>
  );
}
