'use client';

import { useState } from 'react';
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/use-notes';
import type { Customer } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface CustomerNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export function CustomerNotesDialog({
  open,
  onOpenChange,
  customer,
}: CustomerNotesDialogProps) {
  const [noteContent, setNoteContent] = useState('');
  const { data: notes, isLoading } = useNotes(customer.id);
  const createMutation = useCreateNote();
  const deleteMutation = useDeleteNote();

  const handleAddNote = () => {
    if (!noteContent.trim()) return;

    createMutation.mutate(
      {
        content: noteContent,
        customerId: customer.id,
      },
      {
        onSuccess: () => {
          setNoteContent('');
        },
      }
    );
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteMutation.mutate(noteId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Notes</DialogTitle>
          <DialogDescription>
            Notes for {customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Note Form */}
          <div className="space-y-2">
            <Label>Add New Note</Label>
            <Textarea
              placeholder="Enter note content..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleAddNote}
              disabled={!noteContent.trim() || createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Note'}
            </Button>
          </div>

          {/* Notes List */}
          <div className="space-y-2">
            <Label>Previous Notes</Label>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading notes...</p>
            ) : notes?.length === 0 ? (
              <p className="text-sm text-gray-500">No notes yet</p>
            ) : (
              <div className="space-y-2">
                {notes?.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm">{note.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
