

/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import './style.scss';

/**
 * Internal dependencies
 */
import Edit from './edit';
import save from './save';
import attributes from './attributes';

registerBlockType( 'dev-blocks/request', {
	title: __( 'Request', 'dev-blocks' ),
	description: __(
		'Request from your client to the moon, with a Gutenberg block.',
		'dev-blocks'
	),
	category: 'dev-blocks',

	attributes,

	icon: 'arrow-right-alt2',

	supports: {
		html: false,
	},

	/**
	 * @see ./edit.js
	 */
	edit: Edit,

	/**
	 * @see ./save.js
	 */
	save,
} );
