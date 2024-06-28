<?php
namespace App\Comm;
use DB;
use Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
/**
 * Description of comm_helper
 *
 * @author scott
 */
class comm_helper {
  static function TransACDate($date)
  {
    $datetimearray = explode("/",$date);
    $date_string = null;
    if(isset($datetimearray[0])&&$datetimearray[0]){
      $date_string = (int)$datetimearray[0]+1911;
    }
    if(isset($datetimearray[1])&&$datetimearray[1]){
      $date_string .= "-".str_pad($datetimearray[1],2,"0",STR_PAD_LEFT);
    }
    if(isset($datetimearray[2])&&$datetimearray[2]){
      $date_string .= "-".str_pad($datetimearray[2],2,"0",STR_PAD_LEFT);
    }
    return $date_string;
  }
  static function TransACDateFromHIS($date)
  {
    $date_string = null;
    if($date)$date_string = ((int)substr($date,0,3)+1911)."-".substr($date,3,2)."-".substr($date,5,2);
    return $date_string;
  }
  static function TransACDateTime($datetime)
  {
    $datetimearray = explode("/",$datetime);
    if(!isset($datetimearray[0])||!isset($datetimearray[1])||!isset($datetimearray[2]))return null;
    $temptimearray = explode(" ",$datetimearray[2]);
    if(isset($temptimearray[1])){
      $datetimearray[2] = $temptimearray[0];
    }else $temptimearray[1] = "";
    return date("Y-m-d H:i",strtotime(((int)$datetimearray[0]+1911)."-".$datetimearray[1]."-".$datetimearray[2]." {$temptimearray[1]}")); 
  }
  static function encrypt_id($s_value)
  {
    if(!$s_value){return false;}
    $s_key = "65432MightyNetiSthEwOrlDnO123456";
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
    $encrypt_text = openssl_encrypt($s_value,'aes-256-cbc',$s_key,0,$iv);
    return base64_encode($encrypt_text.'::'.$iv);
  }
  static function decrypt_id($s_value){
    if(!$s_value){return false;}
    $s_key = "65432MightyNetiSthEwOrlDnO123456";
    list($decrypt_text,$iv) = explode('::',base64_decode($s_value),2);
    return openssl_decrypt($decrypt_text,'aes-256-cbc',$s_key,0,$iv);
  }
  static function FindCRC($data,$datalen)         // computes crc value
  {
    $crc8_table =  array(  
    0x00,   0x31,   0x62,   0x53,   0xc4,   0xf5,   0xa6,   0x97,   
    0x88,   0xb9,   0xea,   0xdb,   0x4c,   0x7d,   0x2e,   0x1f,   
    0x21,   0x10,   0x43,   0x72,   0xe5,   0xd4,   0x87,   0xb6,   
    0xa9,   0x98,   0xcb,   0xfa,   0x6d,   0x5c,   0x0f,   0x3e,   
    0x73,   0x42,   0x11,   0x20,   0xb7,   0x86,   0xd5,   0xe4,   
    0xfb,   0xca,   0x99,   0xa8,   0x3f,   0x0e,   0x5d,   0x6c,   
    0x52,   0x63,   0x30,   0x01,   0x96,   0xa7,   0xf4,   0xc5,   
    0xda,   0xeb,   0xb8,   0x89,   0x1e,   0x2f,   0x7c,   0x4d,   
    0xe6,   0xd7,   0x84,   0xb5,   0x22,   0x13,   0x40,   0x71,   
    0x6e,   0x5f,   0x0c,   0x3d,   0xaa,   0x9b,   0xc8,   0xf9,   
    0xc7,   0xf6,   0xa5,   0x94,   0x03,   0x32,   0x61,   0x50,   
    0x4f,   0x7e,   0x2d,   0x1c,   0x8b,   0xba,   0xe9,   0xd8,   
    0x95,   0xa4,   0xf7,   0xc6,   0x51,   0x60,   0x33,   0x02,   
    0x1d,   0x2c,   0x7f,   0x4e,   0xd9,   0xe8,   0xbb,   0x8a,   
    0xb4,   0x85,   0xd6,   0xe7,   0x70,   0x41,   0x12,   0x23,   
    0x3c,   0x0d,   0x5e,   0x6f,   0xf8,   0xc9,   0x9a,   0xab,   
    0xcc,   0xfd,   0xae,   0x9f,   0x08,   0x39,   0x6a,   0x5b,   
    0x44,   0x75,   0x26,   0x17,   0x80,   0xb1,   0xe2,   0xd3,   
    0xed,   0xdc,   0x8f,   0xbe,   0x29,   0x18,   0x4b,   0x7a,   
    0x65,   0x54,   0x07,   0x36,   0xa1,   0x90,   0xc3,   0xf2,   
    0xbf,   0x8e,   0xdd,   0xec,   0x7b,   0x4a,   0x19,   0x28,   
    0x37,   0x06,   0x55,   0x64,   0xf3,   0xc2,   0x91,   0xa0,   
    0x9e,   0xaf,   0xfc,   0xcd,   0x5a,   0x6b,   0x38,   0x09,   
    0x16,   0x27,   0x74,   0x45,   0xd2,   0xe3,   0xb0,   0x81,   
    0x2a,   0x1b,   0x48,   0x79,   0xee,   0xdf,   0x8c,   0xbd,   
    0xa2,   0x93,   0xc0,   0xf1,   0x66,   0x57,   0x04,   0x35,   
    0x0b,   0x3a,   0x69,   0x58,   0xcf,   0xfe,   0xad,   0x9c,   
    0x83,   0xb2,   0xe1,   0xd0,   0x47,   0x76,   0x25,   0x14,   
    0x59,   0x68,   0x3b,   0x0a,   0x9d,   0xac,   0xff,   0xce,   
    0xd1,   0xe0,   0xb3,   0x82,   0x15,   0x24,   0x77,   0x46,   
    0x78,   0x49,   0x1a,   0x2b,   0xbc,   0x8d,   0xde,   0xef,   
    0xf0,   0xc1,   0x92,   0xa3,   0x34,   0x05,   0x56,   0x67);  

    $CRC = 0;  
    $j = 0;
    $data = str_split($data);
    while($datalen--)   
    { 
      $c = ord($data[$j]);
      $CRC = $crc8_table[($CRC^$c)];   
      $CRC &= 0xff;
      $j++;
    }   
    $CRC = strtoupper(dechex($CRC));
    $CRC = str_pad($CRC,2,"0",STR_PAD_LEFT);
    return $CRC;        
  }
  static function record_array_parser($a1,$a2)
  {
    $parsed_array = array();
    foreach($a1 as $k=>$v)$parsed_array[$v] = $a2[$k];
    return $parsed_array;
  }
  static public function uuid()
  {
    mt_srand((double)microtime()*10000);
    return md5(uniqid(rand(),true));
  }
  static public function BarcodeGen($string,$qr=false,$height=null)
  {
    $strlen = strlen(trim($string));
    $uid = comm_helper::uuid();
    $filepath = Storage::path('tmp')."/barcode_$uid.jpg";
    if(!file_exists(Storage::path('tmp')))
      mkdir(Storage::path('tmp'),0775);
    if($qr){
      $filepath = Storage::path('tmp')."/barcode_$uid.jpg";
      QrCode::size(512)->encoding('UTF-8')->
      errorCorrection('M')->
      margin(0)->
      backgroundColor(255,255,255)->
      color(0, 0, 0)->
      format('png')->
      generate($string,$filepath);
    }
    else{
      $generator = new \Picqer\Barcode\BarcodeGeneratorJPG();
      file_put_contents($filepath, $generator->getBarcode($string, $generator::TYPE_CODE_128, 3, $height?$height:50,[22,22,22]));
      $size = getimagesize($filepath);
      $srcim = imagecreatefromjpeg($filepath); 
      $im = imagecreatetruecolor($size[0]+30,$size[1]+30);
      imagecopy($im,$srcim,15,10,0,0,$size[0],$size[1]);
      imagefill($im, 0, 0,imagecolorallocate($im,255,255,255));
      imagestring($im, 6, (($size[0])-6*$strlen)/2, $size[1]+12, $string,imagecolorallocate($im, 0, 0, 0));
      imagejpeg($im,$filepath);
      imagedestroy($im);
      imagedestroy($srcim);
    }
    return $filepath ;
  }
  static public function insertIgnore($table,$array){
    DB::insert('INSERT IGNORE INTO '.$table.' ('.implode(',',array_keys($array)).
        ') values (?'.str_repeat(',?',count($array) - 1).')',array_values($array));
    return DB::getPdo()->lastInsertId();    
  }
}
