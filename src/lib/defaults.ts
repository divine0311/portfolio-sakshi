import type {Capability, Project, SiteContent} from './content';

export const DEFAULT_PROJECTS: Project[] = [
  {
    key: 'typing-rush',
    kicker: 'Project 01 · Game',
    title: 'Typing Rush',
    url: 'https://typing-rush-game.vercel.app',
    beneficial_title: 'Why Typing Rush Is Beneficial',
    benefits: [
      'Reflex & Speed: Sharpens hand-eye coordination and increases keystroke velocity by up to 2x under real-time time constraints.',
      'Accuracy & Muscle Memory: Trains instinctive touch-typing patterns to drastically reduce typos in daily writing and coding.',
      'Focus & Flow State: Sprint rounds demand complete presence, eliminating distractions and conditioning mental endurance.',
      'Live Benchmark Metrics: Real-time WPM analytics and multiplier streaks provide clear, measurable self-improvement.',
    ],
    position: 1,
  },
  {
    key: 'gyanix-academy',
    kicker: 'Project 02 · Website',
    title: 'Gyanix Academy',
    url: 'https://gyanix-acedemy-gyanix-academy-8bqc.vercel.app',
    beneficial_title: 'Why Gyanix Academy Is Beneficial',
    benefits: [
      'In-Demand AI Curriculum: Teaches cutting-edge generative AI tools, full-funnel digital marketing, and content systems.',
      'Job & Client Readiness: Emphasizes actionable portfolio projects and practical execution over passive theoretical lectures.',
      'Self-Paced Learning: Modular tracks allow students and busy professionals to master high-income skills on their schedule.',
      'High-Speed UX Architecture: Lightweight and responsive design delivers instant load times and frictionless navigation on mobile.',
    ],
    position: 2,
  },
];

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero_name: 'Sakshi Gill',
  hero_roles: [
    "I'm a Digital Marketer",
    "I'm a Content Strategist",
    "I'm an AI-Powered Creator",
    "I'm a Brand Storyteller",
  ],
  hero_tagline:
    'I help brands find their voice and their audience - blending sharp digital marketing instincts with AI-powered tools to create content that actually connects. From strategy to execution, I turn ideas into stories people remember.',
  who_am_i_story:
    'I’m Sakshi Gill — someone driven by an honest love for visual storytelling and an endless curiosity about how creative ideas truly connect with people. Growing up through school, scoring a perfect 100% in 10th grade and 91.8% in 12th gave me a foundation of steady discipline, but it was my quiet, instinctive pull toward words, design, and creative expression that hinted at where I was headed. During my graduation, completing my B.A. from Indira Gandhi College, Kurukshetra University with a 9.34 CGPA, I learned to look at human emotions, culture, and narratives with deep analytical clarity. The defining turning point came when I discovered and completed my course in Digital Marketing with AI — suddenly, strategic communication and intelligent generative technology merged, giving my creative drive a clear and powerful purpose. Today, that journey shapes everything I build: turning raw ideas into captivating digital stories that people don\'t just scroll past, but genuinely remember.',
  qualification_1_title: 'Schooling & Academic Foundation',
  qualification_1_desc:
    'Achieved a rare 100% in 10th grade and 91.8% in 12th — proving that consistency, curiosity, and steadfast discipline build the strongest launchpad for creative growth.',
  qualification_1_timing: '2022-23',
  qualification_2_title: 'Bachelor of Arts (B.A.)',
  qualification_2_desc:
    'Graduated with an exceptional 9.34 CGPA, honing deep analytical clarity, cultural empathy, and an instinct for what makes human stories truly resonate.',
  qualification_2_timing: '2023-26',
  qualification_3_title: 'Digital Marketing with AI',
  qualification_3_desc:
    'The pivotal breakthrough — fusing strategic brand storytelling with cutting-edge AI tools to design high-impact, forward-looking content.',
  qualification_3_timing: '',
  journey_quotes: [
    '"Creativity is no longer just intuition; it is amplified imagination guided by data."',
    '"The boldest stories are written by those willing to dismantle yesterday’s assumptions."',
    'Every phase of my progression has been shaped by an obsession with mastery: diving into emerging AI tools before they became mainstream, deconstructing what makes narrative stick, and constantly testing new creative frameworks. Growth is not an accident — it is an intentional, relentless practice.',
  ],
  contact_email: 'divinesakshi03gmail.com@gmail.com',
  contact_phone: '',
  contact_linkedin: 'https://www.linkedin.com/in/sakshigill',
  projects_label: 'Portfolio & Works',
  projects_heading: 'My Projects',
  projects_subtitle:
    'A compact showcase of live applications, educational web platforms, and generative AI motion.',
  vision_subheading: 'Looking Forward',
  vision_headline: 'The Future Belongs to Storytellers Who Master Intelligent Machines.',
  vision_paragraph:
    "My vision is to architect campaigns and digital platforms that don't merely adapt to the AI revolution — they shape its cultural trajectory. By uniting human vulnerability and machine intelligence, we can build brands that inspire enduring loyalty and profound resonance.",
};

export const DEFAULT_CAPABILITIES: Capability[] = [
  {
    key: 'digital-marketing',
    title: 'Digital Marketing',
    position: 1,
    tools: [
      {name: 'LinkedIn', icon: 'linkedin'},
      {name: 'Pinterest', icon: 'pinterest'},
      {name: 'Google Ads', icon: 'target'},
      {name: 'Meta Ads', icon: 'megaphone'},
      {name: 'SEO Strategy', icon: 'search'},
      {name: 'Mailchimp', icon: 'mail'},
    ],
  },
  {
    key: 'ai-tools',
    title: 'AI Tools',
    position: 2,
    tools: [
      {name: 'ChatGPT', icon: 'chat'},
      {name: 'Gemini', icon: 'sparkles'},
      {name: 'Claude', icon: 'bot'},
      {name: 'Google AI Studio', icon: 'code'},
      {name: 'Midjourney', icon: 'image'},
      {name: 'Perplexity', icon: 'search'},
    ],
  },
  {
    key: 'video-ai',
    title: 'Video Creating with AI',
    position: 3,
    tools: [
      {name: 'Google Flow AI', icon: 'video'},
      {name: 'Kling AI', icon: 'video'},
      {name: 'Dropshot.ai', icon: 'camera'},
      {name: 'Runway Gen-3', icon: 'film'},
      {name: 'Luma Dream', icon: 'sparkles'},
      {name: 'Pika AI', icon: 'zap'},
    ],
  },
  {
    key: 'social-media',
    title: 'Social Media',
    position: 4,
    tools: [
      {name: 'Instagram', icon: 'camera'},
      {name: 'Facebook', icon: 'users'},
      {name: 'YouTube', icon: 'play'},
      {name: 'X (Twitter)', icon: 'at'},
      {name: 'LinkedIn', icon: 'linkedin'},
      {name: 'Pinterest', icon: 'pinterest'},
    ],
  },
  {
    key: 'editing',
    title: 'Editing',
    position: 5,
    tools: [
      {name: 'InShot', icon: 'scissors'},
      {name: 'CapCut', icon: 'scissors'},
      {name: 'VN', icon: 'scissors'},
      {name: 'Premiere Pro', icon: 'film'},
      {name: 'DaVinci Resolve', icon: 'sliders'},
      {name: 'Canva', icon: 'palette'},
    ],
  },
];
