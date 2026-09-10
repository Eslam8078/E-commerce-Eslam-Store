import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-legal',
  standalone: true,
  templateUrl: './legal.html',
  styleUrl: './legal.css',
})
export class Legal {
  type = 'privacy';

  constructor(private route: ActivatedRoute) {
    this.type = this.route.snapshot.data['type'] || 'privacy';
  }

  get title(): string {
    return this.type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy';
  }
}
