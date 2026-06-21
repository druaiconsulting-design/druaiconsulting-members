// ─── AI Arsenal — data model ────────────────────────────────────────────────
// Single source of truth for the AI Arsenal tool directory (Resources).
// Add/edit tools here — no layout code needs to change.

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Tool {
  name: string
  difficulty: Difficulty
  pricingModel: string   // e.g. "Free + Paid", "Freemium", "Paid"
  inputModel: string     // e.g. "Template-Based", "Prompt-Based", "Automated"
  url: string
  bestFor: string
  features: string[]
  useWhen: string
  alsoUsedIn?: string[]  // category titles this tool also shows up under
}

export interface QuickRecommendation {
  need: string
  tool: string
}

export interface ToolCategory {
  id: string
  title: string
  description: string
  imageFile: string       // filename only, lives in /public
  tools: Tool[]
  quickStart?: string[]
  levelUp?: string[]
  quickRecommendations?: QuickRecommendation[]
}

// ─── Difficulty → color (traffic-light, kept universal for readability) ────

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Beginner: '#D4AF37',     // gold
  Intermediate: '#C2185B', // magenta
  Advanced: '#1B4D8E',     // lighter navy
}

// ─── Categories ──────────────────────────────────────────────────────────────

export const AI_ARSENAL_CATEGORIES: ToolCategory[] = [
  {
    id: 'image-design',
    title: 'Design & Image',
    description: 'Create graphics, craft custom images, and generate professional visuals for your business—no design experience required.',
    imageFile: 'design-image.png',
    tools: [
      {
        name: 'Canva',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Template-Based',
        url: 'https://www.canva.com',
        bestFor: 'Creating professional graphics, presentations, and marketing materials quickly.',
        features: [
          'Drag-and-drop design tools',
          'Thousands of templates',
          'AI image and content generation',
          'Team collaboration and brand kits',
        ],
        useWhen: 'You need social media graphics, presentations, flyers, workbooks, or marketing assets without design experience.',
        alsoUsedIn: ['Presentations & Slides'],
      },
      {
        name: 'Gemini',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://gemini.google.com',
        bestFor: "Generating AI-powered visuals and creative concepts within Google's ecosystem.",
        features: [
          'Conversational image generation',
          'Integrates with Google Workspace',
          'Brainstorming assistance',
          'Multimodal capabilities',
        ],
        useWhen: 'You need ideas, quick graphics, or visuals alongside documents, spreadsheets, and presentations.',
        alsoUsedIn: ['Content Creation & Writing'],
      },
      {
        name: 'Grok',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://grok.com',
        bestFor: 'Creating real-time, conversational images with access to current information and trends.',
        features: [
          'Conversational image creation',
          'Real-time web knowledge',
          'Creative ideation',
          'Social content assistance',
        ],
        useWhen: 'Creating trending social content, memes, and visuals tied to current events.',
        alsoUsedIn: ['Content Creation & Writing', 'Social Media'],
      },
      {
        name: 'DALL·E 3',
        difficulty: 'Beginner',
        pricingModel: 'Freemium',
        inputModel: 'Prompt-Based',
        url: 'https://openai.com/dall-e-3',
        bestFor: 'Highly detailed image generation from natural language prompts.',
        features: [
          'Excellent prompt understanding',
          'Photorealistic images',
          'Text within images',
          'Creative scene generation',
        ],
        useWhen: 'You need marketing visuals, conceptual graphics, or illustrations from simple instructions.',
      },
      {
        name: 'Ideogram',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://ideogram.ai',
        bestFor: 'Creating images with accurate text and typography.',
        features: [
          'Superior text rendering',
          'Logo concepts',
          'Poster creation',
          'Social graphics',
        ],
        useWhen: 'Your image needs words, headlines, quotes, or branded messaging inside the graphic.',
      },
      {
        name: 'Midjourney',
        difficulty: 'Advanced',
        pricingModel: 'Paid',
        inputModel: 'Prompt-Based',
        url: 'https://www.midjourney.com',
        bestFor: 'Producing artistic, cinematic, and visually stunning imagery.',
        features: [
          'Exceptional artistic quality',
          'Cinematic style',
          'Highly creative outputs',
          'Strong visual aesthetics',
        ],
        useWhen: 'Creating premium branding, book covers, concept art, and attention-grabbing visuals.',
      },
      {
        name: 'OpenArt',
        difficulty: 'Intermediate',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://openart.ai',
        bestFor: 'Experimenting with multiple AI art styles and custom image models.',
        features: [
          'Multiple AI models',
          'Style customization',
          'Image editing tools',
          'Community templates',
        ],
        useWhen: 'You want flexibility, experimentation, and access to many artistic styles.',
      },
      {
        name: 'Leonardo AI',
        difficulty: 'Intermediate',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://leonardo.ai',
        bestFor: 'Creating production-ready marketing assets and game-quality graphics.',
        features: [
          'Consistent character generation',
          'Image editing and upscaling',
          'Asset creation tools',
          'Fine-tuned models',
        ],
        useWhen: 'You need branded graphics, product mockups, or consistent visual assets.',
      },
      {
        name: 'Adobe Firefly',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Template-Based',
        url: 'https://firefly.adobe.com',
        bestFor: 'Commercially safe AI image generation integrated with Adobe products.',
        features: [
          'Commercial-friendly training data',
          'Generative Fill',
          'Text effects',
          'Seamless Adobe integration',
        ],
        useWhen: 'Working in Photoshop, Illustrator, or creating business assets that require commercial usage confidence.',
      },
      {
        name: 'remove.bg',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Automated',
        url: 'https://www.remove.bg',
        bestFor: 'Removing backgrounds from images in seconds.',
        features: [
          'One-click background removal',
          'Transparent PNG export',
          'Batch processing',
          'Fast and easy editing',
        ],
        useWhen: 'You need headshots, product photos, logos, or images with transparent backgrounds.',
      },
      {
        name: 'Claude',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://claude.ai',
        bestFor: 'Building interactive designs, diagrams, infographics, and UI mockups straight from a conversation — code-driven visuals, not photos.',
        features: [
          'Generates SVG graphics, diagrams, and infographics from a simple prompt',
          'Builds interactive HTML/React mockups and prototypes you can refine in real time',
          'Creates polished slide decks, one-pagers, and presentation visuals',
          'Iterates on designs instantly based on feedback — no separate design software needed',
        ],
        useWhen: 'You need a diagram, infographic, UI mockup, or interactive prototype built fast, without opening a separate design tool.',
        alsoUsedIn: ['Content Creation & Writing'],
      },
    ],
    quickRecommendations: [
      { need: 'Social Media Graphics', tool: 'Canva' },
      { need: 'Presentations & Workbooks', tool: 'Canva' },
      { need: 'Marketing Images', tool: 'DALL·E 3' },
      { need: 'Images with Text', tool: 'Ideogram' },
      { need: 'Premium Artistic Images', tool: 'Midjourney' },
      { need: 'Brand Consistency', tool: 'Leonardo AI' },
      { need: 'Adobe Workflow', tool: 'Adobe Firefly' },
      { need: 'Trending Content', tool: 'Grok' },
      { need: 'Brainstorming & Google Integration', tool: 'Gemini' },
      { need: 'Background Removal', tool: 'remove.bg' },
      { need: 'Experimenting with Styles', tool: 'OpenArt' },
      { need: 'Diagrams, Mockups & Interactive Designs', tool: 'Claude' },
    ],
  },

  // ─── Placeholder categories — content pending, structure ready ───────────
  {
    id: 'writing-content',
    title: 'Content Creation & Writing',
    description: 'Draft, edit, and scale your content — blogs, captions, scripts, and everything in between.',
    imageFile: 'content-creation.png',
    tools: [
      {
        name: 'ChatGPT',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://chatgpt.com',
        bestFor: 'An all-in-one AI assistant for content creation, strategy, images, research, and productivity.',
        features: [
          'Create custom images, infographics, social graphics, and ads',
          'Write, brainstorm, research, and analyze information',
          'Connect with Google Drive, Gmail, Docs, and other tools',
          'Build custom GPTs and automate workflows',
        ],
        useWhen: 'You need one platform to think, create, design, research, and streamline work across your business.',
      },
      {
        name: 'Claude',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://claude.ai',
        bestFor: 'A top-tier AI assistant for deep writing, document analysis, and complex reasoning — built for quality over speed.',
        features: [
          'Massive context window for analyzing entire books, contracts, or codebases at once',
          'Best-in-class long-form writing — natural tone, strong structure, minimal editing needed',
          'Deep analytical reasoning for strategy, research synthesis, and complex problem-solving',
          'Built-in document, spreadsheet, and presentation creation directly in chat',
        ],
        useWhen: 'You need the highest-quality long-form writing, deep document review, or careful reasoning on complex or high-stakes content.',
        alsoUsedIn: ['Design & Image'],
      },
      {
        name: 'Gemini',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://gemini.google.com',
        bestFor: "Boosting productivity within the Google ecosystem.",
        features: [
          'Deep Google Workspace integration',
          'Works with Gmail, Docs, Sheets, and Drive',
          'Research and content assistance',
          'Multimodal capabilities',
        ],
        useWhen: 'Your business runs on Google Workspace and you need AI embedded into your daily workflow.',
        alsoUsedIn: ['Design & Image'],
      },
      {
        name: 'NotebookLM',
        difficulty: 'Beginner',
        pricingModel: 'Free',
        inputModel: 'Source-Based',
        url: 'https://notebooklm.google.com',
        bestFor: 'Turning your documents into an AI-powered research assistant.',
        features: [
          'Upload your own sources',
          'Source-grounded answers',
          'Audio overviews and podcasts',
          'Summaries and study guides',
        ],
        useWhen: 'You need to research, study, build workshops, or synthesize information from multiple documents.',
      },
      {
        name: 'Napkin AI',
        difficulty: 'Beginner',
        pricingModel: 'Freemium',
        inputModel: 'Prompt-Based',
        url: 'https://www.napkin.ai',
        bestFor: 'Converting ideas and text into visual diagrams and frameworks.',
        features: [
          'Creates visual maps automatically',
          'Flowcharts and frameworks',
          'Easy sharing and exporting',
          'Turns notes into graphics',
        ],
        useWhen: 'You need to explain concepts, build presentations, or create visual frameworks and process diagrams.',
      },
      {
        name: 'Grammarly',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Automated',
        url: 'https://www.grammarly.com',
        bestFor: 'Improving writing quality, clarity, and professionalism.',
        features: [
          'Grammar and spelling corrections',
          'Tone suggestions',
          'Clarity improvements',
          'Writing assistance across apps',
        ],
        useWhen: 'You need to write emails, proposals, reports, LinkedIn posts, or any professional communication.',
      },
    ],
    quickRecommendations: [
      { need: 'All-in-One AI Assistant', tool: 'ChatGPT' },
      { need: 'Strategic Thinking & Brainstorming', tool: 'ChatGPT' },
      { need: 'Research & Knowledge Management', tool: 'NotebookLM' },
      { need: 'Long Reports & Documents', tool: 'Claude' },
      { need: 'Google Workspace Productivity', tool: 'Gemini' },
      { need: 'Visual Frameworks & Diagrams', tool: 'Napkin AI' },
      { need: 'Professional Writing & Editing', tool: 'Grammarly' },
      { need: 'Workshop Development', tool: 'NotebookLM + ChatGPT' },
      { need: 'Training Materials & Course Creation', tool: 'ChatGPT + NotebookLM' },
      { need: 'Executive Reports & Analysis', tool: 'Claude' },
      { need: 'Email & Proposal Writing', tool: 'Grammarly + ChatGPT' },
      { need: 'Content Creation & Social Posts', tool: 'ChatGPT' },
      { need: 'Infographics & Social Graphics', tool: 'ChatGPT' },
      { need: 'Business Automation & Connected Workflows', tool: 'ChatGPT' },
    ],
  },
  {
    id: 'ai-real-estate',
    title: 'AI for Real Estate',
    description: 'Specialized tools built for listings, lead follow-up, and property marketing.',
    imageFile: 'ai-arsenal-real-estate.png',
    tools: [],
  },
  {
    id: 'ecommerce',
    title: 'eCommerce AI Tools',
    description: 'Product descriptions, store automation, and AI-powered selling tools.',
    imageFile: 'ai-arsenal-ecommerce.png',
    tools: [],
  },
  {
    id: 'productivity',
    title: 'Productivity & Organization',
    description: 'Keep your business organized — notes, tasks, scheduling, and second-brain tools.',
    imageFile: 'ai-arsenal-productivity.png',
    tools: [],
  },
  {
    id: 'funnels-automation',
    title: 'Funnels & Automation',
    description: 'CRM, funnels, and automations that run your business while you lead it.',
    imageFile: 'ai-arsenal-funnels-automation.png',
    tools: [
      {
        name: 'GoHighLevel (GHL)',
        difficulty: 'Intermediate',
        pricingModel: 'Paid',
        inputModel: 'Automated',
        url: '#',
        bestFor: 'CRM, funnels, automations, calendars, and email — the backbone of the DRU AI Consulting ecosystem',
        features: [
          'All-in-one CRM and pipeline management',
          'Funnel and landing page builder',
          'Built-in automations and workflows',
          'Calendar booking and email/SMS in one platform',
        ],
        useWhen: 'You want one platform running your whole client and lead pipeline',
      },
    ],
  },
  {
    id: 'website-app-building',
    title: 'Website & App Building',
    description: 'Build full websites and apps with plain-English prompts — no developer required.',
    imageFile: 'ai-arsenal-website-app-building.png',
    tools: [
      {
        name: 'Lovable',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://lovable.dev/invite/FXZHFT4',
        bestFor: 'Building full-stack web apps with plain English prompts',
        features: [
          'No-code, prompt-based app building',
          'Full-stack apps, not just static pages',
          'Fast iteration from idea to live app',
        ],
        useWhen: "You're a non-developer who needs a real digital product, fast",
      },
    ],
  },
  {
    id: 'research-analysis',
    title: 'Research & Analysis',
    description: 'Deep research, data synthesis, and fast answers backed by sources.',
    imageFile: 'ai-arsenal-research-analysis.png',
    tools: [
      {
        name: 'Manus AI',
        difficulty: 'Advanced',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://manus.im/invitation/KJTBXETXGVNB?utm_source=invitation&utm_medium=social&utm_campaign=copy_link',
        bestFor: 'Complex, multi-step agent tasks — research, workflows, and automation that used to require a team',
        features: [
          'The most capable AI agent platform for multi-step tasks',
          'Builds, deploys, and automates real workflows',
          'Handles research and execution, not just chat',
        ],
        useWhen: 'You need an AI agent to actually complete a multi-step task, not just answer a question',
      },
    ],
  },
  {
    id: 'sales-leadgen',
    title: 'Sales & Lead Generation',
    description: 'Find leads, qualify prospects, and move deals forward faster.',
    imageFile: 'ai-arsenal-sales-leadgen.png',
    tools: [],
  },
  {
    id: 'email-communication',
    title: 'Email & Communication',
    description: 'Write, manage, and automate your inbox and outreach.',
    imageFile: 'ai-arsenal-email-communication.png',
    tools: [],
  },
  {
    id: 'presentations-slides',
    title: 'Presentations & Slides',
    description: 'Turn ideas into polished decks in minutes, not hours.',
    imageFile: 'ai-arsenal-presentations-slides.png',
    tools: [],
  },
  {
    id: 'social-media',
    title: 'Social Media',
    description: 'Plan, create, and schedule content across every platform.',
    imageFile: 'ai-arsenal-social-media.png',
    tools: [],
  },
  {
    id: 'voice-audio-music',
    title: 'Voice, Audio & Music',
    description: 'Generate voiceovers, music, and audio content with AI.',
    imageFile: 'ai-arsenal-voice-audio-music.png',
    tools: [],
  },
  {
    id: 'video-creation-editing',
    title: 'Video Creation & Editing',
    description: 'Edit, generate, and repurpose video content at speed.',
    imageFile: 'ai-arsenal-video-creation-editing.png',
    tools: [],
  },
]
