import { Component } from '@angular/core';

import { Users } from '../users';

@Component({
  selector: 'app-list-users',
  standalone: true,
  imports: [Users],
  templateUrl: './list-users.html',
  styleUrl: './list-users.css',
})
export class ListUsers {}
