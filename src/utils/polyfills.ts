// Browser compatibility polyfills for older browsers
// This file should be loaded before any other application code

// Promise polyfill for older browsers
if (!window.Promise) {
  // Simple Promise polyfill
  (window as any).Promise = class SimplePromise {
    private state: 'pending' | 'fulfilled' | 'rejected' = 'pending';
    private value: any;
    private handlers: Array<{ onFulfilled?: Function; onRejected?: Function; resolve: Function; reject: Function }> = [];

    constructor(executor: (resolve: Function, reject: Function) => void) {
      try {
        executor(this.resolve.bind(this), this.reject.bind(this));
      } catch (error) {
        this.reject(error);
      }
    }

    private resolve(value: any) {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        this.handlers.forEach(handler => this.handle(handler));
        this.handlers = [];
      }
    }

    private reject(reason: any) {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.value = reason;
        this.handlers.forEach(handler => this.handle(handler));
        this.handlers = [];
      }
    }

    private handle(handler: any) {
      if (this.state === 'pending') {
        this.handlers.push(handler);
      } else {
        if (this.state === 'fulfilled' && handler.onFulfilled) {
          try {
            const result = handler.onFulfilled(this.value);
            handler.resolve(result);
          } catch (error) {
            handler.reject(error);
          }
        } else if (this.state === 'rejected' && handler.onRejected) {
          try {
            const result = handler.onRejected(this.value);
            handler.resolve(result);
          } catch (error) {
            handler.reject(error);
          }
        }
      }
    }

    then(onFulfilled?: Function, onRejected?: Function) {
      return new (window as any).Promise((resolve: Function, reject: Function) => {
        this.handle({
          onFulfilled,
          onRejected,
          resolve,
          reject
        });
      });
    }

    catch(onRejected: Function) {
      return this.then(undefined, onRejected);
    }

    static resolve(value: any) {
      return new (window as any).Promise((resolve: Function) => resolve(value));
    }

    static reject(reason: any) {
      return new (window as any).Promise((_: Function, reject: Function) => reject(reason));
    }

    static all(promises: any[]) {
      return new (window as any).Promise((resolve: Function, reject: Function) => {
        if (promises.length === 0) {
          resolve([]);
          return;
        }

        const results: any[] = [];
        let completed = 0;

        promises.forEach((promise, index) => {
          (window as any).Promise.resolve(promise).then((value: any) => {
            results[index] = value;
            completed++;
            if (completed === promises.length) {
              resolve(results);
            }
          }).catch(reject);
        });
      });
    }
  };
}

// Fetch polyfill for older browsers
if (!window.fetch) {
  (window as any).fetch = function(url: string, options: any = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open(options.method || 'GET', url);
      
      // Set headers
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          xhr.setRequestHeader(key, options.headers[key]);
        });
      }
      
      xhr.onload = function() {
        const response = {
          status: xhr.status,
          statusText: xhr.statusText,
          ok: xhr.status >= 200 && xhr.status < 300,
          headers: new Map(),
          text: () => Promise.resolve(xhr.responseText),
          json: () => Promise.resolve(JSON.parse(xhr.responseText)),
          blob: () => Promise.resolve(new Blob([xhr.response])),
          arrayBuffer: () => Promise.resolve(xhr.response)
        };
        resolve(response);
      };
      
      xhr.onerror = () => reject(new Error('Network Error'));
      xhr.ontimeout = () => reject(new Error('Request Timeout'));
      
      if (options.timeout) {
        xhr.timeout = options.timeout;
      }
      
      xhr.send(options.body);
    });
  };
}

// Object.assign polyfill
if (!Object.assign) {
  Object.assign = function(target: any, ...sources: any[]) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    const to = Object(target);

    for (let index = 0; index < sources.length; index++) {
      const nextSource = sources[index];

      if (nextSource != null) {
        for (const nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

// Array.from polyfill
if (!Array.from) {
  Array.from = function(arrayLike: any, mapFn?: Function, thisArg?: any) {
    const items = Object(arrayLike);
    const len = parseInt(items.length) || 0;
    const result = new Array(len);
    
    for (let i = 0; i < len; i++) {
      const value = items[i];
      result[i] = mapFn ? mapFn.call(thisArg, value, i) : value;
    }
    
    return result;
  };
}

// Array.includes polyfill
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement: any, fromIndex?: number) {
    const O = Object(this);
    const len = parseInt(O.length) || 0;
    if (len === 0) return false;
    
    const n = parseInt(fromIndex?.toString() || '0') || 0;
    let k = n >= 0 ? n : Math.max(len + n, 0);
    
    while (k < len) {
      if (O[k] === searchElement) return true;
      k++;
    }
    
    return false;
  };
}

// String.includes polyfill
if (!String.prototype.includes) {
  String.prototype.includes = function(search: string, start?: number) {
    if (typeof start !== 'number') {
      start = 0;
    }
    
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

// String.startsWith polyfill
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(search: string, pos?: number) {
    return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
  };
}

// String.endsWith polyfill
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(search: string, this_len?: number) {
    if (this_len === undefined || this_len > this.length) {
      this_len = this.length;
    }
    return this.substring(this_len - search.length, this_len) === search;
  };
}

// Map polyfill (simplified)
if (!window.Map) {
  (window as any).Map = class SimpleMap {
    private keys: any[] = [];
    private values: any[] = [];

    set(key: any, value: any) {
      const index = this.keys.indexOf(key);
      if (index !== -1) {
        this.values[index] = value;
      } else {
        this.keys.push(key);
        this.values.push(value);
      }
      return this;
    }

    get(key: any) {
      const index = this.keys.indexOf(key);
      return index !== -1 ? this.values[index] : undefined;
    }

    has(key: any) {
      return this.keys.indexOf(key) !== -1;
    }

    delete(key: any) {
      const index = this.keys.indexOf(key);
      if (index !== -1) {
        this.keys.splice(index, 1);
        this.values.splice(index, 1);
        return true;
      }
      return false;
    }

    clear() {
      this.keys = [];
      this.values = [];
    }

    get size() {
      return this.keys.length;
    }
  };
}

// Set polyfill (simplified)
if (!window.Set) {
  (window as any).Set = class SimpleSet {
    private values: any[] = [];

    add(value: any) {
      if (!this.has(value)) {
        this.values.push(value);
      }
      return this;
    }

    has(value: any) {
      return this.values.indexOf(value) !== -1;
    }

    delete(value: any) {
      const index = this.values.indexOf(value);
      if (index !== -1) {
        this.values.splice(index, 1);
        return true;
      }
      return false;
    }

    clear() {
      this.values = [];
    }

    get size() {
      return this.values.length;
    }
  };
}

// CustomEvent polyfill
if (!window.CustomEvent) {
  (window as any).CustomEvent = function(event: string, params: any) {
    params = params || { bubbles: false, cancelable: false, detail: null };
    const evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  };
}

// requestAnimationFrame polyfill
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function(callback: FrameRequestCallback) {
    return window.setTimeout(callback, 1000 / 60);
  };
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function(id: number) {
    clearTimeout(id);
  };
}

// Console polyfill for old browsers
if (!window.console) {
  (window as any).console = {
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {}
  };
}

// Performance.now polyfill
if (!window.performance || !window.performance.now) {
  const startTime = Date.now();
  if (!window.performance) {
    (window as any).performance = {};
  }
  window.performance.now = function() {
    return Date.now() - startTime;
  };
}

// Modernizr-style feature detection
export interface BrowserFeatures {
  flexbox: boolean;
  grid: boolean;
  cssVariables: boolean;
  webp: boolean;
  avif: boolean;
  touchEvents: boolean;
  geolocation: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webWorkers: boolean;
  serviceWorker: boolean;
  pushNotifications: boolean;
  webRTC: boolean;
  mediaDevices: boolean;
  promises: boolean;
  fetch: boolean;
  es6Classes: boolean;
  arrow: boolean;
}

export const detectFeatures = (): BrowserFeatures => {
  const features: BrowserFeatures = {
    flexbox: false,
    grid: false,
    cssVariables: false,
    webp: false,
    avif: false,
    touchEvents: false,
    geolocation: false,
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    webWorkers: false,
    serviceWorker: false,
    pushNotifications: false,
    webRTC: false,
    mediaDevices: false,
    promises: !!window.Promise,
    fetch: !!window.fetch,
    es6Classes: true,
    arrow: true
  };

  // CSS Feature Detection
  const testElement = document.createElement('div');
  const testStyle = testElement.style;

  // Flexbox
  try {
    testStyle.display = 'flex';
    features.flexbox = testStyle.display === 'flex';
  } catch (e) {}

  // CSS Grid
  try {
    testStyle.display = 'grid';
    features.grid = testStyle.display === 'grid';
  } catch (e) {}

  // CSS Variables
  try {
    testStyle.setProperty('--test', 'test');
    features.cssVariables = testStyle.getPropertyValue('--test') === 'test';
  } catch (e) {}

  // JavaScript API Detection
  features.touchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  features.geolocation = 'geolocation' in navigator;
  features.localStorage = 'localStorage' in window && window.localStorage !== null;
  features.sessionStorage = 'sessionStorage' in window && window.sessionStorage !== null;
  features.indexedDB = 'indexedDB' in window;
  features.webWorkers = 'Worker' in window;
  features.serviceWorker = 'serviceWorker' in navigator;
  features.pushNotifications = 'PushManager' in window && 'Notification' in window;
  features.webRTC = 'RTCPeerConnection' in window;
  features.mediaDevices = 'mediaDevices' in navigator;

  // Image format detection
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    canvas.width = 1;
    canvas.height = 1;
    features.webp = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    features.avif = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  return features;
};

// Add CSS classes based on feature detection
export const addFeatureClasses = (): void => {
  const features = detectFeatures();
  const html = document.documentElement;
  
  Object.entries(features).forEach(([feature, supported]) => {
    html.classList.add(supported ? feature : `no-${feature}`);
  });
};

// Initialize polyfills and feature detection
export const initializePolyfills = (): void => {
  console.log('[Polyfills] Initializing browser compatibility layer');
  addFeatureClasses();
  
  // Log detected features for debugging
  const features = detectFeatures();
  console.log('[Polyfills] Detected features:', features);
  
  // Warn about unsupported critical features
  const criticalFeatures: (keyof BrowserFeatures)[] = ['localStorage', 'sessionStorage'];
  const unsupportedCritical = criticalFeatures.filter(feature => !features[feature]);
  
  if (unsupportedCritical.length > 0) {
    console.warn('[Polyfills] Critical features not supported:', unsupportedCritical);
  }
};

export interface CompatibilityResult {
  compatible: boolean;
  missingFeatures: string[];
  browserInfo: {
    name: string;
    version: string;
    engine: string;
  };
}

export const checkBrowserCompatibility = (): CompatibilityResult => {
  const features = detectFeatures();
  const missingFeatures: string[] = [];

  // Check critical features
  if (!features.promises) missingFeatures.push('promises');
  if (!features.fetch) missingFeatures.push('fetch');
  if (!features.localStorage) missingFeatures.push('localStorage');
  if (!features.es6Classes) missingFeatures.push('es6Classes');
  if (!features.arrow) missingFeatures.push('arrow');

  // Browser detection
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let browserEngine = 'Unknown';

  if (userAgent.includes('Chrome')) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    browserEngine = 'Blink';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    browserEngine = 'Gecko';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    browserEngine = 'WebKit';
  } else if (userAgent.includes('Edge')) {
    browserName = 'Edge';
    const match = userAgent.match(/Edge\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    browserEngine = 'EdgeHTML';
  }

  return {
    compatible: missingFeatures.length === 0,
    missingFeatures,
    browserInfo: {
      name: browserName,
      version: browserVersion,
      engine: browserEngine
    }
  };
};