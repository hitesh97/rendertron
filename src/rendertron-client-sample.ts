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
    //const baseUrl = 'https://www.microlease.com/uk/';
    const baseUrl = 'https://www.electrorent.com/us/';

    const urlsToFetch: string[] = [
      'home',
      'all-manufacturers',
      'manufacturer/3ztel/3z-telecom',
      'manufacturer/anri/anritsu',
      'manufacturer/chrom/chroma',
      'manufacturer/dob/doble',
      'manufacturer/exfo/exfo',
      'manufacturer/fl/fluke',
      'manufacturer/instk/gw-instek',
      'manufacturer/ky/keithley',
      'manufacturer/keysi/keysight-technologies',
      'manufacturer/meg/megger',
      'manufacturer/rs/rohde-and-schwarz',
      'manufacturer/tek/tektronix',
      'manufacturer/jdsu/viavi',
      'Services_Rental',
      'rent-test-equipment',
      'new-test-equipment',
      'used-test-equipment',
      'services_asset_management',
      'accredited-lab',
      'page/5g',
      'contactus',
      'products/keysight technologies/dc power supplies/n6700c?basemodelid=112907',
      'products/keysight technologies/dc power supplies/n6762a?basemodelid=3834',
      'products/keysight technologies/multimeters%2c data%c2%a0acquisition%2c counters/34465a?basemodelid=97082',
      'products/keysight technologies/function%2fpulse generators/33522b?basemodelid=6042',
      'products/keysight technologies/multimeters%2c data%c2%a0acquisition%2c counters/34972a?basemodelid=809',
      'products/keysight technologies/oscilloscopes/msox3104t?basemodelid=96716',
      'products/keysight technologies/other test equipment/e36312a?basemodelid=114705',
      'products/keysight technologies/oscilloscopes/dsox1102g?basemodelid=112588',
      'products/keysight technologies/rf network analyzers/n9952a?basemodelid=100398',
      'products/keysight technologies/rf network analyzers/p9371a?basemodelid=126442',
      'products/keysight technologies/rf spectrum analyzers/n9000b?basemodelid=101899',
      'products/keysight technologies/rf power%2c noise and other products/u2043xa?basemodelid=97225',
      'products/keithley/multimeters%2c data%c2%a0acquisition%2c counters/2602b?basemodelid=11218',
      'products/tektronix/oscilloscopes/mdo4104c?basemodelid=101440',
      'products/tektronix/other test equipment/mso58?basemodelid=118733',
      'products/keithley/dc power supplies/2231a-30-3?basemodelid=97238',
      'products/tektronix/oscilloscopes/mdo3012?basemodelid=93774',
      'products/tektronix/rf spectrum analyzers/rsa306b?basemodelid=102386',
      'products/keithley/multimeters%2c data%c2%a0acquisition%2c counters/dmm7510?basemodelid=97294',
      'products/rohde   schwarz/rf signal generators/sma100b?basemodelid=118396',
      'products/rohde   schwarz/other test equipment/rtm3004?basemodelid=123399',
      'products/rohde   schwarz/other test equipment/rta4004?basemodelid=123377',
      'products/rohde   schwarz/other test equipment/znle6?basemodelid=121288',
      'products/rohde   schwarz/other test equipment/fpc1500?basemodelid=125033',
      'products/rohde   schwarz/rf spectrum analyzers/fsv13?basemodelid=12426',
      'all-product-groups ',
      'product-group/20/ac-sources ',
      'product-group/21/ac-dc-electronic-loads ',
      'product-group/6/bert-arb-pattern-generators ',
      'product-group/10/cable-antenna-and-pim-analysers ',
      'product-group/19/dc-power-supplies ',
      'product-group/27/electrical-installation-and-high-voltage-test ',
      'product-group/26/electrical-power-and-energy-measurement ',
      'product-group/23/electrical-test-equipment ',
      'product-group/24/environmental-test-equipment ',
      'product-group/18/function-pulse-generators ',
      'product-group/28/infrared-and-temerature-measurement ',
      'product-group/11/lan-wan-analysers ',
      'product-group/17/lcr-impedance-analysers ',
      'product-group/22/logic-analysers ',
      'product-group/9/mobile-comms-test-equipment ',
      'product-group/15/modular-products ',
      'product-group/14/multimeters-data%C2%A0acquisition-counters ',
      'product-group/7/optical-sampling-scopes ',
      'product-group/8/optical-test-equipment ',
      'product-group/13/oscilloscopes ',
      'product-group/2/rf-network-analysers ',
      'product-group/4/rf-power-noise-and-other-products ',
      'product-group/3/rf-signal-generators ',
      'product-group/1/rf-spectrum-analysers ',
      'product-group/5/sdh-sonet-ethernet ',
      'product-group/16/semiconductor-parametric-analysers ',
      'product-group/12/xdsl-t1-e1-test-equipment ',
      'product-group/25/other-test-equipment'
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
