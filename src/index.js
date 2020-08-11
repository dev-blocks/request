
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
import { version } from '../package.json';

export const description = `Request from your client to the moon, with a Gutenberg block (v${ version }).`;

registerBlockType( 'dev-blocks/request', {
	title: __( 'Request', 'dev-blocks' ),
	description,
	category: 'dev-blocks',

	attributes,

	icon: 'arrow-right-alt2',

	styles: [
		{ name: 'light', label: __( 'Light', 'dev-blocks' ) , isDefault: true },
		{ name: 'dark', label: __( 'Dark', 'dev-blocks' ) },
	],

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
