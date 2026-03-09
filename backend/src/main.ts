import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Habilita CORS para o Frontend (Porta 3001 ou similar)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. Aumenta limite de JSON para aceitar arquivos de folha convertidos
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(process.env.PORT ?? 3000);
  console.log(`--- BACKEND Lola ON: Port ${process.env.PORT ?? 3000} ---`);
}
bootstrap();
