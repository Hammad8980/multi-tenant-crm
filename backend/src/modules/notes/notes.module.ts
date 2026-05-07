import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

import { Note } from './entities/note.entity';
import { Customer } from '../customers/entities/customer.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Note, Customer]), ActivityLogModule],

  controllers: [NotesController],

  providers: [NotesService],

  exports: [NotesService],
})
export class NotesModule {}