import { CommonModule } from '@angular/common';
import { Component, NgModule, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AiChatComponent } from './features/ai-chat/ai-chat.component';




@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, AiChatComponent],
  standalone: true,
  template: `
    <router-outlet></router-outlet>
    <app-ai-chat></app-ai-chat>
  `,
  // templateUrl: './app.html',
  // styleUrl: './app.css'
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class App {
  protected readonly title = signal('Jeuhub');
}
