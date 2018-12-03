import { Rendertron } from './rendertron';
import fetch from 'node-fetch';
import * as urlUtils from 'url';
import { isValidUrl } from './urlUtils';
import { createFile } from './fileUtils';
import * as async from 'async';
import microleaseSample from './microlease.com.sample';
// import electrorentSample from './electrorent.com.sample';

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

    const maxItemCount: number = 9999999999;
    // tslint:disable-next-line:prefer-const
    let invalidUrls: string[] = new Array();
    // tslint:disable-next-line:prefer-const
    let validSuccessUrls: string[] = new Array();
    // tslint:disable-next-line:prefer-const
    let validFailedUrls: string[] = new Array();
    const fetchErrors: Error[] = new Array();
    const tronAPIUrl = `http://localhost:${process.env.PORT}/render-save/`;
    let currSitemapUrl = '';
    let siteBaseUrl = '';
    let siteMapLogFileName = '';
    /*
    const finalSiteMapUrl = electrorentSample.SiteMapUrl;
    const urlsToFetch = [...electrorentSample.UrlsToFetch];
*/

    const finalSiteMapUrl = microleaseSample.SiteMapUrl;
    const urlsToFetch = [...microleaseSample.UrlsToFetch];

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

    const fetchItemsWithQueue = async function(urlsToFetch: string[]) {
      urlsToFetch.forEach((pageUrl, index) => {
        if (index > maxItemCount) {
          return false;
        } else {
          const pageUrlText = pageUrl.trim();
          queue.push({
            siteMap: finalSiteMapUrl,
            urlToFetch: pageUrlText
          });
        }
      });
    };
    await fetchItemsWithQueue(urlsToFetch);
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
