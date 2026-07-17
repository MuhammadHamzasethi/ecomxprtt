/* ============================================================
   EcomXprt — js/data.js
   All site content + chatbot knowledge base in one place.
   Edit this file to change any content — no HTML needed.
   ============================================================ */

/* ── SERVICES ─────────────────────────────────────────────── */
const svcs=[
  {n:'01',slug:'account-management',ic:'⚙️',t:'Amazon Account Management',b:'Full Seller Central management — catalogues, FBA, compliance, account health.',pill:'Full Seller Central',bk:'Complete end-to-end Amazon account operations. Catalogue management, FBA shipment plans, account health monitoring, inventory optimisation.',pts:['Catalogue & variation management','FBA shipment planning & IPI','Account health monitoring','Weekly performance reporting']},
  {n:'02',slug:'ppc-management',ic:'📈',t:'Amazon PPC Management',b:'Full-funnel sponsored ads from keyword discovery to bid optimization. Consistently achieving 6–8× ROAS.',pill:'Avg. 7.2× ROAS',bk:'Data-first PPC across Sponsored Products, Brands, and Display. Granular keyword harvesting, negative sculpting, and dynamic bid strategies.',pts:['7.2× average ROAS achieved','ACoS reduced from 28% → 11%','Sponsored Brand + Video','Weekly optimization & reporting']},
  {n:'03',slug:'listing-optimization',ic:'✍️',t:'Listing Optimization',b:'Keyword-rich titles, 5 conversion-focused bullets, HTML description, backend terms.',pill:'+118% CVR Average',bk:'Your listing is your #1 salesperson. Deep keyword research with conversion copywriting that ranks organically and converts at scale.',pts:['SEO-optimized title (200 chars)','5 conversion-focused bullets','HTML product description','Backend search term optimization']},
  {n:'04',slug:'aplus-content',ic:'🎨',t:'A+ Content & EBC',b:'Visually rich brand storytelling with enhanced images, lifestyle graphics, and infographics.',pill:'Premium Brand Store',bk:'A+ Content replaces standard descriptions with rich visual modules. Our designers craft complete EBC that increases conversion rates.',pts:['Brand story module design','Product comparison charts','Lifestyle infographic imagery','Brand Store creation']},
  {n:'05',slug:'keyword-ranking',ic:'🔑',t:'Keyword Ranking',b:'Tri-Ranking Solution — PPC + organic strategies + external traffic to reach top positions on page 1.',pill:'Top 3 Rankings',bk:'Our proprietary Tri-Ranking combines sponsored ads, organic SEO tactics, and external traffic to rank your products on page 1.',pts:['PPC velocity campaigns','Organic ranking strategy','External traffic funnels','Rank tracking & reporting']},
  {n:'06',slug:'product-sourcing',ic:'📦',t:'Product Sourcing',b:'Global sourcing from vetted suppliers. Profit margins, demand, competition analysis — logistics end-to-end.',pill:'Global Network',bk:'Winning product research, vetted global suppliers, quality control, and full import logistics pipeline to your FBA warehouse.',pts:['Winning product research','Verified supplier network','Quality control & inspection','End-to-end logistics']},
  {n:'07',slug:'photography-3d',ic:'📸',t:'Product Photography & 3D',b:'7 professional images: main, white BG, infographics, lifestyle, model shots. Full image rights included.',pill:'Studio Quality',bk:'Amazon-compliant hero shots, lifestyle imagery, infographic overlays, and photorealistic 3D renders for maximum conversion.',pts:['7 edited final images','White background main image','Lifestyle & model photography','3D renders & infographics']},
  {n:'08',slug:'videography',ic:'🎬',t:'Product Videography',b:'Professional team, real models, advanced editing, voiceover, script writing. Amazon premium video.',pill:'Amazon Premium',bk:'High-production Amazon-ready product videos using professional models, cinematic lighting, motion graphics, and voiceover.',pts:['Script writing & storyboard','Professional models & studio','Motion graphics & editing','Professional voiceover']},
  {n:'09',slug:'package-designing',ic:'🖊️',t:'Package Designing',b:'Custom FBA packaging with original design, AI files, copyright, two free revisions.',pill:'Brand Identity',bk:'FBA-ready packaging that builds brand equity, drives unboxing experience, and differentiates you on the shelf.',pts:['Custom original design','2 free revisions included','Full copyright transfer','Print-ready AI/PDF files']},
];

/* ── TEAM ──────────────────────────────────────────────────── */
const team=[
  {n:'Ammar Jamil',r:'Co-Founder',i:'AJ',bio:'Co-architect of EcomXprt growth methodology. 12+ years in Amazon operations across US and EU.',img:'assets/img/team/ammar.jpeg'},
  {n:'Tayyab Sethi',r:'Sales Manager',i:'TS',bio:'Expert in client onboarding and revenue consulting. Overseen $5M+ in client revenue.',img:'assets/img/team/tayyab.jpeg'},
  {n:'Hammas Khalid',r:'Graphics Designer',i:'HK',bio:'Creative lead for A+ Content, Brand Stores, packaging. 200+ Amazon listing designs.',img:'assets/img/team/hammas.jpeg'},
  {n:'Asad Naeem',r:'eCommerce Specialist',i:'AN',bio:'Deep expertise in Seller Central operations, listing compliance, catalogue management, FBA.',img:'assets/img/team/asad.jpeg'},
  {n:'Raja Souban',r:'Walmart / eBay / TikTok',i:'RS',bio:'Multi-marketplace specialist. Manages Walmart WFS, eBay Powerseller, and TikTok Shop.',img:'assets/img/team/raja.jpeg'},
  {n:'Moin',r:'Amazon PPC Specialist',i:'MN',bio:'PPC and ranking expert. Manages advanced Sponsored Ads campaigns with consistently high ROAS.',img:'assets/img/team/moin.jpeg'},
];

/* ── REVIEWS ───────────────────────────────────────────────── */
const revs=[
  {n:'Leonardo Naranjo',r:'Amazon Seller — USA',ph:'assets/img/testimonials/leonardo.jpeg',t:"The EcomXPRT team is absolutely fantastic. Their expertise in eCommerce is truly impressive. They're instrumental in propelling my business to unprecedented levels.",s:5},
  {n:'James Whitfield',r:'Home & Garden — USA',ph:'',t:'Within 3 months, our ROAS jumped from 2.1× to 7.8×, and monthly revenue grew from $18K to $84K. Saad and the team are genuinely invested in your success.',s:5},
  {n:'Aisha Rahman',r:'Beauty & Wellness — UK',ph:'',t:'Our main keyword went from page 8 to position #2 in 6 weeks. The PPC team reduced ACoS from 31% to 12.4% without dropping a single unit in sales.',s:5},
  {n:'Michael Torres',r:'Sports & Outdoors — Canada',ph:'',t:'Working with EcomXprt for 2 years. They scaled us from $22K to $120K/month while launching us on Walmart. Transparent, responsive, and deeply skilled.',s:5},
  {n:'Sara Iqbal',r:'Premium Skincare — UAE',ph:'',t:'The A+ Content Hammas designed tells our brand story beautifully. We saw a 118% CVR improvement within 30 days of going live.',s:5},
  {n:'David Chen',r:'Electronics — USA',ph:'',t:'Best investment we made for our Amazon business. The free audit revealed issues we had no idea about. Once fixed, organic rankings exploded.',s:5},
];

/* ── PRICING ───────────────────────────────────────────────── */
const tiers=[
  {tier:'Tier 01',name:'Starter',desc:'Core services package + free consultation. Ideal for new sellers.',feats:['Amazon Account Setup','Basic Listing Optimization','Keyword Research','Free Strategy Consultation'],feat:false},
  {tier:'Tier 02',name:'Basic',desc:'Essential eCommerce growth services for established sellers.',feats:['Account Management','PPC Setup & Management','Full Listing Optimization','A+ Content Design','Monthly Reporting'],feat:false},
  {tier:'Tier 03',name:'Advanced',desc:'Full management + product launching for brands serious about scaling.',feats:['Everything in Basic','Product Research & Sourcing','Product Launch Strategy','Tri-Ranking Solution','Photography & 3D','Dedicated Account Manager'],feat:true},
  {tier:'Tier 04',name:'Premium',desc:'Enterprise custom solution for 7-figure brands and agencies.',feats:['Everything in Advanced','Multi-marketplace Management','Product Videography','Package Designing','Brand Store Creation','Custom SLA & Reporting'],feat:false},
];

/* ── PORTFOLIO ─────────────────────────────────────────────── */
const portData=[
  {cat:'PPC',label:'Campaign Performance',img:'assets/img/portfolio/portfolio-1.png',metric:'+340% ROAS'},
  {cat:'Sales',label:'Revenue Scaling',img:'assets/img/portfolio/portfolio-2.png',metric:'+218% Revenue'},
  {cat:'PPC',label:'Ad Optimization',img:'assets/img/portfolio/portfolio-3.png',metric:'ACoS 12%'},
  {cat:'Photography',label:'Product Photography',img:'assets/img/portfolio/114.png',metric:'Premium Imagery'},
  {cat:'Sales',label:'Revenue Growth',img:'assets/img/portfolio/portfolio-5.png',metric:'+537% Growth'},
  {cat:'Photography',label:'3D Product Renders',img:'assets/img/portfolio/117.png',metric:'Studio Quality'},
  {cat:'PPC',label:'Full PPC Managed',img:'assets/img/portfolio/portfolio-6.png',metric:'7.2× ROAS'},
  {cat:'Photography',label:'Lifestyle Imagery',img:'assets/img/portfolio/116.png',metric:'A+ Content'},
];

/* ── BRAND PARTNERS ────────────────────────────────────────── */
const partners=[
  {n:'Zazu Kids',l:'assets/img/brand_partners/Zazu_Kids.png'},
  {n:'Urban August',l:'assets/img/brand_partners/UrbanAugust.png'},
  {n:'TSG Store',l:'assets/img/brand_partners/TSGStore.png'},
  {n:'TacX',l:'assets/img/brand_partners/TacX.png'},
  {n:'Special Need',l:'assets/img/brand_partners/Special_Need.png'},
  {n:'Ledgebay',l:'assets/img/brand_partners/Ledgebay.png'},
  {n:'Kolari Vision',l:'assets/img/brand_partners/Kolari_Vision.png'},
  {n:'EXO',l:'assets/img/brand_partners/EXO.png'},
  {n:'Eva Nutrition',l:'assets/img/brand_partners/Eva_Nutrition.png'},
  {n:'Clyor',l:'assets/img/brand_partners/Clyor.png'},
];


/* ============================================================
   Note: the old CHATBOT_INTENTS knowledge base that used to live
   in this file has moved to /knowledge/*.json — see
   js/chatbot/knowledge-base.js. svcs/team/revs/tiers/portData
   above are still the single source of truth for both the on-page
   grids (rendered by js/main.js) and the chatbot's services/team/
   pricing/portfolio knowledge (the knowledge/*.json files were
   generated from this exact data, so the two never drift apart).
   ============================================================ */
