import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { TaxCalculationModule } from "./tax-calculation/tax-calculation.module";
import { IncomeModule } from "./income/income.module";
import { BusinessModule } from "./business/business.module";
import { InvoiceModule } from "./invoice/invoice.module";
import { VATModule } from "./vat/vat.module";
import { ComplianceModule } from "./compliance/compliance.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { LearningModule } from "./learning/learning.module";
import { ForumModule } from "./forum/forum.module";
import { DocumentsModule } from "./documents/documents.module";
import { TaxReturnModule } from "./tax-return/tax-return.module";
import { CapitalInvestmentModule } from "./capital-investment/capital-investment.module";
import { DonationsModule } from "./donations/donations.module";
import { TaxConfigModule } from "./tax-config/tax-config.module";
import { AuditModule } from "./audit/audit.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { dataSourceOptions } from "./config/typeorm.config";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => dataSourceOptions,
    }),

    // Redis Cache
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get("REDIS_HOST"),
            port: configService.get("REDIS_PORT"),
          },
          password: configService.get("REDIS_PASSWORD") || undefined,
          database: configService.get("REDIS_DB", 0),
          ttl: configService.get("REDIS_TTL", 3600) * 1000,
        }),
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get("THROTTLE_TTL", 60) * 1000,
          limit: configService.get("THROTTLE_LIMIT", 10),
        },
      ],
      inject: [ConfigService],
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    TaxCalculationModule,
    IncomeModule,
    BusinessModule,
    InvoiceModule,
    VATModule,
    ComplianceModule,
    NotificationsModule,
    LearningModule,
    ForumModule,
    DocumentsModule,
    TaxReturnModule,
    CapitalInvestmentModule,
    DonationsModule,
    TaxConfigModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
