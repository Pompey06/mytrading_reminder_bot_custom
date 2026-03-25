import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: AppConfigService,
  ) {}

  async sendMessage(text: string): Promise<void> {
    const token = this.config.telegramToken;
    const chatId = this.config.telegramChatId;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    await firstValueFrom(
      this.httpService.post(url, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    );

    this.logger.log('Telegram message sent');
  }
}
