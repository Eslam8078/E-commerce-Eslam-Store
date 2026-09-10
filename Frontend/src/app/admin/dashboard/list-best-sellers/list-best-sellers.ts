import { Component, Input } from '@angular/core';
import { ITopSaleProduct } from '../../../core/models/report.model';
@Component({
  selector: 'app-list-best-sellers',
  standalone: true,
  imports: [],
  templateUrl: './list-best-sellers.html',
  styleUrl: './list-best-sellers.css',
})
export class ListBestSellers {
  @Input() products: ITopSaleProduct[] = [];
  @Input() staticURL = "";
}
