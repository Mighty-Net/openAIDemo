<?php
namespace App\Http\Controllers\GPT;

use App\Comm\comm_helper;
use Response;
use Illuminate\Support\Facades\Storage;
use CURLFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Smartsheet\SmartsheetHandler;

class GPTHandler
{
  private $request;
  private $response;
  private $PostInput;
  private $httpCode = 200;
  const apiKey = "openAI api key";

  public function __construct(Request $request=null)
  {
    $this->response = new \stdClass();
    $this->response->status = 0;
    $this->response->message = null;
    $this->response->data = null;
    $this->PostInput = $request?$request->input():null;
    $this->Request = $request;
    $this->lanCode = json_decode(file_get_contents(app_path()."/Http/Controllers/GPT/ISO6391.json"),1);
  }
  public function STT($filename="",$language="en")
  {
    $resultText = null;

    $url = "https://api.openai.com/v1/audio/transcriptions";
    $filename = $filename?$filename:"speech.m4a";
    $filepath = Storage::path('tmp')."/$filename";
    $file = new CURLFile($filepath,mime_content_type($filepath),$filename);
    $ch = curl_init();	
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //must have this
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);//for https	
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT,60); 
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(                                                                          
        "multipart/form-data",
        "Authorization: Bearer ".self::apiKey
      )                                                                       
    );  
    curl_setopt($ch, CURLOPT_POSTFIELDS,[
      "model"=>"whisper-1",
      "temperature"=>"0.8",
      "language"=>$language,
      "file"=>$file
    ]); 
    $resp = curl_exec($ch);	
    Log::channel("MTApp")->info("[STT]\n$resp");
    $http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    if($http_code==200){
      // echo $resp;
      $resultText = json_decode($resp)->text;
    }
    else{
      echo "ERROR:".curl_error($ch);
    }
    unlink($filepath);
    // echo $resultText;
    return $resultText;
  }
  public function TTS($text)
  {
    $fileID = null;
    $char = "、！？：；﹑•＂…‘’“”〝〞∕¦‖— 〈〉﹞﹝「」‹›〖〗】【»«』『〕〔》《﹐¸﹕︰﹔！¡？¿﹖﹌﹏﹋＇´ˊˋ―﹫︳︴¯＿￣﹢﹦﹤‐­˜﹟﹩﹠﹪﹡﹨﹍﹉﹎﹊ˇ︵︶︷︸︹︿﹀︺︽︾ˉ﹁﹂﹃﹄︻︼()（）";
    $pattern = array('/['.$char.']/u','/[ ]{2,}/');
    $text = preg_replace($pattern," ",$text);
    // echo "$text<br>";
    $url = "https://api.openai.com/v1/audio/speech";
    $ch = curl_init();	
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //must have this
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);//for https	
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT,60); 
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(                                                                          
        "Content-Type: application/json",
        "Authorization: Bearer ".self::apiKey
      )                                                                       
    );  
    curl_setopt($ch, CURLOPT_POSTFIELDS,json_encode([
      "model"=>"tts-1",
      "input"=>$text,
      // "response_format"=>"aac",
      "speed"=>0.8,
      // "voice"=>"fable" 
      "voice"=>"nova"  
      // "voice"=>"shimmer"  
    ])); 
    $resp = curl_exec($ch);	
    $http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    if($http_code==200){
      $fileID = comm_helper::uuid();
      file_put_contents(Storage::path('tmp')."/speech_$fileID.mp3",$resp);
    }
    else{
      Log::channel("MTApp")->info("[TTS]\n$resp");
      echo "ERROR:".curl_error($ch);
    }
    return $fileID;
  }
  public function chatTR($text,$source_languageCode,$target_languageCode)
  {
    $source_language = $this->lanCode[$source_languageCode];
    $target_language = $this->lanCode[$target_languageCode];
    $textTranslated = null;
    $url = "https://api.openai.com/v1/chat/completions";
    $ch = curl_init();	
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //must have this
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);//for https	
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT,60); 
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(                                                                          
        "Content-Type: application/json",
        "Authorization: Bearer ".self::apiKey
      )                                                                       
    );  
    curl_setopt($ch, CURLOPT_POSTFIELDS,json_encode([
      "model"=>"gpt-3.5-turbo-1106",
      "max_tokens"=>500,
      "temperature"=>0.8,
      "messages"=>[
        [
          "role"=>"system",
          "content"=>"You are a professional text translation assistant, capable of translating text in various languages. Please assist me in translating the text within [ ], and only provide the translated result."
        ],
        [
          "role"=>"user",
          // "content"=>"Translate the following '$source_language' text to '$target_language':[$text]"
          "content"=>"Translate [$text] to '$target_language'"
        ],
      ],
    ])); 
    $resp = curl_exec($ch);	
    $http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    if($http_code==200){
      // echo $resp;
      $result = json_decode($resp);
      if(isset($result->choices[0])){
        $textTranslated = $result->choices[0]->message->content;
      }
      
    }
    else{
      echo "ERROR:".curl_error($ch);
    }
    // echo $textTranslated;
    return $textTranslated;
  }
  public function embeddingsMake($text,$dimensions=256)
  {
    // echo $text."<br>";
    $url = "https://api.openai.com/v1/embeddings";
    $ch = curl_init();	
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //must have this
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);//for https	
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT,60); 
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(                                                                          
        "Content-Type: application/json",
        "Authorization: Bearer ".self::apiKey
      )                                                                       
    );  
    curl_setopt($ch, CURLOPT_POSTFIELDS,json_encode([
      // "model"=>"text-embedding-ada-002",
      "model"=>"text-embedding-3-large",
      "dimensions"=>$dimensions,
      "input"=>$text,
    ])); 
    $resp = curl_exec($ch);	
    // echo $resp."<br/>";
    $http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    if($http_code==200){
      $result = json_decode($resp);
      $vectors = implode(",",$result->data[0]->embedding);
      $error = false;
      return $error?null:$vectors;
    }
    else{
      return null;
    }
  }
  public function getAnswer($question)
  {
    $questionVectors = $this->embeddingsMake($question);
    $results = [];
    $finalAnswer = null;
    if($questionVectors){
      $answers = DB::table("GptEmbedData")->select("ID","vectors")->get();
      if(isset($answers[0])){
        foreach($answers as $a){
          $similarity = $this->cosineSimilarity(explode(",",$a->vectors),$questionVectors);
          $results[] = [
            'similarity'=>$similarity,
            'ID'=>$a->ID,
          ];
        }
        usort($results, function ($a, $b) {
          if ($a['similarity'] < $b['similarity']) {
              return 1;
          } elseif ($a['similarity'] == $b['similarity']) {
              return 0;
          } else {
              return -1;
          }
        });
        // print_r($results)."<br>";
      }
    }

    if(sizeof($results)){
      $IDs = null;
      foreach($results as $k=>$r){
        $IDs[] = $r['ID'];
        if($k>1)break;
      }
      $answersText = DB::table("GptEmbedData")->select("text")->whereIn('ID',$IDs)->get();
      $refAnswer = "";
      foreach($answersText as $r){
        $refAnswer .= ("{$r->text}\n");
      }
      // echo $refAnswer."<br/>";
      //If the answer is not contained within the 'given answers', say \"抱歉，您的問題我不太了解，請試著給我更精確的字句。\"

      $finalAnswer = $this->TextGeneration($question,"",
      "You are the company AI assistant of Mighty Net. Your name is \"小邁\". Adhere to the following guidelines when answering questions:
      1. Answer questions in the tone of an assistant. 
      2. Use Traditional Chinese and prioritize using content from 'given answers' to respond.
      3. Do not include URLs other than those in the \"given answers\".
      4. If there are any URLs in the answer, separate the URLs out and use <a target='_blank' rel='noreferrer noopenner' href='URLs'/> to represent them.
      \n\n".
      "given answers:\n------------".$refAnswer."\n------------");
    }
    $urlPattern = '/\((https?:\/\/\S+)\)/i';
    $finalAnswer = preg_replace($urlPattern, "<a target='_blank' rel='noreferrer noopenner' href='$1'>$1</a>",$finalAnswer);
    return str_replace("\n","<br/>",$finalAnswer);
  }
  public function TextGeneration($msgs,$temp=1,$maxToken=256,$stopSeq=null,$topP=1,$frequencyP=0.5,$presenceP=0.5)
  {
    $textOutput = null;
    $url = "https://api.openai.com/v1/chat/completions";
    $ch = curl_init();	
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //must have this
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);//for https	
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT,60); 
    curl_setopt($ch, CURLOPT_BUFFERSIZE, 10);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(                                                                          
        "Content-Type: application/json",
        "Authorization: Bearer ".self::apiKey
      )                                                                       
    );  
    curl_setopt($ch, CURLOPT_POSTFIELDS,json_encode([
      "model"=>"gpt-3.5-turbo",
      // "model"=>"gpt-4o",
      "stop"=>$stopSeq,
      "max_tokens"=>$maxToken,
      "temperature"=>$temp,
      "presence_penalty"=>$presenceP,
      "frequency_penalty"=>$frequencyP,
      "messages"=>$msgs,
      "stream"=>true,
      "stream_options"=>["include_usage"=>true]
    ])); 
    curl_setopt($ch, CURLOPT_WRITEFUNCTION,array($this,"streamProc"));
    $resp = curl_exec($ch);	
    $http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    curl_close($ch);
  }
  private function streamProc($ch,$data){
    $http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    echo $data;
    ob_flush();
    flush();
    return strlen($data);
  }
  public function cosineSimilarity($u, $v) {
    $dotProduct = 0;
    $uLength    = 0;
    $vLength    = 0;
    for ($i = 0; $i < count($u); $i++) {
        $dotProduct += $u[$i] * $v[$i];
        $uLength += $u[$i] * $u[$i];
        $vLength += $v[$i] * $v[$i];
    }
    $uLength = sqrt($uLength);
    $vLength = sqrt($vLength);
    return $dotProduct / ($uLength * $vLength);
  }
  public function trainfromSmartsheet($sheetID,$colInfo,$colLink,$colTrained,$database)
  {
    $SMO = new SmartsheetHandler();
    $rows = $SMO->GetRows($sheetID,null,[$colInfo,$colLink,$colTrained]);
    if($rows){
      // echo json_encode($rows,JSON_UNESCAPED_UNICODE);
      $UpdateContent = null;
      $tranData = null;
      foreach($rows as $r){
        if(!$r["cells"][$colTrained]['value']){
          $tranData[$r["id"]] = "{$r["cells"][$colInfo]['value']}: ".($r["cells"][$colLink]['value']?$r["cells"][$colLink]['value']:"");
          $UpdateContent[] = array(
            "id"=>$r["id"],
            "cells"=>[[
              "columnId"=>$colTrained, 
              "value"=>true,
              "strict"=>false
            ]]
          );
        }
      }
      if($tranData){
        foreach($tranData as $tr){
          $this->embeddingsMake($tr,$database);
        }
        // echo json_encode($UpdateContent,JSON_UNESCAPED_UNICODE);
        $SMO->UpdateSheet($sheetID,$UpdateContent);
      }
      // echo json_encode($trainnedRows,JSON_UNESCAPED_UNICODE);
    }
  }
}
