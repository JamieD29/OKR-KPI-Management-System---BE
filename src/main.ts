import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- BẮT ĐẦU ĐOẠN CẦN THÊM ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các trường thừa không có trong DTO
      forbidNonWhitelisted: false, // Báo lỗi nếu gửi trường linh tinh lên
      transform: true, // Tự động chuyển đổi kiểu dữ liệu (VD: chuỗi "1" -> số 1)
    }),
  );
  app.enableCors({
    origin: true, // Cho phép tất cả các port (5173, 5174...) đều gọi được
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Cho phép gửi cookie/token xác thực
  });
  // --- KẾT THÚC ĐOẠN CẦN THÊM ---

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
