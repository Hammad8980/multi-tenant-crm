import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('notes')
@ApiBearerAuth('JWT-auth')
@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note for a customer' })
  create(
    @Body() createNoteDto: CreateNoteDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.notesService.create(createNoteDto, currentUser);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get all notes for a specific customer' })
  findByCustomer(
    @Param('customerId') customerId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.notesService.findByCustomer(customerId, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single note by ID' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.notesService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.notesService.update(id, updateNoteDto, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note' })
  remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.notesService.remove(id, currentUser);
  }
}
