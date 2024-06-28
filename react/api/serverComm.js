// 'use strict';

export default class serverComm {
  constructor(url,method,request) {
    this.url = url;
    this.method = method;
    request = JSON.parse(request)
    request.timeOffset = g_timeoffset;  
    this.request = JSON.stringify(request);
    this.data = request;
  }
  fetch=(auth)=>{
    return new Promise(resolve => {
      const controller = new AbortController();
      let timeout = g_serverTimeout; //timeout in ms
      let httpcode = 999;
      setTimeout(() => {controller.abort();},timeout);
      let headers = {
        "X-CSRF-TOKEN":g_csrfToken,
        "Accept": 'application/json',
        'Content-Type':'application/json'
      };
      if(auth){
        headers['Authorization'] = "Bearer "+auth;
      }
      if(this.method.search(/get/i)==-1){
        // console.log(this.url)
        fetch(this.url,{
          method: this.method.toUpperCase(),
          headers: headers,
          body:this.request,
          signal:controller.signal
        }).then((response) => {
          httpcode = response.status;
          // console.log(response)
          // if(response.status==200)
            return response.json()
          // else {
          //   resolve({status:"-999"});
          // }
        }).then((json) => {
          if(httpcode==200)resolve(json);
          else{
            resolve({status:httpcode,msg:"ServerFault"});
          }
        }).catch((error) => {
          // console.log(error,this.url)
          if(error.name=="AbortError"){
            resolve({status:999,msg:"Abort"});
          }
          else{
            resolve({status:-999,msg:error.message});
          }
          resolve(error);
        });
      }
      else{
        const queryString = Object.keys(this.data).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(this.data[key])}`).join('&');
        if(queryString)this.url = this.url+"?"+queryString;
        fetch(this.url,{
          signal:controller.signal,
          headers: headers}).then((response) => {
            httpcode = response.status;
            return response.json();
        })
        .then((json) => {
          resolve({status:httpcode,payload:json});
        })
        .catch((error) => {
          // console.log(error)
          if(error.name=="AbortError"){
            resolve({status:999});
          }
          else{
            resolve({status:-999,msg:error.message});
          }
          resolve(error);
        });
      }  
    });
  }
  formDataFetch=(auth,files)=>{
    return new Promise(resolve => {
      const controller = new AbortController();
      let timeout = g_serverTimeout; //timeout in ms
      let httpcode = 999;
      const formData = new FormData();
      Object.keys(this.data).forEach(key => {
        formData.append(key,this.data[key]);
      });
      if(files.length>0){
        files.forEach((file,index) => {
          // console.log(file)
          formData.append(`files[]`,{
            uri:file.uri,
            type:file.type,
            name:file.fileName
          });
        });
      }
      // console.log(formData)
      // resolve({status:200,msg:formData});return false;

      setTimeout(() => {controller.abort();},timeout);
      let headers = {
        "X-CSRF-TOKEN":g_csrfToken,
        "Accept": 'application/json',
        'Content-Type':'multipart/form-data'
      };
      if(auth){
        headers['Authorization'] = "Bearer "+auth;
      }
      fetch(this.url,{
        method:"POST",
        headers: headers,
        body:formData,
        signal:controller.signal
      }).then((response) => {
        httpcode = response.status;
          return response.json()
      }).then((json) => {
        if(httpcode==200)resolve(json);
        else{
          resolve({status:httpcode,msg:"ServerFault"});
        }
      }).catch((error) => {
        // console.log(error)
        if(error.name=="AbortError"){
          resolve({status:999,msg:"Abort"});
        }
        else{
          resolve({status:-999,msg:error.message});
        }
        resolve(error);
      });
    });
  }
}
