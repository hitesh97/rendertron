import { Rendertron } from './rendertron';
import fetch from 'node-fetch';
import * as urlUtils from 'url';
//import { promisify } from 'util';
import * as convert from 'xml-js';
import * as jp from 'jsonpath';
import { isValidUrl } from './urlUtils';
import { createFile } from './fileUtils';
import { Promise } from 'core-js';

export class RendertronClient {
  constructor(PORT: string = '6000') {
    process.env.PORT = process.env.PORT || PORT;
  }

  private _tron: Rendertron | undefined;
  // private port = process.env.PORT;
  public async start() {
    this._tron = new Rendertron(process.env.PORT);
    await this._tron.initialize();
    // server has started on port 5000
    // make API one of the following type of requests  to: http://localhost:5000/
    // http://localhost:5000/render-save/https://www.microlease.com/uk/new-test-equipment
    // http://localhost:5000/render/https://www.microlease.com/uk/new-test-equipment
    // http://localhost:5000/screenshot/https://www.microlease.com/uk/new-test-equipment

    console.log('tron initialised !!');

    const invalidUrls: string[] = new Array();
    const validSuccessUrls: string[] = new Array();
    const validFailedUrls: string[] = new Array();
    const tronAPIUrl = `http://localhost:${process.env.PORT}/render-save/`;
    const baseUrl = 'https://www.microlease.com/uk/';
    // const baseUrl = 'https://www.electrorent.com/us/';

    const urlsToFetch: string[] = new Array(
      'home',
      'rent-test-equipment',
      'used-test-equipment',
      'new-test-equipment',
      'manufacturer/3ztel/3z-telecom',
      'manufacturer/advt/advantest',
      'manufacturer/ixia/ixia',
      'product-group/3/rf-signal-generators',
      'product-group/13/oscilloscopes',
      'manufacturer/abb/asea brown boveri',
      'manufacturer/ahsys/a.h. systems inc',
      'manufacturer/afs /advanced fibre solution',
      'manufacturer/asr/associated research, inc.',
      'products/Keysight-Technologies/Other-Test-Equipment/04155-61612?basemodelid=38',
      'products/Keysight-Technologies/Other-Test-Equipment/04142-61636?basemodelid=10',
      'products/Keysight-Technologies/Other-Test-Equipment/04155-40045?basemodelid=24',
      'products/Keysight-Technologies/Other-Test-Equipment/04155-61714?basemodelid=53',
      'products/Keysight-Technologies/Other-Test-Equipment/0699-3702?basemodelid=116',
      'products/Keysight-Technologies/RF-Power-Noise-and-Other-Products/11667A?basemodelid=322',
      'products/Pomona-Electronics/Other-Test-Equipment/72938?basemodelid=128207',
      'products/Pomona-Electronics/Other-Test-Equipment/72940-8?basemodelid=128209',
      'products/Anritsu/Other-Test-Equipment/S332E-3025?basemodelid=126468',
      'products/Rohde-Schwarz/Other-Test-Equipment/RT-ZA31?basemodelid=126489',
      'products/Viavi-formerly-JDSU-/Other-Test-Equipment/C5243GCPRI-U1?basemodelid=126499',
      'products/Rohde-Schwarz/Other-Test-Equipment/RT ZA31?basemodelid=1264893545',
      'products/Rohde-Schwarz/Other-Test-Equipment/RT-ZA3187,?basemodelid=126489',
      'products/Rohde-Schwarz/Other-Test-Equipment/RT-ZA3187&&?basemodelid=126489',
      'products/Rohde-Schwarz/Other-Test-Equipment/RT-ZA3187^?basemodelid=126489',
      'products/Rohde-Schwarz/Other-Test-Equipment/RT$ZA3187?basemodelid=126489',
      'products/Rohde-Schwarz/Other-Test-Equipment/RT£ZA3187?basemodelid=126489',
      'products/Rohde-Schwarz/Other-Test-Equipment/RT^ZA3187?basemodelid=126489'
    );

    const getParallel = async function() {
      //transform requests into Promises, await all
      try {
        await Promise.all(
          urlsToFetch.map(async url => {
            const isValid = isValidUrl(url);
            if (isValid) {
              const urlToRequest = encodeURI(`${baseUrl}${url}`);
              const parsedUrl = urlUtils.parse(urlToRequest);
              const encodedQueryStr = encodeURIComponent(
                parsedUrl.search ? parsedUrl.search : ''
              );
              const finalUrlToRequest = `${tronAPIUrl}${parsedUrl.protocol}${
                parsedUrl.host
              }${parsedUrl.pathname}${encodedQueryStr}`;

              await fetch(finalUrlToRequest)
                .then(response => {
                  if (response.ok) {
                    // console.log(`finalUrlToRequest: ${finalUrlToRequest} !!`);
                    console.log(`fetched Url: ${urlToRequest} !!`);
                    validSuccessUrls.push(urlToRequest);
                  }
                })
                .catch(error => {
                  validFailedUrls.push(urlToRequest);
                  console.error(`Url: ${urlToRequest} could not be fetched!!`);
                  console.error(error);
                });
            } else {
              invalidUrls.push(url);
            }
          })
        )
          .then(async () => {
            const invalidUrlsFile = 'invalid_urls.json';
            const fileCreated = await createFile(
              baseUrl,
              invalidUrlsFile,
              invalidUrls
            );
            if (fileCreated) {
              console.log(`File ${invalidUrlsFile} was created !!`);
            } else {
              console.log(`Error creating file ${invalidUrlsFile} !!`);
            }
          })
          .then(async () => {
            const validSuccessUrlsFile = 'valid_success_urls.json';
            const fileCreated = await createFile(
              baseUrl,
              validSuccessUrlsFile,
              validSuccessUrls
            );
            if (fileCreated) {
              console.log(`File ${validSuccessUrlsFile} was created !!`);
            } else {
              console.log(`Error creating file ${validSuccessUrlsFile} !!`);
            }
          })
          .then(async () => {
            const validFailedUrlsFile = 'valid_failed_urls.json';
            const fileCreated = await createFile(
              baseUrl,
              validFailedUrlsFile,
              validFailedUrls
            );
            if (fileCreated) {
              console.log(`File ${validFailedUrlsFile} was created !!`);
            } else {
              console.log(`Error creating file ${validFailedUrlsFile} !!`);
            }
          })
          .then(() => {
            console.log(`ALL fetch Finished !!`);
          });
      } catch (err) {
        console.error(err);
      }
    };
    getParallel();
  }

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
    let invalidUrls: string[] = new Array();
    let validSuccessUrls: string[] = new Array();
    let validFailedUrls: string[] = new Array();
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
      await Promise.all(
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
                await Promise.all(
                  siteMapsToFetch.map(async siteMapToFetch => {
                    // console.log('------------ endSiteMap --------------');
                    // console.log(siteMapToFetch);
                    // invalidUrls.push(siteMapToFetch);
                    // validSuccessUrls.push(siteMapToFetch);
                    // validFailedUrls.push(siteMapToFetch);

                    const parsedSiteMapUrl = urlUtils.parse(siteMapToFetch);
                    const siteMapLogFileName = parsedSiteMapUrl.path
                      ? parsedSiteMapUrl.path.substr(
                          parsedSiteMapUrl.path.lastIndexOf('/') + 1
                        )
                      : '';
                    return await fetch(siteMapToFetch).then(sitemapResp => {
                      if (sitemapResp.ok) {
                        sitemapResp.text().then(async sitemapRespText => {
                          const sitemapJs = convert.xml2js(sitemapRespText, {
                            compact: true
                          });
                          const locs = jp.query(sitemapJs, '$..loc');
                          //create Site Base URL from one of the URLs to fetch!
                          let siteBaseUrl = '';
                          if (locs.length && locs.length > 0) {
                            // do this only one time first time..!!
                            const validUrlForCountryCode = locs[0]._text.trim();
                            const parsedUrlForCountryCode = urlUtils.parse(
                              validUrlForCountryCode
                            );
                            const countryCode = parsedUrlForCountryCode.path
                              ? parsedUrlForCountryCode.path.slice(
                                  0,
                                  parsedUrlForCountryCode.path.indexOf('/', 1) +
                                    1
                                )
                              : '';
                            siteBaseUrl = `${
                              parsedUrlForCountryCode.protocol
                            }//${
                              parsedUrlForCountryCode.hostname
                            }${countryCode}`;

                            console.log(siteBaseUrl);
                          }
                          await Promise.all(
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
                                  console.log(
                                    `finalUrlToRequest : ${finalUrlToRequest}`
                                  );

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
                                    .catch(error => {
                                      validFailedUrls.push(trimmedPageUrl);
                                      console.error(
                                        `Url: ${trimmedPageUrl} could not be fetched!!`
                                      );
                                      console.error(error);
                                    });
                                } else {
                                  invalidUrls.push(trimmedPageUrl);
                                }
                              }
                            })
                            // tslint:disable-next-line:arrow-parens
                          ).then(async () => {
                            console.log('--- this is per site map file !! ---');
                            console.log(siteMapToFetch);
                            console.log(validSuccessUrls);
                            // siteMapToFetch
                            const invalidUrlsFile = `invalid.json`;
                            const validSuccessUrlsFile = `validSuccess.json`;
                            const validFailedUrlsFile = `validFailed.json`;
                            const baseFolderPath = `${siteBaseUrl}\\logs\\${siteMapLogFileName}`;
                            // console.log(invalidUrlsFile);

                            //log all invalid URLs
                            const invalidFileCreated = await createFile(
                              baseFolderPath,
                              invalidUrlsFile,
                              invalidUrls
                            );
                            if (invalidFileCreated) {
                              console.log(
                                `File ${invalidUrlsFile} was created !!`
                              );
                            } else {
                              console.log(
                                `Error creating file ${invalidUrlsFile} !!`
                              );
                            }

                            const validSuccessFileCreated = await createFile(
                              baseFolderPath,
                              validSuccessUrlsFile,
                              validSuccessUrls
                            );
                            if (validSuccessFileCreated) {
                              console.log(
                                `File ${validSuccessUrlsFile} was created !!`
                              );
                            } else {
                              console.log(
                                `Error creating file ${validSuccessUrlsFile} !!`
                              );
                            }

                            const validFailedFileCreated = await createFile(
                              baseFolderPath,
                              validFailedUrlsFile,
                              validFailedUrls
                            );
                            if (validFailedFileCreated) {
                              console.log(
                                `File ${validFailedUrlsFile} was created !!`
                              );
                            } else {
                              console.log(
                                `Error creating file ${validFailedUrlsFile} !!`
                              );
                            }

                            invalidUrls = new Array();
                            validSuccessUrls = new Array();
                            validFailedUrls = new Array();
                          });
                        });
                      }
                    });
                  })
                ).then(() => {
                  console.log('------------ All Done --------------');
                });
              });
            }
          });
        })
      );
      // return allPromises;
    };

    await fetchSitemapsParallel(RootSitemapToFetch, sitemapUrls).then(() => {
      console.log(`Outer then !!`);
    });
  }
}

async function logUncaughtError(error: Error) {
  console.error('Uncaught exception');
  console.error(error);
  process.exit(1);
}

if (!module.parent) {
  const rendertronClient = new RendertronClient();
  // rendertronClient.start();
  rendertronClient.startSiteMap();

  process.on('uncaughtException', logUncaughtError);
  process.on('unhandledRejection', logUncaughtError);
}
