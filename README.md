# JeuHub - Social Media Management Platform

Welcome to **JeuHub**, a comprehensive social media management platform built to streamline your digital presence. Powered by **Angular 20**, JeuHub combines AI-driven insights, multi-platform publishing, and deep analytics into one cohesive experience.

## 🚀 Overview

JeuHub isn't just another admin panel; it's your command center for social media. Whether you're managing content for X (Twitter), Instagram, Facebook, TikTok, or YouTube, JeuHub gives you the tools to create, schedule, and monitor your posts from a single, intuitive dashboard. We've integrated advanced AI features to help you generate content ideas, craft the perfect post, and stay ahead of trending topics.

## ✨ Key Features

### 🎯 Core Functionality

- **Multi-Platform Support**: Seamlessly manage your presence on X, Instagram, Facebook, TikTok, and YouTube.
- **Smart Post Composer**: Create content once and customize it for every platform.
- **Visual Scheduler**: Plan your content strategy with an easy-to-use calendar view.
- **Media Hub**: Centralized management for all your images and videos.

### 🤖 AI-Powered Creativity

- **AI Insights**: Leverage the power of OpenAI, Anthropic, and Ollama to discover trending topics and content opportunities.
- **Smart Templates**: Let AI generate post templates tailored to your audience and tone.
- **Trend Analysis**: Stay in the loop with real-time monitoring of what's hot right now.

### 📊 Analytics & Monitoring

- **Deep Analytics**: Understand your performance with detailed metrics on engagement and reach.
- **Profile Monitoring**: Keep an eye on key X (Twitter) profiles to spot emerging conversations.
- **Engagement Insights**: Know exactly when to post for maximum impact.

### 📸 New: TikTok Photo Mode

- **TikTok Photo Publishing**: We've expanded our TikTok support! You can now publish photo carousels directly to TikTok, giving you more ways to engage your audience.

## 🏗️ Architecture & Tech Stack

We've built JeuHub on a modern, robust stack designed for performance and scalability.

### Frontend

- **Framework**: **Angular 20** (embracing Standalone Components and Signals).
- **State Management**: Powered by Angular Signals for a reactive, zoneless experience.
- **Styling**: TailwindCSS with a custom, polished theme.
- **Data Fetching**: Apollo Angular for GraphQL and standard HttpClient for REST.

### Backend Integration

- **API**: A robust GraphQL API handles most operations, supplemented by REST endpoints for specific tasks like file uploads.
- **Authentication**: Secure, JWT-based authentication ensures your data stays safe.

## ☁️ Deployment & Infrastructure

We take reliability seriously. JeuHub is deployed using **Dokploy**, ensuring smooth, automated deployments.

- **DNS & Security**: We use **Cloudflare** as our DNS provider, giving us an extra layer of security, performance, and reliability.

## 📁 Project Structure

The project is organized to be intuitive and scalable:

```
src/
├── app/
│   ├── core/                    # Singleton services, guards, and interceptors
│   ├── features/                # Feature-based modules (Dashboard, Posts, Insights, etc.)
│   ├── models/                  # TypeScript interfaces and types
│   ├── services/                # Business logic and data services
│   └── app.config.ts            # Application-level configuration
├── environments/                # Environment-specific settings
└── assets/                      # Static resources
```

## 🚀 Getting Started

Ready to dive in? Here's how to get running locally.

### Prerequisites

- Node.js 18+
- Angular CLI 20
- Access to the JeuHub backend API

### Installation

1.  **Clone the repo:**

    ```bash
    git clone <repository-url>
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure your environment:**
    Update `src/environments/environment.ts` with your API details.

4.  **Start the dev server:**
    ```bash
    ng serve
    ```
    Navigate to `http://localhost:4200` and you're good to go!

## 🤝 Contributing & Support

We're always looking to improve. If you have suggestions or run into issues, please reach out to the development team.

---

Built with ❤️ using **Angular 20** and modern web technologies.
