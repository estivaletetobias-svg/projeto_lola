import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

let app: any;

export default async function (req: any, res: any) {
  try {
    if (!app) {
      app = await NestFactory.create(AppModule);
      app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
      });
      await app.init();
    }
    const instance = app.getHttpAdapter().getInstance();
    return instance(req, res);
  } catch (err: any) {
    console.error('NestJS Vercel Serverless Error:', err);
    res.status(500).json({ error: 'Serverless Runtime Error', details: err.message });
  }
}
