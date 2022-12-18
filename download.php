<?php declare(strict_types=1);

include_once(__DIR__ . '/inc.php');


use Psr\Log\LogLevel;
use Oeuvres\Kit\{Http, I18n, Log, LoggerTxt, Parse};
use Oeuvres\Teinte\Format\{File, Tei};
use Oeuvres\Teinte\Tei2\{Tei2toc,Tei2article};

// for debug, output ERRORS to http client
// do not log xml warnings like : Teinte, download [2022-12-16 05:01:27] 392:21 err:539
// Log::setLogger(new LoggerTxt(LogLevel::WARNING, 'Teinte, download [{datetime}] '));

// 

function attach($dst_name) {
    $contentDisposition = 'Content-Disposition:  attachment; '
        . sprintf('filename="%s"; ', rawurlencode($dst_name))
        // . sprintf("filename*=utf-8''%s", rawurlencode($dst_name))
    ;
    header($contentDisposition);
}


// do not output response code for download
header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Transfer-Encoding: binary');
header('Connection: Keep-Alive');
header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Pragma: public');
ob_clean();


// nothing has been uploaded
if (!isset($_COOKIE['teinte'])) {
    attach("Teinte, " . I18n::_("ERROR_NO_UPLOAD") . '.txt');
    Log::error(I18n::_('download.nofile'));
    print_r($_COOKIE);
    exit();
}
$cookie = json_decode($_COOKIE[TEINTE], true);
if (!isset($cookie['id'])) {
    attach("Teinte, " . I18n::_("ERROR_NO_UPLOAD") . '.txt');
    Log::error(I18n::_('download.nofile'));
    print_r($cookie);
    exit();
}
if (!isset($cookie['tei_basename'])) {
    attach("Teinte, " . I18n::_("ERROR_NO_UPLOAD") . '.txt');
    Log::error(I18n::_('download.nofile'));
    print_r($cookie);
    exit();
}
$par_format = Http::par('format');
if (!$par_format) {
    attach("Teinte, " . I18n::_("ERROR_NO_FORMAT") . '.txt');
    Log::error(I18n::_('download.noformat', $upload_name));
    print_r($_REQUEST);
    exit();
}
$format = File::path2format($par_format);
// exports supported
$supported = ["docx", "html", "tei", "markdown"];
if (!in_array($format, $supported)) {
    attach("Teinte, " . I18n::_("ERROR_UNKNOWN_FORMAT"). '.txt');
    echo I18n::_('download.format404', $par_format, $upload_name);
    exit();
}
if (!isset($cookie['name'])) {
    attach("Teinte, bad cookie .txt");
    print_r($cookie);
    exit();
}

$dst_basename = $cookie['name'] . File::ext($format);
attach($dst_basename);


$tmp_dir = $config['workdir'] . $cookie['id'] . "/";
$tei_file = $tmp_dir . $cookie['tei_basename'];
// Tei Export
if ($format == "tei") {
    $length = filesize($tei_file);
    header("Content-Length: $length");
    header("Accept-Ranges: $length");
    readfile($tei_file);
    die();
}
$tei = new Tei();
$tei->load($tei_file);

// html Export
if ($format == "html") {
    $content = ltrim($tei->toXml('html', ['theme' => 'https://oeuvres.github.io/teinte/theme/']));
    $length = Http::length($content);
    header("Content-Length: $length", true);
    header("Accept-Ranges: $length", true);
    echo $content;
    die();
}
else if ($format == "markdown") {
    $content = ltrim($tei->toXml("markdown"));
    $length = Http::length($content);
    header("Content-Length: $length", true);
    header("Accept-Ranges: $length", true);
    echo $content;
    die();
}
else if ($format == "docx") {
    $dst_file = Tei::destination($tei_file, "docx");
    $tei->toUri("docx", $dst_file);
    $length = filesize($dst_file);
    header("Content-Length: $length");
    header("Accept-Ranges: $length");
    readfile($dst_file);
}
else {
    echo "GROS BUG";
}