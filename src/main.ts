import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setupSwagger } from './setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.enableCors({
    origin: [
      process.env.WEB_URL,
      'http://localhost:5173',
      'http://192.168.1.121:5173',
      'https://192.168.1.121:5173',
    ].filter((val): val is string => !!val),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3002);
}

void bootstrap();
