<?php
defined('ABSPATH') || exit;
function sc_fail($message, $status=400) { return new WP_Error('sonclass_error',$message,['status'=>$status]); }
function sc_current_user() {
    $u=wp_get_current_user(); if (!$u->ID) return null;
    $admin=user_can($u,'manage_options');
    if (!$admin && (!get_user_meta($u->ID,'sc_member',true) || get_user_meta($u->ID,'sc_locked',true))) return null;
    return ['id'=>$u->ID,'email'=>$u->user_email,'fullName'=>$u->display_name,'role'=>$admin?'ADMIN':'STUDENT','phone'=>get_user_meta($u->ID,'sc_phone',true),'grade'=>get_user_meta($u->ID,'sc_grade',true),'school'=>get_user_meta($u->ID,'sc_school',true)];
}
function sc_permission($r) {
    $path=substr($r->get_route(),strlen('/sonclass/v1/')); $method=$r->get_method();
    if (str_starts_with($path,'admin/') && !current_user_can('manage_options')) return sc_fail('Bạn không có quyền quản trị.',403);
    if ((str_starts_with($path,'attempts') || $path==='me') && !sc_current_user()) return sc_fail('Vui lòng đăng nhập.',401);
    if ($method!=='GET' && !wp_verify_nonce($r->get_header('X-WP-Nonce'),'wp_rest')) return sc_fail('Phiên làm việc hết hạn. Tải lại trang.',403);
    return true;
}
function sc_routes() {
    register_rest_route('sonclass/v1','/(?P<path>[a-zA-Z0-9_/-]+)',['methods'=>['GET','POST','DELETE'],'permission_callback'=>'sc_permission','callback'=>function($r) {
        try { return sc_dispatch($r); }
        catch (InvalidArgumentException $e) { return sc_fail($e->getMessage()); }
        catch (Throwable $e) { error_log('SonClass: '.$e->getMessage()); return sc_fail('Không thể hoàn tất thao tác. Vui lòng thử lại.',500); }
    }]);
}
function sc_decode($r) { $v=json_decode($r['data'],true); return array_merge($v ?: [],['id'=>$r['id'],'slug'=>$r['slug'],'status'=>$r['status'],'createdAt'=>$r['created_at'],'updatedAt'=>$r['updated_at']]); }
function sc_entity($kind,$id,$published=false) {
    global $wpdb; $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}sc_entities WHERE kind=%s AND (id=%s OR slug=%s)",$kind,$id,$id),ARRAY_A);
    return $row && (!$published || $row['status']==='PUBLISHED')?sc_decode($row):null;
}
function sc_list($kind,$admin=false) {
    global $wpdb;
    $sql=$wpdb->prepare("SELECT * FROM {$wpdb->prefix}sc_entities WHERE kind=%s",$kind);
    if (!$admin) $sql.=" AND status='PUBLISHED'";
    return array_map('sc_decode',$wpdb->get_results($sql.' ORDER BY created_at DESC',ARRAY_A));
}
function sc_exam_public($e) {
    $out=array_intersect_key($e,array_flip(['id','title','description','grade','durationMinutes','shuffleQuestions','template','createdAt'])); $out['sections']=[];
    foreach (sc_types($e['template']) as $type) { $max=0; $qs=$e['sections'][$type] ?? []; foreach($qs as $q) $max+=(float)($q['points'] ?? $e['sectionSettings'][$type]['pointsPerQuestion']); $out['sections'][]=['type'=>$type,'_count'=>['questions'=>count($qs)],'maxPoints'=>$max]; }
    return $out;
}
function sc_save_entity($kind,$data) {
    global $wpdb;
    if (!in_array($kind,['exams','courses','posts','registrations'],true)) throw new InvalidArgumentException('Loại nội dung không hợp lệ.');
    if (!is_array($data) || strlen(wp_json_encode($data))>1500000) throw new InvalidArgumentException('Nội dung quá lớn.');
    $id=$data['id'] ?? ''; $existing=$id?sc_entity($kind,$id):null;
    if ($id && !$existing) throw new InvalidArgumentException('Nội dung không tồn tại.');
    $id=$id ?: wp_generate_uuid4();
    if ($kind==='exams') { if ($error=sc_validate_exam($data)) throw new InvalidArgumentException($error); }
    elseif ($kind!=='registrations' && trim($data['title'] ?? '') === '') throw new InvalidArgumentException('Nhập tiêu đề.');
    $status=$data['status'] ?? 'DRAFT'; $statuses=$kind==='registrations'?['NEW','CONTACTED','ENROLLED','CANCELLED']:['DRAFT','PUBLISHED'];
    if (!in_array($status,$statuses,true)) throw new InvalidArgumentException('Trạng thái không hợp lệ.');
    $slug=$kind==='registrations'?$id:sanitize_title($data['slug'] ?? ($data['title'] ?? $id)); $slug=$slug ?: $id;
    if (strlen($slug)>180) $slug=substr($id,0,36);
    $duplicate=$wpdb->get_var($wpdb->prepare("SELECT id FROM {$wpdb->prefix}sc_entities WHERE kind=%s AND slug=%s AND id<>%s",$kind,$slug,$id));
    if ($duplicate) throw new InvalidArgumentException('Đường dẫn đã tồn tại. Hãy đổi tên hoặc đường dẫn.');
    unset($data['id'],$data['createdAt'],$data['updatedAt']);
    $row=['kind'=>$kind,'slug'=>$slug,'status'=>$status,'data'=>wp_json_encode($data),'updated_at'=>current_time('mysql',true)];
    if ($existing) $ok=$wpdb->update($wpdb->prefix.'sc_entities',$row,['id'=>$id]);
    else $ok=$wpdb->insert($wpdb->prefix.'sc_entities',array_merge($row,['id'=>$id,'created_at'=>current_time('mysql',true)]));
    if ($ok===false) throw new RuntimeException('Database write failed');
    return ['id'=>$id];
}
function sc_limit($bucket,$max) {
    $key='sc_rate_'.hash('sha256',$bucket.'|'.($_SERVER['REMOTE_ADDR'] ?? 'local'));
    $n=(int)get_transient($key); if ($n>=$max) throw new InvalidArgumentException('Thao tác quá nhiều lần. Vui lòng thử lại sau 15 phút.'); set_transient($key,$n+1,900);
}
function sc_update_profile($id,$p) {
    foreach(['phone','school','grade'] as $k) if (isset($p[$k])) update_user_meta($id,'sc_'.$k,sanitize_text_field($p[$k]));
}
function sc_finish($row) {
    global $wpdb;
    if ($row['status']!=='IN_PROGRESS') return $row;
    $snap=json_decode($row['snapshot'],true); $time=time(); $expired=$time >= (int)$row['deadline'];
    $r=sc_grade($snap['sections'],json_decode($row['answers'],true) ?: [],min($time,(int)$row['deadline'])-(int)$row['started']);
    $patch=['status'=>$expired?'EXPIRED':'SUBMITTED','submitted'=>$time,'result'=>wp_json_encode($r)];
    if ($wpdb->update($wpdb->prefix.'sc_attempts',$patch,['id'=>$row['id']])===false) throw new RuntimeException('Result save failed');
    return array_merge($row,$patch);
}
function sc_attempt_operation($id,$operation,$payload) {
    global $wpdb;
    $wpdb->query('START TRANSACTION');
    try {
        $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}sc_attempts WHERE id=%s FOR UPDATE",$id),ARRAY_A);
        if (!$row || ((int)$row['user_id']!==get_current_user_id() && !current_user_can('manage_options'))) { $wpdb->query('ROLLBACK'); return sc_fail('Không tìm thấy bài làm.',404); }
        if ($operation!=='get' && (int)$row['user_id']!==get_current_user_id()) { $wpdb->query('ROLLBACK'); return sc_fail('Không thể sửa bài làm của học sinh khác.',403); }
        $snap=json_decode($row['snapshot'],true);
        if ($row['status']==='IN_PROGRESS' && time()>=(int)$row['deadline']) $row=sc_finish($row);
        if ($operation==='answers') {
            if ($row['status']!=='IN_PROGRESS') { $wpdb->query('COMMIT'); return sc_fail('Bài đã kết thúc.',409); }
            $patch=sc_clean_answers($snap['sections'],$payload['answers'] ?? []);
            $answers=array_merge(json_decode($row['answers'],true) ?: [],$patch);
            if ($wpdb->update($wpdb->prefix.'sc_attempts',['answers'=>wp_json_encode($answers)],['id'=>$id])===false) throw new RuntimeException('Answer save failed');
            $wpdb->query('COMMIT'); return ['saved'=>true];
        }
        if ($operation==='submit') $row=sc_finish($row);
        $wpdb->query('COMMIT');
        if ($operation==='submit') return ['redirect'=>'/hoc-sinh/ket-qua/'.$id];
        $answers=json_decode($row['answers'],true) ?: (object)[];
        if ($row['status']==='IN_PROGRESS') return ['status'=>$row['status'],'attemptId'=>$id,'title'=>$snap['exam']['title'],'studentName'=>get_userdata($row['user_id'])->display_name,'sections'=>sc_public_sections($snap['sections']),'initialAnswers'=>$answers,'deadline'=>(int)$row['deadline']*1000,'serverNow'=>time()*1000];
        $graded=json_decode($row['result'],true); $result=$graded; $result['breakdown']=wp_json_encode($graded['breakdown']);
        return ['status'=>$row['status'],'attempt'=>['id'=>$id,'exam'=>$snap['exam'],'user'=>['fullName'=>get_userdata($row['user_id'])->display_name],'result'=>$result,'submittedAt'=>gmdate('c',(int)$row['submitted']),'autoSubmitted'=>$row['status']==='EXPIRED'],'sections'=>$snap['sections'],'answers'=>$answers,'graded'=>$graded,'perQuestion'=>$graded['perQuestion']];
    } catch(Throwable $e) { $wpdb->query('ROLLBACK'); throw $e; }
}
function sc_attempt_list($admin=false) {
    global $wpdb;
    $sql="SELECT * FROM {$wpdb->prefix}sc_attempts";
    if (!$admin) $sql.=$wpdb->prepare(' WHERE user_id=%d',get_current_user_id());
    $rows=$wpdb->get_results($sql.' ORDER BY started DESC LIMIT 1000',ARRAY_A); $out=[];
    foreach($rows as $row) {
        if ($row['status']==='IN_PROGRESS' && time()>=(int)$row['deadline']) { sc_attempt_operation($row['id'],'get',[]); $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}sc_attempts WHERE id=%s",$row['id']),ARRAY_A); }
        $snap=json_decode($row['snapshot'],true); $u=get_userdata($row['user_id']);
        $out[]=['id'=>$row['id'],'status'=>$row['status'],'title'=>$snap['exam']['title'],'fullName'=>$u?$u->display_name:'Tài khoản đã xóa','startedAt'=>gmdate('c',(int)$row['started']),'result'=>json_decode($row['result'] ?? 'null',true)];
    }
    return $out;
}
function sc_dispatch($r) {
    global $wpdb;
    $path=trim($r['path'],'/'); $method=$r->get_method(); $p=$r->get_json_params() ?: [];
    if ($path==='admin/legacy-storage') {
        if($method==='GET') return sc_legacy_storage();
        if($method==='POST' && ($p['action'] ?? '')==='RETIRE_LEGACY') return sc_retire_storage();
        return sc_fail('Thao tác không hợp lệ.');
    }
    if ($method==='GET' && $path==='catalog') return ['courses'=>sc_list('courses'),'posts'=>sc_list('posts'),'exams'=>array_map('sc_exam_public',sc_list('exams')),'settings'=>get_option('sc_settings',[])];
    if ($method==='POST' && $path==='auth/login') {
        sc_limit('login',20); $u=wp_signon(['user_login'=>(string)($p['email'] ?? ''),'user_password'=>(string)($p['password'] ?? ''),'remember'=>false],is_ssl());
        if(is_wp_error($u)) return sc_fail('Tài khoản hoặc mật khẩu không đúng.',401);
        wp_set_current_user($u->ID);
        if (!sc_current_user()) { wp_logout(); return sc_fail('Tài khoản chưa được cấp quyền hoặc đã bị khóa.',403); }
        return ['ok'=>true,'role'=>sc_current_user()['role']];
    }
    if ($method==='POST' && $path==='auth/register') {
        sc_limit('register',5); $email=sanitize_email($p['email'] ?? ''); $name=sanitize_text_field($p['fullName'] ?? ''); $pass=$p['password'] ?? '';
        if (!$name || !is_email($email) || strlen($pass)<8 || strlen($pass)>200) return sc_fail('Nhập họ tên, email hợp lệ và mật khẩu từ 8 ký tự.');
        if (email_exists($email)) return sc_fail('Email này đã được sử dụng.');
        $id=wp_insert_user(['user_login'=>'sc_'.str_replace('-','',wp_generate_uuid4()),'user_email'=>$email,'user_pass'=>$pass,'display_name'=>$name,'role'=>'subscriber']);
        if(is_wp_error($id)) return sc_fail('Không tạo được tài khoản.');
        update_user_meta($id,'sc_member',1); sc_update_profile($id,$p); wp_set_current_user($id); wp_set_auth_cookie($id,false,is_ssl()); return ['ok'=>true];
    }
    if ($method==='POST' && $path==='auth/logout') { wp_logout(); return ['ok'=>true]; }
    if ($path==='me') {
        if ($method==='GET') return sc_current_user();
        if ($method==='POST') { $id=get_current_user_id(); $name=sanitize_text_field($p['fullName'] ?? ''); if(!$name) return sc_fail('Nhập họ tên.'); $result=wp_update_user(['ID'=>$id,'display_name'=>$name]); if(is_wp_error($result)) return sc_fail('Không lưu được hồ sơ.'); sc_update_profile($id,$p); return sc_current_user(); }
    }
    if ($method==='POST' && $path==='registrations') {
        sc_limit('registration',10);
        foreach(['fullName','phone','email','currentGrade'] as $key) if(!is_string($p[$key] ?? null) || !trim($p[$key])) return sc_fail('Nhập đầy đủ họ tên, điện thoại, email và lớp.');
        if (!is_email($p['email']) || !preg_match('/^[+0-9 ().-]{8,20}$/D',$p['phone'])) return sc_fail('Email hoặc số điện thoại không hợp lệ.');
        $data=array_intersect_key($p,array_flip(['fullName','phone','email','currentGrade','note','courseId']));
        if(!empty($data['courseId']) && !sc_entity('courses',$data['courseId'],true)) return sc_fail('Khóa học không tồn tại.');
        $data['status']='NEW'; $data['userId']=get_current_user_id(); return sc_save_entity('registrations',$data);
    }
    if ($method==='POST' && $path==='attempts/start') {
        $id=(string)($p['examId'] ?? ''); $wpdb->query('START TRANSACTION');
        try {
            $raw=$wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}sc_entities WHERE id=%s AND kind='exams' AND status='PUBLISHED' FOR UPDATE",$id),ARRAY_A);
            if (!$raw) { $wpdb->query('ROLLBACK'); return sc_fail('Đề thi không tồn tại.',404); }
            $old=$wpdb->get_var($wpdb->prepare("SELECT id FROM {$wpdb->prefix}sc_attempts WHERE exam_id=%s AND user_id=%d AND status='IN_PROGRESS' AND deadline>%d",$id,get_current_user_id(),time()));
            if ($old) { $wpdb->query('COMMIT'); return ['id'=>$old]; }
            $e=sc_decode($raw); $attempt=wp_generate_uuid4(); $now=time(); $snapshot=['exam'=>array_intersect_key($e,array_flip(['id','title','durationMinutes','grade'])),'sections'=>sc_snapshot($e)];
            $ok=$wpdb->insert($wpdb->prefix.'sc_attempts',['id'=>$attempt,'exam_id'=>$id,'user_id'=>get_current_user_id(),'status'=>'IN_PROGRESS','started'=>$now,'deadline'=>$now+(int)$e['durationMinutes']*60,'snapshot'=>wp_json_encode($snapshot),'answers'=>'{}']);
            if(!$ok) throw new RuntimeException('Attempt insert failed'); $wpdb->query('COMMIT'); return ['id'=>$attempt];
        } catch(Throwable $e) { $wpdb->query('ROLLBACK'); throw $e; }
    }
    if ($method==='GET' && $path==='attempts') return sc_attempt_list();
    if (preg_match('#^attempts/([a-zA-Z0-9-]+)(?:/(answers|submit))?$#D',$path,$m)) {
        $op=$m[2] ?? 'get'; if (($op==='get' && $method!=='GET') || ($op!=='get' && $method!=='POST')) return sc_fail('Phương thức không hợp lệ.',405);
        return sc_attempt_operation($m[1],$op,$p);
    }
    if ($path==='admin/settings') {
        if ($method==='GET') return ['settings'=>get_option('sc_settings',[]),'live'=>(bool)get_option('sc_live')];
        if ($method==='POST') { $s=get_option('sc_settings',[]); foreach(array_keys($s) as $k) if(isset($p[$k])) $s[$k]=sanitize_text_field($p[$k]); update_option('sc_settings',$s,false); return ['ok'=>true]; }
    }
    if ($method==='GET' && $path==='admin/attempts') return sc_attempt_list(true);
    if ($method==='GET' && $path==='admin/students') {
        $users=get_users(['meta_key'=>'sc_member','meta_value'=>'1','number'=>1000,'orderby'=>'registered','order'=>'DESC']);
        return array_map(fn($u)=>['id'=>$u->ID,'fullName'=>$u->display_name,'email'=>$u->user_email,'phone'=>get_user_meta($u->ID,'sc_phone',true),'grade'=>get_user_meta($u->ID,'sc_grade',true),'school'=>get_user_meta($u->ID,'sc_school',true),'locked'=>(bool)get_user_meta($u->ID,'sc_locked',true)],$users);
    }
    if ($method==='POST' && preg_match('#^admin/students/(\d+)$#D',$path,$m)) {
        $id=(int)$m[1]; if (user_can($id,'manage_options') || !get_user_meta($id,'sc_member',true)) return sc_fail('Không thể sửa tài khoản này.',403);
        update_user_meta($id,'sc_locked',!empty($p['locked'])?1:0); if (!empty($p['locked'])) WP_Session_Tokens::get_instance($id)->destroy_all(); return ['ok'=>true];
    }
    if ($method==='POST' && $path==='admin/upload') {
        if (empty($_FILES['file'])) return sc_fail('Chọn tệp để tải lên.');
        require_once ABSPATH.'wp-admin/includes/file.php'; require_once ABSPATH.'wp-admin/includes/media.php'; require_once ABSPATH.'wp-admin/includes/image.php';
        $result=wp_handle_upload($_FILES['file'],['test_form'=>false,'mimes'=>['jpg|jpeg'=>'image/jpeg','png'=>'image/png','webp'=>'image/webp','gif'=>'image/gif','pdf'=>'application/pdf','mp4'=>'video/mp4','webm'=>'video/webm']]);
        if(isset($result['error'])) return sc_fail($result['error']);
        $attachment=wp_insert_attachment(['post_title'=>sanitize_file_name($_FILES['file']['name']),'post_mime_type'=>$result['type'],'post_status'=>'inherit'],$result['file']);
        if(is_wp_error($attachment) || !$attachment) return sc_fail('Không tạo được thư viện tệp.',500);
        update_post_meta($attachment,'sc_upload',1); wp_update_attachment_metadata($attachment,wp_generate_attachment_metadata($attachment,$result['file']));
        return ['url'=>$result['url'],'name'=>sanitize_file_name($_FILES['file']['name']),'id'=>$attachment];
    }
    if ($method==='DELETE' && preg_match('#^admin/(exams|courses|posts)/([a-zA-Z0-9-]+)/purge$#D',$path,$m)) {
        $entity=sc_entity($m[1],$m[2]);
        if (!$entity || $entity['status']!=='ARCHIVED') return sc_fail('Chỉ xóa vĩnh viễn nội dung đã lưu trữ.');
        if ($m[1]==='exams' && $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->prefix}sc_attempts WHERE exam_id=%s",$m[2]))) return sc_fail('Đề đã có lượt thi; giữ bản lưu trữ để bảo toàn lịch sử.');
        $ok=$wpdb->delete($wpdb->prefix.'sc_entities',['id'=>$m[2],'kind'=>$m[1]]);
        return $ok===false?sc_fail('Không xóa được.',500):['ok'=>true];
    }
    if (preg_match('#^admin/(exams|courses|posts|registrations)(?:/([a-zA-Z0-9-]+))?$#D',$path,$m)) {
        $kind=$m[1]; $id=$m[2] ?? null;
        if($method==='GET') {
            if (!$id) return sc_list($kind,true);
            $entity=sc_entity($kind,$id); if (!$entity) return sc_fail('Không tìm thấy.',404);
            if ($kind==='exams') $entity['attemptCount']=(int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->prefix}sc_attempts WHERE exam_id=%s",$id));
            return $entity;
        }
        if($method==='POST') { if($id) { $old=sc_entity($kind,$id); if(!$old) return sc_fail('Không tìm thấy.',404); $p=array_merge($old,$p,['id'=>$id]); } return sc_save_entity($kind,$p); }
        // Archive rather than cascade-delete: existing attempts retain their snapshots.
        if($method==='DELETE' && $id) { $ok=$wpdb->update($wpdb->prefix.'sc_entities',['status'=>'ARCHIVED'],['id'=>$id,'kind'=>$kind]); return $ok===false?sc_fail('Không lưu được.',500):['ok'=>true]; }
    }
    return sc_fail('Không tìm thấy chức năng.',404);
}
