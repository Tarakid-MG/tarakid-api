import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ClientAccountType } from '../../users/enums/client-account-type.enum';
import { CreateKidDto } from '../../kids/dto/create-kid.dto.js';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ enum: ClientAccountType, required: false })
  @IsOptional()
  @IsEnum(ClientAccountType)
  accountType?: ClientAccountType;

  @ApiProperty({ type: CreateKidDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateKidDto)
  kidInfo?: CreateKidDto;
}
