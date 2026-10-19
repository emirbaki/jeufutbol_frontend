import { Injectable } from '@angular/core';
import { Apollo, gql, QueryRef, } from 'apollo-angular';
import { filter, firstValueFrom, map, Observable } from 'rxjs';
import { WorkspaceContextService } from '../core/services/workspace-context.service';
import { HttpClient } from '@angular/common/http';
import { environment as env } from '../../environments/environment.development';
import { ChunkedUploadService } from './chunked-upload.service';

const DELETE_POST = gql`
  mutation DeletePost($postId: String!) {
    deletePost(postId: $postId)
  }
`;

const PUBLISH_POST = gql`
  mutation PublishPost($postId: String!) {
    publishPost(postId: $postId) {
      id
      status
      failureReasons
      publishedPosts {
        platform
        platformPostUrl
        platformPostId
        publishStatus
        publishedAt
      }
      tenant {
        id
        name
        subdomain
      }
    }
  }
`;

const RETRY_PUBLISH_POST = gql`
  mutation RetryPublishPost($postId: String!) {
    retryPublishPost(postId: $postId) {
      id
      status
      failureReasons
      publishedPosts {
        platform
        platformPostUrl
        platformPostId
        publishStatus
        publishedAt
      }
    }
  }
`;

const GET_USER_POSTS = gql`
  query GetUserPosts($limit: Int, $offset: Int) {
    getUserPosts(limit: $limit, offset: $offset) {
      id
      content
      mediaUrls
      status
      failureReasons
      targetPlatforms
      platformSpecificContent
      scheduledFor
      createdAt
      tiktokSettings
      youtubeSettings
      instagramSettings
      workspaceId
      workspace {
        id
        name
        slug
      }
      user {
        id
        firstName
        lastName
        email
      }
      publishedPosts {
        platform
        platformPostUrl
        platformPostId
        publishStatus
        publishedAt
      }
      tenant {
        id
        name
        subdomain
      }
    }
  }
`;

const POST_LIST = gql`
  query PostList($filter: PostListFilter) {
    postList(filter: $filter) {
      total
      items {
        id
        content
        mediaUrls
        status
        failureReasons
        targetPlatforms
        platformSpecificContent
        scheduledFor
        createdAt
        tiktokSettings
        youtubeSettings
        instagramSettings
        workspaceId
        workspace {
          id
          name
          slug
        }
        user {
          id
          firstName
          lastName
          email
        }
        publishedPosts {
          platform
          platformPostUrl
          platformPostId
          publishStatus
          publishedAt
        }
        tenant {
          id
          name
          subdomain
        }
      }
    }
  }
`;

const POST_STATUS_COUNTS = gql`
  query PostStatusCounts($filter: PostListFilter) {
    postStatusCounts(filter: $filter) { all published scheduled draft failed }
  }
`;


const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      content
      status
      mediaUrls
      targetPlatforms
      createdAt
      scheduledFor
      workspaceId
      workspace {
        id
        name
        slug
      }
      tenant {
        id
        name
        subdomain
      }
    }
  }
`;

const GET_POST = gql`
  query GetPost($postId: String!) {
    getPost(postId: $postId) {
      id
      content
      mediaUrls
      status
      targetPlatforms
      platformSpecificContent
      scheduledFor
      failureReasons
      tiktokSettings
      youtubeSettings
      instagramSettings
      workspaceId
    }
  }
`;

const UPDATE_POST = gql`
  mutation UpdatePost($postId: String!, $input: UpdatePostInput!) {
    updatePost(postId: $postId, input: $input) {
      id
      content
      status
      mediaUrls
      targetPlatforms
      platformSpecificContent
      scheduledFor
      tiktokSettings
      youtubeSettings
      instagramSettings
      workspaceId
    }
  }
`;

const POST_UPDATED_SUBSCRIPTION = gql`
  subscription PostUpdated {
    postUpdated {
      id
      content
      mediaUrls
      status
      failureReasons
      targetPlatforms
      platformSpecificContent
      scheduledFor
      createdAt
      workspaceId
      workspace {
        id
        name
        slug
      }
      user {
        id
        firstName
        lastName
        email
      }
      publishedPosts {
        platform
        platformPostUrl
        platformPostId
        publishStatus
        publishedAt
      }
      tenant {
        id
        name
        subdomain
      }
    }
  }
`;

const GET_TIKTOK_CREATOR_INFO = gql`
  query GetTikTokCreatorInfo($workspaceId: String) {
    getTikTokCreatorInfo(workspaceId: $workspaceId) {
      creator_nickname
      creator_avatar_url
      privacy_level_options
      max_video_post_duration_sec
      comment_disabled
      duet_disabled
      stitch_disabled
    }
  }
`;

/**
 * TikTok Creator Info - returned from TikTok's creator_info API
 */
export interface TikTokCreatorInfo {
  creator_nickname: string;
  creator_avatar_url: string;
  privacy_level_options: string[];
  max_video_post_duration_sec: number;
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
}

/**
 * TikTok Post Settings - user-selected options for posting
 * Required by TikTok Content Sharing Guidelines
 */
export interface TikTokPostSettings {
  title?: string; // TikTok post title/caption
  privacy_level: string;
  allow_comment: boolean;
  allow_duet: boolean;
  allow_stitch: boolean;
  is_brand_organic?: boolean;
  is_branded_content?: boolean;
  auto_add_music?: boolean; // Auto add music for photo posts
}

/**
 * YouTube Post Settings - user-selected options for posting
 * Note: Video description comes from the main post content field
 */
export interface YouTubePostSettings {
  title: string;
  privacy_status: string; // 'public' | 'private' | 'unlisted'
  category_id?: string;
  tags?: string[];
  is_short?: boolean;
  made_for_kids?: boolean;
  notify_subscribers?: boolean;
}



/**
 * Instagram Post Settings - user-selected options for posting
 */
export interface InstagramPostSettings {
  isTrialReel?: boolean;
  graduationStrategy?: string; // 'MANUAL' | 'SS_PERFORMANCE'
}

interface CreatePostInput {
  content: string;
  mediaUrls?: string[];
  targetPlatforms: string[];
  platformSpecificContent?: Record<string, any>;
  scheduledFor?: string;
  tiktokSettings?: TikTokPostSettings;
  youtubeSettings?: YouTubePostSettings;
  instagramSettings?: InstagramPostSettings;
}


/** Filters of the post list. The server applies them to all posts of the active workspace. */
export interface PostListFilterInput {
  status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  platform?: string;
  from?: string;
  to?: string;
  sort?: 'NEWEST' | 'OLDEST';
  limit?: number;
  offset?: number;
}

export interface PostStatusCounts {
  all: number;
  published: number;
  scheduled: number;
  draft: number;
  failed: number;
}

export interface Post {
  id: string;
  content: string;
  mediaUrls?: string[];
  status: 'PUBLISHED' | 'SCHEDULED' | 'DRAFT' | 'FAILED';
  failureReasons?: Record<string, string>;
  targetPlatforms: string[];
  scheduledFor?: string;
  createdAt: Date;
  publishedPosts?: PublishedPost[];
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
  };
  workspaceId?: string | null;
  workspace?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  platformSpecificContent?: Record<string, any>;
  tiktokSettings?: TikTokPostSettings;
  youtubeSettings?: YouTubePostSettings;
  instagramSettings?: Pick<InstagramPostSettings, 'isTrialReel' | 'graduationStrategy'>;
}

export interface PublishedPost {
  platform: string;
  platformPostUrl: string;
  publishStatus?: string;
  publishedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private postsQueryRef: QueryRef<{ getUserPosts: Post[] }> | null = null;
  private currentWatchVariables: { limit: number, offset: number } | null = null;
  private apiUrl = `${(env as any).api_url}/upload/multiple`;

  constructor(
    private apollo: Apollo,
    private http: HttpClient,
    private chunkedUploadService: ChunkedUploadService,
  ) { }

  async createPost(input: CreatePostInput): Promise<Post> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ createPost: Post }>({
        mutation: CREATE_POST,
        variables: { input },
        refetchQueries: [{
          query: GET_USER_POSTS,
          variables: { limit: 100 }
        }],
        update: (cache, { data }) => {
          if (!data?.createPost) return;

          // Read existing posts from cache
          const existingPosts = cache.readQuery<{ getUserPosts: Post[] }>({
            query: GET_USER_POSTS,
            variables: { limit: 100 }
          });

          if (existingPosts) {
            // Write updated posts to cache
            cache.writeQuery({
              query: GET_USER_POSTS,
              variables: { limit: 100 },
              data: {
                getUserPosts: [data.createPost, ...existingPosts.getUserPosts]
              }
            });
          }
        },
      })
    );
    return result.data!.createPost;
  }

  watchPosts(limit = 50, offset = 0): Observable<Post[]> {
    // Create or reuse the query reference
    const shouldRecreate = !this.postsQueryRef || 
                           !this.currentWatchVariables || 
                           this.currentWatchVariables.limit !== limit || 
                           this.currentWatchVariables.offset !== offset;

    if (shouldRecreate) {
      this.currentWatchVariables = { limit, offset };
      this.postsQueryRef = this.apollo.watchQuery<{ getUserPosts: Post[] }>({
        query: GET_USER_POSTS,
        variables: { limit, offset },
        fetchPolicy: 'cache-and-network', // Get cached data first, then fetch from network
      });
    }

    // Return the observable that emits posts
    return this.postsQueryRef!.valueChanges.pipe(
      map(result => result.data.getUserPosts)
    );
  }

  async loadMorePosts(offset: number, limit: number): Promise<Post[]> {
    if (!this.postsQueryRef) return [];

    const result = await this.postsQueryRef.fetchMore({
      variables: {
        offset,
        limit
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          getUserPosts: [...prev.getUserPosts, ...fetchMoreResult.getUserPosts]
        };
      }
    });

    return result.data.getUserPosts;
  }

  async getUserPosts(limit = 50, offset = 0): Promise<Post[]> {
    const result = await firstValueFrom(
      this.apollo.query<{ getUserPosts: Post[] }>({
        query: GET_USER_POSTS,
        variables: { limit, offset },
        fetchPolicy: 'network-only'
      })
    );
    return result.data.getUserPosts;
  }

  async deletePost(postId: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ deletePost: boolean }>({
        mutation: DELETE_POST,
        variables: { postId },
        update: (cache) => {
          // Identify and remove the post from cache
          cache.evict({ id: cache.identify({ __typename: 'Post', id: postId }) });
          cache.gc(); // Garbage collect orphaned references
        },
      })
    );
    return result.data?.deletePost || false;
  }

  async publishPost(postId: string): Promise<Post> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ publishedPost: Post }>({
        mutation: PUBLISH_POST,
        variables: { postId },
        refetchQueries: [
          {
            query: GET_USER_POSTS,
            variables: { limit: 100 }
          }
        ]
      })
    );
    return result.data!.publishedPost;
  }

  /**
   * Manually refetch posts
   */
  async refetchPosts(): Promise<void> {
    if (this.postsQueryRef) {
      await this.postsQueryRef.refetch();
    }
  }

  /**
   * Upload media files with automatic chunked upload for large files
   * @param files Files to upload
   * @param onProgress Optional callback for upload progress (0-100)
   */
  async uploadMedia(files: File[], onProgress?: (percent: number) => void): Promise<string[]> {
    // Use chunked upload service which automatically handles large files
    return this.chunkedUploadService.uploadFiles(files, onProgress);
  }

  async retryPublishPost(postId: string): Promise<Post> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ retryPublishPost: Post }>({
        mutation: RETRY_PUBLISH_POST,
        variables: { postId },
        refetchQueries: [
          {
            query: GET_USER_POSTS,
            variables: { limit: 100 }
          }
        ]
      })
    );
    return result.data!.retryPublishPost;
  }

  async getPost(postId: string): Promise<Post> {
    const result = await firstValueFrom(
      this.apollo.query<{ getPost: Post }>({
        query: GET_POST,
        variables: { postId },
        fetchPolicy: 'network-only'
      })
    );
    return result.data.getPost;
  }

  async updatePost(postId: string, input: Partial<CreatePostInput>): Promise<Post> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ updatePost: Post }>({
        mutation: UPDATE_POST,
        variables: { postId, input },
        refetchQueries: [{
          query: GET_USER_POSTS,
          variables: { limit: 100 }
        }]
      })
    );
    return result.data!.updatePost;
  }

  /** One page of the post list, with the total for the filter. */
  async listPosts(filter: PostListFilterInput): Promise<{ items: Post[]; total: number }> {
    const result = await firstValueFrom(
      this.apollo.query<{ postList: { items: Post[]; total: number } }>({
        query: POST_LIST,
        variables: { filter },
        fetchPolicy: 'network-only',
      })
    );
    return result.data.postList;
  }

  /** The number of posts for each status. The status of the filter is not used. */
  async statusCounts(filter: PostListFilterInput): Promise<PostStatusCounts> {
    const { status, limit, offset, sort, ...rest } = filter;
    const result = await firstValueFrom(
      this.apollo.query<{ postStatusCounts: PostStatusCounts }>({
        query: POST_STATUS_COUNTS,
        variables: { filter: rest },
        fetchPolicy: 'network-only',
      })
    );
    return result.data.postStatusCounts;
  }

  subscribeToPostUpdates(): Observable<Post> {
    return this.apollo.subscribe<{ postUpdated: Post }>({
      query: POST_UPDATED_SUBSCRIPTION,
    }).pipe(
      map(result => result.data!.postUpdated),
      // The server sends every update. Keep only the posts of the active workspace.
      filter(post => !post.workspaceId || post.workspaceId === WorkspaceContextService.currentId())
    );
  }

  /**
   * Get TikTok creator info for posting compliance
   * Returns privacy options, posting limits, and interaction settings
   * Required by TikTok Content Sharing Guidelines
   */
  async getTikTokCreatorInfo(workspaceId?: string | null): Promise<TikTokCreatorInfo> {
    const result = await firstValueFrom(
      this.apollo.query<{ getTikTokCreatorInfo: TikTokCreatorInfo }>({
        query: GET_TIKTOK_CREATOR_INFO,
        variables: { workspaceId: workspaceId ?? null },
        fetchPolicy: 'network-only' // Always fetch fresh from API
      })
    );
    return result.data.getTikTokCreatorInfo;
  }
}
