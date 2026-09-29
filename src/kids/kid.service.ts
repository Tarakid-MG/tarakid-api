import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { Gender } from './enums/kid-gender.enum';
import { MinioService } from '../minio/minio.service';

export interface KidAvatarOption {
  key: string;
  url: string;
  cost: number;
  owned: boolean;
  selected: boolean;
  label: string;
}

@Injectable()
export class KidService {
  private readonly avatarBucket = 'profilephoto';
  private readonly freeAvatarCount = 6;
  private readonly premiumAvatarCost = 10;

  constructor(
    @InjectRepository(Kid)
    private kidRepo: Repository<Kid>,
    @InjectRepository(LevelRule)
    private ruleRepo: Repository<LevelRule>,
    @InjectRepository(Level)
    private levelRepo: Repository<Level>,
    @InjectRepository(KidLevelHistory)
    private historyRepo: Repository<KidLevelHistory>,
    private readonly minioService: MinioService,
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
    const existingKid = await this.kidRepo.findOne({
      where: { id },
      relations: ['user', 'levelEntity'],
    });
    if (!existingKid) throw new NotFoundException('Enfant non trouvé');

    const kid = await this.ensureDefaultAvatar(existingKid);
    return this.hydrateAvatarUrl(kid);
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
    const savedKid = await this.kidRepo.save(kid);

    try {
      return await this.findById(savedKid.id);
    } catch (error) {
      console.error('Failed to assign default avatar', error);
      return savedKid;
    }
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
    kid.avatarKey = undefined;
    kid.avatarUrl = avatarUrl;
    return this.kidRepo.save(kid);
  }

  async listAvatarOptions(id: string): Promise<KidAvatarOption[]> {
    const kid = await this.findById(id);
    const avatarKeys = await this.getAvatarKeysForKid(kid);
    const purchasedKeys = new Set(kid.purchasedAvatarKeys || []);

    return Promise.all(
      avatarKeys.map(async (key, index) => {
        const cost = this.getAvatarCost(index);
        return {
          key,
          url: await this.minioService.getFileUrl(this.avatarBucket, key),
          cost,
          owned:
            cost === 0 || purchasedKeys.has(key) || kid.avatarKey === key,
          selected: kid.avatarKey === key,
          label: this.getAvatarLabel(key, index),
        };
      }),
    );
  }

  async selectAvatar(id: string, avatarKey: string): Promise<Kid> {
    const kid = await this.findById(id);
    const avatarKeys = await this.getAvatarKeysForKid(kid);
    const avatarIndex = avatarKeys.indexOf(avatarKey);

    if (avatarIndex === -1) {
      throw new BadRequestException('Avatar invalide pour cet enfant');
    }

    const cost = this.getAvatarCost(avatarIndex);
    const purchasedKeys = new Set(kid.purchasedAvatarKeys || []);
    const alreadyOwned =
      cost === 0 || purchasedKeys.has(avatarKey) || kid.avatarKey === avatarKey;

    if (!alreadyOwned) {
      if ((kid.stars || 0) < cost) {
        throw new BadRequestException("Pas assez d'étoiles pour cet avatar");
      }
      kid.stars = (kid.stars || 0) - cost;
      purchasedKeys.add(avatarKey);
      kid.purchasedAvatarKeys = Array.from(purchasedKeys);
    }

    kid.avatarKey = avatarKey;
    kid.avatarUrl = await this.minioService.getFileUrl(
      this.avatarBucket,
      avatarKey,
    );

    const savedKid = await this.kidRepo.save(kid);
    return this.hydrateAvatarUrl(savedKid);
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

  private getAvatarFolder(gender?: Gender): string {
    return gender === Gender.GIRL ? 'girl' : 'boy';
  }

  private getAvatarCost(index: number): number {
    return index < this.freeAvatarCount ? 0 : this.premiumAvatarCost;
  }

  private getAvatarLabel(key: string, index: number): string {
    const fileName = key.split('/').pop()?.split('.')[0] || String(index + 1);
    return `Avatar ${fileName}`;
  }

  private async getAvatarKeysForKid(kid: Kid): Promise<string[]> {
    const prefix = `${this.getAvatarFolder(kid.gender)}/`;
    return (await this.minioService.listObjects(this.avatarBucket, prefix)).filter(
      (key) => !key.endsWith('/'),
    );
  }

  private async ensureDefaultAvatar(kid: Kid): Promise<Kid> {
    if (kid.avatarKey || kid.avatarUrl) {
      return kid;
    }

    try {
      const avatarKeys = await this.getAvatarKeysForKid(kid);
      const freeAvatars = avatarKeys.slice(
        0,
        Math.min(this.freeAvatarCount, avatarKeys.length),
      );

      if (freeAvatars.length === 0) {
        return kid;
      }

      const randomKey =
        freeAvatars[Math.floor(Math.random() * freeAvatars.length)];
      kid.avatarKey = randomKey;
      kid.avatarUrl = await this.minioService.getFileUrl(
        this.avatarBucket,
        randomKey,
      );
      kid.purchasedAvatarKeys = kid.purchasedAvatarKeys || [];
      return this.kidRepo.save(kid);
    } catch (error) {
      console.error('Failed to auto-assign kid avatar', error);
      return kid;
    }
  }

  private async hydrateAvatarUrl(kid: Kid): Promise<Kid> {
    if (!kid.avatarKey) {
      return kid;
    }

    try {
      kid.avatarUrl = await this.minioService.getFileUrl(
        this.avatarBucket,
        kid.avatarKey,
      );
    } catch (error) {
      console.error('Failed to refresh kid avatar URL', error);
    }

    return kid;
  }
}
