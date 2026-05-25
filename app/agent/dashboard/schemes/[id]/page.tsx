'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAgentAuth } from '@/contexts/AgentAuthContext';
import AgentSchemeDetails from '@/components/scheme/AgentSchemeDetails';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// ─── In-memory cache (survives same session, cleared on hard refresh) ─────────
const schemeCache = new Map<string, any>();

export default function AgentSchemePage() {
  const { isAuthenticated } = useAgentAuth();
  const router = useRouter();
  const params = useParams();
  const schemeSlug = params.id as string;

  const [schemeData, setSchemeData] = useState<any>(schemeCache.get(schemeSlug) || null);
  const [loading, setLoading] = useState(!schemeCache.has(schemeSlug));
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/agent/login');
    }
  }, [isAuthenticated, router]);

  // Fetch full scheme details from the public combined endpoint
  useEffect(() => {
    if (!schemeSlug || schemeData || fetching || error) return;

    // Serve from memory cache on back-navigation
    if (schemeCache.has(schemeSlug)) {
      setSchemeData(schemeCache.get(schemeSlug));
      setLoading(false);
      return;
    }

    const fetchScheme = async () => {
      setFetching(true);
      setLoading(true);
      setError(null);

      try {
        // Public combined endpoint — no auth header needed, cached server-side in Redis
        const response = await fetch(
          `${API_BASE_URL}/api/v1/schemes/${schemeSlug}/full`,
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          schemeCache.set(schemeSlug, data); // persist in memory for this session
          setSchemeData(data);
        } else {
          setError('Failed to load scheme details.');
        }
      } catch (err) {
        console.error('Error fetching scheme:', err);
        setError('Failed to load scheme details. Please try again later.');
      } finally {
        setLoading(false);
        setFetching(false);
      }
    };

    fetchScheme();
  }, [schemeSlug, schemeData, fetching, error]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
        <p className="text-muted-foreground text-lg">Loading scheme details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push('/agent/dashboard')} variant="outline">
          ← Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!schemeData) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Scheme not found.</p>
      </div>
    );
  }

  return <AgentSchemeDetails data={schemeData} />;
}
