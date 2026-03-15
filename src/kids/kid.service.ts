import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kid, KidLevel, EnglishLevel } from './kid.entity';
import { CreateKidDto } from './dto/create-kid.dto';
import { UpdateKidDto } from './dto/update-kid.dto';
import { User } from '../users/user.entity';

@Injectable()
export class KidService {
  constructor(
    @InjectRepository(Kid)
    private kidRepo: Repository<Kid>,
  ) {}

  calculateLevel(
    ageInput: number,
    reading: EnglishLevel,
    speaking: EnglishLevel,
  ): KidLevel {
    const age = Number(ageInput);
    let result = KidLevel.L0;

    if (age < 7) {
      if (reading === EnglishLevel.FLUENT && speaking === EnglishLevel.FLUENT) {
        result = KidLevel.L2;
      } else if (
        reading === EnglishLevel.FLUENT ||
        speaking === EnglishLevel.FLUENT ||
        reading === EnglishLevel.SENTENCES ||
        speaking === EnglishLevel.SENTENCES
      ) {
        result = KidLevel.L1;
      } else {
        result = KidLevel.L0;
      }
    } else if (age < 9) {
      if (reading === EnglishLevel.FLUENT && speaking === EnglishLevel.FLUENT) {
        result = KidLevel.L3;
      } else if (
        reading === EnglishLevel.FLUENT ||
        speaking === EnglishLevel.FLUENT ||
        reading === EnglishLevel.SENTENCES ||
        speaking === EnglishLevel.SENTENCES
      ) {
        result = KidLevel.L2;
      } else {
        result = KidLevel.L1;
      }
    } else if (age < 11) {
      if (reading === EnglishLevel.FLUENT && speaking === EnglishLevel.FLUENT) {
        result = KidLevel.L4;
      } else if (
        reading === EnglishLevel.FLUENT ||
        speaking === EnglishLevel.FLUENT ||
        reading === EnglishLevel.SENTENCES ||
        speaking === EnglishLevel.SENTENCES
      ) {
        result = KidLevel.L3;
      } else {
        result = KidLevel.L1;
      }
    } else if (age < 13) {
      if (reading === EnglishLevel.FLUENT && speaking === EnglishLevel.FLUENT) {
        result = KidLevel.L4;
      } else if (
        reading === EnglishLevel.FLUENT ||
        speaking === EnglishLevel.FLUENT ||
        reading === EnglishLevel.SENTENCES ||
        speaking === EnglishLevel.SENTENCES
      ) {
        result = KidLevel.L3;
      } else if (
        reading === EnglishLevel.NONE ||
        speaking === EnglishLevel.NONE
      ) {
        result = KidLevel.L1;
      } else {
        result = KidLevel.L2;
      }
    } else if (age < 15) {
      if (reading === EnglishLevel.FLUENT && speaking === EnglishLevel.FLUENT) {
        result = KidLevel.L4;
      } else if (
        reading === EnglishLevel.FLUENT ||
        speaking === EnglishLevel.FLUENT ||
        reading === EnglishLevel.SENTENCES ||
        speaking === EnglishLevel.SENTENCES ||
        reading === EnglishLevel.WORDS ||
        speaking === EnglishLevel.WORDS
      ) {
        result = KidLevel.L3;
      } else {
        result = KidLevel.L2;
      }
    } else {
      // 15-18+
      if (reading === EnglishLevel.FLUENT && speaking === EnglishLevel.FLUENT) {
        result = KidLevel.L5;
      } else if (
        reading === EnglishLevel.FLUENT ||
        speaking === EnglishLevel.FLUENT ||
        reading === EnglishLevel.SENTENCES ||
        speaking === EnglishLevel.SENTENCES
      ) {
        result = KidLevel.L4;
      } else if (
        reading === EnglishLevel.WORDS ||
        speaking === EnglishLevel.WORDS
      ) {
        result = KidLevel.L3;
      } else {
        result = KidLevel.L2;
      }
    }

    return result;
  }

  async findById(id: string): Promise<Kid> {
    const kid = await this.kidRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!kid) throw new NotFoundException('Enfant non trouvé');
    return kid;
  }

  async create(user: User, dto: CreateKidDto): Promise<Kid> {
    const level = this.calculateLevel(
      dto.age,
      dto.englishReadingLevel,
      dto.englishSpeakingLevel,
    );

    const kid = this.kidRepo.create({
      ...dto,
      name: dto.childName,
      level,
      user,
    });
    return this.kidRepo.save(kid);
  }

  async update(id: string, dto: UpdateKidDto): Promise<Kid> {
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

    // Recalculate level if any level-impacting fields changed
    kid.level = this.calculateLevel(
      kid.age,
      kid.englishReadingLevel,
      kid.englishSpeakingLevel,
    );

    return this.kidRepo.save(kid);
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
}
