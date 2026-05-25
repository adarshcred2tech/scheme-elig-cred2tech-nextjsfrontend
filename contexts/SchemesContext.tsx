'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface Scheme {
  id: string;
  slug: string;
  schemeName: string;
  nodalMinistryName: string;
  briefDescription: string;
  schemeLevel: string;
  tags: string[];
  schemeCloseDate: string | null;
  schemeCategory: string[];
  schemeFor: string;
  beneficiaryState: string[];
  matchReason?: string;
}

export type MissingField = {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'boolean';
  options?: { value: string; label: string }[];
};

export interface SchemesContextType {
  schemes: Scheme[];
  savedSchemes: Scheme[];
  searchQuery: string;
  selectedFilters: {
    category: string[];
    ministry: string[];
    state: string[];
    level: string[];
    type: string[];
    minInvestment: number;
    maxInvestment: number;
  };
  filterOptions: {
    categories: string[];
    ministries: string[];
    states: string[];
    levels: string[];
    types: string[];
  };
  isLoading: boolean;
  currentPage: number;
  itemsPerPage: number;
  missingFields: MissingField[];
  showMissingFieldsModal: boolean;

  setSearchQuery: (query: string) => void;
  setSelectedFilters: (filters: Partial<SchemesContextType['selectedFilters']>) => void;
  loadSchemesForDashboard: () => Promise<void>;
  searchSchemes: (profile?: any) => Promise<void>;
  submitMissingFields: (values: Record<string, any>) => Promise<void>;
  dismissMissingFieldsModal: () => void;
  saveScheme: (schemes: Scheme[]) => Promise<boolean>;
  removeSavedScheme: (schemeId: string) => void;
  getSavedSchemes: () => Promise<void>;
  getSchemeById: (id: string) => Scheme | undefined;
  setCurrentPage: (page: number) => void;
  getTotalPages: () => number;
  getFilteredSchemes: () => Scheme[];
  getSchemeDetailBySlug: (slug: string) => Promise<any>;
  getSchemeDocuments: (mongoId: string) => Promise<any[]>;
  getSchemeFaqs: (mongoId: string) => Promise<any[]>;
  getSchemeApplicationProcess: (mongoId: string) => Promise<any>;
  fetchSchemeBySlug: (slug: string) => Promise<Scheme | null>;
  refreshSchemes: () => Promise<void>;
}

const REQUIRED_SEARCH_FIELDS: MissingField[] = [
  {
    key: 'sector',
    label: 'Business Sector / Industry',
    type: 'select',
    options: [
      // Values must match SECTOR_MAP keys in nestjs-backend/src/schemes/schemes.service.ts
      { value: 'finance',       label: 'Finance, Banking, Fintech & Professional Services' },
      { value: 'technology',    label: 'IT / Software / Technology / ITES' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'retail',        label: 'Retail / Trading / Wholesale' },
      { value: 'services',      label: 'Other Services (Consulting, Admin, etc.)' },
      { value: 'healthcare',    label: 'Healthcare & Pharma' },
      { value: 'education',     label: 'Education & Training' },
      { value: 'construction',  label: 'Construction & Real Estate' },
      { value: 'transport',     label: 'Transportation & Logistics' },
      { value: 'agro',          label: 'Agriculture, Food Processing & Dairy' },
      { value: 'textile',       label: 'Textile & Apparel' },
      { value: 'handicraft',    label: 'Handicraft & Artisan' },
      { value: 'fisheries',     label: 'Fisheries & Aquaculture' },
      { value: 'ecommerce',     label: 'E-Commerce' },
      { value: 'energy',        label: 'Energy & Renewables' },
      { value: 'hospitality',   label: 'Hospitality & Tourism' },
      { value: 'media',         label: 'Media & Entertainment' },
    ],
  },
  {
    key: 'msme_size',
    label: 'MSME Size',
    type: 'select',
    options: [
      { value: 'micro',  label: 'Micro' },
      { value: 'small',  label: 'Small' },
      { value: 'medium', label: 'Medium' },
    ],
  },
  {
    key: 'annual_turnover',
    label: 'Annual Turnover Range',
    type: 'select',
    options: [
      { value: 'under5L',    label: 'Under ₹5 Lakh' },
      { value: '5L_40L',     label: '₹5L – ₹40L' },
      { value: '40L_1Cr',    label: '₹40L – ₹1 Cr' },
      { value: '1Cr_10Cr',   label: '₹1 Cr – ₹10 Cr' },
      { value: '10Cr_250Cr', label: '₹10 Cr – ₹250 Cr' },
      { value: 'above250Cr', label: 'Above ₹250 Cr' },
    ],
  },
  {
    key: 'total_employees',
    label: 'Total Employees',
    type: 'select',
    options: [
      { value: '1_5',     label: '1–5' },
      { value: '6_25',    label: '6–25' },
      { value: '26_100',  label: '26–100' },
      { value: '101_500', label: '101–500' },
      { value: '501_plus', label: '501+' },
    ],
  },
  {
    key: 'business_type',
    label: 'Business Type',
    type: 'select',
    options: [
      // Values must match BIZTYPE_MAP keys in the backend schemes.service.ts
      { value: 'startup',       label: 'Startup' },
      { value: 'proprietorship', label: 'Proprietorship / Sole Trader' },
      { value: 'partnership',   label: 'Partnership' },
      { value: 'pvt_ltd',       label: 'Private Limited (Pvt Ltd / LLP)' },
      { value: 'cooperative',   label: 'Cooperative' },
      { value: 'women_owned',   label: 'Women-Owned Business' },
      { value: 'sc_st_owned',   label: 'SC/ST-Owned Business' },
      { value: 'ngo',           label: 'NGO / Social Enterprise' },
    ],
  },
  {
    key: 'business_stage',
    label: 'Business Stage',
    type: 'select',
    options: [
      { value: 'idea',   label: 'Idea Stage' },
      { value: 'early',  label: 'Early Stage (< 2 years)' },
      { value: 'growth', label: 'Growth Stage (2–5 years)' },
      { value: 'mature', label: 'Mature / Established (5+ years)' },
    ],
  },
  {
    key: 'benefit_focus',
    label: 'Primary Benefit Focus',
    type: 'select',
    options: [
      { value: 'any',            label: 'Any / All Benefits' },
      { value: 'loan',           label: 'Loan / Credit / Finance' },
      { value: 'subsidy',        label: 'Subsidy / Grant / Financial Assistance' },
      { value: 'training',       label: 'Training / Skill Development' },
      { value: 'technology',     label: 'Technology Upgradation / Digital' },
      { value: 'marketing',      label: 'Marketing / Export Promotion' },
      { value: 'insurance',      label: 'Insurance / Protection' },
      { value: 'infrastructure', label: 'Infrastructure / Industrial Park' },
      { value: 'tax',            label: 'Tax Exemption / Concession' },
    ],
  },
  {
    key: 'state',
    label: 'State',
    type: 'text',
  },
  {
    key: 'gender',
    label: 'Proprietor / Director Gender',
    type: 'select',
    options: [
      { value: 'Male',        label: 'Male' },
      { value: 'Female',      label: 'Female' },
      { value: 'Transgender', label: 'Transgender' },
    ],
  },
  {
    key: 'caste',
    label: 'Social Category',
    type: 'select',
    options: [
      { value: 'General',  label: 'General (No reservation category)' },
      { value: 'OBC',      label: 'OBC (Other Backward Class)' },
      { value: 'SC',       label: 'SC (Scheduled Caste)' },
      { value: 'ST',       label: 'ST (Scheduled Tribe)' },
      { value: 'Minority', label: 'Minority' },
    ],
  },
  {
    key: 'age',
    label: 'Age of Proprietor / Director',
    type: 'number',
  },
  {
    key: 'differently_abled',
    label: 'Are you differently abled?',
    type: 'select',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true',  label: 'Yes' },
    ],
  },
  {
    key: 'bpl',
    label: 'Do you hold a BPL (Below Poverty Line) card?',
    type: 'select',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true',  label: 'Yes' },
    ],
  },
  {
    key: 'minority',
    label: 'Do you belong to a minority community?',
    type: 'select',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true',  label: 'Yes' },
    ],
  },
];

// Maps any stored sector value → a valid SECTOR_MAP key in the backend (schemes.service.ts).
// Backend SECTOR_MAP keys: manufacturing, agro, textile, handicraft, fisheries,
//   technology, construction, retail, services, finance, education, healthcare,
//   transport, ecommerce, energy, hospitality, media
const SECTOR_NORMALISE_MAP: Record<string, string> = {
  // Direct backend keys — pass through unchanged
  manufacturing: 'manufacturing',
  agro:          'agro',
  textile:       'textile',
  handicraft:    'handicraft',
  fisheries:     'fisheries',
  technology:    'technology',
  construction:  'construction',
  retail:        'retail',
  services:      'services',
  finance:       'finance',
  education:     'education',
  healthcare:    'healthcare',
  transport:     'transport',
  ecommerce:     'ecommerce',
  energy:        'energy',
  hospitality:   'hospitality',
  media:         'media',
  // Legacy / GST / alternate values → backend keys
  it_software:           'technology',
  ites_bpo:              'technology',
  telecom:               'technology',
  fintech:               'finance',
  banking:               'finance',
  nbfc:                  'finance',
  professional_services: 'finance',
  wholesale:             'retail',
  transportation:        'transport',
  food_processing:       'agro',
  agriculture:           'agro',
  media_entertainment:   'media',
  arts_entertainment:    'media',
  real_estate:           'construction',
  // GST catch-all — treated as missing so user must pick a real sector
  other:                 'other',
};

function buildSearchPayload(profile: Record<string, any>): Record<string, any> {
  const p = profile;

  const bucketTurnover = (lakhs: number): string => {
    if (lakhs < 5) return 'under5L';
    if (lakhs < 40) return '5L_40L';
    if (lakhs < 100) return '40L_1Cr';
    if (lakhs < 1000) return '1Cr_10Cr';
    if (lakhs < 25000) return '10Cr_250Cr';
    return 'above250Cr';
  };

  const bucketEmployees = (n: number): string => {
    if (n <= 5) return '1_5';
    if (n <= 25) return '6_25';
    if (n <= 100) return '26_100';
    if (n <= 500) return '101_500';
    return '501_plus';
  };

  // Normalise sector → must be a valid SECTOR_MAP key in the backend
  const rawSector = p.sector || p.businessSector || p.business_sector || '';
  const mappedSector = SECTOR_NORMALISE_MAP[rawSector] || rawSector || undefined;
  // Only include if it's a real backend key (not 'other' which produces no keyword)
  const VALID_BACKEND_SECTORS = new Set([
    'manufacturing','agro','textile','handicraft','fisheries',
    'technology','construction','retail','services','finance',
    'education','healthcare','transport','ecommerce','energy','hospitality','media',
  ]);
  const sector = mappedSector && VALID_BACKEND_SECTORS.has(mappedSector) ? mappedSector : undefined;

  // Normalise business_type → must be a valid BIZTYPE_MAP key in the backend
  // Backend BIZTYPE_MAP keys: startup, proprietorship, partnership, pvt_ltd, cooperative, ngo, women_owned, sc_st_owned
  const VALID_BACKEND_BIZTYPES = new Set([
    'startup','proprietorship','partnership','pvt_ltd','cooperative','ngo','women_owned','sc_st_owned',
  ]);
  const rawBizType = p.business_type || p.businessType || p.entityType || p.entity_type || '';
  const bizTypeMap: Record<string, string> = {
    pvt_ltd: 'pvt_ltd', private_limited: 'pvt_ltd', private_limited_company: 'pvt_ltd',
    llp: 'pvt_ltd', // LLP → closest match
    startup: 'startup', proprietorship: 'proprietorship', partnership: 'partnership',
    cooperative: 'cooperative', ngo: 'ngo', women_owned: 'women_owned', sc_st_owned: 'sc_st_owned',
  };
  const business_type = bizTypeMap[rawBizType] || (VALID_BACKEND_BIZTYPES.has(rawBizType) ? rawBizType : undefined);

  // Normalise benefit_focus → must be a valid BENEFIT_KW key in the backend
  // Backend BENEFIT_KW keys: loan, subsidy, training, marketing, technology, insurance, tax, infrastructure
  const VALID_BENEFIT_FOCUS = new Set([
    'loan','subsidy','training','marketing','technology','insurance','tax','infrastructure',
  ]);
  const rawBenefitFocus = p.benefit_focus || p.benefitFocus;
  const benefit_focus = (!rawBenefitFocus || rawBenefitFocus === 'any')
    ? undefined
    : (VALID_BENEFIT_FOCUS.has(rawBenefitFocus) ? rawBenefitFocus : undefined);

  const msme_size = p.msme_size || p.enterpriseCategory || p.enterprise_category;
  const rawTurnover = p.annualTurnoverLakhs ?? p.annual_turnover_lakhs ?? p.annual_turnover;
  const annual_turnover = (() => {
    if (!rawTurnover) return undefined;
    const n = parseFloat(rawTurnover);
    if (!isNaN(n)) return bucketTurnover(n);
    return String(rawTurnover);
  })();
  const rawEmployees = p.total_employees ?? p.totalEmployees ?? p.total_employees_count;
  const total_employees = (() => {
    if (!rawEmployees) return undefined;
    const n = parseInt(rawEmployees);
    if (!isNaN(n)) return bucketEmployees(n);
    return String(rawEmployees);
  })();
  const business_stage = p.business_stage || p.businessStage;
  const state = p.state || p.principalState;
  const gender = p.gender;
  // caste must always be sent when present — even 'General' is a meaningful filter
  const caste = p.caste || (Array.isArray(p.socialCategory) ? p.socialCategory[0] : p.socialCategory);
  const age = p.age ? parseInt(p.age) : undefined;

  const payload: Record<string, any> = {
    from: 0,
    size: 50,
  };

  // Only include fields that have actual values — omitting a field means "no filter on it"
  if (sector)          payload.sector = sector;
  if (msme_size)       payload.msme_size = msme_size;
  if (annual_turnover) payload.annual_turnover = annual_turnover;
  if (total_employees) payload.total_employees = total_employees;
  if (business_type)   payload.business_type = business_type;
  if (business_stage)  payload.business_stage = business_stage;
  if (benefit_focus)   payload.benefit_focus = benefit_focus;
  if (state)           payload.state = state;
  if (gender)          payload.gender = gender;
  // Always send caste when present — 'General' must be sent so SC/ST-only schemes are excluded
  if (caste)           payload.caste = caste;
  if (age)             payload.age = age;

  // Boolean flags — always include so the API can filter correctly
  payload.differently_abled = p.differently_abled === true || p.differently_abled === 'true' || false;
  payload.bpl               = p.bpl === true || p.bpl === 'true' || false;
  payload.minority          = p.minority === true || p.minority === 'true' || false;

  // Raw turnover in lakhs for local DB filtering
  const rawTurnoverLakhs = p.annualTurnoverLakhs ?? p.annual_turnover_lakhs;
  if (rawTurnoverLakhs !== undefined && rawTurnoverLakhs !== null) {
    const n = parseFloat(rawTurnoverLakhs);
    if (!isNaN(n)) payload.annual_turnover_lakhs = n;
  }

  // Flags for local DB hard filtering
  if (p.isWomenLed !== undefined || p.is_women_led !== undefined)
    payload.is_women_led = p.isWomenLed === true || p.is_women_led === true;
  if (p.isStartup !== undefined || p.is_startup !== undefined)
    payload.is_startup = p.isStartup === true || p.is_startup === true;
  if (p.udyamRegistered !== undefined || p.udyam_registered !== undefined)
    payload.udyam_registered = p.udyamRegistered === true || p.udyam_registered === true;
  if (p.isExportOriented !== undefined || p.is_export_oriented !== undefined)
    payload.is_export_oriented = p.isExportOriented === true || p.is_export_oriented === true;
  if (p.ruralUrban || p.rural_urban)
    payload.rural_urban = p.ruralUrban || p.rural_urban;

  return payload;
}

// Maps each search key to the raw DB profile field(s) that satisfy it
const PROFILE_SOURCE_MAP: Record<string, (p: Record<string, any>) => any> = {
  sector:            (p) => p.sector || p.businessSector || p.business_sector,
  msme_size:         (p) => p.enterpriseCategory || p.enterprise_category || p.msme_size,
  annual_turnover:   (p) => p.annualTurnoverLakhs || p.annual_turnover_lakhs || p.annual_turnover,
  total_employees:   (p) => p.total_employees || p.totalEmployees,
  business_type:     (p) => p.businessType || p.business_type || p.entityType || p.entity_type,
  business_stage:    (p) => p.businessStage || p.business_stage,
  benefit_focus:     (p) => p.benefitFocus || p.benefit_focus,
  state:             (p) => p.state || p.principalState,
  gender:            (p) => p.gender,
  caste:             (p) => p.caste || (Array.isArray(p.socialCategory) ? p.socialCategory[0] : p.socialCategory),
  age:               (p) => p.age,
  differently_abled: (p) => (p.differently_abled !== undefined && p.differently_abled !== null) ? String(p.differently_abled) : undefined,
  bpl:               (p) => (p.bpl !== undefined && p.bpl !== null) ? String(p.bpl) : undefined,
  minority:          (p) => (p.minority !== undefined && p.minority !== null) ? String(p.minority) : undefined,
};

// Maps search key → DB field name to use when saving back via eligibility endpoint
const DB_SAVE_KEY_MAP: Record<string, string> = {
  sector:            'businessSector',
  msme_size:         'enterpriseCategory',
  annual_turnover:   'annualTurnoverLakhs',
  total_employees:   'total_employees',
  business_type:     'businessType',
  business_stage:    'businessStage',
  benefit_focus:     'benefitFocus',
  state:             'state',
  gender:            'gender',
  caste:             'caste',
  age:               'age',
  differently_abled: 'differently_abled',
  bpl:               'bpl',
  minority:          'minority',
};

function getMissingFields(rawProfile: Record<string, any>): MissingField[] {
  return REQUIRED_SEARCH_FIELDS.filter((f) => {
    const getter = PROFILE_SOURCE_MAP[f.key];
    if (!getter) return false;
    const val = getter(rawProfile);
    if (val === undefined || val === null || val === '') return true;
    // annual_turnover: 0 lakhs means not set
    if (f.key === 'annual_turnover' && !isNaN(parseFloat(val)) && parseFloat(val) === 0) return true;
    // total_employees: 0 means not set
    if (f.key === 'total_employees' && !isNaN(parseInt(val)) && parseInt(val) === 0) return true;
    // benefit_focus 'any' is valid — not missing
    if (f.key === 'benefit_focus' && val === 'any') return false;
    // sector must map to a valid backend SECTOR_MAP key — 'other' or unmapped values are missing
    if (f.key === 'sector') {
      const mapped = SECTOR_NORMALISE_MAP[val];
      const VALID_BACKEND_SECTORS = ['manufacturing','agro','textile','handicraft','fisheries',
        'technology','construction','retail','services','finance',
        'education','healthcare','transport','ecommerce','energy','hospitality','media'];
      return !mapped || !VALID_BACKEND_SECTORS.includes(mapped);
    }
    // business_type 'other' from GST data is too vague — ask user to clarify
    if (f.key === 'business_type' && val === 'other') return true;
    // boolean fields: 'true' or 'false' are both valid answers — not missing
    if (['differently_abled', 'bpl', 'minority'].includes(f.key)) return false;
    return false;
  });
}

// ─── Client-side eligibility filter ──────────────────────────────────────────
// The upstream MyScheme API always returns schemes tagged caste:"All" alongside
// the requested caste, so SC/ST-exclusive schemes leak through for General users.
// We strip them out here after receiving results.

const SC_ST_EXCLUSIVE_RE = [
  /scheduled caste/i, /scheduled tribe/i,
  /\bsc\s*\/?\s*st\b/i, /\bdalit\b/i, /\btribal\b/i, /\badivasi\b/i,
  /\bsafai karamchari\b/i,
];
const WOMEN_EXCLUSIVE_RE = [
  /\bwomen entrepreneur/i, /\bwomen.?led\b/i, /\bwomen.?owned\b/i,
  /\bmahila\b/i, /\bstree shakti\b/i,
];

function filterByEligibility(schemes: Scheme[], payload: Record<string, any>): Scheme[] {
  const caste  = String(payload.caste  || '').toLowerCase();
  const gender = String(payload.gender || '').toLowerCase();

  return schemes.filter((s) => {
    const text = `${s.schemeName} ${s.briefDescription} ${(s.tags || []).join(' ')}`;

    // General users: exclude schemes whose name/desc/tags explicitly say SC/ST
    if (caste === 'general' && SC_ST_EXCLUSIVE_RE.some((re) => re.test(text))) return false;

    // Male users: exclude women-exclusive schemes
    if (gender === 'male' && WOMEN_EXCLUSIVE_RE.some((re) => re.test(text))) return false;

    return true;
  });
}
// ─────────────────────────────────────────────────────────────────────────────

function transformSchemeItem(item: any): Scheme {
  const fields = item.fields || {};
  const slug = (
    fields.slug ||
    fields.schemeId ||
    fields.id ||
    item.id ||
    item._id ||
    item.schemeId ||
    fields.schemeName?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 80)
  ) || '';
  return {
    id: slug || item.id || item._id || '',
    slug,
    schemeName: fields.schemeName || fields.name || '',
    nodalMinistryName: fields.nodalMinistryName || fields.ministry || '',
    briefDescription: fields.briefDescription || fields.description || '',
    schemeLevel: fields.level || fields.schemeLevel || '',
    tags: fields.tags || [],
    schemeCloseDate: fields.schemeCloseDate || null,
    schemeCategory: fields.schemeCategory || [],
    schemeFor: fields.schemeFor || '',
    beneficiaryState: fields.beneficiaryState || [],
    matchReason: fields.matchReason || '',
  };
}

const SchemesContext = createContext<SchemesContextType | undefined>(undefined);

export const SchemesProvider = ({ children }: { children: ReactNode }) => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [savedSchemes, setSavedSchemes] = useState<Scheme[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFiltersState] = useState({
    category: [] as string[],
    ministry: [] as string[],
    state: [] as string[],
    level: [] as string[],
    type: [] as string[],
    minInvestment: 0,
    maxInvestment: 10000000,
  });
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    ministries: [] as string[],
    states: [] as string[],
    levels: [] as string[],
    types: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [token, setToken] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [pendingRawProfile, setPendingRawProfile] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    setToken(sessionStorage.getItem('msme_auth_token'));
  }, []);

  // Derive filter options from fetched schemes
  useEffect(() => {
    if (schemes.length === 0) return;

    const categories = new Set<string>();
    const ministries = new Set<string>();
    const states = new Set<string>();
    const levels = new Set<string>();
    const types = new Set<string>();

    schemes.forEach((scheme) => {
      scheme.schemeCategory?.forEach((cat) => categories.add(cat));
      if (scheme.nodalMinistryName) ministries.add(scheme.nodalMinistryName);
      scheme.beneficiaryState?.forEach((state) => states.add(state));
      if (scheme.schemeLevel) levels.add(scheme.schemeLevel);
      scheme.tags?.forEach((tag) => types.add(tag));
    });

    setFilterOptions({
      categories: Array.from(categories).sort(),
      ministries: Array.from(ministries).sort(),
      states: Array.from(states).sort(),
      levels: Array.from(levels).sort(),
      types: Array.from(types).sort(),
    });
  }, [schemes]);

  const setSelectedFilters = (filters: Partial<typeof selectedFilters>) => {
    setSelectedFiltersState((prev) => ({ ...prev, ...filters }));
    setCurrentPage(1);
  };

  const fetchAndSetSchemes = async (payload: Record<string, any>, authToken: string) => {
    setIsLoading(true);
    try {
      console.log('[Schemes] Search payload:', JSON.stringify(payload, null, 2));
      const response = await fetch(`${API_BASE_URL}/api/v1/schemes/search/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('[Schemes] Raw API response:', JSON.stringify(data, null, 2));
      const rawItems =
        data?.data?.hits?.items ||
        data?.hits?.items ||
        data?.data?.items ||
        data?.items ||
        [];
      console.log('[Schemes] Extracted items count:', rawItems.length);
      const transformed = rawItems.map(transformSchemeItem);

      // Post-filter: remove SC/ST-exclusive schemes for General users, women-only for males
      const filtered = filterByEligibility(transformed, payload);
      console.log(`[Schemes] After eligibility filter: ${filtered.length} (removed ${transformed.length - filtered.length})`);
      setSchemes(filtered);

      if (rawItems.length > 0) {
        // Save raw API items (fields-nested shape) — don't block UI on failure
        fetch(`${API_BASE_URL}/api/v1/user-schemes/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ schemes: rawItems }),
        }).catch((err) => console.warn('[Schemes] Save to DB failed (non-fatal):', err));
      }
    } catch (err) {
      console.error('Error searching schemes:', err);
      setSchemes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchemesForDashboard = async () => {
    const authToken = sessionStorage.getItem('msme_auth_token');
    if (!authToken) return;

    setIsLoading(true);
    try {
      // Always fetch the latest profile first to check for missing fields
      const mobile = sessionStorage.getItem('msme_mobile');
      if (!mobile) {
        setIsLoading(false);
        return;
      }

      const profileRes = await fetch(`${API_BASE_URL}/api/msme-auth/profile/${mobile}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const profileData = await profileRes.json();
      const profile = profileData?.user || {};

      // Check for missing fields BEFORE loading any cached schemes
      const missing = getMissingFields(profile);
      if (missing.length > 0) {
        setPendingRawProfile(profile);
        setMissingFields(missing);
        setShowMissingFieldsModal(true);
        setIsLoading(false);
        return;
      }

      // Profile is complete — try to load cached schemes first
      const checkRes = await fetch(`${API_BASE_URL}/api/v1/user-schemes/check`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const checkData = await checkRes.json();

      if (checkData.success && checkData.hasSchemes) {
        const myRes = await fetch(`${API_BASE_URL}/api/v1/user-schemes/my-schemes`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        const myData = await myRes.json();
        if (myData.success && myData.data?.items?.length > 0) {
          const cached = myData.data.items.map(transformSchemeItem);
          const payload = buildSearchPayload(profile);
          setSchemes(filterByEligibility(cached, payload));
          setIsLoading(false);
          return;
        }
      }

      // No cached schemes — do a fresh search
      const payload = buildSearchPayload(profile);
      await fetchAndSetSchemes(payload, authToken);
    } catch (err) {
      console.error('Error loading dashboard schemes:', err);
      setIsLoading(false);
    }
  };

  const submitMissingFields = async (values: Record<string, any>) => {
    const authToken = sessionStorage.getItem('msme_auth_token');
    if (!authToken) return;

    // Build the DB payload — translate search-key names → DB column names
    const dbPayload: Record<string, any> = {};
    for (const [searchKey, val] of Object.entries(values)) {
      const dbKey = DB_SAVE_KEY_MAP[searchKey] ?? searchKey;
      if (searchKey === 'annual_turnover') {
        const TURNOVER_BUCKET_LAKHS: Record<string, number> = {
          under5L:      2.5,
          '5L_40L':     22.5,
          '40L_1Cr':    70,
          '1Cr_10Cr':   550,
          '10Cr_250Cr': 13000,
          above250Cr:   30000,
        };
        dbPayload['annualTurnoverLakhs'] = TURNOVER_BUCKET_LAKHS[val] ?? null;
      } else if (searchKey === 'total_employees') {
        const EMPLOYEE_BUCKET_NUM: Record<string, number> = {
          '1_5':     3,
          '6_25':    15,
          '26_100':  60,
          '101_500': 250,
          '501_plus': 600,
        };
        dbPayload['total_employees'] = EMPLOYEE_BUCKET_NUM[val] ?? null;
      } else if (['differently_abled', 'bpl', 'minority'].includes(searchKey)) {
        dbPayload[dbKey] = val === 'true';
      } else {
        dbPayload[dbKey] = val;
      }
    }

    console.log('[Schemes] Submitting missing fields to backend:', JSON.stringify(dbPayload, null, 2));

    // Save to DB — await so the profile is persisted before we close the modal.
    // On next page load getMissingFields will read the updated profile and not show the modal again.
    try {
      const saveRes = await fetch(`${API_BASE_URL}/api/msme-auth/profile/eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(dbPayload),
      });
      
      const saveData = await saveRes.json();
      console.log('[Schemes] Backend save response:', saveData);
      
      if (!saveRes.ok) {
        console.error('[Schemes] Failed to save eligibility fields, status:', saveRes.status, 'response:', saveData);
        throw new Error(saveData?.message || 'Failed to save profile');
      }
      
      console.log('[Schemes] Profile saved successfully');
    } catch (err) {
      console.error('[Schemes] Failed to save missing profile fields:', err);
      throw err; // Re-throw so the modal shows an error instead of closing
    }

    // Merge submitted values (using search-key names) into the raw profile so
    // buildSearchPayload can correctly derive all fields from a single source of truth.
    const mergedProfile = { ...(pendingRawProfile || {}), ...values };
    const finalPayload = buildSearchPayload(mergedProfile);

    setShowMissingFieldsModal(false);
    setMissingFields([]);
    setPendingRawProfile(null);
    await fetchAndSetSchemes(finalPayload, authToken);
  };

  const dismissMissingFieldsModal = () => {
    setShowMissingFieldsModal(false);
  };

  const getSchemeDetailBySlug = async (slug: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/schemes/${slug}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const json = await response.json();
      console.log('[Schemes] Scheme detail API response for slug', slug, ':', JSON.stringify(json, null, 2));
      // API wraps in { status, data: { _id, en: { ... } } }
      return json?.data || json;
    } catch (err) {
      console.error('Error fetching scheme detail:', err);
      return null;
    }
  };

  const getSchemeDocuments = async (mongoId: string): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/schemes/${mongoId}/documents`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const json = await response.json();
      const data = json?.data || json;
      // Prefer markdown version, split into list items
      const md = data?.en?.documentsRequired_md;
      if (md && typeof md === 'string') {
        return md
          .replace(/<br\s*\/?>/gi, '\n')
          .split('\n')
          .map((line: string) =>
            line
              .replace(/^#{1,6}\s*/g, '')
              .replace(/^\s*[\d]+\.\s*/, '')
              .replace(/^[\s•\-\*]+/, '')
              .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
              .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .trim()
          )
          .filter((l: string) => l.length > 2);
      }
      // Fallback: extract text from nested document structure
      const docsArr = data?.en?.documents_required || [];
      const extracted: string[] = [];
      const extractText = (node: any): void => {
        if (typeof node === 'string') { extracted.push(node); return; }
        if (node?.text) { extracted.push(node.text); return; }
        if (node?.children) { node.children.forEach(extractText); }
      };
      docsArr.forEach(extractText);
      return extracted.filter((t: string) => t.trim().length > 0);
    } catch (err) {
      console.error('Error fetching scheme documents:', err);
      return [];
    }
  };

  const getSchemeFaqs = async (mongoId: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/schemes/${mongoId}/faqs`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const json = await response.json();
      const data = json?.data || json;
      const faqs = data?.en?.faqs || [];
      // Map to { question, answer } using answer_md (string) instead of answer (object array)
      const stripMd = (text: string) => text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
        .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      return faqs.map((faq: any) => ({
        question: faq.question || '',
        answer: stripMd(faq.answer_md || (typeof faq.answer === 'string' ? faq.answer : '')),
      }));
    } catch (err) {
      console.error('Error fetching scheme FAQs:', err);
      return [];
    }
  };

  const getSchemeApplicationProcess = async (mongoId: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/schemes/${mongoId}/applicationchannel`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const json = await response.json();
      const data = json?.data || json;
      if (!data) return null;
      // Extract markdown or text content
      const md = data?.en?.applicationProcess_md || data?.en?.howToApply_md;
      if (md && typeof md === 'string') return md;
      // Fallback: try to extract text from nested structure
      const process = data?.en?.applicationProcess || data?.en?.howToApply;
      if (typeof process === 'string') return process;
      if (Array.isArray(process)) {
        const texts: string[] = [];
        const extractText = (node: any): void => {
          if (typeof node === 'string') { texts.push(node); return; }
          if (node?.text) { texts.push(node.text); return; }
          if (node?.children) { node.children.forEach(extractText); }
        };
        process.forEach(extractText);
        return texts.join('\n') || null;
      }
      return null;
    } catch (err) {
      console.error('Error fetching scheme application process:', err);
      return null;
    }
  };

  const fetchSchemeBySlug = async (slug: string): Promise<Scheme | null> => {
    const authToken = sessionStorage.getItem('msme_auth_token') || token;
    if (!authToken) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/schemes/${slug}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await response.json();
      console.log('[Schemes] Fetch scheme by slug API response:', JSON.stringify(data, null, 2));
      if (!response.ok) {
        console.error('Error fetching scheme by slug:', data);
        // Don't retry on 429 (rate limit) or 5xx errors
        if (response.status === 429 || response.status >= 500) {
          console.warn('[Schemes] Skipping retry due to rate limit or server error');
        }
        return null;
      }
      // The detail endpoint returns data.en.basicDetails and data.en.schemeContent
      const apiData = data?.data;
      if (!apiData) return null;

      const basicDetails = apiData.en?.basicDetails || {};
      const schemeContent = apiData.en?.schemeContent || {};

      // Transform to match the search result structure (with fields nested)
      const item = {
        id: slug, // Use the slug as id for lookup
        _id: apiData._id,
        fields: {
          slug: slug,
          schemeName: basicDetails.schemeName || basicDetails.schemeShortTitle,
          schemeShortTitle: basicDetails.schemeShortTitle,
          nodalMinistryName: basicDetails.nodalMinistryName?.label || (typeof basicDetails.nodalMinistryName === 'string' ? basicDetails.nodalMinistryName : ''),
          briefDescription: schemeContent.briefDescription || '',
          detailedDescription: schemeContent.detailedDescription_md || '',
          benefits: schemeContent.benefits_md || '',
          exclusions: schemeContent.exclusions_md || '',
          level: basicDetails.level?.label || (typeof basicDetails.level === 'string' ? basicDetails.level : ''),
          tags: basicDetails.tags || [],
          schemeCategory: basicDetails.schemeCategory?.map((c: any) => typeof c === 'string' ? c : c.label) || [],
          schemeSubCategory: basicDetails.schemeSubCategory?.map((c: any) => typeof c === 'string' ? c : c.label) || [],
          schemeFor: basicDetails.schemeFor || '',
          schemeType: basicDetails.schemeType?.label || (typeof basicDetails.schemeType === 'string' ? basicDetails.schemeType : ''),
          implementingAgency: basicDetails.implementingAgency || '',
          references: schemeContent.references || [],
          schemeImageUrl: schemeContent.schemeImageUrl || '',
        },
      };

      const transformed = transformSchemeItem(item);
      setSchemes((prev) => [...prev, transformed]);
      return transformed;
    } catch (err) {
      console.error('Error fetching scheme by slug:', err);
      return null;
    }
  };

  const refreshSchemes = async () => {
    const authToken = sessionStorage.getItem('msme_auth_token') || token;
    if (!authToken) return;

    setIsLoading(true);
    try {
      // Fetch user profile to build search payload
      const mobile = sessionStorage.getItem('msme_mobile');
      if (!mobile) return;

      const profileRes = await fetch(`${API_BASE_URL}/api/msme-auth/profile/${mobile}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const profileData = await profileRes.json();
      const profile = profileData?.user || {};

      console.log('[RefreshSchemes] Raw profile from DB:', JSON.stringify({
        businessSector:    profile.businessSector,
        businessType:      profile.businessType,
        enterpriseCategory: profile.enterpriseCategory,
        annualTurnoverLakhs: profile.annualTurnoverLakhs,
        total_employees:   profile.total_employees,
        businessStage:     profile.businessStage,
        benefitFocus:      profile.benefitFocus,
        state:             profile.state || profile.principalState,
        gender:            profile.gender,
        caste:             profile.caste,
        socialCategory:    profile.socialCategory,
        age:               profile.age,
        differently_abled: profile.differently_abled,
        bpl:               profile.bpl,
        minority:          profile.minority,
      }, null, 2));

      const missing = getMissingFields(profile);
      console.log('[RefreshSchemes] Missing fields:', missing.map(f => f.key));

      if (missing.length > 0) {
        setPendingRawProfile(profile);
        setMissingFields(missing);
        setShowMissingFieldsModal(true);
        setIsLoading(false);
        return;
      }

      const payload = buildSearchPayload(profile);
      console.log('[RefreshSchemes] Final search payload:', JSON.stringify(payload, null, 2));
      await fetchAndSetSchemes(payload, authToken);
    } catch (err) {
      console.error('Error refreshing schemes:', err);
      setSchemes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchSchemes = async (profile?: any) => {
    const authToken = sessionStorage.getItem('msme_auth_token') || token;
    if (!authToken) return;
    const payload = profile ? buildSearchPayload(profile) : { from: 0, size: 12 };
    await fetchAndSetSchemes(payload, authToken);
  };

  const getSavedSchemes = async () => {
    const authToken = sessionStorage.getItem('msme_auth_token') || token;
    if (!authToken) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/user-schemes/bookmarks`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      const data = await response.json();

      if (data.success && data.data?.items) {
        setSavedSchemes(data.data.items.map(transformSchemeItem));
      }
    } catch (err) {
      console.error('Error fetching bookmarked schemes:', err);
      setSavedSchemes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveScheme = async (schemesToSave: Scheme[]): Promise<boolean> => {
    const authToken = sessionStorage.getItem('msme_auth_token') || token;
    if (!authToken) return false;
    try {
      // Bookmark each scheme individually
      const results = await Promise.all(
        schemesToSave.map((s) =>
          fetch(`${API_BASE_URL}/api/v1/user-schemes/bookmark`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              slug: s.slug || s.id,
              scheme: {
                fields: {
                  slug: s.slug,
                  schemeName: s.schemeName,
                  nodalMinistryName: s.nodalMinistryName,
                  briefDescription: s.briefDescription,
                  level: s.schemeLevel,
                  tags: s.tags || [],
                  schemeCategory: s.schemeCategory || [],
                  schemeFor: s.schemeFor || '',
                  beneficiaryState: s.beneficiaryState || [],
                  schemeCloseDate: s.schemeCloseDate || null,
                },
              },
            }),
          }).then((r) => r.json())
        )
      );

      const allSuccess = results.every((r) => r.success);
      if (allSuccess) {
        setSavedSchemes((prev) => [...prev, ...schemesToSave]);
      }
      return allSuccess;
    } catch (err) {
      console.error('Error bookmarking schemes:', err);
      return false;
    }
  };

  const removeSavedScheme = async (schemeId: string) => {
    const authToken = sessionStorage.getItem('msme_auth_token') || token;
    setSavedSchemes((prev) => prev.filter((s) => s.id !== schemeId));
    if (!authToken) return;
    try {
      await fetch(`${API_BASE_URL}/api/v1/user-schemes/unbookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ slug: schemeId }),
      });
    } catch (err) {
      console.error('Error unbookmarking scheme:', err);
    }
  };

  const getSchemeById = (id: string): Scheme | undefined => {
    return schemes.find((s) => s.id === id);
  };

  const getTotalPages = (): number => {
    return Math.ceil(getFilteredSchemes().length / itemsPerPage);
  };

  const getFilteredSchemes = (): Scheme[] => {
    return schemes.filter((scheme) => {
      const matchesSearch =
        searchQuery === '' ||
        scheme.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.briefDescription.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedFilters.category.length === 0 ||
        scheme.schemeCategory.some((cat) => selectedFilters.category.includes(cat));

      const matchesMinistry =
        selectedFilters.ministry.length === 0 ||
        selectedFilters.ministry.includes(scheme.nodalMinistryName);

      const matchesState =
        selectedFilters.state.length === 0 ||
        scheme.beneficiaryState.some((s) => selectedFilters.state.includes(s));

      const matchesLevel =
        selectedFilters.level.length === 0 ||
        selectedFilters.level.includes(scheme.schemeLevel);

      const matchesType =
        selectedFilters.type.length === 0 ||
        scheme.tags.some((tag) => selectedFilters.type.includes(tag));

      return matchesSearch && matchesCategory && matchesMinistry && matchesState && matchesLevel && matchesType;
    });
  };

  const value: SchemesContextType = {
    schemes,
    savedSchemes,
    searchQuery,
    selectedFilters,
    filterOptions,
    isLoading,
    currentPage,
    itemsPerPage,
    missingFields,
    showMissingFieldsModal,
    setSearchQuery,
    setSelectedFilters,
    loadSchemesForDashboard,
    searchSchemes,
    saveScheme,
    removeSavedScheme,
    getSavedSchemes,
    getSchemeById,
    setCurrentPage,
    getTotalPages,
    getFilteredSchemes,
    submitMissingFields,
    dismissMissingFieldsModal,
    getSchemeDetailBySlug,
    getSchemeDocuments,
    getSchemeFaqs,
    getSchemeApplicationProcess,
    fetchSchemeBySlug,
    refreshSchemes,
  };

  return (
    <SchemesContext.Provider value={value}>
      {children}
    </SchemesContext.Provider>
  );
};

export const useSchemes = () => {
  const context = useContext(SchemesContext);
  if (context === undefined) {
    throw new Error('useSchemes must be used within SchemesProvider');
  }
  return context;
};
