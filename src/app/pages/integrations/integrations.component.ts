import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-integrations',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="min-h-screen bg-white font-sans text-gray-900">
      <!-- Hero -->
      <section class="py-24 bg-gray-50 text-center">
        <div class="max-w-4xl mx-auto px-4">
          <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            Connect Your <span class="text-transparent bg-clip-text bg-linear-to-r from-first-custom to-third-custom">Entire Ecosystem</span>
          </h1>
          <p class="text-xl text-gray-600 mb-10">
            Jeufutbol plays nicely with the biggest platforms in the league.
          </p>
        </div>
      </section>

      <!-- Platforms Grid -->
      <section class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-3 gap-8">
            <!-- Instagram -->
            <div class="p-8 border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300">
               <div class="w-16 h-16 bg-linear-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-xl mb-6 flex items-center justify-center text-white">
                 <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.163 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
               </div>
               <h3 class="text-xl font-bold mb-2">Instagram</h3>
               <p class="text-gray-600">Auto-publish Posts, Reels, and Stories. Advanced analytics.</p>
            </div>

            <!-- TikTok -->
             <div class="p-8 border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300">
               <div class="w-16 h-16 bg-black rounded-xl mb-6 flex items-center justify-center text-white">
                 <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.03 5.93-.04 8.85-.08 3.2-2.3 5.84-5.6 6.01-3.24.17-6.16-2.1-6.85-5.27-.71-3.26 1.28-6.65 4.52-7.54.41-.11.83-.18 1.25-.2v4.16c-1.13.03-2.25.72-2.77 1.73-.52 1.02-.34 2.37.44 3.19.79.83 2.15.97 3.11.32.96-.65 1.53-1.76 1.53-2.93V.02z"/></svg>
               </div>
               <h3 class="text-xl font-bold mb-2">TikTok</h3>
               <p class="text-gray-600">Schedule viral videos. Track trending sounds and hashtags.</p>
            </div>

            <!-- Twitter/X -->
             <div class="p-8 border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300">
               <div class="w-16 h-16 bg-black rounded-xl mb-6 flex items-center justify-center text-white">
                 <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
               </div>
               <h3 class="text-xl font-bold mb-2">X (Twitter)</h3>
               <p class="text-gray-600">Real-time match updates, threads, and poll scheduling.</p>
            </div>

            <!-- Facebook -->
             <div class="p-8 border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300">
               <div class="w-16 h-16 bg-blue-600 rounded-xl mb-6 flex items-center justify-center text-white">
                 <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.747-2.971 2.28v1.69h4.757l-.871 3.667h-3.886v7.98h-4.844z"/></svg>
               </div>
               <h3 class="text-xl font-bold mb-2">Facebook</h3>
               <p class="text-gray-600">Cross-post content and manage community groups.</p>
            </div>

            <!-- YouTube (Coming Soon) -->
             <div class="p-8 border border-dashed border-gray-300 rounded-2xl opacity-75">
               <div class="w-16 h-16 bg-red-600/10 text-red-600 rounded-xl mb-6 flex items-center justify-center">
                 <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 16 16"><path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408L6.4 5.209z"/></svg>
               </div>
               <h3 class="text-xl font-bold mb-2">YouTube</h3>
               <p class="text-gray-500">Coming Soon. Long-form and Shorts scheduling features.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class IntegrationsComponent { }
