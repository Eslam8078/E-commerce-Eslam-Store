import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

import { UserService, IUserQuery } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, ConfirmDialog],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  users: User[] = [];

  search = '';

  role = '';

  accountStatus: 'all' | 'active' | 'blocked' | 'deleted' = 'all';

  page = 1;

  limit = 10;

  total = 0;

  totalPages = 0;

  isLoading = false;

  errorMessage = '';

  actionLoadingId: string | null = null;

  confirmOpen = false;
  pendingDeleteId: string | null = null;
  pendingDeleteName = '';
  showAddAdmin = false;
  adminForm = {
    name: '',
    email: '',
    password: '',
    gender: 'male' as 'male' | 'female',
    DOB: '',
  };

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const query: IUserQuery = {
      page: this.page,
      limit: this.limit,
      sort: 'createdAt',
      order: 'desc',
    };

    if (this.search.trim()) {
      query.search = this.search.trim();
    }

    if (this.role) {
      query.role = this.role as 'customer' | 'admin';
    }

    if (this.accountStatus === 'active' || this.accountStatus === 'blocked' || this.accountStatus === 'deleted') {
      query.accountStatus = this.accountStatus;
    }

    this.userService.getAllUsers(query).subscribe({
      next: (response) => {
        this.users = response.data || [];
        this.total = response.pagination?.total ?? response.total ?? 0;
        this.totalPages = response.pagination?.totalPages || response.pages || 1;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load users';
        this.cdr.detectChanges();
      },
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.page = page;
    this.load();
  }

  toggleBlock(user: User): void {
    this.actionLoadingId = user._id;

    const action = user.isBlocked
      ? this.userService.unblockUser(user._id)
      : this.userService.blockUser(user._id);

    action.subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.load();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to update user';
        this.cdr.detectChanges();
      },
    });
  }

  deleteUser(user: User): void {
    this.pendingDeleteId = user._id;
    this.pendingDeleteName = user.name;
    this.confirmOpen = true;
    this.cdr.detectChanges();
  }

  confirmDeleteUser(): void {
    const id = this.pendingDeleteId;
    this.pendingDeleteId = null;
    this.confirmOpen = false;

    if (!id) {
      return;
    }

    this.actionLoadingId = id;

    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.load();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to delete user';
        this.cdr.detectChanges();
      },
    });
  }

  restoreUser(user: User): void {
    this.actionLoadingId = user._id;

    this.userService.restoreUser(user._id).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.load();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.actionLoadingId = null;
        this.errorMessage = error?.error?.message || 'Failed to restore user';
        this.cdr.detectChanges();
      },
    });
  }

  addAdmin(): void {
    if (
      !this.adminForm.name.trim() ||
      !this.adminForm.email.trim() ||
      !this.adminForm.password ||
      !this.adminForm.DOB
    ) {
      this.errorMessage = 'Name, email, password and date of birth are required.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.userService.createAdmin({
      ...this.adminForm,
      name: this.adminForm.name.trim(),
      email: this.adminForm.email.trim().toLowerCase(),
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showAddAdmin = false;
        this.adminForm = {
          name: '',
          email: '',
          password: '',
          gender: 'male' as 'male' | 'female',
          DOB: '',
        };
        this.errorMessage = '';
        this.load();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to create admin';
        this.cdr.detectChanges();
      },
    });
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.pendingDeleteId = null;
    this.cdr.detectChanges();
  }
}
