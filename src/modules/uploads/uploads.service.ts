import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UploadedFileDto } from './dto/uploaded-file.dto';

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UploadsService {
  private readonly dir: string;
  private readonly servePath: string;

  constructor(config: ConfigService) {
    this.dir = resolve(config.get<string>('upload.dir') ?? 'uploads');
    this.servePath = config.get<string>('upload.servePath') ?? '/uploads';
  }

  async save(file: Express.Multer.File): Promise<UploadedFileDto> {
    await mkdir(this.dir, { recursive: true });
    const extension = EXTENSION_BY_MIME[file.mimetype] ?? 'bin';
    const fileName = `${randomUUID()}.${extension}`;
    await writeFile(join(this.dir, fileName), file.buffer);

    return {
      url: `${this.servePath}/${fileName}`,
      fileName,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
