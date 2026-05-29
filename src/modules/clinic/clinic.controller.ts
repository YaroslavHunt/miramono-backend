import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ClinicService } from './clinic.service';
import { UpdateClinicInfoDto } from './dto/update-clinic-info.dto';
import { ClinicInfo } from './entities/clinic-info.entity';

@ApiTags('clinic')
@Controller('clinic-info')
export class ClinicController {
  constructor(private readonly clinic: ClinicService) {}

  @Public()
  @Get()
  get(): Promise<ClinicInfo | null> {
    return this.clinic.get();
  }

  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Put()
  upsert(@Body() dto: UpdateClinicInfoDto): Promise<ClinicInfo> {
    return this.clinic.upsert(dto);
  }
}
