import fetch from 'isomorphic-fetch';

const HEADER_CLIENT_NAME = 'X-Box-Client-Name';
const HEADER_CLIENT_VERSION = 'X-Box-Client-Version';
const PARAM_CLIENT_NAME = 'box_client_name';
const PARAM_CLIENT_VERSION = 'box_client_version';
/* eslint-disable no-undef */
const NAME = __NAME__;
const VERSION = __VERSION__;
/* eslint-enable no-undef */

const parseJSON = (response) => {
    if (response.status === 204) {
        return response;
    }

    return response.json();
};
const parseText = (response) => response.text();
const parseBlob = (response) => response.blob();
const parseThrough = (response) => response;

/**
 * Helper function to convert HTTP status codes into throwable errors
 *
 * @private
 * @param {Response} response - Fetch's Response object
 * @throws {Error} - Throws when the HTTP status is not 2XX
 * @return {Response} - Pass-thru the response if ther are no errors
 */
function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return response;
    }

    const error = new Error(response.statusText);
    error.response = response;
    throw error;
}

/**
 * Wrapper function for XHR post put and delete
 *
 * @private
 * @return {Promise} XHR promise
 */
function xhr(method, url, headers = {}, data = {}) {
    return fetch(url, {
        headers,
        method,
        body: JSON.stringify(data)
    })
    .then(checkStatus)
    .then(parseJSON);
}

/**
 * Creates an empty iframe or uses an existing one
 * for the purposes of downloading or printing
 *
 * @private
 * @return {HTMLElement} Iframe
 */
function createDownloadIframe() {
    let iframe = document.querySelector('#downloadiframe');
    if (!iframe) {
        // if no existing iframe create a new one
        iframe = document.createElement('iframe');
        iframe.setAttribute('id', 'downloadiframe');
        iframe.style.display = 'none';
        iframe = document.body.appendChild(iframe);
    }
    // Clean the iframe up
    iframe.contentDocument.write('<head></head><body></body>');
    return iframe;
}

/**
 * HTTP GETs a URL
 * Usage:
 *     get(url, headers, type)
 *     get(url, headers)
 *     get(url, type)
 *     get(url)
 *
 * @param {string} url - The URL to fetch
 * @param {Object} [headers] - Key-value map of headers
 * @param {string} [type] - response type json (default), text, blob or any
 * @return {Promise} - HTTP response
 */
export function get(url, ...rest) {
    let headers;
    let type;

    if (typeof rest[0] === 'string') {
        type = rest[0];
    } else {
        headers = rest[0];
        type = rest[1];
    }

    headers = headers || {};
    type = type || 'json';

    let parser;
    switch (type) {
        case 'text':
            parser = parseText;
            break;
        case 'blob':
            parser = parseBlob;
            break;
        case 'any':
            parser = parseThrough;
            break;
        case 'json':
        default:
            parser = parseJSON;
            break;
    }

    return fetch(url, { headers })
        .then(checkStatus)
        .then(parser);
}

/**
 * HTTP POSTs a URL with JSON data
 *
 * @param {string} url - The URL to fetch
 * @param {Object} headers - Key-value map of headers
 * @param {Object} data - JS Object representation of JSON data to send
 * @return {Promise} HTTP response
 */
export function post(...rest) {
    return xhr('post', ...rest);
}

/**
 * HTTP PUTs a URL with JSON data
 *
 * @param {string} url - The URL to fetch
 * @param {Object} headers - Key-value map of headers
 * @param {Object} data - JS Object representation of JSON data to send
 * @return {Promise} HTTP response
 */
export function del(...rest) {
    return xhr('delete', ...rest);
}

/**
 * HTTP PUTs a url with JSON data
 *
 * @param {string} url - The url to fetch
 * @param {Object} headers - Key-value map of headers
 * @param {Object} data - JS Object representation of JSON data to send
 * @return {Promise} HTTP response
 */
export function put(...rest) {
    return xhr('put', ...rest);
}

/**
 * Opens url in an iframe
 * Used for downloads
 *
 * @param {string} url - URL to open
 * @return {HTMLElement}
 */
export function openUrlInsideIframe(url) {
    const iframe = createDownloadIframe();
    iframe.src = url;
    return iframe;
}

/**
 * Opens content in an iframe
 * Used for printing
 *
 * @param {string} content - HTML content
 * @return {HTMLElement}
 */
export function openContentInsideIframe(content) {
    const iframe = createDownloadIframe();
    iframe.contentDocument.body.innerHTML = content;
    iframe.contentDocument.close();
    return iframe;
}

/**
 * Creates contextual fragment
 *
 * @param {Element} node - DOM node
 * @param {string} template - HTML template
 * @return {HTMLElement}
 */
export function createFragment(node, template) {
    const range = document.createRange();
    range.selectNode(node);
    return range.createContextualFragment(template.replace(/>\s*</g, '><')); // remove new lines
}

/**
 * Inserts template string into DOM node
 *
 * @param {Element} node - DOM node
 * @param {string} template  html template
 * @return {void}
 */
export function insertTemplate(node, template) {
    node.appendChild(createFragment(node, template));
}

/**
 * Create <script> element to load external script
 *
 * @param {string} url - Asset url
 * @return {HTMLElement} Script element
 */
export function createScript(url) {
    const script = document.createElement('script');
    script.src = url;

    // Force scripts to execute in order, see: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
    script.async = false;
    return script;
}

/**
 * Create <link> element to prefetch external resource
 *
 * @param {string} url - Asset urls
 * @return {HTMLElement} Prefetch link element
 */
export function createPrefetch(url) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    return link;
}

/**
 * Create <link> element to load external stylesheet
 *
 * @param {string} url - Asset urls
 * @return {HTMLElement} CSS link element
 */
export function createStylesheet(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    return link;
}

/**
 * Builds a list of required XHR headers.
 *
 * @param {Object} [headers] - Optional headers
 * @param {string} [token] - Optional auth token
 * @param {string} [sharedLink] - Optional shared link
 * @param {string} [password] - Optional shared link password
 * @return {Object} Headers
 */
export function getHeaders(headers = {}, token = '', sharedLink = '', password = '') {
    /* eslint-disable no-param-reassign */
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (sharedLink) {
        headers.BoxApi = `shared_link=${sharedLink}`;

        if (password) {
            headers.BoxApi = `${headers.BoxApi}&shared_link_password=${password}`;
        }
    }

    // Following headers are for API analytics
    if (NAME) {
        headers[HEADER_CLIENT_NAME] = NAME;
    }

    if (VERSION) {
        headers[HEADER_CLIENT_VERSION] = VERSION;
    }

    /* eslint-enable no-param-reassign */
    return headers;
}

/**
 * Appends auth params to a url
 *
 * @param {string} url - Content url
 * @param {string} [token] - Optional auth token
 * @param {string} [sharedLink] - Optional shared link
 * @param {string} [password] - Optional shared link password
 * @return {string} Url with auth
 */
export function appendAuthParams(url, token = '', sharedLink = '', password = '') {
    if (!token && !sharedLink) {
        return url;
    }

    let delim = '?';

    if (url.indexOf('?') > 0) {
        delim = '&';
    }

    let params = '';
    if (token) {
        params = `access_token=${token}`;
    }

    if (sharedLink) {
        if (params) {
            params = `${params}&`;
        }
        params = `${params}shared_link=${encodeURI(sharedLink)}`;
        if (password) {
            params = `${params}&shared_link_password=${encodeURI(password)}`;
        }
    }

    // Following params are for API analytics
    if (NAME) {
        params = `${params}&${PARAM_CLIENT_NAME}=${encodeURI(NAME)}`;
    }

    if (VERSION) {
        params = `${params}&${PARAM_CLIENT_VERSION}=${encodeURI(VERSION)}`;
    }

    return `${url}${delim}${params}`;
}

/**
 * Create a content url from template
 *
 * @param {string} template - URL template to attach param to
 * @param {string|void} [asset] - Optional asset name needed to access file
 * @return {string} Content url
 */
export function createContentUrl(template, asset) {
    // @NOTE(tjin): Remove the next 3 lines after reps API is stabilized after 4/6/17
    /* eslint-disable no-param-reassign */
    template = template.replace('{asset_path}', asset || '');
    /* eslint-enable no-param-reassign */

    return template.replace('{+asset_path}', asset || '');
}

/**
 * Factory to create asset URLs
 *
 * @param {Object} location - Location object
 * @return {Function} Factory for creating asset url
 */
export function createAssetUrlCreator(location) {
    const baseURI = location.baseURI;
    const staticBaseURI = location.staticBaseURI;

    return (name) => {
        let asset;

        if (name.indexOf('http') === 0) {
            // This is a full url
            asset = name;
        } else if (name.indexOf('third-party') === 0) {
            // This is a static third-party asset thats not localized
            asset = staticBaseURI + name;
        } else {
            // This is our own asset that is localized
            asset = baseURI + name;
        }

        return asset;
    };
}

/**
 * Prefetches external stylsheets or js by appending a <link rel="prefetch"> element
 *
 * @param {Array} urls - Asset urls
 * @return {void}
 */
export function prefetchAssets(urls) {
    const head = document.head;

    urls.forEach((url) => {
        if (!head.querySelector(`link[rel="prefetch"][href="${url}"]`)) {
            head.appendChild(createPrefetch(url));
        }
    });
}

/**
 * Loads external stylsheets by appending a <link> element
 *
 * @param {Array} urls - Asset urls
 * @return {void}
 */
export function loadStylesheets(urls) {
    const head = document.head;

    urls.forEach((url) => {
        if (!head.querySelector(`link[rel="stylesheet"][href="${url}"]`)) {
            head.appendChild(createStylesheet(url));
        }
    });
}

/**
 * Loads external scripts by appending a <script> element
 *
 * @param {Array} urls - Asset urls
 * @return {Promise} Promise to load scripts
 */
export function loadScripts(urls) {
    const head = document.head;
    const promises = [];

    urls.forEach((url) => {
        if (!head.querySelector(`script[src="${url}"]`)) {
            const script = createScript(url);
            promises.push(new Promise((resolve, reject) => {
                script.addEventListener('load', resolve);
                script.addEventListener('error', reject);
            }));
            head.appendChild(script);
        }
    });

    return Promise.all(promises);
}

/**
 * Function to decode key down events into keys
 *
 * @param {Event} event - Keydown event
 * @return {string} Decoded keydown key
 */
export function decodeKeydown(event) {
    let modifier = '';

    // KeyboardEvent.key is the new spec supported in Chrome, Firefox and IE.
    // KeyboardEvent.keyIdentifier is the old spec supported in Safari.
    // Priority is given to the new spec.
    let key = event.key || event.keyIdentifier || '';

    // Get the modifiers on their own
    if (event.ctrlKey) {
        modifier = 'Control';
    } else if (event.shiftKey) {
        modifier = 'Shift';
    } else if (event.metaKey) {
        modifier = 'Meta';
    }

    // The key and keyIdentifier specs also include modifiers.
    // Since we are manually getting the modifiers above we do
    // not want to trap them again here.
    if (key === modifier) {
        key = '';
    }

    // keyIdentifier spec returns UTF8 char codes
    // Need to convert them back to ascii.
    if (key.indexOf('U+') === 0) {
        if (key === 'U+001B') {
            key = 'Escape';
        } else {
            key = String.fromCharCode(key.replace('U+', '0x'));
        }
    }

    // If nothing was pressed just return
    if (!key) {
        return '';
    }

    // Special casing for space bar
    if (key === ' ') {
        key = 'Space';
    }

    // keyIdentifier spec does not prefix the word Arrow.
    // Newer key spec does it automatically.
    if (key === 'Right' || key === 'Left' || key === 'Down' || key === 'Up') {
        key = `Arrow${key}`;
    }

    if (modifier) {
        modifier += '+';
    }

    return modifier + key;
}

/**
 * Find location information about a script include
 *
 * @param {string} name - Script name
 * @return {Object} Script location object
 */
export function findScriptLocation(name) {
    const scriptSrc = document.querySelector(`script[src*="/${name}"]`).src;
    if (!scriptSrc) {
        throw new Error('Missing or malformed preview library');
    }

    const anchor = document.createElement('a');
    anchor.href = scriptSrc;

    const pathname = anchor.pathname;
    const pathFragments = pathname.split('/');
    const fragmentLength = pathFragments.length;
    const fileName = pathFragments[fragmentLength - 1];
    const locale = pathFragments[fragmentLength - 2];
    const version = pathFragments[fragmentLength - 3];
    const query = anchor.search;
    const baseURI = anchor.href.replace(fileName, '').replace(query, '');
    const staticBaseURI = baseURI.replace(`${version}/${locale}/`, '');

    return {
        origin: anchor.origin,
        host: anchor.host,
        hostname: anchor.hostname,
        search: query,
        protocol: anchor.protocol,
        port: anchor.port,
        href: anchor.href,
        pathname,
        locale,
        version,
        baseURI,
        staticBaseURI
    };
}

/**
 * Replaces variable place holders specified between {} in the string with
 * specified custom value. Localizes strings that include variables.
 *
 * @param {string} string - String to be interpolated
 * @param {string[]} placeholderValues - Custom values to replace into string
 * @return {string} Properly translated string with replaced custom variable
 */
export function replacePlaceholders(string, placeholderValues) {
    const regex = /\{\d+\}/g;

    if (!string || !string.length) {
        return string;
    }

    return string.replace(regex, (match) => {
        // extracting the index that is supposed to replace the matched placeholder
        const placeholderIndex = parseInt(match.replace(/^\D+/g, ''), 10) - 1;

        /* eslint-disable no-plusplus */
        return placeholderValues[placeholderIndex] ? placeholderValues[placeholderIndex] : match;
        /* eslint-enable no-plusplus */
    });
}
/**
 * Check to see if a file requires a Box3D viewer to be viewed
 *
 * @param {Object} file - The file to check
 * @return {Boolean} True if the file needs a Box3D 360 degree viewer to be viewed
 */
export function requires360Viewer(file) {
    // For now, we'll only support this preview if the filename has a secondary
    // extension of '360' (e.g. file.360.mp4)
    const basename = file.name.slice(0, file.name.lastIndexOf('.'));
    return basename.endsWith('360');
}

/**
 * Set width/height for an element.
 *
 * @param {HTMLElement} element - HTML element
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 */
export function setDimensions(element, width, height) {
    /* eslint-disable no-param-reassign */
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    /* eslint-enable no-param-reassign */
}