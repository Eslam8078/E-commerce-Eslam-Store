import { Component } from '@angular/core';

import { Testimonials } from '../testimonials';

@Component({
  selector: 'app-list-testimonials',
  standalone: true,
  imports: [Testimonials],
  templateUrl: './list-testimonials.html',
  styleUrl: './list-testimonials.css',
})
export class ListTestimonials {}
