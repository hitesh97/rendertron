import * as urlUtils from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import { Config } from './Types';

const CONFIG_PATH = path.resolve(__dirname, '../config.json');

export async function createFile(
  baseUrl: string,
  destFileName: string,
  // tslint:disable-next-line:no-any
  data: any
): Promise<boolean> {
  const parsedUrl = urlUtils.parse(baseUrl);
  let config: Config = {
    datastoreCache: false,
    outDir: '',
    chromeExePath: ''
  };
  if (fse.pathExistsSync(CONFIG_PATH)) {
    config = Object.assign({}, await fse.readJson(CONFIG_PATH));
  }

  const destFolderPath = path.resolve(
    __dirname,
    `${config.outDir}\\${parsedUrl.hostname}${parsedUrl.pathname}`
  );

  console.log(destFolderPath);
  await fse
    .ensureDir(destFolderPath)
    .then(() => {
      // console.log(`folder '${destFolderPath}' Created !`);
      fs.appendFileSync(
        path.resolve(`${destFolderPath}\\${destFileName}`),
        JSON.stringify(data, null, 2)
      );
      return true;
    })
    .catch(err => {
      console.error(`Could not create folder '${destFolderPath}' !!`);
      console.error(err);
      return false;
    });

  return true;
}
