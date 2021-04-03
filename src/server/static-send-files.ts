import { Request, Response } from 'express';
import * as _ from 'lodash';

//CODE ADAPTED FROM https://github.com/expressjs/serve-static

var encodeUrl = require('encodeurl');
import escapeHtml = require('escape-html');
import parseUrl = require('parseurl');
var resolvePath = require('path').resolve;
import send = require('send');
import { SendStream } from 'send';
var url = require('url');

export async function sendFiles(this: Response, req: Request, path: string, options: any): Promise<boolean> {
  if (!path) throw new TypeError('root path required');
  if (typeof path !== 'string') throw new TypeError('root path must be a string');

  // copy options object
  var opts = _.clone(options) || {};

  // default redirect
  var redirect = opts.redirect !== false;

  // headers listener
  var setHeaders = opts.setHeaders;
  if (setHeaders && typeof setHeaders !== 'function') throw new TypeError('option setHeaders must be function');

  // setup options for send
  opts.maxage = opts.maxage || opts.maxAge || 0;
  opts.root = resolvePath(path);

  let matchedFile: boolean = false;

  // construct directory listener
  var onDirectory: (res: Response) => void = notFoundDirectoryListener;
  if (redirect) onDirectory = createRedirectDirectoryListener(req);

  return new Promise<boolean>((resolve, reject) => {
    var originalUrl = parseUrl.original(req)!;
    var path = parseUrl(req)!.pathname!;

    // make sure redirect occurs at mount
    if (path === '/' && originalUrl.pathname!.substr(-1) !== '/') path = '';

    // create send stream
    var stream = send(req, path, opts);

    // add directory handler
    stream.on('directory', onDirectory);

    // add headers listener
    if (setHeaders) stream.on('headers', setHeaders);

    // add file listener
    stream.on('file', () => matchedFile = true);

    // forward errors
    stream.on('error', function error(err: any) {
      if (err.code !== 'ENOENT' && (!matchedFile || err.statusCode >= 500)) {
        reject(err);
        return;
      }
      resolve(false);
    });

    // pipe
    stream.pipe(this);
  });
}

/**
 * Collapse all leading slashes into a single slash
 * @private
 */
function collapseLeadingSlashes(str: string) {
  let i: number = 0;
  for (i = 0; i < str.length; i++) {
    if (str[i] !== '/') break;
  }
  return i > 1 ? '/' + str.substr(i) : str;
}

 /**
 * Create a minimal HTML document.
 *
 * @param {string} title
 * @param {string} body
 * @private
 */

function createHtmlDocument(title: string, body: string) {
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<title>' + title + '</title>\n' +
    '</head>\n' +
    '<body>\n' +
    '<pre>' + body + '</pre>\n' +
    '</body>\n'
}

/**
 * A directory listener that just 404s.
 * @private
 */

function notFoundDirectoryListener(this: SendStream) {
  this.error(404);
}

/**
 * Create a directory listener that performs a redirect.
 * @private
 */

function createRedirectDirectoryListener(req: Request) {
  return function redirect(this: SendStream, res: Response) {
    if (this.hasTrailingSlash()) {
      this.error(404);
      return;
    }

    // get original URL
    var originalUrl = parseUrl.original(req)!;

    // append trailing slash
    delete (<any>originalUrl).path;
    originalUrl.pathname = collapseLeadingSlashes(originalUrl.pathname + '/');

    // reformat the URL
    var loc = encodeUrl(url.format(originalUrl));
    var doc = createHtmlDocument('Redirecting', 'Redirecting to <a href="' + escapeHtml(loc) + '">' + escapeHtml(loc) + '</a>');

    // send redirect response
    res.statusCode = 301;
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Content-Length', '' + Buffer.byteLength(doc));
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Location', loc);
    res.end(doc);
  }
}
