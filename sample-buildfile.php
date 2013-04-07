<?php 
/*
  Custom Builder
  Kevin Batdorf

  http://.kevinbatdorf.com

  MIT/GPL license

  Note that you must use this file on a server. 
*/

// Set your Id and token for GitHub api. 
// This allows for 5000 requests instead of 60.
// You'll have to create an application within Github
if(isset($_GET['ajax'])) {
  $data = array(
    'client_id' => 'client_id',
    'client_secret' => 'client_secret'
  );
  echo json_encode($data);
  exit;
 }

// If no checkboxes are set, abort
if(!isset($_POST['cb-output'])){
    die('No files to build specified');
}

// Clear out file if it's there already
if(file_exists($filename_js)){
    unlink($filename_js);
}

// Store data from post
$output = $_POST['cb-output'];

// Create a JS file
$filename_js = 'js/sample-file.js';
// Open the file
$fh = fopen($filename_js, 'w') or die("can't open file");
// Write the posted input to the file
fwrite($fh, $output);
// Close the file
fclose($fh);

// Create zip archive
$zip = new ZipArchive();
$filename = "custom-build.zip";
$filepath = "./";

// Clear out zip archive if it's already there
if(file_exists($filename)){
    unlink($filename);
}

// Open the zip file
if ($zip->open($filename, ZIPARCHIVE::CREATE)!==TRUE) {
    exit("cannot open <$filename>\n");
}

// Set the root of this page
$thisdir = "$_SERVER[DOCUMENT_ROOT]";
// Add the input file
$zip->addFile($filename_js);
// Add additional files from server
$zip->addFile($thisdir . "/custom.css", "css/custom.css");
$zip->addFile($thisdir . "/arrow.png", "img/arrow.png");
$zip->close();

// http headers for zip downloads
header("Pragma: public");
header("Expires: 0");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Cache-Control: public");
header("Content-Description: File Transfer");
header("Content-type: application/octet-stream");
header("Content-Disposition: attachment; filename=\"".$filename."\"");
header("Content-Transfer-Encoding: binary");
header("Content-Length: ".filesize($filepath.$filename));
ob_end_flush();
@readfile($filepath.$filename);

// Clear out files after download
if(file_exists($filename)){
    unlink($filename);
}
if(file_exists($filename_js)){
    unlink($filename_js);
}
?>