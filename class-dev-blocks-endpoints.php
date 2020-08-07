<?php
	class Slug_Custom_Route extends WP_REST_Controller {
	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		$version = '1';
		$namespace = 'dev-blocks/v' . $version;
		$base = 'info';
		register_rest_route( $namespace, '/' . $base, array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_info' ),
			),
		) );
	}

	/**
	 * Get plugin info.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_info( $request ) {
		return new WP_REST_Response( array(
			'version' => '0.0.1',
			'name'    => 'Request',
			'description' => __( 'Request from your client to the moon, with a Gutenberg block.', 'dev-blocks' ),
		), 200 );
	}
}
