import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

import { Aside } from './shared/aside/aside';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, RouterLink, Aside],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {}
