import { Rendertron } from './rendertron';
import fetch from 'node-fetch';
import * as urlUtils from 'url';
//import { promisify } from 'util';
import * as convert from 'xml-js';
import * as jp from 'jsonpath';
import { isValidUrl } from './urlUtils';
import { createFile } from './fileUtils';
import { Promise } from 'core-js';
import * as async from 'async';

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

    const maxItemCount: number = 2;
    const sitemapUrls: string[] = new Array();
    // const validUrlsToFetch: string[] = new Array();
    // tslint:disable-next-line:prefer-const
    let invalidUrls: string[] = new Array();
    // tslint:disable-next-line:prefer-const
    let validSuccessUrls: string[] = new Array();
    // tslint:disable-next-line:prefer-const
    let validFailedUrls: string[] = new Array();
    let fetchErrors: Error[] = new Array();
    const tronAPIUrl = `http://localhost:${process.env.PORT}/render-save/`;
    const MLSiteMapRoots: string[] = new Array();

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

    const fetchSitemapsParallel = async function(
      siteMapRoots: string[],
      siteMapsToFetch: string[]
    ) {
      return await Promise.all(
        siteMapRoots.map(async (url: string) => {
          const urlToRequest = `${url}`;
          return await fetch(urlToRequest).then(response => {
            if (response.ok) {
              response.text().then(async responseText => {
                //console.log(responseText);
                const sitemapJs = convert.xml2js(responseText, {
                  compact: true
                });
                const locs = jp.query(sitemapJs, '$..loc');

                // tslint:disable-next-line:no-any
                locs.map(async (loc: any) => {
                  if (loc._text.endsWith('.xml')) {
                    siteMapsToFetch.push(loc._text);
                  }
                });
                console.log(siteMapsToFetch);
                let siteBaseUrl = '';
                async.series(
                  siteMapsToFetch.map(siteMapToFetch => {
                    // tslint:disable-next-line:no-any
                    return async function(callback: any) {
                      //console.log(siteMapToFetch);

                      const parsedSiteMapUrl = urlUtils.parse(siteMapToFetch);
                      const siteMapLogFileName = parsedSiteMapUrl.path
                        ? parsedSiteMapUrl.path.substr(
                            parsedSiteMapUrl.path.lastIndexOf('/') + 1
                          )
                        : '';
                      console.log(siteMapLogFileName);
                      const sitemapResp = await fetch(siteMapToFetch);
                      if (sitemapResp.ok) {
                        const sitemapRespText = await sitemapResp.text();

                        const sitemapJs = convert.xml2js(sitemapRespText, {
                          compact: true
                        });

                        const locs = jp.query(sitemapJs, '$..loc');

                        //create Site Base URL from one of the URLs to fetch!
                        if (locs.length && locs.length > 0) {
                          // do this only one time first time..!!
                          const validUrlForCountryCode = locs[0]._text.trim();
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

                          // console.log(siteBaseUrl);

                          return await Promise.all(
                            // tslint:disable-next-line:no-any
                            locs.map(async (loc: any, index: number) => {
                              if (loc._text.endsWith('.xml')) {
                                //may be add to the main sitemaps array !!
                                // siteMapsToFetch.push(loc._text);
                                console.log('Got another sitemap !');
                                console.log(loc._text);
                              } else {
                                //validUrlsToFetch.push(loc._text);
                                if (index > maxItemCount) {
                                  return false;
                                }
                                // do this only one time first time..!!
                                const pageUrl = loc._text;
                                const trimmedPageUrl = pageUrl.trim();
                                //console.log(`trimmedPageUrl: ${trimmedPageUrl}`);
                                const parsedPageUrl = urlUtils.parse(
                                  trimmedPageUrl
                                );

                                const urlPathWithQuery = parsedPageUrl.path
                                  ? parsedPageUrl.path
                                  : '';

                                // console.log(urlPathWithQuery);
                                const isValid = isValidUrl(urlPathWithQuery);
                                if (isValid) {
                                  const encodedQueryStr = encodeURIComponent(
                                    parsedPageUrl.search
                                      ? parsedPageUrl.search
                                      : ''
                                  );
                                  const finalUrlToRequest = `${tronAPIUrl}${
                                    parsedPageUrl.protocol
                                  }${parsedPageUrl.host}${
                                    parsedPageUrl.pathname
                                  }${encodedQueryStr}`;

                                  console.log(`processing url: ${loc._text}`);

                                  await fetch(finalUrlToRequest)
                                    .then(response => {
                                      if (response.ok) {
                                        // console.log(`finalUrlToRequest: ${finalUrlToRequest} !!`);
                                        console.log(
                                          `fetched Url: ${trimmedPageUrl} !!`
                                        );
                                        validSuccessUrls.push(trimmedPageUrl);
                                      }
                                    })
                                    .catch(async (error: Error) => {
                                      validFailedUrls.push(trimmedPageUrl);
                                      fetchErrors.push(error);
                                      console.error(
                                        `Url: ${trimmedPageUrl} could not be fetched!!`
                                      );
                                    });
                                } else {
                                  invalidUrls.push(trimmedPageUrl);
                                }
                              }
                            })
                            // tslint:disable-next-line:arrow-parens
                          ).then(async () => {
                            const invalidUrlsFile = `invalid.json`;
                            const validSuccessUrlsFile = `validSuccess.json`;
                            const validFailedUrlsFile = `validFailed.json`;
                            const errorLogFileName = `errorLog.json`;
                            const baseLogFolderPath = `${siteBaseUrl}\\logs`;
                            const baseFolderPath = `${baseLogFolderPath}\\${siteMapLogFileName}`;

                            await CreateLogFile(
                              baseFolderPath,
                              invalidUrlsFile,
                              invalidUrls
                            );

                            await CreateLogFile(
                              baseFolderPath,
                              validSuccessUrlsFile,
                              validSuccessUrls
                            );

                            await CreateLogFile(
                              baseFolderPath,
                              validFailedUrlsFile,
                              validFailedUrls
                            );

                            if (
                              fetchErrors &&
                              fetchErrors.length &&
                              fetchErrors.length > 0
                            ) {
                              const allMessages = fetchErrors.map(
                                x => `${x.message} - ${x.stack}`
                              );
                              await CreateLogFile(
                                baseLogFolderPath,
                                errorLogFileName,
                                allMessages
                              );
                            }

                            invalidUrls = new Array();
                            validSuccessUrls = new Array();
                            validFailedUrls = new Array();
                            fetchErrors = new Array();
                          });
                        }
                      }
                      callback(); //must call this callback from series of tasks for it to finish!!
                    };
                  }),
                  async (_err, _results) => {
                    const baseFolderPath = `${siteBaseUrl}\\logs`;
                    const errorLogFileName = `error.log`;
                    if (_err) {
                      await CreateLogFile(
                        baseFolderPath,
                        errorLogFileName,
                        _err
                      );
                      console.log(`There were errors!`);
                      console.log(
                        `Please check : '${baseFolderPath}\\${errorLogFileName}' for more details.`
                      );
                    }
                    console.log('ALL TASKS DONE !!!');
                  }
                );
              });
            }
          });
        })
      );
      // return allPromises;
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
    await fetchSitemapsParallel(RootSitemapToFetch, sitemapUrls);
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
