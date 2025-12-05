import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-blog',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="min-h-screen bg-gray-50 font-sans text-gray-900">
      <!-- Header -->
      <section class="pt-32 pb-16 bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            The Dugout
          </h1>
          <p class="text-xl text-gray-600 max-w-2xl">
            Insights, strategies, and news from the world of football social media.
          </p>
        </div>
      </section>

      <!-- Blog Grid -->
      <section class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            @for (post of posts(); track post.id) {
              <article class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                <div class="h-48 bg-gray-200 relative overflow-hidden">
                  <div class="absolute inset-0 bg-linear-to-tr from-gray-900/10 to-transparent"></div>
                  <!-- Placeholder Image -->
                </div>
                <div class="p-8">
                  <div class="flex items-center gap-2 mb-4">
                    <span class="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider">
                      {{ post.category }}
                    </span>
                    <span class="text-sm text-gray-500">{{ post.date }}</span>
                  </div>
                  <h2 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-first-custom transition-colors">
                    {{ post.title }}
                  </h2>
                  <p class="text-gray-600 line-clamp-3 mb-6">
                    {{ post.excerpt }}
                  </p>
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gray-100"></div>
                    <span class="text-sm font-medium text-gray-900">{{ post.author }}</span>
                  </div>
                </div>
              </article>
            }

          </div>
        </div>
      </section>
    </div>
  `
})
export class BlogComponent {
    posts = signal([
        {
            id: 1,
            category: 'Strategy',
            date: 'Dec 02, 2025',
            title: 'How to Go Viral During the Transfer Window',
            excerpt: 'The transfer window is the Super Bowl of engagement. Learn how to capitalize on the rumors, the confirmations, and the fan reactions.',
            author: 'Emrecan Tekinel'
        },
        {
            id: 2,
            category: 'Analytics',
            date: 'Nov 28, 2025',
            title: 'Decoding xG (Expected Growth) on Social Media',
            excerpt: 'Forget xG on the pitch for a moment. We define a new metric for social growth and how you can measure your content performance against it.',
            author: 'Emir Baki Demirci'
        },
        {
            id: 3,
            category: 'TikTok',
            date: 'Nov 20, 2025',
            title: 'Short-Form Video Trends for 2026',
            excerpt: 'What\'s next for TikTok and Reels? We analyze the emerging trends that football creators need to jump on right now.',
            author: 'Yaşar Türkan'
        },
        {
            id: 4,
            category: 'Case Study',
            date: 'Nov 15, 2025',
            title: 'How "FC Underdogs" Doubled Their Following in a Month',
            excerpt: 'A deep dive into the content strategy of a lower-league club that took the internet by storm with their authentic storytelling.',
            author: 'Emir Baki Demirci'
        },
        {
            id: 5,
            category: 'Platform Update',
            date: 'Nov 10, 2025',
            title: 'Twitter/X Algorithm Changes: What Coaches Need to Know',
            excerpt: 'The algorithm has shifted again. Here is your tactical briefing on how to ensure your matchday updates still reach the fans.',
            author: 'Emir Baki Demirci'
        },
        {
            id: 6,
            category: 'Engagement',
            date: 'Nov 05, 2025',
            title: 'Turning Trolls into Superfans',
            excerpt: 'Community management is a tough game. Here are 5 strategies to handle negativity and foster a positive digital stadium atmosphere.',
            author: 'Yaşar Türkan'
        }
    ]);
}
