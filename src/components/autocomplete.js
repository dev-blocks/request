
/**
 * External dependencies
 */
import { noop, map } from 'lodash';

export const endpointsAutocompleter = ( {
    onEndpointSelect = noop,
    options,
} ) => ( {
	name: 'endpoints',
	className: 'autocomplete-endpoint',
	triggerPrefix: '/',
	options,
	getOptionLabel: ( { id, methods } ) => {
		const parts = ( id.substr( 1 ) ).split( /\//g );
		const endpointLabel = map( parts, part => (
			<span key={ `${ id }-${ part }`}>/{
				part.includes( '<' )
					? <strong>{ part }</strong>
					: <span>{ part }</span>
			}</span>
		) );
		return (
			<>
				<label className="endpoint-id">
					{ endpointLabel }
				</label>
				{ map( methods, method => (
					<span
						key={ `${ id }-${ method.toLowerCase() }` }
						className={ `endpoint-method is-${ method.toLowerCase() }` }>{ method }</span>
				) ) }
			</>
		);
	},

	getOptionKeywords: ( { id } ) => [ id ],

	getOptionCompletion: ( endpoint ) => {
		const { id } = endpoint;
		onEndpointSelect( endpoint );
		return <span title={ id }>{ id }</span>;
	},
} );
