import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { PostComposerComponent } from './post-composer.component';
import { PostsService, TikTokCreatorInfo, TikTokPostSettings } from '../../services/posts.service';
import { ComponentStateService } from '../../services/component-state.service';
import { CredentialsService } from '../../services/credentials.service';
import { WorkspaceContextService } from '../../core/services/workspace-context.service';
import { PlatformType } from '../../models/platform.model';

const CREATOR_INFO = {
  creator_nickname: 'creator',
  privacy_level_options: ['PUBLIC_TO_EVERYONE', 'SELF_ONLY'],
} as unknown as TikTokCreatorInfo;

const SAVED_SETTINGS: TikTokPostSettings = {
  title: 'Saved title',
  privacy_level: 'SELF_ONLY',
  allow_comment: true,
  allow_duet: true,
  allow_stitch: true,
  is_brand_organic: true,
  is_branded_content: false,
  auto_add_music: false,
};

describe('PostComposerComponent TikTok settings', () => {
  let component: PostComposerComponent;
  let postsService: jasmine.SpyObj<PostsService>;

  /** Lets the creator info request that loadPost does not await finish. */
  const flush = () => new Promise((resolve) => setTimeout(resolve));

  beforeEach(() => {
    postsService = jasmine.createSpyObj<PostsService>('PostsService', ['getPost', 'getTikTokCreatorInfo']);
    postsService.getTikTokCreatorInfo.and.resolveTo(CREATOR_INFO);

    TestBed.configureTestingModule({
      imports: [PostComposerComponent],
      providers: [
        { provide: PostsService, useValue: postsService },
        { provide: ComponentStateService, useValue: { saveComposerState: () => undefined, getComposerState: () => null } },
        { provide: CredentialsService, useValue: { getCredentials: () => Promise.resolve([]) } },
        { provide: WorkspaceContextService, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null } } },
        },
        { provide: Router, useValue: { navigate: () => undefined } },
      ],
    }).overrideComponent(PostComposerComponent, { set: { template: '', imports: [] } });

    component = TestBed.createComponent(PostComposerComponent).componentInstance;
  });

  it('keeps the saved settings after the creator info loads', async () => {
    postsService.getPost.and.resolveTo({
      id: 'p1',
      content: 'text',
      targetPlatforms: ['tiktok'],
      tiktokSettings: SAVED_SETTINGS,
    } as never);

    await component.loadPost('p1');
    await flush();

    expect(component.tiktokCreatorInfo()).toEqual(CREATOR_INFO);
    expect(component.tiktokSettings()).toEqual(SAVED_SETTINGS);
    expect(component.showCommercialDisclosure()).toBeTrue();
  });

  it('loads the creator info for a TikTok post that has no saved settings', async () => {
    postsService.getPost.and.resolveTo({
      id: 'p2',
      content: 'text',
      targetPlatforms: ['TIKTOK'],
      tiktokSettings: null,
    } as never);

    await component.loadPost('p2');
    await flush();

    expect(postsService.getTikTokCreatorInfo).toHaveBeenCalledTimes(1);
    expect(component.tiktokCreatorInfo()).toEqual(CREATOR_INFO);
  });

  it('does not load the creator info for a post without TikTok', async () => {
    postsService.getPost.and.resolveTo({
      id: 'p3',
      content: 'text',
      targetPlatforms: ['x'],
    } as never);

    await component.loadPost('p3');
    await flush();

    expect(postsService.getTikTokCreatorInfo).not.toHaveBeenCalled();
  });

  it('resets the settings when the user enables TikTok', async () => {
    component.tiktokSettings.set(SAVED_SETTINGS);
    const tiktok = component.platforms().find((p) => p.type === PlatformType.TIKTOK)!;
    expect(tiktok.enabled).toBeFalse();

    component.togglePlatform(tiktok);
    await flush();

    expect(component.tiktokSettings().privacy_level).toBe('');
    expect(component.tiktokSettings().title).toBe('');
  });
});
