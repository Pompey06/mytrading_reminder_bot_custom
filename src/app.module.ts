import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CalendarService } from './calendar/calendar.service';
import { AppConfigService } from './config/app-config.service';
import { PrismaService } from './prisma/prisma.service';
import { ReminderScheduler } from './scheduler/reminder.scheduler';
import { TelegramService } from './telegram/telegram.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppConfigService,
    PrismaService,
    CalendarService,
    TelegramService,
    ReminderScheduler,
  ],
})
export class AppModule {}
