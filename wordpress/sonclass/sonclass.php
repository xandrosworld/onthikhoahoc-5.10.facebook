<?php
/**
 * Plugin Name: SonClass — Học Toán & Luyện thi
 * Description: Khóa học, soạn đề LaTeX, thi trực tuyến và chấm điểm. Bản chuyển đổi từ ứng dụng Next.js.
 * Version: 1.1.3
 * Requires PHP: 8.1
 * License: GPL-2.0-or-later
 */
defined('ABSPATH') || exit;
define('SONCLASS_FILE', __FILE__);
require_once __DIR__ . '/includes/domain.php';
require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/deployment.php';

function sc_install() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset = $wpdb->get_charset_collate();
    dbDelta("CREATE TABLE {$wpdb->prefix}sc_entities (
        id varchar(36) NOT NULL,
        kind varchar(20) NOT NULL,
        slug varchar(190) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'DRAFT',
        data longtext NOT NULL,
        created_at datetime NOT NULL,
        updated_at datetime NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY kind_slug (kind,slug)
    ) ENGINE=InnoDB $charset;");
    dbDelta("CREATE TABLE {$wpdb->prefix}sc_attempts (
        id varchar(36) NOT NULL,
        exam_id varchar(36) NOT NULL,
        user_id bigint(20) unsigned NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'IN_PROGRESS',
        started bigint(20) NOT NULL,
        deadline bigint(20) NOT NULL,
        submitted bigint(20) DEFAULT NULL,
        snapshot longtext NOT NULL,
        answers longtext NOT NULL,
        result longtext DEFAULT NULL,
        PRIMARY KEY  (id),
        KEY user_exam (user_id,exam_id),
        KEY status_deadline (status,deadline)
    ) ENGINE=InnoDB $charset;");
    add_option('sc_settings', ['siteName'=>'SonClass','tagline'=>'Học Toán & Luyện thi','hotline'=>'','email'=>'','address'=>'','openHours'=>'','facebook'=>'','zalo'=>'']);
    update_option('sc_version', '1.1.3', false);
    // Freeze the legacy boundary once. New SonClass uploads are never part of cleanup.
    add_option('sc_legacy_post_boundary', (int)$wpdb->get_var("SELECT MAX(ID) FROM {$wpdb->posts}"));
}
register_activation_hook(__FILE__, 'sc_install');
add_action('rest_api_init', 'sc_routes');
add_action('admin_menu', function() {
    add_menu_page('SonClass', 'SonClass', 'manage_options', 'sonclass', function() {
        sc_deployment_page();
    }, 'dashicons-welcome-learn-more', 3);
});

// The preview is restricted to administrators. Activation alone does not replace the old site.
add_action('template_redirect', function() {
    if (is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) return;
    $preview = isset($_GET['sonclass_preview']);
    if (!$preview && !get_option('sc_live')) return;
    if ($preview && !current_user_can('manage_options')) { auth_redirect(); exit; }
    status_header(200);
    nocache_headers();
    header('X-Content-Type-Options: nosniff');
    $asset = plugins_url('assets/', SONCLASS_FILE);
    $settings = get_option('sc_settings', []);
    $boot = ['api'=>rest_url('sonclass/v1/'),'nonce'=>wp_create_nonce('wp_rest'),'user'=>sc_current_user(),'settings'=>$settings,'assets'=>$asset,'preview'=>$preview,'live'=>(bool)get_option('sc_live'),'loginUrl'=>wp_login_url(),'resetUrl'=>wp_lostpassword_url()];
    ?><!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#22308f"><title><?php echo esc_html($settings['siteName'] ?? 'SonClass'); ?> — Học Toán & Luyện thi</title><meta name="description" content="Học Toán 10, 11, 12, luyện đề trực tuyến và xem lời giải từng câu."><link rel="icon" type="image/png" href="<?php echo esc_url($asset . 'images/sonclass-logo.png'); ?>"><link rel="apple-touch-icon" href="<?php echo esc_url($asset . 'images/sonclass-logo.png'); ?>"><link rel="stylesheet" href="<?php echo esc_url($asset . 'app.css?v=1.1.3'); ?>"></head><body><div id="root"></div><noscript>Vui lòng bật JavaScript để sử dụng hệ thống luyện thi.</noscript><script>window.SONCLASS=<?php echo wp_json_encode($boot, JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT); ?>;</script><script src="<?php echo esc_url($asset . 'app.js?v=1.1.3'); ?>" defer></script></body></html><?php
    exit;
}, -100);
