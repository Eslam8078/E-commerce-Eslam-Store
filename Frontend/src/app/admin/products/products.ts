import { Component } from '@angular/core';

import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-products',

  standalone: true,

  imports: [RouterLink, RouterLinkActive, RouterOutlet],

  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {}
