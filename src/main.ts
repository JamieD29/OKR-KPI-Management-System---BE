import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for your frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3001); // Backend runs on port 3001
  console.log('Backend running on http://localhost:3001');
}
bootstrap();
