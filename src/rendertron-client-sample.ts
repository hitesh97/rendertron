import { Rendertron } from './rendertron';
import fetch from 'node-fetch';
import * as urlUtils from 'url';
//import { promisify } from 'util';
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

    const urlsToFetch: string[] = [
      'https://www.microlease.com/uk/home',
      'https://www.microlease.com/uk/current-promotions',
      'https://www.microlease.com/uk/page/fluke_oem_promotions',
      'https://www.microlease.com/uk/page/weekly_product_promotions',
      'https://www.microlease.com/uk/page/black_friday_promotions',
      'https://www.microlease.com/uk/all-manufacturers',
      'https://www.microlease.com/uk/manufacturer/3ztel/3z-telecom',
      'https://www.microlease.com/uk/manufacturer/advt/advantest',
      'https://www.microlease.com/uk/manufacturer/anri/anritsu',
      'https://www.microlease.com/uk/manufacturer/exfo/exfo',
      'https://www.microlease.com/uk/manufacturer/fl/fluke',
      'https://www.microlease.com/uk/manufacturer/instk/gw-instek',
      'https://www.microlease.com/uk/manufacturer/ky/keithley',
      'https://www.microlease.com/uk/manufacturer/keysi/keysight-technologies',
      'https://www.microlease.com/uk/manufacturer/rs/rohde-and-schwarz',
      'https://www.microlease.com/uk/manufacturer/tek/tektronix',
      'https://www.microlease.com/uk/manufacturer/jdsu/viavi',
      'https://www.microlease.com/uk/manufacturer/wavec/wavecontrol',
      'https://www.microlease.com/uk/all-product-groups',
      'https://www.microlease.com/uk/product-group/20/ac-sources',
      'https://www.microlease.com/uk/product-group/21/ac-dc-electronic-loads',
      'https://www.microlease.com/uk/product-group/6/bert-arb-pattern-generators',
      'https://www.microlease.com/uk/product-group/10/cable-antenna-and-pim-analysers',
      'https://www.microlease.com/uk/product-group/19/dc-power-supplies',
      'https://www.microlease.com/uk/product-group/27/electrical-installation-and-high-voltage-test',
      'https://www.microlease.com/uk/product-group/26/electrical-power-and-energy-measurement',
      'https://www.microlease.com/uk/product-group/23/electrical-test-equipment',
      'https://www.microlease.com/uk/product-group/24/environmental-test-equipment',
      'https://www.microlease.com/uk/product-group/18/function-pulse-generators',
      'https://www.microlease.com/uk/product-group/28/infrared-and-temerature-measurement',
      'https://www.microlease.com/uk/product-group/11/lan-wan-analysers',
      'https://www.microlease.com/uk/product-group/17/lcr-impedance-analysers',
      'https://www.microlease.com/uk/product-group/22/logic-analysers',
      'https://www.microlease.com/uk/product-group/9/mobile-comms-test-equipment',
      'https://www.microlease.com/uk/product-group/15/modular-products',
      'https://www.microlease.com/uk/product-group/14/multimeters-data%C2%A0acquisition-counters',
      'https://www.microlease.com/uk/product-group/7/optical-sampling-scopes',
      'https://www.microlease.com/uk/product-group/8/optical-test-equipment',
      'https://www.microlease.com/uk/product-group/13/oscilloscopes',
      'https://www.microlease.com/uk/product-group/2/rf-network-analysers',
      'https://www.microlease.com/uk/product-group/4/rf-power-noise-and-other-products',
      'https://www.microlease.com/uk/product-group/3/rf-signal-generators',
      'https://www.microlease.com/uk/product-group/1/rf-spectrum-analysers',
      'https://www.microlease.com/uk/product-group/5/sdh-sonet-ethernet',
      'https://www.microlease.com/uk/product-group/16/semiconductor-parametric-analysers',
      'https://www.microlease.com/uk/product-group/12/xdsl-t1-e1-test-equipment',
      'https://www.microlease.com/uk/product-group/25/other-test-equipment',
      'https://www.microlease.com/uk/rent-test-equipment',
      'https://www.microlease.com/uk/new-test-equipment',
      'https://www.microlease.com/uk/used-test-equipment',
      'https://www.microlease.com/uk/contactus',
      'https://www.microlease.com/uk/products/keysight%20technologies/rf%20spectrum%20analyzers/n9000b?basemodelid=101899',
      'https://www.microlease.com/uk/products/keysight%20technologies/multimeters%2c%20data%c2%a0acquisition%2c%20counters/34901a?basemodelid=762',
      'https://www.microlease.com/uk/products/keysight%20technologies/multimeters%2c%20data%c2%a0acquisition%2c%20counters/34972a?basemodelid=809',
      'https://www.microlease.com/uk/products/keysight%20technologies/multimeters%2c%20data%c2%a0acquisition%2c%20counters/34922a?basemodelid=772',
      'https://www.microlease.com/uk/products/keysight%20technologies/other%20test%20equipment/msox3024t?basemodelid=96712',
      'https://www.microlease.com/uk/products/keysight%20technologies/oscilloscopes/dsox2012a?basemodelid=1792',
      'https://www.microlease.com/uk/products/gw%20instek/oscilloscopes/gds-3354?basemodelid=80030',
      'https://www.microlease.com/uk/products/gw%20instek/multimeters%2c%20data%c2%a0acquisition%2c%20counters/gdm-8261a?basemodelid=105096',
      'https://www.microlease.com/uk/products/gw%20instek/function%2fpulse%20generators/afg-3032?basemodelid=113753',
      'https://www.microlease.com/uk/products/gw%20instek/other%20test%20equipment/psw160-14.4?basemodelid=123463',
      'https://www.microlease.com/uk/products/viavi%20(formerly%20jdsu)/xdsl%2c%20t1%2c%20e1%20test%20equipment/mts2000?basemodelid=5078',
      'https://www.microlease.com/uk/products/viavi%20(formerly%20jdsu)/optical%20test%20equipment/fit?basemodelid=10566',
      'https://www.microlease.com/uk/products/viavi%20(formerly%20jdsu)/optical%20test%20equipment/omk36?basemodelid=101091',
      'https://www.microlease.com/uk/products/3z%20telecom/cable%2c%20antenna%20%20%20pim%20analyzers/3zrfa?basemodelid=95329',
      'https://www.microlease.com/uk/products/3z%20telecom/cable%2c%20antenna%20%20%20pim%20analyzers/3zrfv%2b?basemodelid=119280',
      'https://www.microlease.com/uk/products/wavecontrol/environmental%20test%20equipment/wsn0002?basemodelid=123614',
      'https://www.microlease.com/uk/products/wavecontrol/environmental%20test%20equipment/wwm0001?basemodelid=125032',
      'https://www.microlease.com/uk/products/fluke/electrical%20power%20and%20energy%20measurement/fluke-1738%2feu-gold-e?basemodelid=129021',
      'https://www.microlease.com/uk/products/fluke/electrical%20power%20and%20energy%20measurement/fluke-435-ii%2fplat-e?basemodelid=129022',
      'https://www.microlease.com/uk/products/fluke/oscilloscopes/fluke-190-204%2fuk?basemodelid=125597',
      'https://www.microlease.com/uk/products/fluke/other%20test%20equipment/fluke-353?basemodelid=79482'
    ];
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
