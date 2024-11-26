import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });

  const config = new DocumentBuilder()
    .setTitle('패스트캠프 코팩 넷플릭스')
    .setDescription('코드팩토리 NestJs 강의!')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        // 클래스에 적혀있는 타입스크립트 기반으로 우리가 입력한 것을 변경해라
        // url -> str이지만 숫자로 알아서 바꿔라
        enableImplicitConversion: true,
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

/* 
   *version*

    global하게
  app.setGlobalPrefix('v1');

  controller단 url로 가능
  app.enableVersioning({
    type: VersioningType.URI,
  });

  헤더에 version넣어서 하는 방법
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'version',
  });

  headers에 Accept : application/json;v=1
  이런 형식으로 가능함

  이게 보편적이라고는 함
  app.enableVersioning({
    type: VersioningType.MEDIA_TYPE,
    key: 'v=',
  });
  
  */
