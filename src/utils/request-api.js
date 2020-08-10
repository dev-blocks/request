
/**
 * External dependencies
 */
import { values, mapValues, map, filter, difference } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

function covertEndpointDefinitionToId( def, path ) {
	return ( def.substr( path.length ) ).replace(
		/\(\?P<([a-zA-Z_-]+)>(.[^)]+)\)/g,
		( match, attr, group ) => {
			let attrString = `<${ attr }>`;
			// There are endpoint wi
			const groupWithOnlyOneOption = ! ( /[\[|+]/g.test ( group ) );
			if ( groupWithOnlyOneOption ) {
				attrString = `<${ attr }=${ group }>`;
			}
			return attrString;
		} );
}

export const requestEndpoints = async ( { path = '/wp/v2',  filterMethods = [] } ) => {
	return await apiFetch( {
		path,
	} ).then( ( result ) => {
		const { namespaces, routes } = result;

		if ( namespaces ) {
			return map( namespaces, n => `/${ n }` );
		}

		if ( routes ) {
			return filter( values( mapValues(
				routes, ( item, endpoint ) => {
					return {
						... item,
						id: covertEndpointDefinitionToId( endpoint, path ),
						def: endpoint,
					};
				} )
			), ( { id, methods } ) => (
				!! id && !! difference( methods, filterMethods ).length
			) );
		}

		return [];
	} );
};

export const requestNamespaces = requestEndpoints( { path: '/' } )
	.then( namespaces => map( namespaces, namespace =>
		( { label: namespace, value: namespace } )
	) )
	.catch( console.error );


export const requestEndpoint = async ( { path, method, endpointArgumentValues } ) => {
	const requestProps = { path, method };
	if ( endpointArgumentValues && Object.keys( endpointArgumentValues ).length ) {
		if ( method !== 'GET' ) {
			requestProps.data = endpointArgumentValues;
		} else {
			requestProps.path = addQueryArgs( requestProps.path, endpointArgumentValues );
		}
	}
	return await apiFetch( requestProps );
};
