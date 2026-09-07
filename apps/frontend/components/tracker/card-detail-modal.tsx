'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
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
import { StageDateDialog } from './stage-date-dialog';
import { ApplicationTimeline } from './application-timeline';
import { useTranslations } from '@/lib/i18n';
import {
  APPLICATION_CURRENCIES,
  APPLICATION_CTC_MULTIPLIERS,
  getApplicationDetail,
  updateApplication,
  type ApplicationCtcMultiplier,
  type ApplicationStatus,
  type ApplicationDetail,
  type InterviewRound,
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
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('');
  const [ctcAmount, setCtcAmount] = useState('');
  const [ctcMultiplier, setCtcMultiplier] = useState<ApplicationCtcMultiplier>('L');
  const [ctcCurrency, setCtcCurrency] = useState('INR');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('applied');
  const [notes, setNotes] = useState('');
  const [interviewRounds, setInterviewRounds] = useState<InterviewRound[]>([]);
  const [saving, setSaving] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [stageDate, setStageDate] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(null);
  const [stageDateOpen, setStageDateOpen] = useState(false);

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
        setLocation(data.location ?? '');
        setRole(data.role ?? '');
        setCtcAmount(data.ctc_amount === null ? '' : String(data.ctc_amount));
        setCtcMultiplier((data.ctc_multiplier as ApplicationCtcMultiplier) || 'L');
        setCtcCurrency(data.ctc_currency || 'INR');
        setContactName(data.contact_name ?? '');
        setContactPhone(data.contact_phone ?? '');
        setContactEmail(data.contact_email ?? '');
        setStatus(data.status);
        setStageDate(data.stage_dates[data.status] ?? null);
        setNotes(data.notes ?? '');
        setInterviewRounds(data.interview_rounds ?? []);
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
    const originalStatus = detail?.status;
    setSaving(true);
    setNotesError(null);
    try {
      const updated = await updateApplication(applicationId, {
        company: company.trim() || null,
        location: location.trim() || null,
        role: role.trim() || null,
        ctc_amount: ctcAmount === '' ? null : Number(ctcAmount),
        ctc_multiplier: ctcAmount === '' ? null : ctcMultiplier,
        ctc_currency: ctcAmount === '' ? null : ctcCurrency,
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
        contact_email: contactEmail.trim() || null,
        interview_rounds: interviewRounds.map((round) => ({
          ...round,
          round_name: round.round_name.trim(),
          probability: round.probability === null ? null : Number(round.probability),
        })),
        status,
        stage_date: originalStatus && status !== originalStatus ? stageDate : undefined,
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

  const addInterviewRound = () => {
    setInterviewRounds((current) => [
      ...current,
      { round_name: `Round ${current.length + 1}`, scheduled_at: null, probability: null },
    ]);
  };

  const requestStatusChange = (nextStatus: ApplicationStatus) => {
    if (!detail || nextStatus === detail.status) {
      setStatus(nextStatus);
      return;
    }
    setPendingStatus(nextStatus);
    setStageDateOpen(true);
  };

  const confirmStatusChange = (date: string) => {
    if (!pendingStatus) return;
    setStatus(pendingStatus);
    setStageDate(date);
    setPendingStatus(null);
    setStageDateOpen(false);
  };

  const resumeAvailable = Boolean(detail?.resume);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto">
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
            <ApplicationTimeline
              stageDates={detail.stage_dates}
              appliedAt={detail.applied_at}
              interviewRounds={interviewRounds}
              currentStatus={status}
              columns={columns}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="card-company">{t('tracker.manualAdd.company')}</Label>
                <Input
                  id="card-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="card-location">{t('tracker.manualAdd.location')}</Label>
                <Input
                  id="card-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
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
              <div className="space-y-1">
                <Label htmlFor="card-contact-email">{t('tracker.manualAdd.contactEmail')}</Label>
                <Input
                  id="card-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-1">
              <Dropdown
                label={t('tracker.manualAdd.status')}
                options={columns.map((column) => ({
                  id: column.column_id,
                  label: column.is_system ? t(`tracker.columns.${column.column_id}`) : column.label,
                }))}
                value={status}
                onChange={(value) => requestStatusChange(value as ApplicationStatus)}
              />
            </div>

            <div className="space-y-2 border-t border-black pt-3">
              <div className="flex items-center justify-between gap-3">
                <Label>{t('tracker.modal.interviewRounds')}</Label>
                <Button type="button" size="sm" variant="outline" onClick={addInterviewRound}>
                  <Plus className="h-4 w-4" />
                  {t('tracker.modal.addInterviewRound')}
                </Button>
              </div>
              {interviewRounds.map((round, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1.2fr_1fr_0.7fr_auto]">
                  <Input
                    aria-label={t('tracker.modal.roundName')}
                    value={round.round_name}
                    onChange={(e) =>
                      setInterviewRounds((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, round_name: e.target.value } : item
                        )
                      )
                    }
                    placeholder={t('tracker.modal.roundName')}
                  />
                  <Input
                    aria-label={t('tracker.modal.scheduledAt')}
                    type="datetime-local"
                    value={round.scheduled_at ?? ''}
                    onChange={(e) =>
                      setInterviewRounds((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, scheduled_at: e.target.value || null }
                            : item
                        )
                      )
                    }
                    placeholder={t('tracker.modal.scheduledAt')}
                  />
                  <Input
                    aria-label={t('tracker.modal.probability')}
                    type="number"
                    min="0"
                    max="100"
                    value={round.probability ?? ''}
                    onChange={(e) =>
                      setInterviewRounds((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                probability: e.target.value === '' ? null : Number(e.target.value),
                              }
                            : item
                        )
                      )
                    }
                    className="placeholder:text-[10px]"
                    placeholder={t('tracker.modal.probability')}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={t('tracker.modal.removeInterviewRound')}
                    onClick={() =>
                      setInterviewRounds((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
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
      <StageDateDialog
        open={stageDateOpen}
        onOpenChange={(open) => {
          setStageDateOpen(open);
          if (!open) setPendingStatus(null);
        }}
        onConfirm={confirmStatusChange}
      />
    </Dialog>
  );
}
