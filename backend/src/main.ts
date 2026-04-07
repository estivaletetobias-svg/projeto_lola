import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Em ambiente Vercel, o listen não é obrigatório para serveless, 
  // mas ajuda na detecção de porta em outros ambientes
  await app.listen(process.env.PORT ?? 3001);
}

// Exportar para Vercel detectar o servidor
export default async (req: any, res: any) => {
  await bootstrap();
};

bootstrap();
