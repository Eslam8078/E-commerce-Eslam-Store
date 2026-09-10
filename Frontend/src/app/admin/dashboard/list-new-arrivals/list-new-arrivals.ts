import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IProduct } from '../../../core/models/product.model';
@Component({
  selector: 'app-list-new-arrivals',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './list-new-arrivals.html',
  styleUrl: './list-new-arrivals.css',
})
export class ListNewArrivals {
  @Input() products: IProduct[] = [];
  @Input() staticURL = "";
}
