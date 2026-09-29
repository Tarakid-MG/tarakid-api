import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterService } from '../services/register.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Admin - Auth')
@Controller('auth/admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuthAdminController {
  constructor(private readonly registerService: RegisterService) {}

  @Post('assign-role')
  @ApiOperation({ summary: 'Assign role to user (Admin only)' })
  assignRole(@Body() body: { userId: number; role: UserRole }) {
    return this.registerService.assignRole(body.userId, body.role);
  }
}
