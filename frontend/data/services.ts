export interface Service {
  id: string
  name: string
  category: 'tech' | 'ai' | 'creative' | 'marketing' | 'legal' | 'mission'
  categoryLabel: string
  icon: string
  short: string
  tagline: string
  size: 'small' | 'large'
  whyDevUp: Array<{
    title: string
    description: string
  }>
  whatsIncluded: string[]
  howItWorks: Array<{
    step: number
    title: string
    description: string
  }>
  engagementType: string
  timeline: string
  supportLevel: string
  relatedIds: string[]
  animationType: string
}

export const services: Service[] = [
  // --- TECH & INFRASTRUCTURE ---
  {
    id: "gpu-hosting",
    name: "GPU Hosting & AI Compute",
    category: "tech",
    categoryLabel: "Tech & Infrastructure",
    icon: "Cpu",
    short: "High-performance GPU clusters for training and inference. A100s, H100s, and RTX 4090s available on-demand.",
    tagline: "Unleash your models with high-availability enterprise compute at startup pricing.",
    size: "large",
    whyDevUp: [
      { title: "Student & Startup Pricing", description: "Up to 40% below market rates exclusively for startups within the DevUp ecosystem." },
      { title: "On-Demand Scaling", description: "Spin clusters up or down in minutes. Pay per hour with no hidden egress fees." },
      { title: "Pre-configured Environments", description: "Images come pre-loaded with CUDA, PyTorch, TensorFlow, and HuggingFace toolkits." },
      { title: "Direct ML Engineering Support", description: "Our in-house ML engineers are available to help you optimize workloads and batching." }
    ],
    whatsIncluded: [
      "Access to NVIDIA A100, H100, and RTX 4090 clusters",
      "Dedicated IP and high-bandwidth networking",
      "Pre-configured Docker/Jupyter environments",
      "24/7 infrastructure monitoring",
      "Custom SLURM scheduling for multi-node jobs"
    ],
    howItWorks: [
      { step: 1, title: "Architecture Review", description: "We assess your model size, training dataset, and inference requirements." },
      { step: 2, title: "Provisioning", description: "We spin up your requested compute instance and provide secure SSH/Jupyter access." },
      { step: 3, title: "Optimization", description: "Ongoing support to maximize GPU utilization and minimize your cloud bill." }
    ],
    engagementType: "Pay-as-you-go hourly / Reserved monthly",
    timeline: "On-demand (minutes)",
    supportLevel: "L3 Infrastructure Support",
    relatedIds: ["cloud-infra", "ai-product"],
    animationType: "GpuTerminal"
  },
  {
    id: "backend-arch",
    name: "Backend Architecture",
    category: "tech",
    categoryLabel: "Tech & Infrastructure",
    icon: "Server",
    short: "Scalable Node.js, Python, Go backends. Microservices, monoliths, or serverless — we design what fits you.",
    tagline: "Robust, scalable, and secure backend systems built for your first million users.",
    size: "small",
    whyDevUp: [
      { title: "Future-Proof Design", description: "We architect systems that handle day-1 scale without over-engineering for day-1000." },
      { title: "Language Agnostic", description: "Expertise across Node.js, Python, Go, and Rust depending on your workload needs." },
      { title: "Security First", description: "Built-in rate limiting, JWT auth, input validation, and DDoS protection." },
      { title: "Clean Documentation", description: "Swagger/OpenAPI specs delivered with every backend we build." }
    ],
    whatsIncluded: [
      "API design and implementation (REST/GraphQL)",
      "Authentication and authorization flow",
      "Database schema design and ORM setup",
      "Error handling and logging middleware",
      "Comprehensive API documentation"
    ],
    howItWorks: [
      { step: 1, title: "Requirements Gathering", description: "We map out your data models, user flows, and expected traffic." },
      { step: 2, title: "Development", description: "Iterative sprints delivering functional API endpoints." },
      { step: 3, title: "Handoff", description: "Full code transfer, documentation, and a post-launch support period." }
    ],
    engagementType: "Project-based or Monthly Retainer",
    timeline: "3 - 6 Weeks",
    supportLevel: "Dedicated Engineering Pod",
    relatedIds: ["db-design", "cloud-infra", "api-integrations"],
    animationType: "StackedServers"
  },
  {
    id: "cloud-infra",
    name: "Cloud Infrastructure",
    category: "tech",
    categoryLabel: "Tech & Infrastructure",
    icon: "Cloud",
    short: "AWS, GCP, Azure setup and management. DevOps pipelines, CI/CD, Docker, Kubernetes.",
    tagline: "Zero-downtime deployments and iron-clad cloud architecture.",
    size: "small",
    whyDevUp: [
      { title: "Cloud Agnostic", description: "We recommend the best cloud provider based on your specific tech stack and budget." },
      { title: "Infrastructure as Code", description: "Everything is codified using Terraform or Pulumi for perfect reproducibility." },
      { title: "Automated CI/CD", description: "Push to main and deploy. We build seamless GitHub Actions or GitLab pipelines." },
      { title: "Cost Optimization", description: "We actively audit your cloud setup to ensure you aren't burning cash on idle resources." }
    ],
    whatsIncluded: [
      "AWS/GCP/Azure account setup and IAM roles",
      "VPC, Subnets, and Load Balancer configuration",
      "Dockerization of existing applications",
      "Kubernetes (EKS/GKE) cluster setup",
      "Cost alerting and budget thresholds"
    ],
    howItWorks: [
      { step: 1, title: "Audit & Architecture", description: "We review your codebase and design the optimal cloud topology." },
      { step: 2, title: "Implementation", description: "We write the IaC scripts and configure the staging/production environments." },
      { step: 3, title: "Pipeline Setup", description: "We hook up your Git repository to automatically build and deploy." }
    ],
    engagementType: "Custom Quote based on complexity",
    timeline: "1 - 3 Weeks",
    supportLevel: "Managed DevOps",
    relatedIds: ["backend-arch", "gpu-hosting"],
    animationType: "CloudPackets"
  },
  {
    id: "db-design",
    name: "Database Design",
    category: "tech",
    categoryLabel: "Tech & Infrastructure",
    icon: "Database",
    short: "PostgreSQL, MongoDB, Redis, Supabase — architected for your scale and data model.",
    tagline: "Data architectures that don't bottleneck when your startup goes viral.",
    size: "small",
    whyDevUp: [
      { title: "Optimal Indexing", description: "We design schemas with query patterns in mind to guarantee sub-50ms reads." },
      { title: "SQL & NoSQL Expertise", description: "Whether you need relational integrity or document flexibility, we know the trade-offs." },
      { title: "Migration Strategies", description: "Safe, zero-downtime data migrations using tools like Prisma or Liquibase." },
      { title: "Disaster Recovery", description: "Automated PITR (Point-in-Time Recovery) and multi-region replication setups." }
    ],
    whatsIncluded: [
      "Entity-Relationship (ER) diagram creation",
      "Database provisioning and security hardening",
      "Index optimization and query profiling",
      "Automated backup strategies",
      "Read-replica setup for high traffic"
    ],
    howItWorks: [
      { step: 1, title: "Schema Design", description: "We map your business logic into normalized (or denormalized) tables." },
      { step: 2, title: "Provisioning", description: "We spin up managed databases (RDS, Atlas, Supabase) with proper security groups." },
      { step: 3, title: "Tuning", description: "We analyze slow queries and add composite indexes where necessary." }
    ],
    engagementType: "Project-based",
    timeline: "1 - 2 Weeks",
    supportLevel: "Data Engineering Support",
    relatedIds: ["backend-arch", "cloud-infra"],
    animationType: "LayerDiagram"
  },
  {
    id: "web-dev",
    name: "Web Development",
    category: "tech",
    categoryLabel: "Tech & Infrastructure",
    icon: "Globe",
    short: "Full-stack web apps. Next.js, React, APIs — production-ready and beautifully built.",
    tagline: "Blazing fast, SEO-optimized web applications built on modern stacks.",
    size: "small",
    whyDevUp: [
      { title: "Modern Stack", description: "We exclusively build using Next.js, React, TailwindCSS, and TypeScript." },
      { title: "Pixel Perfect", description: "We bridge the gap between Figma and code with microscopic attention to detail." },
      { title: "Performance First", description: "Core Web Vitals optimized out of the box. 99+ Lighthouse scores." },
      { title: "Accessible", description: "WCAG compliant markup ensuring your app is usable by everyone." }
    ],
    whatsIncluded: [
      "Responsive frontend development",
      "State management (Zustand/Redux)",
      "Server-side rendering (SSR) setup",
      "API integration and data fetching",
      "End-to-end testing (Cypress/Playwright)"
    ],
    howItWorks: [
      { step: 1, title: "Component Architecture", description: "We break down your designs into reusable React components." },
      { step: 2, title: "Development", description: "We build the UI and wire it up to your backend APIs." },
      { step: 3, title: "QA & Launch", description: "Cross-browser testing, performance auditing, and Vercel/Netlify deployment." }
    ],
    engagementType: "Project-based or Dedicated Team",
    timeline: "4 - 8 Weeks",
    supportLevel: "Full-stack Pod",
    relatedIds: ["ui-ux", "api-integrations"],
    animationType: "BrowserLoad"
  },
  {
    id: "mobile-dev",
    name: "Mobile Development",
    category: "tech",
    categoryLabel: "Tech & Infrastructure",
    icon: "Smartphone",
    short: "React Native and Flutter apps for iOS and Android. From MVP to app store.",
    tagline: "Cross-platform mobile experiences that feel truly native.",
    size: "small",
    whyDevUp: [
      { title: "One Codebase", description: "Save time and money by deploying to both iOS and Android simultaneously." },
      { title: "Native Feel", description: "60fps animations and seamless integration with device hardware (camera, GPS, biometrics)." },
      { title: "App Store Masters", description: "We handle the entire convoluted Apple App Store and Google Play review process." },
      { title: "Over-The-Air Updates", description: "Push bug fixes directly to users' phones without waiting for app store approval." }
    ],
    whatsIncluded: [
      "Cross-platform app development",
      "Push notification integration",
      "Offline-first architecture (SQLite/WatermelonDB)",
      "App store listing creation",
      "Analytics and crash reporting setup"
    ],
    howItWorks: [
      { step: 1, title: "Prototyping", description: "We build navigable mobile prototypes to test the user flow." },
      { step: 2, title: "Development", description: "We build the app, integrating device APIs and backend services." },
      { step: 3, title: "Publishing", description: "We manage beta testing via TestFlight and handle final store submissions." }
    ],
    engagementType: "Project-based",
    timeline: "6 - 12 Weeks",
    supportLevel: "Mobile Engineering Pod",
    relatedIds: ["ui-ux", "backend-arch"],
    animationType: "PhoneGlow"
  },
  {
    id: "api-integrations",
    name: "API Integrations",
    category: "tech",
    categoryLabel: "Tech & Infrastructure",
    icon: "Plug",
    short: "Connect your startup to any third-party — payments, auth, comms, data, AI. We integrate it all.",
    tagline: "Seamlessly connect your product to the tools that power the internet.",
    size: "small",
    whyDevUp: [
      { title: "Deep API Knowledge", description: "We've integrated Stripe, Twilio, Plaid, SendGrid, and OpenAI dozens of times." },
      { title: "Webhook Handling", description: "Robust, idempotent webhook listeners that never miss a payment or event." },
      { title: "Rate Limit Management", description: "Smart queuing systems to ensure you never get blocked by third-party APIs." },
      { title: "Secure Credential Storage", description: "KMS and vault configurations to keep your API keys locked down." }
    ],
    whatsIncluded: [
      "Payment gateway setup (Stripe/Razorpay)",
      "Auth provider integration (Auth0/Supabase)",
      "CRM and Marketing syncing (Hubspot/Mailchimp)",
      "Custom webhooks and polling systems",
      "Integration testing and mocking"
    ],
    howItWorks: [
      { step: 1, title: "API Audit", description: "We review the third-party docs and design the data mapping." },
      { step: 2, title: "Integration", description: "We write the abstraction layers and error-handling logic." },
      { step: 3, title: "Sandbox to Prod", description: "We test extensively in sandbox before flipping the switch to production keys." }
    ],
    engagementType: "Project-based",
    timeline: "1 - 3 Weeks",
    supportLevel: "Integration Specialist",
    relatedIds: ["backend-arch", "web-dev"],
    animationType: "NodeConnect"
  },

  // --- AI & DATA ---
  {
    id: "ai-product",
    name: "AI Product Development",
    category: "ai",
    categoryLabel: "AI & Data",
    icon: "Brain",
    short: "Build AI features into your product — LLM integrations, RAG pipelines, fine-tuning, agents, and voice AI.",
    tagline: "Transform your SaaS with state-of-the-art generative AI and autonomous agents.",
    size: "large",
    whyDevUp: [
      { title: "Beyond the Wrapper", description: "We don't just wrap ChatGPT. We build complex RAG pipelines, agentic workflows, and multi-model systems." },
      { title: "Model Agnostic", description: "We route between GPT-4o, Claude 3.5 Sonnet, and Llama 3 based on your specific cost and latency needs." },
      { title: "Vector Database Experts", description: "Deep expertise in Pinecone, Milvus, and pgvector for massive semantic search capabilities." },
      { title: "Evaluation Frameworks", description: "We build automated LLM evaluation pipelines so your AI doesn't hallucinate in production." }
    ],
    whatsIncluded: [
      "Custom RAG (Retrieval-Augmented Generation) pipelines",
      "LangChain/LlamaIndex integration",
      "Open-source model fine-tuning (LoRA)",
      "AI Agent orchestration (Tool calling/memory)",
      "Latency and cost optimization"
    ],
    howItWorks: [
      { step: 1, title: "Use Case Scoping", description: "We define the AI feature, required accuracy, and evaluate feasibility." },
      { step: 2, title: "Data Prep & Indexing", description: "We clean your enterprise data, chunk it, and embed it into a vector store." },
      { step: 3, title: "Prompt Engineering & UI", description: "We craft system prompts, build the streaming UI, and deploy the pipeline." }
    ],
    engagementType: "Custom Quote",
    timeline: "4 - 8 Weeks",
    supportLevel: "AI Engineering Pod",
    relatedIds: ["gpu-hosting", "ai-chatbots"],
    animationType: "AiChatDemo"
  },
  {
    id: "ai-chatbots",
    name: "AI Chat & Support Bots",
    category: "ai",
    categoryLabel: "AI & Data",
    icon: "MessageSquare",
    short: "Custom AI chatbots for your product — trained on your docs, your tone, your users.",
    tagline: "Deflect 80% of support tickets with an AI that actually knows your product.",
    size: "small",
    whyDevUp: [
      { title: "Grounding Reality", description: "Strict guardrails ensure the bot only answers based on your documentation, eliminating hallucinations." },
      { title: "Human Handoff", description: "Seamless escalation to human agents in Intercom or Zendesk when the bot detects frustration." },
      { title: "Brand Voice", description: "We fine-tune the system prompt so the bot sounds exactly like your brand — professional, witty, or casual." },
      { title: "Action-Oriented", description: "The bot doesn't just talk; it can trigger refunds, update accounts, or book meetings via tool calling." }
    ],
    whatsIncluded: [
      "Knowledge base ingestion and syncing",
      "Custom chat widget UI (React/Web Component)",
      "Analytics dashboard for bot conversations",
      "Multilingual support",
      "Zendesk/Intercom integration"
    ],
    howItWorks: [
      { step: 1, title: "Knowledge Ingestion", description: "We scrape your Help Center, Notion, and past tickets." },
      { step: 2, title: "Bot Training", description: "We configure the RAG pipeline and set conversational guardrails." },
      { step: 3, title: "Integration", description: "We embed the widget on your site and monitor initial conversations." }
    ],
    engagementType: "Starting from ₹50k/month",
    timeline: "2 - 4 Weeks",
    supportLevel: "Managed AI Service",
    relatedIds: ["ai-product", "api-integrations"],
    animationType: "ChatBubble"
  },
  {
    id: "data-analytics",
    name: "Data Analytics & ML",
    category: "ai",
    categoryLabel: "AI & Data",
    icon: "BarChart",
    short: "Data pipelines, dashboards, predictive models. Turn your startup's data into decisions.",
    tagline: "Stop guessing. Start measuring, predicting, and optimizing.",
    size: "small",
    whyDevUp: [
      { title: "Single Source of Truth", description: "We break down data silos and pipe everything into a central data warehouse." },
      { title: "Actionable Dashboards", description: "We build Metabase or Superset dashboards that your non-technical team can actually use." },
      { title: "Predictive Insights", description: "Churn prediction, LTV forecasting, and recommendation engines using classical ML." },
      { title: "Privacy First", description: "GDPR/SOC2 compliant data anonymization pipelines." }
    ],
    whatsIncluded: [
      "ETL pipeline construction (Airflow/dbt)",
      "Data warehouse setup (Snowflake/BigQuery)",
      "Custom BI dashboards",
      "Event tracking setup (Mixpanel/Amplitude)",
      "Predictive modeling (Random Forests/XGBoost)"
    ],
    howItWorks: [
      { step: 1, title: "Data Audit", description: "We identify where your data lives and define core KPIs." },
      { step: 2, title: "Pipeline Creation", description: "We build automated ETL jobs to clean and centralize the data." },
      { step: 3, title: "Visualization", description: "We deploy BI tools and train your team on how to query them." }
    ],
    engagementType: "Project-based or Retainer",
    timeline: "3 - 6 Weeks",
    supportLevel: "Data Engineering Pod",
    relatedIds: ["backend-arch", "growth-marketing"],
    animationType: "BarChartGrow"
  },
  {
    id: "computer-vision",
    name: "Computer Vision",
    category: "ai",
    categoryLabel: "AI & Data",
    icon: "Eye",
    short: "Object detection, face recognition, OCR, drone vision. YOLOv8 and custom models.",
    tagline: "Give your software the ability to see and understand the physical world.",
    size: "small",
    whyDevUp: [
      { title: "Edge Deployment", description: "We optimize models to run directly on mobile phones or edge devices via CoreML/ONNX." },
      { title: "Custom Datasets", description: "We help curate, label, and augment datasets specific to your niche industry." },
      { title: "Real-time Inference", description: "Highly optimized YOLO/SSD pipelines capable of 60+ FPS processing." },
      { title: "Complex OCR", description: "Extract structured data from messy, handwritten, or degraded documents." }
    ],
    whatsIncluded: [
      "Dataset labeling and augmentation",
      "Model training and hyperparameter tuning",
      "Edge or Cloud deployment architecture",
      "Inference API development",
      "Ongoing model drift monitoring"
    ],
    howItWorks: [
      { step: 1, title: "Data Strategy", description: "We gather and label the visual data required for your use case." },
      { step: 2, title: "Training", description: "We train state-of-the-art CNNs or Vision Transformers." },
      { step: 3, title: "Deployment", description: "We package the model into a fast API or edge-compatible format." }
    ],
    engagementType: "Custom Quote",
    timeline: "6 - 10 Weeks",
    supportLevel: "CV Engineering Pod",
    relatedIds: ["gpu-hosting", "ai-product"],
    animationType: "ScanLine"
  },

  // --- CREATIVE & BRAND ---
  {
    id: "brand-identity",
    name: "Brand Identity & Design",
    category: "creative",
    categoryLabel: "Creative & Brand",
    icon: "Palette",
    short: "Logo, color palette, typography, brand guide — we build the visual identity your startup deserves.",
    tagline: "Stand out in a sea of generic templates with a brand that screams premium.",
    size: "large",
    whyDevUp: [
      { title: "Psychology-Driven Design", description: "We choose colors and typography based on the exact emotional response you need from users." },
      { title: "Scalable Systems", description: "You don't just get a logo; you get a comprehensive brand book, asset library, and design tokens." },
      { title: "Tech-Native Aesthetics", description: "We specialize in modern web aesthetics—glassmorphism, dark modes, and dynamic gradients." },
      { title: "Founder Collaboration", description: "We iterate directly with founders to ensure the brand aligns with your grand vision." }
    ],
    whatsIncluded: [
      "Primary and secondary logo marks",
      "Comprehensive typography system",
      "Color palettes (Light & Dark modes)",
      "Brand guidelines PDF",
      "Social media asset templates"
    ],
    howItWorks: [
      { step: 1, title: "Discovery", description: "Deep dive into your target audience, competitors, and core values." },
      { step: 2, title: "Exploration", description: "We present 3 distinct visual directions or 'mood boards'." },
      { step: 3, title: "Refinement", description: "We polish the chosen direction and deliver the final asset package." }
    ],
    engagementType: "Fixed Price Package",
    timeline: "2 - 4 Weeks",
    supportLevel: "Dedicated Art Director",
    relatedIds: ["ui-ux", "pitch-deck"],
    animationType: "ColorSwatches"
  },
  {
    id: "ui-ux",
    name: "UI/UX Design",
    category: "creative",
    categoryLabel: "Creative & Brand",
    icon: "Layout",
    short: "Wireframes, prototypes, and pixel-perfect Figma designs. Interfaces that convert and delight.",
    tagline: "Intuitive, high-converting interfaces designed for the modern web.",
    size: "small",
    whyDevUp: [
      { title: "Developer-Ready", description: "Our Figma files use strict auto-layout, variables, and components. Your devs will love them." },
      { title: "Conversion Focused", description: "We design with user psychology in mind, reducing friction and optimizing for clicks." },
      { title: "Interactive Prototypes", description: "Test your app's flow with high-fidelity clickable prototypes before writing a line of code." },
      { title: "Micro-interactions", description: "We spec out animations, hover states, and transitions that make your app feel alive." }
    ],
    whatsIncluded: [
      "User journey mapping",
      "Low-fidelity wireframes",
      "High-fidelity UI design in Figma",
      "Interactive prototyping",
      "Comprehensive design system"
    ],
    howItWorks: [
      { step: 1, title: "UX Architecture", description: "We map user flows and create structural wireframes." },
      { step: 2, title: "UI Design", description: "We apply your brand identity to create pixel-perfect screens." },
      { step: 3, title: "Handoff", description: "We deliver annotated Figma files ready for engineering." }
    ],
    engagementType: "Per-Screen or Project",
    timeline: "3 - 6 Weeks",
    supportLevel: "Product Designer",
    relatedIds: ["brand-identity", "web-dev", "mobile-dev"],
    animationType: "UiSnap"
  },
  {
    id: "photography",
    name: "Photography & Videography",
    category: "creative",
    categoryLabel: "Creative & Brand",
    icon: "Camera",
    short: "Product shoots, founder portraits, office culture — professional content for pitch decks and social.",
    tagline: "High-end visual content to elevate your marketing and employer brand.",
    size: "small",
    whyDevUp: [
      { title: "Startup Context", description: "We know what investors and early adopters want to see. No stiff, corporate stock-photo vibes." },
      { title: "Full Production", description: "We handle location scouting, lighting, directing, and post-production editing." },
      { title: "Quick Turnaround", description: "We know startups move fast. Get edited assets within 48 hours of the shoot." },
      { title: "Multi-Format", description: "Assets delivered specifically cropped for LinkedIn, Twitter, Instagram, and website heroes." }
    ],
    whatsIncluded: [
      "Founder and team headshots",
      "Office/culture lifestyle shoots",
      "Physical product photography",
      "High-end retouching and color grading",
      "Full commercial usage rights"
    ],
    howItWorks: [
      { step: 1, title: "Moodboard", description: "We agree on the visual style, lighting, and shot list." },
      { step: 2, title: "Production Day", description: "Our crew executes the shoot at your office or a studio." },
      { step: 3, title: "Post-Production", description: "Selection, editing, retouching, and final digital delivery." }
    ],
    engagementType: "Half-Day or Full-Day Rates",
    timeline: "1 Week",
    supportLevel: "Production Crew",
    relatedIds: ["social-media", "brand-identity"],
    animationType: "Shutter"
  },
  {
    id: "motion-graphics",
    name: "Motion Graphics & Reels",
    category: "creative",
    categoryLabel: "Creative & Brand",
    icon: "Film",
    short: "Social reels, product demos, animated explainers. Content that stops the scroll.",
    tagline: "Dynamic video content that explains complex products in 30 seconds.",
    size: "small",
    whyDevUp: [
      { title: "High Retention", description: "We script and edit for maximum watch-time, utilizing fast cuts and dynamic text." },
      { title: "Software Demos", description: "We turn boring screen-recordings into sleek, animated 3D product showcases." },
      { title: "Trend Aware", description: "Our editors live on social media. We know what audio and formats are currently pushing algorithm reach." },
      { title: "Voiceover & Sound", description: "Premium sound design and professional voiceovers included." }
    ],
    whatsIncluded: [
      "Scriptwriting and storyboarding",
      "2D/3D motion graphics",
      "UI/App animation demos",
      "Short-form social reels (TikTok/IG)",
      "Sound design and mixing"
    ],
    howItWorks: [
      { step: 1, title: "Scripting", description: "We write the hook, the body, and the CTA." },
      { step: 2, title: "Animation", description: "We animate the assets in After Effects or Cinema4D." },
      { step: 3, title: "Sound", description: "We add SFX, music, and voiceover for the final render." }
    ],
    engagementType: "Per-Video or Monthly Batch",
    timeline: "2 - 3 Weeks",
    supportLevel: "Motion Designer",
    relatedIds: ["social-media", "ui-ux"],
    animationType: "PlayProgress"
  },
  {
    id: "pitch-deck",
    name: "Pitch Deck Design",
    category: "creative",
    categoryLabel: "Creative & Brand",
    icon: "Presentation",
    short: "Investor-ready pitch decks that tell your story. Designed to raise.",
    tagline: "Compelling narratives and stunning visuals that get VCs to say 'Yes'.",
    size: "small",
    whyDevUp: [
      { title: "Investor Psychology", description: "We design decks based on what Sequoia, YC, and top-tier angels actually look for." },
      { title: "Data Visualization", description: "We turn complex metrics and messy spreadsheets into beautiful, instantly readable charts." },
      { title: "Narrative Flow", description: "We don't just make it pretty; we help restructure your deck's story arc for maximum impact." },
      { title: "Editable Formats", description: "Delivered in Figma, Keynote, and PDF so you can tweak numbers on the fly." }
    ],
    whatsIncluded: [
      "Storyline restructuring",
      "Custom iconography and charts",
      "10-15 slide core deck design",
      "Appendix formatting",
      "Master template creation"
    ],
    howItWorks: [
      { step: 1, title: "Content Review", description: "We review your raw text, metrics, and business model." },
      { step: 2, title: "Design Sprint", description: "We design the deck, focusing on clear typography and data visualization." },
      { step: 3, title: "Revisions", description: "Iterative tweaks until the deck is ready to be sent to partners." }
    ],
    engagementType: "Fixed Price",
    timeline: "1 - 2 Weeks",
    supportLevel: "Strategy & Design Pair",
    relatedIds: ["brand-identity", "investor-connect"],
    animationType: "SlideFan"
  },

  // --- MARKETING & GROWTH ---
  {
    id: "growth-marketing",
    name: "Growth Marketing",
    category: "marketing",
    categoryLabel: "Marketing & Growth",
    icon: "TrendingUp",
    short: "SEO, performance ads, content strategy, email campaigns. We build your growth engine.",
    tagline: "Data-driven acquisition engines to lower CAC and maximize LTV.",
    size: "large",
    whyDevUp: [
      { title: "Full-Funnel Approach", description: "We don't just drive clicks; we optimize your landing pages to ensure those clicks actually convert." },
      { title: "Rapid Experimentation", description: "We run high-velocity A/B tests on ad creatives, copy, and targeting to find winning combinations fast." },
      { title: "Technical Marketing", description: "We leverage scripts, APIs, and automation to scale outreach beyond traditional human capacity." },
      { title: "Transparent Reporting", description: "Live dashboards showing exactly where every dollar goes and what it brings back. No vanity metrics." }
    ],
    whatsIncluded: [
      "Meta, Google, and LinkedIn Ads management",
      "Landing page CRO (Conversion Rate Optimization)",
      "Cold email infrastructure and copywriting",
      "Lifecycle marketing (Klaviyo/Customer.io)",
      "Analytics and attribution modeling"
    ],
    howItWorks: [
      { step: 1, title: "Audit & Strategy", description: "We analyze your current funnel, unit economics, and target audience." },
      { step: 2, title: "Campaign Launch", description: "We set up tracking, create ad assets, and launch initial test campaigns." },
      { step: 3, title: "Scale & Optimize", description: "We kill losing ads, scale winners, and continuously optimize CPA." }
    ],
    engagementType: "Monthly Retainer + Ad Spend",
    timeline: "Ongoing",
    supportLevel: "Growth Lead + Media Buyer",
    relatedIds: ["data-analytics", "seo-content", "social-media"],
    animationType: "GrowthChart"
  },
  {
    id: "social-media",
    name: "Social Media Management",
    category: "marketing",
    categoryLabel: "Marketing & Growth",
    icon: "Share2",
    short: "Instagram, LinkedIn, Twitter — content calendars, copywriting, scheduling, and community building.",
    tagline: "Build a cult-like following with organic content that resonates.",
    size: "small",
    whyDevUp: [
      { title: "Platform Native", description: "We don't cross-post the same boring graphic. We write threads for Twitter and create carousels for LinkedIn." },
      { title: "Founder Personal Brand", description: "We ghostwrite for founders, building your personal authority which drives B2B sales." },
      { title: "Trend Jacking", description: "We monitor industry trends and memes to insert your brand into the viral conversation." },
      { title: "Community Engagement", description: "We don't just post; we reply, comment, and interact with your niche to build real relationships." }
    ],
    whatsIncluded: [
      "Monthly content calendar creation",
      "Copywriting and hashtag strategy",
      "Graphic design for posts",
      "Scheduling and publishing",
      "Monthly engagement reporting"
    ],
    howItWorks: [
      { step: 1, title: "Brand Voice", description: "We define your social persona and content pillars." },
      { step: 2, title: "Creation", description: "We draft a month's worth of content for your approval." },
      { step: 3, title: "Execution", description: "We post, engage with comments, and track metrics." }
    ],
    engagementType: "Monthly Retainer",
    timeline: "Ongoing",
    supportLevel: "Social Media Manager",
    relatedIds: ["motion-graphics", "photography"],
    animationType: "SocialOrbit"
  },
  {
    id: "seo-content",
    name: "SEO & Content",
    category: "marketing",
    categoryLabel: "Marketing & Growth",
    icon: "Search",
    short: "Keyword research, technical SEO, blog content that ranks. Long-term organic growth.",
    tagline: "Capture high-intent search traffic and own your industry's keywords.",
    size: "small",
    whyDevUp: [
      { title: "Technical Foundation", description: "We fix site speed, schema markup, and crawlability before writing a single word." },
      { title: "Programmatic SEO", description: "We build scalable, database-driven landing pages to capture thousands of long-tail keywords." },
      { title: "High-Quality Content", description: "No cheap AI fluff. We write deep, authoritative articles that actual humans want to read." },
      { title: "Backlink Strategy", description: "White-hat outreach to build domain authority through high-quality guest posts and PR." }
    ],
    whatsIncluded: [
      "Comprehensive technical SEO audit",
      "Keyword gap analysis",
      "Blog post writing (4-8 per month)",
      "On-page optimization",
      "Link building campaigns"
    ],
    howItWorks: [
      { step: 1, title: "Research", description: "We identify high-volume, low-competition keywords in your niche." },
      { step: 2, title: "Fix & Write", description: "We resolve technical errors and begin publishing optimized content." },
      { step: 3, title: "Rank & Track", description: "We monitor SERP positions and adjust strategy based on algorithm updates." }
    ],
    engagementType: "Monthly Retainer",
    timeline: "Ongoing (Results in 3-6 months)",
    supportLevel: "SEO Strategist",
    relatedIds: ["growth-marketing", "web-dev"],
    animationType: "SearchClimb"
  },
  {
    id: "pr-media",
    name: "PR & Media Relations",
    category: "marketing",
    categoryLabel: "Marketing & Growth",
    icon: "Newspaper",
    short: "Press releases, journalist outreach, media kits. Get your startup covered.",
    tagline: "Get your startup featured in TechCrunch, Forbes, and industry publications.",
    size: "small",
    whyDevUp: [
      { title: "Warm Relationships", description: "We have direct lines to tech journalists and editors at major publications." },
      { title: "Story Crafting", description: "Journalists ignore boring funding news. We find the human, controversial, or impact story to pitch." },
      { title: "Media Kits", description: "We prepare a polished Notion room with founder bios, high-res logos, and product shots." },
      { title: "Crisis Management", description: "If things go wrong, we help control the narrative and manage public statements." }
    ],
    whatsIncluded: [
      "Press release writing and distribution",
      "Targeted journalist pitching",
      "Media kit creation",
      "Podcast and interview booking",
      "Media training for founders"
    ],
    howItWorks: [
      { step: 1, title: "Angle Development", description: "We figure out why the press should care about your startup right now." },
      { step: 2, title: "Pitching", description: "We reach out to our network of journalists with customized pitches." },
      { step: 3, title: "Coordination", description: "We facilitate interviews, provide quotes, and secure the publication." }
    ],
    engagementType: "Project (Launch) or Retainer",
    timeline: "4 - 8 Weeks",
    supportLevel: "PR Specialist",
    relatedIds: ["social-media", "brand-identity"],
    animationType: "NewsFold"
  },
  {
    id: "community-building",
    name: "Community Building",
    category: "marketing",
    categoryLabel: "Marketing & Growth",
    icon: "Users",
    short: "Discord, WhatsApp, Slack communities — build the tribe around your product.",
    tagline: "Turn your early users into passionate evangelists.",
    size: "small",
    whyDevUp: [
      { title: "Platform Architecture", description: "We set up Discord/Slack with the right channels, roles, bots, and onboarding flows." },
      { title: "Engagement Rituals", description: "We design weekly events, AMAs, and showcases to keep the community active." },
      { title: "Moderation", description: "Automated filters and human oversight to keep the community safe and spam-free." },
      { title: "Feedback Loops", description: "We pipe feature requests and bug reports directly from the community into your engineering Jira." }
    ],
    whatsIncluded: [
      "Discord/Slack server setup and bot configuration",
      "Community guidelines drafting",
      "Onboarding flow design",
      "Event programming (AMAs, Townhalls)",
      "Super-user/Ambassador programs"
    ],
    howItWorks: [
      { step: 1, title: "Setup", description: "We construct the digital space and define the culture." },
      { step: 2, title: "Launch", description: "We invite your early users and kick off engagement campaigns." },
      { step: 3, title: "Management", description: "Ongoing moderation, event hosting, and user relationship building." }
    ],
    engagementType: "Monthly Retainer",
    timeline: "Ongoing",
    supportLevel: "Community Manager",
    relatedIds: ["social-media", "events-demo"],
    animationType: "UsersJoin"
  },

  // --- LEGAL & COMPLIANCE ---
  {
    id: "legal-docs",
    name: "Legal & Documentation",
    category: "legal",
    categoryLabel: "Legal & Compliance",
    icon: "Scale",
    short: "Company incorporation, NDAs, founder agreements, IP protection, term sheets — all the paperwork, handled.",
    tagline: "Iron-clad legal foundations so you can build without looking over your shoulder.",
    size: "large",
    whyDevUp: [
      { title: "Startup Specialists", description: "We don't do real estate law. Our legal partners exclusively handle high-growth tech startups." },
      { title: "Standardized Tech", description: "We use standard, investor-friendly templates (like YC SAFEs) to avoid friction during fundraising." },
      { title: "Founder Protection", description: "Vesting schedules, cliff agreements, and IP assignment contracts designed to protect the company's future." },
      { title: "Flat Fees", description: "No surprise billable hours. Incorporation and standard agreements are priced flat." }
    ],
    whatsIncluded: [
      "Company Incorporation (Pvt Ltd, LLC, C-Corp)",
      "Co-founder Agreements & Vesting Schedules",
      "Employee Stock Option Plan (ESOP) drafting",
      "NDAs, Privacy Policies, and Terms of Service",
      "Employment and Contractor Agreements"
    ],
    howItWorks: [
      { step: 1, title: "Consultation", description: "We assess your current legal status, equity split, and immediate needs." },
      { step: 2, title: "Drafting", description: "Our legal team drafts the necessary documents customized to your specifics." },
      { step: 3, title: "Execution", description: "Digital signatures, filing with authorities, and secure document storage." }
    ],
    engagementType: "Flat Fee per Service",
    timeline: "1 - 3 Weeks",
    supportLevel: "Legal Partner",
    relatedIds: ["compliance", "ip-patent"],
    animationType: "DocumentStamp"
  },
  {
    id: "compliance",
    name: "Compliance & Filings",
    category: "legal",
    categoryLabel: "Legal & Compliance",
    icon: "FileCheck",
    short: "GST registration, MCA filings, startup India recognition, DPIIT registration — we navigate the bureaucracy.",
    tagline: "Stay on the right side of the law without drowning in government paperwork.",
    size: "small",
    whyDevUp: [
      { title: "Tax Benefits", description: "We ensure you are registered for all applicable startup tax exemptions (e.g., DPIIT Section 80IAC)." },
      { title: "Automated Reminders", description: "Never miss a filing deadline. We track ROC, GST, and Income Tax dates for you." },
      { title: "Global Compliance", description: "Support for cross-border compliance (e.g., Delaware Franchise Tax, GDPR, SOC2 readiness)." },
      { title: "Audit Ready", description: "We keep your books and filings perfectly clean so due diligence during fundraising is a breeze." }
    ],
    whatsIncluded: [
      "Startup India / DPIIT Registration",
      "GST / VAT / EIN Registration",
      "Monthly/Annual MCA and ROC Filings",
      "Director KYC and Board Resolution drafting",
      "FDI and FEMA compliance (for foreign investment)"
    ],
    howItWorks: [
      { step: 1, title: "Checklist", description: "We gather your company docs and PAN/Aadhaar/SSN details." },
      { step: 2, title: "Filing", description: "We navigate the government portals and submit the forms." },
      { step: 3, title: "Certificates", description: "We deliver the final registration certificates and tax IDs." }
    ],
    engagementType: "Annual Retainer or Flat Fee",
    timeline: "2 - 4 Weeks",
    supportLevel: "Chartered Accountant / CS",
    relatedIds: ["legal-docs"],
    animationType: "Checklist"
  },
  {
    id: "ip-patent",
    name: "IP & Patent Support",
    category: "legal",
    categoryLabel: "Legal & Compliance",
    icon: "Lock",
    short: "Trademark filing, patent guidance, copyright protection. Protect what you build.",
    tagline: "Secure a monopoly on your ideas, branding, and proprietary algorithms.",
    size: "small",
    whyDevUp: [
      { title: "Software Patents", description: "We specialize in the complex landscape of patenting software, AI models, and algorithms." },
      { title: "Global Protection", description: "Filing strategies that protect your brand not just locally, but in the US, EU, and globally (WIPO/Madrid Protocol)." },
      { title: "Prior Art Search", description: "Deep analysis to ensure your brand name or tech doesn't infringe on existing giants before you launch." },
      { title: "IP Assignment", description: "Ensuring all code written by contractors legally belongs to the startup, a crucial step for investors." }
    ],
    whatsIncluded: [
      "Trademark search and registration",
      "Provisional and complete patent drafting",
      "Copyright registration for software/design",
      "Cease & Desist letter drafting",
      "IP Assignment Agreements"
    ],
    howItWorks: [
      { step: 1, title: "IP Audit", description: "We identify what aspects of your business are patentable or trademarkable." },
      { step: 2, title: "Search", description: "Extensive database searches to ensure availability." },
      { step: 3, title: "Filing", description: "Drafting the claims and submitting to the trademark/patent office." }
    ],
    engagementType: "Flat Fee per Filing",
    timeline: "4 - 12+ Weeks (Govt dependent)",
    supportLevel: "IP Attorney",
    relatedIds: ["legal-docs"],
    animationType: "LockClose"
  },

  // --- MISSION & COMMUNITY ---
  {
    id: "mentorship",
    name: "Mentorship & Advisory",
    category: "mission",
    categoryLabel: "Mission & Community",
    icon: "Compass",
    short: "Access to a network of founders, domain experts, and investors who've done it before. 1:1 sessions, office hours.",
    tagline: "Don't make new mistakes. Learn from veterans who have scaled to millions in ARR.",
    size: "large",
    whyDevUp: [
      { title: "Curated Matching", description: "We don't pair you randomly. We match you with mentors who solved the exact problem you are facing right now." },
      { title: "No Fluff", description: "Tactical, actionable advice. No generic 'follow your passion' speeches. Just go-to-market strategies and architecture reviews." },
      { title: "Investor Feedback", description: "Pitch your deck to actual angels in a low-stakes environment before taking the real meetings." },
      { title: "Office Hours", description: "Weekly drop-in sessions for quick unblocking on tech, legal, or growth hurdles." }
    ],
    whatsIncluded: [
      "Monthly 1:1 sessions with matched mentors",
      "Weekly group office hours",
      "Pitch deck teardown sessions",
      "Architecture review sessions",
      "Direct introductions to domain experts"
    ],
    howItWorks: [
      { step: 1, title: "Intake", description: "Tell us your biggest current bottleneck (e.g., hiring a CTO, lowering CAC)." },
      { step: 2, title: "Matching", description: "We connect you with a mentor from our network with specific expertise." },
      { step: 3, title: "Iteration", description: "Meet, apply the advice, and report back on progress." }
    ],
    engagementType: "Included in Ecosystem Membership",
    timeline: "Ongoing",
    supportLevel: "Ecosystem Network",
    relatedIds: ["investor-connect", "cofounder-match"],
    animationType: "MentorAvatars"
  },
  {
    id: "hackathon-access",
    name: "Hackathon Access",
    category: "mission",
    categoryLabel: "Mission & Community",
    icon: "Trophy",
    short: "Priority access to ecosystem hackathons, external competitions, and prize pools.",
    tagline: "Build fast, win equity-free cash, and get noticed by top recruiters and VCs.",
    size: "small",
    whyDevUp: [
      { title: "Early Registration", description: "DevUp ecosystem members bypass waitlists for highly contested hackathons." },
      { title: "Sponsor API Credits", description: "Get thousands of dollars in AWS, OpenAI, and Stripe credits just for participating." },
      { title: "Team Formation", description: "Use our internal network to find the perfect UI designer or backend dev to complete your hackathon team." },
      { title: "Judging Visibility", description: "Get your product directly in front of partner VCs and tech executives who judge our events." }
    ],
    whatsIncluded: [
      "Free entry to premium DevUp hackathons",
      "Travel stipends (for select offline events)",
      "Exclusive access to sponsor APIs",
      "Post-hackathon incubation opportunities",
      "Swag and hardware rentals"
    ],
    howItWorks: [
      { step: 1, title: "Discover", description: "Browse upcoming internal and partner hackathons on the portal." },
      { step: 2, title: "Form Team", description: "Use the DevUp network to build your squad." },
      { step: 3, title: "Build & Win", description: "Compete, ship your MVP, and pitch to the judges." }
    ],
    engagementType: "Included in Ecosystem Membership",
    timeline: "Event Based",
    supportLevel: "Community Team",
    relatedIds: ["cofounder-match", "events-demo"],
    animationType: "TrophyBurst"
  },
  {
    id: "cofounder-match",
    name: "Co-Founder Matching",
    category: "mission",
    categoryLabel: "Mission & Community",
    icon: "Handshake",
    short: "Find your technical or business co-founder through our curated matching system.",
    tagline: "Finding a co-founder is like marriage. We help you find the right partner.",
    size: "small",
    whyDevUp: [
      { title: "Vetted Talent", description: "No passive profiles. Everyone in our matching pool is actively looking to build and has passed our technical/business screen." },
      { title: "Complementary Skills", description: "Our algorithm matches visionary business minds with execution-focused engineers." },
      { title: "Values Alignment", description: "We screen for risk tolerance, work ethics, and long-term vision to prevent early founder breakups." },
      { title: "Trial Periods", description: "We facilitate 'dating' phases where you work on a 2-week mini-project together before signing equity agreements." }
    ],
    whatsIncluded: [
      "Access to the private Co-founder directory",
      "AI-driven match recommendations",
      "Facilitated introductory calls",
      "Standardized founder trial contracts",
      "Equity split advisory"
    ],
    howItWorks: [
      { step: 1, title: "Profile Creation", description: "List your skills, what you're building, and what you lack." },
      { step: 2, title: "Matching", description: "Browse matches or let our team make warm introductions." },
      { step: 3, title: "The Trial", description: "Collaborate on a small milestone to test the working dynamic." }
    ],
    engagementType: "Included in Ecosystem Membership",
    timeline: "Variable",
    supportLevel: "Ecosystem Matchmaker",
    relatedIds: ["mentorship", "legal-docs"],
    animationType: "NodesSnap"
  },
  {
    id: "investor-connect",
    name: "Investor Connect",
    category: "mission",
    categoryLabel: "Mission & Community",
    icon: "DollarSign",
    short: "Demo day access, warm introductions to VCs and angels, pitch coaching from serial founders.",
    tagline: "Bypass the cold email. Get warm intros to investors who write checks.",
    size: "small",
    whyDevUp: [
      { title: "Curated Intros", description: "We don't blast your deck. We introduce you to specific partners whose thesis matches your startup." },
      { title: "Demo Days", description: "Quarterly invite-only demo days where 50+ active angels and seed funds tune in to watch you pitch." },
      { title: "Data Room Prep", description: "We help you organize your cap table, financials, and legal docs so you pass due diligence instantly." },
      { title: "Term Sheet Negotiation", description: "Advisory support to ensure you don't take toxic money or give up too much board control." }
    ],
    whatsIncluded: [
      "Warm email introductions to targeted VCs",
      "Slot in the DevUp Quarterly Demo Day",
      "Pitch coaching and deck teardowns",
      "Access to standard SAFE templates",
      "Data room checklists"
    ],
    howItWorks: [
      { step: 1, title: "Readiness Check", description: "We review your traction and deck to ensure you are ready to raise." },
      { step: 2, title: "The Pitch", description: "You present at Demo Day or we facilitate direct 1:1 meetings." },
      { step: 3, title: "Closing", description: "We advise you through the negotiation and term sheet signing." }
    ],
    engagementType: "Included (Success Fee may apply)",
    timeline: "Ongoing",
    supportLevel: "Venture Partner",
    relatedIds: ["pitch-deck", "mentorship"],
    animationType: "ChartRise"
  },
  {
    id: "events-demo",
    name: "Event & Demo Days",
    category: "mission",
    categoryLabel: "Mission & Community",
    icon: "Calendar",
    short: "Showcase your startup at our cohort demo days, T-HUB events, and partner exhibitions.",
    tagline: "Get your product in front of thousands of early adopters and press.",
    size: "small",
    whyDevUp: [
      { title: "Premium Venues", description: "We host offline events at premier tech hubs, ensuring high footfall of the right crowd." },
      { title: "Production Value", description: "Professional staging, lighting, and AV for your pitch. You'll look like a Silicon Valley keynote." },
      { title: "Media Coverage", description: "Our events are covered by local tech press and influencers, giving you free PR." },
      { title: "Booth Space", description: "Free exhibition space to let users physically test your product and give live feedback." }
    ],
    whatsIncluded: [
      "Pitching slot at Demo Days",
      "Exhibition booth at partner events",
      "Professional photos/videos of your pitch",
      "VIP networking dinner access",
      "Event marketing support"
    ],
    howItWorks: [
      { step: 1, title: "Selection", description: "Top startups from the cohort are selected to present." },
      { step: 2, title: "Rehearsal", description: "Mandatory pitch practice to ensure timing and delivery." },
      { step: 3, title: "Showtime", description: "Pitch to a live audience of investors, press, and peers." }
    ],
    engagementType: "Included in Ecosystem Membership",
    timeline: "Quarterly",
    supportLevel: "Events Team",
    relatedIds: ["investor-connect", "pr-media"],
    animationType: "CalendarFlip"
  },
  {
    id: "networking-cohorts",
    name: "Networking & Cohorts",
    category: "mission",
    categoryLabel: "Mission & Community",
    icon: "Network",
    short: "Join a cohort of founders building alongside you. Weekly syncs, accountability, community.",
    tagline: "Building a startup is lonely. It doesn't have to be.",
    size: "small",
    whyDevUp: [
      { title: "Peer Accountability", description: "Weekly syncs where you state your goals and are held accountable by other driven founders." },
      { title: "Shared Knowledge", description: "When someone figures out a growth hack or a legal loophole, the whole cohort benefits." },
      { title: "Mental Health", description: "A safe space to discuss founder burnout, stress, and failures without judgment." },
      { title: "Alumni Network", description: "Lifelong access to the DevUp alumni directory for hiring, partnerships, and advice." }
    ],
    whatsIncluded: [
      "Placement in a 10-startup curated cohort",
      "Weekly facilitator-led accountability syncs",
      "Private WhatsApp/Slack group",
      "Monthly offline founder dinners",
      "Access to alumni database"
    ],
    howItWorks: [
      { step: 1, title: "Onboarding", description: "You are grouped with founders at a similar stage but non-competing industries." },
      { step: 2, title: "The Program", description: "12 weeks of intense building, sharing, and weekly check-ins." },
      { step: 3, title: "Graduation", description: "You join the permanent alumni network." }
    ],
    engagementType: "Included in Ecosystem Membership",
    timeline: "12-Week Cohorts",
    supportLevel: "Cohort Facilitator",
    relatedIds: ["community-building", "mentorship"],
    animationType: "NodeGraph"
  }
]
