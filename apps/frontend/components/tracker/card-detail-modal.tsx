'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dropdown } from '@/components/ui/dropdown';
import { useTranslations } from '@/lib/i18n';
import {
  APPLICATION_CURRENCIES,
  APPLICATION_CTC_MULTIPLIERS,
  getApplicationDetail,
  updateApplication,
  type ApplicationCtcMultiplier,
  type ApplicationStatus,
  type ApplicationDetail,
  type TrackerColumn,
} from '@/lib/api/tracker';

interface CardDetailModalProps {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  columns: TrackerColumn[];
}

export function CardDetailModal({
  applicationId,
  open,
  onOpenChange,
  onUpdated,
  columns,
}: CardDetailModalProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [ctcAmount, setCtcAmount] = useState('');
  const [ctcMultiplier, setCtcMultiplier] = useState<ApplicationCtcMultiplier>('L');
  const [ctcCurrency, setCtcCurrency] = useState('INR');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [applicationDate, setApplicationDate] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('applied');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !applicationId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getApplicationDetail(applicationId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setCompany(data.company ?? '');
        setRole(data.role ?? '');
        setCtcAmount(data.ctc_amount === null ? '' : String(data.ctc_amount));
        setCtcMultiplier((data.ctc_multiplier as ApplicationCtcMultiplier) || 'L');
        setCtcCurrency(data.ctc_currency || 'INR');
        setContactName(data.contact_name ?? '');
        setContactPhone(data.contact_phone ?? '');
        setApplicationDate(data.applied_at ? data.applied_at.slice(0, 10) : '');
        setStatus(data.status);
        setNotes(data.notes ?? '');
        setNotesError(null);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, applicationId]);

  // Keep textarea Enter from bubbling to dialog/global handlers.
  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.stopPropagation();
  };

  const handleSave = async () => {
    if (!applicationId) return;
    setSaving(true);
    setNotesError(null);
    try {
      const updated = await updateApplication(applicationId, {
        company: company.trim() || null,
        role: role.trim() || null,
        ctc_amount: ctcAmount === '' ? null : Number(ctcAmount),
        ctc_multiplier: ctcAmount === '' ? null : ctcMultiplier,
        ctc_currency: ctcAmount === '' ? null : ctcCurrency,
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
        applied_at: applicationDate || null,
        status,
        notes,
      });
      setDetail((current) => (current ? { ...current, ...updated } : current));
      onUpdated();
    } catch {
      // Show a generic message — never echo raw backend error text inline,
      // which could contain sensitive values.
      setNotesError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const resumeAvailable = Boolean(detail?.resume);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{detail?.company || t('tracker.card.companyUnknown')}</DialogTitle>
          <DialogDescription>{detail?.role || t('tracker.card.roleUnknown')}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-steel-grey" />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="card-company">{t('tracker.manualAdd.company')}</Label>
                <Input
                  id="card-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="card-role">{t('tracker.manualAdd.role')}</Label>
                <Input id="card-role" value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="card-ctc-amount">{t('tracker.manualAdd.ctc')}</Label>
                <Input
                  id="card-ctc-amount"
                  type="number"
                  min="0"
                  step="any"
                  value={ctcAmount}
                  onChange={(e) => setCtcAmount(e.target.value)}
                />
              </div>
              <Dropdown
                label={t('tracker.manualAdd.multiplier')}
                options={APPLICATION_CTC_MULTIPLIERS.map((value) => ({ id: value, label: value }))}
                value={ctcMultiplier}
                onChange={(value) => setCtcMultiplier(value as ApplicationCtcMultiplier)}
              />
              <Dropdown
                label={t('tracker.manualAdd.currency')}
                options={APPLICATION_CURRENCIES}
                value={ctcCurrency}
                onChange={setCtcCurrency}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="card-contact-name">{t('tracker.manualAdd.contactName')}</Label>
                <Input
                  id="card-contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="card-contact-phone">{t('tracker.manualAdd.contactPhone')}</Label>
                <Input
                  id="card-contact-phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="card-application-date">
                  {t('tracker.manualAdd.applicationDate')}
                </Label>
                <Input
                  id="card-application-date"
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                />
              </div>
              <Dropdown
                label={t('tracker.manualAdd.status')}
                options={columns.map((column) => ({
                  id: column.column_id,
                  label: column.is_system ? t(`tracker.columns.${column.column_id}`) : column.label,
                }))}
                value={status}
                onChange={(value) => setStatus(value as ApplicationStatus)}
              />
            </div>

            <div className="space-y-1">
              <Label>{t('tracker.modal.jobDescription')}</Label>
              <div className="max-h-48 overflow-y-auto whitespace-pre-wrap border border-black bg-background p-3 text-sm">
                {detail.job_content || t('tracker.modal.noJobDescription')}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="card-notes">{t('tracker.modal.notes')}</Label>
              <Textarea
                id="card-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={handleNotesKeyDown}
                placeholder={t('tracker.modal.notesPlaceholder')}
                rows={3}
              />
              <div className="flex items-center justify-end gap-3">
                {notesError && (
                  <span className="font-mono text-xs text-destructive">{notesError}</span>
                )}
                <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('tracker.modal.saveChanges')
                  )}
                </Button>
              </div>
            </div>

            {!resumeAvailable && (
              <p className="font-mono text-xs text-warning">
                {t('tracker.modal.resumeUnavailable')}
              </p>
            )}
          </div>
        ) : (
          <p className="py-6 text-center font-mono text-sm text-steel-grey">
            {t('tracker.modal.loadFailed')}
          </p>
        )}

        <DialogFooter>
          <Button
            onClick={() => {
              if (detail?.resume_id) router.push(`/builder?id=${detail.resume_id}`);
            }}
            disabled={!resumeAvailable}
          >
            <Pencil className="h-4 w-4" />
            {t('tracker.modal.editResume')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
