import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-white font-sans text-gray-900">
      <!-- Hero -->
      <section class="relative py-32 bg-gray-900 flex items-center justify-center text-center overflow-hidden">
         <div class="absolute inset-0 bg-linear-to-b from-gray-900 to-gray-800"></div>
         <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div class="relative max-w-4xl mx-auto px-4">
          <h1 class="text-5xl md:text-7xl font-extrabold text-white mb-8">
            Join the <span class="bg-clip-text text-transparent bg-linear-to-r from-first-custom to-third-custom">First Team</span>
          </h1>
          <p class="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            We're building the future of sports media. We need world-class players for every position. Are you ready to sign?
          </p>
          <button class="px-8 py-4 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-colors">
            View Openings
          </button>
        </div>
      </section>

      <!-- Values -->
      <section class="py-24 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl font-bold text-gray-900">Why Play for Jeufutbol?</h2>
          </div>
          <div class="grid md:grid-cols-3 gap-12">
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 class="text-xl font-bold mb-3">Total Freedom</h3>
              <p class="text-gray-600">We play fluid football. Work from anywhere, anytime. Just get the result.</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 class="text-xl font-bold mb-3">Championship Salary</h3>
              <p class="text-gray-600">Competitive global compensation, equity packages, and performance bonuses.</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 class="text-xl font-bold mb-3">World Class Gear</h3>
              <p class="text-gray-600">We provide the latest tech to ensure you perform at your peak level.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Openings -->
      <section class="py-24">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-10">Transfer Market</h2>
          
          <div class="space-y-4">
             @for (job of jobs(); track job.id) {
               <div class="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-gray-200 rounded-xl hover:border-first-custom transition-all duration-300 hover:shadow-lg cursor-pointer">
                 <div>
                   <h3 class="text-lg font-bold text-gray-900 group-hover:text-first-custom transition-colors">{{ job.title }}</h3>
                   <div class="flex items-center gap-4 text-sm text-gray-500 mt-2">
                     <span class="flex items-center gap-1">
                       <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                       {{ job.location }}
                     </span>
                     <span class="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{{ job.type }}</span>
                   </div>
                 </div>
                 <div class="mt-4 md:mt-0">
                    <span class="inline-flex items-center font-bold text-gray-900 group-hover:translate-x-1 transition-transform">
                      Apply Now
                      <svg class="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </span>
                 </div>
               </div>
             }
          </div>
        </div>
      </section>
    </div>
  `
})
export class CareersComponent {
  jobs = signal([
    { id: 1, title: 'Senior Frontend "Winger" (Angular)', location: 'Remote (Europe)', type: 'Full-time' },
    { id: 2, title: 'Backend "Defender" (NestJS)', location: 'Remote (Global)', type: 'Full-time' },
    { id: 3, title: 'Growth "Striker" (Marketing)', location: 'İstanbul, Türkiye', type: 'Hybrid' },
    { id: 4, title: 'Tactical Analyst (Data Scientist)', location: 'Remote (Global)', type: 'Full-time' },
    { id: 5, title: 'Scout (Sales Representative)', location: 'İstanbul, Türkiye', type: 'Full-time' }
  ]);
}
