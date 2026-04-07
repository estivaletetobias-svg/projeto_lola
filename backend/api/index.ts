import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { json, urlencoded } from 'express';

let app: any;

export default async function handler(req: any, res: any) {
  try {
    if (!app) {
      app = await NestFactory.create(AppModule);
      
      app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
      });

      app.use(json({ limit: '50mb' }));
      app.use(urlencoded({ limit: '50mb', extended: true }));
      
      await app.init();
    }
    
    const instance = app.getHttpAdapter().getInstance();
    return instance(req, res);
  } catch (err: any) {
    console.error('🔴 VERCEL NESTJS BOOTSTRAP CRASH:', err);
    return res.status(500).json({ 
      error: 'CRITICAL_BOOTSTRAP_FAILURE', 
      message: err.message, 
      stack: err.stack 
    });
  }
}
