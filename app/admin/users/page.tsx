// app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers } from "@/store/slices/usersSlice"; // Import fetchUserAccounts
import type { User, Account } from "@/store/slices/usersSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Clock,
  Banknote,
  Wallet,
  BanknoteIcon,
  Building,
  Hash,
  Route,
  Currency,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const {
    data: users,
    loading,
    error,
  } = useAppSelector((state) => state.users);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user); // User already has accounts populated
    setIsDetailsOpen(true);
    // No need for separate account fetching or loading states
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all registered users in the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Accounts</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-4 w-[100px]" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[40px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[60px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-[40px] ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-red-500">
                        <p>Error loading users: {error}</p>
                        <Button
                          onClick={() => dispatch(fetchUsers())}
                          className="mt-4"
                        >
                          Try Again
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !users || users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <UserIcon className="h-12 w-12 mb-2 opacity-20" />
                        <h3 className="font-medium text-lg">No users found</h3>
                        <p>There are no users in the system yet.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.status === "ACTIVE"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : user.status === "INACTIVE"
                              ? "bg-gray-50 text-gray-700 border-gray-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>{formatDate(user.lastLogin)}</TableCell>
                      <TableCell>{user.linkedAccounts}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{user.transactionCount}</span>
                          <span className="text-xs text-muted-foreground">
                            ${user.transactionVolume?.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(user)}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>Edit User</DropdownMenuItem>
                            <DropdownMenuItem>Reset Password</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              {user.status === "ACTIVE"
                                ? "Deactivate User"
                                : "Activate User"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
  <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>User Details</DialogTitle>
      <DialogDescription>
        Detailed information about the user account
      </DialogDescription>
    </DialogHeader>
    {selectedUser && (
      <div className="grid gap-6 py-4">
        {/* User Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>Full Name</span>
            </div>
            <p className="font-medium">
              {selectedUser.firstName} {selectedUser.lastName}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </div>
            <p className="font-medium">{selectedUser.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Status</span>
            </div>
            <Badge
              variant="outline"
              className={
                selectedUser.status === "ACTIVE"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : selectedUser.status === "INACTIVE"
                  ? "bg-gray-50 text-gray-700 border-gray-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }
            >
              {selectedUser.status}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>Role</span>
            </div>
            <p className="font-medium">{selectedUser.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Registration Date</span>
            </div>
            <p className="font-medium">
              {formatDate(selectedUser.createdAt)}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last Login</span>
            </div>
            <p className="font-medium">
              {formatDate(selectedUser.lastLogin)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>Linked Accounts</span>
            </div>
            <p className="font-medium">
              {selectedUser.linkedAccounts}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>Transaction Count</span>
            </div>
            <p className="font-medium">
              {selectedUser.transactionCount}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserIcon className="h-4 w-4" />
            <span>Transaction Volume</span>
          </div>
          <p className="font-medium">
            ${selectedUser.transactionVolume?.toLocaleString()}
          </p>
        </div>

        {/* Accounts Section */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Banknote className="h-5 w-5" /> 
            Bank Accounts
          </h3>
          
          {isAccountsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : selectedUser.accounts && selectedUser.accounts.length > 0 ? (
            <div className="space-y-4">
              {selectedUser.accounts.map((account, index) => (
                <Card key={account.id} className="border border-gray-200">
                  <div className="p-6">
                    {/* Account Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-semibold text-base">{account.accountName}</h4>
                      </div>
                      <span className="text-sm font-medium px-2 py-1 bg-gray-100 rounded">
                        {account.status}
                      </span>
                    </div>

                    {/* Account Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                            <UserIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">Account Type</span>
                          </div>
                          <span className="text-sm font-medium text-right">{account.type}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                            <BanknoteIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">Bank Name</span>
                          </div>
                          <span className="text-sm font-medium text-right">{account.bankName}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                            <Building className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">Branch</span>
                          </div>
                          <span className="text-sm font-medium text-right">{account.branchName}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                            <Currency className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">Currency</span>
                          </div>
                          <span className="text-sm font-medium text-right">{account.currency}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                            <Hash className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">IFSC Code</span>
                          </div>
                          <span className="text-sm font-medium font-mono text-right">{account.ifscCode}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                            <Route className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">Routing Number</span>
                          </div>
                          <span className="text-sm font-medium font-mono text-right">{account.routingNumber}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">Created Date</span>
                          </div>
                          <span className="text-sm font-medium text-right">{formatDate(account.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No bank accounts found for this user.</p>
            </div>
          )}
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
    </div>
  );
}