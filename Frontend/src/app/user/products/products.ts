import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {}
