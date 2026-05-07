import { IsString, IsUUID, IsOptional, IsObject } from 'class-validator';

export class CreateActivityLogDto {
  @IsString()
  action: string;

  @IsString()
  entityType: string;

  @IsUUID()
  entityId: string;

  @IsUUID()
  organizationId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
