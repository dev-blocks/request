export default {
	value: {
		type: 'string',
	},
	namespace: {
		type: 'string',
		default: '/wp/v2',
	},
	endpointMethod: {
		type: 'string',
	},
	endpointValue: {
		type: 'string',
	},
	endpointParams: {
		type: 'object',
		default: {},
	},
	endpointId: {
		type: 'string',
	},
};
