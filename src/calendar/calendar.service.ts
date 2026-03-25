import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { ParsedCalendarEvent, RawCalendarEvent } from './calendar.types';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async syncCalendar(): Promise<number> {
    const payload = await this.fetchCalendarPayload();
    const rawEvents = this.extractEvents(payload);

    let upserted = 0;
    for (const rawEvent of rawEvents) {
      const parsed = this.parseEvent(rawEvent);
      if (!parsed) {
        continue;
      }

      await this.prisma.calendarEvent.upsert({
        where: { externalId: parsed.externalId },
        create: parsed,
        update: {
          title: parsed.title,
          country: parsed.country,
          impact: parsed.impact,
          dateUtc: parsed.dateUtc,
          forecast: parsed.forecast,
          previous: parsed.previous,
          rawData: parsed.rawData,
          isSelected: parsed.isSelected,
        },
      });
      upserted += 1;
    }

    this.logger.log(`Calendar sync finished. Upserted: ${upserted}`);
    return upserted;
  }

  async getSelectedEventsForUtcRange(rangeStart: Date, rangeEnd: Date) {
    return this.prisma.calendarEvent.findMany({
      where: {
        isSelected: true,
        dateUtc: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },
      orderBy: {
        dateUtc: 'asc',
      },
    });
  }

  async getReminderCandidates(fromUtc: Date, toUtc: Date) {
    return this.prisma.calendarEvent.findMany({
      where: {
        isSelected: true,
        reminderSent: false,
        dateUtc: {
          gte: fromUtc,
          lt: toUtc,
        },
      },
      orderBy: {
        dateUtc: 'asc',
      },
    });
  }

  async markSummarySent(eventIds: number[]) {
    if (!eventIds.length) {
      return;
    }

    await this.prisma.calendarEvent.updateMany({
      where: { id: { in: eventIds } },
      data: { summarySent: true },
    });
  }

  async markReminderSent(eventId: number) {
    await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: { reminderSent: true },
    });
  }

  private async fetchCalendarPayload(): Promise<unknown> {
    const response = await firstValueFrom(this.httpService.get(this.config.calendarUrl));
    return response.data;
  }

  private extractEvents(payload: unknown): RawCalendarEvent[] {
    if (Array.isArray(payload)) {
      return payload as RawCalendarEvent[];
    }

    if (payload && typeof payload === 'object') {
      const data = payload as Record<string, unknown>;
      const variants = ['events', 'data', 'results', 'calendar'];

      for (const key of variants) {
        if (Array.isArray(data[key])) {
          return data[key] as RawCalendarEvent[];
        }
      }
    }

    this.logger.warn('Calendar payload format is unsupported. Returning empty list.');
    return [];
  }

  private parseEvent(rawEvent: RawCalendarEvent): ParsedCalendarEvent | null {
    const title = (rawEvent.title ?? rawEvent.event ?? rawEvent.name ?? '').toString().trim();
    const country = (rawEvent.country ?? '').toString().trim();
    const impact = (rawEvent.impact ?? '').toString().trim();
    const dateSource = rawEvent.dateUtc ?? rawEvent.datetime ?? rawEvent.date;
    const dateUtc = dateSource ? new Date(dateSource.toString()) : null;

    if (!title || !country || !impact || !dateUtc || Number.isNaN(dateUtc.getTime())) {
      return null;
    }

    const externalId =
      rawEvent.id?.toString() ?? `${title}_${country}_${impact}_${dateUtc.toISOString()}`;

    return {
      externalId,
      title,
      country,
      impact,
      dateUtc,
      forecast: rawEvent.forecast?.toString() ?? null,
      previous: rawEvent.previous?.toString() ?? null,
      rawData: JSON.stringify(rawEvent),
      isSelected: this.matchesFilters({ title, country, impact }),
    };
  }

  private matchesFilters(event: { title: string; country: string; impact: string }): boolean {
    const countries = this.config.filterCountries;
    if (countries.length && !countries.includes(event.country)) {
      return false;
    }

    const impacts = this.config.filterImpacts;
    if (impacts.length && !impacts.includes(event.impact.toLowerCase())) {
      return false;
    }

    const titleLower = event.title.toLowerCase();
    const includeKeywords = this.config.filterIncludeKeywords;
    if (
      includeKeywords.length &&
      !includeKeywords.some((keyword) => titleLower.includes(keyword))
    ) {
      return false;
    }

    const excludeKeywords = this.config.filterExcludeKeywords;
    if (excludeKeywords.some((keyword) => titleLower.includes(keyword))) {
      return false;
    }

    return true;
  }
}
