import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LessonsService } from '../lessons.service';
import { KidLevel } from '../../kids/enums/kid-level.enum';
import {
  CreateLessonDto,
  CreateLessonsBulkDto,
} from '../dto/create-lesson.dto';
import { CreateUnitDto } from '../dto/create-unit.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';
import { Lesson } from '../entities/lesson.entity';
import { Unit } from '../entities/unit.entity';
import { Level } from '../entities/level.entity';
import { LevelRule } from '../entities/level-rule.entity';
import { CreateLevelDto } from '../dto/create-level.dto';
import { CreateLevelRuleDto } from '../dto/create-level-rule.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Admin - Lessons')
@Controller('lessons/admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LessonsAdminController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a lesson (e.g. set content link after seeding)',
  })
  @ApiParam({ name: 'id', description: 'The ID of the lesson' })
  @ApiOkResponse({ type: Lesson })
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

  @Post('delete/:id')
  @ApiOperation({ summary: 'Delete a lesson' })
  async deleteLesson(@Param('id') id: string) {
    return await this.lessonsService.deleteLesson(id);
  }

  @Post(':id/thumbnail')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload lesson thumbnail' })
  async uploadThumbnail(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.lessonsService.uploadThumbnail(id, file);
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

  @Patch('units/:id')
  @ApiOperation({ summary: 'Update a unit' })
  @ApiOkResponse({ type: Unit })
  async updateUnit(
    @Param('id') id: string,
    @Body() dto: Partial<CreateUnitDto>,
  ) {
    return await this.lessonsService.updateUnit(id, dto);
  }

  @Post('units/delete/:id')
  @ApiOperation({ summary: 'Delete a unit' })
  async deleteUnit(@Param('id') id: string) {
    return await this.lessonsService.deleteUnit(id);
  }

  @Get('units/:level')
  @ApiOperation({ summary: 'Get units by level' })
  @ApiParam({ name: 'level', enum: KidLevel })
  @ApiOkResponse({ type: [Unit] })
  async getUnitsByLevel(@Param('level') level: KidLevel) {
    return await this.lessonsService.getUnitsByLevel(level);
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

  @Post('levels')
  @ApiOperation({ summary: 'Create a new level' })
  @ApiCreatedResponse({ type: Level })
  async createLevel(@Body() createLevelDto: CreateLevelDto) {
    return await this.lessonsService.createLevel(createLevelDto);
  }

  @Patch('levels/:id')
  @ApiOperation({ summary: 'Update a level' })
  @ApiOkResponse({ type: Level })
  async updateLevel(
    @Param('id') id: string,
    @Body() updateLevelDto: Partial<CreateLevelDto>,
  ) {
    return await this.lessonsService.updateLevel(id, updateLevelDto);
  }

  @Get('levels')
  @ApiOperation({ summary: 'Get all levels' })
  @ApiOkResponse({ type: [Level] })
  async getLevels() {
    return await this.lessonsService.getLevels();
  }

  @Post('levels/delete/:id') // Using POST for delete to avoid issues with some proxies/setups if needed, or just use DELETE
  @ApiOperation({ summary: 'Delete a level' })
  async deleteLevel(@Param('id') id: string) {
    return await this.lessonsService.deleteLevel(id);
  }

  // ─── Level Rules ─────────────────────────────────────────────────────────────

  @Post('level-rules')
  @ApiOperation({ summary: 'Create a new level rule' })
  @ApiCreatedResponse({ type: LevelRule })
  async createLevelRule(@Body() dto: CreateLevelRuleDto) {
    return await this.lessonsService.createLevelRule(dto);
  }

  @Get('level-rules')
  @ApiOperation({ summary: 'Get all level rules' })
  @ApiOkResponse({ type: [LevelRule] })
  async getLevelRules() {
    return await this.lessonsService.getLevelRules();
  }

  @Patch('level-rules/:id')
  @ApiOperation({ summary: 'Update a level rule' })
  @ApiOkResponse({ type: LevelRule })
  async updateLevelRule(
    @Param('id') id: string,
    @Body() dto: Partial<CreateLevelRuleDto>,
  ) {
    return await this.lessonsService.updateLevelRule(id, dto);
  }

  @Post('level-rules/delete/:id')
  @ApiOperation({ summary: 'Delete a level rule' })
  async deleteLevelRule(@Param('id') id: string) {
    return await this.lessonsService.deleteLevelRule(id);
  }
}
