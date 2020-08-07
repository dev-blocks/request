
/**
 * External dependencies
 */
import { map, values, filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, RichText } from '@wordpress/block-editor';
import { useState, useRef, useCallback, useEffect, Fragment } from '@wordpress/element';
import { Panel, PanelBody, SelectControl, CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { endpointsAutocompleter } from './components/autocomplete';
import { requestNamespaces, requestEndpoints } from './utils/request-api';
import { METHODS } from './constants';

import './editor.scss';

export default function RequestEdit( { className, attributes, setAttributes } ) {
	// State.
	const [ placeholder, setPlaceholder ] = useState( __( 'Type / to show available endpoints', 'dev-blocks' ) );
	const [ endpoints, setEndpoints ] = useState( [] );
	const [ namespaces, storeNamespaces ] = useState( [] );
	const [ filterMethods, setFilterMethods ] = useState( METHODS );

	// Attributes - values.
	const { value, namespace, endpointId } = attributes;

	// Attribute - Setter shorthands.
	const setValue = newValue => setAttributes( { value: newValue } );
	const setEndpointId = useCallback( ( { id } ) => setAttributes( { endpointId: id } ) );
	const setNamespace = namespace => setAttributes( { namespace } );

	// References.
	const endpointRef = useRef();

	/*
	 * Effect Hook - Initial request.
	 * Pick up namespaces.
	 */
	useEffect( () => {
		requestNamespaces
			.then( data => {
				if ( ! data?.length ) {
					return;
				}

				storeNamespaces( data );

				// Pick up the first namespace as default.
				if ( ! namespace ) {
					setNamespace( data?.[ 0 ]?.label );
					setPlaceholder( `[${ namespace }]. Picking up endpoints ...` );
				}
			} )
			.catch( console.error );
	}, [] );

	/*
	 * Effect hook - Set current API namespace.
	 */
	useEffect( () => {
		// Set placeholder description.
		if ( ! namespace ) {
			return setPlaceholder( __( 'Endpoints not found' ) );
		}

		if ( endpoints.length ) {
			setPlaceholder( `[${ namespace }] ${ endpoints.length } endpoints. Type / ...` );
		} else {
			setPlaceholder( `No endpoints for [${ namespace }]` );
		}
	}, [ namespace, endpoints ] );

	/*
	 * Effect hook - Request and populate endpoints, filtering by methods.
	 */
	useEffect( () => {
		const filterMethodsArray = map( values( filter( filterMethods, m => ! m.enabled ) ), 'label' );
		requestEndpoints({
			path: namespace,
			filterMethods: filterMethodsArray,
		} )
			.then( setEndpoints )
			.catch( console.error );
	}, [ namespace, filterMethods ] );


	const methodFilterHandler = useCallback( ( method, name ) => ( value ) => {
		setFilterMethods( {
			...filterMethods,
			[ name ]: {
				...method,
				enabled: value,
			},
		} );
	} );

	return (
		<Fragment>
			<InspectorControls>
				{ ! endpointId && (
					<Panel>
						<PanelBody title={ __( 'Namespaces' ) }>
							<SelectControl
								label={ __( 'Namespace' ) }
								value={ namespace }
								onChange={ setNamespace }
								options={ namespaces }
							/>
						</PanelBody>

						<PanelBody title={ __( 'Methods filter' ) } initialOpen={ false }>
							<div className={ `${ className }__methods_filter` }>
								{ map( METHODS, ( method, name ) => (
									<CheckboxControl
										key={ name }
										label={ method.label }
										onChange={ methodFilterHandler( method, name ) }
										checked={ filterMethods[ name ].enabled }
									/>
								) ) }
							</div>
						</PanelBody>
					</Panel>
				) }
			</InspectorControls>
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
		</Fragment>
	);
}
