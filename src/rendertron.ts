import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as koaCompress from 'koa-compress';
import * as route from 'koa-route';
import * as koaSend from 'koa-send';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import * as url from 'url';

import { Renderer, ScreenshotError } from './renderer';

const CONFIG_PATH = path.resolve(__dirname, '../config.json');

type Config = {
  datastoreCache: boolean;
  outDir: string;
};

/**
 * Rendertron rendering service. This runs the server which routes rendering
 * requests through to the renderer.
 */
export class Rendertron {
  constructor(private PORT: string = '4000') {
    process.env.PORT = process.env.PORT || PORT;
  }
  app: Koa = new Koa();
  config: Config = { datastoreCache: false, outDir: '' };
  private renderer: Renderer | undefined;

  public async initialize() {
    // Load config.json if it exists.
    if (fse.pathExistsSync(CONFIG_PATH)) {
      this.config = Object.assign(this.config, await fse.readJson(CONFIG_PATH));
    }

    if (this.config.outDir !== '') {
      if (!fs.existsSync(path.resolve(__dirname, this.config.outDir))) {
        fs.mkdirSync(path.resolve(__dirname, this.config.outDir));
      }
    }
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    this.renderer = new Renderer(browser);

    this.app.use(koaCompress());

    this.app.use(bodyParser());

    this.app.use(
      route.get('/', async (ctx: Koa.Context) => {
        await koaSend(ctx, 'index.html', {
          root: path.resolve(__dirname, '../src')
        });
      })
    );
    this.app.use(
      route.get('/_ah/health', (ctx: Koa.Context) => (ctx.body = 'OK'))
    );

    // Optionally enable cache for rendering requests.
    if (this.config.datastoreCache) {
      const { DatastoreCache } = await import('./datastore-cache');
      this.app.use(new DatastoreCache().middleware());
    }

    this.app.use(
      route.get('/render/:url(.*)', this.handleRenderRequest.bind(this))
    );
    this.app.use(
      route.get(
        '/render-save/:url(.*)',
        this.handleRenderSaveRequest.bind(this)
      )
    );
    this.app.use(
      route.get('/screenshot/:url(.*)', this.handleScreenshotRequest.bind(this))
    );
    this.app.use(
      route.post(
        '/screenshot/:url(.*)',
        this.handleScreenshotRequest.bind(this)
      )
    );

    return this.app.listen(this.PORT, () => {
      console.log(`Listening on port ${this.PORT}`);
    });
  }

  getUrlFileName(href: string): string {
    const parsedUrl = url.parse(href);
    return parsedUrl.pathname ? parsedUrl.pathname : '';
  }
  /**
   * Checks whether or not the URL is valid. For example, we don't want to allow
   * the requester to read the file system via Chrome.
   */
  restricted(href: string): boolean {
    const parsedUrl = url.parse(href);
    const protocol = parsedUrl.protocol || '';

    if (!protocol.match(/^https?/)) {
      return true;
    }

    return false;
  }
  async handleRenderSaveRequest(ctx: Koa.Context, url: string) {
    if (!this.renderer) {
      throw new Error('No renderer initalized yet.');
    }

    if (this.restricted(url)) {
      ctx.status = 403;
      return;
    }

    const filePathName = this.getUrlFileName(url);
    const destFolderPath = path.resolve(
      __dirname,
      this.config.outDir + filePathName
    );
    // console.log('----------------------------');
    // console.log(filePathName);
    // console.log('----------------------------');

    const mobileVersion = 'mobile' in ctx.query ? true : false;

    const serialized = await this.renderer.serialize(url, mobileVersion);
    // Mark the response as coming from Rendertron.
    ctx.set('x-renderer', 'rendertron');
    ctx.status = serialized.status;
    ctx.body = serialized.content;
    // const desiredMode = 0o2775;
    fse
      .ensureDir(destFolderPath)
      .then(() => {
        console.log(`folder '${destFolderPath}' Created !`);
        fs.writeFileSync(
          path.resolve(`${destFolderPath}/index.html`),
          serialized.content
        );
      })
      .catch(err => {
        console.error(`Could not create folder '${destFolderPath}' !!`);
        console.error(err);
      });
  }

  async handleRenderRequest(ctx: Koa.Context, url: string) {
    if (!this.renderer) {
      throw new Error('No renderer initalized yet.');
    }

    if (this.restricted(url)) {
      ctx.status = 403;
      return;
    }

    const mobileVersion = 'mobile' in ctx.query ? true : false;

    const serialized = await this.renderer.serialize(url, mobileVersion);
    // Mark the response as coming from Rendertron.
    ctx.set('x-renderer', 'rendertron');
    ctx.status = serialized.status;
    ctx.body = serialized.content;
  }

  async handleScreenshotRequest(ctx: Koa.Context, url: string) {
    if (!this.renderer) {
      throw new Error('No renderer initalized yet.');
    }

    if (this.restricted(url)) {
      ctx.status = 403;
      return;
    }

    let options = undefined;
    if (ctx.method === 'POST' && ctx.request.body) {
      options = ctx.request.body;
    }

    const dimensions = {
      width: Number(ctx.query['width']) || 1000,
      height: Number(ctx.query['height']) || 1000
    };

    const mobileVersion = 'mobile' in ctx.query ? true : false;

    try {
      const img = await this.renderer.screenshot(
        url,
        mobileVersion,
        dimensions,
        options
      );
      ctx.set('Content-Type', 'image/jpeg');
      ctx.set('Content-Length', img.length.toString());
      ctx.body = img;
    } catch (error) {
      const err = error as ScreenshotError;
      ctx.status = err.type === 'Forbidden' ? 403 : 500;
    }
  }
}
/* 
async function logUncaughtError(error: Error) {
  console.error('Uncaught exception');
  console.error(error);
  process.exit(1);
} */

// Start rendertron if not running inside tests.
/* if (!module.parent) {
  const rendertron = new Rendertron();
  rendertron.initialize();

  process.on('uncaughtException', logUncaughtError);
  process.on('unhandledRejection', logUncaughtError);
} */
