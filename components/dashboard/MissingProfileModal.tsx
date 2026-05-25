'use client';

import { useState } from 'react';
import { useSchemes, MissingField } from '@/contexts/SchemesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MissingProfileModal() {
  const { missingFields, showMissingFieldsModal, submitMissingFields, dismissMissingFieldsModal } =
    useSchemes();

  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!showMissingFieldsModal || missingFields.length === 0) return null;

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = missingFields.filter((f) => !values[f.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }
    setSubmitting(true);
    try {
      await submitMissingFields(values);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to submit missing fields:', err);
      toast.error('Failed to save profile. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg bg-card border-border shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Complete Your Profile</h2>
              <p className="text-sm text-muted-foreground mt-1">
                These details are required to find schemes that match your business. Without them, we can't show accurate results.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {missingFields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {field.label}
                  <span className="text-destructive ml-1">*</span>
                </label>
                {field.type === 'select' && field.options ? (
                  <select
                    value={values[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={field.type === 'number' ? 'number' : 'text'}
                    placeholder={`Enter ${field.label}`}
                    value={values[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-border flex gap-3">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finding Schemes...
                </>
              ) : (
                <>
                  Find My Schemes
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
