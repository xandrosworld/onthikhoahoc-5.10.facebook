import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PHP } from "@php-wasm/universal";
import { loadNodeRuntime } from "@php-wasm/node";
const php = new PHP(
  await loadNodeRuntime("8.3", { emscriptenOptions: { processId: 2 } }),
);
php.mkdir("/wp/wp-admin/includes");
php.mkdir("/wp/plugins/woocommerce-paypal-payments");
php.writeFile("/wp/wp-admin/includes/file.php", "<?php");
php.writeFile(
  "/retirement.php",
  await fs.readFile("sonclass/includes/deployment.php", "utf8"),
);
const r = await php.run({
  code: `<?php
define('ABSPATH','/wp/');define('WP_PLUGIN_DIR','/wp/plugins');
$options=['active_plugins'=>['sonclass/sonclass.php']];$deleted_options=[];
function current_user_can($cap){return true;}
function get_option($k,$default=false){global $options;return $options[$k] ?? $default;}
function update_option($k,$v,$autoload=null){global $options;$options[$k]=$v;}
function delete_option($k){global $deleted_options;$deleted_options[]=$k;}
function sc_fail($message,$status=400){return ['error'=>$message,'status'=>$status];}
function WP_Filesystem(){return true;}
function wp_clean_plugins_cache(){}
$wpdb=new class {public $prefix='wp_';public $options='wp_options';public $queries=[];function get_col($q){return $q==='SHOW TABLES'?['wp_users','wp_options','wp_sc_entities','wp_sc_attempts','wp_learnpress_order_items','wp_mlw_quizzes','other_wc_orders','wp_unrelated_orders']:['sc_settings','siteurl','woocommerce_currency','unrelated_setting'];}function query($q){$this->queries[]=$q;return 1;}};
$wp_filesystem=new class {public $deleted=[];function delete($path,$recursive,$type){$this->deleted[]=$path;return true;}};
require '/retirement.php';
$inventory=sc_legacy_storage();$done=sc_retire_storage();$again=sc_retire_storage();
echo json_encode(['inventory'=>$inventory,'done'=>$done,'again'=>$again,'queries'=>$wpdb->queries,'paths'=>$wp_filesystem->deleted,'options'=>$deleted_options]);`,
});
assert.equal(r.errors, "");
const result = JSON.parse(r.text);
assert.deepEqual(result.inventory.tables, [
  "wp_learnpress_order_items",
  "wp_mlw_quizzes",
]);
assert.deepEqual(result.queries, [
  "DROP TABLE IF EXISTS `wp_learnpress_order_items`",
  "DROP TABLE IF EXISTS `wp_mlw_quizzes`",
]);
assert.deepEqual(result.paths, ["/wp/plugins/woocommerce-paypal-payments"]);
assert.deepEqual(result.options, ["woocommerce_currency"]);
assert.equal(result.again.status, 409);
php.exit();
console.log(
  "Retirement scope passed: preserves core, SonClass and unrelated tables/options; exact plugin folder; one-time guard.",
);
