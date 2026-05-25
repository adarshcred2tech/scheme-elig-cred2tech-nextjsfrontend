'use client';

import { useEffect, useRef, useState } from 'react';
import { useMsmeAuth } from '@/contexts/MsmeAuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  TrendingUp,
  Upload,
  Loader2,
  Inbox,
  FilePlus,
  Download,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { casesApi } from '@/lib/services/api';

interface Case {
  id: string;
  caseNumber: string;
  businessName: string;
  scheme: string;
  schemeId: string;
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_DOCS' | 'DOCUMENTS_PENDING' | 'CLOSED' | 'REJECTED';
  assignedAt: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  agent?: {
    fullName: string;
    email: string;
    phone: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

export default function TrackApplicationsPage() {
  const { authStep, userId } = useMsmeAuth();
  const router = useRouter();

  const [isLoading, setIsLoading]   = useState(true);
  const [cases, setCases]           = useState<Case[]>([]);

  // Document requests state
  const [docRequests, setDocRequests]       = useState<DocumentRequest[]>([]);
  const [reqsLoading, setReqsLoading]       = useState(false);

  // Upload dialog state
  const [uploadOpen, setUploadOpen]         = useState(false);
  const [activeRequest, setActiveRequest]   = useState<DocumentRequest | null>(null);
  const [uploadFile, setUploadFile]         = useState<File | null>(null);
  const [uploading, setUploading]           = useState(false);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen]         = useState(false);
  const [caseToDelete, setCaseToDelete]     = useState<Case | null>(null);
  const [deleting, setDeleting]             = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('msme_auth_token');
    if (!token && authStep !== 'authenticated') {
      router.push('/');
    }
  }, [authStep, router]);

  const fetchCases = async (msmeUserId: number) => {
    try {
      const response = await casesApi.getMsmeCases(msmeUserId);
      if (response.success) setCases(response.cases);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const fetchDocumentRequests = async (msmeUserId: number) => {
    setReqsLoading(true);
    try {
      const response = await casesApi.getMsmeDocumentRequests(msmeUserId);
      if (response.success) setDocRequests(response.requests || []);
    } catch (error) {
      console.error('Error fetching document requests:', error);
    } finally {
      setReqsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const msmeUserId = userId ? parseInt(userId) : null;
      if (!msmeUserId) { setIsLoading(false); return; }
      await Promise.all([fetchCases(msmeUserId), fetchDocumentRequests(msmeUserId)]);
      setIsLoading(false);
    };
    if (authStep === 'authenticated') {
      load();
    }
  }, [authStep, userId]);

  const handleUploadFulfillment = async () => {
    if (!activeRequest || !uploadFile || !userId) return;
    setUploading(true);
    try {
      await casesApi.fulfillDocumentRequest(activeRequest.id, parseInt(userId), uploadFile);
      toast.success(`"${uploadFile.name}" uploaded successfully`);
      setUploadOpen(false);
      setUploadFile(null);
      setActiveRequest(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Refresh requests
      await fetchDocumentRequests(parseInt(userId));
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

  const openDeleteDialog = (caseItem: Case) => {
    setCaseToDelete(caseItem);
    setDeleteOpen(true);
  };

  const handleDeleteCase = async () => {
    if (!caseToDelete || !userId) return;
    setDeleting(true);
    try {
      await casesApi.deleteCase(caseToDelete.id, parseInt(userId));
      toast.success(`Application "${caseToDelete.scheme}" deleted successfully`);
      setDeleteOpen(false);
      setCaseToDelete(null);
      // Refresh cases list
      await fetchCases(parseInt(userId));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete application. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (authStep !== 'authenticated') return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':               return 'bg-blue-500';
      case 'ASSIGNED':          return 'bg-purple-500';
      case 'IN_PROGRESS':       return 'bg-yellow-500';
      case 'PENDING_DOCS':
      case 'DOCUMENTS_PENDING': return 'bg-orange-500';
      case 'CLOSED':            return 'bg-green-500';
      case 'REJECTED':          return 'bg-red-500';
      default:                  return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW':               return <Clock className="h-5 w-5" />;
      case 'ASSIGNED':          return <User className="h-5 w-5" />;
      case 'IN_PROGRESS':       return <TrendingUp className="h-5 w-5" />;
      case 'PENDING_DOCS':
      case 'DOCUMENTS_PENDING': return <AlertCircle className="h-5 w-5" />;
      case 'CLOSED':            return <CheckCircle className="h-5 w-5" />;
      case 'REJECTED':          return <XCircle className="h-5 w-5" />;
      default:                  return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'NEW':               return 'Application received, waiting for agent assignment';
      case 'ASSIGNED':          return 'Agent assigned, review in progress';
      case 'IN_PROGRESS':       return 'Application under review';
      case 'PENDING_DOCS':
      case 'DOCUMENTS_PENDING': return 'Additional documents required';
      case 'CLOSED':            return 'Application completed successfully';
      case 'REJECTED':          return 'Application was rejected';
      default:                  return 'Status unknown';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':   return 'text-red-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'LOW':    return 'text-green-500';
      default:       return 'text-gray-500';
    }
  };

  const pendingRequests = docRequests.filter((r) => r.status === 'PENDING');

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Track Applications</h1>
            <p className="text-muted-foreground">Monitor your scheme application progress</p>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Track Applications</h1>
          <p className="text-muted-foreground">Monitor your scheme application progress</p>
        </div>

        {/* ── Pending Document Requests Banner ───────────────────────────────── */}
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
                          Case {req.case_number}
                          {req.agent_name ? ` · Requested by ${req.agent_name}` : ''}
                          {' · '}{new Date(req.requested_at).toLocaleDateString()}
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

        {/* ── All Document Requests (history) ───────────────────────────────── */}
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
                  disabled={reqsLoading}
                  onClick={() => userId && fetchDocumentRequests(parseInt(userId))}
                  className="gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${reqsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {docRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/10"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FilePlus className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm truncate">{req.document_name}</p>
                          <Badge
                            className={`text-xs ${
                              req.status === 'PENDING'   ? 'bg-orange-100 text-orange-800' :
                              req.status === 'UPLOADED'  ? 'bg-green-100 text-green-800' :
                                                           'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {req.status}
                          </Badge>
                        </div>
                        {req.description && (
                          <p className="text-xs text-muted-foreground truncate">{req.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Case {req.case_number}
                          {req.agent_name ? ` · ${req.agent_name}` : ''}
                          {' · '}{new Date(req.requested_at).toLocaleDateString()}
                          {req.fulfilled_at ? ` · Uploaded ${new Date(req.fulfilled_at).toLocaleDateString()}` : ''}
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
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{cases.length}</div>
                <div className="text-sm text-muted-foreground">Total Applications</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">
                  {cases.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">
                  {cases.filter(c => c.status === 'CLOSED').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">
                  {cases.filter(c => c.status === 'PENDING_DOCS' || c.status === 'DOCUMENTS_PENDING').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending Documents</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {cases.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No applications yet</p>
                  <p className="text-sm mt-2">Apply for schemes to track them here</p>
                  <Button
                    className="mt-4"
                    onClick={() => router.push('/dashboard')}
                  >
                    Browse Schemes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            cases.map((caseItem) => {
              // Requests for this specific case
              const caseReqs = docRequests.filter((r) => String(r.case_id) === String(caseItem.id));
              const casePending = caseReqs.filter((r) => r.status === 'PENDING');

              return (
                <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <CardTitle className="text-xl">{caseItem.scheme}</CardTitle>
                          <Badge className={getStatusColor(caseItem.status)}>
                            {getStatusIcon(caseItem.status)}
                            <span className="ml-1">{caseItem.status.replace(/_/g, ' ')}</span>
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(caseItem.priority)}>
                            {caseItem.priority}
                          </Badge>
                          {casePending.length > 0 && (
                            <Badge className="bg-orange-100 text-orange-800">
                              {casePending.length} doc request{casePending.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-base">
                          {caseItem.businessName}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Status Message */}
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(caseItem.status)}
                          <span className="font-medium">{getStatusMessage(caseItem.status)}</span>
                        </div>
                        {caseItem.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{caseItem.notes}</p>
                        )}
                      </div>

                      {/* Inline pending requests for this case */}
                      {casePending.length > 0 && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg space-y-2">
                          <p className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Documents Needed
                          </p>
                          {casePending.map((req) => (
                            <div key={req.id} className="flex items-center justify-between">
                              <span className="text-sm text-orange-900">{req.document_name}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 border-orange-300 text-orange-800 hover:bg-orange-100"
                                onClick={() => openUploadDialog(req)}
                              >
                                <Upload className="h-3 w-3" />
                                Upload
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Case Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">Case Number</div>
                          <div className="font-medium">{caseItem.caseNumber}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Applied On</div>
                          <div className="font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(caseItem.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Last Updated</div>
                          <div className="font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(caseItem.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        {caseItem.agent && (
                          <div>
                            <div className="text-muted-foreground mb-1">Assigned Agent</div>
                            <div className="font-medium flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {caseItem.agent.fullName}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/track-applications/${caseItem.id}`)}
                        >
                          View Case Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/scheme/${caseItem.schemeId}`)}
                        >
                          View Scheme Details
                        </Button>
                        {caseItem.agent && (
                          <Button variant="outline" size="sm">
                            Contact Agent
                          </Button>
                        )}
                        {caseItem.status === 'NEW' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openDeleteDialog(caseItem)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          Upload Document Dialog (for fulfilling a request)
         ═══════════════════════════════════════════════════════════════════════ */}
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
              onClick={handleUploadFulfillment}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          Delete Case Confirmation Dialog
         ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) {
            setDeleteOpen(open);
            if (!open) { setCaseToDelete(null); }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Application
            </DialogTitle>
            <DialogDescription>
              {caseToDelete && (
                <>
                  Are you sure you want to delete your application for <strong>{caseToDelete.scheme}</strong>?
                  <br /><br />
                  <span className="text-red-600 font-medium">This action cannot be undone.</span>
                  <br /><br />
                  Case Number: <code className="bg-muted px-1 py-0.5 rounded">{caseToDelete.caseNumber}</code>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteCase}
              disabled={deleting}
              variant="destructive"
              className="gap-2"
            >
              {deleting
                ? <><Loader2 className="h-4 w-4 animate-spin" />Deleting…</>
                : <><Trash2 className="h-4 w-4" />Delete Application</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
