import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ClientAccountType } from '../../users/enums/client-account-type.enum';

export class RegisterDto {

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8  })
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ enum: ClientAccountType, required: false })
  @IsOptional()
  @IsEnum(ClientAccountType)
  accountType?: ClientAccountType;
}
