import { PartialType } from '@nestjs/swagger';

import { CreateGalleryCaseDto } from './create-gallery-case.dto';

export class UpdateGalleryCaseDto extends PartialType(CreateGalleryCaseDto) {}
