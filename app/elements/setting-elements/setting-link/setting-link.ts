/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {html} from '../../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property} from '../../../node_modules/@polymer/decorators/lib/decorators.js';

import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';

import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../../node_modules/@polymer/iron-icon/iron-icon.js';

import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-item/paper-icon-item.js';

import SettingBase from '../setting-base/setting-base.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';


/**
 * Polymer element for a url link
 */
@customElement('setting-link')
class SettingLink extends SettingBase {

  /** Description */
  @property({type: String})
  protected label: string;

  /** Icon */
  @property({type: String})
  protected icon: string;

  /** Link url */
  @property({type: String})
  protected url: string;

  static get template() {
    // language=HTML format=false
    return html`
<style include="shared-styles iron-flex iron-flex-alignment">
  :host {
    display: block;
    position: relative;
  }

  :host paper-icon-item {
    --paper-item-focused-before: {
      background: transparent;
    };
    --paper-item-selected: {
      background: transparent;
    };
    --paper-item-icon-width: 32px;
    padding-left: 48px;
    padding-top: 4px;
    padding-bottom: 4px;
    cursor: pointer;
  }

  :host .divider {
    margin-left: 48px;
    margin-right: 0;
  }
</style>

<setting-base section-title="[[sectionTitle]]" noseparator="[[noseparator]]">

  <paper-icon-item on-tap="onLinkTapped" class="flex">
    <paper-ripple center=""></paper-ripple>
    <iron-icon class="setting-link-icon" icon="[[icon]]" slot="item-icon"></iron-icon>
    <span class="setting-label">[[label]]</span>
  </paper-icon-item>

</setting-base>
`;
  }

  /**
   * Event: Item tapped - show url in new tab
   */
  private onLinkTapped() {
    ChromeGA.event(ChromeGA.EVENT.LINK, this.name);
    chrome.tabs.create({url: this.url});
  }

}
