<?php
// Pure domain functions: shared by REST handlers and CLI regression tests.
function sc_types($template) { return array_slice(['MULTIPLE_CHOICE','TRUE_FALSE','SHORT_ANSWER','ESSAY'], 0, ['MC'=>1,'MC_TF'=>2,'FULL'=>3,'FULL_ESSAY'=>4][$template] ?? 3); }
function sc_points($value) { return is_numeric($value) && is_finite((float)$value) && (float)$value > 0 && (float)$value <= 100; }
function sc_validate_exam($e) {
    if (!in_array($e['template'] ?? '', ['MC','MC_TF','FULL','FULL_ESSAY'], true)) return 'Chọn mẫu đề hợp lệ.';
    if (trim($e['title'] ?? '') === '' || strlen($e['title']) > 500) return 'Nhập tên đề (tối đa 500 ký tự).';
    if (!in_array((string)($e['grade'] ?? ''), ['10','11','12'], true)) return 'Khối lớp không hợp lệ.';
    if (!is_numeric($e['durationMinutes'] ?? null) || $e['durationMinutes'] < 1 || $e['durationMinutes'] > 300 || floor($e['durationMinutes']) != $e['durationMinutes']) return 'Thời gian từ 1 đến 300 phút.';
    $count = 0;
    foreach (sc_types($e['template']) as $type) {
        $s = $e['sectionSettings'][$type] ?? [];
        if (!sc_points($s['pointsPerQuestion'] ?? null)) return 'Điểm mặc định mỗi câu phải lớn hơn 0 và không quá 100.';
        if (!in_array($s['tfScoring'] ?? '', ['TIERED','EQUAL'], true)) return 'Cách chấm đúng/sai không hợp lệ.';
        $qs = $e['sections'][$type] ?? [];
        if (!is_array($qs) || count($qs) > 200) return 'Tối đa 200 câu mỗi phần.';
        foreach ($qs as $q) {
            $count++;
            if (($q['points'] ?? null) !== null && !sc_points($q['points'])) return 'Điểm riêng của câu không hợp lệ.';
            if (($e['status'] ?? '') !== 'PUBLISHED') continue;
            if (trim($q['content'] ?? '') === '') return 'Câu hỏi còn thiếu nội dung.';
            if ($type === 'MULTIPLE_CHOICE') {
                if (count($q['options'] ?? []) !== 4) return 'Mỗi câu trắc nghiệm cần 4 phương án.';
                $correct = 0;
                foreach ($q['options'] as $o) { if (trim($o['content'] ?? '') === '') return 'Phương án còn trống.'; if (($o['isCorrect'] ?? false) === true) $correct++; }
                if ($correct !== 1) return 'Chọn đúng một đáp án đúng.';
            } elseif ($type === 'TRUE_FALSE') {
                if (count($q['statements'] ?? []) !== 4) return 'Mỗi câu đúng/sai cần 4 mệnh đề.';
                foreach ($q['statements'] as $st) if (trim($st['content'] ?? '') === '' || !is_bool($st['isTrue'] ?? null)) return 'Mệnh đề đúng/sai không hợp lệ.';
            } elseif ($type==='SHORT_ANSWER' && !array_filter($q['answers'] ?? [], fn($a)=>is_string($a) && trim($a) !== '')) return 'Nhập đáp án trả lời ngắn.';
        }
    }
    return ($e['status'] ?? '') === 'PUBLISHED' && !$count ? 'Thêm câu hỏi trước khi công bố.' : null;
}
function sc_snapshot($e) {
    $sections = [];
    foreach (sc_types($e['template']) as $type) {
        $s = $e['sectionSettings'][$type]; $s['type']=$type; $s['questions']=[];
        foreach ($e['sections'][$type] ?? [] as $i=>$raw) {
            $q=['id'=>$type.'-'.$i,'content'=>(string)($raw['content'] ?? ''),'explanation'=>(string)($raw['explanation'] ?? ''),'points'=>(float)($raw['points'] ?? $s['pointsPerQuestion'])];
            if ($type === 'MULTIPLE_CHOICE') foreach ($raw['options'] as $j=>$o) $q['options'][]=['label'=>'ABCD'[$j],'content'=>$o['content'],'isCorrect'=>(bool)$o['isCorrect']];
            if ($type === 'TRUE_FALSE') foreach ($raw['statements'] as $j=>$st) $q['statements'][]=['label'=>'abcd'[$j],'content'=>$st['content'],'isTrue'=>(bool)$st['isTrue']];
            if ($type === 'SHORT_ANSWER') foreach ($raw['answers'] as $j=>$a) $q['shortAnswers'][]=['answer'=>$a,'isPrimary'=>$j===0];
            $s['questions'][]=$q;
        }
        if (!empty($e['shuffleQuestions'])) shuffle($s['questions']);
        $sections[]=$s;
    }
    return $sections;
}
function sc_public_sections($sections) {
    foreach ($sections as &$s) foreach ($s['questions'] as &$q) {
        unset($q['explanation'],$q['shortAnswers']);
        if (isset($q['options'])) foreach ($q['options'] as &$o) unset($o['isCorrect']);
        if (isset($q['statements'])) foreach ($q['statements'] as &$st) unset($st['isTrue']);
    }
    return $sections;
}
function sc_normalize_short($v) { return strtolower(preg_replace('/^\+/', '', str_replace([',','$'], ['.',''], preg_replace('/[\s\x{00a0}]+/u','',(string)$v)))); }
function sc_short_matches($input, $accepted) {
    $a=sc_normalize_short($input); if ($a==='') return false;
    foreach ($accepted as $v) { $b=sc_normalize_short($v); if ($a===$b) return true; if (preg_match('/^-?\d+(\.\d+)?$/D',$a) && preg_match('/^-?\d+(\.\d+)?$/D',$b) && abs((float)$a-(float)$b)<1e-9) return true; }
    return false;
}
function sc_grade($sections, $answers, $duration=0, $manual=[]) {
    $r=['pending'=>0,'manualGrades'=>$manual,'score'=>0,'rawScore'=>0,'maxScore'=>0,'correct'=>0,'wrong'=>0,'unanswered'=>0,'totalUnits'=>0,'durationSec'=>$duration,'breakdown'=>[],'perQuestion'=>[]];
    foreach ($sections as $s) {
        $b=['pending'=>0,'type'=>$s['type'],'questions'=>count($s['questions']),'units'=>0,'correct'=>0,'wrong'=>0,'unanswered'=>0,'fraction'=>0,'points'=>0,'maxPoints'=>0];
        foreach ($s['questions'] as $q) {
            $max=(float)($q['points'] ?? $s['pointsPerQuestion']); $fraction=0; $v=$answers[$q['id'].'|'] ?? ''; $p=['status'=>'blank'];
            if ($s['type']==='TRUE_FALSE') {
                $k=0; $any=false; $p['subs']=[]; $n=count($q['statements']);
                foreach ($q['statements'] as $st) {
                    $a=$answers[$q['id'].'|'.$st['label']] ?? ''; $b['units']++;
                    $status=$a===''?'blank':(($a==='T')===$st['isTrue']?'correct':'wrong');
                    $p['subs'][$st['label']]=$status; $b[$status==='blank'?'unanswered':$status]++;
                    if ($status==='correct') $k++; if ($a!=='') $any=true;
                }
                $fraction=$n===4 && $s['tfScoring']!=='EQUAL'?[0,.1,.25,.5,1][$k]:($n?$k/$n:0);
                $p['status']=!$any?'blank':($k===$n?'correct':($k===0?'wrong':'partial')); $p['k']=$k; $p['n']=$n;
            } elseif ($s['type']==='ESSAY') {
                $b['units']++;
                if (array_key_exists($q['id'],$manual)) {
                    $mark=$manual[$q['id']]; $fraction=(float)$mark['points']/$max;
                    $p['status']='graded'; $p['feedback']=$mark['feedback'] ?? '';
                    if(trim((string)$v)==='') $b['unanswered']++;
                } else { $p['status']='pending'; $b['pending']++; }
            } else {
                $b['units']++; $correct=false;
                if ($s['type']==='MULTIPLE_CHOICE') { foreach ($q['options'] as $o) if ($o['isCorrect'] && $v===$o['label']) $correct=true; }
                else $correct=sc_short_matches($v, array_column($q['shortAnswers'],'answer'));
                $p['status']=trim((string)$v)===''?'blank':($correct?'correct':'wrong');
                $b[$p['status']==='blank'?'unanswered':$p['status']]++; $fraction=$correct?1:0;
            }
            $p['maxPoints']=$max; $p['points']=$max*$fraction; $r['perQuestion'][$q['id']]=$p; $b['points']+=$p['points']; $b['maxPoints']+=$max;
        }
        $b['fraction']=$b['maxPoints']?$b['points']/$b['maxPoints']:0;
        foreach (['correct','wrong','unanswered','pending'] as $key) $r[$key]+=$b[$key];
        $r['totalUnits']+=$b['units']; $r['rawScore']+=$b['points']; $r['maxScore']+=$b['maxPoints']; $r['breakdown'][]=$b;
    }
    $r['score']=$r['maxScore']?round($r['rawScore']/$r['maxScore']*10,2):0;
    $r['rawScore']=round($r['rawScore'],4); $r['maxScore']=round($r['maxScore'],4); return $r;
}
function sc_clean_answers($sections, $input) {
    if (!is_array($input) || count($input)>2400) throw new InvalidArgumentException('Đáp án không hợp lệ.');
    $allowed=[];
    foreach ($sections as $s) foreach ($s['questions'] as $q) {
        if ($s['type']==='TRUE_FALSE') foreach ($q['statements'] as $st) $allowed[$q['id'].'|'.$st['label']]=['','T','F'];
        else $allowed[$q['id'].'|']=$s['type']==='MULTIPLE_CHOICE'?['','A','B','C','D']:null;
    }
    foreach ($input as $key=>$v) if (!array_key_exists($key,$allowed) || !is_string($v) || strlen($v)>(str_starts_with($key,'ESSAY-')?48000:500) || ($allowed[$key]!==null && !in_array($v,$allowed[$key],true))) throw new InvalidArgumentException('Đáp án không thuộc đề hoặc sai định dạng.');
    return $input;
}

function sc_clean_marks($sections,$input,$userId) {
    if(!is_array($input) || !$input) throw new InvalidArgumentException('Nhập điểm tự luận.');
    $allowed=[];
    foreach($sections as $s) if($s['type']==='ESSAY') foreach($s['questions'] as $q) $allowed[$q['id']]=(float)($q['points'] ?? $s['pointsPerQuestion']);
    $out=[];
    foreach($input as $id=>$mark) {
        $v=$mark['points'] ?? null;
        if(!isset($allowed[$id]) || !is_numeric($v) || !is_finite((float)$v) || (float)$v<0 || (float)$v>$allowed[$id]) throw new InvalidArgumentException('Điểm tự luận phải từ 0 đến điểm tối đa của câu.');
        if(!is_string($mark['feedback'] ?? '') || strlen($mark['feedback'] ?? '')>12000) throw new InvalidArgumentException('Nhận xét quá dài.');
        $out[$id]=['points'=>(float)$v,'feedback'=>$mark['feedback'] ?? '', 'gradedBy'=>$userId,'gradedAt'=>gmdate('c')];
    }
    return $out;
}
