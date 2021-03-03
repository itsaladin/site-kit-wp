/**
 * `modules/adsense` data store
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import baseModuleStore from './base';
import accounts from './accounts';
import adunits from './adunits';
import alerts from './alerts';
import clients from './clients';
import report from './report';
import tags from './tags';
import urlchannels from './urlchannels';
import settings from './settings';
import adblocker from './adblocker';
import service from './service';
import { STORE_NAME } from './constants';

const store = Data.combineStores(
	baseModuleStore,
	accounts,
	adunits,
	alerts,
	clients,
	report,
	tags,
	urlchannels,
	settings,
	adblocker,
	service
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export const registerStore = ( registry ) => {
	registry.registerStore( STORE_NAME, store );
};

export default store;
