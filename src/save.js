
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function save() {
	return (
		<p>{ __( 'Request – hello from the saved content!', 'dev-blocks' ) }</p>
	);
}
