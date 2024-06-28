<?php
namespace App\Http\Controllers;
use Response;
use Illuminate\Http\Request;
use DB;
use App\Comm\comm_helper;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use LINE\LINEBot\Constant\HTTPHeader;
use LINE\LINEBot\TemplateActionBuilder\MessageTemplateActionBuilder;
use LINE\LINEBot\MessageBuilder\TemplateMessageBuilder;
use LINE\LINEBot\MessageBuilder\ImageMessageBuilder;
use LINE\LINEBot\MessageBuilder\TemplateBuilder\ConfirmTemplateBuilder;
use App\Comm\phpMQTT;
use App\Http\Controllers\StockBot;

class LineGPT 
{
  private $bot;
  private $event;
  private $line_message;
  private $USProfile;
  private $GRProfile;
  private $signature;
  private $request_body;
  private $event_object;
  private $groupname;
  private $eventTimestamp;
  private $replyToken;
  private $msgBody;
  const openAIKey = "openAIKey";

  public function __construct(Request $request=null,$accesstoken,$secret)
  {
    $this->response = new \stdClass();
    $this->response->status = 0;
    $this->response->errormsg = "";
    $httpClient = new \LINE\LINEBot\HTTPClient\CurlHTTPClient($accesstoken);
    $this->bot = new \LINE\LINEBot($httpClient, ['channelSecret' => $secret]);
    $this->signature = $request?$request->header(HTTPHeader::LINE_SIGNATURE):null;
    $this->event = $request?$request['events'][0]:null;
    $this->line_message = isset($this->event['message'])?$this->event['message']:null;
    $this->replyToken = isset($this->event['replyToken'])?$this->event['replyToken']:null;
    $this->eventTimestamp = isset($this->event['timestamp'])?$this->event['timestamp']:null;
    $this->msgBody = isset($this->event['message'])?$this->event['message']:null;

    // Log::channel('MightyBot')->info($this->event);
    
    if(isset($this->event['source']['userId'])){
      $respProfile = $this->bot->getProfile($this->event['source']['userId']);
      if($respProfile)$this->USProfile = json_decode($respProfile->getRawBody());
      // Log::channel('MightyBot')->info("USProfile:".json_encode($this->USProfile,JSON_UNESCAPED_UNICODE));
    }
    if(isset($this->event['joined']['members'])){
      // foreach($this->event['joined']['members'] as $merber){
      // }
    }
    elseif(isset($this->event['left']['members'])){
      // foreach($this->event['left']['members'] as $merber){
      // }
    }
    if(isset($this->event['source']['groupId'])){
      $respProfile = $this->bot->getGroupSummary($this->event['source']['groupId']);
      if($respProfile)$this->GRProfile = json_decode($respProfile->getRawBody());
      // Log::channel('MightyBot')->info("GRProfile:".json_encode($this->GRProfile,JSON_UNESCAPED_UNICODE));
    }

  }
  public function IncommingMsgProccess()
  {
    try {
      switch($this->event['type']){
        case "follow": //使用者加好友
        break;
        case "join": //被加到群組
        break;
        case "memberJoined": //成員邀請別的使用者
        break;
        case "memberLeft": //成員離開群組
        break;
        case "leave": //被踢出群組或群組關閉
        break;
        case "unfollow": // 被使用者封鎖或刪除
          //1.基本上不動作
        case "message":
          //1. 在群組裡就不回了
          //2. 查使用者目前啟用狀態，做出對應回應跟資料庫動作。
          //3. 其他智慧功能
          $rtm_text = null;
          if(!$this->GRProfile)
            $rtm_text = $this->UsermsgProccess();
          if($rtm_text){
            $MessageBuilder = new \LINE\LINEBot\MessageBuilder\TextMessageBuilder($rtm_text);
            $response = $this->bot->replyMessage($this->replyToken,$MessageBuilder);
          }
          // $response = $this->bot->replyMessage($this->replyToken,$templateMessageBuilder); //群發
          // $response = $this->bot->pushMessage($this->USProfile->userId,$templateMessageBuilder); //不會群發
        break;
      }
    } catch (\Throwable $th) {
      // throw $th;
      Log::channel("MightyIICLog")->error("[LineHandler][getInfo]\n{$th}");
    }
  }
  public function UsermsgProccess()
  {
    // Log::channel('MightyBot')->info($this->msgBody);
    if($this->msgBody['type']!="text"){
      return "抱歉😣，我需要您輸入文字訊息，我才能回答您的問題。";
    }
    $rtn_msg = "";
    $userMsg = $this->msgBody['text'];
    $mode = 0;
    if(strpos($userMsg,"產生圖片")!==false)$mode = 1;
    elseif(strpos($userMsg,"刪除對話紀錄")!==false){
      DB::table("lineGPTLastAns")->where("UUID",$this->USProfile->userId)->delete();
      return "已刪除對話紀錄，之後我的回答將不會參考過去的對話。";
    }
    elseif(strpos($userMsg,"智慧控制")!==false)$mode = 2;
    if(!$mode)
      $rtn_msg = $this->TextGeneration($this->USProfile->userId,$userMsg,"你是無所不知的智能助理，你可以友善地回答各種問題，主要以繁體中文回答。\n\n除了純文字之外的保留字、特別樣式、markdown文字，都不要出現。\n\n");
    elseif($mode==1){
      $imgurl = $this->ImgGeneration($this->USProfile->userId,$userMsg);
      if($imgurl){
        $this->ReplyImgMsg($imgurl);
      }
    }elseif($mode==2){
      $rtn_msg = "要控制什麼呢？";
    }
    return $rtn_msg;
  }
  public function ReplyTextMsg($rtm_text=null)
  {
    if(!$rtm_text)return false;
    $MessageBuilder = new \LINE\LINEBot\MessageBuilder\TextMessageBuilder($rtm_text);
    $response = $this->bot->replyMessage($this->replyToken,$MessageBuilder);
  }
  public function ReplyImgMsg($url=null)
  {
    if(!$url)return false;
    $MessageBuilder = new ImageMessageBuilder($url,$url);
    $response = $this->bot->replyMessage($this->replyToken,$MessageBuilder);
  }
  public function PushTextMsg($UUID=null,$msg=null)
  {
    if(!$UUID||!$msg)return false;
    $MessageBuilder = new \LINE\LINEBot\MessageBuilder\TextMessageBuilder($msg);
    return $this->bot->pushMessage($UUID,$MessageBuilder,false);
  }
  public function TextGeneration($UUID,$userContent="",$systemContent="")
  {
    $textOutput = null;
    try {
      $history = DB::table("lineGPTLastAns")->select("lastAns","role")->where("UUID",$UUID)->get();
      $message = [[
        "role"=>"system",
        "content"=>$systemContent
      ]];
      if(isset($history[0])){
        foreach($history as $v){
          if(!$v->lastAns)continue;
          $message[] = [
            "role"=>$v->role,
            "content"=>$v->lastAns
          ];
        }
      }
      $message[] = [
        "role"=>"user",
        "content"=>$userContent
      ];
      DB::table("lineGPTLastAns")->where("UUID",$UUID)->delete();

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
          "Authorization: Bearer ".self::openAIKey
        )                                                                       
      );  
      curl_setopt($ch, CURLOPT_POSTFIELDS,json_encode([
        // "model"=>"gpt-3.5-turbo",
        "model"=>"gpt-4o",
        "max_tokens"=>1024,
        "temperature"=>0.7,
        "top_p"=>1,
        "presence_penalty"=>1.5,
        "frequency_penalty"=>1.5,
        "messages"=>$message,
        "tool_choice"=>"auto",
        "parallel_tool_calls"=>false,
        "tools"=>[
          [
            "type"=>"function",
            "function"=>[
              "name"=>"func1",
              "description"=>"根據用戶對溫度的描述（例如，'有點熱'，'非常冷'），返回用戶對溫度的感知。",
              "parameters"=>[
                "type"=>"object",
                "properties"=>[
                  "result"=>[
                    "type"=>"string",
                    "enum"=>[
                      "熱",
                      "冷"
                    ]
                  ]
                ],
                "required"=>["result"]
              ]
            ]
          ],
          [
            "type"=>"function",
            "function"=>[
              "name"=>"func2",
              "description"=>"判斷用戶想開電扇還是關電扇。",
              "parameters"=>[
                "type"=>"object",
                "properties"=>[
                  "result"=>[
                    "type"=>"string",
                    "description"=>"判斷用戶想開電扇還是關電扇。",
                    "enum"=>[
                      "開",
                      "關"
                    ]
                  ],
                  "target"=>[
                    "type"=>"string",
                    "description"=>"用戶想開關的東西"
                  ]
                ],
                "required"=>["result"]
              ]
            ]
          ],
          [
            "type"=>"function",
            "function"=>[
              "name"=>"func4",
              "description"=>"根據用戶對周圍環境光亮度的描述（例如，'有點亮'，'非常暗'），返回用戶對光亮度的描述。",
              "parameters"=>[
                "type"=>"object",
                "properties"=>[
                  "result"=>[
                    "type"=>"string",
                    "description"=>"用戶對光亮度的描述，他覺得是 '亮' 或 '暗'。",
                    "enum"=>[
                      "亮",
                      "暗"
                    ]
                  ]
                ],
                "required"=>["result"]
              ]
            ]
          ],
          [
            "type"=>"function",
            "function"=>[
              "name"=>"func5",
              "description"=>"判斷用戶想開燈還是關燈。",
              "parameters"=>[
                "type"=>"object",
                "properties"=>[
                  "result"=>[
                    "type"=>"string",
                    "description"=>"判斷用戶想開燈還是關燈。",
                    "enum"=>[
                      "開",
                      "關"
                    ]
                  ],
                  "target"=>[
                    "type"=>"string",
                    "description"=>"用戶想開關的東西"
                  ]
                ],
                "required"=>["result"]
              ]
            ]
          ],
          [
            "type"=>"function",
            "function"=>[
              "name"=>"func6",
              "parameters"=>[
                "type"=>"object",
                "properties"=>[
                  "lat"=>[
                    "type"=>"string",
                    "description"=>"緯度"
                  ],
                  "lng"=>[
                    "type"=>"string",
                    "description"=>"經度"
                  ],
                  "station"=>[
                    "type"=>"string",
                    "description"=>"繁體中文的高鐵站名"
                  ]
                ],
                "required"=>[
                  "lat",
                  "lng",
                  "station"
                ]
              ],
              "description"=>"依據使用者輸入的地址，如果地址在台灣則回傳經緯度，並且查詢最近的高鐵站。台灣高鐵站的座標如下：台北站（25.047760, 121.517053）板橋站（25.014227, 121.463849）桃園站（25.012373, 121.214890）新竹站（24.808254, 121.040905）苗栗站（24.609722, 120.825000）台中站（24.112197, 120.615322）彰化站（23.968492, 120.593180）雲林站（23.709696, 120.541026）嘉義站（23.459093, 120.323605）台南站（22.924828, 120.285702）左營站（22.686778, 120.309722）"
            ]
          ],
          [
            "type"=>"function",
            "function"=>[
              "name"=>"stockNoQ",
              "description"=>"使用者提供股票名稱，回答股票代號。",
              "parameters"=>[
                "type"=>"object",
                "properties"=>[
                  "stockNO"=>[
                    "type"=>"integer",
                    "description"=>"股票代號",
                  ],
                ],
                "required"=>["stockNO"]
              ]
            ]
          ]
        ],
      ],JSON_UNESCAPED_UNICODE)); 
      $resp = curl_exec($ch);	
      $http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
      if($http_code==200){
        Log::channel('MightyBot')->info($resp);
        $result = json_decode($resp);
        if(isset($result->choices[0])){
          $textOutput = $result->choices[0]->message->content;
          if($result->choices[0]->finish_reason!="tool_calls"){
            // 如果不是function call 才紀錄歷史對話，不然在執行function時，會一直找過去的來回答，可能會出錯。
            DB::table("lineGPTLastAns")->insert([
              ["UUID"=>$UUID,"lastAns"=>$userContent,"role"=>"user","dateTime"=>DB::raw("now()")],
              ["UUID"=>$UUID,"lastAns"=>$textOutput,"role"=>"assistant","dateTime"=>DB::raw("now()")],
            ]);
          }
          if(isset($result->choices[0]->message->tool_calls[0])){
            foreach($result->choices[0]->message->tool_calls as $t){
              if($t->function->name=="func1"||$t->function->name=="func2"){
                $this->postFunc1($t->function->arguments);
              }
              else if($t->function->name=="func4"||$t->function->name=="func5"){
                $this->postFunc2($t->function->arguments);
              }
              else if($t->function->name=="func6"){
                $this->ReplyTextMsg("最近的高鐵站是：".json_decode($t->function->arguments)->station);
              }
              else if($t->function->name=="stockNoQ"){
                $this->stockNoQ($t->function->arguments);
              }
            }
          }
        }
      }
      else{
        // echo $resp;
        $textOutput = "Oops！我出了點問題，請聯絡我的管理員，謝謝。";
        Log::channel('MightyBot')->error($resp);
      }
    } catch (\Throwable $th) {
      //throw $th;
      $textOutput = "Oops！我出了點問題，請聯絡我的管理員，謝謝。";
      Log::channel('MightyBot')->error($th);
    }
    return $textOutput;
  }
  public function ImgGeneration($UUID,$userContent="")
  {
    $userContent = str_replace("產生圖片","",$userContent);
    $output = null;
    if($userContent==""){
      $this->ReplyTextMsg("請在關鍵字 產生圖片 後描述您想產生的圖片內容。");
      return $output;
    }
    try {
      $url = "https://api.openai.com/v1/images/generations";
      $ch = curl_init();	
      curl_setopt($ch, CURLOPT_URL,$url);
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //must have this
      curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);//for https	
      curl_setopt($ch, CURLOPT_HEADER, false);
      curl_setopt($ch, CURLOPT_TIMEOUT,60); 
      curl_setopt($ch, CURLOPT_HTTPHEADER, array(                                                                          
          "Content-Type: application/json",
          "Authorization: Bearer ".self::openAIKey
        )                                                                       
      );  
      curl_setopt($ch, CURLOPT_POSTFIELDS,json_encode([
        "model"=>"dall-e-2",
        // "quality"=>"standard",
        "prompt"=>$userContent,
        "n"=>1,
        "size"=>"512x512",
        "response_format"=>"url",
        // "style"=>"natural"
      ])); 
      $resp = curl_exec($ch);	
      $http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
      if($http_code==200){
        // Log::channel('MightyBot')->info($resp);
        $result = json_decode($resp);
        if($result->data[0]){
          $output = $result->data[0]->url;
        }else{
          $this->ReplyTextMsg("已達到產生圖片數量上限，請稍後再試。");
        }
      }
      else{
        $this->ReplyTextMsg("已達到產生圖片數量上限，請稍後再試。");
        // Log::channel('MightyBot')->info($resp);
      }
    } catch (\Throwable $th) {
      //throw $th;
      $this->ReplyTextMsg("Oops！我出了點問題，請聯絡我的管理員，謝謝。");
      Log::channel('MightyBot')->error($th);
    }
    return $output;
  }
  public function postFunc1($input=null)
  {
    if(!$input)return false;
    $input = json_decode($input);
    $key = $input->result;
    $hotKeyword = ["熱","高","溫","暖","炎","不夠冷","不夠低","開"];
    $coldKeyword = ["冷","低","涼","寒","凍","不夠熱","不夠高","關"];
    $status = 0;
    foreach($hotKeyword as $k){
      if(strpos($key,$k)!==false){
        $status = 1;
        break;
      }
    }
    if(!$status){
      foreach($coldKeyword as $k){
        if(strpos($key,$k)!==false){
          $status = 2;
          break;
        }
      }
    }
    if(isset($input->target)&&strpos($input->target,"扇")===false){
      $this->ReplyTextMsg("抱歉，我沒辦法幫你操作{$input->target}。");
      return false;
    }
    $r = DB::table("lineGPTControl")->where("deviceID","mtduino_1")->first();
    if($status==1){
      $this->ReplyTextMsg("好的，現在幫你開電風扇。");
      $r->lastStatus|=1;
    }else if($status==2){
      $this->ReplyTextMsg("好的，現在幫你關電風扇。");
      $r->lastStatus&=0xfffe;
    }else{
      $this->ReplyTextMsg("抱歉，我不知道您覺得熱還是冷，您可能要再精確地描述你的感覺。");
    }
    DB::table("lineGPTControl")->where("deviceID","mtduino_1")->update([
      "lastStatus"=>$r->lastStatus,
      "dateTime"=>DB::raw("now()")
    ]);
    $this->sendMessagetoDevice(["control"=>$r->lastStatus]);
  }
  public function postFunc2($input=null)
  {
    if(!$input)return false;
    $input = json_decode($input);
    $key = $input->result;
    $brightKeyword = ["亮","明","強","不夠暗","關燈","關"];
    $darkKeyword = ["暗","弱","不夠亮","開燈","開"];
    $status = 0;
    foreach($brightKeyword as $k){
      if(strpos($key,$k)!==false){
        $status = 1;
        break;
      }
    }
    if(!$status){
      foreach($darkKeyword as $k){
        if(strpos($key,$k)!==false){
          $status = 2;
          break;
        }
      }
    }
    if(isset($input->target)&&strpos($input->target,"燈")===false){
      $this->ReplyTextMsg("抱歉，我沒辦法幫你操作{$input->target}。");
      return false;
    }
    $r = DB::table("lineGPTControl")->where("deviceID","mtduino_1")->first();
    if($status==1){
      $this->ReplyTextMsg("好的，現在幫你關燈。");
      $r->lastStatus&=0xfffd;
    }else if($status==2){
      $this->ReplyTextMsg("好的，現在幫你開燈。");
      $r->lastStatus|=2;
    }else{
      $this->ReplyTextMsg("抱歉，我不知道您覺得亮還是暗，您可能要再精確地描述你的感覺。");
    }
    DB::table("lineGPTControl")->where("deviceID","mtduino_1")->update([
      "lastStatus"=>$r->lastStatus,
      "dateTime"=>DB::raw("now()")
    ]);
    $this->sendMessagetoDevice(["control"=>$r->lastStatus]);
  }
  public function stockNoQ($input=null)
  {
    if(!$input)return false;
    $input = json_decode($input);
    $stockNO = str_pad($input->stockNO,4,"0",STR_PAD_LEFT) ;
    $O = new StockBot();
    $data = $O->getStockInfo($stockNO,date("Ym01",time()+480*60-86400*150),date("Ym01",time()+480*60));
    if($data){
      $lastInfo = $data[sizeof($data)-1];
      $lastUpDown = "平盤";
      $diff = (float)$lastInfo['close'] - (float)$lastInfo['open'];
      if($diff>0){$lastUpDown="漲:".$diff;}
      elseif($diff<0){$lastUpDown="跌:".-$diff;}
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
          "Authorization: Bearer ".self::openAIKey
        )                                                                       
      );  
      curl_setopt($ch, CURLOPT_POSTFIELDS,json_encode([
        "model"=>"gpt-3.5-turbo",
        // "model"=>"gpt-4o",
        "max_tokens"=>4096,
        "temperature"=>0.5,
        "top_p"=>1,
        "presence_penalty"=>0,
        "frequency_penalty"=>0,
        "messages"=>[
          [
            "role"=>"system",
            "content"=>"你是股票技術分析師，你會根據 json 資料，計算下列數值，並呈現結果，但不要呈現計算過程：
            1. 5 20 60 日 移動平均。\n
            2. RSI。\n
            3. MACD。\n 
            4. Bollinger Bands。\n 
            5. Volume。\n 
            6. Support and Resistance Levels。\n 
            7. Moving Average Crossover。\n
            8. Elliott Wave Theory。\n
            9. ATR (Average True Range)。\n
            10. On-Balance Volume (OBV)。\n
            11. Parabolic SAR。\n
            12. KD。\n
            根據以上計算結果給予建議。\n
            回答的開頭用 '個股技術分析與建議: '。\n
            使用繁體中文。\n\n
            回答範本:
            個股技術分析與建議：

1. **移動平均線**：
   - 5日：70.38
   - 20日：70.70
   - 60日：69.87

2. **RSI**：目前RSI為49.53，處於中性區域。

3. **MACD**：
   - MACD線：-0.15
   - 信號線：-0.12
   - 當前處於負值，顯示弱勢。

4. **布林通道（Bollinger Bands）**：
   - 上軌：72.11
   - 中軌：70.70
   - 下軌：69.29

5. **交易量**：近期交易量波動較大，近期高點為20852851。

6. **支撐與阻力水平**：
   - 支撐：68.50、67.10
   - 阻力：72.50、74.40

7. **移動平均交叉（Moving Average Crossover）**：
   - 短期線與中期線交叉，近期無明顯黃金交叉或死亡交叉現象。

8. **艾略特波浪理論（Elliott Wave Theory）**：
   - 當前處於修正浪，短期內需觀察波浪結構的進一步發展。

9. **平均真實範圍（ATR）**：1.8，表示波動性一般。

10. **OBV（平衡交易量指標）**：近期有所上升，顯示資金略有回流。

11. **拋物線轉向指標（Parabolic SAR）**：目前顯示為空頭市場。

12. **KD指標**：
   - K值：45.67
   - D值：44.89
   - 處於中性區域，但有轉弱跡象。

**建議**：
目前市場處於震盪整理期，交易策略宜以觀望為主。短期內支撐位在68.50與67.10，如果跌破需關注風險控制。上方阻力位在72.50與74.40，若放量突破，或有進一步上漲空間。由於RSI處於中性偏弱，KD指標有轉弱跡象，建議謹慎操作，等待明確信號再進行操作。長期投資者可觀察基本面變化，短期波動可適當減倉或高拋低吸。
            \n\n------ 以下為json資料 ------\n\n"
          ],
          [
            "role"=>"user",
            "content"=>json_encode($data,JSON_UNESCAPED_UNICODE)
          ]
        ]],JSON_UNESCAPED_UNICODE)
      );
      $resp = curl_exec($ch);	
      $http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
      if($http_code==200){
        $result = json_decode($resp);
        if(isset($result->choices[0])){
          $this->ReplyTextMsg("{$lastInfo['date']}\n開盤價:{$lastInfo['open']}\n收盤價:{$lastInfo['close']}\n最高:{$lastInfo['highest']}\n最低:{$lastInfo['lowest']}\n$lastUpDown\n成交量:{$lastInfo['volume']}\n\n".$result->choices[0]->message->content);
        }else{
          $this->ReplyTextMsg("股票代碼：$stockNO");
        }
      }
      else{
        $this->ReplyTextMsg("股票代碼：$stockNO");
      }
    }
    else
      $this->ReplyTextMsg("股票代碼：$stockNO");
  }
  public function sendMessagetoDevice($data)
  {
    $mqtt = new phpMQTT("localhost",9074,comm_helper::uuid());
    $conn = false;
    $timeoutCnt = 0;
    while(!$conn){
      try {
        $conn = $mqtt->connect(true, NULL,"mqttaccount","mqttpasswd");
      } catch (\Throwable $th) {
        Log::channel("MightyBot")->error($th);
      }
      if(!$conn)sleep(1);
      $timeoutCnt++;
      if($timeoutCnt>30)break;
    }
    if($conn){
      $mqtt->publish("lineGPTControl",json_encode($data,JSON_UNESCAPED_UNICODE),1,false);
    }
  }
}
?>
