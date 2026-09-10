import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Notification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-list-notifications',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './list-notifications.html',
  styleUrl: './list-notifications.css',
})
export class ListNotifications {
  @Input() notifications: Notification[] = [];
  @Input() loading = false;
  @Output() refresh = new EventEmitter<void>();
  @Output() notificationSelected = new EventEmitter<Notification>();
}
