/**
 * Thank with Google Main setup component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ThankWithGoogleIcon from '../../../../../svg/graphics/thank-with-google.svg';
import ProgressBar from '../../../../components/ProgressBar';
import Badge from '../../../../components/Badge';
import { MODULES_THANK_WITH_GOOGLE } from '../../datastore/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import SetupForm from './SetupForm';
const { useSelect } = Data;

export default function SetupMain( { finishSetup } ) {
	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).isDoingSubmitChanges()
	);
	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);

	let viewComponent;
	if ( isDoingSubmitChanges || isNavigating ) {
		viewComponent = <ProgressBar />;
	} else {
		viewComponent = <SetupForm finishSetup={ finishSetup } />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--thank-with-google">
			<div className="googlesitekit-setup-module__header">
				<div className="googlesitekit-setup-module__heading">
					<div className="googlesitekit-setup-module__logo">
						<ThankWithGoogleIcon width="33" height="33" />
					</div>

					<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
						{ _x(
							'Thank with Google',
							'Service name',
							'google-site-kit'
						) }
					</h2>
				</div>

				<Badge label={ __( 'Experimental', 'google-site-kit' ) } />
			</div>

			{ viewComponent }
		</div>
	);
}

SetupMain.propTypes = {
	finishSetup: PropTypes.func,
};

SetupMain.defaultProps = {
	finishSetup: () => {},
};