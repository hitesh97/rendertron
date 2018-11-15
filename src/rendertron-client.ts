import { Rendertron } from './rendertron';
import fetch from 'node-fetch';
import * as urlUtils from 'url';

// import * as convert from 'xml-js';
// import * as jp from 'jsonpath';

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

    // fetch root sitemap(s) for ML and ER
    /*     const MLSiteMapRoots: string[] = new Array(
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
    /*
    const ERSiteMapRoots: string[] = new Array(
      'https://www.electrorent.com/us/sitemap.xml'
    );

    const RootSitemapToFetch = ERSiteMapRoots;
    const fetchSitemapsParallel = async function(siteMapRoots: string[]) {
      //transform requests into Promises, await all
      try {
        await Promise.all(
          // tslint:disable-next-line:arrow-parens
          siteMapRoots.map(async (url: string) => {
            const urlToRequest = `${url}`;
            await fetch(urlToRequest)
              // tslint:disable-next-line:arrow-parens
              .then(response => {
                if (response.ok) {
                  // tslint:disable-next-line:arrow-parens
                  response.text().then(responseText => {
                    //console.log(responseText);
                    const sitemapJs = convert.xml2js(responseText, {
                      compact: true
                    });
                    // console.log(sitemapJs);

                    //const locs = jp.query(sitemapJs, '$..elements');
                    const locs = jp.query(sitemapJs, '$..loc');
                    // console.log(locs);
                    locs.map((loc: any) => {
                      if (loc._text.endsWith('.xml')) {
                        console.log(loc);
                        // get next sitemap recursively!!
                        fetchSitemapsParallel([loc._text]);
                      } else {
                        //fetch page as its not another sitemap xml!!
                        console.log(`fetching ${loc._text}`);
                      }
                    });

                    console.log(`fetched Url: ${urlToRequest} !!`);
                  });
                }
              })
              // tslint:disable-next-line:arrow-parens
              .catch(error => {
                console.error(`Url: ${urlToRequest} could not be fetched!!`);
                console.error(error);
              });
          })
        );
      } catch (err) {
        console.error(err);
      }
      console.log(`Sitemaps Fetch Finished !!`);
    };

    fetchSitemapsParallel(RootSitemapToFetch);
*/

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
      'products/Keysight-Technologies/Other-Test-Equipment/04142-61633?basemodelid=8',
      'products/Keysight-Technologies/Other-Test-Equipment/04142-61636?basemodelid=10',
      'products/Keysight-Technologies/Other-Test-Equipment/04155-40045?basemodelid=24'
    );

    /*
    const urlsToFetch: string[] = new Array(
      'products/Keysight-Technologies/Other-Test-Equipment/04142-61636?basemodelid=10'
    );
    */
    const getParallel = async function() {
      //transform requests into Promises, await all
      try {
        await Promise.all(
          // tslint:disable-next-line:arrow-parens
          urlsToFetch.map(async url => {
            const urlToRequest = encodeURI(`${baseUrl}${url}`);
            const parsedUrl = urlUtils.parse(urlToRequest);
            const encodedQueryStr = encodeURIComponent(
              parsedUrl.search ? parsedUrl.search : ''
            );
            const finalUrlToRequest = `${tronAPIUrl}${parsedUrl.protocol}${
              parsedUrl.host
            }${parsedUrl.pathname}${encodedQueryStr}`;
            //var url = new URL(fullUrl);
            // console.log('---------- getParallel ------------');
            //console.log(parsedUrl);
            // console.log(finalUrlToRequest);
            // console.log('---------- getParallel ------------');

            await fetch(finalUrlToRequest)
              // tslint:disable-next-line:arrow-parens
              .then(response => {
                if (response.ok) {
                  console.log(`fetched Url: ${urlToRequest} !!`);
                }
              })
              // tslint:disable-next-line:arrow-parens
              .catch(error => {
                console.error(`Url: ${urlToRequest} could not be fetched!!`);
                console.error(error);
              });
          })
        );
      } catch (err) {
        console.error(err);
      }
      console.log(`ALL fetch Finished !!`);
    };
    getParallel();
  }
}

async function logUncaughtError(error: Error) {
  console.error('Uncaught exception');
  console.error(error);
  process.exit(1);
}

if (!module.parent) {
  const rendertronClient = new RendertronClient();
  rendertronClient.start();

  process.on('uncaughtException', logUncaughtError);
  process.on('unhandledRejection', logUncaughtError);
}
