<?php
defined('ABSPATH') || exit;

function sc_legacy_storage() {
    global $wpdb;
    $tables=[];
    foreach($wpdb->get_col('SHOW TABLES') as $name) {
        if (!str_starts_with($name,$wpdb->prefix)) continue;
        $suffix=substr($name,strlen($wpdb->prefix));
        if (preg_match('/^(woocommerce_|wc_|actionscheduler_|learnpress_|mlw_|qsm_|frmt_|forminator_)[a-zA-Z0-9_]+$/D',$suffix)) $tables[]=$name;
    }
    $remaining=is_dir(WP_PLUGIN_DIR.'/woocommerce-paypal-payments');
    return ['tables'=>$tables,'paypalFiles'=>$remaining,'completed'=>(bool)get_option('sc_storage_retired')];
}
function sc_retire_storage() {
    global $wpdb;
    if (!current_user_can('manage_options')) return sc_fail('Không có quyền.',403);
    if (get_option('sc_storage_retired')) return sc_fail('Việc dọn dữ liệu cũ đã hoàn tất.',409);
    // Only the inspected legacy installation; never accept table names or filesystem paths from a request.
    $known=['woocommerce','woocommerce-paypal-payments','learnpress','quiz-master-next','forminator'];
    foreach(get_option('active_plugins',[]) as $active) if(in_array(explode('/',$active)[0],$known,true)) return sc_fail('Tắt plugin cũ trước khi dọn dữ liệu.');
    $inventory=sc_legacy_storage();
    if ($inventory['paypalFiles']) {
        require_once ABSPATH.'wp-admin/includes/file.php';
        if (!WP_Filesystem()) return sc_fail('Không truy cập được thư mục plugin.',500);
        global $wp_filesystem;
        $base=realpath(WP_PLUGIN_DIR); $target=realpath(WP_PLUGIN_DIR.'/woocommerce-paypal-payments');
        if (!$base || !$target || dirname($target)!==$base || basename($target)!=='woocommerce-paypal-payments' || is_link(WP_PLUGIN_DIR.'/woocommerce-paypal-payments')) return sc_fail('Đường dẫn plugin không hợp lệ.',500);
        if (!$wp_filesystem->delete($target,true,'d')) return sc_fail('Không xóa được plugin PayPal cũ.',500);
        wp_clean_plugins_cache();
    }
    foreach($inventory['tables'] as $table) {
        if (!preg_match('/^[a-zA-Z0-9_]+$/D',$table)) return sc_fail('Tên bảng không hợp lệ.',500);
        if ($wpdb->query("DROP TABLE IF EXISTS `$table`")===false) return sc_fail('Không dọn được bảng cũ.',500);
    }
    foreach($wpdb->get_col("SELECT option_name FROM {$wpdb->options}") as $name) {
        if(preg_match('/^(woocommerce_|woocommerce-paypal|woocommerce_ppcp_|ppcp-|learn_press_|learnpress_|qmn_|qsm_|mlw_quiz|forminator_|frmt_|elementor_|elementor-)/',$name)) delete_option($name);
    }
    update_option('sc_storage_retired',1,false);
    return ['ok'=>true,'remaining'=>sc_legacy_storage()];
}

function sc_legacy_ids($limit=50) {
    global $wpdb;
    $boundary=(int)get_option('sc_legacy_post_boundary',0);
    return $wpdb->get_col($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE ID<=%d AND ID NOT IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key='sc_upload') ORDER BY ID DESC LIMIT %d",$boundary,$limit));
}
function sc_deployment_page() {
    if (!current_user_can('manage_options')) return;
    $notice='';
    if ($_SERVER['REQUEST_METHOD']==='POST') {
        check_admin_referer('sc_deployment');
        $action=sanitize_key($_POST['sc_action'] ?? '');
        if ($action==='publish') {
            if (!is_file(__DIR__.'/../assets/app.js')) wp_die('Chưa có tài nguyên ứng dụng.');
            update_option('sc_live',1,false);
            update_option('blogname',get_option('sc_settings',[])['siteName'] ?? 'SonClass');
            $notice='Đã bật website SonClass mới.';
        }
        if ($action==='clean_legacy' && get_option('sc_live')) {
            $deleted=0;
            foreach(sc_legacy_ids() as $id) {
                $result=get_post_type($id)==='attachment'?wp_delete_attachment($id,true):wp_delete_post($id,true);
                if ($result) $deleted++;
            }
            $notice="Đã xóa vĩnh viễn $deleted nội dung cũ.";
            if (!sc_legacy_ids(1)) update_option('sc_legacy_cleanup_completed',1,false);
        }
    }
    $remaining=count(sc_legacy_ids(100000));
    echo '<div class="wrap"><h1>SonClass</h1>';
    if($notice) echo '<div class="notice notice-success"><p>'.esc_html($notice).'</p></div>';
    echo '<p>Trạng thái: <strong>'.(get_option('sc_live')?'Website mới đang hoạt động':'Bản xem trước').'</strong></p>';
    echo '<p><a class="button button-primary" href="'.esc_url(home_url('/?sonclass_preview=1&sc_path=/admin')).'">Mở quản trị SonClass</a> <a class="button" href="'.esc_url(home_url('/?sonclass_preview=1')).'">Xem trước trang chủ</a></p>';
    echo '<form method="post">'; wp_nonce_field('sc_deployment');
    if(!get_option('sc_live')) echo '<p><button class="button button-primary" name="sc_action" value="publish">Đưa website SonClass mới lên chính thức</button></p>';
    if(get_option('sc_live') && $remaining) echo '<h2>Dọn website cũ</h2><p>Còn '.esc_html($remaining).' bài viết, trang, nội dung khóa học hoặc tệp cũ. Mỗi lần xử lý tối đa 50 nội dung. Xóa vĩnh viễn, không sao lưu. Nội dung SonClass mới và tài khoản quản trị được giữ lại.</p><button class="button" name="sc_action" value="clean_legacy">Xóa vĩnh viễn nội dung website cũ</button>';
    if(get_option('sc_legacy_cleanup_completed')) echo '<p>Đã dọn xong nội dung WordPress cũ.</p>';
    echo '</form></div>';
}
