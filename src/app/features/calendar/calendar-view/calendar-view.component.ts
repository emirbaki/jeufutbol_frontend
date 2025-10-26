import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: any[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './calendar-view.component.html',
})
export class CalendarViewComponent implements OnInit {
  currentDate = new Date();
  calendarDays: CalendarDay[] = [];
  selectedDate: Date | null = null;
  
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  scheduledPosts = [
    {
      id: '1',
      date: new Date(2024, 9, 18, 10, 0),
      content: 'Morning motivation post',
      platforms: ['instagram', 'facebook'],
      status: 'scheduled'
    },
    {
      id: '2',
      date: new Date(2024, 9, 18, 15, 30),
      content: 'Product announcement',
      platforms: ['x', 'instagram'],
      status: 'scheduled'
    },
    {
      id: '3',
      date: new Date(2024, 9, 20, 12, 0),
      content: 'Weekly tips & tricks',
      platforms: ['facebook', 'x'],
      status: 'scheduled'
    }
  ];

  ngOnInit() {
    this.generateCalendar();
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayIndex = firstDay.getDay();
    const lastDayDate = lastDay.getDate();
    const prevLastDayDate = prevLastDay.getDate();
    
    this.calendarDays = [];
    
    // Previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevLastDayDate - i);
      this.calendarDays.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        posts: this.getPostsForDate(date)
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDayDate; i++) {
      const date = new Date(year, month, i);
      const today = new Date();
      this.calendarDays.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        posts: this.getPostsForDate(date)
      });
    }
    
    // Next month days
    const remainingDays = 42 - this.calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      this.calendarDays.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        posts: this.getPostsForDate(date)
      });
    }
  }

  getPostsForDate(date: Date): any[] {
    return this.scheduledPosts.filter(post => 
      post.date.toDateString() === date.toDateString()
    );
  }

  previousMonth() {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1
    );
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1
    );
    this.generateCalendar();
  }

  selectDate(day: CalendarDay) {
    this.selectedDate = day.date;
  }

  getMonthYear(): string {
    return this.currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }

  getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      x: '𝕏',
      instagram: '📷',
      facebook: '👤',
      tiktok: '🎵',
      youtube: '▶️'
    };
    return icons[platform] || '📱';
  }
}