import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { KidModule } from './kids/kid.module';
import { FreeTrialModule } from './free-trial/free-trial.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { BookingsModule } from './bookings/bookings.module';
import { MinioModule } from './minio/minio.module';
import { LessonsModule } from './lessons/lessons.module';
import { AgoraModule } from './agora/agora.module';
import { PaymentsModule } from './payments/payments.module';

import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User],
      autoLoadEntities: true,
      synchronize: false,
    }),
    UsersModule,
    AuthModule,
    KidModule,
    FreeTrialModule,
    SubscriptionsModule,
    BookingsModule,
    MinioModule,
    LessonsModule,
    AgoraModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
