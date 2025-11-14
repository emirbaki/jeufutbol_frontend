# JeuHub - Social Media Management Platform

A comprehensive social media management platform built with Angular 19, featuring AI-powered insights, multi-platform posting, and advanced analytics.

## 🚀 Overview

JeuHub is a modern social media admin panel that allows users to manage multiple social media accounts from a single dashboard. The platform supports content creation, scheduling, monitoring, and AI-powered insights generation.

## ✨ Key Features

### 🎯 Core Functionality
- **Multi-Platform Support**: Manage X (Twitter), Instagram, Facebook, TikTok, and YouTube accounts
- **Post Composer**: Create and publish content to multiple platforms simultaneously
- **Content Scheduling**: Plan and schedule posts with a visual calendar
- **Media Management**: Upload and manage images/videos for posts

### 🤖 AI-Powered Features
- **AI Insights Generation**: Get content suggestions and trending topics using multiple LLM providers (OpenAI, Anthropic, Ollama)
- **Post Template Generation**: AI-generated post templates based on insights and tone
- **Trend Analysis**: Monitor trending topics and audience interests

### 📊 Analytics & Monitoring
- **Performance Analytics**: Track engagement, reach, and post performance
- **Profile Monitoring**: Monitor X (Twitter) profiles for content ideas
- **Engagement Patterns**: Identify optimal posting times and content strategies
- **Real-time Insights**: Get notifications about new trends and opportunities

### 🔐 Security & Management
- **OAuth Integration**: Secure authentication for social media platforms
- **Credential Management**: Store and manage platform credentials securely
- **LLM Configuration**: Configure multiple AI providers for insights generation
- **User Preferences**: Customizable notification and security settings

## 🏗️ Architecture

### Frontend Stack
- **Framework**: Angular 19 (Standalone Components)
- **State Management**: Angular Signals (reactive state)
- **Styling**: TailwindCSS with custom theme
- **GraphQL Client**: Apollo Angular
- **HTTP Client**: Angular HttpClient with interceptors
- **Routing**: Angular Router with lazy loading

### Key Technologies
- **SSR**: Angular Universal for server-side rendering
- **Change Detection**: Zoneless change detection for better performance
- **Type Safety**: Full TypeScript support with strict mode
- **Build System**: Angular CLI with Vite

### Backend Integration
- **API**: GraphQL API at `https://jeufutbol.com.tr/graphql`
- **REST Endpoints**: Additional REST APIs for file uploads and OAuth
- **Authentication**: JWT-based authentication with Bearer tokens
- **File Storage**: Multi-file upload support for media content

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                    # Core services and guards
│   │   ├── auth/               # Authentication service
│   │   ├── guards/             # Route guards
│   │   ├── interceptors/       # HTTP interceptors
│   │   └── layout/             # Main layout components
│   │
│   ├── features/               # Feature modules
│   │   ├── ai-post-generator/  # AI-powered post generation
│   │   ├── analytics/          # Analytics dashboard
│   │   ├── auth/               # Login/Register
│   │   ├── calendar/           # Content calendar
│   │   ├── credentials/        # Platform credential management
│   │   ├── dashboard/          # Main dashboard
│   │   ├── insights/           # AI insights dashboard
│   │   ├── landing/            # Landing page
│   │   ├── llm-credentials/    # LLM provider configuration
│   │   ├── monitoring/         # Profile monitoring
│   │   ├── post-composer/      # Post creation interface
│   │   ├── posts/              # Post management
│   │   └── settings/           # User settings
│   │
│   ├── models/                 # TypeScript interfaces/types
│   │   ├── insight.model.ts
│   │   ├── llm-provider.model.ts
│   │   └── platform.model.ts
│   │
│   ├── services/               # Business logic services
│   │   ├── ai-insights.service.ts
│   │   ├── credentials.service.ts
│   │   ├── insights.service.ts
│   │   ├── llm.service.ts
│   │   ├── monitoring.service.ts
│   │   ├── posts.service.ts
│   │   └── social-accounts.service.ts
│   │
│   └── app.config.ts           # Application configuration
│
├── environments/               # Environment configurations
└── assets/                     # Static assets (icons, images)
```

## 🔑 Key Components

### Authentication System
- JWT-based authentication with secure token storage
- Login/Register flows with validation
- Protected routes using AuthGuard
- Automatic token injection via HTTP interceptors

### Post Management
- Multi-platform content creation
- Character limit validation per platform
- Media upload with preview
- Platform-specific formatting
- Draft, Schedule, and Publish workflows

### Insights Engine
- Multiple insight types:
  - Trending Topics
  - Content Suggestions
  - Engagement Patterns
  - Optimal Posting Times
  - Audience Interests
- Relevance scoring system
- Read/Unread tracking

### Monitoring System
- Track X (Twitter) profiles
- Fetch and display recent tweets
- Engagement metrics tracking
- Profile metadata management

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Themes**: Custom color palette with brand colors
- **Interactive Previews**: Real-time post previews for each platform
- **Loading States**: Skeleton loaders and spinners
- **Toast Notifications**: Success/error feedback
- **Modal Dialogs**: Confirmation dialogs for destructive actions

## 🔐 Security Features

- **Secure Authentication**: JWT tokens with HTTP-only storage checks
- **OAuth Integration**: Secure social media platform connections
- **CORS Protection**: Configured for production API
- **Input Validation**: Form validation and sanitization
- **Protected Routes**: AuthGuard prevents unauthorized access

## 📊 State Management

The application uses Angular Signals for reactive state management:

```typescript
// Example: Post filtering with computed signals
selectedFilter = signal<'ALL' | 'PUBLISHED'>('ALL');
posts = signal<Post[]>([]);

filteredPosts = computed(() => {
  const filter = this.selectedFilter();
  return filter === 'ALL' 
    ? this.posts() 
    : this.posts().filter(p => p.status === filter);
});
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Angular CLI 19
- Access to the backend API

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Set up environment variables
# Edit src/environments/environment.ts with your API URL

# Start development server
ng serve

# Access the application
# Navigate to http://localhost:4200
```

### Build for Production

```bash
# Build the application
ng build --configuration production

# Build with SSR
npm run build

# Start production server
npm run serve:ssr:frontend
```

## 🌐 API Integration

### GraphQL Endpoints

**Authentication**
```graphql
mutation Login($email: String!, $password: String!)
mutation Register($email: String!, $password: String!, $firstName: String!, $lastName: String!)
query Me
```

**Posts**
```graphql
mutation CreatePost($input: CreatePostInput!)
query GetUserPosts($limit: Int)
mutation DeletePost($postId: String!)
mutation PublishPost($postId: String!)
```

**Insights**
```graphql
query GetInsights($limit: Float)
mutation GenerateInsights
mutation GenerateAIInsights($topic: String, $llmProvider: String)
```

**Monitoring**
```graphql
query GetMonitoredProfiles
query GetProfileTweets($profileId: String!, $limit: Int)
mutation AddMonitoredProfile($xUsername: String!)
```

### REST Endpoints

- `POST /api/upload/multiple` - Upload media files
- `GET /api/credentials` - Get platform credentials
- `POST /api/credentials/oauth/authorize-url` - Get OAuth URL
- `POST /api/llm/register` - Register LLM credentials

## 🎯 Platform Support

### Supported Platforms
- **X (Twitter)**: Full support (posts, media, character limits)
- **Instagram**: Posts, images, captions
- **Facebook**: Posts, media, pages
- **TikTok**: Video content
- **YouTube**: Video content

### Platform Constraints
- X: 280 characters, 4 images max
- Instagram: 2200 characters, 10 images max
- Facebook: 63206 characters, 50 images max
- TikTok: Video only
- YouTube: Video with thumbnails

## 🔧 Configuration

### Environment Variables

```typescript
export const environment = {
  environment: 'development',
  production: false,
  api_url: 'https://jeufutbol.com.tr/api',
  port: 4200,
};
```

### Custom Theme

```css
@theme {
  --color-first-custom: #309898;    /* Primary teal */
  --color-second-custom: #000000;   /* Black */
  --color-third-custom: #f4631e;    /* Orange */
  --color-fourth-custom: #ff9f00;   /* Yellow */
}
```

## 📱 Features by Module

### Dashboard
- Quick stats overview
- Recent posts
- Latest insights
- Quick action buttons

### Post Composer
- Multi-platform selection
- Character count per platform
- Media upload and preview
- Platform-specific previews
- Publish to multiple platforms

### Calendar View
- Month/week/day views
- Scheduled posts visualization
- Drag-and-drop rescheduling
- Upcoming posts sidebar

### Insights Dashboard
- Filter by insight type
- Relevance scoring
- Mark as read functionality
- Generate new insights

### Analytics
- Performance metrics
- Platform comparison
- Engagement trends
- Top performing posts

### Monitoring
- Add X profiles to monitor
- View profile tweets
- Engagement metrics
- Remove profiles

### Settings
- Profile management
- Connected accounts
- LLM credentials
- Notifications
- Security settings

## 🐛 Known Issues & Limitations

- LocalStorage usage requires browser environment checks for SSR
- OAuth flows open in same window (could use popup)
- Limited to platforms with available API access
- AI insights require LLM credentials configuration

## 🔄 Future Enhancements

- [ ] Real-time collaboration features
- [ ] Advanced scheduling algorithms
- [ ] More platform integrations (LinkedIn, Pinterest)
- [ ] Bulk post operations
- [ ] Team management
- [ ] Advanced analytics with custom date ranges
- [ ] AI-powered image generation
- [ ] Hashtag suggestions
- [ ] Competitor analysis

## 📄 License

Copyright © 2025 Jeufutbol. All rights reserved.

## 👥 Support

For support and questions, please contact the development team.

---

Built with ❤️ using Angular 19 and modern web technologies.
