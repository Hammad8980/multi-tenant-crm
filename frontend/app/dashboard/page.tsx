'use client';

import { useState } from 'react';
import { useCustomers, useDeleteCustomer, useRestoreCustomer, useUnassignCustomer } from '@/hooks/use-customers';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CreateCustomerDialog } from '@/components/customers/create-customer-dialog';
import { EditCustomerDialog } from '@/components/customers/edit-customer-dialog';
import { AssignCustomerDialog } from '@/components/customers/assign-customer-dialog';
import { CustomerNotesDialog } from '@/components/customers/customer-notes-dialog';
import type { Customer } from '@/types';
import { Search, Plus, Trash2, Edit, UserPlus, FileText, RotateCcw, UserMinus } from 'lucide-react';
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '@/lib/constants';

export default function DashboardPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const limit = DEFAULT_PAGE_SIZE;

  const { data, isLoading, error } = useCustomers({
    page,
    limit,
    search: debouncedSearch,
    includeDeleted: showDeleted,
  });

  const deleteMutation = useDeleteCustomer();
  const restoreMutation = useRestoreCustomer();
  const unassignMutation = useUnassignCustomer();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleRestore = async (id: string) => {
    if (confirm('Are you sure you want to restore this customer?')) {
      restoreMutation.mutate(id);
    }
  };

  const handleUnassign = async (id: string, customerName: string) => {
    if (confirm(`Are you sure you want to unassign ${customerName}?`)) {
      unassignMutation.mutate(id);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditOpen(true);
  };

  const handleAssign = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsAssignOpen(true);
  };

  const handleNotes = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsNotesOpen(true);
  };

  // Backend handles filtering based on includeDeleted parameter
  const customers = data?.data || [];

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">
            Manage your customer relationships
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showDeleted ? 'default' : 'outline'}
              onClick={() => setShowDeleted(!showDeleted)}
            >
              {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {customers.length} Customer{customers.length !== 1 ? 's' : ''}
            {showDeleted && ' (including deleted)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading customers
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No customers found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className={customer.deletedAt ? 'bg-red-50' : ''}
                    >
                      <TableCell className="font-medium">
                        {customer.name}
                        {customer.deletedAt && (
                          <Badge variant="destructive" className="ml-2">
                            Deleted
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>
                        {customer.assignedTo ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="default" className="cursor-default">
                                Assigned
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Assigned to {customer.assignedToUser?.name || 'Unknown'}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Badge variant="secondary">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.deletedAt ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(customer.id)}
                            title="Restore customer"
                          >
                            <RotateCcw className="w-4 h-4 text-green-500" />
                          </Button>
                        ) : (
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(customer)}
                              title="Edit customer"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAssign(customer)}
                              title="Assign customer"
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                            {customer.assignedTo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnassign(customer.id, customer.name)}
                                title="Unassign customer"
                              >
                                <UserMinus className="w-4 h-4 text-orange-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleNotes(customer)}
                              title="View notes"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
                              title="Delete customer"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateCustomerDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      {selectedCustomer && (
        <>
          <EditCustomerDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            customer={selectedCustomer}
          />
          <AssignCustomerDialog
            open={isAssignOpen}
            onOpenChange={setIsAssignOpen}
            customer={selectedCustomer}
          />
          <CustomerNotesDialog
            open={isNotesOpen}
            onOpenChange={setIsNotesOpen}
            customer={selectedCustomer}
          />
        </>
      )}
    </div>
  );
}
