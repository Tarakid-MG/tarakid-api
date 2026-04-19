import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kid } from './kid.entity';
import { EnglishLevel } from './enums/english-level.enum';
import { KidLevel } from './enums/kid-level.enum';
import { LevelRule } from '../lessons/entities/level-rule.entity';
import { Level } from '../lessons/entities/level.entity';

import { CreateKidDto } from './dto/create-kid.dto';
import { UpdateKidDto } from './dto/update-kid.dto';
import { User } from '../users/user.entity';

import { KidLevelHistory } from './entities/kid-level-history.entity';

@Injectable()
export class KidService {
  constructor(
    @InjectRepository(Kid)
    private kidRepo: Repository<Kid>,
    @InjectRepository(LevelRule)
    private ruleRepo: Repository<LevelRule>,
    @InjectRepository(Level)
    private levelRepo: Repository<Level>,
    @InjectRepository(KidLevelHistory)
    private historyRepo: Repository<KidLevelHistory>,
  ) {}

  async calculateLevel(
    ageInput: number,
    reading: EnglishLevel,
    speaking: EnglishLevel,
  ): Promise<KidLevel> {
    const age = Number(ageInput);
    const rules = await this.ruleRepo.find({ order: { priority: 'ASC' } });

    for (const rule of rules) {
      // Check age
      let ageMatch = true;
      if (rule.minAge !== null && age < rule.minAge) ageMatch = false;
      if (rule.maxAge !== null && age > rule.maxAge) ageMatch = false;

      if (!ageMatch) continue;

      // Check skills
      const readingMatch =
        !rule.englishReadingLevels?.length ||
        rule.englishReadingLevels.includes(reading);
      const speakingMatch =
        !rule.englishSpeakingLevels?.length ||
        rule.englishSpeakingLevels.includes(speaking);

      let skillMatch = false;
      if (rule.operator === 'AND') {
        skillMatch = readingMatch && speakingMatch;
      } else {
        // If everything is empty, it's a catch-all for that age
        if (
          !rule.englishReadingLevels?.length &&
          !rule.englishSpeakingLevels?.length
        ) {
          skillMatch = true;
        } else {
          skillMatch = readingMatch || speakingMatch;
        }
      }

      if (skillMatch) {
        return rule.targetLevelCode;
      }
    }

    return KidLevel.L0;
  }

  async findById(id: string): Promise<Kid> {
    const kid = await this.kidRepo.findOne({
      where: { id },
      relations: ['user', 'levelEntity'],
    });
    if (!kid) throw new NotFoundException('Enfant non trouvé');
    return kid;
  }

  async create(user: User, dto: CreateKidDto): Promise<Kid> {
    const levelCode = await this.calculateLevel(
      dto.age,
      dto.englishReadingLevel,
      dto.englishSpeakingLevel,
    );

    const levelEntity = await this.levelRepo.findOne({
      where: { code: levelCode },
    });

    const kid = this.kidRepo.create({
      ...dto,
      name: dto.childName,
      level: levelCode,
      levelEntity: levelEntity as Level,
      user,
    });
    return this.kidRepo.save(kid);
  }

  async update(id: string, dto: UpdateKidDto, performer?: User): Promise<Kid> {
    const kid = await this.findById(id);

    // Update basic info
    if (dto.name) {
      kid.name = dto.name;
    }
    if (dto.age) {
      kid.age = dto.age;
    }
    if (dto.gender) kid.gender = dto.gender;
    if (dto.motherTongueSpeakingLevel)
      kid.motherTongueSpeakingLevel = dto.motherTongueSpeakingLevel;
    if (dto.motherTongueReadingLevel)
      kid.motherTongueReadingLevel = dto.motherTongueReadingLevel;
    if (dto.englishReadingLevel)
      kid.englishReadingLevel = dto.englishReadingLevel;
    if (dto.englishSpeakingLevel)
      kid.englishSpeakingLevel = dto.englishSpeakingLevel;
    if (dto.learningDuration) kid.learningDuration = dto.learningDuration;
    if (dto.hobbies) kid.hobbies = dto.hobbies;

    // Recalculate level if any level-impacting fields changed OR use the override level from DTO
    let newLevelCode = dto.level;
    if (!newLevelCode) {
      newLevelCode = await this.calculateLevel(
        kid.age,
        kid.englishReadingLevel,
        kid.englishSpeakingLevel,
      );
    }

    if (String(kid.level) !== String(newLevelCode)) {
      const oldLevel = kid.level;
      kid.level = newLevelCode;
      kid.levelEntity = (await this.levelRepo.findOne({
        where: { code: newLevelCode },
      })) as Level;

      // Log history if level changed
      if (performer) {
        await this.historyRepo.save({
          kidId: kid.id,
          performerId: performer.id,
          oldLevel,
          newLevel: newLevelCode,
          reason: dto.level
            ? dto.reason || 'Aucun motif fourni'
            : 'Replanification automatique (ex: âge/quiz)',
        });
      }
    }

    return this.kidRepo.save(kid);
  }

  async getLevelHistory(kidId: string): Promise<KidLevelHistory[]> {
    return this.historyRepo.find({
      where: { kidId },
      relations: ['performer'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<Kid> {
    const kid = await this.findById(id);
    kid.avatarUrl = avatarUrl;
    return this.kidRepo.save(kid);
  }

  async getLevel(id: string): Promise<KidLevel> {
    const kid = await this.findById(id);
    return kid.level;
  }

  async addStar(id: string): Promise<Kid> {
    const kid = await this.findById(id);
    kid.stars = (kid.stars || 0) + 1;
    return this.kidRepo.save(kid);
  }
}
