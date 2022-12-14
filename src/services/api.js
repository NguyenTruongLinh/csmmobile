import {Platform, PermissionsAndroid} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import uuid from 'react-native-uuid';
//import urlhelpers from 'url-parse';
import CryptoJS from 'crypto-js';
import {HttpModel} from '../actions/types';
import JSONbig from 'json-bigint';
import AES from 'crypto-js/aes';
import {DateTime} from 'luxon';

import {stringtoBase64, isValidHttpUrl} from '../util/general';
import snackbarUtil from '../util/snackbar';

import {File as FileRoute} from '../consts/apiRoutes';
import {Domain} from '../consts/misc';

// const _get = 'GET';
// const _Post = 'POST';
// const _Put = 'PUT';
// const _Delete = 'DELETE';

const Methods = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Delete: 'DELETE',
};

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
      let qs = '';
      for (let key in params) {
        let value = params[key];
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
    // __DEV__ && console.log('GOND build URL, ', urlbase, ', id = ', id);
    if (!id || id === '') {
      // __DEV__ && console.log('GOND build URL no id ', id);
      if (action) return urlbase + '/' + controller + '/' + action;
      return urlbase + '/' + controller;
    }
    if (!action || action === '') {
      // __DEV__ &&
      //   console.log(
      //     'GOND build URL no action = ',
      //     urlbase + '/' + controller + '/' + id
      //   );
      return urlbase + '/' + controller + '/' + id;
    }
    return urlbase + '/' + controller + '/' + id + '/' + action;
  }

  _defaultHeader(appid) {
    let version = this.config.version;
    let headers = new Headers();
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
      let response = await fetch(url, {method: Methods.Get, headers: header});
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
    let body = JSON.stringify({UserName: _uid, Password: _pass});
    let response = await fetch(url, {
      method: Methods.Post,
      headers: header,
      timeout: 30000,
      body: body,
    });
    __DEV__ &&
      console.log(
        `GOND user _login  url = `,
        url,
        'headers = ',
        header,
        `body = `,
        body
      );
    if (response.status == 200) {
      header = response.headers;
      let raw_token = header.get('www-authenticate');
      let hindex = raw_token.indexOf('3rd-auth ');
      if (hindex >= 0)
        raw_token = raw_token.substr(hindex + '3rd-auth '.length);
      this.configToken.token = raw_token;
    }
    return response;
  }
  async _changePassword(_userName, _oldPass, _newPass, _apiKey) {
    let header = this._defaultHeader(this.config.appId);
    header.set('SID', this.configToken.id);
    header.set('RESERVED', _apiKey);
    let url = this._baseUrl('Account/0/ChangePasswordExpired');
    let body = JSON.stringify({
      UserName: _userName,
      CurrentPassword: _oldPass,
      NewPassword: _newPass,
    });

    __DEV__ && console.log('_changePassword body = ', body);
    let response = await fetch(url, {
      method: Methods.Post,
      headers: header,
      timeout: 30000,
      body: body,
    });
    return response;
  }

  // Token(method, url, jsoncontent) {
  //   let _method = Methods.Get;
  //   if (method != undefined && method != null) _method = method;
  //   let token = this._generateToken(this.config.appId, _method, url, jsoncontent);
  //   let header = this._defaultHeader(this.config.appId);
  //   header.set('Authorization', '3rd-auth ' + token);
  //   return header;
  // }
  async _submitForgotPassword(_domain, _email, _username) {
    this.config.url = _domain;
    let header = this._defaultHeader(this.config.appId);
    let url = this._baseUrl('Account/0/SubmitForgotPassword');
    let body = JSON.stringify({
      Email: _email,
      UserName: _username,
    });

    __DEV__ && console.log('_submitForgotPassword body = ', body);
    let response = await fetch(url, {
      method: Methods.Post,
      headers: header,
      timeout: 30000,
      body: body,
    });
    return response;
  }
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
    return CryptoJS.enc.Base64.stringify(hmac);
  }

  encodeHmacSHA256(raw_string) {
    if (!raw_string || !this.configToken || !this.configToken.apiKey) return;

    let buff = CryptoJS.enc.Utf8.parse(raw_string);
    let buff_key = CryptoJS.enc.Utf8.parse(this.configToken.apiKey);
    let hmac = CryptoJS.HmacSHA256(buff, buff_key);
    return hmac;
  }

  async getBase64Stream(controller, id = '', action = '', params) {
    let url = this._baseUrl(controller, id, action);
    if (params) {
      let qs = '';
      if (params) {
        for (let key in params) {
          let value = params[key];
          qs += encodeURIComponent(key) + '=' + encodeURIComponent(value) + '&';
        }
      }

      if (qs.length > 0) {
        qs = qs.substring(0, qs.length - 1); //chop off last "&"
        url = url + '?' + qs;
      }
    }

    let requestHttpMethod = Methods.Get;
    try {
      // __DEV__ && console.log('GOND api::getBase64Stream url = ', url);
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
    let requestHttpMethod = Methods.Get;
    return this._fetch(url, requestHttpMethod);
  }

  async post(controller, id = '', action = '', value = null) {
    let url = this._baseUrl(controller, id, action);
    let requestHttpMethod = Methods.Post;
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
    let requestHttpMethod = Methods.Put;
    let request_content =
      value === null || value === undefined ? '' : JSON.stringify(value);
    // __DEV__ && console.log('GOND api::put url = ', url, ', content = ', request_content);
    let response = await this._fetch(url, requestHttpMethod, request_content);
    return this.parseResponse(response);
  }

  async delete(controller, id = '', action = '', value = null) {
    let url = this._baseUrl(controller, id, action);
    let requestHttpMethod = Methods.Delete;
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

      // if (res.status == 200) {
      let rs = await res.json();
      return {status: res.status, Result: rs};
      // } else {
      //   return res;
      // }
    } catch (ex) {
      __DEV__ && console.log('GOND LOGIN Exception: ', ex);
      return {status: undefined, Result: undefined};
    }
  }

  async changePassword(username, oldPass, newPass) {
    try {
      let response = await this._getApiKey('account');
      if (response.status != 200) {
        return {status: response.status, Result: undefined};
      }
      // let enc_user = AES.encrypt(username, this.configToken.apiKey);
      // let uid = enc_user.toString();
      enc_user = AES.encrypt(oldPass, this.configToken.apiKey);
      let oldPas = enc_user.toString();
      enc_user = AES.encrypt(newPass, this.configToken.apiKey);
      let newPas = enc_user.toString();
      let res = await this._changePassword(
        username,
        oldPas,
        newPas,
        this.configToken.apiKey
      );
      //response =  await this.GetDVRs();

      // if (res.status == 200) {
      let rs = await res.json();
      return {status: res.status, Result: rs};
      // } else {
      //   return res;
      // }
    } catch (ex) {
      __DEV__ && console.log('GOND LOGIN Exception: ', ex);
      return {status: undefined, Result: undefined};
    }
  }

  async submitForgotPassword(domain, email, username) {
    try {
      let res = await this._submitForgotPassword(domain, email, username);

      let rs = await res.json();
      return {status: res.status, Result: rs};
    } catch (ex) {
      __DEV__ && console.log('GOND ForgotPassword Exception: ', ex);
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

  getMediaUrl(controller, action, media) {
    return this._url(controller, stringtoBase64(media), action, {
      key: this.base64HmacSHA256(media),
      auth: this.configToken.token,
    });
  }

  async downloadFile(fileUrl, mimeType, dirPath) {
    if (Platform.OS == 'android') {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      if (!hasPermission) {
        const isGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        __DEV__ &&
          console.log('GOND download file, request permission: ', isGranted);

        if (!isGranted) {
          snackbarUtil.onError(
            'Cannot download due to storage access permission. Please enable it!'
          );
          return;
        }
      }
    }

    const path =
      dirPath ?? Platform.OS == 'ios'
        ? RNFetchBlob.fs.dirs.DocumentDir
        : RNFetchBlob.fs.dirs.DownloadDir;

    const url = isValidHttpUrl(fileUrl)
      ? fileUrl
      : this.getMediaUrl(FileRoute.controller, FileRoute.getMedia, fileUrl);
    if (!isValidHttpUrl(url)) {
      snackbarUtil.onError('Not a valid url, download failed!');
      __DEV__ && console.log('GOND download not valid url: ', url);
      return;
    }

    let fileName =
      'exception-video-' + DateTime.now().toMillis().toString() + '.mp4';

    let res = await RNFetchBlob.config({
      path: path + '/' + fileName,
      // overwrite: true,
      addAndroidDownloads: {
        path: path + '/' + fileName + '?append=true',
        useDownloadManager: true,
        mediaScannable: true,
        mime: mimeType ?? 'video/mp4',
        notification: true,
      },
    }).fetch(Methods.Get, url);

    __DEV__ && console.log('GOND downloaded result: ', res);
    return res;
  }
}

const apiService = new Api();
export default apiService;
