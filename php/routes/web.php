<?php


use Illuminate\Http\Request;



Route::get('{path?}',function(Request $request,$path=null){
  if($path!="dl")return view('iotPortal');
  else{
    
  }
})->where('path', '.+');










