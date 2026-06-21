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

export interface ToolCategory {
  id: string
  title: string
  description: string
  imageFile: string       // filename only, lives in /public
  tools: Tool[]
  quickStart?: string[]
  levelUp?: string[]
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
    title: 'Image & Design',
    description: 'Create graphics, generate custom images, and produce professional visuals for your business — no design background needed.',
    imageFile: 'ai-arsenal-image-design.png',
    tools: [
      {
        name: 'Canva',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Template-Based',
        url: 'https://www.canva.com',
        bestFor: 'Designing social posts, presentations, and marketing visuals',
        features: [
          'Thousands of templates for posts, slides, and ads',
          'Drag-and-drop editor (no design skills needed)',
          'Magic Design, background remover, and AI tools',
          'Brand kit for consistent colors, fonts, and logos',
        ],
        useWhen: 'You want structure and templates instead of starting from scratch',
        alsoUsedIn: ['Presentations & Slides'],
      },
      {
        name: 'Gemini',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://gemini.google.com',
        bestFor: 'Creating images with text, infographics, and marketing visuals',
        features: [
          'Generates images with clean, readable text',
          'Strong for infographics, social graphics, and ads',
          'Combines writing + visuals in one workflow',
          'Can connect to Google tools (Docs, Drive, Gmail) when enabled',
          "Powered by Google's Imagen / Nano Banana models",
        ],
        useWhen: 'You need a free image with text inside it — ad graphics, quote cards, social posts with words',
        alsoUsedIn: ['Writing & Content Creation'],
      },
      {
        name: 'Grok',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://grok.x.ai',
        bestFor: 'Social graphics and trend-based visual content',
        features: [
          'Generates images with legible text embedded',
          'Built into X (Twitter) for real-time content creation',
          'Can post/share directly to your feed',
          'Pulls from live trends and conversations',
        ],
        useWhen: "You're creating fast-moving social content or trend-based visuals",
        alsoUsedIn: ['Writing & Content Creation', 'Social Media'],
      },
      {
        name: 'DALL-E 3 (via ChatGPT)',
        difficulty: 'Beginner',
        pricingModel: 'Freemium',
        inputModel: 'Prompt-Based',
        url: 'https://chat.openai.com',
        bestFor: 'Generating custom images inside ChatGPT — no extra tools',
        features: [
          'Generates images from text descriptions directly in the chat window',
          'Strong at photorealistic scenes and illustrated concepts',
          'Edit images you upload — change backgrounds, add elements, adjust style',
          'Free to use with a ChatGPT account',
        ],
        useWhen: 'You need a custom image and already have ChatGPT open — fastest path to a visual',
      },
      {
        name: 'Ideogram',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://ideogram.ai',
        bestFor: 'Text-in-image graphics and quick image-to-video animations',
        features: [
          'Best-in-class text rendering inside images',
          'Great for quotes, ads, thumbnails, and graphics',
          'Simple prompting with consistent outputs',
          'Fast generation',
        ],
        useWhen: 'You need a clean graphic with words in it, or want to quickly animate a photo into a short clip',
      },
      {
        name: 'Midjourney',
        difficulty: 'Advanced',
        pricingModel: 'Paid',
        inputModel: 'Prompt-Based',
        url: 'https://www.midjourney.com',
        bestFor: 'High-end visuals, brand imagery, and product mockups',
        features: [
          'Produces highly polished, aesthetic images',
          'Strong for brand visuals and product mockups',
          'Style references and moodboards for consistency',
          'More creative control than beginner tools',
        ],
        useWhen: "Image quality really matters and you're willing to invest time in learning the prompting style",
      },
      {
        name: 'OpenArt',
        difficulty: 'Intermediate',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://openart.ai',
        bestFor: 'Advanced image generation with more control',
        features: [
          'Access to multiple AI models in one place',
          'Style customization and control',
          'Prompt library and workflows',
          'More flexibility than basic tools',
        ],
        useWhen: 'You want more control over style and outputs',
      },
      {
        name: 'Leonardo AI',
        difficulty: 'Intermediate',
        pricingModel: 'Free + Paid',
        inputModel: 'Prompt-Based',
        url: 'https://leonardo.ai',
        bestFor: 'Consistent branding, product images, and character visuals',
        features: [
          'Train models for consistent styles',
          'Strong for product and brand visuals',
          'Fine control over lighting and detail',
          'Batch generation for multiple assets',
        ],
        useWhen: 'You need visuals that match across your brand',
      },
      {
        name: 'Adobe Firefly',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Template-Based',
        url: 'https://firefly.adobe.com',
        bestFor: 'Commercial-safe images and editing',
        features: [
          'Licensed outputs for business/commercial use',
          'Generative fill to edit parts of images',
          'Text effects and design tools',
          'Integrates with Photoshop and Adobe tools',
        ],
        useWhen: 'You need images for ads, clients, or business use',
      },
      {
        name: 'Remove.bg',
        difficulty: 'Beginner',
        pricingModel: 'Free + Paid',
        inputModel: 'Automated',
        url: 'https://www.remove.bg',
        bestFor: 'Removing backgrounds instantly',
        features: [
          'One-click background removal',
          'Clean, professional cutouts',
          'Works for people, products, and objects',
          'Fast and simple',
        ],
        useWhen: 'You need clean images for marketing or design',
      },
    ],
    quickStart: [
      'Start with Canva for most designs',
      'Use Gemini or Grok for quick visuals with text',
      'Use Ideogram for text-heavy graphics',
    ],
    levelUp: [
      'Use Midjourney or Leonardo for brand visuals',
      'Use OpenArt for more control',
      'Combine Canva + AI images for full content creation',
    ],
  },

  // ─── Placeholder categories — content pending, structure ready ───────────
  {
    id: 'writing-content',
    title: 'Writing & Content Creation',
    description: 'Draft, edit, and scale your content — blogs, captions, scripts, and everything in between.',
    imageFile: 'ai-arsenal-writing-content.png',
    tools: [],
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
