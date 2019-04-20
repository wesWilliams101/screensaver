/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Manage the {@link PhotoSource} objects
 */

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';

import * as PhotoSourceFactory from './photo_source_factory.js';

/**
 * Get the sources that are marked true in local storage
 *
 * @returns Array of sources
 */
export function getSelectedSources() {
  const ret = [];
  const useKeyValues = getUseKeyValues();
  for (const useKeyValue of useKeyValues) {
    const isSelected = ChromeStorage.getBool(useKeyValue, false);
    if (isSelected) {
      const source = PhotoSourceFactory.create(useKeyValue);
      if (source) {
        ret.push(source);
      }
    }
  }
  return ret;
}

/**
 * Get all the UseKey values
 *
 * @returns Array of usage keys
 */
export function getUseKeyValues() {
  const ret = [];
  for (const useKey of Object.values(PhotoSourceFactory.UseKey)) {
    ret.push(useKey);
  }
  return ret;
}

/**
 * Determine if a given key is a photo source
 *
 * @param keyName - key to check
 * @returns true if photo source
 */
export function isUseKey(keyName: string) {
  let ret = false;
  for (const useKey of Object.values(PhotoSourceFactory.UseKey)) {
    if (useKey === keyName) {
      ret = true;
      break;
    }
  }
  return ret;
}

/**
 * Process the given photo source and save to localStorage.
 *
 * @param useKey - The photo source to retrieve
 * @throws An error if processing failed
 */
export async function process(useKey: PhotoSourceFactory.UseKey) {
  const source = PhotoSourceFactory.create(useKey);
  if (source) {
    await source.process();
  }

  return Promise.resolve();
}

/**
 * Get all the photos from all selected sources. These will be used by the screensaver.
 *
 * @throws An error if we failed to get photos
 * @returns Array of sources
 */
export async function getSelectedPhotos() {
  const ret = [];

  const sources = getSelectedSources();
  for (const source of sources) {
    const photos = await source.getPhotos();
    ret.push(photos);
  }

  return Promise.resolve(ret);
}

/**
 * Process all the selected photo sources.
 *
 * @param doGoogle - update user's Google Photos too
 */
export async function processAll(doGoogle = false) {
  const sources = getSelectedSources();
  for (const source of sources) {
    let skip = false;
    const type = source.getType();
    if ('Google User' === type) {
      skip = !doGoogle;
    }
    if (!skip) {
      try {
        await source.process();
      } catch (err) {
        // ignore
      }
    }
  }

  return Promise.resolve();
}

/**
 * Process all the selected photo sources that are to be update daily
 */
export async function processDaily() {
  const sources = getSelectedSources();
  for (const source of sources) {
    if (source.isDaily()) {
      try {
        await source.process();
      } catch (err) {
        // ignore
      }
    }
  }

  return Promise.resolve();
}
