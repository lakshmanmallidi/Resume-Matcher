'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import Layers from 'lucide-react/dist/esm/icons/layers';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n';
import type { Application } from '@/lib/api/tracker';

const probabilityColor = (probability: number): string => {
  if (probability <= 15) return '#EF4444';
  if (probability <= 30) return '#EA580C';
  if (probability <= 45) return '#F97316';
  if (probability <= 60) return '#CA8A04';
  if (probability <= 75) return '#EAB308';
  if (probability <= 90) return '#84CC16';
  return '#22C55E';
};

const isCompleted = (scheduledAt: string | null): boolean =>
  Boolean(scheduledAt && new Date(scheduledAt).getTime() < Date.now());

interface ApplicationCardProps {
  application: Application;
  selected: boolean;
  sharedResume: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

export function ApplicationCard({
  application,
  selected,
  sharedResume,
  onToggleSelect,
  onOpen,
}: ApplicationCardProps) {
  const { t } = useTranslations();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.application_id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const company = application.company?.trim();
  const role = application.role?.trim();
  const probabilities = application.interview_rounds
    .map((round) => round.probability)
    .filter((probability): probability is number => probability !== null);
  const averageProbability =
    probabilities.length > 0
      ? Math.round(
          probabilities.reduce((sum, probability) => sum + probability, 0) / probabilities.length
        )
      : null;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        variant="interactive"
        noPadding
        className={`p-3 ${selected ? 'ring-2 ring-primary' : ''}`}
      >
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(application.application_id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={t('tracker.card.selectAria')}
            className="mt-1 h-4 w-4 shrink-0 rounded-none border-black accent-primary"
          />

          <button
            type="button"
            onClick={() => onOpen(application.application_id)}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-ink">
                {company || t('tracker.card.companyUnknown')}
              </p>
              {application.ctc_amount !== null && application.ctc_multiplier && (
                <span className="shrink-0 font-mono text-xs font-bold text-ink">
                  {application.ctc_amount}
                  {application.ctc_multiplier}
                </span>
              )}
            </div>
            <p className="truncate font-mono text-xs text-ink-soft">
              {role || t('tracker.card.roleUnknown')}
            </p>
            {application.interview_rounds.length > 0 && (
              <div
                className="mt-2 flex items-center gap-2"
                aria-label={t('tracker.card.interviewProgress')}
              >
                <div className="flex min-w-0 flex-1 gap-1">
                  {application.interview_rounds.map((round, index) => {
                    const filled = isCompleted(round.scheduled_at) && round.probability !== null;
                    return (
                      <span
                        key={`${round.round_name}-${index}`}
                        className="h-1.5 min-w-4 flex-1 border border-black/10"
                        style={{
                          backgroundColor: filled
                            ? probabilityColor(round.probability!)
                            : '#D1D5DB',
                        }}
                        title={`${round.round_name}: ${
                          filled ? `${round.probability}%` : t('tracker.card.interviewPending')
                        }`}
                      />
                    );
                  })}
                </div>
                {averageProbability !== null && (
                  <span className="shrink-0 font-mono text-[10px] text-steel-grey">
                    {t('tracker.card.interviewAverage', { value: averageProbability })}
                  </span>
                )}
              </div>
            )}
            {application.applied_at && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-steel-grey">
                {new Date(application.applied_at).toLocaleDateString()}
              </p>
            )}
            {sharedResume && (
              <span className="mt-1 inline-flex items-center gap-1 border border-black bg-paper-tint px-1 font-mono text-[10px] uppercase text-ink-soft">
                <Layers className="h-3 w-3" />
                {t('tracker.card.sharedResume')}
              </span>
            )}
          </button>

          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab text-steel-grey hover:text-ink active:cursor-grabbing"
            aria-label={t('tracker.card.dragAria')}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
