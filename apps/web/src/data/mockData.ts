/**
 * Signal Harbor — 42 Curated Enterprise Intelligence Entities
 * Industries: Cloud Infrastructure, Cybersecurity, Fintech, DevTools, AI & Logistics
 * Plausible domains, lat/lon coordinates for 3D Globe, verification routes, and auditable provenance trails.
 */

export interface ContactRoute {
  id: string;
  type: "email" | "phone" | "contact_form";
  value: string;
  status: "Verified Route" | "Uncorroborated" | "Unprobed";
  confidence: number;
  personName?: string;
  personTitle?: string;
  isRoleAddress: boolean;
  notes: string[];
}

export interface ProvenanceClaim {
  id: string;
  field: string;
  value: string;
  sourceUrl: string;
  domLocator: string;
  excerpt: string;
  contentHash: string;
  observedAt: string;
  status: "Supported" | "Corroborated" | "Disputed";
}

export interface ProspectEntity {
  id: string;
  name: string;
  domain: string;
  websiteUrl: string;
  industry: string;
  geo: string;
  city: string;
  employeeRange: string;
  lat: number;
  lon: number;
  fitScore: number;
  identityConfidence: number;
  contactConfidence: number;
  evidenceCompleteness: number;
  freshness: number;
  disposition: "Qualified" | "Review" | "Suppressed";
  contacts: ContactRoute[];
  provenance: ProvenanceClaim[];
  positiveFactors: string[];
  negativeFactors: string[];
}

export const ContactRoute = {};
export const ProvenanceClaim = {};
export const ProspectEntity = {};

export const MOCK_COMPANIES: ProspectEntity[] = [
  {
    id: "ent-01",
    name: "Sentry Peak Logistics",
    domain: "sentrypeaklogistics.com",
    websiteUrl: "https://sentrypeaklogistics.com",
    industry: "Cold-Chain Logistics",
    geo: "United States",
    city: "Denver, CO",
    employeeRange: "250-500",
    lat: 39.7392,
    lon: -104.9903,
    fitScore: 94,
    identityConfidence: 96,
    contactConfidence: 92,
    evidenceCompleteness: 100,
    freshness: 98,
    disposition: "Qualified",
    contacts: [
      {
        id: "c-01",
        type: "email",
        value: "inquiries@sentrypeaklogistics.com",
        status: "Verified Route",
        confidence: 94,
        isRoleAddress: true,
        personName: "Marcus Vance",
        personTitle: "VP Cold-Chain Operations",
        notes: ["Published in footer mailto: anchor", "Active MX records verified (Google Workspace)", "Mailbox routing syntax verified RFC 5322"],
      },
      {
        id: "c-02",
        type: "phone",
        value: "+1 (303) 555-0149",
        status: "Verified Route",
        confidence: 90,
        isRoleAddress: false,
        notes: ["E.164 syntax validated", "Matches corporate registry filing"],
      },
    ],
    provenance: [
      {
        id: "pr-01",
        field: "canonical_domain",
        value: "sentrypeaklogistics.com",
        sourceUrl: "https://sentrypeaklogistics.com/about",
        domLocator: "footer > div.copyright > p",
        excerpt: "© 2026 Sentry Peak Logistics Inc. Global refrigerated freight distribution.",
        contentHash: "8f7a932b14c3e8093d5f4702ac814fba394c8e7b1652f90117b0a852a36d93e1",
        observedAt: "2026-10-12T14:22:00Z",
        status: "Corroborated",
      },
      {
        id: "pr-02",
        field: "published_email",
        value: "inquiries@sentrypeaklogistics.com",
        sourceUrl: "https://sentrypeaklogistics.com/contact",
        domLocator: "main > section.contact-hub a[href^='mailto:']",
        excerpt: "Direct carrier dispatch inquiries: inquiries@sentrypeaklogistics.com",
        contentHash: "2a34fc9018e632dbb718903cde897f54cba798e10034a761efbc87d19e9842a1",
        observedAt: "2026-10-12T14:22:15Z",
        status: "Supported",
      },
    ],
    positiveFactors: [
      "Industry matches target ICP Cold-Chain Logistics criteria",
      "Corroborated by Colorado Secretary of State entity registration #201814920",
      "Direct verified primary contact route observed on corporate contact page",
    ],
    negativeFactors: ["Primary contact is a corporate role address (inquiries@)"],
  },
  {
    id: "ent-02",
    name: "IronClad Cyber Defense",
    domain: "ironcladcyber.net",
    websiteUrl: "https://ironcladcyber.net",
    industry: "Cybersecurity",
    geo: "United States",
    city: "Reston, VA",
    employeeRange: "100-250",
    lat: 38.9586,
    lon: -77.357,
    fitScore: 98,
    identityConfidence: 98,
    contactConfidence: 94,
    evidenceCompleteness: 100,
    freshness: 99,
    disposition: "Qualified",
    contacts: [
      {
        id: "c-03",
        type: "email",
        value: "defense-ops@ironcladcyber.net",
        status: "Verified Route",
        confidence: 96,
        isRoleAddress: true,
        personName: "Elena Rostova",
        personTitle: "Chief Information Security Officer",
        notes: ["Published in security response disclosure page", "Direct MX routing confirmed through Proofpoint cluster", "Zero bounce history"],
      },
    ],
    provenance: [
      {
        id: "pr-03",
        field: "canonical_domain",
        value: "ironcladcyber.net",
        sourceUrl: "https://ironcladcyber.net/security",
        domLocator: "header > div.security-badge",
        excerpt: "IronClad Autonomous SOC Monitoring & Zero-Trust Governance Systems.",
        contentHash: "904b78c1da62a8c3e8093d5f4702ac814fba394c8e7b1652f90117b0a852a36d",
        observedAt: "2026-10-13T09:15:20Z",
        status: "Corroborated",
      },
    ],
    positiveFactors: [
      "Top-tier ICP fit: SOC Monitoring & Threat Intelligence keywords corroborated",
      "Registered corporate vendor under US federal contractor database",
      "Direct verified corporate security contact route",
    ],
    negativeFactors: [],
  },
  {
    id: "ent-03",
    name: "Meridian Cloud Solutions",
    domain: "meridiancloud.io",
    websiteUrl: "https://meridiancloud.io",
    industry: "Cloud Infrastructure",
    geo: "United States",
    city: "Austin, TX",
    employeeRange: "50-100",
    lat: 30.2672,
    lon: -97.7431,
    fitScore: 88,
    identityConfidence: 89,
    contactConfidence: 80,
    evidenceCompleteness: 85,
    freshness: 94,
    disposition: "Review",
    contacts: [
      {
        id: "c-04",
        type: "email",
        value: "contact@meridiancloud.io",
        status: "Uncorroborated",
        confidence: 78,
        isRoleAddress: true,
        personName: "Devon Reed",
        personTitle: "Lead Infrastructure Architect",
        notes: ["Discovered on second-party cloud directory", "DNS MX record present but domain has catch-all enabled"],
      },
      {
        id: "c-05",
        type: "contact_form",
        value: "https://meridiancloud.io/contact-us",
        status: "Verified Route",
        confidence: 92,
        isRoleAddress: false,
        notes: ["Direct corporate intake form with CSRF token check"],
      },
    ],
    provenance: [
      {
        id: "pr-04",
        field: "canonical_domain",
        value: "meridiancloud.io",
        sourceUrl: "https://meridiancloud.io",
        domLocator: "body > div#root > footer",
        excerpt: "Meridian Cloud Multi-Cluster Kubernetes Mesh Architecture.",
        contentHash: "1198f3b2e7a64c01d9f4803bc9812fa4394c8e7b1652f90117b0a852a36d93e1",
        observedAt: "2026-10-13T11:40:00Z",
        status: "Supported",
      },
    ],
    positiveFactors: ["Strong keyword alignment with Kubernetes orchestration & FinOps", "Official corporate domain verified"],
    negativeFactors: [
      "Primary email domain utilizes catch-all routing (unprobed inbox placement)",
      "Held in Review queue for human operator corroboration",
    ],
  },
  {
    id: "ent-04",
    name: "Apex Industrial Robotics",
    domain: "apexindustrial.com",
    websiteUrl: "https://apexindustrial.com",
    industry: "Industrial Automation",
    geo: "Germany",
    city: "Stuttgart",
    employeeRange: "500-1000",
    lat: 48.7758,
    lon: 9.1829,
    fitScore: 91,
    identityConfidence: 94,
    contactConfidence: 88,
    evidenceCompleteness: 95,
    freshness: 96,
    disposition: "Qualified",
    contacts: [
      {
        id: "c-06",
        type: "email",
        value: "automation-sales@apexindustrial.com",
        status: "Verified Route",
        confidence: 90,
        isRoleAddress: true,
        personName: "Dr. Klaus Weber",
        personTitle: "Director of Systems Integration",
        notes: ["Official German Impressum declaration verified", "Direct corporate MX records via Microsoft 365"],
      },
      {
        id: "c-07",
        type: "phone",
        value: "+49 711 555-0810",
        status: "Verified Route",
        confidence: 95,
        isRoleAddress: false,
        notes: ["Baden-Württemberg official registration number HRB 748192"],
      },
    ],
    provenance: [
      {
        id: "pr-05",
        field: "canonical_domain",
        value: "apexindustrial.com",
        sourceUrl: "https://apexindustrial.com/de/impressum",
        domLocator: "main > section.legal-info",
        excerpt: "Apex Industrial Robotics GmbH, Amtsgericht Stuttgart HRB 748192.",
        contentHash: "7b89e34a019dc845a76901bcde897f54cba798e10034a761efbc87d19e9842a1",
        observedAt: "2026-10-11T18:00:00Z",
        status: "Corroborated",
      },
    ],
    positiveFactors: [
      "Direct verification via official German statutory Impressum",
      "Precision manufacturing robotics fits enterprise hardware criteria",
      "Two independent contact routes verified",
    ],
    negativeFactors: [],
  },
  {
    id: "ent-05",
    name: "Beacon BioPharma Laboratories",
    domain: "beaconbiopharma.org",
    websiteUrl: "https://beaconbiopharma.org",
    industry: "HealthTech & Bio",
    geo: "United Kingdom",
    city: "Cambridge",
    employeeRange: "100-250",
    lat: 52.2053,
    lon: 0.1218,
    fitScore: 76,
    identityConfidence: 85,
    contactConfidence: 72,
    evidenceCompleteness: 80,
    freshness: 92,
    disposition: "Review",
    contacts: [
      {
        id: "c-08",
        type: "email",
        value: "trials@beaconbiopharma.org",
        status: "Uncorroborated",
        confidence: 72,
        isRoleAddress: true,
        notes: ["Found on public clinical trial index", "MX records active"],
      },
    ],
    provenance: [
      {
        id: "pr-06",
        field: "canonical_domain",
        value: "beaconbiopharma.org",
        sourceUrl: "https://beaconbiopharma.org/research",
        domLocator: "footer > p",
        excerpt: "Beacon BioPharma Cambridge Science Park, UK.",
        contentHash: "3f90184bdae762c9018402bcde897f54cba798e10034a761efbc87d19e9842a1",
        observedAt: "2026-10-12T08:30:00Z",
        status: "Supported",
      },
    ],
    positiveFactors: ["Legitimate research institution with UK Companies House listing"],
    negativeFactors: ["Outside primary cloud software focus", "Pending clinical director verification"],
  },
  {
    id: "ent-06",
    name: "Vortex Data Streaming",
    domain: "vortexstream.dev",
    websiteUrl: "https://vortexstream.dev",
    industry: "DevTools",
    geo: "United States",
    city: "San Francisco, CA",
    employeeRange: "25-50",
    lat: 37.7749,
    lon: -122.4194,
    fitScore: 96,
    identityConfidence: 94,
    contactConfidence: 91,
    evidenceCompleteness: 95,
    freshness: 99,
    disposition: "Qualified",
    contacts: [
      {
        id: "c-09",
        type: "email",
        value: "engineering@vortexstream.dev",
        status: "Verified Route",
        confidence: 93,
        isRoleAddress: true,
        personName: "Aiden Cross",
        personTitle: "Founder & CTO",
        notes: ["Published in GitHub organization contact & verified website footer", "DNS TXT SPF and DKIM verified"],
      },
    ],
    provenance: [
      {
        id: "pr-07",
        field: "canonical_domain",
        value: "vortexstream.dev",
        sourceUrl: "https://vortexstream.dev",
        domLocator: "main header",
        excerpt: "Ultra-low latency Apache Kafka & Flink distributed streaming engine.",
        contentHash: "447a19dc0938bf82710482bcde897f54cba798e10034a761efbc87d19e9842a1",
        observedAt: "2026-10-13T16:00:00Z",
        status: "Corroborated",
      },
    ],
    positiveFactors: ["High-affinity developer tooling target", "Zero-bounce SPF verified domain"],
    negativeFactors: [],
  },
  {
    id: "ent-07",
    name: "BlackHole Consumer Retail Ltd",
    domain: "blackholedeals.com",
    websiteUrl: "https://blackholedeals.com",
    industry: "Consumer Retail",
    geo: "United States",
    city: "Miami, FL",
    employeeRange: "10-25",
    lat: 25.7617,
    lon: -80.1918,
    fitScore: 56,
    identityConfidence: 62,
    contactConfidence: 45,
    evidenceCompleteness: 55,
    freshness: 75,
    disposition: "Suppressed",
    contacts: [
      {
        id: "c-10",
        type: "email",
        value: "support@blackholedeals.com",
        status: "Unprobed",
        confidence: 45,
        isRoleAddress: true,
        notes: ["Consumer discount site", "Failed ICP enterprise criteria"],
      },
    ],
    provenance: [
      {
        id: "pr-08",
        field: "canonical_domain",
        value: "blackholedeals.com",
        sourceUrl: "https://blackholedeals.com",
        domLocator: "footer",
        excerpt: "Consumer flash clearance items and vouchers.",
        contentHash: "998240acbd817260194820bcde897f54cba798e10034a761efbc87d19e9842a1",
        observedAt: "2026-10-10T12:00:00Z",
        status: "Disputed",
      },
    ],
    positiveFactors: [],
    negativeFactors: [
      "B2C retail business explicitly excluded in ICP Profile",
      "Domain added to workspace suppression exclusion rules",
    ],
  },
  {
    id: "ent-08",
    name: "Quantex Capital Analytics",
    domain: "quantexcap.com",
    websiteUrl: "https://quantexcap.com",
    industry: "Fintech",
    geo: "United States",
    city: "New York, NY",
    employeeRange: "100-250",
    lat: 40.7128,
    lon: -74.006,
    fitScore: 92,
    identityConfidence: 95,
    contactConfidence: 89,
    evidenceCompleteness: 95,
    freshness: 97,
    disposition: "Qualified",
    contacts: [
      {
        id: "c-11",
        type: "email",
        value: "institutional@quantexcap.com",
        status: "Verified Route",
        confidence: 91,
        isRoleAddress: true,
        personName: "Claire Dupont",
        personTitle: "Head of Algorithmic Execution",
        notes: ["Published in SEC Form ADV filing", "Primary enterprise institutional portal"],
      },
    ],
    provenance: [
      {
        id: "pr-09",
        field: "canonical_domain",
        value: "quantexcap.com",
        sourceUrl: "https://quantexcap.com/institutional",
        domLocator: "section.compliance",
        excerpt: "Quantex Capital Analytics SEC Registered Investment Adviser #801-119283.",
        contentHash: "12479bc081729482710482bcde897f54cba798e10034a761efbc87d19e9842a1",
        observedAt: "2026-10-13T10:10:00Z",
        status: "Corroborated",
      },
    ],
    positiveFactors: ["SEC regulatory confirmation matches institutional fintech criteria", "High revenue density target"],
    negativeFactors: [],
  },
  {
    id: "ent-09",
    name: "Krypton Layer Zero Networks",
    domain: "kryptonlayer.io",
    websiteUrl: "https://kryptonlayer.io",
    industry: "Cybersecurity",
    geo: "Switzerland",
    city: "Zurich",
    employeeRange: "50-100",
    lat: 47.3769,
    lon: 8.5417,
    fitScore: 89,
    identityConfidence: 91,
    contactConfidence: 86,
    evidenceCompleteness: 90,
    freshness: 95,
    disposition: "Qualified",
    contacts: [
      {
        id: "c-12",
        type: "email",
        value: "infra@kryptonlayer.io",
        status: "Verified Route",
        confidence: 88,
        isRoleAddress: true,
        personName: "Lukas Bern",
        personTitle: "Network Security Officer",
        notes: ["Swiss commercial registry CH-020.3.049.201 corroborated", "ProtonMail enterprise gateway"],
      },
    ],
    provenance: [
      {
        id: "pr-10",
        field: "canonical_domain",
        value: "kryptonlayer.io",
        sourceUrl: "https://kryptonlayer.io/imprint",
        domLocator: "footer.swiss-reg",
        excerpt: "Krypton Layer AG, Bahnhofstrasse 45, 8001 Zürich, Switzerland.",
        contentHash: "557a19dc0938bf82710482bcde897f54cba798e10034a761efbc87d19e9842a1",
        observedAt: "2026-10-12T15:20:00Z",
        status: "Corroborated",
      },
    ],
    positiveFactors: ["Confidential compute & hardware enclave target", "Strong European presence"],
    negativeFactors: [],
  },
  {
    id: "ent-10",
    name: "PulseWave Telemetry Systems",
    domain: "pulsewavetelemetry.com",
    websiteUrl: "https://pulsewavetelemetry.com",
    industry: "DevTools",
    geo: "Canada",
    city: "Toronto, ON",
    employeeRange: "100-250",
    lat: 43.6532,
    lon: -79.3832,
    fitScore: 93,
    identityConfidence: 92,
    contactConfidence: 89,
    evidenceCompleteness: 95,
    freshness: 97,
    disposition: "Qualified",
    contacts: [
      {
        id: "c-13",
        type: "email",
        value: "partner-integrations@pulsewavetelemetry.com",
        status: "Verified Route",
        confidence: 91,
        isRoleAddress: true,
        personName: "Samantha Wu",
        personTitle: "VP Platform Ecosystem",
        notes: ["Published in OpenTelemetry exporter documentation", "SPF, DKIM, and DMARC enforcement active"],
      },
    ],
    provenance: [
      {
        id: "pr-11",
        field: "canonical_domain",
        value: "pulsewavetelemetry.com",
        sourceUrl: "https://pulsewavetelemetry.com/docs",
        domLocator: "div#contact-meta",
        excerpt: "PulseWave Distributed Observability & eBPF Runtime Monitoring.",
        contentHash: "889b19dc0938bf82710482bcde897f54cba798e10034a761efbc87d19e9842a1",
        observedAt: "2026-10-13T12:05:00Z",
        status: "Corroborated",
      },
    ],
    positiveFactors: ["eBPF telemetry technology matches infrastructure ICP", "Verified Canadian federal corporation"],
    negativeFactors: [],
  },
  // Additional realistic entities to reach 42 total entities
  ...Array.from({ length: 32 }, (_, i) => {
    const idx = i + 11;
    const sectors = [
      { ind: "Cloud Infrastructure", cities: ["Seattle, WA", "Chicago, IL", "Dublin", "Frankfurt", "Tokyo"], lats: [47.6062, 41.8781, 53.3498, 50.1109, 35.6762], lons: [-122.3321, -87.6298, -6.2603, 8.6821, 139.6503] },
      { ind: "Cybersecurity", cities: ["Tel Aviv", "Washington, DC", "London", "San Jose, CA", "Sydney"], lats: [32.0853, 38.9072, 51.5074, 37.3382, -33.8688], lons: [34.7818, -77.0369, -0.1278, -121.8863, 151.2093] },
      { ind: "Fintech", cities: ["New York, NY", "London", "Singapore", "Hong Kong", "Paris"], lats: [40.7128, 51.5074, 1.3521, 22.3193, 48.8566], lons: [-74.006, -0.1278, 103.8198, 114.1694, 2.3522] },
      { ind: "DevTools", cities: ["San Francisco, CA", "Amsterdam", "Berlin", "Salt Lake City, UT", "Stockholm"], lats: [37.7749, 52.3676, 52.52, 40.7608, 59.3293], lons: [-122.4194, 4.9041, 13.405, -111.891, 18.0686] },
      { ind: "Cold-Chain Logistics", cities: ["Rotterdam", "Singapore", "Memphis, TN", "Antwerp", "Hamburg"], lats: [51.9244, 1.3521, 35.1495, 51.2194, 53.5511], lons: [4.4777, 103.8198, -90.049, 4.4025, 9.9937] },
    ];
    const s = sectors[i % sectors.length];
    const cIdx = i % s.cities.length;
    const namePrefixes = ["HyperScale", "Aegis", "Synapse", "Strata", "Aether", "OmniMesh", "Veritas", "Cobalt", "Cortex", "Terraform", "Sovereign", "Nexus", "Helios", "Vector", "Optima", "Fortress"];
    const nameSuffixes = ["Systems", "Dynamics", "Networks", "Technologies", "Laboratories", "Intelligence", "Analytics", "Security", "Scale", "Infra", "Automation", "Compute"];
    const pName = `${namePrefixes[i % namePrefixes.length]} ${nameSuffixes[(i * 3) % nameSuffixes.length]}`;
    const cleanDomain = `${pName.toLowerCase().replace(/\s+/g, "")}.com`;
    const score = 65 + ((i * 7) % 34);
    const isQual = score >= 82;
    const isRev = score >= 70 && score < 82;
    const disp: "Qualified" | "Review" | "Suppressed" = isQual ? "Qualified" : isRev ? "Review" : "Suppressed";

    return {
      id: `ent-${idx}`,
      name: pName,
      domain: cleanDomain,
      websiteUrl: `https://${cleanDomain}`,
      industry: s.ind,
      geo: s.cities[cIdx].includes(",") ? "United States" : s.cities[cIdx],
      city: s.cities[cIdx],
      employeeRange: i % 2 === 0 ? "50-100" : "250-500",
      lat: s.lats[cIdx] + (Math.random() - 0.5) * 1.2,
      lon: s.lons[cIdx] + (Math.random() - 0.5) * 1.2,
      fitScore: score,
      identityConfidence: Math.min(99, score + 4),
      contactConfidence: Math.min(98, score - 2),
      evidenceCompleteness: 85 + (i % 15),
      freshness: 90 + (i % 10),
      disposition: disp,
      contacts: [
        {
          id: `c-${idx}-1`,
          type: "email" as const,
          value: `inquiries@${cleanDomain}`,
          status: isQual ? ("Verified Route" as const) : ("Uncorroborated" as const),
          confidence: Math.min(96, score - 1),
          personName: `Jordan Sterling #${idx}`,
          personTitle: "Director of Technical Engagements",
          isRoleAddress: true,
          notes: ["Discovered in corporate contact section", "SPF & MX routing validated"],
        },
      ],
      provenance: [
        {
          id: `pr-${idx}-1`,
          field: "canonical_domain",
          value: cleanDomain,
          sourceUrl: `https://${cleanDomain}/about`,
          domLocator: "footer.company-info",
          excerpt: `${pName} corporate headquarters and registered public domain.`,
          contentHash: `hash_${idx}_${Math.random().toString(36).substring(2, 10)}`,
          observedAt: "2026-10-13T14:00:00Z",
          status: "Supported" as const,
        },
      ],
      positiveFactors: [`Aligned with ${s.ind} enterprise mandate`, `Verified canonical hostname ${cleanDomain}`],
      negativeFactors: isQual ? [] : ["Requires second independent source corroboration"],
    };
  }),
];

export const MOCK_STATS = {
  qualifiedLeads: 28,
  avgFitScore: 88.4,
  verificationRate: 94.2,
  provenanceCoverage: 100.0,
  deltas: {
    qualified: "+14.2% this week",
    fit: "+3.1% vs target",
    verif: "+1.8% vs benchmark",
    provenance: "0 unbacked claims",
  },
};

export const MOCK_ACTIVITY_FEED = [
  { id: "act-1", time: "2m ago", text: "Verified primary route inquiries@sentrypeaklogistics.com (MX Google Workspace)", type: "verified" },
  { id: "act-2", time: "8m ago", text: "IronClad Cyber Defense qualified via autonomous SOC criteria (Fit: 98%)", type: "qualified" },
  { id: "act-3", time: "14m ago", text: "Meridian Cloud Solutions routed to Review Backlog (Catch-all routing detected)", type: "review" },
  { id: "act-4", time: "22m ago", text: "Harvest run #84 completed: 142 pages crawled, 18 candidate entities extracted", type: "system" },
  { id: "act-5", time: "31m ago", text: "Suppression enforced for blackholedeals.com (B2C policy exclusion)", type: "suppressed" },
];

export const MOCK_DISCOVERY_RUNS = [
  {
    id: "run-1092",
    name: "North America Cloud & Cold-Chain Sweep",
    status: "Active",
    currentStage: "Score",
    progress: 74,
    stages: ["Crawl", "Parse", "Corroborate", "Score", "Qualify"],
    stageProgress: [100, 100, 100, 74, 0],
    discovered: 38,
    crawled: 164,
    qualified: 19,
    startedAt: "2026-10-13 19:40:12",
    targetICP: "High-Growth Cloud & Cold-Chain",
  },
  {
    id: "run-1091",
    name: "European Industrial Automation & Robotics",
    status: "Completed",
    currentStage: "Qualify",
    progress: 100,
    stages: ["Crawl", "Parse", "Corroborate", "Score", "Qualify"],
    stageProgress: [100, 100, 100, 100, 100],
    discovered: 24,
    crawled: 98,
    qualified: 14,
    startedAt: "2026-10-13 14:15:00",
    targetICP: "German & EU Precision Robotics",
  },
  {
    id: "run-1090",
    name: "Cybersecurity SOC Defense Platforms",
    status: "Completed",
    currentStage: "Qualify",
    progress: 100,
    stages: ["Crawl", "Parse", "Corroborate", "Score", "Qualify"],
    stageProgress: [100, 100, 100, 100, 100],
    discovered: 31,
    crawled: 124,
    qualified: 21,
    startedAt: "2026-10-12 18:00:22",
    targetICP: "US Federal & Enterprise Security",
  },
];
