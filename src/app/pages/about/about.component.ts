import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-white font-sans text-gray-900">
      <!-- Hero Section -->
      <section class="relative py-24 bg-gray-900 overflow-hidden">
        <div class="absolute inset-0 bg-linear-to-br from-gray-900 to-gray-800"></div>
        <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            We Are <span class="text-transparent bg-clip-text bg-linear-to-r from-first-custom to-third-custom">Jeufutbol</span>
          </h1>
          <p class="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Empowering football creators and clubs to dominate the digital pitch.
          </p>
        </div>
      </section>

      <!-- Mission Section -->
      <section class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 class="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p class="text-lg text-gray-600 mb-6">
                Football is more than just a game; it's a global conversation that never sleeps. At Jeufutbol, we provide the tools for creators, clubs, and brands to lead that conversation.
              </p>
              <p class="text-lg text-gray-600">
                We believe in the power of data-driven storytelling. Our platform integrates seamless publishing with powerful analytics, giving you the tactical advantage you need to grow your fanbase.
              </p>
            </div>
            <div class="relative">
              <div class="absolute inset-0 bg-linear-to-r from-first-custom to-third-custom rounded-2xl transform rotate-3 scale-105 opacity-20"></div>
              <div class="relative bg-gray-100 rounded-2xl p-8 h-80 flex items-center justify-center">
                 <span class="text-gray-400 font-semibold">[Team Photo Placeholder]</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="py-20 bg-gray-50 border-y border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div class="text-4xl font-bold text-gray-900 mb-2">500+</div>
              <div class="text-sm text-gray-500 uppercase tracking-wider font-semibold">Clubs Managed</div>
            </div>
            <div>
              <div class="text-4xl font-bold text-gray-900 mb-2">1M+</div>
              <div class="text-sm text-gray-500 uppercase tracking-wider font-semibold">Posts Published</div>
            </div>
            <div>
              <div class="text-4xl font-bold text-gray-900 mb-2">50M+</div>
              <div class="text-sm text-gray-500 uppercase tracking-wider font-semibold">Fans Engaged</div>
            </div>
            <div>
              <div class="text-4xl font-bold text-gray-900 mb-2">24/7</div>
              <div class="text-sm text-gray-500 uppercase tracking-wider font-semibold">Support</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Team Section -->
      <section class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Meet the Squad</h2>
            <p class="text-xl text-gray-600">The tactical masterminds behind the platform.</p>
          </div>
          
          <div class="grid md:grid-cols-3 gap-8">
            <!-- Team Member 1 -->
            <div class="group">
              <div class="relative overflow-hidden rounded-2xl mb-6 bg-gray-200 aspect-[3/4]">
                <!-- Placeholder for image -->
                <div class="absolute inset-0 flex items-center justify-center text-gray-400">Photo</div>
              </div>
              <h3 class="text-xl font-bold text-gray-900">Yaşar Türkan</h3>
              <p class="text-first-custom font-medium">CEO & Founder</p>
            </div>

            <!-- Team Member 2 -->
            <div class="group">
              <div class="relative overflow-hidden rounded-2xl mb-6 bg-gray-200 aspect-[3/4]">
                <!-- Placeholder for image -->
                 <div class="absolute inset-0 flex items-center justify-center text-gray-400">Photo</div>
              </div>
              <h3 class="text-xl font-bold text-gray-900">Emir Baki Demirci</h3>
              <p class="text-first-custom font-medium">CTO & Co-Founder</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class AboutComponent { }
