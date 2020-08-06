/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';

export default function Edit( { className } ) {
	return (
		<p className={ className }>
			{ __( 'Request – hello from the editor!', 'dev-blocks' ) }
		</p>
	);
}
