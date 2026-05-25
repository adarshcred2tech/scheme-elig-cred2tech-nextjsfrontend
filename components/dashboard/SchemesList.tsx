'use client';

import { useSchemes } from '@/contexts/SchemesContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bookmark, BookmarkCheck, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SchemesList() {
  const {
    getFilteredSchemes,
    currentPage,
    itemsPerPage,
    setCurrentPage,
    getTotalPages,
    saveScheme,
    removeSavedScheme,
    savedSchemes,
    isLoading,
  } = useSchemes();

  const filteredSchemes = getFilteredSchemes();
  const totalPages = getTotalPages();
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedSchemes = filteredSchemes.slice(startIdx, startIdx + itemsPerPage);

  const handleSaveScheme = (e: React.MouseEvent, scheme: any) => {
    e.preventDefault();
    const isSaved = savedSchemes.some((s) => s.id === scheme.id);

    if (isSaved) {
      removeSavedScheme(scheme.id);
      toast.success('Scheme removed from saved');
    } else {
      saveScheme([scheme]);
      toast.success('Scheme saved successfully');
    }
  };

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Available Schemes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Showing {paginatedSchemes.length > 0 ? startIdx + 1 : 0}&ndash;
            {Math.min(startIdx + itemsPerPage, filteredSchemes.length)} of {filteredSchemes.length} schemes
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading schemes...</p>
          </div>
        </div>
      )}

      {/* Schemes Grid */}
      {!isLoading && paginatedSchemes.length > 0 && (
        <div className="grid gap-6">
          {paginatedSchemes.map((scheme) => {
            const isSaved = savedSchemes.some((s) => s.id === scheme.id);

            return (
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

                      {/* AI Match Reason */}
                      {scheme.matchReason && (
                        <div className="flex items-start gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium leading-snug">
                            {scheme.matchReason}
                          </p>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 pt-1">
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
                      <Button
                        onClick={(e) => handleSaveScheme(e, scheme)}
                        variant={isSaved ? 'default' : 'outline'}
                        size="icon"
                        className={
                          isSaved
                            ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                            : 'border-border text-muted-foreground hover:text-primary hover:border-primary'
                        }
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-5 h-5" />
                        ) : (
                          <Bookmark className="w-5 h-5" />
                        )}
                      </Button>
                      <button className="p-2 rounded-lg bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSchemes.length === 0 && (
        <Card className="p-12 bg-card border-border border-dashed text-center">
          <div className="space-y-3">
            <p className="text-lg font-semibold text-foreground">No schemes found</p>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query to find relevant schemes
            </p>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="outline"
            className="border-border text-foreground hover:bg-muted disabled:opacity-50"
          >
            Previous
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              onClick={() => setCurrentPage(page)}
              variant={currentPage === page ? 'default' : 'outline'}
              className={
                currentPage === page
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border-border text-foreground hover:bg-muted'
              }
              size="sm"
            >
              {page}
            </Button>
          ))}

          <Button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            className="border-border text-foreground hover:bg-muted disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
