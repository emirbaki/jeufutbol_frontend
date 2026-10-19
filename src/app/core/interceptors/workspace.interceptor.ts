import { HttpInterceptorFn } from '@angular/common/http';
import { WorkspaceContextService } from '../services/workspace-context.service';
import { environment } from '../../../environments/environment.development';

const apiOrigin = new URL(environment.api_url).origin;

/** Adds the active workspace of this tab to every request to the backend. */
export const workspaceInterceptor: HttpInterceptorFn = (req, next) => {
  const workspaceId = WorkspaceContextService.currentId();
  if (workspaceId && req.url.startsWith(apiOrigin) && !req.headers.has('X-Workspace-Id')) {
    req = req.clone({ setHeaders: { 'X-Workspace-Id': workspaceId } });
  }
  return next(req);
};
