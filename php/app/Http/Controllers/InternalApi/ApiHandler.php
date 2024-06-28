<?php
namespace App\Http\Controllers\internalApi;
use Illuminate\Http\Request;
use Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Comm\comm_helper;
use Illuminate\Support\Facades\URL;
use App\Jobs\UserAuth;
use App\Http\Controllers\GPT\GPTHandler;

class ApiHandler
{
  private $request;
  private $response;
  private $PostInput;
  private $httpCode = 200;

  public function __construct(Request $request=null)
  {
    $this->response = new \stdClass();
    $this->response->status = 0;
    $this->response->message = null;
    $this->response->data = null;
    $this->PostInput = $request?$request->input():null;
    $this->request = $request;
  }
  private function ResponseMake($method)
  {
    if($this->response->status!=0){
      Log::channel("internalApi")->info("[ApiHandler][$method][status:{$this->response->status}]\n");
    }
    return Response::make(json_encode($this->response,JSON_UNESCAPED_UNICODE),$this->httpCode,["Content-Type" => "application/json"]);
  }
  public function loginCheck()
  {
    $records = DB::table("UserInfo")
    ->where("account",$this->PostInput['account'])
    ->where("isActive",1)
    ->first();
    if(!$records){
      $this->response->status = 101; // 帳密不存在
    }else{
      if(!$records->isActivate){
        $this->response->status = 103; // 帳號未啟用
      }
      else if(!$records->allowAccess){
        $this->response->status = 104; // 不准登入
      }
      else{
        if(!password_verify($this->PostInput['passwd'],$records->passwd)){
          $this->response->status = 102; // 帳密不符
        }
        else{
          $session_token = str_random(40);
          setcookie("sessionToken",$session_token,-1);
          DB::transaction(function () use ($session_token,$records) {
            DB::delete('delete from LogonUserSession where `userID` = ?',[$records->ID]);
            DB::table('LogonUserSession')->insert([
              'session_token'=>$session_token,  
              'userID'=>$records->ID,
              'logon_time'=>DB::raw('now()'),
              'expire_time'=>DB::raw('date_add(now(),interval 7 day)')   
            ]);
            DB::table("UserInfo")->where("ID",$records->ID)->update(["lastLogon"=>DB::raw('now()')]);
          },5);

          $this->response->data = (object)[
            "account"=>$records->account,
            "firstName"=>$records->firstName,
            "lastName"=>$records->lastName,
            "locale"=>$records->locale,
            "regionCode"=>$records->regionCode,
            "mobilePhone"=>$records->phone,
            "accountType"=>$records->accountType,
            "UID"=>$records->ID
          ];
        }
      }
    }
    return $this->ResponseMake("loginCheck");
  }
  public function userValidation($middleware=false)
  {
    $error = false;
    if(!array_key_exists('sessionToken',$_COOKIE)){
      $this->response->status = 107;
      $error = true;
      // return Response::make("{\"status\":-998,\"message\":\"method not found\"}",404,["Content-Type" => "application/json"]);
    }
    else{
      $userToken = DB::table("LogonUserSession")->where('session_token',$_COOKIE['sessionToken'])->first();
      if(!$userToken){
        //別處登入
        $this->response->status = 107;
        $error = true;
      }else{
        if(strtotime($userToken->expire_time)<time()){
          $this->response->status = 105;
          $error = true;
        }else{
          $records = DB::table("UserInfo")->where("ID",$userToken->userID)->first();
          if(!$middleware){
            $this->response->data = (object)[
              "account"=>$records->account,
              "firstName"=>$records->firstName,
              "lastName"=>$records->lastName,
              "locale"=>$records->locale,
              "regionCode"=>$records->regionCode,
              "mobilePhone"=>$records->phone,
              "accountType"=>$records->accountType,
              "settings"=>$records->settings,
              "UID"=>$userToken->userID
            ];
          }
          if(!$records->allowAccess||!$records->isActive){
            $this->response->status = 104; // 不准登入
            $error = true;
          }
        }
      }
    }
    return ($error||!$middleware)?$this->ResponseMake("userValidation"):null;
  }
  public function getEmbeddings()
  {
    $this->response->data = DB::table("Embeddings")->select("ID","shortContent")->where("UID",$this->PostInput['UID'])->where("active",1)->get();
    return $this->ResponseMake("getEmbeddings");
  }
  public function getEmbeddingDetail()
  {
    $this->response->data = DB::table("Embeddings")->select("ID","Content")->where("ID",$this->PostInput['eID'])->first();
    return $this->ResponseMake("getEmbeddingDetail");
  }
  public function deleteEmbeddings()
  {
    DB::table("Embeddings")->where("ID",$this->PostInput['eID'])->update(["active"=>0]);
    return $this->ResponseMake("deleteEmbeddings");
  }
  public function EmbeddingsTransform()
  {
    $GPT = new GPTHandler();
    $content = $this->PostInput['infoData']['embs']['value'];
    $shortContent = mb_substr($content,0,100);
    $hash = hash('sha256',$this->PostInput['UID'].$content);
    $r = DB::table("Embeddings")->select("ID")->where("hash",$hash)->where("active",1)->first();
    if(!$r){
      $vectorSting = $GPT->embeddingsMake($content);
      if($vectorSting){
        DB::table("Embeddings")->insert([
          "UID"=>$this->PostInput['UID'],
          "content"=>$content,
          "shortContent"=>$shortContent,
          "vectors"=>$vectorSting,
          "hash"=>$hash
        ]);
      }
    }
    $settings = [];
    foreach($this->PostInput['infoData'] as $key=>$data){
      if($key=="embs"||$key=="userPrompt")continue;
      $settings[$key] = $this->infoDataCheck($key,$data['value']);
    }
    $this->response->settings = $settings;
    DB::table("UserInfo")->where('ID',$this->PostInput['UID'])->update([
      "settings"=>json_encode($settings,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)
    ]);
    return $this->ResponseMake("EmbeddingsTransform");
  }
  public function SaveSystemPrompt()
  {
    $settings = [];
    foreach($this->PostInput['infoData'] as $key=>$data){
      if($key=="embs"||$key=="userPrompt")continue;
      $settings[$key] = $this->infoDataCheck($key,$data['value']);
    }
    $this->response->settings = $settings;
    DB::table("UserInfo")->where('ID',$this->PostInput['UID'])->update([
      "settings"=>json_encode($settings,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)
    ]);
    return $this->ResponseMake("SaveSystemPrompt");
  }
  public function promptCast()
  {
    $settings = [];
    foreach($this->PostInput['infoData'] as $key=>$data){
      if($key=="embs"||$key=="userPrompt")continue;
      $settings[$key] = $this->infoDataCheck($key,$data['value']);
    }
    $this->response->settings = $settings;
    DB::table("UserInfo")->where('ID',$this->PostInput['UID'])->update([
      "settings"=>json_encode($settings,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)
    ]);

    ini_set('zlib.output_compression', 0); 
    ini_set('max_execution_time', 0);
    header('Content-Type: text/event-stream');
    header('X-Accel-Buffering: no'); 
    header('Cache-Control: no-cache');
    header('Connection: keep-alive');
    header('Access-Control-Allow-Origin: *');
    $msgs = [
      [
        "role"=>"system",
        "content"=>"按照下列規則回答:".$this->PostInput['infoData']['systemPrompt']['value']."\n\n"
      ]
    ];
    if(isset($this->PostInput['lastUserContent'])){
      $msgs[] = [
        "role"=>"user",
        "content"=>$this->PostInput['lastUserContent']
      ];
    }
    if(isset($this->PostInput['lastAssistantContent'])){
      $msgs[] = [
        "role"=>"assistant",
        "content"=>$this->PostInput['lastAssistantContent']
      ];
    }
    $msgs[] = [
      "role"=>"user",
      "content"=>$this->PostInput['content']
    ];

    $GPT = new GPTHandler();
    $results = [];
    
    $answers = DB::table("Embeddings")->select("ID","vectors")->where('UID',$this->PostInput['UID'])->where('active',1)->get();
    if(isset($answers[0])){
      $vectorString = $GPT->embeddingsMake($this->PostInput['content']);
      if($vectorString){
        foreach($answers as $a){
          $similarity = $GPT->cosineSimilarity(explode(",",$a->vectors),explode(",",$vectorString));
          $results[] = [
            'similarity'=>$similarity,
            "ID"=>$a->ID
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
      }
    }
    if(sizeof($results)){
      $IDs = null;
      foreach($results as $k=>$r){
        if($k>=(int)$this->PostInput['infoData']['embTopP']['value'])break;
        $IDs[] = $r['ID'];
      }
      $answersText = DB::table("Embeddings")->select("content")->whereIn('ID',$IDs)->get();
      if($answersText){
        $msgs[0]['content'] .= "參考下列資料回覆問題:\n------";
        foreach($answersText as $r){
          $msgs[0]['content'] .= str_replace("\n"," ",$r->content)."\n";
        }
        $msgs[0]['content'] .= "------";
      }
      $this->response->msgs = $msgs;
    }

    $GPT->TextGeneration($msgs,
      (float)$this->PostInput['infoData']['temp']['value'],
      (int)$this->PostInput['infoData']['maxToken']['value'],
      $this->PostInput['infoData']['stopSeq']['value'],
      (float)$this->PostInput['infoData']['topP']['value'],
      (float)$this->PostInput['infoData']['frequencyP']['value'],
      (float)$this->PostInput['infoData']['presenceP']['value']
    );


    
    $this->response->input = $this->PostInput;
    // return $this->ResponseMake("SaveSystemPrompt");
  }

  private function infoDataCheck($key,$value)
  {
    if($key=="temp"){
      if($value>2||$value<0)$value = 1;
    }else if($key=="maxToken"){
      if($value>4096||$value<1)$value = 256;
    }else if($key=="topP"){
      if($value>1||$value<0)$value = 1;
    }else if($key=="frequencyP"){
      if($value>2||$value<0)$value = 0.5;
    }else if($key=="presenceP"){
      if($value>2||$value<0)$value = 0.5;
    }else if($key=="embTopP"){
      if($value>3||$value<0)$value = 1;
    }
    return $value;
  }
}
