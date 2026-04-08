import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KidService } from './kid.service';
import { CreateKidDto } from './dto/create-kid.dto';
import { UpdateKidDto } from './dto/update-kid.dto';
import { Kid } from './kid.entity';
import { MinioService } from '../minio/minio.service';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

interface MulterFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@ApiTags('Client - Kids')
@Controller('kids')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KidsController {
  constructor(
    private readonly kidService: KidService,
    private readonly minioService: MinioService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a kid to the current user (Complete Quiz)' })
  async create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateKidDto,
  ): Promise<Kid> {
    return await this.kidService.create(req.user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a kid profile' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKidDto,
  ): Promise<Kid> {
    return this.kidService.update(id, dto);
  }

  @Get(':id/level')
  @ApiOperation({ summary: "Get a kid's level" })
  async getLevel(@Param('id') id: string) {
    const level = await this.kidService.getLevel(id);
    return { level };
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload kid avatar' })
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
  ): Promise<Kid> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const bucketName = 'avatars';
    const fileName = `kid-${id}-${Date.now()}-${file.originalname}`;
    await this.minioService.uploadFile(
      bucketName,
      fileName,
      file.buffer,
      file.mimetype,
    );
    const avatarUrl = await this.minioService.getFileUrl(bucketName, fileName);
    return await this.kidService.updateAvatar(id, avatarUrl);
  }
}
