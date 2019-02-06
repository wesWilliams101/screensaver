/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
import '@polymer/polymer/polymer-legacy.js';

import '@polymer/paper-styles/typography.js';
import '@polymer/paper-styles/color.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

// noinspection ThisExpressionReferencesGlobalObjectJS
(function(window, factory) {
  window.ExceptionHandler = factory(window);
}(window, function(window) {

  return ExceptionHandler;

  /**
   * Log Exceptions with analytics. Include: new ExceptionHandler()<br />
   * at top of every js file
   * @constructor
   * @alias ExceptionHandler
   */
  function ExceptionHandler() {
    if (typeof window.onerror === 'object') {
      // global error handler
      window.onerror = function(message, url, line, col, errObject) {
        if (Chrome && Chrome.Log && errObject) {
          Chrome.Log.exception(errObject, null, true);
        }
      };
    }
  }
}));

new ExceptionHandler();

/**
 * Polymer element to select an item from a list
 * @namespace SettingDropdown
 */
Polymer({
  _template: html`
    <style include="iron-flex iron-flex-alignment"></style>
    <style include="shared-styles"></style>
    <style>
      :host {
        display: block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      :host > paper-item {
        padding-top: 10px;
        padding-bottom: 10px;
      }

      :host paper-dropdown-menu {
        width: 175px;

        --paper-input-container-input: {
          text-align: right;
        };
      }
    </style>

    <div class="section-title setting-label" tabindex="-1" hidden\$="[[!sectionTitle]]">
      {{sectionTitle}}
    </div>

    <paper-item class="center horizontal layout" tabindex="-1">
      <div class="setting-label flex">{{label}}</div>
      <paper-dropdown-menu disabled\$="[[disabled]]" noink="" no-label-float="">
        <paper-listbox slot="dropdown-content" on-tap="_onItemSelected" selected="{{value}}">
          <template id="t" is="dom-repeat" items="[[items]]">
            <paper-item>[[item]]</paper-item>
          </template>
        </paper-listbox>
      </paper-dropdown-menu>
    </paper-item>
    <hr hidden\$="[[noseparator]]">

    <app-localstorage-document key="[[name]]" data="{{value}}" storage="window.localStorage">
    </app-localstorage-document>
`,

  is: 'setting-dropdown',

  properties: {
    /**
     * Local storage key
     * @memberOf SettingDropdown
     */
    name: {
      type: String,
      value: 'store',
    },

    /**
     * Menu description
     * @memberOf SettingDropdown
     */
    label: {
      type: String,
      value: '',
    },

    /**
     * Selected menu item index
     * @memberOf SettingDropdown
     */
    value: {
      type: Number,
      value: 0,
      notify: true,
    },

    /**
     * Array of Menu item labels
     * @memberOf SettingDropdown
     */
    items: {
      type: Array,
      value: function() {
        return [];
      },
    },

    /**
     * Optional group title
     * @memberOf SettingDropdown
     */
    sectionTitle: {
      type: String,
      value: '',
    },

    /**
     * Disabled state of element
     * @memberOf SettingDropdown
     */
    disabled: {
      type: Boolean,
      value: false,
    },

    /**
     * Visibility state of optional divider
     * @memberOf SettingDropdown
     */
    noseparator: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * Event: menu item tapped
   * @param {Event} ev - tap event
   * @private
   * @memberOf SettingDropdown
   */
  _onItemSelected: function(ev) {
    const model = this.$.t.modelForElement(ev.target);
    if (model) {
      Chrome.GA.event(Chrome.GA.EVENT.MENU,
          `${this.name}: ${model.index}`);
    }
  },
});