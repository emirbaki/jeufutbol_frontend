import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { PostsListComponent } from './post-list.component';
import { Post, PostsService } from '../../../services/posts.service';

const post = (id: string) =>
  ({ id, content: id, status: 'DRAFT', targetPlatforms: ['x'], createdAt: new Date() }) as unknown as Post;

describe('PostsListComponent selection', () => {
  let fixture: ComponentFixture<PostsListComponent>;
  let component: PostsListComponent;
  let postsService: jasmine.SpyObj<PostsService>;
  let confirmSpy: jasmine.Spy;
  let alertSpy: jasmine.Spy;

  const page = (ids: string[]) => ({ items: ids.map(post), total: ids.length });
  const counts = { all: 0, published: 0, scheduled: 0, draft: 0, failed: 0 };
  const el = () => fixture.nativeElement as HTMLElement;
  const render = async () => {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    postsService = jasmine.createSpyObj<PostsService>('PostsService', [
      'listPosts',
      'statusCounts',
      'subscribeToPostUpdates',
      'deletePosts',
    ]);
    postsService.listPosts.and.resolveTo(page(['p1', 'p2', 'p3']));
    postsService.statusCounts.and.resolveTo(counts);
    postsService.subscribeToPostUpdates.and.returnValue(EMPTY as never);
    confirmSpy = spyOn(window, 'confirm').and.returnValue(true);
    alertSpy = spyOn(window, 'alert');

    TestBed.configureTestingModule({
      imports: [PostsListComponent],
      providers: [provideRouter([]), { provide: PostsService, useValue: postsService }],
    });
    fixture = TestBed.createComponent(PostsListComponent);
    component = fixture.componentInstance;
    await render();
  });

  it('shows a checkbox for each post and no delete action without a selection', () => {
    expect(el().querySelectorAll('input[data-testid="post-select"]').length).toBe(3);
    expect(el().querySelector('[data-testid="delete-selected"]')).toBeNull();
  });

  it('shows the selected count and the delete action after the user selects a post', async () => {
    el().querySelector<HTMLInputElement>('input[data-testid="post-select"]')!.click();
    await render();

    expect(component.selectedCount()).toBe(1);
    expect(el().querySelector('[data-testid="delete-selected"]')!.textContent).toContain('Delete selected (1)');
  });

  it('selects all shown posts, then clears them on the second click', () => {
    component.toggleSelectAll();
    expect(component.selectedCount()).toBe(3);
    expect(component.allShownSelected()).toBeTrue();

    component.toggleSelectAll();
    expect(component.selectedCount()).toBe(0);
  });

  it('does not delete when the user cancels the confirmation', async () => {
    confirmSpy.and.returnValue(false);
    component.togglePostSelection('p1');

    await component.deleteSelected();

    expect(postsService.deletePosts).not.toHaveBeenCalled();
    expect(component.selectedCount()).toBe(1);
  });

  it('deletes the selected posts and loads the list again', async () => {
    postsService.deletePosts.and.resolveTo({ deletedIds: ['p1', 'p2'], failedIds: [] });
    component.togglePostSelection('p1');
    component.togglePostSelection('p2');
    postsService.listPosts.and.resolveTo(page(['p3']));

    await component.deleteSelected();

    expect(postsService.deletePosts).toHaveBeenCalledOnceWith(['p1', 'p2']);
    expect(component.posts().map((p) => p.id)).toEqual(['p3']);
    expect(component.selectedCount()).toBe(0);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('keeps a failed post selected and tells the user', async () => {
    postsService.deletePosts.and.resolveTo({ deletedIds: ['p1'], failedIds: ['p2'] });
    component.togglePostSelection('p1');
    component.togglePostSelection('p2');
    postsService.listPosts.and.resolveTo(page(['p2', 'p3']));

    await component.deleteSelected();

    expect(component.isSelected('p2')).toBeTrue();
    expect(component.selectedCount()).toBe(1);
    expect(alertSpy).toHaveBeenCalledOnceWith('Could not delete 1 of 2 posts.');
  });

  it('keeps the selection when the request fails', async () => {
    postsService.deletePosts.and.rejectWith(new Error('network'));
    component.togglePostSelection('p1');

    await component.deleteSelected();

    expect(component.isSelected('p1')).toBeTrue();
    expect(component.deletingSelected()).toBeFalse();
    expect(alertSpy).toHaveBeenCalledOnceWith('Failed to delete the selected posts');
  });

  it('removes a post from the selection when a filter hides the post', async () => {
    component.togglePostSelection('p1');
    component.togglePostSelection('p3');
    postsService.listPosts.and.resolveTo(page(['p3']));

    component.applyFilter('DRAFT');
    await render();

    expect(component.isSelected('p1')).toBeFalse();
    expect(component.isSelected('p3')).toBeTrue();
    expect(component.selectedCount()).toBe(1);
  });
});
