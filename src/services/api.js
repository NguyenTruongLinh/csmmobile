import RNFetchBlob from 'rn-fetch-blob';
import uuid from 'react-native-uuid';
//var urlhelpers = require('url-parse');
import CryptoJS from 'crypto-js';
import {HttpModel} from '../actions/types';
import JSONbig from 'json-bigint';
import AES from 'crypto-js/aes';

const _get = 'GET';
const _Post = 'POST';
const _Put = 'PUT';
const _Delete = 'DELETE';

class Api {
  // constructor(config, configToken) {
  //   this._Api = config;
  //   this._ApiToken = configToken;
  // }

  constructor() {
    this.config = {
      url: '',
      appId: '',
      version: '',
    };
    this.configToken = {
      id: '',
      apiKey: '',
      token: '',
      devId: '',
      userId: '0',
    };
  }

  // TODO: get config from userStore
  updateConfig(config, configToken) {
    this.config = config;
    this.configToken = configToken;
  }

  getConfig() {
    return {config: this.config, configToken: this.configToken};
  }

  updateDeviceId(id) {
    if (this.configToken && id) this.configToken.devId = '' + id;
  }

  updateUserId(uid) {
    if (this.configToken && uid) this.configToken.userId = '' + uid;
  }

  _url(controller = '', id = '', action = '', params) {
    let url;
    url = this._baseUrl(controller, id, action);
    if (!params) return url;

    if (params) {
      var qs = '';
      for (var key in params) {
        var value = params[key];
        if (value !== undefined)
          qs += encodeURIComponent(key) + '=' + encodeURIComponent(value) + '&';
      }
      if (qs.length > 0) {
        qs = qs.substring(0, qs.length - 1); //chop off last "&"
        url = url + '?' + qs;
      }
    }
    return url;
  }

  _baseUrl(controller = '', id = '', action = '') {
    let ver = this.config.version;
    let urlbase = this.config.url; //+ ((ver ==='' || ver=== undefined)?'' : ('/' + ver) );
    if (!controller || controller === '') return urlbase;
    if (!id || id === '') {
      if (action) return urlbase + '/' + controller + '/' + action;
      return urlbase + '/' + controller;
    }
    if (!action || action === '') return urlbase + '/' + controller + '/' + id;
    return urlbase + '/' + controller + '/' + id + '/' + action;
  }

  _defaultHeader(appid) {
    let version = this.config.version;
    var headers = new Headers();
    headers.append('AppID', appid);
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    if (!version || version.length == 0) version = '1.0.0';
    headers.append('version', version);

    return headers;
  }

  async _getApiKey(controller) {
    try {
      let header = this._defaultHeader(this.config.appId);
      let url = this._baseUrl(controller);
      console.log(url);
      let response = await fetch(url, {method: _get, headers: header});

      if (response.status == 200) {
        let header = response.headers;
        let sid = header.get('SID');
        let arrayOfStrings = sid.split(':');
        this.configToken.id = arrayOfStrings[0];
        this.configToken.apiKey = arrayOfStrings[1];
      }
      return response;
    } catch (ex) {
      return {status: undefined};
    }
  }

  async _login(_uid, _pass) {
    let header = this._defaultHeader(this.config.appId);
    //header.SID = this.ApiToken.Id;
    header.set('SID', this.configToken.id);
    let url = this._baseUrl('account');
    var body = JSON.stringify({UserName: _uid, Password: _pass});
    let response = await fetch(url, {
      method: _Post,
      headers: header,
      timeout: 30000,
      body: body,
    });
    if (response.status == 200) {
      header = response.headers;
      var raw_token = header.get('www-authenticate');
      var hindex = raw_token.indexOf('3rd-auth ');
      if (hindex >= 0)
        raw_token = raw_token.substr(hindex + '3rd-auth '.length);
      this.configToken.token = raw_token;
    }
    return response;
  }

  // Token(method, url, jsoncontent) {
  //   let _method = _get;
  //   if (method != undefined && method != null) _method = method;
  //   let token = this._generateToken(this.config.appId, _method, url, jsoncontent);
  //   let header = this._defaultHeader(this.config.appId);
  //   header.set('Authorization', '3rd-auth ' + token);
  //   return header;
  // }

  _generateToken(appid, method, url, content = '') {
    //console.log(url);
    let url_enc = encodeURIComponent(url).toLocaleLowerCase();
    let requestHttpMethod = method;
    let today = new Date();
    let guid = uuid.v1();
    let request_content =
      content != ''
        ? CryptoJS.enc.Base64.stringify(CryptoJS.MD5(content))
        : content;
    let raw_string =
      appid +
      requestHttpMethod +
      url_enc +
      today.getTime().toString() +
      guid.toString() +
      request_content;
    let buff = CryptoJS.enc.Utf8.parse(raw_string);
    let buff_key = CryptoJS.enc.Utf8.parse(this.configToken.apiKey);
    let hmac = CryptoJS.HmacSHA256(buff, buff_key);
    let base64String = CryptoJS.enc.Base64.stringify(hmac);
    let token =
      this.config.appId +
      ':' +
      base64String +
      ':' +
      guid.toString() +
      ':' +
      today.getTime().toString() +
      ':' +
      this.configToken.token;
    return token;
  }

  _fetchBlob(url, reqMethod, body) {
    let token = this._generateToken(this.config.appId, reqMethod, url, body);

    let header = {
      Authorization: '3rd-auth ' + token,
      AppID: this.config.appId,
      'Content-Type': 'application/json',
    };
    // __DEV__ && console.log('_fetchBlob header: ', header);
    //console.log('token:' + token);
    if (body === null || body === undefined)
      return RNFetchBlob.fetch(reqMethod, url, header);
    else return RNFetchBlob.fetch(reqMethod, url, header, body);
  }

  _fetch(url, reqMethod, body) {
    let token = this._generateToken(this.config.appId, reqMethod, url, body);
    let header = this._defaultHeader(this.config.appId);
    header.set('Authorization', '3rd-auth ' + token);
    if (this.configToken && this.configToken.devId)
      header.set('devId', this.configToken.devId);
    __DEV__ && console.log('api::_fetch url: ', url, 'body: ', body);
    if (body === null || body === undefined)
      return fetch(url, {method: reqMethod, headers: header});
    else return fetch(url, {method: reqMethod, headers: header, body: body});
  }

  base64HmacSHA256(raw_string) {
    let hmac = this.encodeHmacSHA256(raw_string);
    if (!hmac) return;
    var base64String = CryptoJS.enc.Base64.stringify(hmac);
    return base64String;
  }

  encodeHmacSHA256(raw_string) {
    if (!raw_string || !this.configToken || !this.configToken.apiKey) return;

    var buff = CryptoJS.enc.Utf8.parse(raw_string);
    var buff_key = CryptoJS.enc.Utf8.parse(this.configToken.apiKey);
    var hmac = CryptoJS.HmacSHA256(buff, buff_key);
    return hmac;
  }

  async getBase64Stream(controller, id = '', action = '', params) {
    let url = this._baseUrl(controller, id, action);
    if (params) {
      var qs = '';
      if (params) {
        for (var key in params) {
          var value = params[key];
          qs += encodeURIComponent(key) + '=' + encodeURIComponent(value) + '&';
        }
      }

      if (qs.length > 0) {
        qs = qs.substring(0, qs.length - 1); //chop off last "&"
        url = url + '?' + qs;
      }
    }

    let requestHttpMethod = _get;
    try {
      __DEV__ && console.log('GOND api::getBase64Stream url = ', url);
      let request = this._fetchBlob(url, requestHttpMethod);

      return request
        .then(res => {
          if (res.respInfo.status === 200)
            return {
              status: res.respInfo.status,
              data: res.type == 'base64' ? res.base64() : res.text(),
            };
          else {
            //console.log('Unauthorize');
            return {
              status: res.respInfo.status,
              data: null,
            };
          }
        })
        .catch((errorMessage, statusCode) => {
          // error handling
          return {
            status: statusCode,
            data: null,
          };
        });
    } catch (e) {
      console.log(e);
    }
  }

  parseResponse(response) {
    if (response) {
      if (response.ok) {
        //return response.bodyUsed? response.json(): '';
        return response.text().then(function (data) {
          if (data) return JSONbig.parse(data);
          else return {};
        });
      } else {
        return {response: response, error: response.status};
      }
    } else {
      return {response: response, error: 404};
    }
  }

  async get(controller, id = '', action = '', params) {
    let response = await this._get(controller, id, action, params);
    return this.parseResponse(response);
  }

  _get(controller, id = '', action = '', params) {
    let url = this._url(controller, id, action, params);
    let requestHttpMethod = _get;
    return this._fetch(url, requestHttpMethod);
  }

  async post(controller, id = '', action = '', value = null) {
    let url = this._baseUrl(controller, id, action);
    let requestHttpMethod = _Post;
    let request_content =
      value === null || value === undefined ? '' : JSON.stringify(value);
    __DEV__ &&
      console.log(
        'GOND api::post url = ',
        url,
        ', content = ',
        request_content
      );
    let response = await this._fetch(url, requestHttpMethod, request_content);
    return this.parseResponse(response);
  }

  async put(controller, id = '', action = '', value = null) {
    let url = this._baseUrl(controller, id, action);
    let requestHttpMethod = _Put;
    let request_content =
      value === null || value === undefined ? '' : JSON.stringify(value);
    // __DEV__ && console.log('GOND api::put url = ', url, ', content = ', request_content);
    let response = await this._fetch(url, requestHttpMethod, request_content);
    return this.parseResponse(response);
  }

  async delete(controller, id = '', action = '', value = null) {
    let url = this._baseUrl(controller, id, action);
    let requestHttpMethod = _Delete;
    let request_content =
      value === null || value === undefined ? '' : JSON.stringify(value);
    let response = await this._fetch(url, requestHttpMethod, request_content);
    return this.parseResponse(response);
  }

  async login(username, pass) {
    try {
      let response = await this._getApiKey('account');
      if (response.status != 200) {
        return {status: response.status, Result: undefined};
      }
      let enc_user = AES.encrypt(username, this.configToken.apiKey);
      let uid = enc_user.toString();
      enc_user = AES.encrypt(pass, this.configToken.apiKey);
      let pas = enc_user.toString();
      let res = await this._login(uid, pas);
      //response =  await this.GetDVRs();

      if (res.status == 200) {
        var rs = await res.json();
        return {status: res.status, Result: rs};
      } else {
        return res;
      }
    } catch (ex) {
      __DEV__ && console.log('GOND LOGIN Exception: ', ex);
      return {status: undefined, Result: undefined};
    }
  }

  _connectionSignalRdone() {
    __DEV__ && console.log('Signal Connect');
  }

  _connectionSignalRfail(error) {
    __DEV__ && console.log('Signal Fail');
    console.log(error);
  }
}

const apiService = new Api();
export default apiService;
