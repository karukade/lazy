/**
 * EvEmitter v1.1.0
 * Lil' event emitter
 * MIT License
 */

/* jshint unused: true, undef: true, strict: true */

(function(global, factory) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module, window */
  if (typeof define == 'function' && define.amd) {
    // AMD - RequireJS
    define(factory);
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS - Browserify, Webpack
    module.exports = factory();
  } else {
    // Browser globals
    global.EvEmitter = factory();
  }
})(typeof window != 'undefined' ? window : this, function() {
  'use strict';

  function EvEmitter() {}

  var proto = EvEmitter.prototype;

  proto.on = function(eventName, listener) {
    if (!eventName || !listener) {
      return;
    }
    // set events hash
    var events = (this._events = this._events || {});
    // set listeners array
    var listeners = (events[eventName] = events[eventName] || []);
    // only add once
    if (listeners.indexOf(listener) == -1) {
      listeners.push(listener);
    }

    return this;
  };

  proto.once = function(eventName, listener) {
    if (!eventName || !listener) {
      return;
    }
    // add event
    this.on(eventName, listener);
    // set once flag
    // set onceEvents hash
    var onceEvents = (this._onceEvents = this._onceEvents || {});
    // set onceListeners object
    var onceListeners = (onceEvents[eventName] = onceEvents[eventName] || {});
    // set flag
    onceListeners[listener] = true;

    return this;
  };

  proto.off = function(eventName, listener) {
    var listeners = this._events && this._events[eventName];
    if (!listeners || !listeners.length) {
      return;
    }
    var index = listeners.indexOf(listener);
    if (index != -1) {
      listeners.splice(index, 1);
    }

    return this;
  };

  proto.emitEvent = function(eventName, args) {
    var listeners = this._events && this._events[eventName];
    if (!listeners || !listeners.length) {
      return;
    }
    // copy over to avoid interference if .off() in listener
    listeners = listeners.slice(0);
    args = args || [];
    // once stuff
    var onceListeners = this._onceEvents && this._onceEvents[eventName];

    for (var i = 0; i < listeners.length; i++) {
      var listener = listeners[i];
      var isOnce = onceListeners && onceListeners[listener];
      if (isOnce) {
        // remove listener
        // remove before trigger to prevent recursion
        this.off(eventName, listener);
        // unset once flag
        delete onceListeners[listener];
      }
      // trigger listener
      listener.apply(this, args);
    }

    return this;
  };

  proto.allOff = function() {
    delete this._events;
    delete this._onceEvents;
  };

  return EvEmitter;
});

var utils = (function() {
  var dataStoreName = 'MY_DATA';
  var data = {
    set: function(elm, key, value) {
      elm[dataStoreName] = elm[dataStoreName] || {};
      elm[dataStoreName][key] = value;
    },
    get: function(elm, key) {
      return elm[dataStoreName] ? elm[dataStoreName][key] : undefined;
    }
  };

  var nodeListToArray = function(nodeList) {
    if (!nodeList) return null;
    var elms = Array.prototype.slice.call(nodeList, null);
    return elms.length === 0 ? null : elms;
  };

  var getByQuery = function(selector, rootElm) {
    var _rootElm = rootElm || document;
    return nodeListToArray(_rootElm.querySelectorAll(selector));
  };

  var transitionEndEvent = 'transitionend';

  var supportsClassList =
    runningOnBrowser && 'classList' in document.createElement('p');

  var addClass = function addClass(element, className) {
    if (supportsClassList) {
      element.classList.add(className);
      return;
    }

    element.className += (element.className ? ' ' : '') + className;
  };

  var removeClass = function removeClass(element, className) {
    if (supportsClassList) {
      element.classList.remove(className);
      return;
    }
    element.className = element.className
      .replace(new RegExp('(^|\\s+)' + className + '(\\s+|$)'), ' ')
      .replace(/^\s+/, '')
      .replace(/\s+$/, '');
  };

  return {
    data: data,
    getByQuery: getByQuery,
    transitionEndEvent: transitionEndEvent,
    addClass: addClass,
    removeClass: removeClass
  };
})();

var LoadingImage = (function() {
  var isImg = function isImg() {
    return elm.tagName === 'IMG';
  };

  function LoadingImage(elm) {
    this.isimg = isImg(elm);
    this.img = this.isimg ? new Image() : elm;
    this.src = this.getSrc(elm);
    this.funcs = [];
    this.attrs = {
      src: 'data-src'
    };
    if (!this.isimg) this.elm = elm;
  }

  LoadingImage.prototype = Object.create(EvEmitter.prototype);

  LoadingImage.prototype.load = function() {
    this.img.addEventListener('load', this);
    this.img.addEventListener('error', this);
    this.img.src = this.src;
    if (!this.isimg) {
      this.elm.backgroundImage = 'url("' + this.src + '")';
    }
  };
  s;
  LoadingImage.prototype.isImg = function(elm) {
    return elm.tagName === 'IMG';
  };

  LoadingImage.prototype.getSrc = function(elm) {
    var src = elm.getAttribute(this.attrs.src);
    return src;
  };

  LoadingImage.prototype.handleEvent = function(event) {
    var method = 'on' + event.type;
    if (this[method]) {
      this[method](event);
    }
  };

  LoadingImage.prototype.onload = function() {
    this.isLoaded = true;
    this.funcs.forEach(func => func(this.img));
    this.emitEvent('loaded', [this.img]);
    this.unbindEvents();
  };

  LoadingImage.prototype.onerror = function() {
    this.emitEvent('error', [this.img]);
    this.unbindEvents();
  };

  LoadingImage.prototype.unbindEvents = function() {
    this.img.removeEventListener('load', this);
    this.img.removeEventListener('error', this);
  };

  LoadingImage.prototype.addLoadedHandler = function(func) {
    if (typeof func !== 'function') return;
    this.funcs.push(func);
  };

  return LoadingImage;
})();

var OpeningSlide = (function() {
  var loadElmSelector = '.js-opening-slide-img';
  var lastAnimElmSelector = '.js-anim-last-elm';
  var cls = {
    animating: 'is-animating',
    animEnd: 'is-animEnd'
  };
  var pauseTime = 1000;

  var setLoadingImage = function setLoadingImage(loadElms) {
    return loadElms.map(elm => new LoadingImage(elm));
  };

  function OpeningSlide(wrapper) {
    this.wrapper = wrapper;
    this.loadingImgs = setLoadingImage(
      utils.getByQuery(loadElmSelector, wrapper)
    );
    this.lastAnimElm = wrapper.querySelector(lastAnimElmSelector);
    this.defferd = new $.Deferred();
    this.isLoaded = false;
    this.isLoading = false;
    this.count = 0;
  }

  var proto = OpeningSlide.prototype;

  proto = Object.create(EvEmitter.prototype);

  proto.count = function() {
    ++this.count;
    if (this.count === this.loadingImgs.length) {
      this.defferd.resolve();
      this.isLoaded = true;
      this.isLoading = false;
      if (this.souldStartAnim) {
        this.animStart();
      }
    }
  };

  proto.animStart = function() {
    if (!this.isLoading) {
      this.souldStartAnim = true;
      this.load();
    }
    if (!this.isLoaded) {
      this.souldStartAnim = true;
    }
    var _this = this;
    this.wrapper.addEventListener(
      utils.transitionEndEvent,
      function onTransitionEnd(e) {
        if (e.target === _this.lastAnimElm) {
          _this.animEnd();
          _this.wrapper.removeEventListener(
            utils.transitionEndEvent,
            onTransitionEnd
          );
        }
      }
    );
    utils.addClass(this.wrapper, cls.animating);
  };

  proto.animEnd = function() {
    setTimeout(() => {
      this.emitEvent('animEnd');
      utils.addClass(this.wrapper, cls.animEnd);
    }, pauseTime);
  };

  proto.load = function() {
    this.isLoading = true;
    this.loadingImgs.forEach(loadingImg => {
      loadingImg.on('load', () => {
        this.count();
      });
      loadingImg.load();
    });
    return this.defferd.promise();
  };
  return OpeningSlide;
})();

var openingSlides = (function() {
  var selector = '.js-opening-slide';
  var openingSlides;

  var init = function init() {
    setTargets();
    startAnim();
  };

  var preLoadAfterNextSlide = function(currentIndex) {
    var afterNext = openingSlides[currentIndex + 2];
    if (afterNext) {
      afterNext.load();
    }
  };

  var startAnim = function startAnim() {
    openingSlides.reduce((prev, current, index) => {
      if (!prev) {
        current.animStart();
        preLoadAfterNextSlide(index);
        return current;
      }
      prev.on('animEnd', () => {
        current.animStart();
        preLoadAfterNextSlide(index);
      });
      return current;
    }, null);
  };

  var setTargets = function setTargets() {
    var slides = utils.getByQuery(selector);
    openingSlides = slides.map(slide => new OpeningSlide(slide));
  };

  return {
    init: init
  };
})();
