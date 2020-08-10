
/**
 * External dependencies
 */
import { map, values, filter, reduce, keys, mapValues } from 'lodash';
import classNames from 'classnames';
import JSONTree from 'react-json-tree';

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
import { monokai } from './utils/json-tree-themes';

import './editor.scss';

const argumentsReducer = ( currentState, newState ) => {
	if ( newState === 'clean' ) {
		return {};
	}

	return {
		...currentState,
		...newState,
	};
}

export default function RequestEdit( { className, attributes, setAttributes } ) {
	// State.
	const [ placeholder, setPlaceholder ] = useState( __( 'Type / to show available endpoints', 'dev-blocks' ) );
	const [ endpoints, storeEndpoints ] = useState( [] );
	const [ namespaces, storeNamespaces ] = useState( [] );
	const [ filterMethods, setFilterMethods ] = useState( METHODS );
	const [ populateArguments, setPopulateArguments ] = useState( false );
	const [ isRequesting, setIsRequesting ] = useState( false );
	const [ response, setResponse ] = useState( null );
	const [ isErrorResponse, setIsErrorResponse ] = useState( null );
	const [ invertTheme, setInvertTheme ] = useState( false );

	const [ endpointArgumentValues, setArgumentValue ] = useReducer( argumentsReducer, {} );

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
	const endpointEditRef = useRef();

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
			.then( storeEndpoints )
			.catch( console.error );
	}, [ namespace, filterMethods ] );

	useEffect( () => {
		// Populate args values reducer if it isn't populated yet.
		if ( ! Object.keys( endpointArgumentValues ).length ) {
			setArgumentValue( mapValues( response, () => undefined ) );
		}
	}, [ response ] );

	/*
	 * Populate arguments from endpoint response
	 * to the block inspector.
	 */
	useEffect( () => {
		if ( ! response || ! populateArguments ) {
			return;
		}

		setArgumentValue(
			reduce( keys( getEndpointArguments() ), ( acc, part ) => ( {
				...acc,
				[ part ]: response[ part ],
			} ), {} )
		);
	}, [ response ] );


	const methodFilterHandler = useCallback( ( method, name ) => ( value ) => {
		setFilterMethods( {
			...filterMethods,
			[ name ]: {
				...method,
				enabled: value,
			},
		} );
	} );

	// Response styles.
	useEffect( () => {
	    setInvertTheme( /is-style-light/.test( className ) );

		// Hack: Remove background color from Json tree. Super hack.
		if ( ! endpointEditRef?.current?.children?.[ 0 ] ) {
			return;
		}

		setTimeout( () => {
			endpointEditRef.current.children[ 0 ].style.backgroundColor = 'inherit';
		}, 0 );

	}, [ response, className ] );

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

	/**
	 * Pick up arguments from the current endpoint,
	 * and combine the object with the arguments values reducer.
	 *
	 * @return {object} Arguments object, organized by argument name.
	 */
	const getEndpointArguments = () => {
		const endpoint = getEndpoint();
		if ( ! endpoint ) {
			return [];
		}

		const { endpoints: subEndpoints } = endpoint;
		if ( ! subEndpoints ) {
			return [];
		}

		return mapValues(
			( filter( subEndpoints, ( { methods } ) => methods.includes( endpointMethod ) ))?.[ 0 ]?.args,
			( arg, name ) => {
				return endpointArgumentValues?.[ name ]
					? { ...arg, value: endpointArgumentValues[ name ] }
					: arg
				}
			);
	};

	// Clean selected endpoint.
	const cleanSelectedEndpoint = () => {
		setAttributes( { endpointId: null } );
		setValue( null );
		setEndpointValue( null );
		setResponse( null );
		setMethod( null );
		cleanEndpointParams();

		setArgumentValue( 'clean' );

		// Hack to focus block once it clears.
		setTimeout( () => {
			if ( endpointRef?.current ) {
				endpointRef.current.focus();
			}
		}, 0 );
	};

	const baseCSSClass = 'wp-block-dev-blocks-request';

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
							<div className={ `${ baseCSSClass }__methods_filter` }>
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
							<div className={ `${ baseCSSClass }__endpoint-label` }>
								<span
									className={ classNames( `${ baseCSSClass }__endpoint-method-label`, {
										[ `is-${ ( endpointMethod || '' ).toLowerCase() }` ]: !! endpointMethod,
									} ) }
								>
									{ endpointMethod }
								</span>
								<span className={ `${ baseCSSClass }__endpoint-id-label` }>{ endpointId }</span>
							</div>

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
									className={ `${ baseCSSClass }_argument-${ name } ${ baseCSSClass }_argument` }
								>
									<label><strong>{ name }</strong></label>
									<TextControl
										placeholder={ name }
										onChange={ ( value ) => setArgumentValue( { [ name ]: value } ) }
										value={ endpointArgumentValues[ name ] }
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
						isRequesting={ isRequesting }
						onMethodChange={ setMethod }
						params={ endpointParams }
						onParamChange={ setParam }
						onRequest={ ( end ) => {
							const endpoint = `${ namespace }${ end }`;
							setEndpointValue( endpoint );
							setIsRequesting( true );
							requestEndpoint( {
								path: endpoint,
								method: endpointMethod,
								endpointArgumentValues,
							} )
								.then( data => {
									setIsErrorResponse( false );
									setIsRequesting( false );
									setResponse( data );
								} )
								.catch( error => {
									setIsErrorResponse( true );
									setIsRequesting( false );
									setResponse( error );
								} )
						} }
					/>
				) }
			</div>

			<div
				className={ classNames( className, `${ baseCSSClass }__endpoint-response`, {
					'is-error-response': isErrorResponse,
					'has-response': !! response,
					'is-requesting': isRequesting,
				} ) }
				ref={ endpointEditRef }
			>
				{ ( response ) && (
					<JSONTree
						data={ response }
						invertTheme={ invertTheme }
						theme={ monokai }
					/>
				) }
			</div>
		</Fragment>
	);
}
