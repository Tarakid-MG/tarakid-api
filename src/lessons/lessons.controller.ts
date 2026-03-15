import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { KidLevel } from '../kids/kid.entity';
import { CreateLessonDto, CreateLessonsBulkDto } from './dto/create-lesson.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Lesson } from './entities/lesson.entity';
import { Unit } from './entities/unit.entity';

@ApiTags('lessons')
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

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a lesson (e.g. set content link after seeding)',
  })
  @ApiParam({ name: 'id', description: 'The ID of the lesson' })
  @ApiOkResponse({ type: Lesson })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return await this.lessonsService.updateLesson(id, updateLessonDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lesson' })
  @ApiCreatedResponse({
    type: Lesson,
    description: 'The lesson has been successfully created',
  })
  async create(@Body() createLessonDto: CreateLessonDto) {
    return await this.lessonsService.createLesson(createLessonDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create lessons' })
  @ApiCreatedResponse({
    type: [Lesson],
    description: 'The lessons have been successfully created',
  })
  async createBulk(@Body() createLessonsBulkDto: CreateLessonsBulkDto) {
    return await this.lessonsService.createLessonsBulk(
      createLessonsBulkDto.lessons,
    );
  }

  @Post('units')
  @ApiOperation({ summary: 'Create a single unit' })
  @ApiCreatedResponse({ type: Unit, description: 'Unit successfully created' })
  async createUnit(@Body() createUnitDto: CreateUnitDto) {
    return await this.lessonsService.createUnit(createUnitDto);
  }

  @Post('seed/:level')
  @ApiOperation({
    summary: 'Seed an entire level with 7 units and 4 lessons each',
  })
  @ApiParam({ name: 'level', enum: KidLevel, description: 'Level to seed' })
  @ApiCreatedResponse({
    type: [Unit],
    description: 'Returns all created units with their lessons',
  })
  async seedLevel(@Param('level') level: KidLevel) {
    return await this.lessonsService.seedLevel(level);
  }
}
