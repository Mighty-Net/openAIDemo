<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;


Route::group(['prefix' => "Iapi"], function () {
  Route::post('{method}', function (Request $request,$method){
    $validationExcept = [
      "signUp",
      "getActivation",
      "activateAccount",
      "forgotPassword",
      "loginCheck",
      "userValidation",
      "logout"
    ];
    $classname = "App\\Http\\Controllers\\internalApi\\ApiHandler";
    $Model = new $classname($request);
    if(method_exists($Model,$method)){
      try {
        if(in_array($method,$validationExcept)===false){
          $r = call_user_func(array($Model,"userValidation"),true);
          if($r)return $r;
        }
        return call_user_func(array($Model,$method));
      } catch (\Throwable $th) {
        Log::channel("internalApi")->error("[ApiHandler][$method]\n$th\n");
        return Response::make("{\"status\":-999,\"message\":\"Internal Server Error\"}",500,["Content-Type" => "application/json"]);
      }
    }
    else{
      Log::channel("internalApi")->info("[ApiHandler][method not found][Route][$method]\n");
      return Response::make("{\"status\":-998,\"message\":\"method not found\"}",404,["Content-Type" => "application/json"]);
    }
  });
});
  
  
