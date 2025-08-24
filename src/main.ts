import { ValidationPipe } from '@nestjs/common'; 
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));
  const port = process.env.PORT || 3100;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
