import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'trading-reminder-bot',
      timestamp: new Date().toISOString(),
    };
  }
}
