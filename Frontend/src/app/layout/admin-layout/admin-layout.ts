import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Aside } from '../../admin/shared/aside/aside';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, Aside],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {}
