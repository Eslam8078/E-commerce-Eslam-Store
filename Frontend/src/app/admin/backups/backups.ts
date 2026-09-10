import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

import { BackupFile, BackupService } from '../../core/services/backup.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-backups',
  standalone: true,
  imports: [DatePipe, ConfirmDialog],
  templateUrl: './backups.html',
  styleUrl: './backups.css',
})
export class Backups implements OnInit {
  backups: BackupFile[] = [];
  isLoading = false;
  actionLoading = false;
  errorMessage = '';
  successMessage = '';
  pendingRestore: BackupFile | null = null;

  constructor(
    private backupService: BackupService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.backupService.listBackups().subscribe({
      next: (response) => {
        this.backups = response.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.backups = [];
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load backups';
        this.cdr.detectChanges();
      },
    });
  }

  createBackup(): void {
    this.actionLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.backupService.createBackup().subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.actionLoading = false;
        this.load();
      },
      error: (error) => {
        this.actionLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to create backup';
        this.cdr.detectChanges();
      },
    });
  }

  askRestore(backup: BackupFile): void {
    this.pendingRestore = backup;
  }

  cancelRestore(): void {
    this.pendingRestore = null;
  }

  restoreBackup(): void {
    if (!this.pendingRestore) return;

    const fileName = this.pendingRestore.fileName;
    this.actionLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.pendingRestore = null;

    this.backupService.restoreBackup(fileName).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.actionLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.actionLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to restore backup';
        this.cdr.detectChanges();
      },
    });
  }

  sizeInMb(size: number): string {
    return (size / (1024 * 1024)).toFixed(2);
  }
}
