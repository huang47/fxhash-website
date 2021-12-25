export function getIpfsIoUrl(cid: string) {
  return `https://ipfs.io/ipfs/${cid}`
}

export function getPinataUrlFromCid(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`
}

export function getPinataFxhashGateway(cid: string): string {
  return `https://gateway.fxhash.xyz/ipfs/${cid}`
}

export function getPinataFxhashGatewaySafe(cid: string): string {
  return `https://gateway.fxhash2.xyz/ipfs/${cid}`
}

export function getIpfsSlash(cid: string): string {
  return `ipfs://${cid}`
}

/**
 * given an URL of the form `ipfs://frghrtjtyjtyj`
 * outputs the CID in the rightmost section
 */
export function ipfsUrlToCid(url: string): string {
  return url
    ? url.substr(7)
    : ""
}

/**
 * Generic method to get a display url based on a CID and a hash.
 * This function also accepts a transform method so that the base URL can be formed in any way using the cid
 */
export function ipfsUrlWithHash(cid: string, hash: string, transform: ((cid: string) => string) = getIpfsIoUrl) {
  return `${transform(cid)}?fxhash=${hash}`
}