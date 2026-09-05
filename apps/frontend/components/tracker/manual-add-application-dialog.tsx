'use client';

import React, { useEffect, useState } from 'react';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dropdown } from '@/components/ui/dropdown';
import { useTranslations } from '@/lib/i18n';
import { fetchResumeList, type ResumeListItem } from '@/lib/api/resume';
import {
  APPLICATION_CURRENCIES,
  APPLICATION_CTC_MULTIPLIERS,
  createApplication,
  type ApplicationCtcMultiplier,
  type ApplicationStatus,
  type TrackerColumn,
} from '@/lib/api/tracker';

const getToday = (): string => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};

interface ManualAddApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  columns: TrackerColumn[];
}

export function ManualAddApplicationDialog({
  open,
  onOpenChange,
  onCreated,
  columns,
}: ManualAddApplicationDialogProps) {
  const { t } = useTranslations();
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [resumeId, setResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [ctcAmount, setCtcAmount] = useState('');
  const [ctcMultiplier, setCtcMultiplier] = useState<ApplicationCtcMultiplier>('L');
  const [ctcCurrency, setCtcCurrency] = useState('INR');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [applicationDate, setApplicationDate] = useState(getToday());
  const [status, setStatus] = useState<ApplicationStatus>('applied');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Include the master resume — users may track an application against it.
    fetchResumeList(true)
      .then((items) => {
        setResumes(items);
        if (items.length > 0) setResumeId((prev) => prev || items[0].resume_id);
      })
      .catch(() => setResumes([]));
  }, [open]);

  const resumeLabel = (r: ResumeListItem): string =>
    r.title || r.filename || t('tracker.manualAdd.untitledResume');

  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.stopPropagation();
  };

  const reset = () => {
    setJobDescription('');
    setCompany('');
    setRole('');
    setCtcAmount('');
    setCtcMultiplier('L');
    setCtcCurrency('INR');
    setContactName('');
    setContactPhone('');
    setApplicationDate(getToday());
    setStatus('applied');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!resumeId || !jobDescription.trim()) {
      setError(t('tracker.manualAdd.validation'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createApplication({
        resume_id: resumeId,
        job_description: jobDescription.trim(),
        company: company.trim() || undefined,
        role: role.trim() || undefined,
        ctc_amount: ctcAmount === '' ? undefined : Number(ctcAmount),
        ctc_multiplier: ctcAmount === '' ? undefined : ctcMultiplier,
        ctc_currency: ctcAmount === '' ? undefined : ctcCurrency,
        contact_name: contactName.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        applied_at: applicationDate || undefined,
        status,
      });
      reset();
      onCreated();
      onOpenChange(false);
    } catch {
      setError(t('tracker.manualAdd.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('tracker.manualAdd.title')}</DialogTitle>
          <DialogDescription>{t('tracker.manualAdd.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t('tracker.manualAdd.resume')}</Label>
            <Dropdown
              options={resumes.map((r) => ({ id: r.resume_id, label: resumeLabel(r) }))}
              value={resumeId}
              onChange={setResumeId}
            />
          </div>

          <div className="grid grid-cols-[1.2fr_1fr_1.2fr] gap-3">
            <div className="space-y-1">
              <Label htmlFor="manual-ctc-amount">{t('tracker.manualAdd.ctc')}</Label>
              <Input
                id="manual-ctc-amount"
                type="number"
                min="0"
                step="any"
                value={ctcAmount}
                onChange={(e) => setCtcAmount(e.target.value)}
                placeholder={t('tracker.manualAdd.optional')}
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

          <div className="space-y-1">
            <Label htmlFor="manual-jd">{t('tracker.manualAdd.jobDescription')}</Label>
            <Textarea
              id="manual-jd"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              onKeyDown={handleNotesKeyDown}
              placeholder={t('tracker.manualAdd.jobDescriptionPlaceholder')}
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="manual-company">{t('tracker.manualAdd.company')}</Label>
              <Input
                id="manual-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t('tracker.manualAdd.optional')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-role">{t('tracker.manualAdd.role')}</Label>
              <Input
                id="manual-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder={t('tracker.manualAdd.optional')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="manual-contact-name">{t('tracker.manualAdd.contactName')}</Label>
              <Input
                id="manual-contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t('tracker.manualAdd.optional')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-contact-phone">{t('tracker.manualAdd.contactPhone')}</Label>
              <Input
                id="manual-contact-phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder={t('tracker.manualAdd.optional')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="manual-application-date">
                {t('tracker.manualAdd.applicationDate')}
              </Label>
              <Input
                id="manual-application-date"
                type="date"
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('tracker.manualAdd.status')}</Label>
              <Dropdown
                options={columns.map((column) => ({
                  id: column.column_id,
                  label: column.is_system ? t(`tracker.columns.${column.column_id}`) : column.label,
                }))}
                value={status}
                onChange={(value) => setStatus(value as ApplicationStatus)}
              />
            </div>
          </div>

          {error && <p className="font-mono text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t('tracker.manualAdd.submit')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
