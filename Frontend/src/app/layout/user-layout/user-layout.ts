import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from '../../user/shared/header/header';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.css',
})
export class UserLayout {}
