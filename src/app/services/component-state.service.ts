import { Injectable, signal } from '@angular/core';

export interface AIPostGeneratorState {
    topic: string;
    llmProvider: string;
    platform: string;
    tone: string;
    insights: any[];
    selectedInsights: boolean[];
    generatedPost: any | null;
}

export interface PostComposerState {
    content: string;
    scheduledDate: string;
    scheduledTime: string;
    isScheduled: boolean;
    selectedMediaType: 'image' | 'video' | 'both';
    mediaFiles: File[];
    mediaUrls: string[];
}

@Injectable({
    providedIn: 'root'
})
export class ComponentStateService {
    // AI Post Generator state
    aiGeneratorState = signal<AIPostGeneratorState | null>(null);

    // Post Composer state
    composerState = signal<PostComposerState | null>(null);

    saveAIGeneratorState(state: AIPostGeneratorState) {
        this.aiGeneratorState.set(state);
    }

    getAIGeneratorState(): AIPostGeneratorState | null {
        return this.aiGeneratorState();
    }

    clearAIGeneratorState() {
        this.aiGeneratorState.set(null);
    }

    saveComposerState(state: PostComposerState) {
        this.composerState.set(state);
    }

    getComposerState(): PostComposerState | null {
        return this.composerState();
    }

    clearComposerState() {
        this.composerState.set(null);
    }
}
