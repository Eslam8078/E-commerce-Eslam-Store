import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './shared/header/header';
import { Footer } from '../shared/footer/footer';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {}
