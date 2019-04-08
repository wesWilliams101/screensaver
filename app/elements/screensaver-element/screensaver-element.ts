/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../node_modules/@polymer/polymer/polymer-legacy.js';
import {Polymer} from '../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../node_modules/@polymer/font-roboto/roboto.js';

import '../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../node_modules/@polymer/iron-image/iron-image.js';

import '../../node_modules/@polymer/neon-animation/neon-animated-pages.js';
import '../../node_modules/@polymer/neon-animation/neon-animations.js';
import '../../node_modules/@polymer/neon-animation/neon-animatable.js';

import '../../elements/animations/spin-up-animation/spin-up-animation.js';
import '../../elements/animations/spin-down-animation/spin-down-animation.js';
import '../../elements/slide-animatable/slide-animatable.js';
import '../../elements/weather-element/weather-element.js';

import {LocalizeBehavior} from '../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../elements/shared-styles.js';

import * as MyGA from '../../scripts/my_analytics.js';
import * as MyMsg from '../../scripts/my_msg.js';

import '../../scripts/screensaver/ss_events.js';
import '../../scripts/screensaver/ss_history.js';
import '../../scripts/screensaver/ss_photo.js';
import '../../scripts/screensaver/ss_photo_finder.js';
import '../../scripts/screensaver/views/ss_view.js';
import '../../scripts/screensaver/views/ss_view_factory.js';
import '../../scripts/screensaver/views/ss_view_frame.js';
import '../../scripts/screensaver/views/ss_view_letterbox.js';
import '../../scripts/screensaver/views/ss_view_zoom.js';

import * as SSBuilder from '../../scripts/screensaver/ss_builder.js';
import * as SSRunner from '../../scripts/screensaver/ss_runner.js';
import * as SSTime from '../../scripts/screensaver/ss_time.js';
import * as SSPhotos from '../../scripts/screensaver/ss_photos.js';
import * as SSViews from '../../scripts/screensaver/ss_views.js';

import {GoogleSource} from '../../scripts/sources/photo_source_google.js';

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLog from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import ChromeTime from '../../scripts/chrome-extension-utils/scripts/time.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

declare var ChromePromise: any;

/**
 * Module for a screensaver
 * @module els/screensaver
 */

/**
 * Object to handle Google Photos load errors
 * @type {Object}
 * @typedef {Object} module:els/screensaver.Screensaver.ErrHandler
 * @property {int} MAX_COUNT - max times to call
 * @property {int} count - count of calls
 * @property {boolean} isUpdating - true if an event is handling an error
 * @property {int} TIME_LIMIT - throttle calls to this fast in case something
 *  weird happens
 * @property {int} lastTime - last time called
 * @private
 */
const _errHandler = {
  MAX_COUNT: 168, // about a weeks worth, if all goes well
  count: 0,
  isUpdating: false,
  TIME_LIMIT: (5 * 60000), // five minutes in milli sec
  lastTime: 0,
};

/** @type {Function} */
export let createPages: () => void = null;
/** @type {Function} */
export let setSizingType: (arg0: string) => void = null;
/** @type {Function} */
export let isNoPhotos: () => boolean = null;
/** @type {Function} */
export let setNoPhotos: () => void = null;
/** @type {Function} */
export let setTimeLabel: (arg0: string) => void = null;
/** @type {Function} */
export let setPaused: (arg0: boolean) => void = null;

/**
 * Polymer element to display a screensaver
 * @type {{}}
 * @alias module:els/screensaver.Screensaver
 * @PolymerElement
 */
const Screensaver = Polymer({
  // language=HTML format=false
  _template: html`<!--suppress CssUnresolvedCustomProperty -->
<style include="iron-flex iron-flex-alignment iron-positioning"></style>
<style include="shared-styles"></style>
<style>

  /* Added programmatically */
  .fadeOut {
    animation: fadeOut 1s 2s;
    animation-fill-mode: both;
  }

  @keyframes fadeOut {
    from {
      opacity: 1.0;
    }
    to {
      opacity: 0.0;
    }
  }

  .vcr {
    position: fixed;
    width: 15vh;
    height: 15vh;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.0;
  }

  .time {
    font-size: 5.25vh;
    font-weight: 200;
    position: fixed;
    right: 1vw;
    bottom: 3.5vh;
    padding: 0;
    margin: 0;
    color: white;
    opacity: 1.0;
  }

  .weather {
    font-size: 5.25vh;
    font-weight: 200;
    position: fixed;
    left: 1vw;
    bottom: 3.5vh;
    padding: 0;
    margin: 0;
    color: white;
    opacity: 1.0;
  }

  .author {
    font-size: 2.5vh;
    font-weight: 300;
    position: fixed;
    overflow: hidden;
    right: 1vw;
    bottom: 1vh;
    padding: 0;
    margin: 0;
    color: white;
    opacity: 1.0;
  }

  .location {
    font-size: 2.5vh;
    font-weight: 300;
    position: fixed;
    overflow: hidden;
    left: 1vw;
    bottom: 1vh;
    padding: 0;
    margin: 0;
    color: white;
    opacity: 1.0;
  }

  .noPhotos {
    font-size: 5vh;
    font-weight: 600;
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: rgba(48, 63, 159, 1);
    opacity: .8;
  }

</style>

<div id="mainContainer" class="flex" hidden$="[[noPhotos]]">
  <neon-animated-pages id="pages" class="fit" animate-initial-selection>
    <template is="dom-repeat" id="repeatTemplate" as="view" items="[[_views]]">
      <slide-animatable ani-type="[[aniType]]" class="fit">
        <section id="view[[index]]">
          <iron-image
              class="image"
              src="[[view.url]]"
              width="[[screenWidth]]"
              height="[[screenHeight]]"
              sizing="[[sizingType]]"
              on-error-changed="_onErrorChanged"
              preload>
          </iron-image>
          <div class="time">[[timeLabel]]</div>
          <div class="author">[[view.authorLabel]]</div>
          <div class="location">[[view.locationLabel]]</div>
          <weather-element class="weather"></weather-element>
        </section>
      </slide-animatable>
    </template>
  </neon-animated-pages>
</div>

<div class="noPhotos" hidden$="[[!noPhotos]]">[[localize('no_photos')]]</div>

<iron-image id="pauseImage" class="vcr" src="../images/pause.png" sizing="contain" preload
            hidden$="[[!paused]]"></iron-image>
<iron-image id="playImage" class="vcr" src="../images/play.png" sizing="contain" preload
            hidden$="[[paused]]"></iron-image>
`,

  is: 'screensaver-element',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

    /**
     * Array of {@link SSView} objects
     */
    _views: {
      type: Array,
      value: [],
    },

    /**
     * The way an image is rendered
     */
    sizingType: {
      type: String,
      value: null,
    },

    /**
     * Type for between photo animation
     */
    aniType: {
      type: Number,
      value: 0,
    },

    /**
     * Screen width in pixels
     * @const
     */
    screenWidth: {
      type: Number,
      value: screen.width,
      readOnly: true,
    },

    /**
     * Screen height in pixels
     * @const
     */
    screenHeight: {
      type: Number,
      value: screen.height,
      readOnly: true,
    },

    /**
     * Flag to indicate if slideshow is paused
     */
    paused: {
      type: Boolean,
      value: false,
      observer: '_pausedChanged',
    },

    /**
     * Flag to indicate if we have no valid photos
     */
    noPhotos: {
      type: Boolean,
      value: false,
    },

    /**
     * Label for current time
     */
    timeLabel: {
      type: String,
      value: '',
    },
  },

  /**
   * Element is ready
   */
  ready: function() {

    // set selected background image
    document.body.style.background = ChromeStorage.get('background',
        'background:linear-gradient(to bottom, #3a3a3a, #b5bdc8)').substring(11);

    // Initialize exports
    createPages = this.createPages.bind(this);
    setSizingType = this.setSizingType.bind(this);
    isNoPhotos = this.isNoPhotos.bind(this);
    setNoPhotos = this.setNoPhotos.bind(this);
    setTimeLabel = this.setTimeLabel.bind(this);
    setPaused = this.setPaused.bind(this);

    setTimeout(async () => {
      MyGA.initialize();
      ChromeGA.page('/screensaver.html');

      await this._setZoom();

      this._setupPhotoTransitions();

      // start slide show
      this._launch().catch(() => {});

    }, 0);
  },

  /**
   * Create the {@link SSViews} that will be animated
   */
  createPages: function() {
    SSViews.create(this);
  },

  /**
   * Set the sizing type for the paper-image elements
   * @param {string} type The sizing type
   */
  setSizingType: function(type: string) {
    this.set('sizingType', type);
  },

  /**
   * Do we have usable photos
   * @returns {boolean} true if all photos are bad
   */
  isNoPhotos: function() {
    return this.noPhotos;
  },

  /**
   * Set the state when no photos are available
   */
  setNoPhotos: function() {
    this.set('noPhotos', true);
  },

  /**
   * Set the time label
   * @param {string} label - current time
   */
  setTimeLabel: function(label: string) {
    this.set('timeLabel', label);
  },

  /**
   * Set the state when slideshow is paused
   * @param {boolean} paused - paused state
   */
  setPaused: function(paused: boolean) {
    this.set('paused', paused);
  },

  /**
   * Process settings related to between photo transitions
   * @private
   */
  _setupPhotoTransitions: function() {
    let type = ChromeStorage.getInt('photoTransition', 0);
    if (type === 8) {
      // pick random transition
      type = ChromeUtils.getRandomInt(0, 7);
    }
    this.set('aniType', type);

    SSTime.initialize();
  },

  /**
   * Set the window zoom factor to 1.0
   * @returns {Promise<void>}
   * @private
   */
  _setZoom: async function() {
    const chromep = new ChromePromise();
    try {
      const zoomFactor = await chromep.tabs.getZoom();
      if ((zoomFactor <= 0.99) || (zoomFactor >= 1.01)) {
        chrome.tabs.setZoom(1.0);
      }
    } catch (err) {
      ChromeGA.error(err.message, 'SS._setZoom');
    }

    return Promise.resolve();
  },

  /**
   * Launch the slide show
   * @param {int} [delay=2000] - delay in milli sec before start
   * @returns {Promise<void>}
   * @private
   */
  _launch: async function(delay: number = 2000) {
    try {
      const hasPhotos = await SSBuilder.build();
      if (hasPhotos) {
        // send msg to update weather. don't wait can be slow
        ChromeMsg.send(MyMsg.UPDATE_WEATHER).catch(() => {});

        // kick off the slide show
        SSRunner.start(delay);
      }
    } catch (err) {
      ChromeLog.error(err.message, 'SS._launch');
      setNoPhotos();
    }

    return Promise.resolve();
  },

  /**
   * Event: Error state changed for a photo view
   * @param ev - the event object
   */
  _onErrorChanged: async function(ev: any) {
    const isError: boolean = ev.detail.value;

    if (_errHandler.isUpdating) {
      // another error event is already handling this
      return;
    }

    if (isError) {
      // url failed to load
      _errHandler.isUpdating = true;

      const model = ev.model;
      const theIndex = model.index;
      const theView = this._views[theIndex];
      const thePhoto = theView.photo;
      const theType = thePhoto.getType();
      if ('Google User' === theType) {
        // Google baseUrl may have expired, try to update some photos

        // TODO have to use cors to get status code
        // TODO so have to have permission from site
        // first, fetch again and check status - only handle 403 errors
        // const url = photo.getUrl();
        // try {
        //   const response = await fetch(url, {
        //     method: 'get',
        //   });
        //   const status = response.status;
        //   console.log(status);
        //   if (status !== 403) {
        //     // some other problem, don't know how to fix it
        //     _isUpdating = false;
        //     return;
        //   }
        // } catch (err) {
        //   // some other problem, don't know how to fix it
        //   console.log(err);
        //   _isUpdating = false;
        //   return;
        // }

        // throttle call rate to Google API per screensaver session
        // in case something weird happens
        if ((Date.now() - _errHandler.lastTime) < _errHandler.TIME_LIMIT) {
          _errHandler.isUpdating = false;
          return;
        }

        // limit max number of calls to Google API per screensaver session
        // in case something weird happens
        _errHandler.count++;
        if (_errHandler.count >= _errHandler.MAX_COUNT) {
          _errHandler.isUpdating = false;
          return;
        }

        // update last call time
        _errHandler.lastTime = Date.now();

        // Calculate an hours worth of photos max
        const transTime = SSRunner.getWaitTime();
        let nPhotos = Math.round(ChromeTime.MSEC_IN_HOUR / transTime);
        // do at least 50, still one rpc. will help when displaying
        // a lot for short times
        nPhotos = Math.max(nPhotos, 50);

        if (_errHandler.count === 1) {
          // limit to 50 on first call for quicker starts
          nPhotos = Math.min(nPhotos, 50);
        } else {
          // limit to 300 on subsequent calls
          nPhotos = Math.min(nPhotos, 300);
        }

        // get max of nPhotos Google Photo ids starting at this one
        const photos = SSPhotos.getNextGooglePhotos(nPhotos, thePhoto.getId());
        const ids = [];
        for (const photo of photos) {
          // unique ids only - required for batchGet call
          const id = photo.getEx().id;
          if (ids.indexOf(id) === -1) {
            ids.push(id);
          }
        }

        let newPhotos = [];
        try {
          // load the new photos from Google Photos
          newPhotos = await GoogleSource.loadPhotos(ids);
        } catch (err) {
          // major problem, give up for this session
          _errHandler.count = _errHandler.MAX_COUNT + 1;
          _errHandler.isUpdating = true;
          return;
        }

        // update the Google Photos baseUrls for this screensaver session
        SSPhotos.updateGooglePhotoUrls(newPhotos);

        // update any views with the new google photos
        for (const view of this._views) {
          const photo = view.photo;
          const type = photo.getType();
          if (type === 'Google User') {
            const index = newPhotos.findIndex((e) => {
              return e.ex.id === photo.getEx().id;
            });
            if (index >= 0) {
              view.setUrl(newPhotos[index].url);
            }
          }
        }

        // persist new baseUrls to albumSelections
        const updated = await GoogleSource.updateBaseUrls(newPhotos);
        if (!updated) {
          // major problem, give up for this session
          _errHandler.count = _errHandler.MAX_COUNT + 1;
          _errHandler.isUpdating = true;
          return;
        }

        _errHandler.isUpdating = false;
      }
    }
  },

  /**
   * Observer: Paused state changed
   * @param {boolean} newValue - new value
   * @param {boolean} oldValue - old value
   * @private
   * @memberOf SlideAnimatable
   */
  _pausedChanged: function(newValue: boolean, oldValue: boolean) {
    if (typeof oldValue === 'undefined') {
      return;
    }
    if (newValue) {
      this.$.pauseImage.classList.add('fadeOut');
      this.$.playImage.classList.remove('fadeOut');
    } else {
      this.$.playImage.classList.add('fadeOut');
      this.$.pauseImage.classList.remove('fadeOut');
    }
  },

});

export default Screensaver;
