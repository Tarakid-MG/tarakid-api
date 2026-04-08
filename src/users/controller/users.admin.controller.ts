import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from '../users.service';
import { CreateTeacherDto } from '../dto/create-teacher.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Admin - Users')
@Controller('users/admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create-teacher')
  @ApiOperation({ summary: 'Create a new teacher account (Admin only)' })
  @ApiBody({ type: CreateTeacherDto })
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.usersService.createTeacher(dto);
  }

  @Get('teachers')
  @ApiOperation({ summary: 'List all teachers (Admin only)' })
  findAllTeachers() {
    return this.usersService.findAllTeachers();
  }

  @Patch('teachers/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate a teacher account (Admin only)' })
  deactivateTeacher(@Param('id') id: string) {
    return this.usersService.deactivateUser(+id);
  }

  @Patch('teachers/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a teacher account (Admin only)' })
  reactivateTeacher(@Param('id') id: string) {
    return this.usersService.reactivateUser(+id);
  }

  // --- Client Management ---

  @Get('clients')
  @ApiOperation({ summary: 'List all clients with kids (Admin only)' })
  findAllClients() {
    return this.usersService.findAllClients();
  }

  @Patch('clients/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate a client account (Admin only)' })
  deactivateClient(@Param('id') id: string) {
    return this.usersService.deactivateUser(+id);
  }

  @Patch('clients/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a client account (Admin only)' })
  reactivateClient(@Param('id') id: string) {
    return this.usersService.reactivateUser(+id);
  }

  @Patch('teachers/:id')
  @ApiOperation({ summary: 'Update a teacher account (Admin only)' })
  updateTeacher(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(+id, dto);
  }
}
