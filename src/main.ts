import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); // ✅ add this
  // ✅ enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip out unexpected fields
      forbidNonWhitelisted: true, // throw error if extra fields exist
      transform: true, // automatically transform to DTO type
    }),
  );
  
  await app.listen(3030);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
