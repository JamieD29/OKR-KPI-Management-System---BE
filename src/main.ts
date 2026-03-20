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
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://performance-management-system-fe.vercel.app',
  ];

  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép nếu không có origin (như Postman) hoặc origin nằm trong danh sách
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Cho phép gửi cookie/token xác thực
  });
  // --- KẾT THÚC ĐOẠN CẦN THÊM ---

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
