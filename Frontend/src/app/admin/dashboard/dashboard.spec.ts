import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { Dashboard } from './dashboard';
import { DashboardService } from '../../core/services/report.service';
import { NotificationService } from '../../core/services/notification.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  const dashboardService = {
    getRevenueReport: () => of({ data: { totalRevenue: 0, totalOrders: 0 } }),
    getTopProducts: () => of({ data: [] }),
    getTopSales: () => of({ data: [] }),
    getNewArrivals: () => of({ data: [] }),
  };

  const notificationService = {
    getMyNotifications: () => of({ data: [], unreadCount: 0 }),
    markAsRead: () => of({ data: {} }),
  };

  const router = {
    navigate: () => Promise.resolve(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: DashboardService, useValue: dashboardService },
        { provide: NotificationService, useValue: notificationService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
