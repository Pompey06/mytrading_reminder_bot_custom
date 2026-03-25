import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get calendarUrl(): string {
    return this.getRequired('CALENDAR_URL');
  }

  get telegramToken(): string {
    return this.getRequired('TELEGRAM_TOKEN');
  }

  get telegramChatId(): string {
    return this.getRequired('TELEGRAM_CHAT_ID');
  }

  get timezone(): string {
    return this.configService.get<string>('TIMEZONE') ?? 'UTC';
  }

  get dailyReportTime(): string {
    return this.configService.get<string>('DAILY_REPORT_TIME') ?? '08:00';
  }

  get filterCountries(): string[] {
    return this.getCsv('FILTER_COUNTRIES');
  }

  get filterImpacts(): string[] {
    return this.getCsv('FILTER_IMPACTS').map((x) => x.toLowerCase());
  }

  get filterIncludeKeywords(): string[] {
    return this.getCsv('FILTER_INCLUDE_KEYWORDS').map((x) => x.toLowerCase());
  }

  get filterExcludeKeywords(): string[] {
    return this.getCsv('FILTER_EXCLUDE_KEYWORDS').map((x) => x.toLowerCase());
  }

  private getCsv(key: string): string[] {
    return (this.configService.get<string>(key) ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private getRequired(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required env variable: ${key}`);
    }

    return value;
  }
}
