<?php
/**
 * Plugin Name:     Request
 * Description:     Request from your client to the moon, with a Gutenberg block.
 * Version:         0.0.1
 * Author:          Damian Suarez (@retrofox)
 * License:         GPL-2.0-or-later
 * License URI:     https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:     dev-blocks
 *
 * @package         dev-blocks
 */

/**
 * Registers all block assets so that they can be enqueued through the block editor
 * in the corresponding context.
 *
 * @see https://developer.wordpress.org/block-editor/tutorials/block-tutorial/applying-styles-with-stylesheets/
 */

function dev_blocks_request_block_init() {
	$dir = dirname( __FILE__ );

	$script_asset_path = "$dir/build/index.asset.php";
	if ( ! file_exists( $script_asset_path ) ) {
		throw new Error(
			'You need to run `npm start` or `npm run build` for the "dev-blocks/request" block first.'
		);
	}
	$index_js     = 'build/index.js';
	$script_asset = require( $script_asset_path );
	wp_register_script(
		'dev-blocks-request-block-editor',
		plugins_url( $index_js, __FILE__ ),
		$script_asset['dependencies'],
		$script_asset['version']
	);

	$editor_css = 'build/index.css';
	wp_register_style(
		'dev-blocks-request-block-editor',
		plugins_url( $editor_css, __FILE__ ),
		array(),
		filemtime( "$dir/$editor_css" )
	);

	$style_css = 'build/style-index.css';
	wp_register_style(
		'dev-blocks-request-block',
		plugins_url( $style_css, __FILE__ ),
		array(),
		filemtime( "$dir/$style_css" )
	);

	register_block_type( 'dev-blocks/request', array(
		'editor_script' => 'dev-blocks-request-block-editor',
		'editor_style'  => 'dev-blocks-request-block-editor',
		'style'         => 'dev-blocks-request-block',
	) );
}
add_action( 'init', 'dev_blocks_request_block_init' );


/**
 * Register dev-blocks category
 *
 * @param array $categories Current block categories.
 * @param array  post Post.
 * @return array Extended block categories array.
 */
function register_dev_blocks_function( $categories, $post ) {
	return array_merge(
		$categories,
		array(
			array(
				'slug' => 'dev-blocks',
				'title' => __( 'Development Blocks', 'dev-blocks' ),
			),
		)
	);
}
add_filter( 'block_categories', 'register_dev_blocks_function', 10, 2 );

/**
 * Register dev-blocks endpoints
 */
require_once 'class-dev-blocks-endpoints.php';
add_action( 'rest_api_init', function () {
	$controler = new Slug_Custom_Route;
	$controler->register_routes();
} );
