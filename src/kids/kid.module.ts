import { Module } from '@nestjs/common';
import { KidService } from './kid.service';
import { KidsController } from './kids.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kid } from './kid.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Kid])],
  providers: [KidService],
  controllers: [KidsController],
  exports: [KidService],
})
export class KidModule {}
