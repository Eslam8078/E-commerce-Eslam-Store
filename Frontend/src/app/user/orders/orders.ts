import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {}
