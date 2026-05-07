'use client';

import { useState } from 'react';
import { useAssignCustomer } from '@/hooks/use-customers';
import { useUsers } from '@/hooks/use-users';
import type { Customer } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssignCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export function AssignCustomerDialog({
  open,
  onOpenChange,
  customer,
}: AssignCustomerDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const assignMutation = useAssignCustomer();
  const { data: users, isLoading } = useUsers();

  const handleAssign = () => {
    if (!selectedUserId) return;

    assignMutation.mutate(
      { id: customer.id, data: { userId: selectedUserId } },
      {
        onSuccess: () => {
          setSelectedUserId('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Customer</DialogTitle>
          <DialogDescription>
            Assign {customer.name} to a team member (max 5 per user)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select User</Label>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading users...</p>
            ) : (
              <Select
                value={selectedUserId}
                onValueChange={(value) => setSelectedUserId(value || '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedUserId || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
