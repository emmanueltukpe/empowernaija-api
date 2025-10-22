import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import * as compression from "compression";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get("FRONTEND_URL"),
    credentials: true,
  });

  // Global prefix
  const apiPrefix = configService.get("API_PREFIX", "api");
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("EmpowerNaija API")
    .setDescription("Tax Compliance & Empowerment Platform API Documentation")
    .setVersion("1.0")
    .addTag("auth", "Authentication endpoints")
    .addTag("users", "User management")
    .addTag("tax-calculation", "Tax calculation engine")
    .addTag("income", "Income tracking")
    .addTag("business", "Business management")
    .addTag("invoices", "Invoice generation")
    .addTag("vat", "VAT calculations")
    .addTag("compliance", "Compliance tracking")
    .addTag("notifications", "Notification system")
    .addTag("learning", "Learning hub")
    .addTag("forum", "Community forum")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  const port = configService.get("PORT", 3000);
  await app.listen(port);

  console.log(`
    🚀 Application is running on: http://localhost:${port}/${apiPrefix}
    📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs
  `);
}

bootstrap();
