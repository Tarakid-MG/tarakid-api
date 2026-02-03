import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KidService } from './kid.service';
import { CreateKidDto } from './dto/create-kid.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Kids')
@Controller('kids')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KidsController {
  constructor(private readonly kidService: KidService) {}

  @Post()
  @ApiOperation({ summary: 'Add a kid to the current user (Complete Quiz)' })
  async create(@Req() req: any, @Body() dto: CreateKidDto) {
    return this.kidService.create(req.user, dto);
  }
}
