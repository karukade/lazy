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

  return {
    data: data
  };
})();

var LoadingImage = (function() {
  function LoadingImage(img) {
    this.img = img;
    this.funcs = [];
  }

  LoadingImage.prototype.check = function() {
    // If complete is true and browser supports natural sizes,
    // try to check for image status manually.
    var isComplete = this.getIsImageComplete();
    if (isComplete) {
      // report based on naturalWidth
      this.confirm(this.img.naturalWidth !== 0, 'naturalWidth');
      return;
    }

    // If none of the checks above matched, simulate loading on detached element.
    this.proxyImage = new Image();
    this.proxyImage.addEventListener('load', this);
    this.proxyImage.addEventListener('error', this);
    // bind to image as well for Firefox. #191
    this.img.addEventListener('load', this);
    this.img.addEventListener('error', this);
    this.proxyImage.src = this.img.src;
  };

  LoadingImage.prototype.getIsImageComplete = function() {
    // check for non-zero, non-undefined naturalWidth
    // fixes Safari+InfiniteScroll+Masonry bug infinite-scroll#671
    return this.img.complete && this.img.naturalWidth;
  };

  LoadingImage.prototype.confirm = function(isLoaded) {
    this.isLoaded = isLoaded;
    if (isLoaded) this.funcs.forEach(func => func(this.img));
  };

  // ----- events ----- //

  // trigger specified handler for event type
  LoadingImage.prototype.handleEvent = function(event) {
    var method = 'on' + event.type;
    if (this[method]) {
      this[method](event);
    }
  };

  LoadingImage.prototype.onload = function() {
    this.confirm(true, 'onload');
    this.unbindEvents();
  };

  LoadingImage.prototype.onerror = function() {
    this.confirm(false, 'onerror');
    this.unbindEvents();
  };

  LoadingImage.prototype.unbindEvents = function() {
    this.proxyImage.removeEventListener('load', this);
    this.proxyImage.removeEventListener('error', this);
    this.img.removeEventListener('load', this);
    this.img.removeEventListener('error', this);
  };

  LoadingImage.prototype.addOnLoaderHandler = function(func) {
    if (typeof func !== 'function') return;
    this.funcs.push(func);
  };

  return LoadingImage;
})();

function nodeListToArray(nodeList) {
  if (!nodeList) return null;
  return Array.prototype.slice.call(nodeList, null);
}

var lazy = (function() {
  var targets = null;
  var timer = null;

  var update = function() {
    if (timer) {
      cancelAnimationFrame(timer);
    }
    requestAnimationFrame(renderIfNeed);
  };

  var renderIfNeed = function() {
    var view = {
      top: window.scrollY,
      bottom: window.scrollY + window.innerHeight
    };
    targets.forEach(target => {
      if (isIn(target, view)) {
        set(target);
      }
    });
    purgeElm();
  };

  var purgeElm = function() {
    targets = targets.filter(target => !target.classList.contains('is-loaded'));
  };

  var isIn = function(elm, view) {
    var box = elm.getBoundingClientRect();
    return view.top < box.top && view.bottom > box.bottom;
  };

  var set = function(elm) {
    var src = elm.getAttribute('data-src');
    var Imgs = targets.map(target => {
      var loadingImage = new LoadingImage(target);
      loadingImage.addOnLoaderHandler(imgLoaded);
      utils.data.set(target, 'loadingImage', loadingImage);
      return loadingImage;
    });
    if (src) {
      elm.src = src;
      check(Imgs);
    }
  };

  var imgLoaded = function(elm) {
    elm.classList.add('is-loaded');
  };

  var check = function(Imgs) {
    return Imgs.filter(img => {
      img.check();
      return !img.isLoaded;
    });
  };

  var setLoadingImg = function() {
    targets = nodeListToArray(document.querySelectorAll('.js-lazy'));
  };

  var addListener = function() {
    window.addEventListener('scroll', update);
  };

  var init = function init() {
    setLoadingImg();
    addListener();
  };

  return {
    init: init
  };
})();

var fadeUinit = (function() {
  var targets = null;
  var timer = null;
  var update = function() {
    if (timer) {
      cancelAnimationFrame(timer);
    }
    requestAnimationFrame(renderIfNeed);
  };

  var renderIfNeed = function() {
    var view = {
      top: window.scrollY,
      bottom: window.scrollY + window.innerHeight
    };
    targets.forEach(target => {
      if (isIn(target, view)) {
        set(target);
      }
    });
    purgeElm();
  };

  var purgeElm = function() {
    targets = targets.filter(target => !target.classList.contains('is-loaded'));
  };

  var set = function(elm) {
    var lazyImgs = getLazyImg(elm);
    if (!lazyImgs) {
      show(elm);
      return;
    }
    lazyImgs.forEach(img => {
      var loadingImg = utils.data.get(img, 'loadingImage');
      if (loadingImg && loadingImg.isLoaded) {
        show(elm);
        return;
      }
      loadingImg.addOnLoaderHandler(() => {
        show(elm);
      });
    });
  };

  var show = function(elm) {
    elm.classList.add('is-show');
  };

  var getLazyImg = function(elm) {
    var imgs = nodeListToArray(elm.querySelectorAll('img'));
    if (imgs.length === 0) return false;
    var lazyImgs = imgs.filter(img => img.classList.contains('js-lazy'));
    return lazyImgs ? lazyImgs : false;
  };

  var isIn = function(elm, view) {
    var box = elm.getBoundingClientRect();
    return view.top < box.top && view.bottom > box.bottom;
  };

  var setElms = function() {
    targets = nodeListToArray(document.querySelectorAll('.js-fade-unit'));
  };

  var addListener = function() {
    window.addEventListener('scroll', update);
  };

  var init = function() {
    setElms();
    addListener();
  };

  return {
    init: init
  };
})();

window.addEventListener('load', () => {
  lazy.init();
  fadeUinit.init();
});
