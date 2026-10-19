/**
 * Typed API Client for SignalHarbor
 */

const API_BASE = "http://localhost:8000/api/v1";

export interface QualityScores {
  fit_score: number;
  company_identity_confidence: number;
  contact_confidence: number;
  freshness: number;
  evidence_completeness: number;
  positive_reasons: string[];
  negative_reasons: string[];
  risk_flags: string[];
}

export interface ContactChannel {
  id: string;
  organization_id: string;
  channel_type: "email" | "phone" | "contact_form" | "social_url";
  raw_value: string;
  normalized_value: string;
  is_primary: boolean;
  is_verified: boolean;
  confidence_score: number;
  validation_statuses: string[];
  validation_notes: string[];
  last_checked_at?: string;
}

export interface EvidenceRecord {
  id: string;
  source_id: string;
  source_url: string;
  canonical_url: string;
  page_title?: string;
  retrieval_timestamp: string;
  content_hash: string;
  dom_locator?: string;
  supporting_excerpt: string;
  extraction_method: string;
  parser_version: string;
}

export interface Claim {
  id: string;
  organization_id: string;
  field_name: string;
  raw_value: string;
  normalized_value: string;
  status: string;
  confidence: number;
  evidence: EvidenceRecord;
}

export interface Organization {
  id: string;
  legal_name: string;
  canonical_domain: string;
  website_url: string;
  industry?: string;
  description?: string;
  employee_count_range?: string;
  headquarters_country?: string;
  headquarters_city?: string;
  disposition: "qualified" | "review" | "rejected" | "suppressed" | "stale";
  fit_score: number;
  identity_confidence: number;
  contact_confidence: number;
  freshness: number;
  evidence_completeness: number;
  scores_detail: QualityScores;
  contacts: ContactChannel[];
  claims: Claim[];
  created_at: string;
  updated_at: string;
}

export interface ICPProfile {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  target_industries: string[];
  target_geographies: string[];
  target_sizes: string[];
  required_keywords: string[];
  excluded_keywords: string[];
  min_fit_threshold: number;
  min_confidence_threshold: number;
  created_at: string;
}

export interface SearchRun {
  id: string;
  workspace_id: string;
  icp_profile_id: string;
  status: "pending" | "running" | "completed" | "failed";
  urls_discovered: number;
  pages_crawled: number;
  prospects_found: number;
  prospects_qualified: number;
  prospects_review: number;
  created_at: string;
  completed_at?: string;
}

export interface ReviewTask {
  id: string;
  organization_id: string;
  reason: string;
  details: {
    positive_reasons?: string[];
    negative_reasons?: string[];
  };
  status: "pending" | "resolved" | "dismissed";
  decision?: string;
  organization: Organization;
  created_at: string;
}

export interface Source {
  source_id: string;
  name: string;
  source_class: string;
  base_url: string;
  status: string;
  is_paused: boolean;
  max_rpm: number;
  daily_budget: number;
  last_review: string;
}

export interface Suppression {
  id: string;
  workspace_id: string;
  item_type: string;
  normalized_value: string;
  reason: string;
  created_at: string;
}

export interface SystemStats {
  total_prospects: number;
  qualified_count: number;
  review_backlog: number;
  suppressed_count: number;
  rejected_count: number;
  average_fit_score: number;
  evidence_completeness_pct: number;
  provenance_accuracy_pct: number;
  docker_dependency: boolean;
  serper_dependency: boolean;
}

export async function fetchStats(): Promise<SystemStats> {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}

export async function fetchProspects(params?: {
  disposition?: string;
  min_fit?: number;
  query?: string;
}): Promise<Organization[]> {
  const url = new URL(`${API_BASE}/prospects`);
  if (params?.disposition) url.searchParams.set("disposition", params.disposition);
  if (params?.min_fit) url.searchParams.set("min_fit", params.min_fit.toString());
  if (params?.query) url.searchParams.set("query", params.query);
  const res = await fetch(url.toString());
  return res.json();
}

export async function fetchProspectDetail(id: string): Promise<Organization> {
  const res = await fetch(`${API_BASE}/prospects/${id}`);
  return res.json();
}

export async function fetchICPProfiles(): Promise<ICPProfile[]> {
  const res = await fetch(`${API_BASE}/icp-profiles`);
  return res.json();
}

export async function createICPProfile(data: Partial<ICPProfile>): Promise<ICPProfile> {
  const res = await fetch(`${API_BASE}/icp-profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchSearchRuns(): Promise<SearchRun[]> {
  const res = await fetch(`${API_BASE}/search-runs`);
  return res.json();
}

export async function launchSearchRun(icpProfileId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/search-runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ icp_profile_id: icpProfileId }),
  });
  return res.json();
}

export async function fetchReviewTasks(): Promise<ReviewTask[]> {
  const res = await fetch(`${API_BASE}/review-tasks`);
  return res.json();
}

export async function submitReviewDecision(
  taskId: string,
  decision: "approved" | "rejected" | "dismissed",
  notes?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/review-tasks/${taskId}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, notes }),
  });
  return res.json();
}

export async function fetchSources(): Promise<Source[]> {
  const res = await fetch(`${API_BASE}/sources`);
  return res.json();
}

export async function toggleSource(sourceId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/sources/${sourceId}/toggle`, {
    method: "POST",
  });
  return res.json();
}

export async function fetchSuppressions(): Promise<Suppression[]> {
  const res = await fetch(`${API_BASE}/suppressions`);
  return res.json();
}

export async function addSuppression(itemType: string, value: string, reason: string): Promise<Suppression> {
  const res = await fetch(`${API_BASE}/suppressions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_type: itemType, value, reason }),
  });
  return res.json();
}

export async function createExport(format: "csv" | "json", includeEvidence: boolean = true): Promise<any> {
  const res = await fetch(`${API_BASE}/exports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, include_evidence: includeEvidence }),
  });
  return res.json();
}

export async function seedDemoData(): Promise<any> {
  const res = await fetch(`${API_BASE}/seed-demo`, {
    method: "POST",
  });
  return res.json();
}
