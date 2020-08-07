
/**
 * External dependencies
 */
import { map, values, filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, RichText } from '@wordpress/block-editor';
import { useState, useRef, useCallback, useEffect, Fragment, useReducer, } from '@wordpress/element';
import { Panel, PanelBody, SelectControl, CheckboxControl, TextControl, ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { endpointsAutocompleter } from './components/autocomplete';
import { requestNamespaces, requestEndpoints, requestEndpoint } from './utils/request-api';
import EndpointInput from './components/endpoint-input';

import { METHODS } from './constants';

import './editor.scss';

const argumentsReducer = ( currentState, newState ) => ( {
	...currentState,
	...newState,
} );

export default function RequestEdit( { className, attributes, setAttributes } ) {
	// State.
	const [ placeholder, setPlaceholder ] = useState( __( 'Type / to show available endpoints', 'dev-blocks' ) );
	const [ endpoints, setEndpoints ] = useState( [] );
	const [ namespaces, storeNamespaces ] = useState( [] );
	const [ filterMethods, setFilterMethods ] = useState( METHODS );
	const [ populateArguments, setPopulateArguments ] = useState( false );
	const [ response, setResponse ] = useState( null );
	const [ isErrorResponse, setIsErrorResponse ] = useState( null );

	const [ endpointArguments, setArgument ] = useReducer( argumentsReducer, {} );

	// Attributes - values.
	const { value, namespace, endpointId, endpointMethod, endpointValue, endpointParams } = attributes;

	// Attribute - Setter shorthands.
	const setValue = newValue => setAttributes( { value: newValue } );
	const setEndpointId = useCallback( ( { id } ) => setAttributes( { endpointId: id } ) );
	const setNamespace = namespace => setAttributes( { namespace } );
	const setEndpointValue = value => setAttributes( { endpointValue: value } );
	const setMethod = value => setAttributes( { endpointMethod: value } );
	const cleanEndpointParams = () => setAttributes( { endpointParams: {} } );
	const setParam = ( name, value ) => setAttributes( { endpointParams: {
		...endpointParams,
		[ name ] :value,
	} } );

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

	// Set initial endpoint method.
	useEffect( () => {
		if ( endpointMethod ) {
			return;
		}

		const endpointData = getEndpoint();
		setMethod( endpointData?.methods?.[ 0 ] );
	}, [ endpointId, endpointMethod ] );

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

	const getEndpoint = () => {
		const endpoint = filter( endpoints, ( { id } ) => id === endpointId );
		if ( endpoint.length !== 1 ) {
			return false;
		}
		return endpoint[ 0 ];
	};

	const getEndpointMethods = () => {
		const endpoint = getEndpoint();
		if ( ! endpoint ) {
			return [];
		}
		return endpoint.methods;
	};

	const getEndpointArguments = () => {
		const endpoint = getEndpoint();
		if ( ! endpoint ) {
			return [];
		}

		const { endpoints: subEndpoints } = endpoint;
		if ( ! subEndpoints ) {
			return [];
		}

		return( filter(
				subEndpoints,
				( { methods } ) => methods.includes( endpointMethod ) )
		)?.[ 0 ]?.args;
	};

	// Clean selected endpoint.
	const cleanSelectedEndpoint = () => {
		setAttributes( { endpointId: null } );
		setValue( null );
		setEndpointValue( null );
		setResponse( null );
		setMethod( null );
		cleanEndpointParams();
		// Hack to focus block once it clears.
		setTimeout( () => {
			if ( endpointRef?.current ) {
				endpointRef.current.focus();
			}
		}, 0 );
	};

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
				{ endpointId && (
					<Panel>
						<PanelBody title={ __( 'Endpoint' ) }>
							<div>{ endpointId }</div>
							<div>{ endpointMethod }</div>

							<ToggleControl
								label= { __( 'Populate arguments from response', 'dev-blocks' ) }
								onChange={ setPopulateArguments }
								checked={ populateArguments }
							/>
						</PanelBody>

						<PanelBody title={ __( 'Arguments', 'dev-blocks' ) }>
							{ map( getEndpointArguments(), ( arg, name ) => (
								<div
									key={ `arg-${ name }` }
									className={ `${ className }_argument-${ name } ${ className }_argument` }
								>
									<label><strong>{ name }</strong></label>
									<TextControl
										placeholder={ name }
										onChange={ ( value ) => setArgument( { [ name ]: value } ) }
										value={ populateArguments[ name ] }
									/>
									<div>
										{ arg.description }
									</div>
									<div>
										<label>
											required: { arg.required ? <span>TRUE</span> : <span>FALSE</span> }
										</label>
									</div>
									<div>
										<label>
											type: { arg.type }
										</label>
									</div>
								</div>
							) ) }
						</PanelBody>
					</Panel>
				) }
			</InspectorControls>
			<div className={ className }>
				{ ! endpointId && (
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
				) }

				{ endpointId && (
					<EndpointInput
						id={ endpointId }
						value={ endpointValue }
						method={ endpointMethod }
						methods={ getEndpointMethods() }
						onClear={ cleanSelectedEndpoint }
						wasRequested={ !! response }
						onMethodChange={ setMethod }
						params={ endpointParams }
						onParamChange={ setParam }
						onRequest={ ( end ) => {
							const endpoint = `${ namespace }${ end }`;
							setEndpointValue( endpoint );
							requestEndpoint( {
								path: endpoint,
								method: endpointMethod,
								endpointArguments,
							} )
								.then( data => {
									setIsErrorResponse( false );
									setResponse( data );
								} )
								.catch( error => {
									setIsErrorResponse( true );
									setResponse( error );
								} )
						} }
					/>
				) }
			</div>
		</Fragment>
	);
}
