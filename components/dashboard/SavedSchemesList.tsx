'use client';

import { Scheme } from '@/contexts/SchemesContext';
import { useSchemes } from '@/contexts/SchemesContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookmarkCheck, ChevronRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SavedSchemesList({ schemes }: { schemes: Scheme[] }) {
  const { removeSavedScheme } = useSchemes();

  const handleRemove = (e: React.MouseEvent, schemeId: string) => {
    e.preventDefault();
    removeSavedScheme(schemeId);
    toast.success('Scheme removed from saved');
  };

  if (schemes.length === 0) {
    return (
      <Card className="p-12 bg-card border-border border-dashed text-center">
        <div className="space-y-3">
          <BookmarkCheck className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
          <p className="text-lg font-semibold text-foreground">No saved schemes yet</p>
          <p className="text-muted-foreground">
            Explore schemes and save your favorites to view them later
          </p>
          <Link href="/dashboard">
            <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              Browse Schemes
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {schemes.map((scheme) => (
        <Link key={scheme.id} href={`/scheme/${scheme.id}`}>
          <Card className="p-6 bg-card border-border hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3 min-w-0">
                {/* Title and Ministry */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {scheme.schemeName}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{scheme.nodalMinistryName}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-foreground line-clamp-2">{scheme.briefDescription}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {scheme.schemeLevel && (
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground border-0">
                      {scheme.schemeLevel}
                    </Badge>
                  )}
                  {scheme.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="border-border text-muted-foreground text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Scheme categories */}
                {scheme.schemeCategory?.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1">
                    {scheme.schemeCategory.slice(0, 3).map((cat) => (
                      <span key={cat} className="text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <div className="p-2 rounded-lg bg-accent/20 text-accent">
                  <BookmarkCheck className="w-5 h-5" />
                </div>
                <button
                  onClick={(e) => handleRemove(e, scheme.id)}
                  className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
