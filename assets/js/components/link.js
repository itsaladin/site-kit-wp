/**
 * Link component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import classnames from 'classnames';

function Link( {
	href,
	children,
	className,
	arrow,
	external,
	inverse,
	back,
	small,
	inherit,
	caps,
	danger,
	disabled,
	...extraProps
} ) {
	// Note: the disabled attribute does not alter behavior of anchor tags,
	// so if disabled we force it to be a button.
	const isAnchor = href && ! disabled;
	const SemanticLink = isAnchor ? 'a' : 'button';

	return (
		<SemanticLink
			className={ classnames(
				'googlesitekit-cta-link',
				className,
				{
					'googlesitekit-cta-link--arrow': arrow,
					'googlesitekit-cta-link--external': external,
					'googlesitekit-cta-link--inverse': inverse,
					'googlesitekit-cta-link--back': back,
					'googlesitekit-cta-link--small': small,
					'googlesitekit-cta-link--inherit': inherit,
					'googlesitekit-cta-link--caps': caps,
					'googlesitekit-cta-link--danger': danger,
					'googlesitekit-cta-link--disabled': disabled,
				},
			) }
			href={ isAnchor ? href : undefined }
			target={ isAnchor && external ? '_blank' : undefined }
			rel={ external ? 'noopener noreferrer' : undefined }
			disabled={ disabled }
			{ ...extraProps }
		>
			{ children }
		</SemanticLink>
	);
}

Link.propTypes = {
	dangerouslySetInnerHTML: PropTypes.shape( {
		__html: PropTypes.string,
	} ),
	onClick: PropTypes.func,
	href: PropTypes.string,
	children: PropTypes.oneOfType( [
		PropTypes.string.isRequired,
		PropTypes.array.isRequired,
	] ),
	className: PropTypes.string,
	arrow: PropTypes.bool,
	external: PropTypes.bool,
	inverse: PropTypes.bool,
	back: PropTypes.bool,
	small: PropTypes.bool,
	inherit: PropTypes.bool,
	caps: PropTypes.bool,
	danger: PropTypes.bool,
	disabled: PropTypes.bool,
};

Link.defaultProps = {
	dangerouslySetInnerHTML: undefined,
	onClick: null,
	href: '',
	className: '',
	arrow: false,
	external: false,
	inverse: false,
	back: false,
	small: false,
	inherit: false,
	caps: false,
	danger: false,
	disabled: false,
};

export default Link;
