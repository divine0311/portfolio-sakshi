import {useCallback, useEffect, useState} from 'react';
import {
  Briefcase,
  Eye,
  GraduationCap,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Settings,
  Star,
  Zap,
} from 'lucide-react';
import {isSupabaseConfigured} from '../lib/supabase';
import {
  loadCapabilities,
  loadBlogPosts,
  loadProjects,
  loadSiteContent,
  type Capability,
  type Project,
  type BlogPost,
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
import BlogSection from './sections/BlogSection';
import VisionSection from './sections/VisionSection';
import SettingsSection from './sections/SettingsSection';

const NAV = [
  {id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard},
  {id: 'projects', label: 'Projects', Icon: Briefcase},
  {id: 'images', label: 'Images', Icon: ImageIcon},
  {id: 'qualifications', label: 'Qualifications', Icon: GraduationCap},
  {id: 'capabilities', label: 'Capabilities', Icon: Zap},
  {id: 'vision', label: 'Vision', Icon: Star},
  {id: 'settings', label: 'Settings', Icon: Settings},
] as const;

type NavId = (typeof NAV)[number]['id'] | 'blog';

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
  // The Admin always mirrors the real database. The bundled seed is a public
  // fallback for the blog pages only, never a stand-in for stored rows.
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!isSupabaseConfigured);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [site, caps, projs, imgs, posts] = await Promise.all([
        loadSiteContent(),
        loadCapabilities(),
        loadProjects(),
        loadSiteImages(),
        loadBlogPosts(),
      ]);
      if (cancelled) return;
      if (site) setContent({...DEFAULT_SITE_CONTENT, ...site});
      else setOffline(true);
      if (caps && caps.length > 0) setCapabilities(caps);
      if (projs && projs.length > 0) setProjects(projs);
      if (imgs) setImages(imgs);
      if (posts) setBlogPosts(posts);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePatch = useCallback((patch: SiteContentUpdate) => {
    setContent((current) => ({...current, ...patch}));
  }, []);

  const activeLabel =
    activeTab === 'blog' ? 'Blog' : NAV.find((item) => item.id === activeTab)?.label ?? '';

  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <h1 className="studio-sidebar__title">Admin Panel</h1>

        <nav className="studio-tabs" aria-label="Admin sections">
          {NAV.map(({id, label, Icon}) => {
            const isActive = id === activeTab;
            return (
              <button
                type="button"
                key={id}
                className={`studio-tab ${isActive ? 'studio-tab--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                <span className="studio-tab__label">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="studio-sidebar__foot">
          <button
            type="button"
            className={`studio-tab ${activeTab === 'blog' ? 'studio-tab--active' : ''}`}
            onClick={() => setActiveTab('blog')}
          >
            <Newspaper size={18} strokeWidth={2} aria-hidden="true" />
            <span className="studio-tab__label">Blog</span>
          </button>
          <a
            className="studio-btn studio-btn--ghost studio-btn--compact"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
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
        {offline ? (
          <p className="studio-banner">
            {isSupabaseConfigured
              ? 'Supabase did not respond — the fields below show the built-in defaults and saving is disabled until it is reachable.'
              : 'Supabase is not configured yet — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart the dev server.'}
          </p>
        ) : null}

        <section className="studio-card">
          <header className="studio-card__head">
            <h2 className="studio-card__title">{activeLabel}</h2>
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
          {activeTab === 'blog' ? <BlogSection posts={blogPosts} onChange={setBlogPosts} /> : null}
          {activeTab === 'settings' ? <SettingsSection email={email} /> : null}
        </section>
      </main>
    </div>
  );
}
