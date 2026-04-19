import { Module } from '@nestjs/common';
import { KidService } from './kid.service';
import { KidsController } from './kids.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kid } from './kid.entity';
import { LevelRule } from '../lessons/entities/level-rule.entity';
import { Level } from '../lessons/entities/level.entity';
import { KidLevelHistory } from './entities/kid-level-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Kid, LevelRule, Level, KidLevelHistory])],
  providers: [KidService],
  controllers: [KidsController],
  exports: [KidService],
})
export class KidModule {}
