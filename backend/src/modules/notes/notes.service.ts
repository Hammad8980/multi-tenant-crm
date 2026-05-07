import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Customer } from '../customers/entities/customer.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  // CREATE NOTE
  async create(createNoteDto: CreateNoteDto, currentUser: any) {
    // Verify customer exists and belongs to organization
    const customer = await this.customerRepository.findOne({
      where: {
        id: createNoteDto.customerId,
        organizationId: currentUser.organizationId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const note = this.noteRepository.create({
      ...createNoteDto,
      organizationId: currentUser.organizationId,
    });

    const savedNote = await this.noteRepository.save(note);

    // Log activity
    await this.activityLogService.log(
      'note_added',
      'note',
      savedNote.id,
      currentUser.organizationId,
      currentUser.userId,
      { customerId: createNoteDto.customerId, content: createNoteDto.content },
    );

    return savedNote;
  }

  // GET ALL NOTES FOR A CUSTOMER
  async findByCustomer(customerId: string, currentUser: any) {
    // Verify customer belongs to organization
    const customer = await this.customerRepository.findOne({
      where: {
        id: customerId,
        organizationId: currentUser.organizationId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return await this.noteRepository.find({
      where: {
        customerId,
        organizationId: currentUser.organizationId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // GET SINGLE NOTE
  async findOne(id: string, currentUser: any) {
    const note = await this.noteRepository.findOne({
      where: {
        id,
        organizationId: currentUser.organizationId,
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  // UPDATE NOTE
  async update(id: string, updateNoteDto: UpdateNoteDto, currentUser: any) {
    await this.findOne(id, currentUser);

    await this.noteRepository.update(
      {
        id,
        organizationId: currentUser.organizationId,
      },
      updateNoteDto,
    );

    return this.findOne(id, currentUser);
  }

  // DELETE NOTE
  async remove(id: string, currentUser: any) {
    await this.findOne(id, currentUser);

    return await this.noteRepository.delete({
      id,
      organizationId: currentUser.organizationId,
    });
  }
}
