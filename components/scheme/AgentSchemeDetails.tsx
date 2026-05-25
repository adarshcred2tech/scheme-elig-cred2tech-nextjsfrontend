'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ChevronLeft, Check, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FullSchemeResponse {
  success: boolean;
  schemeDetail: any;
  documents: any;
  faqs: any;
  applicationChannel: any;
}

interface AgentSchemeDetailsProps {
  data: FullSchemeResponse;
}

type MdBlock = { type: 'heading'; text: string } | { type: 'item'; text: string };

// ─── Helpers (identical to SchemeDetails) ─────────────────────────────────────

function cleanMarkdown(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/&amp;quot;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseMarkdownBlocks(text: string): MdBlock[] {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .split('\n')
    .map((line: string): MdBlock | null => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      const isHeading =
        /^#{1,6}\s/.test(trimmed) ||
        /^\*{2,3}[^*\n]+\*{2,3}$/.test(trimmed) ||
        /^#{1,6}\s*\*{2,3}[^*\n]+\*{2,3}$/.test(trimmed);

      const clean = trimmed
        .replace(/^#{1,6}\s*/g, '')
        .replace(/^[\s•\-]+/, '')
        .replace(/^\d+\.\s+/, '')
        .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
        .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&amp;quot;/g, '"')
        .trim();

      if (!clean || clean.length < 2) return null;
      return { type: isHeading ? 'heading' : 'item', text: clean };
    })
    .filter((b): b is MdBlock => b !== null);
}

// ─── Parse sub-resource responses (mirrors SchemesContext logic) ───────────────

function parseDocuments(rawDocs: any): string[] {
  if (!rawDocs) return [];
  const data = rawDocs?.data || rawDocs;
  const md: string = data?.en?.documentsRequired_md || '';
  if (md) {
    return md
      .split('\n')
      .map((line: string) =>
        line
          .trim()
          .replace(/^[-•*]\s+/, '')
          .replace(/^\d+\.\s+/, '')
          .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
          .trim(),
      )
      .filter((t) => t.length > 2);
  }
  const arr: any[] = data?.en?.documentsRequired || data?.documentsRequired || [];
  const out: string[] = [];
  const extract = (item: any) => {
    if (typeof item === 'string') out.push(item);
    else if (item?.documentName) out.push(item.documentName);
    else if (item?.value) out.push(item.value);
    else if (Array.isArray(item)) item.forEach(extract);
  };
  arr.forEach(extract);
  return out.filter((t) => t.trim().length > 0);
}

function parseFaqs(rawFaqs: any): { question: string; answer: string }[] {
  if (!rawFaqs) return [];
  const data = rawFaqs?.data || rawFaqs;
  const faqs: any[] = data?.en?.faqs || [];
  const stripMd = (s: string) =>
    s
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
      .trim();
  return faqs
    .filter((f) => f.question)
    .map((f) => ({
      question: stripMd(f.question || ''),
      answer: stripMd(
        f.answer_md || (typeof f.answer === 'string' ? f.answer : ''),
      ),
    }));
}

function parseApplicationProcess(rawChannel: any): string | null {
  if (!rawChannel) return null;
  const data = rawChannel?.data || rawChannel;
  if (data?.en?.applicationProcess_md) return data.en.applicationProcess_md;
  if (data?.applicationProcess_md) return data.applicationProcess_md;
  if (data?.en?.steps) {
    const steps: any[] = data.en.steps;
    return steps
      .map((s, i) => `${i + 1}. ${s.stepDescription || s.step || s}`)
      .join('\n');
  }
  if (data?.en?.howToApply_md) return data.en.howToApply_md;
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgentSchemeDetails({ data }: AgentSchemeDetailsProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    description: true,
    eligibility: true,
    benefits: true,
    documents: true,
    process: true,
    faqs: true,
    references: true,
  });

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Unpack scheme detail ───────────────────────────────────────────────────
  const schemeDetail = data.schemeDetail;
  const basicDetails = schemeDetail?.en?.basicDetails || {};
  const schemeContent = schemeDetail?.en?.schemeContent || {};

  const schemeName =
    basicDetails?.schemeName || basicDetails?.schemeShortTitle || 'Scheme Details';
  const nodalMinistry =
    typeof basicDetails?.nodalMinistryName === 'string'
      ? basicDetails.nodalMinistryName
      : basicDetails?.nodalMinistryName?.label || '';
  const briefDescription = schemeContent?.briefDescription || '';
  const schemeLevel =
    typeof basicDetails?.level === 'string'
      ? basicDetails.level
      : basicDetails?.level?.label || '';
  const tags: string[] = basicDetails?.tags || [];
  const schemeCategory: string[] = (basicDetails?.schemeCategory || []).map(
    (c: any) => (typeof c === 'string' ? c : c.label),
  );
  const schemeFor: string = basicDetails?.schemeFor || '';
  const schemeType: string =
    typeof basicDetails?.schemeType === 'string'
      ? basicDetails.schemeType
      : basicDetails?.schemeType?.label || '';
  const implementingAgency: string = basicDetails?.implementingAgency || '';
  const officialUrl: string =
    basicDetails?.schemeUrl ||
    basicDetails?.officialWebsite ||
    schemeContent?.references?.[0]?.url ||
    '';
  const eligibilityList: string[] = basicDetails?.eligibility || [];
  const benefitsText: string = schemeContent?.benefits_md || schemeContent?.benefits || '';
  const benefitsBlocks = parseMarkdownBlocks(benefitsText);
  const references: { url: string; title: string }[] = schemeContent?.references || [];

  // ── Unpack sub-resources ───────────────────────────────────────────────────
  const documents = parseDocuments(data.documents);
  const faqs = parseFaqs(data.faqs);
  const applicationProcess = parseApplicationProcess(data.applicationChannel);

  // ── Section toggle button ──────────────────────────────────────────────────
  const SectionHeader = ({
    id,
    title,
    accentClass = 'bg-primary',
  }: {
    id: string;
    title: string;
    accentClass?: string;
  }) => (
    <button
      onClick={() => toggle(id)}
      className="flex items-center justify-between w-full text-2xl font-semibold text-foreground hover:text-primary transition-colors group"
    >
      <span className="flex items-center gap-2">
        <span className={`w-1 h-8 ${accentClass} rounded-full`} />
        {title}
      </span>
      <span
        className={`transition-transform ${expanded[id] ? 'rotate-180' : ''} text-muted-foreground group-hover:text-primary`}
      >
        <ChevronLeft className="w-6 h-6" />
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/agent/dashboard')}
          className="text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {schemeLevel && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  {schemeLevel}
                </Badge>
              )}
              {schemeCategory.slice(0, 2).map((cat) => (
                <Badge key={cat} variant="outline" className="border-border">
                  {cat}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{schemeName}</h1>
            {nodalMinistry && (
              <p className="text-lg text-muted-foreground">{nodalMinistry}</p>
            )}
          </div>
          {officialUrl && (
            <a href={officialUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2 shrink-0">
                <ExternalLink className="w-4 h-4" />
                Official Website
              </Button>
            </a>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            {briefDescription && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Overview</h2>
                <p className="text-foreground leading-relaxed text-lg">{briefDescription}</p>
                {tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-secondary/50 text-secondary-foreground border-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Detailed Description */}
            {schemeContent?.detailedDescription_md && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <SectionHeader id="description" title="Detailed Description" />
                {expanded.description && (
                  <div className="mt-6 text-foreground leading-relaxed whitespace-pre-line text-lg border-l-2 border-border pl-6">
                    {cleanMarkdown(schemeContent.detailedDescription_md)}
                  </div>
                )}
              </Card>
            )}

            {/* Eligibility */}
            {eligibilityList.length > 0 && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <SectionHeader id="eligibility" title="Eligibility Criteria" />
                {expanded.eligibility && (
                  <ul className="mt-6 space-y-4">
                    {eligibilityList.map((criterion, idx) => (
                      <li key={idx} className="flex gap-4 items-start group">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-foreground text-lg leading-relaxed">
                          {criterion}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {/* Benefits */}
            {benefitsBlocks.length > 0 && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <SectionHeader
                  id="benefits"
                  title="Key Benefits"
                  accentClass="bg-accent"
                />
                {expanded.benefits && (
                  <div className="mt-6 space-y-3">
                    {benefitsBlocks.map((block, idx) =>
                      block.type === 'heading' ? (
                        <h4
                          key={idx}
                          className="text-base font-semibold text-foreground mt-6 mb-2 pt-4 border-t border-border first:border-0 first:pt-0 first:mt-2"
                        >
                          {block.text}
                        </h4>
                      ) : (
                        <div key={idx} className="flex gap-4 items-start group">
                          <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                            <Check className="w-4 h-4" />
                          </div>
                          <span className="text-foreground text-lg leading-relaxed">
                            {block.text}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Documents Required */}
            {documents.length > 0 && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <SectionHeader id="documents" title="Documents Required" />
                {expanded.documents && (
                  <ul className="mt-6 space-y-3">
                    {documents.map((doc, idx) => (
                      <li key={idx} className="flex gap-4 items-start text-lg">
                        <span className="text-primary font-bold text-xl leading-none">•</span>
                        <span className="text-foreground">{doc}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {/* Application Process */}
            {applicationProcess && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <SectionHeader id="process" title="Application Process" />
                {expanded.process && (
                  <div className="mt-6 text-foreground leading-relaxed whitespace-pre-line text-lg border-l-2 border-border pl-6">
                    {typeof applicationProcess === 'string'
                      ? cleanMarkdown(applicationProcess)
                      : JSON.stringify(applicationProcess, null, 2)}
                  </div>
                )}
              </Card>
            )}

            {/* FAQs */}
            {faqs.length > 0 && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <SectionHeader id="faqs" title="Frequently Asked Questions" />
                {expanded.faqs && (
                  <div className="mt-6 space-y-6">
                    {faqs.map((faq, idx) => (
                      <div
                        key={idx}
                        className="space-y-3 pb-6 border-b border-border last:border-0 last:pb-0"
                      >
                        <p className="font-semibold text-foreground text-lg">
                          {cleanMarkdown(faq.question)}
                        </p>
                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                          {cleanMarkdown(faq.answer)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* References */}
            {references.length > 0 && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <SectionHeader id="references" title="Sources & References" />
                {expanded.references && (
                  <div className="mt-6 space-y-4">
                    {references.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors group p-3 rounded-lg hover:bg-primary/5"
                      >
                        <ExternalLink className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="text-lg">{ref.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            <Card className="p-6 bg-card border-border shadow-lg sticky top-24">
              <h3 className="font-semibold text-foreground mb-4 text-lg">Scheme Details</h3>
              <dl className="space-y-4 text-sm">
                {nodalMinistry && (
                  <div className="pb-4 border-b border-border">
                    <dt className="text-muted-foreground font-medium mb-1">Ministry</dt>
                    <dd className="text-foreground text-base">{nodalMinistry}</dd>
                  </div>
                )}
                {schemeCategory.length > 0 && (
                  <div className="pb-4 border-b border-border">
                    <dt className="text-muted-foreground font-medium mb-1">Category</dt>
                    <dd className="text-foreground text-base">
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {schemeCategory.map((cat) => (
                          <Badge
                            key={cat}
                            variant="secondary"
                            className="bg-secondary/50 text-secondary-foreground border-0"
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}
                {schemeLevel && (
                  <div className="pb-4 border-b border-border">
                    <dt className="text-muted-foreground font-medium mb-1">Level</dt>
                    <dd className="text-foreground text-base">{schemeLevel}</dd>
                  </div>
                )}
                {schemeType && (
                  <div className="pb-4 border-b border-border">
                    <dt className="text-muted-foreground font-medium mb-1">Scheme Type</dt>
                    <dd className="text-foreground text-base">{schemeType}</dd>
                  </div>
                )}
                {schemeFor && (
                  <div className="pb-4 border-b border-border">
                    <dt className="text-muted-foreground font-medium mb-1">Scheme For</dt>
                    <dd className="text-foreground text-base">{schemeFor}</dd>
                  </div>
                )}
                {implementingAgency && (
                  <div className="pb-4 border-b border-border last:border-0">
                    <dt className="text-muted-foreground font-medium mb-1">
                      Implementing Agency
                    </dt>
                    <dd className="text-foreground text-base">{implementingAgency}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Agent Note */}
            <Card className="p-6 bg-card border-border shadow-sm">
              <h3 className="font-semibold text-foreground mb-3 text-lg">Agent Notes</h3>
              <p className="text-muted-foreground text-sm">
                Review all eligibility criteria and required documents before assisting the
                client with their application.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
