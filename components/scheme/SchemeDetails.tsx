'use client';

import { useState, useEffect } from 'react';
import { useSchemes } from '@/contexts/SchemesContext';
import { useMsmeAuth } from '@/contexts/MsmeAuthContext';
import { Scheme } from '@/contexts/SchemesContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bookmark, BookmarkCheck, ExternalLink, ChevronLeft, Check, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { casesApi } from '@/lib/services/api';

export default function SchemeDetails({ scheme }: { scheme: Scheme }) {
  const { saveScheme, removeSavedScheme, savedSchemes, getSchemeDetailBySlug, getSchemeDocuments, getSchemeFaqs, getSchemeApplicationProcess } = useSchemes();
  const { userProfile, existingProfile, userId, authStep } = useMsmeAuth();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    benefits: true,
    eligibility: true,
    documents: true,
    process: true,
    faqs: true,
    description: true,
    references: true,
  });
  const [detailLoading, setDetailLoading] = useState(false);
  const [schemeDetail, setSchemeDetail] = useState<any>(null);
  const [documents, setDocuments] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [applicationProcess, setApplicationProcess] = useState<string | null>(null);
  const [detailFetched, setDetailFetched] = useState(false);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  // Eligibility check state
  const [eligibilitySummary, setEligibilitySummary] = useState<string | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityCached, setEligibilityCached] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [markingTask, setMarkingTask] = useState<string | null>(null);
  const [taskInputValues, setTaskInputValues] = useState<Record<string, string>>({});
  const [updatingField, setUpdatingField] = useState<string | null>(null);

  const isSaved = savedSchemes.some((s) => s.id === scheme.id);

  useEffect(() => {
    // Check if this scheme was already applied from localStorage
    const appliedState = localStorage.getItem(`applied_scheme_${scheme.id}`);
    console.log('Applied state from localStorage:', appliedState, 'for scheme:', scheme.id);
    if (appliedState === 'true') {
      setIsApplied(true);
    }

    // Also check with backend if user has already applied for this scheme
    const checkExistingApplication = async () => {
      try {
        const msmeUserId = userId ? parseInt(userId) : null;
        if (!msmeUserId) return;
        
        const response = await casesApi.getMsmeCases(msmeUserId);
        if (response.success && response.cases) {
          const existingApplication = response.cases.find(
            (caseItem: any) => caseItem.schemeId === scheme.id
          );
          if (existingApplication) {
            console.log('Found existing application for this scheme:', existingApplication);
            setIsApplied(true);
            localStorage.setItem(`applied_scheme_${scheme.id}`, 'true');
          }
        }
      } catch (error) {
        console.error('Error checking existing applications:', error);
      }
    };

    checkExistingApplication();
  }, [scheme.id]);

  useEffect(() => {
    if (!scheme.slug || detailFetched) return;
    setDetailFetched(true);
    setDetailLoading(true);
    const fetchDetails = async () => {
      try {
        const detail = await getSchemeDetailBySlug(scheme.slug);
        if (detail?._id) {
          setSchemeDetail(detail);
          const [docs, faqData, appProcess] = await Promise.all([
            getSchemeDocuments(detail._id),
            getSchemeFaqs(detail._id),
            getSchemeApplicationProcess(detail._id),
          ]);
          setDocuments(docs);
          setFaqs(faqData);
          setApplicationProcess(appProcess);
        }
      } catch (err) {
        console.error('Error fetching scheme details:', err);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetails();
  }, [scheme.slug, detailFetched]);

  // Eligibility check effect
  useEffect(() => {
    const fetchEligibility = async () => {
      if (!userId || !scheme.id) return;
      
      setEligibilityLoading(true);
      try {
        const response = await casesApi.checkEligibility(scheme.id, parseInt(userId), completedTasks);
        if (response.success) {
          setEligibilitySummary(response.summary);
          setEligibilityCached(response.cached || false);
          setRecommendations(response.recommendations || []);
          setCompletedTasks(response.completedTasks || []);
        }
      } catch (err: any) {
        console.error('Error fetching eligibility:', err);
        // Don't show error toast - eligibility check is optional
      } finally {
        setEligibilityLoading(false);
      }
    };

    fetchEligibility();
  }, [scheme.id, userId, completedTasks.length]);

  const handleMarkTaskDone = async (taskId: string) => {
    if (!userId || !scheme.id) return;
    setMarkingTask(taskId);
    try {
      const response = await casesApi.completeEligibilityTask(scheme.id, parseInt(userId), taskId);
      if (response.success) {
        setCompletedTasks(response.completedTasks || []);
        toast.success('Task marked as completed! Regenerating eligibility analysis...');
        // Force refresh eligibility with new completed tasks
        const eligibilityResponse = await casesApi.checkEligibility(scheme.id, parseInt(userId), response.completedTasks);
        if (eligibilityResponse.success) {
          setEligibilitySummary(eligibilityResponse.summary);
          setRecommendations(eligibilityResponse.recommendations || []);
          setEligibilityCached(eligibilityResponse.cached || false);
        }
      }
    } catch (err: any) {
      toast.error('Failed to mark task as done. Please try again.');
    } finally {
      setMarkingTask(null);
    }
  };

  const handleUpdateProfileField = async (taskId: string, field: string, value: any) => {
    if (!userId || !scheme.id || !value) return;
    setUpdatingField(taskId);
    try {
      // Update the profile field
      const updateResponse = await casesApi.updateProfileField(parseInt(userId), field, value);
      if (updateResponse.success) {
        toast.success(`${field} updated successfully! Regenerating eligibility analysis...`);
        // Mark task as done and refresh
        const completeResponse = await casesApi.completeEligibilityTask(scheme.id, parseInt(userId), taskId);
        if (completeResponse.success) {
          setCompletedTasks(completeResponse.completedTasks || []);
          // Refresh eligibility
          const eligibilityResponse = await casesApi.checkEligibility(scheme.id, parseInt(userId), completeResponse.completedTasks);
          if (eligibilityResponse.success) {
            setEligibilitySummary(eligibilityResponse.summary);
            setRecommendations(eligibilityResponse.recommendations || []);
            setEligibilityCached(eligibilityResponse.cached || false);
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update field. Please try again.');
    } finally {
      setUpdatingField(null);
      setTaskInputValues(prev => ({ ...prev, [taskId]: '' }));
    }
  };

  const handleSaveScheme = () => {
    if (isSaved) {
      removeSavedScheme(scheme.id);
      toast.success('Scheme removed from saved');
    } else {
      saveScheme([scheme]);
      toast.success('Scheme saved successfully');
    }
  };

  const handleApplyNow = async () => {
    console.log('Apply Now clicked');
    console.log('Auth Step:', authStep);
    console.log('User ID:', userId);
    console.log('Existing Profile:', existingProfile);
    console.log('User Profile:', userProfile);
    console.log('Scheme:', scheme);

    if (!userId && !existingProfile && !userProfile) {
      console.error('No user found - not authenticated');
      toast.error('Please login to apply for this scheme');
      return;
    }

    setIsCreatingCase(true);
    try {
      // Convert userId to number as required by backend
      const msmeUserId = userId ? parseInt(userId) : null;
      
      if (!msmeUserId) {
        console.error('Invalid user ID');
        toast.error('Invalid user information. Please login again.');
        return;
      }

      // Get business name from available data sources
      const businessName = existingProfile?.legalNameOfBusiness || 
                          existingProfile?.tradeNameOfBusiness || 
                          userProfile?.name || 
                          'Unknown Business';

      console.log('Creating case with data:', {
        msmeUserId,
        schemeId: scheme.id,
        schemeName: scheme.schemeName,
        applicationData: {
          businessName,
          description: scheme.briefDescription,
          existingProfile,
        },
      });

      const response = await casesApi.createCase({
        msmeUserId,
        schemeId: scheme.id,
        schemeName: scheme.schemeName,
        applicationData: {
          businessName,
          description: scheme.briefDescription,
          existingProfile,
        },
      });

      console.log('API response:', response);

      if (response.success || response.case) {
        setIsApplied(true);
        // Store applied state in localStorage
        localStorage.setItem(`applied_scheme_${scheme.id}`, 'true');
        toast.success('Your application is received and soon will be allotted to an agent. Please wait for 24 hours.', {
          duration: 5000,
        });
      } else {
        console.error('API response indicates failure:', response);
        toast.error('Failed to create case. Please try again.');
      }
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create case. Please try again.');
    } finally {
      setIsCreatingCase(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Extract rich data from schemeDetail (raw API response)
  const basicDetails = schemeDetail?.en?.basicDetails || schemeDetail?.en || {};
  const schemeContent = schemeDetail?.en?.schemeContent || schemeDetail?.schemeContent || {};

  // Official website URL — MyScheme API returns it under basicDetails.schemeUrl
  const officialWebsiteUrl: string =
    basicDetails?.schemeUrl ||
    basicDetails?.officialWebsite ||
    basicDetails?.websiteUrl ||
    schemeContent?.references?.[0]?.url ||
    '';

  // Strip markdown/HTML artifacts from plain text display
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/<br\s*\/?>/gi, '')           // <br> tags
      .replace(/^#{1,6}\s*/gm, '')           // headings: ## ### ####
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1') // bold/italic: **text**, ***text***
      .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')   // italic/bold: _text_, __text__
      .replace(/`([^`]+)`/g, '$1')           // inline code
      .replace(/&amp;quot;/g, '"')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')            // collapse excess newlines
      .trim();
  };

  type MdBlock = { type: 'heading'; text: string } | { type: 'item'; text: string };

  // Parse markdown text into typed blocks: headings (##### ***Heading***) and list items
  const parseMarkdownBlocks = (text: string): MdBlock[] => {
    return text
      .replace(/<br\s*\/?>/gi, '\n')
      .split('\n')
      .map((line: string): MdBlock | null => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Detect heading: line starts with # markers OR is purely ***text*** (no bullet prefix)
        const isHeading =
          /^#{1,6}\s/.test(trimmed) ||
          /^\*{2,3}[^*\n]+\*{2,3}$/.test(trimmed) ||
          /^#{1,6}\s*\*{2,3}[^*\n]+\*{2,3}$/.test(trimmed);

        const clean = trimmed
          .replace(/^#{1,6}\s*/g, '')          // strip leading hashes
          .replace(/^[\s•\-]+/, '')             // strip bullets (but NOT * to avoid stripping bold)
          .replace(/^\d+\.\s+/, '')             // numbered lists
          .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1') // bold/italic markers
          .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&amp;quot;/g, '"')
          .trim();

        if (!clean || clean.length < 2) return null;
        return { type: isHeading ? 'heading' : 'item', text: clean };
      })
      .filter((b): b is MdBlock => b !== null);
  };

  const benefitsText = schemeContent?.benefits_md || schemeContent?.benefits || '';
  const benefitsBlocks = parseMarkdownBlocks(benefitsText);
  // Keep flat list for backwards-compatible usage
  const benefitsList = benefitsBlocks.filter((b) => b.type === 'item').map((b) => b.text);
  
  const eligibilityList = basicDetails?.eligibility || [];
  
  const exclusionsText = schemeContent?.exclusions_md || schemeContent?.exclusions || '';
  const exclusionsList = parseMarkdownBlocks(exclusionsText);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {scheme.schemeLevel && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {scheme.schemeLevel}
                  </Badge>
                )}
                {scheme.schemeCategory?.length > 0 && scheme.schemeCategory.slice(0, 2).map((cat) => (
                  <Badge key={cat} variant="outline" className="border-border">
                    {cat}
                  </Badge>
                ))}
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{scheme.schemeName}</h1>
              <p className="text-lg text-muted-foreground">{scheme.nodalMinistryName}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:self-center">
              <Button
                onClick={handleSaveScheme}
                variant={isSaved ? 'default' : 'outline'}
                className={
                  isSaved
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border-2 border-border hover:border-primary hover:text-primary'
                }
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleApplyNow}
                disabled={isCreatingCase || isApplied}
              >
                {isApplied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Applied
                  </>
                ) : isCreatingCase ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Case...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Apply Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card className="p-8 bg-card border-border shadow-sm">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Overview</h2>
              <p className="text-foreground leading-relaxed text-lg">{scheme.briefDescription}</p>
              
              {scheme.tags?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {scheme.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-secondary/50 text-secondary-foreground border-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Eligibility Summary Card */}
            {(eligibilityLoading || eligibilitySummary) && (
              <Card className="p-8 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 border-primary/20 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      Your Eligibility Analysis
                      {eligibilityCached && (
                        <Badge variant="outline" className="text-xs">Cached</Badge>
                      )}
                    </h2>
                    <p className="text-sm text-muted-foreground">Personalized based on your business profile</p>
                  </div>
                </div>
                
                {eligibilityLoading ? (
                  <div className="flex items-center gap-3 text-muted-foreground py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Analyzing your eligibility for this scheme...</span>
                  </div>
                ) : eligibilitySummary ? (
                  <div className="prose prose-sm max-w-none mb-6">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {eligibilitySummary}
                    </div>
                  </div>
                ) : null}

                {/* Recommendations / Action Items */}
                {recommendations.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-primary/20">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      Action Items to Improve Eligibility
                    </h3>
                    <div className="space-y-3">
                      {recommendations.map((rec) => (
                        <div 
                          key={rec.id} 
                          className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                            rec.isCompleted 
                              ? 'bg-green-50 border-green-200 opacity-75' 
                              : 'bg-white/50 border-primary/10 hover:border-primary/30'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium ${rec.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {rec.title}
                              </h4>
                              <Badge 
                                variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className={`text-sm ${rec.isCompleted ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                              {rec.description}
                            </p>
                            
                            {/* Input field for missing values */}
                            {!rec.isCompleted && rec.inputType && rec.inputField && (
                              <div className="mt-3 flex items-center gap-2">
                                <input
                                  type={rec.inputType}
                                  placeholder={`Enter ${rec.title.toLowerCase()}...`}
                                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-white dark:bg-slate-800 border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  value={taskInputValues[rec.id] || ''}
                                  onChange={(e) => setTaskInputValues(prev => ({ ...prev, [rec.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUpdateProfileField(rec.id, rec.inputField, taskInputValues[rec.id]);
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateProfileField(rec.id, rec.inputField, taskInputValues[rec.id])}
                                  disabled={!taskInputValues[rec.id] || updatingField === rec.id}
                                >
                                  {updatingField === rec.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Submit'
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                          {!rec.isCompleted ? (
                            !rec.inputType && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                onClick={() => handleMarkTaskDone(rec.id)}
                                disabled={markingTask === rec.id}
                              >
                                {markingTask === rec.id ? (
                                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Marking...</>
                                ) : (
                                  <><Check className="w-4 h-4 mr-1" /> Mark Done</>
                                )}
                              </Button>
                            )
                          ) : (
                            <Badge variant="outline" className="shrink-0 bg-green-100 text-green-800 border-green-200">
                              <Check className="w-3 h-3 mr-1" /> Done
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Loading indicator for details */}
            {detailLoading && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <div className="flex items-center gap-3 text-muted-foreground justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-lg">Loading detailed information...</span>
                </div>
              </Card>
            )}

            {/* Detailed Description */}
            {schemeContent?.detailedDescription_md && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <button
                  onClick={() => toggleSection('description')}
                  className="flex items-center justify-between w-full text-2xl font-semibold text-foreground hover:text-primary transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1 h-8 bg-primary rounded-full"></span>
                    Detailed Description
                  </span>
                  <span className={`transition-transform ${expandedSections.description ? 'rotate-180' : ''} text-muted-foreground group-hover:text-primary`}>
                    <ChevronLeft className="w-6 h-6" />
                  </span>
                </button>
                {expandedSections.description && (
                  <div className="mt-6 text-foreground leading-relaxed whitespace-pre-line text-lg border-l-2 border-border pl-6">
                    {cleanMarkdown(schemeContent.detailedDescription_md)}
                  </div>
                )}
              </Card>
            )}

            {/* Eligibility */}
            {eligibilityList?.length > 0 && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <button
                  onClick={() => toggleSection('eligibility')}
                  className="flex items-center justify-between w-full text-2xl font-semibold text-foreground hover:text-primary transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1 h-8 bg-primary rounded-full"></span>
                    Eligibility Criteria
                  </span>
                  <span className={`transition-transform ${expandedSections.eligibility ? 'rotate-180' : ''} text-muted-foreground group-hover:text-primary`}>
                    <ChevronLeft className="w-6 h-6" />
                  </span>
                </button>
                {expandedSections.eligibility && (
                  <ul className="mt-6 space-y-4">
                    {eligibilityList.map((criterion: string, idx: number) => (
                      <li key={idx} className="flex gap-4 items-start group">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-foreground text-lg leading-relaxed">{criterion}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {/* Benefits */}
            {benefitsBlocks?.length > 0 && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <button
                  onClick={() => toggleSection('benefits')}
                  className="flex items-center justify-between w-full text-2xl font-semibold text-foreground hover:text-primary transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1 h-8 bg-accent rounded-full"></span>
                    Key Benefits
                  </span>
                  <span className={`transition-transform ${expandedSections.benefits ? 'rotate-180' : ''} text-muted-foreground group-hover:text-primary`}>
                    <ChevronLeft className="w-6 h-6" />
                  </span>
                </button>
                {expandedSections.benefits && (
                  <div className="mt-6 space-y-3">
                    {benefitsBlocks.map((block, idx) =>
                      block.type === 'heading' ? (
                        <h4 key={idx} className="text-base font-semibold text-foreground mt-6 mb-2 pt-4 border-t border-border first:border-0 first:pt-0 first:mt-2">
                          {block.text}
                        </h4>
                      ) : (
                        <div key={idx} className="flex gap-4 items-start group">
                          <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                            <Check className="w-4 h-4" />
                          </div>
                          <span className="text-foreground text-lg leading-relaxed">{block.text}</span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Documents Required */}
            {documents?.length > 0 && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <button
                  onClick={() => toggleSection('documents')}
                  className="flex items-center justify-between w-full text-2xl font-semibold text-foreground hover:text-primary transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1 h-8 bg-primary rounded-full"></span>
                    Documents Required
                  </span>
                  <span className={`transition-transform ${expandedSections.documents ? 'rotate-180' : ''} text-muted-foreground group-hover:text-primary`}>
                    <ChevronLeft className="w-6 h-6" />
                  </span>
                </button>
                {expandedSections.documents && (
                  <ul className="mt-6 space-y-3">
                    {documents.map((doc: string, idx: number) => (
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
                <button
                  onClick={() => toggleSection('process')}
                  className="flex items-center justify-between w-full text-2xl font-semibold text-foreground hover:text-primary transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1 h-8 bg-primary rounded-full"></span>
                    Application Process
                  </span>
                  <span className={`transition-transform ${expandedSections.process ? 'rotate-180' : ''} text-muted-foreground group-hover:text-primary`}>
                    <ChevronLeft className="w-6 h-6" />
                  </span>
                </button>
                {expandedSections.process && (
                  <div className="mt-6 text-foreground leading-relaxed whitespace-pre-line text-lg border-l-2 border-border pl-6">
                    {typeof applicationProcess === 'string' ? cleanMarkdown(applicationProcess) : JSON.stringify(applicationProcess, null, 2)}
                  </div>
                )}
              </Card>
            )}

            {/* FAQs */}
            {faqs?.length > 0 && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <button
                  onClick={() => toggleSection('faqs')}
                  className="flex items-center justify-between w-full text-2xl font-semibold text-foreground hover:text-primary transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1 h-8 bg-primary rounded-full"></span>
                    Frequently Asked Questions
                  </span>
                  <span className={`transition-transform ${expandedSections.faqs ? 'rotate-180' : ''} text-muted-foreground group-hover:text-primary`}>
                    <ChevronLeft className="w-6 h-6" />
                  </span>
                </button>
                {expandedSections.faqs && (
                  <div className="mt-6 space-y-6">
                    {faqs.map((faq: any, idx: number) => (
                      <div key={idx} className="space-y-3 pb-6 border-b border-border last:border-0 last:pb-0">
                        <p className="font-semibold text-foreground text-lg">{cleanMarkdown(faq.question)}</p>
                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{cleanMarkdown(faq.answer)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* References */}
            {schemeContent?.references?.length > 0 && (
              <Card className="p-8 bg-card border-border shadow-sm">
                <button
                  onClick={() => toggleSection('references')}
                  className="flex items-center justify-between w-full text-2xl font-semibold text-foreground hover:text-primary transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1 h-8 bg-primary rounded-full"></span>
                    Sources & References
                  </span>
                  <span className={`transition-transform ${expandedSections.references ? 'rotate-180' : ''} text-muted-foreground group-hover:text-primary`}>
                    <ChevronLeft className="w-6 h-6" />
                  </span>
                </button>
                {expandedSections.references && (
                  <div className="mt-6 space-y-4">
                    {schemeContent.references.map((ref: any, idx: number) => (
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card className="p-6 bg-card border-border shadow-lg sticky top-24">
              <h3 className="font-semibold text-foreground mb-4 text-lg">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-medium"
                  onClick={handleApplyNow}
                  disabled={isCreatingCase || isApplied}
                >
                  {isApplied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Applied
                    </>
                  ) : isCreatingCase ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Case...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Apply Now
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSaveScheme}
                  variant={isSaved ? 'secondary' : 'outline'}
                  className="w-full h-12 text-base font-medium"
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save Scheme
                    </>
                  )}
                </Button>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-5 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2 font-medium">Application Support</p>
                <p className="text-base font-semibold text-foreground mb-3">
                  Need help with your application?
                </p>
                <Button
                  variant="link"
                  className="text-primary hover:text-primary/90 p-0 h-auto font-medium"
                >
                  Get Free Consulting →
                </Button>
              </div>
            </Card>

            {/* Scheme Details Card */}
            <Card className="p-6 bg-card border-border shadow-sm">
              <h3 className="font-semibold text-foreground mb-4 text-lg">Scheme Details</h3>
              <dl className="space-y-4 text-sm">
                <div className="pb-4 border-b border-border">
                  <dt className="text-muted-foreground font-medium mb-1">Ministry</dt>
                  <dd className="text-foreground text-base">{scheme.nodalMinistryName}</dd>
                </div>
                {scheme.schemeCategory?.length > 0 && (
                  <div className="pb-4 border-b border-border">
                    <dt className="text-muted-foreground font-medium mb-1">Category</dt>
                    <dd className="text-foreground text-base">
                      <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground border-0">
                        {scheme.schemeCategory[0]}
                      </Badge>
                    </dd>
                  </div>
                )}
                {scheme.schemeLevel && (
                  <div className="pb-4 border-b border-border">
                    <dt className="text-muted-foreground font-medium mb-1">Level</dt>
                    <dd className="text-foreground text-base">{scheme.schemeLevel}</dd>
                  </div>
                )}
                {scheme.schemeFor && (
                  <div className="pb-4 border-b border-border last:border-0">
                    <dt className="text-muted-foreground font-medium mb-1">Scheme For</dt>
                    <dd className="text-foreground text-base">{scheme.schemeFor}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Contact Card */}
            <Card className="p-6 bg-card border-border shadow-sm">
              <h3 className="font-semibold text-foreground mb-4 text-lg">Need Assistance?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Our team is here to help you navigate the application process.
              </p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
