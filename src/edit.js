/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';
import { useState, useRef, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { endpointsAutocompleter } from './components/autocomplete';

import './editor.scss';

export default function RequestEdit( { className, attributes, setAttributes } ) {
	// State.
	const [ placeholder, setPlaceholder ] = useState( __( 'Type / to show available endpoints ', 'dev-blocks' ) );
	const [ endpoints, setEndpoints ] = useState( [] );

	// Attributes - values.
	const { value, namespace } = attributes;

	// Attribute - Setter shorthands.
	const setValue = newValue => setAttributes( { value: newValue } );
	const setEndpointId = useCallback( ( { id } ) => setAttributes( { endpointId: id } ) );

	// References.
	const endpointRef = useRef();

	return (
		<div className={ className }>
			<RichText
				ref={ endpointRef }
				tagName="div"
				placeholder={ placeholder }
				keepPlaceholderOnFocus={ true }
				value={ value }
				onChange={ setValue }
				autocompleters={ [ endpointsAutocompleter( {
					path: namespace,
					options: endpoints,
					onEndpointSelect: setEndpointId,
				} ) ] }
				multiline={ false }
				allowedFormats={ [] }
			/>
		</div>
	);
}
