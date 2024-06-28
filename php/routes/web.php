<?php

use App\Http\Controllers\LineHook\LineGPT;
use Illuminate\Http\Request;

Route::post('/linegpt', function (Request $request) {
  if(isset($request['events'][0])){
    $LineHook = new LineGPT($request,"accessKey","secret");
    $LineHook->IncommingMsgProccess();
  }
  return response("{\"status\":0}",200);
});

Route::get('{path?}',function(Request $request,$path=null){
  if($path!="dl")return view('iotPortal');
  else{
    
  }
})->where('path', '.+');










