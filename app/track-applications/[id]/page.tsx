'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMsmeAuth } from '@/contexts/MsmeAuthContext';
import { casesApi } from '@/lib/services/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Package,
  Upload,
  Loader2,
  Download,
  RefreshCw,
  FilePlus,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CaseDetails {
  id: string;
  caseNumber: string;
  case_number?: string;
  businessName: string;
  msme_name?: string;
  msmeName?: string;
  status: string;
  scheme: string;
  scheme_name?: string;
  schemeName?: string;
  schemeId?: string;
  assignedAt: string;
  assigned_at?: string;
  priority: string;
  msme_email?: string;
  msmeEmail?: string;
  msme_mobile?: string;
  msmeMobile?: string;
  legal_name_of_business?: string;
  trade_name_of_business?: string;
  principal_city?: string;
  msmeCity?: string;
  principal_state?: string;
  msmeState?: string;
  business_type?: string;
  msmeBusinessType?: string;
  business_sector?: string;
  msmeBusinessSector?: string;
  pan_number?: string;
  gstin?: string;
  principal_address?: string;
  principal_pincode?: string;
  registration_date?: string;
  annual_turnover_range?: string;
  total_employees?: string;
  msmeDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    pincode?: string;
    city?: string;
    principal_city?: string;
    state?: string;
    principal_state?: string;
    pan?: string;
    pan_number?: string;
    gst?: string;
    legal_name_of_business?: string;
    trade_name_of_business?: string;
    business_type?: string;
    business_sector?: string;
    registration_date?: string;
    annual_turnover?: string;
    employee_count?: string;
  };
  schemeDetails?: {
    name?: string;
    description?: string;
    eligibility?: string[];
    benefits?: string[];
    documents_required?: string[];
  };
  timeline?: Array<{
    id: string;
    action: string;
    performedBy: string;
    performedByType?: string;
    timestamp: string;
    notes?: string;
    oldValue?: any;
    newValue?: any;
  }>;
  agent?: {
    fullName: string;
    email: string;
    phone: string;
  };
}

interface DocumentRequest {
  id: string;
  case_id: string;
  case_number?: string;
  scheme_name?: string;
  document_name: string;
  description?: string;
  status: 'PENDING' | 'UPLOADED' | 'CANCELLED';
  requested_at: string;
  fulfilled_at?: string;
  agent_name?: string;
  file_url?: string;
  uploaded_file_name?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAction(action: string): string {
  return action
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function statusColor(status: string) {
  switch (status) {
    case 'NEW':               return 'bg-blue-100 text-blue-800';
    case 'ASSIGNED':          return 'bg-purple-100 text-purple-800';
    case 'IN_PROGRESS':       return 'bg-yellow-100 text-yellow-800';
    case 'PENDING_DOCS':
    case 'DOCUMENTS_PENDING': return 'bg-orange-100 text-orange-800';
    case 'UNDER_REVIEW':      return 'bg-indigo-100 text-indigo-800';
    case 'APPROVED':          return 'bg-green-100 text-green-800';
    case 'CLOSED':            return 'bg-gray-100 text-gray-800';
    case 'REJECTED':          return 'bg-red-100 text-red-800';
    case 'ESCALATED':         return 'bg-pink-100 text-pink-800';
    default:                  return 'bg-gray-100 text-gray-800';
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'URGENT': return 'text-red-700 bg-red-50';
    case 'HIGH':   return 'text-red-600 bg-red-50';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
    case 'LOW':    return 'text-green-600 bg-green-50';
    default:       return 'text-gray-600 bg-gray-50';
  }
}

function requestStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':   return 'bg-orange-100 text-orange-800';
    case 'UPLOADED':  return 'bg-green-100 text-green-800';
    case 'CANCELLED': return 'bg-gray-100 text-gray-600';
    default:          return 'bg-gray-100 text-gray-800';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MsmeCaseDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { userId, authStep } = useMsmeAuth();
  const caseId  = params.id as string;

  console.log('MsmeCaseDetailPage mounted:', { caseId, userId });

  // ── Core state ──────────────────────────────────────────────────────────────
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // ── Document requests state ──────────────────────────────────────────────────
  const [docRequests, setDocRequests]         = useState<DocumentRequest[]>([]);
  const [reqsLoading, setReqsLoading]         = useState(false);

  // ── Upload-document dialog ───────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen]   = useState(false);
  const [uploadFile, setUploadFile]   = useState<File | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [activeRequest, setActiveRequest] = useState<DocumentRequest | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  // ── Fetch case details ───────────────────────────────────────────────────────
  const fetchCaseDetails = async (showSpinner = false) => {
    if (!caseId || !userId) return;
    if (showSpinner) setIsLoading(true);
    try {
      const res = await casesApi.getMsmeCaseDetails(caseId, parseInt(userId));
      if (res.success) {
        const timeline = (res.history ?? []).map((h: any) => ({
          id:              String(h.id),
          action:          h.action,
          performedBy:     h.performedBy ?? h.performed_by_name ?? 'System',
          performedByType: h.performedByType ?? h.performed_by_type,
          timestamp:       h.createdAt ?? h.created_at ?? h.timestamp,
          notes:           h.notes ?? undefined,
          oldValue:        h.oldValue ?? h.old_value,
          newValue:        h.newValue ?? h.new_value,
        }));
        setCaseDetails({ ...res.case, timeline, schemeDetails: res.schemeDetails });
      } else {
        setError('Failed to load case details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load case details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const msmeUserId = userId ? parseInt(userId) : null;
      console.log('Loading case details:', { caseId, msmeUserId });
      if (!msmeUserId) { setIsLoading(false); return; }
      await Promise.all([fetchCaseDetails(true), fetchDocumentRequests()]);
      setIsLoading(false);
    };
    if (authStep === 'authenticated') {
      load();
    }
  }, [authStep, userId, caseId]);

  // ── Fetch document requests ──────────────────────────────────────────────────
  const fetchDocumentRequests = async () => {
    if (!userId) return;
    setReqsLoading(true);
    try {
      const res = await casesApi.getMsmeDocumentRequests(parseInt(userId));
      if (res.success) {
        // Filter requests for this specific case
        const caseReqs = (res.requests || []).filter((r: DocumentRequest) => 
          String(r.case_id) === String(caseId)
        );
        setDocRequests(caseReqs);
      }
    } catch (err: any) {
      console.error('Failed to load document requests:', err.message || err);
    } finally {
      setReqsLoading(false);
    }
  };

  useEffect(() => {
    if (userId && caseId) {
      fetchDocumentRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, caseId]);

  // ── Upload handler ───────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadFile || !activeRequest || !userId) { 
      toast.error('Please select a file'); 
      return; 
    }
    setUploading(true);
    try {
      await casesApi.fulfillDocumentRequest(activeRequest.id, parseInt(userId), uploadFile);
      toast.success(`"${uploadFile.name}" uploaded successfully`);
      setUploadOpen(false);
      setUploadFile(null);
      setActiveRequest(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchDocumentRequests();
      await fetchCaseDetails();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const openUploadDialog = (req: DocumentRequest) => {
    setActiveRequest(req);
    setUploadFile(null);
    setUploadOpen(true);
  };

  // ── Loading / error states ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6">
            <Skeleton className="h-64" />
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !caseDetails) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Case</h2>
            <p className="text-muted-foreground mb-4">{error || 'Case not found'}</p>
            <Link href="/track-applications">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const caseNumber   = caseDetails.caseNumber || caseDetails.case_number;
  const businessName = caseDetails.businessName || caseDetails.msme_name || caseDetails.msmeName;
  const scheme       = caseDetails.scheme || caseDetails.scheme_name || caseDetails.schemeName || caseDetails.schemeId;
  const assignedAt   = caseDetails.assignedAt || caseDetails.assigned_at;

  const msme = {
    name:     caseDetails.msmeDetails?.name      || caseDetails.msmeName   || businessName,
    email:    caseDetails.msmeDetails?.email     || caseDetails.msme_email  || caseDetails.msmeEmail,
    phone:    caseDetails.msmeDetails?.phone     || caseDetails.msme_mobile || caseDetails.msmeMobile,
    address:  caseDetails.msmeDetails?.address   || caseDetails.principal_address,
    pincode:  caseDetails.msmeDetails?.pincode   || caseDetails.principal_pincode,
    city:     caseDetails.msmeDetails?.city      || caseDetails.msmeDetails?.principal_city  || caseDetails.principal_city  || caseDetails.msmeCity,
    state:    caseDetails.msmeDetails?.state     || caseDetails.msmeDetails?.principal_state || caseDetails.principal_state || caseDetails.msmeState,
    pan:      caseDetails.msmeDetails?.pan       || caseDetails.msmeDetails?.pan_number || caseDetails.pan_number,
    gst:      caseDetails.msmeDetails?.gst       || caseDetails.gstin,
    legalName:   caseDetails.msmeDetails?.legal_name_of_business  || caseDetails.legal_name_of_business,
    tradeName:   caseDetails.msmeDetails?.trade_name_of_business  || caseDetails.trade_name_of_business,
    bizType:     caseDetails.msmeDetails?.business_type   || caseDetails.business_type  || caseDetails.msmeBusinessType,
    bizSector:   caseDetails.msmeDetails?.business_sector || caseDetails.business_sector || caseDetails.msmeBusinessSector,
    regDate:     caseDetails.msmeDetails?.registration_date || caseDetails.registration_date,
    turnover:    caseDetails.msmeDetails?.annual_turnover  || caseDetails.annual_turnover_range,
    employees:   caseDetails.msmeDetails?.employee_count   || caseDetails.total_employees,
  };

  const pendingRequests = docRequests.filter((r) => r.status === 'PENDING');

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/track-applications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Case Details</h1>
            <p className="text-muted-foreground">View your application progress and timeline</p>
          </div>
        </div>

        {/* Case Overview */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div>
                <CardTitle className="text-2xl mb-2">{caseNumber}</CardTitle>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={statusColor(caseDetails.status)}>
                    {caseDetails.status.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="outline" className={priorityColor(caseDetails.priority)}>
                    {caseDetails.priority} Priority
                  </Badge>
                  {pendingRequests.length > 0 && (
                    <Badge className="bg-orange-100 text-orange-800">
                      {pendingRequests.length} pending document request{pendingRequests.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Applied: {assignedAt ? new Date(assignedAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Business Name:</span><span className="ml-2 font-medium">{businessName}</span></div>
                  <div><span className="text-muted-foreground">Scheme:</span><span className="ml-2 font-medium">{scheme}</span></div>
                  {caseDetails.agent && (
                    <div><span className="text-muted-foreground">Assigned Agent:</span><span className="ml-2 font-medium">{caseDetails.agent.fullName}</span></div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="space-y-2 text-sm">
                  {msme.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{msme.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{msme.phone || 'N/A'}</span>
                  </div>
                  {(msme.city || msme.state) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{[msme.city, msme.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Document Requests Banner */}
        {pendingRequests.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Inbox className="h-5 w-5" />
                Action Required: Document Requests
                <Badge className="bg-orange-200 text-orange-900 ml-1">
                  {pendingRequests.length} pending
                </Badge>
              </CardTitle>
              <CardDescription className="text-orange-700">
                Your assigned agent has requested the following documents. Please upload them to continue processing your application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-4 bg-white border border-orange-100 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <FilePlus className="h-5 w-5 text-orange-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{req.document_name}</p>
                        {req.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Requested by {req.agent_name || 'Agent'} · {new Date(req.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="gap-2 flex-shrink-0 bg-orange-600 hover:bg-orange-700"
                      onClick={() => openUploadDialog(req)}
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scheme Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Scheme Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-muted-foreground">Scheme Name:</span>
              <span className="ml-2 font-medium text-lg">{scheme}</span>
            </div>
            {caseDetails.schemeDetails?.description && (
              <div>
                <p className="text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{caseDetails.schemeDetails.description}</p>
              </div>
            )}
            {caseDetails.schemeDetails?.eligibility?.length ? (
              <div>
                <p className="text-muted-foreground font-medium mb-1">Eligibility Criteria</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {caseDetails.schemeDetails.eligibility.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ) : null}
            {caseDetails.schemeDetails?.documents_required?.length ? (
              <div>
                <p className="text-muted-foreground font-medium mb-1">Required Documents</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {caseDetails.schemeDetails.documents_required.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Document Requests History */}
        {docRequests.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  Document Requests
                  {pendingRequests.length > 0 && (
                    <Badge className="bg-orange-100 text-orange-800 ml-1">{pendingRequests.length} pending</Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchDocumentRequests}
                  disabled={reqsLoading}
                  className="gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${reqsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reqsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((n) => <Skeleton key={n} className="h-16 w-full" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {docRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-muted/20"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <FilePlus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-sm truncate">{req.document_name}</p>
                            <Badge className={`text-xs ${requestStatusBadge(req.status)}`}>
                              {req.status}
                            </Badge>
                          </div>
                          {req.description && (
                            <p className="text-xs text-muted-foreground truncate">{req.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Requested {new Date(req.requested_at).toLocaleDateString()}
                            {req.fulfilled_at ? ` · Fulfilled ${new Date(req.fulfilled_at).toLocaleDateString()}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {req.status === 'PENDING' && (
                          <Button size="sm" className="gap-2" onClick={() => openUploadDialog(req)}>
                            <Upload className="h-4 w-4" />
                            Upload
                          </Button>
                        )}
                        {req.status === 'UPLOADED' && req.file_url && (
                          <a href={`http://localhost:3001${req.file_url}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Download className="h-4 w-4" />
                              View
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Case Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caseDetails.timeline && caseDetails.timeline.length > 0 ? (
              <div className="space-y-4">
                {caseDetails.timeline.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                      {index < caseDetails.timeline!.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="font-medium text-sm">{formatAction(item.action)}</p>
                        <span className="text-xs text-muted-foreground ml-3 flex-shrink-0">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">by {item.performedBy || 'System'}</p>
                      {item.action === 'STATUS_CHANGED' && item.newValue && (
                        <div className="mt-1">
                          <span className="text-xs font-medium text-foreground">Status: </span>
                          <span className="text-xs text-primary font-medium">
                            {typeof item.newValue === 'object' 
                              ? (item.newValue.status || item.newValue.newStatus || JSON.stringify(item.newValue))
                              : String(item.newValue)}
                          </span>
                        </div>
                      )}
                      {item.notes && (
                        <p className="text-xs text-foreground/70 mt-1 bg-muted/40 rounded px-2 py-1">{item.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No timeline events yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Document Dialog */}
        <Dialog
          open={uploadOpen}
          onOpenChange={(open) => {
            if (!uploading) {
              setUploadOpen(open);
              if (!open) { setUploadFile(null); setActiveRequest(null); }
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Requested Document
              </DialogTitle>
              <DialogDescription>
                {activeRequest && (
                  <>
                    Your agent has requested: <strong>{activeRequest.document_name}</strong>.
                    {activeRequest.description && (
                      <span className="block mt-1 text-sm text-muted-foreground">{activeRequest.description}</span>
                    )}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="msme-file-upload">Select File</Label>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{uploadFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(uploadFile.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPEG, PNG, WebP, Word · Max 10 MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  id="msme-file-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="gap-2"
              >
                {uploading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</>
                  : <><Upload className="h-4 w-4" />Submit Document</>
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
