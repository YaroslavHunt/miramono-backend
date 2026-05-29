import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { Article } from './entities/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article])],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
