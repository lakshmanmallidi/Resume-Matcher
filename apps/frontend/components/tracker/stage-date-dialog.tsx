'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';

const getToday = (): string => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};

interface StageDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string) => void;
}

export function StageDateDialog({ open, onOpenChange, onConfirm }: StageDateDialogProps) {
  const { t } = useTranslations();
  const [date, setDate] = useState(getToday());

  useEffect(() => {
    if (open) setDate(getToday());
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-1 p-6">
          <Label htmlFor="stage-moved-date">{t('tracker.stageDate.date')}</Label>
          <Input
            id="stage-moved-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <DialogFooter className="border-t border-black bg-secondary p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => onConfirm(date)} disabled={!date}>
            {t('tracker.stageDate.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
