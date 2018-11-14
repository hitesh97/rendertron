import { Rendertron } from './rendertron';
import fetch from 'node-fetch';

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
      'manufacturer/eip1/phase matrix, inc.'
    );

    const getParallel = async function() {
      //transform requests into Promises, await all
      try {
        await Promise.all(
          // tslint:disable-next-line:arrow-parens
          urlsToFetch.map(async url => {
            const urlToRequest = `${tronAPIUrl}${baseUrl}${url}`;
            await fetch(urlToRequest)
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
