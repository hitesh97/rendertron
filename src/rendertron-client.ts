import { Rendertron } from './rendertron';
import fetch from 'node-fetch';
import * as urlUtils from 'url';
//import { promisify } from 'util';
import * as convert from 'xml-js';
import * as jp from 'jsonpath';
import { isValidUrl } from './urlUtils';
import { createFile } from './fileUtils';
//import { Promise } from 'core-js';
import * as async from 'async';

interface TaskItem {
  siteMap: string;
  urlToFetch: string;
}

export class RendertronClient {
  constructor(PORT: string = '6000') {
    process.env.PORT = process.env.PORT || PORT;
  }

  private _tron: Rendertron | undefined;

  public async startSiteMap() {
    this._tron = new Rendertron(process.env.PORT);
    await this._tron.initialize();
    // server has started on port 5000
    // make API one of the following type of requests  to: http://localhost:5000/
    // http://localhost:5000/render-save/https://www.microlease.com/uk/new-test-equipment
    // http://localhost:5000/render/https://www.microlease.com/uk/new-test-equipment
    // http://localhost:5000/screenshot/https://www.microlease.com/uk/new-test-equipment

    console.log('tron initialised !!');

    const maxItemCount: number = 4;
    //const sitemapUrls: string[] = new Array();
    // const validUrlsToFetch: string[] = new Array();
    // tslint:disable-next-line:prefer-const
    let invalidUrls: string[] = new Array();
    // tslint:disable-next-line:prefer-const
    let validSuccessUrls: string[] = new Array();
    // tslint:disable-next-line:prefer-const
    let validFailedUrls: string[] = new Array();
    const fetchErrors: Error[] = new Array();
    const tronAPIUrl = `http://localhost:${process.env.PORT}/render-save/`;
    const MLSiteMapRoots: string[] = new Array();
    //const siteMapsToFetch: string[] = new Array();
    let currSitemapUrl = '';
    let siteBaseUrl = '';
    let siteMapLogFileName = '';

    // fetch root sitemap(s) for ML and ER
    /*
    const MLSiteMapRoots: string[] = new Array(
      'https://www.microlease.com/uk/sitemap.xml',
      'https://www.microlease.com/no/sitemap.xml',
      'https://www.microlease.com/nl/sitemap.xml',
      'https://www.microlease.com/it/sitemap.xml',
      'https://www.microlease.com/in/sitemap.xml',
      'https://www.microlease.com/fr/sitemap.xml',
      'https://www.microlease.com/eu/sitemap.xml',
      'https://www.microlease.com/es/sitemap.xml',
      'https://www.microlease.com/de/sitemap.xml',
      'https://www.microlease.com/be_nl/sitemap.xml',
      'https://www.microlease.com/be_fr/sitemap.xml',
      'https://www.microlease.com/asia_en/sitemap.xml',
      'https://www.microlease.com/africa_en/sitemap.xml'
    );

    const ERSiteMapRoots: string[] = new Array(
      'https://www.electrorent.com/us/sitemap.xml',
      'https://www.electrorent.com/latin_es/sitemap.xml'
    );
*/

    const ERSiteMapRoots: string[] = new Array(
      'https://www.electrorent.com/us/sitemap.xml'
    );

    const RootSitemapToFetch = [...ERSiteMapRoots, ...MLSiteMapRoots];

    console.log('------------- RootSitemapToFetch ------------------');
    console.log(RootSitemapToFetch);
    console.log('------------- RootSitemapToFetch ------------------');

    const queue = async.queue((task: TaskItem, cb) => {
      setTimeout(async () => {
        if (currSitemapUrl !== task.siteMap) {
          currSitemapUrl = task.siteMap;
          const parsedSiteMapUrl = urlUtils.parse(currSitemapUrl);
          siteMapLogFileName = parsedSiteMapUrl.path
            ? parsedSiteMapUrl.path.substr(
                parsedSiteMapUrl.path.lastIndexOf('/') + 1
              )
            : '';
          console.log(`siteMapLogFileName : ${siteMapLogFileName}`);

          const validUrlForCountryCode = task.urlToFetch;
          const parsedUrlForCountryCode = urlUtils.parse(
            validUrlForCountryCode
          );
          const countryCode = parsedUrlForCountryCode.path
            ? parsedUrlForCountryCode.path.slice(
                0,
                parsedUrlForCountryCode.path.indexOf('/', 1) + 1
              )
            : '';
          siteBaseUrl = `${parsedUrlForCountryCode.protocol}//${
            parsedUrlForCountryCode.hostname
          }${countryCode}`;

          console.log(`siteBaseUrl : ${siteBaseUrl}`);
        }
        console.log(`${task.siteMap} - ${task.urlToFetch}`);

        const parsedPageUrl = urlUtils.parse(task.urlToFetch);

        const urlPathWithQuery = parsedPageUrl.path ? parsedPageUrl.path : '';

        // console.log(urlPathWithQuery);
        const isValid = isValidUrl(urlPathWithQuery);
        if (isValid) {
          console.log('----- valid -------');

          const encodedQueryStr = encodeURIComponent(
            parsedPageUrl.search ? parsedPageUrl.search : ''
          );
          const finalUrlToRequest = `${tronAPIUrl}${parsedPageUrl.protocol}${
            parsedPageUrl.host
          }${parsedPageUrl.pathname}${encodedQueryStr}`;

          console.log(`processing url: ${finalUrlToRequest}`);

          await fetch(finalUrlToRequest)
            .then(response => {
              if (response.ok) {
                // console.log(`finalUrlToRequest: ${finalUrlToRequest} !!`);
                console.log(`fetched Url: ${task.urlToFetch} !!`);
                validSuccessUrls.push(task.urlToFetch);
              }
            })
            .catch(async (error: Error) => {
              validFailedUrls.push(task.urlToFetch);
              fetchErrors.push(error);
              console.error(`Url: ${task.urlToFetch} could not be fetched!!`);
            });
        } else {
          console.log('----- Invalid -------');
          invalidUrls.push(task.urlToFetch);
        }
        cb();
      }, 100);
    }, 2);

    queue.drain = async () => {
      console.log(validSuccessUrls);
      console.log(validFailedUrls);
      console.log(invalidUrls);
      console.log(fetchErrors);

      const invalidUrlsFile = `invalid.json`;
      const validSuccessUrlsFile = `validSuccess.json`;
      const validFailedUrlsFile = `validFailed.json`;
      //const errorLogFileName = `errorLog.json`;

      const baseLogFolderPath = `${siteBaseUrl}\\logs`;
      const baseFolderPath = `${baseLogFolderPath}\\${siteMapLogFileName}`;
      await CreateLogFile(baseFolderPath, invalidUrlsFile, invalidUrls);
      await CreateLogFile(
        baseFolderPath,
        validSuccessUrlsFile,
        validSuccessUrls
      );

      await CreateLogFile(baseFolderPath, validFailedUrlsFile, validFailedUrls);
      console.log('finished !!');
    };

    async function CreateLogFile(
      baseFolderPath: string,
      fileName: string,
      // tslint:disable-next-line:no-any
      dataToLog: any
    ) {
      const fileCreated = await createFile(baseFolderPath, fileName, dataToLog);
      if (fileCreated) {
        console.log(`File ${fileName} was created !!`);
      } else {
        console.log(`Error creating file ${fileName} !!`);
      }
    }

    /*     pushInQueue = (queue: async.AsyncQueue<TaskItem>, taskItem: TaskItem) => {
      queue.push(taskItem);
    }; */
    // tslint:disable-next-line:no-any
    const fetchSingleSiteMap = async (sitemapUrl: string): Promise<any[]> => {
      return await fetch(sitemapUrl).then(async sitemapResp => {
        if (sitemapResp.ok) {
          const sitemapRespText = await sitemapResp.text();
          const sitemapJs = convert.xml2js(sitemapRespText, {
            compact: true
          });
          return jp.query(sitemapJs, '$..loc');
        } else {
          //there was error fetching sitemap!!
          return [];
        }
      });
    };

    const fetchSitemapsParallel = async function(siteMapRoots: string[]) {
      await Promise.all(
        siteMapRoots.map(async sitemapRoot => {
          return await fetchSingleSiteMap(sitemapRoot);
        })
      ).then(allRoots => {
        allRoots.forEach(rootSiteMap => {
          rootSiteMap.forEach(async itemSiteMap => {
            const finalSiteMapUrl = itemSiteMap._text.trim();
            return await fetchSingleSiteMap(finalSiteMapUrl).then(
              async siteMapResponse => {
                if (
                  siteMapResponse &&
                  siteMapResponse.length &&
                  siteMapResponse.length > 0
                ) {
                  siteMapResponse.forEach((pageUrl, index) => {
                    if (index > maxItemCount) {
                      return false;
                    } else {
                      const pageUrlText = pageUrl._text.trim();
                      queue.push({
                        siteMap: finalSiteMapUrl,
                        urlToFetch: pageUrlText
                      });
                    }
                  });
                }
              }
            );
          });
        });
      });
    };

    await fetchSitemapsParallel(RootSitemapToFetch);
  }
}

async function logUncaughtError(error: Error) {
  console.error('Uncaught exception');
  console.error(error);
  process.exit(1);
}

if (!module.parent) {
  const rendertronClient = new RendertronClient();
  rendertronClient.startSiteMap();

  process.on('uncaughtException', logUncaughtError);
  process.on('unhandledRejection', logUncaughtError);
}
