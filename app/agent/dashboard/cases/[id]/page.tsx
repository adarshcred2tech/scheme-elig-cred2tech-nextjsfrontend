'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAgentAuth } from '@/contexts/AgentAuthContext';
import { casesApi } from '@/lib/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ExternalLink,
  Upload,
  Loader2,
  Download,
  MessageSquare,
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
}

interface CaseDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  document_tag: string;
  uploaded_at: string;
}

interface DocumentRequest {
  id: string;
  document_name: string;
  description?: string;
  status: 'PENDING' | 'UPLOADED' | 'CANCELLED';
  requested_at: string;
  fulfilled_at?: string;
  file_url?: string;
  uploaded_file_name?: string;
}

const CASE_STATUSES = [
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DOCUMENTS_PENDING', label: 'Documents Pending' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ESCALATED', label: 'Escalated' },
];

const CONTACT_METHODS = ['Phone', 'Email', 'WhatsApp', 'In-Person', 'Video Call'];

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

export default function CaseDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { agent } = useAgentAuth();
  const caseId  = params.id as string;

  // ── Core state ──────────────────────────────────────────────────────────────
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // ── Documents state ──────────────────────────────────────────────────────────
  const [documents, setDocuments]     = useState<CaseDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // ── Document requests state ──────────────────────────────────────────────────
  const [docRequests, setDocRequests]         = useState<DocumentRequest[]>([]);
  const [reqsLoading, setReqsLoading]         = useState(false);

  // ── Upload-document dialog ───────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen]   = useState(false);
  const [uploadFile, setUploadFile]   = useState<File | null>(null);
  const [uploadTag, setUploadTag]     = useState('');
  const [uploading, setUploading]     = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  // ── Update-status dialog ────────────────────────────────────────────────────
  const [statusOpen, setStatusOpen]         = useState(false);
  const [newStatus, setNewStatus]           = useState('');
  const [statusNotes, setStatusNotes]       = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ── Contact-MSME dialog ──────────────────────────────────────────────────────
  const [contactOpen, setContactOpen]       = useState(false);
  const [contactMethod, setContactMethod]   = useState('Phone');
  const [contactNotes, setContactNotes]     = useState('');
  const [loggingContact, setLoggingContact] = useState(false);

  // ── Request-document dialog ──────────────────────────────────────────────────
  const [reqDocOpen, setReqDocOpen]           = useState(false);
  const [reqDocName, setReqDocName]           = useState('');
  const [reqDocDescription, setReqDocDescription] = useState('');
  const [requestingDoc, setRequestingDoc]     = useState(false);

  // ── Fetch case details ───────────────────────────────────────────────────────
  const fetchCaseDetails = async (showSpinner = false) => {
    if (!caseId || !agent) return;
    if (showSpinner) setIsLoading(true);
    try {
      const res = await casesApi.getAgentCaseDetails(caseId);
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
        setCaseDetails({ ...res.case, timeline });
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
    fetchCaseDetails(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, agent]);

  // ── Fetch documents — only needs caseId (JWT token is already in localStorage) ─
  const fetchDocuments = async () => {
    if (!caseId) return;
    setDocsLoading(true);
    try {
      const res = await casesApi.getCaseDocuments(caseId);
      if (res.success) setDocuments(res.documents || []);
    } catch (err: any) {
      console.error('Failed to load documents:', err.message || err);
    } finally {
      setDocsLoading(false);
    }
  };

  // ── Fetch document requests ──────────────────────────────────────────────────
  const fetchDocumentRequests = async () => {
    if (!caseId) return;
    setReqsLoading(true);
    try {
      const res = await casesApi.getDocumentRequests(caseId);
      if (res.success) setDocRequests(res.requests || []);
    } catch (err: any) {
      console.error('Failed to load document requests:', err.message || err);
    } finally {
      setReqsLoading(false);
    }
  };

  // Fire both independently of agent context — JWT in localStorage handles auth
  useEffect(() => {
    if (!caseId) return;
    fetchDocuments();
    fetchDocumentRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // ── Upload handler ───────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadFile) { toast.error('Please select a file'); return; }
    setUploading(true);
    try {
      await casesApi.uploadCaseDocument(caseId, uploadFile, uploadTag || undefined);
      toast.success(`"${uploadFile.name}" uploaded successfully`);
      setUploadOpen(false);
      setUploadFile(null);
      setUploadTag('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Status update handler ────────────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    if (!newStatus) { toast.error('Please select a status'); return; }
    setUpdatingStatus(true);
    try {
      const res = await casesApi.updateCaseStatus(caseId, newStatus, statusNotes || undefined);
      if (res.success) {
        toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
        setStatusOpen(false);
        setNewStatus('');
        setStatusNotes('');
        await fetchCaseDetails();
      } else {
        toast.error('Failed to update status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Contact log handler ──────────────────────────────────────────────────────
  const handleLogContact = async () => {
    setLoggingContact(true);
    try {
      const res = await casesApi.logContactMSME(caseId, contactMethod, contactNotes || undefined);
      if (res.success) {
        toast.success(`Contact via ${contactMethod} logged`);
        setContactOpen(false);
        setContactNotes('');
        setContactMethod('Phone');
        await fetchCaseDetails();
      } else {
        toast.error('Failed to log contact');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to log contact');
    } finally {
      setLoggingContact(false);
    }
  };

  // ── Request document handler ─────────────────────────────────────────────────
  const handleRequestDocument = async () => {
    if (!reqDocName.trim()) { toast.error('Please enter a document name'); return; }
    setRequestingDoc(true);
    try {
      const res = await casesApi.createDocumentRequest(caseId, reqDocName.trim(), reqDocDescription.trim() || undefined);
      if (res.success) {
        toast.success(`Document request for "${reqDocName}" sent to MSME`);
        setReqDocOpen(false);
        setReqDocName('');
        setReqDocDescription('');
        await fetchDocumentRequests();
        await fetchCaseDetails();
      } else {
        toast.error('Failed to send document request');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send document request');
    } finally {
      setRequestingDoc(false);
    }
  };

  // ── Loading / error states ───────────────────────────────────────────────────
  if (isLoading) {
    return (
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
    );
  }

  if (error || !caseDetails) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Case</h2>
          <p className="text-muted-foreground mb-4">{error || 'Case not found'}</p>
          <Link href="/agent/dashboard/cases">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Button>
          </Link>
        </div>
      </div>
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

  const pendingRequests = docRequests.filter((r) => r.status === 'PENDING').length;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/agent/dashboard/cases">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Case Details</h1>
          <p className="text-muted-foreground">View and manage case information</p>
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
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Assigned: {assignedAt ? new Date(assignedAt).toLocaleDateString() : 'N/A'}</span>
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
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                MSME Contact
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

      {/* Complete MSME Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Complete MSME Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold text-base mb-3">Business Information</h4>
              {[
                ['Legal Name',    msme.legalName],
                ['Trade Name',    msme.tradeName],
                ['Business Type', msme.bizType],
                ['Business Sector', msme.bizSector],
                ['Address',       msme.address],
                ['City',          msme.city],
                ['State',         msme.state],
                ['Pincode',       msme.pincode],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="ml-2 font-medium">{val || 'N/A'}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold text-base mb-3">Financial & Legal Details</h4>
              {[
                ['PAN Number',       msme.pan],
                ['GST Number',       msme.gst],
                ['Registration Date', msme.regDate
                  ? (() => { const d = new Date(msme.regDate!); return isNaN(d.getTime()) ? msme.regDate : d.toLocaleDateString(); })()
                  : undefined],
                ['Annual Turnover',  msme.turnover],
                ['Employee Count',   msme.employees],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="ml-2 font-medium">{val || 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheme Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Scheme Details
            </CardTitle>
            {caseDetails.schemeId && (
              <Link href={`/agent/dashboard/schemes/${caseDetails.schemeId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Full Details
                </Button>
              </Link>
            )}
          </div>
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

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Documents
              {documents.length > 0 && (
                <Badge variant="secondary" className="ml-1">{documents.length}</Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDocuments}
              disabled={docsLoading}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${docsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {docsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((n) => <Skeleton key={n} className="h-16 w-full" />)}
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.document_tag ? `${doc.document_tag} · ` : ''}
                        {formatBytes(doc.file_size)} ·{' '}
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {doc.file_url ? (
                    <a href={`http://localhost:3001${doc.file_url}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="gap-1 flex-shrink-0">
                        <Download className="h-4 w-4" />
                        View
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground flex-shrink-0">Stored</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No documents uploaded yet.</p>
              <p className="text-xs mt-1">Use the Upload Documents button below to add files.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Requests Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Document Requests
              {pendingRequests > 0 && (
                <Badge className="ml-1 bg-orange-100 text-orange-800">{pendingRequests} pending</Badge>
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
          ) : docRequests.length > 0 ? (
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
                  {req.status === 'UPLOADED' && req.file_url && (
                    <a href={`http://localhost:3001${req.file_url}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="gap-1 flex-shrink-0">
                        <Download className="h-4 w-4" />
                        View
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No document requests yet.</p>
              <p className="text-xs mt-1">Use "Request Document" to ask the MSME for specific files.</p>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* ─── Action Buttons ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Documents
        </Button>
        <Button variant="outline" onClick={() => setReqDocOpen(true)} className="gap-2">
          <FilePlus className="h-4 w-4" />
          Request Document
        </Button>
        <Button variant="outline" onClick={() => { setNewStatus(caseDetails.status); setStatusOpen(true); }} className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Update Status
        </Button>
        <Button variant="outline" onClick={() => setContactOpen(true)} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Contact MSME
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOG 1 — Upload Documents
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!uploading) { setUploadOpen(open); if (!open) { setUploadFile(null); setUploadTag(''); } } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Attach a file to this case. Accepted: PDF, JPEG, PNG, WebP, Word (.doc/.docx). Max 10 MB.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="file-upload">File</Label>
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
                    <p className="text-sm text-muted-foreground">Click to browse or drag & drop</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                className="hidden"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-tag">Document Label <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="doc-tag"
                placeholder="e.g. PAN Card, Bank Statement, GST Certificate…"
                value={uploadTag}
                onChange={(e) => setUploadTag(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!uploadFile || uploading} className="gap-2">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</> : <><Upload className="h-4 w-4" />Upload</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOG 2 — Request Document
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={reqDocOpen} onOpenChange={(open) => { if (!requestingDoc) { setReqDocOpen(open); if (!open) { setReqDocName(''); setReqDocDescription(''); } } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FilePlus className="h-5 w-5" />
              Request Document from MSME
            </DialogTitle>
            <DialogDescription>
              Send a request to the MSME to upload a specific document. They'll see it on their application tracking page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="req-doc-name">Document Name <span className="text-red-500">*</span></Label>
              <Input
                id="req-doc-name"
                placeholder="e.g. GST Certificate, Bank Statement, Aadhaar…"
                value={reqDocName}
                onChange={(e) => setReqDocName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-doc-desc">Description / Instructions <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="req-doc-desc"
                placeholder="Any specific instructions for the MSME about this document…"
                value={reqDocDescription}
                onChange={(e) => setReqDocDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReqDocOpen(false)} disabled={requestingDoc}>
              Cancel
            </Button>
            <Button onClick={handleRequestDocument} disabled={!reqDocName.trim() || requestingDoc} className="gap-2">
              {requestingDoc
                ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
                : <><FilePlus className="h-4 w-4" />Send Request</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOG 3 — Update Status
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={statusOpen} onOpenChange={(open) => { if (!updatingStatus) { setStatusOpen(open); if (!open) { setStatusNotes(''); } } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Update Case Status
            </DialogTitle>
            <DialogDescription>
              Current status:{' '}
              <Badge className={`${statusColor(caseDetails.status)} ml-1`}>
                {caseDetails.status.replace(/_/g, ' ')}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status…" />
                </SelectTrigger>
                <SelectContent>
                  {CASE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(s.value)}`}>
                          {s.label}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-notes">Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="status-notes"
                placeholder="Add a note about this status change…"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)} disabled={updatingStatus}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={!newStatus || updatingStatus} className="gap-2">
              {updatingStatus ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><CheckCircle className="h-4 w-4" />Update Status</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOG 4 — Contact MSME
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={contactOpen} onOpenChange={(open) => { if (!loggingContact) { setContactOpen(open); if (!open) { setContactNotes(''); setContactMethod('Phone'); } } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Contact MSME
            </DialogTitle>
            <DialogDescription>
              Contact details for <strong>{msme.name || businessName}</strong>. Log the interaction after reaching out.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              {msme.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <a href={`tel:${msme.phone}`} className="font-medium text-sm hover:underline text-primary">
                      {msme.phone}
                    </a>
                  </div>
                </div>
              )}
              {msme.email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${msme.email}`} className="font-medium text-sm hover:underline text-primary">
                      {msme.email}
                    </a>
                  </div>
                </div>
              )}
              {(msme.city || msme.state) && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-orange-700" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium text-sm">{[msme.city, msme.state].filter(Boolean).join(', ')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Contact Method</Label>
              <Select value={contactMethod} onValueChange={setContactMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-notes">Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="contact-notes"
                placeholder="Brief summary of the conversation…"
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setContactOpen(false)} disabled={loggingContact}>
              Close
            </Button>
            <Button onClick={handleLogContact} disabled={loggingContact} className="gap-2">
              {loggingContact
                ? <><Loader2 className="h-4 w-4 animate-spin" />Logging…</>
                : <><MessageSquare className="h-4 w-4" />Log Contact</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
