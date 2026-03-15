import {
  Controller,
  Get,
  Patch,
  Body,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
//import { RolesGuard } from '../auth/guards/roles.guard';
//import { Roles } from '../auth/decorators/roles.decorator';
//import { UserRole } from './enums/user-role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { User } from './user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Req() req: RequestWithUser) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  updateProfile(@Req() req: RequestWithUser, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @Post('admin/create-teacher')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  //@Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new teacher account (Admin only)' })
  @ApiBody({ type: CreateTeacherDto })
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.usersService.createTeacher(dto);
  }
}
