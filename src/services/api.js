import RNFetchBlob from 'rn-fetch-blob';
var uuid = require('react-native-uuid');
//var urlhelpers = require('url-parse');
var CryptoJS = require('crypto-js');
import {HttpModel} from "../actions/types";
import type {ApiConfig, ApiToken} from '../actions/types';
import JSONbig from 'json-bigint';



const _Get = "GET";
const _Post = "POST";
const _Put = "PUT";
const _Delete = "DELETE";

export default class Api{

    _Api: ApiConfig;
    _ApiToken: ApiToken;

    constructor (config: ApiConfig, configToken: ApiToken) {
      this._Api = config;
      this._ApiToken = configToken;
    }
    UpdateDeviceId(id){
      if(this._ApiToken && id)
        this._ApiToken.devId = id;

    }
    Url( controller:string='', id: string = '', action:string = '', params:object):string
    {
      let url;
      url =  this._baseUrl(controller, id, action);
      if(!params)
        return url;

      if(params){
        var qs = "";
        for(var key in params) {
          var value = params[key];
          if(value !== undefined)
            qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
        }
        if (qs.length > 0){
          qs = qs.substring(0, qs.length-1); //chop off last "&"
          url = url + "?" + qs;
        }

      }
      return url;
    }
    _baseUrl( controller:string='', id: string = '', action:string = ''):string{
      let ver =this._Api.Version;
      let urlbase: string = this._Api.Url; //+ ((ver ==='' || ver=== undefined)?'' : ('/' + ver) );
      if( !controller || controller === '')
        return urlbase
      if( !id || id ==='') {
        if (action)
          return urlbase + '/' + controller + '/' + action
        return urlbase + '/' + controller
      }
      if(!action || action ==='')
        return urlbase + '/' + controller + '/' + id;
      return urlbase + '/' + controller + '/' + id + '/' + action;
    }
    _defaultHeader( appid){
      let version =this._Api.Version;
      var headers = new Headers();
      headers.append("AppID", appid);
      headers.append("Accept", 'application/json');
      headers.append("Content-Type", 'application/json');
      if( !version || version.length == 0)
        version = '1.0.0';
      headers.append("version", version);

      return headers;
    }

    async _getApiKey( controller:string) {

      try {

        let header = this._defaultHeader( this._Api.AppId);
        let url = this._baseUrl(controller);
        console.log(url);
        let response = await fetch(url, { method: _Get, headers: header});

        if (response.status == 200 ) {
          let header = response.headers;
          let sid = header.get('SID');
          let arrayOfStrings = sid.split(':');
          this._ApiToken.Id = arrayOfStrings[0];
          this._ApiToken.ApiKey = arrayOfStrings[1];
        }
        return response;

      } catch(ex){
        return { status : undefined};
      }
    }
    async _Login( _uid, _pass){

      let header = this._defaultHeader( this._Api.AppId);
      //header.SID = this.ApiToken.Id;
      header.set('SID',  this._ApiToken.Id);
      let url = this._baseUrl('account');
      var body = JSON.stringify( {UserName : _uid, Password: _pass} );
      let response = await fetch(url, { method: _Post, headers: header, timeout: 30000, body : body} );
      if( response.status == 200){
        header = response.headers;
        var raw_token = header.get('www-authenticate');
        var hindex = raw_token.indexOf('3rd-auth ');
        if( hindex >=0)
          raw_token = raw_token.substr( hindex +  '3rd-auth '.length);
        this._ApiToken.Token = raw_token;
      }
      return response;
    }
    Token( method: string, url: string, jsoncontent: string)
    {
      let _method = _Get;
      if(method != undefined && method != null)
        _method = method;
      let token = this._generateToken(this._Api.AppId, _method, url, jsoncontent);
      let header = this._defaultHeader( this._Api.AppId);
      header.set('Authorization', '3rd-auth ' + token);
      return header;
    }
    _generateToken(appid: string, method: string, url:string, content: string =''){
      let requestContentBase64String = '';
      //console.log(url);
      let url_enc = encodeURIComponent(url).toLocaleLowerCase();
      let requestHttpMethod = method;
      var today = new Date();
      var guid = uuid.v1();
      var request_content = content != '' ? CryptoJS.enc.Base64.stringify(CryptoJS.MD5(content)) : content;
      var raw_string = appid + requestHttpMethod + url_enc + today.getTime().toString() + guid.toString() + request_content;
      var buff = CryptoJS.enc.Utf8.parse(raw_string);
      var buff_key = CryptoJS.enc.Utf8.parse(this._ApiToken.ApiKey);
      var hmac = CryptoJS.HmacSHA256(buff, buff_key);
      var base64String = CryptoJS.enc.Base64.stringify(hmac);
      var token = this._Api.AppId + ':' + base64String  + ':' + guid.toString() + ':' + today.getTime().toString() + ':' + this._ApiToken.Token;
      return token;
    }
    _RNFetchBlob( url:string, requestmoethod, body :string): StatefulPromise<FetchBlobResponse>{

      let token = this._generateToken(this._Api.AppId, requestmoethod, url, body);

      let header = {
        'Authorization': '3rd-auth ' + token,
        'AppID' : this._Api.AppId,
        'Content-Type': 'application/json'
      };
        //console.log('url:' + url);
        //console.log('token:' + token);
      if( body === null || body === undefined)
        return RNFetchBlob.fetch(requestmoethod, url, header);
      else
        return RNFetchBlob.fetch(requestmoethod, url, header, body);
    }
    _Fetch( url:string, requestmoethod, body :string): Promise<Response> {

      let token = this._generateToken(this._Api.AppId, requestmoethod, url, body);
      let header = this._defaultHeader( this._Api.AppId);
      header.set('Authorization', '3rd-auth ' + token);
      if(this._ApiToken && this._ApiToken.devId)
        header.set('devId', this._ApiToken.devId);
      let response = null;
      if( body === null || body === undefined)
        return fetch(url, { method: requestmoethod, headers: header} )

      else
        return fetch(url, { method: requestmoethod, headers: header, body : body} )

    }
    Base64HmacSHA256(raw_string){
      let hmac = this.HmacSHA256(raw_string);
      if( !hmac)
        return;
      var base64String = CryptoJS.enc.Base64.stringify(hmac);
      return base64String;
    }
    HmacSHA256(raw_string){
      if( !raw_string || !this._ApiToken || !this._ApiToken.ApiKey)
        return;

      var buff = CryptoJS.enc.Utf8.parse(raw_string);
      var buff_key = CryptoJS.enc.Utf8.parse(this._ApiToken.ApiKey);
      var hmac = CryptoJS.HmacSHA256(buff, buff_key);
      return hmac;
    }
    async GetBase64Stream(controller: string, id:string = '',action:string ='', params:object)
    {
      let url = this._baseUrl(controller, id, action);
      if(params){

        var qs = "";
        if( params){
          for(var key in params) {
            var value = params[key];
            qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
          }
        }

        if (qs.length > 0){
          qs = qs.substring(0, qs.length-1); //chop off last "&"
          url = url + "?" + qs;
        }

      }

      let requestHttpMethod = _Get;
      try
      {
        let request = this._RNFetchBlob(url, requestHttpMethod)

        return request.then( (res) =>{
          if(res.respInfo.status === 200)
            return {
              status: res.respInfo.status,
              data:   res.type == "base64"? res.base64() :  res.text()
            };
          else
          {
            //console.log('Unauthorize');
            return {
              status: res.respInfo.status,
              data: null
            };

          }

        }).catch((errorMessage, statusCode) => {
          // error handling
          return{
            status: statusCode,
            data: null
          };
        })


        // if( response.respInfo.status == 204 )
        //     console.log(response);
        // return{
        //         status: response.respInfo.status,
        //         data:   response.type == "base64"? response.base64() :  response.text()
        //     }
      }
      catch( e){
        console.log(e);
      }
    }
    _toResponseData(response){
      if( response){
        if( response.ok){
          //return response.bodyUsed? response.json(): '';
          return response.text().then(
            function(data)
            {
              if( data)
                return JSONbig.parse(data);
              else return{};
            }
          );
        }
        else {
          return {  response: response,
            error: response.status
          };
        }
      }
      else {
        return {  response: response,
          error: 404
        };
      }
    }
    GetUrlObject(controller: string, id:string = '',action:string ='', params:object){
      let uri = this.Url(controller, id, action, params);
      let requestHttpMethod = _Get;
      let token = this._generateToken(this._Api.AppId, requestHttpMethod, uri);
      let header = this._defaultHeader( this._Api.AppId);
      header.set('Authorization', '3rd-auth ' + token);
      if(this._ApiToken && this._ApiToken.devId)
        header.set('devId', this._ApiToken.devId);
      return { uri, header, method: requestHttpMethod};
    }
    async Get(controller: string, id:string = '',action:string ='', params:object){
      let response = await this._Get(controller, id, action, params);
      return this._toResponseData(response);
      // if( response.ok){
      //     //return response.bodyUsed? response.json(): '';
      //     return response.json().then(
      //       function(data){
      //         return {status: 200,
      //         data: data};
      //       }
      //     );
      // }
      // else {
      //   return {  response: response,
      //             status: response.status
      //           };
      // }

    }

    _Get(controller: string, id:string = '',action:string ='', params:object): Promise<Response> {
      // let requestContentBase64String = '';
      // let url = this._baseUrl(controller, id, action);
      // if(params){
      //
      //     var qs = "";
      //     for(var key in params) {
      //         var value = params[key];
      //         qs += key + "=" + encodeURIComponent(value) + "&";
      //     }
      //     if (qs.length > 0){
      //         qs = qs.substring(0, qs.length-1); //chop off last "&"
      //         url = url + "?" + qs;
      //     }
      //
      // }
      let url = this.Url(controller, id, action, params);
      let requestHttpMethod = _Get;
      return  this._Fetch(url, requestHttpMethod);

    }

    async Post(controller: string, id:string='',action:string='',value: object= null){
      let url = this._baseUrl(controller, id, action);
      let requestHttpMethod = _Post;
      let request_content = (value === null || value === undefined) ? '' : JSON.stringify(value);
      // let token = this._generateToken(this._Api.appId, requestHttpMethod, url, request_content);
      // let header = this._defaultHeader( this._Api.appId);
      // header.set('Authorization', '3rd-auth ' + token);
      //let response = await fetch(url, { method: requestHttpMethod, headers: header, body : request_content} );
      let response = await this._Fetch(url, requestHttpMethod, request_content);
      // if( response.ok){
      //   return response.bodyUsed? response.json(): '';
      // }
      // else {
      //   response;
      // }
      return this._toResponseData(response);
    }

    async Put(controller: string, id:string='',action:string='', value: object= null){
      let url = this._baseUrl(controller, id, action);
      let requestHttpMethod = _Put;
      let request_content = (value === null || value === undefined) ? '' : JSON.stringify(value);
      // let token = this._generateToken(this._Api.appId, requestHttpMethod, url, request_content);
      // let header = this._defaultHeader( this._Api.appId);
      // header.set('Authorization', '3rd-auth ' + token);
      //let response = await fetch(url, { method: requestHttpMethod, headers: header, body : request_content} );
      //let response = await fetch(url, { method: requestHttpMethod, headers: header, body : request_content} );
      let response = await this._Fetch(url, requestHttpMethod, request_content);
      // if( response.ok)
      // {
      //   return response.bodyUsed? response.json(): '';
      // }
      // else
      //   return response;
      return this._toResponseData(response);

    }
    async Delete(controller: string, id:string='',action:string='', value: object= null){
      let url = this._baseUrl(controller, id, action);
      let requestHttpMethod = _Delete;
      let request_content = (value === null || value === undefined) ? '' : JSON.stringify(value);
      // let token = this._generateToken(this._Api.appId, requestHttpMethod, url, request_content);
      // let header = this._defaultHeader( this._Api.appId);
      // header.set('Authorization', '3rd-auth ' + token);
      // let response = await fetch(url, { method: requestHttpMethod, headers: header, body : request_content} );
      let response = await this._Fetch(url, requestHttpMethod, request_content);
      return this._toResponseData(response);
      // if(response.ok){
      //
      //     return response.bodyUsed? response.json(): '';
      // }
      // else {
      //   return response;
      // }
      //return response.status == 200?(response._bodyBlob.size?response.json() : '') : response;
    }

    async Login( username, pass) : HttpModel
    {
      try {
        let response = await this._getApiKey('account');
        if( response.status != 200)
        {
          return { status : response.status, Result: undefined};
        }
        var AES = require("crypto-js/aes");
        let  enc_user = AES.encrypt( username, this._ApiToken.ApiKey );
        let uid = enc_user.toString();
        enc_user = AES.encrypt( pass, this._ApiToken.ApiKey );
        let pas =  enc_user.toString();
        let res = await this._Login(uid, pas);
        //response =  await this.GetDVRs();

        if (res.status == 200 ) {
          var rs = await res.json();
          return { status : res.status, Result: rs};
          //console.log(rs);
        } else {
          return res; //{ status : res.status, Result: undefined};
        }
      } catch(ex){
        console.log('GOND LOGIN Exception: ', ex)
        return { status : undefined, Result: undefined};
      }

    }

    _connectionSignalRdone()
    {
      console.log("Signal Connect");
    }

    _connectionSignalRfail(error: any ){
      console.log("Signal Fail");
      console.log(error);
    
    }

 
    async GetFileStream(controller: string, id:string = '',action:string ='', params:object)
    {
      // let requestContentBase64String = '';
      let url = this._baseUrl(controller, id, action);
      if(params){

        var qs = "";
        for(var key in params) {
          var value = params[key];
          qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
        }
        if (qs.length > 0){
          qs = qs.substring(0, qs.length-1); //chop off last "&"
          url = url + "?" + qs;
        }

      }
      //let response = await this._Fetch(url, requestHttpMethod);
      let appId = this._Api.AppId;
      let token = await this._generateToken(this._Api.AppId, _Get, url);
      let header = await this._defaultHeader( this._Api.AppId);
      header.set('Authorization', '3rd-auth ' + token);


      return new Promise(function(resolve, reject){
        setTimeout(function() {
          RNFetchBlob.fetch(_Get, url, {
            'Authorization': '3rd-auth ' + token,
            'AppID': appId.toString(),
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          })
          // when response status code is 200
            .then((res) =>
              resolve(res.base64())

            )
          // Status code is not 200
            .catch((errorMessage, statusCode) => {
              // error handling
              reject(errorMessage);
            }).done();
        }, 1);});

    }

}
