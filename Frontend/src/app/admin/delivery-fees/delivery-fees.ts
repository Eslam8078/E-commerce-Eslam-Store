import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-delivery-fees',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './delivery-fees.html',
  styleUrl: './delivery-fees.css',
})
export class DeliveryFees {}
