'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
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
  RefreshCw,
  FilePlus,
  Inbox,
  MessageSquare,
} from 'lucide-react';

interface CaseDetails {
  id: string;
  caseNumber: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  msmeName: string;
  msmeBusinessName: string;
  msmePhone: string;
  msmeEmail: string;
  msmeAddress: string;
  schemeId: string;
  schemeName: string;
  assignedAgentId?: number;
  assignedAgentName?: string;
  assignedAgentEmail?: string;
  assignedAgentPhone?: string;
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
  schemeDetails?: any;
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
  case_id: string;
  case_number?: string;
  document_name: string;
  description?: string;
  status: 'PENDING' | 'UPLOADED';
  requested_at: string;
  fulfilled_at?: string;
}

const STATUS_OPTIONS = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'DOCUMENTS_PENDING',
  'APPROVED',
  'CLOSED',
  'CANCELLED',
];

const PRIORITY_OPTIONS = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

function statusColor(status: string) {
  switch (status) {
    case 'NEW':              return 'bg-blue-100 text-blue-800';
    case 'ASSIGNED':         return 'bg-purple-100 text-purple-800';
    case 'IN_PROGRESS':      return 'bg-yellow-100 text-yellow-800';
    case 'UNDER_REVIEW':     return 'bg-indigo-100 text-indigo-800';
    case 'DOCUMENTS_PENDING': return 'bg-orange-100 text-orange-800';
    case 'APPROVED':         return 'bg-green-100 text-green-800';
    case 'CLOSED':           return 'bg-gray-100 text-gray-600';
    case 'CANCELLED':        return 'bg-red-100 text-red-800';
    default:                 return 'bg-gray-100 text-gray-800';
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'URGENT': return 'bg-red-100 text-red-800';
    case 'HIGH':   return 'bg-orange-100 text-orange-800';
    case 'MEDIUM': return 'bg-blue-100 text-blue-800';
    case 'LOW':    return 'bg-gray-100 text-gray-800';
    default:       return 'bg-gray-100 text-gray-800';
  }
}

function formatAction(action: string) {
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { admin } = useAdminAuth();
  const caseId = params.id as string;

  // ── Core state ──────────────────────────────────────────────────────────────
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Documents state ─────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // ── Upload-document dialog ─────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Request-document dialog ────────────────────────────────────────────────
  const [reqDocOpen, setReqDocOpen] = useState(false);
  const [reqDocName, setReqDocName] = useState('');
  const [reqDocDesc, setReqDocDesc] = useState('');
  const [requesting, setRequesting] = useState(false);

  // ── Update-status dialog ────────────────────────────────────────────────────
  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // ── Notes dialog ───────────────────────────────────────────────────────────
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // ── Fetch case details ──────────────────────────────────────────────────────
  const fetchCaseDetails = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const res = await casesApi.getAdminCaseDetails(caseId);
      if (res.success) {
        const timeline = (res.history ?? []).map((h: any) => ({
          id: String(h.id),
          action: h.action,
          performedBy: h.performedBy ?? h.performed_by_name ?? 'System',
          performedByType: h.performedByType ?? h.performed_by_type,
          timestamp: h.createdAt ?? h.created_at ?? h.timestamp,
          notes: h.notes ?? undefined,
          oldValue: h.oldValue ?? h.old_value,
          newValue: h.newValue ?? h.new_value,
        }));
        setCaseDetails({ ...res.case, timeline });
      } else {
        setError('Failed to load case details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load case details');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails(true);
  }, [caseId]);

  // ── Fetch documents ─────────────────────────────────────────────────────────
  const fetchDocuments = async () => {
    setDocsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/cases/admin/' + caseId + '/documents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [caseId]);

  // ── Upload document ────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      const res = await fetch('http://localhost:3001/api/cases/admin/' + caseId + '/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`"${uploadFile.name}" uploaded successfully`);
        setUploadOpen(false);
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchDocuments();
        await fetchCaseDetails();
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Request document ─────────────────────────────────────────────────────────
  const handleRequestDocument = async () => {
    if (!reqDocName) {
      toast.error('Please enter document name');
      return;
    }
    setRequesting(true);
    try {
      const res = await fetch('http://localhost:3001/api/cases/admin/' + caseId + '/document-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentName: reqDocName,
          description: reqDocDesc
        })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Document requested successfully');
        setReqDocOpen(false);
        setReqDocName('');
        setReqDocDesc('');
        await fetchCaseDetails();
      } else {
        toast.error(data.message || 'Request failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Request failed. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  // ── Update status ──────────────────────────────────────────────────────────
  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }
    try {
      await casesApi.updateCaseStatus(caseId, newStatus);
      toast.success('Status updated successfully');
      setStatusOpen(false);
      await fetchCaseDetails();
    } catch (err: any) {
      toast.error(err.message || 'Status update failed. Please try again.');
    }
  };

  // ── Save notes ─────────────────────────────────────────────────────────────
  const handleSaveNotes = async () => {
    if (!admin) return;
    setSavingNotes(true);
    try {
      await casesApi.addAdminNote(caseId, notes);
      toast.success('Notes saved successfully');
      setNotesOpen(false);
      await fetchCaseDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <Skeleton className="h-32 w-full bg-slate-800" />
        <Skeleton className="h-32 w-full bg-slate-800" />
        <Skeleton className="h-32 w-full bg-slate-800" />
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error || !caseDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">{error || 'Case not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {caseDetails.caseNumber}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={statusColor(caseDetails.status)}>
            {caseDetails.status.replace(/_/g, ' ')}
          </Badge>
          <Badge variant="outline" className={priorityColor(caseDetails.priority)}>
            {caseDetails.priority} Priority
          </Badge>
        </div>
      </div>

      {/* Case Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Case Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-500">Scheme</Label>
              <p className="font-medium text-slate-900 dark:text-white">{caseDetails.schemeName}</p>
            </div>
            <div>
              <Label className="text-slate-500">Status</Label>
              <Badge className={statusColor(caseDetails.status)}>
                {caseDetails.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div>
              <Label className="text-slate-500">Created</Label>
              <p className="font-medium text-slate-900 dark:text-white">
                {new Date(caseDetails.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-slate-500">Updated</Label>
              <p className="font-medium text-slate-900 dark:text-white">
                {new Date(caseDetails.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MSME Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            MSME Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-500">Name</Label>
              <p className="font-medium text-slate-900 dark:text-white">{caseDetails.msmeName}</p>
            </div>
            <div>
              <Label className="text-slate-500">Business Name</Label>
              <p className="font-medium text-slate-900 dark:text-white">{caseDetails.msmeBusinessName}</p>
            </div>
            <div>
              <Label className="text-slate-500 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <p className="font-medium text-slate-900 dark:text-white">{caseDetails.msmePhone}</p>
            </div>
            <div>
              <Label className="text-slate-500 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <p className="font-medium text-slate-900 dark:text-white">{caseDetails.msmeEmail}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-slate-500 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <p className="font-medium text-slate-900 dark:text-white">{caseDetails.msmeAddress}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Agent */}
      {caseDetails.assignedAgentName && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5" />
              Assigned Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-500">Name</Label>
                <p className="font-medium text-slate-900 dark:text-white">{caseDetails.assignedAgentName}</p>
              </div>
              <div>
                <Label className="text-slate-500 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <p className="font-medium text-slate-900 dark:text-white">{caseDetails.assignedAgentPhone}</p>
              </div>
              <div>
                <Label className="text-slate-500 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <p className="font-medium text-slate-900 dark:text-white">{caseDetails.assignedAgentEmail}</p>
              </div>
            </div>
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

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-800" />
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{doc.file_name}</p>
                      <p className="text-xs text-slate-500">
                        {doc.document_tag} • {(doc.file_size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`http://localhost:3001${doc.file_url}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No documents uploaded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
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
        <Button variant="outline" onClick={() => setNotesOpen(true)} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Add Notes
        </Button>
        <Button variant="outline" onClick={() => { fetchCaseDetails(); fetchDocuments(); }} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!uploading) setUploadOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Document Dialog */}
      <Dialog open={reqDocOpen} onOpenChange={(open) => { if (!requesting) setReqDocOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FilePlus className="h-5 w-5" />
              Request Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="docName">Document Name</Label>
              <Input
                id="docName"
                value={reqDocName}
                onChange={(e) => setReqDocName(e.target.value)}
                placeholder="e.g., PAN Card, GST Certificate"
              />
            </div>
            <div>
              <Label htmlFor="docDesc">Description (Optional)</Label>
              <Textarea
                id="docDesc"
                value={reqDocDesc}
                onChange={(e) => setReqDocDesc(e.target.value)}
                placeholder="Additional details about the document"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReqDocOpen(false)} disabled={requesting}>
              Cancel
            </Button>
            <Button onClick={handleRequestDocument} disabled={!reqDocName || requesting}>
              {requesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Update Status
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesOpen} onOpenChange={(open) => { if (!savingNotes) setNotesOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Add Notes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter your notes about this case"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesOpen(false)} disabled={savingNotes}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={!notes || savingNotes}>
              {savingNotes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
