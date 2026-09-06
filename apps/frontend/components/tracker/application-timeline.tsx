'use client';

import React from 'react';
import { APPLICATION_STATUS_ORDER, type InterviewRound } from '@/lib/api/tracker';
import { useTranslations } from '@/lib/i18n';

interface ApplicationTimelineProps {
  stageDates: Record<string, string>;
  appliedAt: string | null;
  interviewRounds: InterviewRound[];
  currentStatus: string;
}

interface TimelineEvent {
  label: string;
  date: string;
  isStage: boolean;
}

const daysBetween = (from: string, to: string): number =>
  Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000));

export function ApplicationTimeline({
  stageDates,
  appliedAt,
  interviewRounds,
  currentStatus,
}: ApplicationTimelineProps) {
  const { t } = useTranslations();
  const effectiveStageDates: Record<string, string> = {
    ...stageDates,
    ...(Object.keys(stageDates).length === 0 && appliedAt ? { applied: appliedAt } : {}),
  };
  const currentStageIndex = APPLICATION_STATUS_ORDER.indexOf(currentStatus);
  const interviewStageIndex = APPLICATION_STATUS_ORDER.indexOf('interview');
  const stageEvents: TimelineEvent[] = APPLICATION_STATUS_ORDER.filter(
    (status) => effectiveStageDates[status]
  )
    .map((status) => ({
      label: t(`tracker.columns.${status}`),
      date: effectiveStageDates[status],
      isStage: true,
    }))
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
  const roundEvents: TimelineEvent[] =
    currentStageIndex >= interviewStageIndex && effectiveStageDates.interview
      ? interviewRounds
          .filter((round) => round.scheduled_at)
          .sort(
            (left, right) =>
              new Date(left.scheduled_at as string).getTime() -
              new Date(right.scheduled_at as string).getTime()
          )
          .map((round) => ({
            label: round.round_name,
            date: round.scheduled_at as string,
            isStage: false,
          }))
      : [];
  const interviewEventIndex = stageEvents.findIndex(
    (event) => event.label === t('tracker.columns.interview')
  );
  const events =
    interviewEventIndex >= 0
      ? [
          ...stageEvents.slice(0, interviewEventIndex + 1),
          ...roundEvents,
          ...stageEvents.slice(interviewEventIndex + 1),
        ]
      : stageEvents;

  if (events.length === 0) return null;

  return (
    <section aria-label={t('tracker.timeline.title')} className="border-y border-black py-3">
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wide text-steel-grey">
        {t('tracker.timeline.title')}
      </p>
      <div className="flex w-full flex-wrap items-start gap-y-3 overflow-hidden">
        {events.map((event, index) => {
          const previous = events[index - 1];
          return (
            <React.Fragment key={`${event.label}-${event.date}-${index}`}>
              {index > 0 && (
                <div className="flex w-14 shrink-0 flex-col items-center px-1 pt-2">
                  <div className="h-px w-full bg-black" />
                  <span className="mt-1 font-mono text-[9px] text-steel-grey">
                    {t('tracker.timeline.days', { value: daysBetween(previous.date, event.date) })}
                  </span>
                </div>
              )}
              <div className="w-28 min-w-0 shrink-0 text-center">
                <div
                  className={`mx-auto mb-1 h-2.5 w-2.5 border border-black ${
                    event.isStage ? 'bg-black' : 'bg-background'
                  }`}
                />
                <p
                  className="truncate font-mono text-[10px] font-bold text-ink"
                  title={event.label}
                >
                  {event.label}
                </p>
                <p className="font-mono text-[9px] text-steel-grey">
                  {new Date(event.date).toLocaleDateString()}
                </p>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
