'use strict';
import server_comm from "./serverComm";
import EncryptedStorage from 'react-secure-storage';
import {useCallback} from "react";

export function numberFormat(n,c, d, t){
  c = isNaN(c = Math.abs(c)) ? 0 : c;
  d = d == undefined ? "." : d; 
  t = t == undefined ? "," : t; 
  var s = n < 0 ? "-" : "";
  var i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c)));
  var j = (j = i.length) > 3 ? j % 3 : 0;
 return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};  
// export function debounce (func, delay){
//   let timer;if(!delay)delay = 200;
//   return function(...args) {
//     clearTimeout(timer); //因為每次進來都會清除，所以會有debounce的效果。
//     timer = setTimeout(() => {func.apply(this, args);},delay);
//   };
// }
export const throttle = (func, delay) => {
  // 要用event的形式才有效果
  // onChange={Helper.throttle(()=>{},200)}  OK
  // onChange={()=>Helper.throttle(()=>{},200)}  FAIL
  // 第二種，每次都會重新載入function，等於沒有效果。
  let throttling = false;if(!delay)delay = 200;
  return (...args) => {
    if (!throttling) {
      throttling = true;
      func(...args);
      setTimeout(() => {
        throttling = false;
      }, delay);
    }
  };
};
export const debounce = (func, delay) => {
  // 要用event的形式才有效果
  // onChange={Helper.debounce(()=>{},200)}  OK
  // onChange={()=>Helper.debounce(()=>{},200)}  FAIL
  // 第二種，每次都會重新載入function，等於沒有效果。
  let timeoutId;if(!delay)delay = 200;
  return (...args) => {
    clearTimeout(timeoutId); //因為每次進來都會清除，所以會有debounce的效果。
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

export function trans(trans_ind)
{
  const transArray = trans_ind.split(".");
  try {
    // return g_LangArray[transArray[0]]["en"][transArray[1]];
    return g_LangArray[transArray[0]][g_Lang][transArray[1]];
  } catch (error) {
    return g_LangArray[transArray[0]]["en"][transArray[1]];
  }
}
export function wait(timeout) 
{
  return new Promise(resolve => setTimeout(resolve, timeout));
}   
export function datetimeformatting(t) 
{
  if(!t)return "";
  let time = new Date(t);
  let m = time.getMonth()+1;m=m<10?("0"+m):m;
  let d = time.getDate();d=d<10?("0"+d):d;
  let H = time.getHours();H=H<10?("0"+H):H;
  let i = time.getMinutes();i=i<10?("0"+i):i;
  return time.getFullYear()+"/"+m+"/"+d+" "+H+":"+i;
}
export function datetimeSformatting(t) 
{
  if(!t)return "";
  let time = new Date(t);
  let m = time.getMonth()+1;m=m<10?("0"+m):m;
  let d = time.getDate();d=d<10?("0"+d):d;
  let H = time.getHours();H=H<10?("0"+H):H;
  let i = time.getMinutes();i=i<10?("0"+i):i;
  let s = time.getSeconds();s=s<10?("0"+s):s;
  return time.getFullYear()+"/"+m+"/"+d+" "+H+":"+i+":"+s;
}
export function dateformatting(t) 
{
  if(!t)return "";
  let time = new Date(t);
  let m = time.getMonth()+1;m=m<10?("0"+m):m;
  let d = time.getDate();d=d<10?("0"+d):d;
  return time.getFullYear()+"/"+m+"/"+d;
}
export function dateformattingSTD(t) 
{
  if(t=="")return "";
  return t.substring(0,4)+"-"+t.substring(5,7)+"-"+t.substring(8,10)+" 00:00:00";
}
export function emailValidate(t)
{
  var validRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return t.match(validRegex);
}
export async function StoreLocalData(key,value) 
{
  try {
    await EncryptedStorage.setItem(key,value);
  } catch (e) {
    // saving error
    // console.log(e)
  }
}
export async function GetLocalData(key) 
{
  try {
    const value = await EncryptedStorage.getItem(key);
    return value!=null?value:null;
  } catch(e) {
    // error reading value
  }
}
export async function RemoveLocalData(key) {
  try {
    await EncryptedStorage.removeItem(key);
    return true;
  }
  catch(e) {
    return false;
  }
}
export function ThemeModeChange()
{
  Helper.GetLocalData("ThemeMode").then((r)=>{
    if(r!=null){
      if(r==0){
        let hour = new Date().getHours();
        if(hour>5&&hour<18){
          setThemeMode("light")
        }
        else{
          setThemeMode("dark")
        }
      }
      else if(r==1){
        setThemeMode("light")
      }
      else if(r==2){
        setThemeMode("dark")
      }
    }
    else{
      setThemeMode('light');
      Helper.StoreLocalData("ThemeMode","1");
    }
  });
}
export function redolveBarcode(code)
{
  let array = code.split(";");
  return array[1]?{UID:array[1],material_id:array[0]}:null
}

export function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};
export function passwdChecker(password) {
  var strength = 0;
  if(password.match(/[a-z]+/)) {
    strength += 1;
  }
  if(password.match(/[A-Z]+/)) {
    strength += 1;
  }
  if(password.match(/[0-9]+/)) {
    strength += 1;
  }
  if(password.match(/[$@#&!]+/)) {
    strength += 1;
  }
  return strength;
};

export function naviSelect(id)
{
  document.querySelectorAll('.naviItem').forEach((selector)=>{
    if(selector.id==id)
      selector.classList.add("select");
    else
      selector.classList.remove("select");
  });
}
export function addClass(selector,className)
{
  const newClass = className.split(" ");
  newClass.forEach((className)=> {
    selector.classList.add(className);
  });
}
export function removeClass(selector,className)
{
  const newClass = className.split(" ");
  newClass.forEach((className)=> {
    selector.classList.remove(className);
  });
}

