/**
 * External dependencies
 */
import { map, reduce } from 'lodash';
import AutosizeInput from 'react-input-autosize';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { Button, Dropdown, NavigableMenu, MenuItem, MenuGroup } from '@wordpress/components';

const DropdownMethods = ( { className, current, methods, onSelect } ) => (
	<Dropdown
		className={ `${ className }__methods` }
		contentClassName={ `${ className }__methods-content` }
		position="top left"
		renderToggle={ ( { isOpen, onToggle } ) => {
			return (
				<Button
					className={ classNames(
						'endpoint-method',
						current ? `is-${ current.toLowerCase() }` : null,
					) }
					onClick={ onToggle }
					aria-expanded={ isOpen }
				>
					{ current }
				</Button>
			)
		} }
		renderContent={ ( { onClose } ) => (
			<NavigableMenu>
				<MenuGroup>
					{ map( methods, method => (
						<MenuItem
							className={ classNames(
								'endpoint-method',
								`is-${ method.toLowerCase() }`, {
									'is-selected': method === current,
								}
							) }
							key={ `${ method.toLowerCase() }-key`}
							isSelected={ method === current }
							onClick={ () => {
								onClose();
								onSelect( method )
							} }
						>
							{ method }
						</MenuItem>
					) ) }
				</MenuGroup>
			</NavigableMenu>
		) }
	/>
);

const EndpointParamEdit = ( { name, value = '', placeholder = '', onChange } ) => {
	return (
		<div className="request__endpoint-input__param">
			<span className="request__endpoint-input__slash">/</span>
			<AutosizeInput
				key={ placeholder }
				id={ name }
				name={ name }
				onChange={ ( { target } ) => onChange( target?.value ) }
				placeholder={ placeholder }
				value={ value }
				onFocus={ ( { target } ) => target.select() }
			/>
		</div>
	);
};

export default function EndpointInput( {
	id,
	onParamChange,
	params,
	onClear,
	onRequest,
	isRequesting,
	wasRequested = false,
	className = 'request__endpoint-input',
	methods = [],
	method,
	onMethodChange,
} ) {
	const formRef = useRef();

	useEffect( () => {
		if ( ! formRef?.current ) {
			return;
		}

		const { current: formEl } = formRef;

		// focus first element when mounted.
		if ( formEl?.elements?.length ) {
			formEl.elements[ 0 ].focus();
		}
	}, [ formRef ] );

	const submitForm = ( event ) => {
		event.preventDefault();
	};

	// Split up the endpoint id and pick up params,
	// divided by label (static) and param (dynamic).
	let parts = ( id.substr( 1 ) ).split( /\//g );
	let fieldName = '';
	const endpointComponent = map( parts, ( part, i ) => {
		const isEndpointParam = part.includes( '<' );
		const paramKey = `param-${ i }`;

		if ( ! isEndpointParam ) {
			fieldName = `endpoint-${ part }-param`;
			return (
				<label key={ paramKey } htmlFor={ fieldName }>
					<span className={ `${ className }__slash` }>/</span>
					{ part }
				</label>
			);
		}

		const paramName = part.replace( /[<>]/ig, '' );

		return (
			<EndpointParamEdit
				key={ `endpoint-${ part }-param` }
				name={ fieldName }
				placeholder={ part }
				value={ params?.[ paramName ] }
				onChange={ ( value ) => onParamChange( paramName, value ) }
			/>
		);
	} );

	const submitHandler = ( ev ) => {
		ev.preventDefault();
		const { elements } = formRef.current;
		const endpoint = reduce ( parts, ( acc, part, n ) =>{
				const inputValue = elements?.[ `endpoint-${ parts[ n -1 ] }-param` ]?.value;
				return acc + ( '/' + ( /</.test( part ) ? inputValue : part ) );
			}
			, '' );
		onRequest( endpoint );
	};

	const requestIcon = isRequesting ? 'update' : 'controls-play';

	return (
		<form
			ref={ formRef }
			onSubmit={ submitHandler }
			className={ classNames( className, {
				'is-requesting': isRequesting,
			} ) }
		>
			<div className={ `${ className }__methods`} >
				<DropdownMethods
					className={ className }
					current={ method }
					methods={ methods }
					onSelect={ onMethodChange }
				/>
			</div>

			{ endpointComponent }

			<Button
				className={ `${ className }_submit-button` }
				type="submit"
				icon={ requestIcon }
				isPrimary={ true }
			/>
			<Button
				className={ `${ className }_clean-button` }
				type="clean"
				onClick={ onClear }
				icon="dismiss"
			/>
		</form>
	)
};
