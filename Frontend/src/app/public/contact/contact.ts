import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  name = '';
  email = '';
  message = '';
  sent = false;

  submit(): void {
    if (!this.name.trim() || !this.email.trim() || !this.message.trim()) return;
    const subject = encodeURIComponent(`Contact from ${this.name.trim()}`);
    const body = encodeURIComponent(`${this.message.trim()}\n\nFrom: ${this.name.trim()}\nEmail: ${this.email.trim()}`);
    window.location.href = `mailto:eslamaymn2412@gmail.com?subject=${subject}&body=${body}`;
    this.sent = true;
  }
}
