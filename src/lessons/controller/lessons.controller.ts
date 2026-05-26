import { Controller, Get, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { LessonsService } from '../lessons.service';
import { KidLevel } from '../../kids/enums/kid-level.enum';
import { Lesson } from '../entities/lesson.entity';
import { Unit } from '../entities/unit.entity';

@ApiTags('Client - Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('units/:level')
  @ApiOperation({ summary: 'Get all units for a specific kid level' })
  @ApiParam({
    name: 'level',
    enum: KidLevel,
    description: 'The level of the kid',
  })
  @ApiOkResponse({
    type: [Unit],
    description: 'Returns an array of units with their lessons',
  })
  async getUnits(@Param('level') level: KidLevel) {
    return await this.lessonsService.getUnitsByLevel(level);
  }

  @Get('kid/:kidId/level/:level')
  @ApiOperation({
    summary:
      'Get all lessons for a kid at a specific level, including lock status',
  })
  @ApiParam({ name: 'kidId', description: 'The ID of the kid' })
  @ApiParam({
    name: 'level',
    enum: KidLevel,
    description: 'The level of the kid',
  })
  @ApiOkResponse({
    description: 'Returns units and lessons with isLocked property',
  })
  async getLessonsForKid(
    @Param('kidId') kidId: string,
    @Param('level') level: KidLevel,
  ) {
    return await this.lessonsService.getLessonsByKidAndLevel(kidId, level);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single lesson by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the lesson' })
  @ApiOkResponse({ type: Lesson })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async getLesson(@Param('id') id: string) {
    return await this.lessonsService.getLessonById(id);
  }

  @Get('revision-assets/:bucketName')
  @ApiOperation({
    summary: 'List lesson revision image assets from a MinIO bucket',
  })
  @ApiParam({ name: 'bucketName', description: 'MinIO bucket name' })
  async getRevisionAssets(@Param('bucketName') bucketName: string) {
    return await this.lessonsService.getRevisionAssets(bucketName);
  }
}
