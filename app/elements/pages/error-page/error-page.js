/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '/node_modules/@polymer/polymer/polymer-legacy.js';

import '/node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '/node_modules/@polymer/paper-styles/typography.js';
import '/node_modules/@polymer/paper-styles/color.js';
import '/node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import '/node_modules/@polymer/paper-material/paper-material.js';
import '/node_modules/@polymer/paper-toggle-button/paper-toggle-button.js';
import '/node_modules/@polymer/paper-tooltip/paper-tooltip.js';
import '/node_modules/@polymer/paper-button/paper-button.js';
import '/node_modules/@polymer/paper-item/paper-item.js';
import '/node_modules/@polymer/paper-item/paper-item-body.js';
import '/node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '/node_modules/@polymer/paper-checkbox/paper-checkbox.js';
import {LocalizeBehavior} from
      '/elements/setting-elements/localize-behavior/localize-behavior.js';
import {Polymer} from '/node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '/node_modules/@polymer/polymer/lib/utils/html-tag.js';
import '/styles/shared-styles.js';

import '/scripts/chrome-extension-utils/scripts/ex_handler.js';

(function(window) {

  window.app = window.app || {};

  /**
   * Polymer element for the Error Page
   * @namespace app.ErrorPage
   */
  app.ErrorPageFactory = Polymer({
    _template: html`
    <style include="iron-flex iron-flex-alignment"></style>
    <style include="shared-styles"></style>
    <style>

      :host {
        display: block;
        position: relative;
      }

      .page-container {
        max-width: 1000px;
        height: 100%;
        margin-bottom: 16px;
      }

       #errorViewer {
        min-height: 75vh;
        white-space: pre-wrap;
        overflow: hidden;
        padding-left: 16px;
        padding-right: 16px;
        margin: 0;
      }
      
      .error-title {
        @apply --paper-font-title;
        padding: 0;
        margin: 0;
      }

      .error-text {
        @apply --paper-font-subhead;
        padding: 0;
        margin: 0;
      }

    </style>

    <paper-material elevation="1" class="page-container">
    
      <!-- Tool bar -->
      <paper-material elevation="1">
        <app-toolbar class="page-toolbar">
          <span class="space"></span>
          <div class="middle middle-container center horizontal layout flex">
            <div class="flex">{{localize('last_error_viewer_title')}}</div>
            <paper-icon-button id="email" icon="myicons:mail" on-tap="_onEmailTapped" disabled\$="[[!lastError.message]]">
            </paper-icon-button>
            <paper-tooltip for="email" position="left" offset="0">
              Send email to support
            </paper-tooltip>
            <paper-icon-button id="remove" icon="myicons:delete" on-tap="_onRemoveTapped" disabled\$="[[!lastError.message]]">
            </paper-icon-button>
            <paper-tooltip for="remove" position="left" offset="0">
              Delete the error
            </paper-tooltip>
          </div>
        </app-toolbar>
      </paper-material>
      
      <!-- Content -->
      <div class="page-content">
        <div id="errorViewer">
          <paper-item class="error-title">[[_computeTitle(lastError)]]</paper-item>
          <paper-item class="error-text">[[lastError.message]]</paper-item>
          <paper-item class="error-text">[[_computeStack(lastError)]]</paper-item>
        </div>
      </div>
    </paper-material>
`,

    is: 'error-page',

    behaviors: [
      LocalizeBehavior,
    ],

    properties: {

      /**
       * The LastError Object to display
       * @memberOf app.ErrorPage
       */
      lastError: {
        type: Object,
        value: function() {
          return new Chrome.Storage.LastError();
        },
        notify: true,
      },
    },

    /**
     * Element is ready
     * @memberOf app.ErrorPage
     */
    ready: function() {
      Chrome.Storage.getLastError().then((lastError) => {
        this.set('lastError', lastError);
        return Promise.resolve();
      }).catch((err) => {
        Chrome.GA.error(err.message, 'ErrorPage.ready');
      });
      chrome.storage.onChanged.addListener((changes) => {
        // listen for changes to lastError
        for (const key in changes) {
          if (changes.hasOwnProperty(key)) {
            if (key === 'lastError') {
              const change = changes[key];
              this.set('lastError', change.newValue);
              break;
            }
          }
        }
      });
    },

    /**
     * Event: Email support
     * @private
     * @memberOf app.ErrorPage
     */
    _onEmailTapped: function() {
      let body = app.Utils.getEmailBody();
      body = body + `${this.lastError.title}\n\n${this.lastError.message}\n\n` +
          `${this.lastError.stack}`;
      body = body + '\n\nPlease provide any additional info. ' +
          'on what led to the error.\n\n';

      const url = app.Utils.getEmailUrl('Last Error', body);
      Chrome.GA.event(Chrome.GA.EVENT.ICON, 'LastError email');
      chrome.tabs.create({url: url});
    },

    /**
     * Event: Remove the error
     * @private
     * @memberOf app.ErrorPage
     */
    _onRemoveTapped: function() {
      Chrome.Storage.clearLastError();
      Chrome.GA.event(Chrome.GA.EVENT.ICON, 'LastError delete');
    },

    /**
     * Computed Binding
     * @param {Chrome.Storage.LastError} lastError - the error
     * @param {Chrome.Storage.LastError} lastError.stack - stack trace
     * @returns {string} stack trace
     * @private
     * @memberOf app.ErrorPage
     */
    _computeStack: function(lastError) {
      return lastError.message ? lastError.stack : '';
    },

    /**
     * Computed Binding
     * @param {Chrome.Storage.LastError} lastError - the error
     * @param {Chrome.Storage.LastError} lastError.title - message title
     * @returns {string} page title
     * @private
     * @memberOf app.ErrorPage
     */
    _computeTitle: function(lastError) {
      return lastError.message ? lastError.title : '';
    },
  });
})(window);
