import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from '../../user/shared/header/header';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
export class PublicLayout {}
