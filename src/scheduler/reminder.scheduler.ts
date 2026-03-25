import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { AppConfigService } from '../config/app-config.service';
import { CalendarService } from '../calendar/calendar.service';
import { TelegramService } from '../telegram/telegram.service';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);

  constructor(
    private readonly calendarService: CalendarService,
    private readonly telegramService: TelegramService,
    private readonly config: AppConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick() {
    await this.safeExecute('calendar sync', () => this.calendarService.syncCalendar());
    await this.safeExecute('daily summary', () => this.sendDailySummaryIfNeeded());
    await this.safeExecute('reminders', () => this.sendReminders());
  }

  private async sendDailySummaryIfNeeded() {
    const tz = this.config.timezone;
    const nowTz = dayjs().tz(tz);
    const [hourStr, minuteStr] = this.config.dailyReportTime.split(':');

    const reportHour = Number(hourStr);
    const reportMinute = Number(minuteStr);

    if (nowTz.hour() !== reportHour || nowTz.minute() !== reportMinute) {
      return;
    }

    const dayStartUtc = nowTz.startOf('day').utc().toDate();
    const dayEndUtc = nowTz.endOf('day').add(1, 'millisecond').utc().toDate();

    const events = await this.calendarService.getSelectedEventsForUtcRange(dayStartUtc, dayEndUtc);
    const unsent = events.filter((event) => !event.summarySent);

    if (!unsent.length) {
      return;
    }

    const lines = unsent.map((event) => {
      const localTime = dayjs(event.dateUtc).tz(tz).format('HH:mm');
      return `• <b>${event.title}</b> | ${event.country} | ${event.impact} | ${localTime}`;
    });

    const message = [`📅 Daily trading events (${nowTz.format('YYYY-MM-DD')})`, ...lines].join('\n');
    await this.telegramService.sendMessage(message);
    await this.calendarService.markSummarySent(unsent.map((event) => event.id));
  }

  private async sendReminders() {
    const now = dayjs.utc();
    const windowStart = now.add(14, 'minute').toDate();
    const windowEnd = now.add(15, 'minute').toDate();

    const events = await this.calendarService.getReminderCandidates(windowStart, windowEnd);
    const tz = this.config.timezone;

    for (const event of events) {
      const localDateTime = dayjs(event.dateUtc).tz(tz).format('YYYY-MM-DD HH:mm');
      const message = [
        '⏰ Reminder: event in 15 minutes',
        `<b>${event.title}</b>`,
        `${event.country} | ${event.impact}`,
        `Local time (${tz}): ${localDateTime}`,
      ].join('\n');

      await this.telegramService.sendMessage(message);
      await this.calendarService.markReminderSent(event.id);
    }
  }

  private async safeExecute(action: string, fn: () => Promise<unknown>) {
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed ${action}: ${message}`);
    }
  }
}
