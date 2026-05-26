import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('feedback')
@Controller('feedback')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Create lesson feedback for a booking' })
  async create(@Body() dto: CreateFeedbackDto, @Req() req: RequestWithUser) {
    return await this.feedbackService.create(dto, req.user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all lesson feedback for admins' })
  async findAll() {
    return await this.feedbackService.findAll();
  }

  @Get('unread-count')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get unread feedback count for admins' })
  async getUnreadCount() {
    return { count: await this.feedbackService.getUnreadCount() };
  }

  @Patch('read-all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark all feedback as read' })
  async markAllAsRead() {
    await this.feedbackService.markAllAsRead();
    return { success: true };
  }
}
