import { Component } from '@angular/core';

import { Orders } from '../orders';

@Component({
  selector: 'app-list-orders',
  standalone: true,
  imports: [Orders],
  templateUrl: './list-orders.html',
  styleUrl: './list-orders.css',
})
export class ListOrders {}
