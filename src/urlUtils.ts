const INVALID_URL_REGEX = /[\|&;\$%@"<>\(\)\+,.^]/g;

export function cleanUrl(url: string): string {
  return url.replace(INVALID_URL_REGEX, '_');
}

export function isValidUrl(url: string): boolean {
  if (url !== '') {
    // console.log(`testing url for validity : ${url}`);
    const matchArray = url.match(INVALID_URL_REGEX);
    if (matchArray !== null && matchArray.length > 0) {
      return false;
    }
  }
  return true;
}
