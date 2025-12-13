import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const assetsFolder = join(browserDistFolder, 'assets');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Serve assets with short cache + revalidation (icons, images that may change)
 * This ensures updated static assets are served fresh on each deployment
 */
app.use(
  '/assets',
  express.static(assetsFolder, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    index: false,
    redirect: false,
    setHeaders: (res) => {
      res.set('Cache-Control', 'public, max-age=86400, must-revalidate');
    },
  }),
);

/**
 * Serve hashed Angular bundles with aggressive caching (1 year)
 * These files have content hashes in their names, so they're safe to cache long-term
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI
 */
export const reqHandler = createNodeRequestHandler(app);
