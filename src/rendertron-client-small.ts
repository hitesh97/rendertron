import { Rendertron } from './rendertron';
import fetch from 'node-fetch';
import * as urlUtils from 'url';
//import { promisify } from 'util';
// import * as convert from 'xml-js';
// import * as jp from 'jsonpath';
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

    const maxItemCount: number = 9999999999;
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
    // const MLSiteMapRoots: string[] = new Array();
    //const siteMapsToFetch: string[] = new Array();
    let currSitemapUrl = '';
    let siteBaseUrl = '';
    let siteMapLogFileName = '';

    /*     const finalSiteMapUrl =
      'https://www.microlease.com/xml/sitemap_static_uk.xml'; */

    const finalSiteMapUrl =
      'https://www.electrorent.com/xml/sitemap_static_us.xml';

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

    /*const urlsToFetch: string[] = [
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
    ];*/

    const urlsToFetch: string[] = [
      'https://www.electrorent.com/us/home',
      'https://www.electrorent.com/us/all-manufacturers',
      'https://www.electrorent.com/us/manufacturer/3ztel/3z-telecom',
      'https://www.electrorent.com/us/manufacturer/anri/anritsu',
      'https://www.electrorent.com/us/manufacturer/chrom/chroma',
      'https://www.electrorent.com/us/manufacturer/dob/doble',
      'https://www.electrorent.com/us/manufacturer/exfo/exfo',
      'https://www.electrorent.com/us/manufacturer/fl/fluke',
      'https://www.electrorent.com/us/manufacturer/instk/gw-instek',
      'https://www.electrorent.com/us/manufacturer/ky/keithley',
      'https://www.electrorent.com/us/manufacturer/keysi/keysight-technologies',
      'https://www.electrorent.com/us/manufacturer/meg/megger',
      'https://www.electrorent.com/us/manufacturer/rs/rohde-and-schwarz',
      'https://www.electrorent.com/us/manufacturer/tek/tektronix',
      'https://www.electrorent.com/us/manufacturer/jdsu/viavi',
      'https://www.electrorent.com/us/Services_Rental',
      'https://www.electrorent.com/us/rent-test-equipment',
      'https://www.electrorent.com/us/new-test-equipment',
      'https://www.electrorent.com/us/used-test-equipment',
      'https://www.electrorent.com/us/services_asset_management',
      'https://www.electrorent.com/us/accredited-lab',
      'https://www.electrorent.com/us/page/5g',
      'https://www.electrorent.com/us/contactus',
      'https://www.electrorent.com/us/products/keysight%20technologies/dc%20power%20supplies/n6700c?basemodelid=112907',
      'https://www.electrorent.com/us/products/keysight%20technologies/dc%20power%20supplies/n6762a?basemodelid=3834',
      'https://www.electrorent.com/us/products/keysight%20technologies/multimeters%2c%20data%c2%a0acquisition%2c%20counters/34465a?basemodelid=97082',
      'https://www.electrorent.com/us/products/keysight%20technologies/function%2fpulse%20generators/33522b?basemodelid=6042',
      'https://www.electrorent.com/us/products/keysight%20technologies/multimeters%2c%20data%c2%a0acquisition%2c%20counters/34972a?basemodelid=809',
      'https://www.electrorent.com/us/products/keysight%20technologies/oscilloscopes/msox3104t?basemodelid=96716',
      'https://www.electrorent.com/us/products/keysight%20technologies/other%20test%20equipment/e36312a?basemodelid=114705',
      'https://www.electrorent.com/us/products/keysight%20technologies/oscilloscopes/dsox1102g?basemodelid=112588',
      'https://www.electrorent.com/us/products/keysight%20technologies/rf%20network%20analyzers/n9952a?basemodelid=100398',
      'https://www.electrorent.com/us/products/keysight%20technologies/rf%20network%20analyzers/p9371a?basemodelid=126442',
      'https://www.electrorent.com/us/products/keysight%20technologies/rf%20spectrum%20analyzers/n9000b?basemodelid=101899',
      'https://www.electrorent.com/us/products/keysight%20technologies/rf%20power%2c%20noise%20and%20other%20products/u2043xa?basemodelid=97225',
      'https://www.electrorent.com/us/products/keithley/multimeters%2c%20data%c2%a0acquisition%2c%20counters/2602b?basemodelid=11218',
      'https://www.electrorent.com/us/products/tektronix/oscilloscopes/mdo4104c?basemodelid=101440',
      'https://www.electrorent.com/us/products/tektronix/other%20test%20equipment/mso58?basemodelid=118733',
      'https://www.electrorent.com/us/products/keithley/dc%20power%20supplies/2231a-30-3?basemodelid=97238',
      'https://www.electrorent.com/us/products/tektronix/oscilloscopes/mdo3012?basemodelid=93774',
      'https://www.electrorent.com/us/products/tektronix/rf%20spectrum%20analyzers/rsa306b?basemodelid=102386',
      'https://www.electrorent.com/us/products/keithley/multimeters%2c%20data%c2%a0acquisition%2c%20counters/dmm7510?basemodelid=97294',
      'https://www.electrorent.com/us/products/rohde%20%20%20schwarz/rf%20signal%20generators/sma100b?basemodelid=118396',
      'https://www.electrorent.com/us/products/rohde%20%20%20schwarz/other%20test%20equipment/rtm3004?basemodelid=123399',
      'https://www.electrorent.com/us/products/rohde%20%20%20schwarz/other%20test%20equipment/rta4004?basemodelid=123377',
      'https://www.electrorent.com/us/products/rohde%20%20%20schwarz/other%20test%20equipment/znle6?basemodelid=121288',
      'https://www.electrorent.com/us/products/rohde%20%20%20schwarz/other%20test%20equipment/fpc1500?basemodelid=125033',
      'https://www.electrorent.com/us/products/rohde%20%20%20schwarz/rf%20spectrum%20analyzers/fsv13?basemodelid=12426',
      'https://www.electrorent.com/us/all-product-groups',
      'https://www.electrorent.com/us/product-group/20/ac-sources',
      'https://www.electrorent.com/us/product-group/21/ac-dc-electronic-loads',
      'https://www.electrorent.com/us/product-group/6/bert-arb-pattern-generators',
      'https://www.electrorent.com/us/product-group/10/cable-antenna-and-pim-analysers',
      'https://www.electrorent.com/us/product-group/19/dc-power-supplies',
      'https://www.electrorent.com/us/product-group/27/electrical-installation-and-high-voltage-test',
      'https://www.electrorent.com/us/product-group/26/electrical-power-and-energy-measurement',
      'https://www.electrorent.com/us/product-group/23/electrical-test-equipment',
      'https://www.electrorent.com/us/product-group/24/environmental-test-equipment',
      'https://www.electrorent.com/us/product-group/18/function-pulse-generators',
      'https://www.electrorent.com/us/product-group/28/infrared-and-temerature-measurement',
      'https://www.electrorent.com/us/product-group/11/lan-wan-analysers',
      'https://www.electrorent.com/us/product-group/17/lcr-impedance-analysers',
      'https://www.electrorent.com/us/product-group/22/logic-analysers',
      'https://www.electrorent.com/us/product-group/9/mobile-comms-test-equipment',
      'https://www.electrorent.com/us/product-group/15/modular-products',
      'https://www.electrorent.com/us/product-group/14/multimeters-data%C2%A0acquisition-counters',
      'https://www.electrorent.com/us/product-group/7/optical-sampling-scopes',
      'https://www.electrorent.com/us/product-group/8/optical-test-equipment',
      'https://www.electrorent.com/us/product-group/13/oscilloscopes',
      'https://www.electrorent.com/us/product-group/2/rf-network-analysers',
      'https://www.electrorent.com/us/product-group/4/rf-power-noise-and-other-products',
      'https://www.electrorent.com/us/product-group/3/rf-signal-generators',
      'https://www.electrorent.com/us/product-group/1/rf-spectrum-analysers',
      'https://www.electrorent.com/us/product-group/5/sdh-sonet-ethernet',
      'https://www.electrorent.com/us/product-group/16/semiconductor-parametric-analysers',
      'https://www.electrorent.com/us/product-group/12/xdsl-t1-e1-test-equipment',
      'https://www.electrorent.com/us/product-group/25/other-test-equipment'
    ];

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
