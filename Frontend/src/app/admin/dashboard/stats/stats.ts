import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './stats.html',
  styleUrl: './stats.css',
})
export class DashboardStats {
  @Input() revenue: { totalRevenue?: number; totalOrders?: number } | null = null;
}
