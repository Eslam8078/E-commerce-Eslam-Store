import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ITopProduct } from '../../../core/models/report.model';
@Component({
  selector: 'app-list-top-products',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './list-top-products.html',
  styleUrl: './list-top-products.css',
})
export class ListTopProducts {
  @Input() products: ITopProduct[] = [];
}
