'use strict';
import serverComm from "./serverComm";
import store from '../redux/store'

export async function accountLoginCheck(data)
{
  if(g_serverCommError)return{payload:null}
  const NetWorking = new serverComm("/Iapi/loginCheck","POST",JSON.stringify(data));
  let response = await NetWorking.fetch();
  // console.log(response)
  ResponseErrorCheck(response);
  return response;
}

export async function userValidation()
{
  if(g_serverCommError)return{payload:null}
  const NetWorking = new serverComm("/Iapi/userValidation","POST",JSON.stringify({}));
  let response = await NetWorking.fetch();
  // console.log(response)
  ResponseErrorCheck(response);
  return response;
}
export async function EmbeddingsTransform(data)
{
  if(g_serverCommError)return{payload:null}
  const NetWorking = new serverComm("/Iapi/EmbeddingsTransform","POST",JSON.stringify(data));
  let response = await NetWorking.fetch();
  // console.log(response)
  ResponseErrorCheck(response);
  return response;
}
export async function SaveSystemPrompt(data)
{
  if(g_serverCommError)return{payload:null}
  const NetWorking = new serverComm("/Iapi/SaveSystemPrompt","POST",JSON.stringify(data));
  let response = await NetWorking.fetch();
  // console.log(response)
  ResponseErrorCheck(response);
  return response;
}
export async function getEmbeddings(data)
{
  if(g_serverCommError)return{payload:null}
  const NetWorking = new serverComm("/Iapi/getEmbeddings","POST",JSON.stringify(data));
  let response = await NetWorking.fetch();
  // console.log(response)
  ResponseErrorCheck(response);
  return response;
}
export async function getEmbeddingDetail(data)
{
  if(g_serverCommError)return{payload:null}
  const NetWorking = new serverComm("/Iapi/getEmbeddingDetail","POST",JSON.stringify(data));
  let response = await NetWorking.fetch();
  // console.log(response)
  ResponseErrorCheck(response);
  return response;
}
export async function deleteEmbeddings(data)
{
  if(g_serverCommError)return{payload:null}
  const NetWorking = new serverComm("/Iapi/deleteEmbeddings","POST",JSON.stringify(data));
  let response = await NetWorking.fetch();
  // console.log(response)
  ResponseErrorCheck(response);
  return response;
}
export async function promptCast(data)
{
  if(g_serverCommError)return{payload:null}
  const NetWorking = new serverComm("/Iapi/promptCast","POST",JSON.stringify(data));
  let response = await NetWorking.streamFetch();
  console.log(response)
  // ResponseErrorCheck(response);
  return response;
}










function ResponseErrorCheck(response,supress)
{
  let errorTitle = null,errorDetail = null;
  let needRelogin = false;
  try {
    // console.log(response)
    if(response.status>=500&&response.status<600){ // server fault
      g_serverCommError = true;
      errorTitle = Helper.trans("miscellaneous.ServerFault");
      errorDetail = Helper.trans("miscellaneous.PleaseContactService");
    }
    else if(response.status==-999){
      g_serverCommError = true;
      errorTitle = Helper.trans("miscellaneous.ErrorText");
      errorDetail = Helper.trans("miscellaneous.ErrocodeText")+": -999\n"+response.msg;
      if(response.msg=="Network request failed"){
        errorTitle = Helper.trans("miscellaneous.ServerTimeout");
        errorDetail = Helper.trans("miscellaneous.PleaseCheckInternetConnection");
      }
    }
    else if(response.status==999){
      g_serverCommError = true;
      errorTitle = Helper.trans("miscellaneous.ServerTimeout");
      errorDetail = Helper.trans("miscellaneous.PleaseCheckInternetConnection");
    }
    else if(response.status!=0){
      g_serverCommError = true;
      errorTitle = Helper.trans("miscellaneous.ErrorText");
      errorDetail = statusMessage(response.status);
      // console.log(errorTitle,errorDetail)
      // console.log(supress,response);
      if(supress){g_serverCommError = false;}
      if(response.status==105||response.status==107)needRelogin = true;
    }
  } catch (error) {
    console.error(error)
    g_serverCommError = true;
    errorTitle = Helper.trans("miscellaneous.ErrorText");
    errorDetail = Helper.trans("miscellaneous.ErrocodeText")+": -60741"; // javascript error
  }
  
  if(g_serverCommError&&errorDetail&&errorTitle){
    setDialog({title:errorTitle,des:errorDetail});
    setDialogVisible(true);
    if(needRelogin){
      g_onDialogComfirmHandler=()=>{
        g_onDialogComfirmHandler = ()=>{};
        g_onDialogCancelHandler = ()=>{};
        setDialogVisible(false);
        window.location.href = "/"
      }
    }
  }
  return false;
}

function statusMessage(status_code)
{
  switch (status_code) {
    case 101:
      //ACCOUNT_NOT_FIND
      return Helper.trans("SystemMsg.AccountNotFound");
    break;
    case 102:
      //Invalid Passwd
      return Helper.trans("SystemMsg.LoginInvalidEmailOrPassword");
    break;
    case 103:
      //not activate
      return Helper.trans("SystemMsg.AccountNotActivate");
    break;
    case 104:
      //not allowaccess
      return Helper.trans("SystemMsg.AccountDisable");
    break;
    case 105:
      // token expired
      return Helper.trans("ErrorCode.notvalidtoken");
    break;
    case 106:
      // account taken
      return Helper.trans("SystemMsg.AccountTaken");
    break;
    case 107:
      // login somewhere else
      return Helper.trans("SystemMsg.LoginSomewhereElse");
    break;
    default:
      return Helper.trans("SystemMsg.UnknowError") + status_code + ")";
    break;
  }
}
