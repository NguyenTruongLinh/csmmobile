import base64 from 'base64-js';
import AES from 'crypto-js/aes';
import CryptoJS from 'crypto-js';
import {Dimensions, PixelRatio, Platform} from 'react-native';
import uuid from 'react-native-uuid';

import CMSColors from '../styles/cmscolors';
import {
  AlertTypes,
  ChannelStatus,
  AlertTypeVA,
  TEMPERATURE_ALARMS_TYPES,
} from '../consts/misc';

exports.normalize = function (size) {
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(size))
      ? Math.round(PixelRatio.roundToNearestPixel(size))
      : size;
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(size))
      ? Math.round(PixelRatio.roundToNearestPixel(size))
      : size - 2;
  }
};

exports.NVRPlayerConfig = {
  RequestTimeFormat: 'YYYY/MM/DD HH:mm:ss',
  ResponseTimeFormat: 'YYYY/MM/DD HH:mm:ss.SSS',
  TimeFormat: 'HH:mm',
  FrameFormat: 'MM/DD/YYYY HH:mm:ss',
  Search_Duration: 10 * 60,
};

exports.getwindow = () => {
  return Dimensions.get('window');
};

exports.autoKey = function () {
  var guid = uuid.v1();
  return guid.toString();
};

exports.Utf8ArrayToStr = function (array) {
  // from http://stackoverflow.com/questions/8936984/uint8array-to-string-in-javascript
  var out, i, len, c;
  var char2, char3;

  out = '';
  len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
    }
  }

  return out;
};

exports.ToBytesInt32 = function (num) {
  var emptyArr = [0, 0, 0, 0];
  if (Number.isInteger(num) && num >= 0) {
    var arr = new Uint8Array([
      num & 0x000000ff,
      (num & 0x0000ff00) >> 8,
      (num & 0x00ff0000) >> 16,
      (num & 0xff000000) >> 24,
    ]);
    return [arr[0], arr[1], arr[2], arr[3]];
  } else {
    return [0, 0, 0, 0];
  }
};

exports.ToBytesInt16 = function (num) {
  var emptyArr = [0, 0];
  if (Number.isInteger(num) && num >= 0) {
    var arr = new Uint8Array([num & 0x000000ff, (num & 0x0000ff00) >> 8]);
    return [arr[0], arr[1]];
  } else {
    return [0, 0];
  }
};

exports.ToBytesString = function (str) {
  var utf8 = unescape(encodeURIComponent(str));

  var arr = [];
  for (var i = 0; i < utf8.length; i++) {
    arr.push(utf8.charCodeAt(i));
  }
  return arr;
};

exports.GetDataToSendServer = function (content) {
  //type: int, is type
  // content: base64 string
  //this functions returns a Buffer
  var arrBytes = [];
  var txtArrBytes = exports.Base64ToBytesArray(content);
  arrBytes = exports.ToBytesInt32(txtArrBytes.length + 6);
  arrBytes = arrBytes.concat(exports.ToBytesInt32(1));
  // remove 2 end bytes
  arrBytes.pop();
  arrBytes.pop();
  //
  arrBytes = arrBytes.concat(exports.ToBytesInt32(3));
  arrBytes = arrBytes.concat(txtArrBytes);
  var _dataSendToSv = new Buffer(arrBytes);
  return _dataSendToSv;
};

exports.Base64ToBytesArray = function (base64str) {
  var bytes = base64.toByteArray(base64str);
  var arr = [];
  for (var i = 0; i < bytes.length; i++) {
    arr.push(bytes[i]);
  }
  return arr;
};

exports.Base64ToString = function (uinit8) {
  var arr = [];
  for (var i = 0; i < uinit8.length; i++) {
    arr.push(uinit8[i]);
  }
  return base64.fromByteArray(arr);
};

exports.StringtoBase64 = function (str) {
  if (!str) return '';
  let wordArray = CryptoJS.enc.Utf8.parse(str);
  let ret = CryptoJS.enc.Base64.stringify(wordArray);
  return ret;
};

exports.Uinit8ToArr = function (uinit8) {
  var arr = [];
  for (var i = 0; i < uinit8.length; i++) {
    arr.push(uinit8[i]);
  }
  return arr;
};

exports.ByteArrayToInt = function (/*byte[]*/ byteArray) {
  var value = 0;
  for (var i = byteArray.length - 1; i >= 0; i--) {
    value = value * 256 + byteArray[i];
  }

  return value;
};

exports.GetDataToSendServerToGetVideoStream = function (
  resolution_x,
  resolution_y,
  video_source_index
) {
  var _value = '';
  var _mainsub_mask = '';
  for (var i = 0; i < 128; i++) {
    if (i < 64) {
      _mainsub_mask += '0';
    }
    if (i == video_source_index) {
      _value += '1';
    } else {
      _value += '0';
    }
  }
  var _content =
    '<ALL_SETTINGS> ' +
    '<SOURCE_RESQUEST_MASK value="' +
    _value +
    '" /> ' +
    '<RESOLUTION_REQUEST count="1" source_0="*" resolutionX_0="' +
    resolution_x +
    '" resolutionY_0="' +
    resolution_y +
    '" /> ' +
    '<MAIN_SUB_REQUEST mainsub_mask="' +
    _mainsub_mask +
    '" /> ' +
    '</ALL_SETTINGS>';

  var _content_bytes = exports.ToBytesString(_content);
  var _data_bytes = exports.ToBytesInt32(_content_bytes.length + 2);
  var _type_bytes = exports.ToBytesInt32(2002);
  _type_bytes.pop();
  _type_bytes.pop();
  _data_bytes = _data_bytes.concat(_type_bytes);
  _data_bytes = _data_bytes.concat(_content_bytes);

  return new Buffer(_data_bytes);
};

exports.Uinit8ArrToArray = function (uinit8) {
  var arr = [];
  for (var i = 0; i < uinit8.length; i++) {
    arr.push(uinit8[i]);
  }
  return arr;
};

exports.toQueryStringDateTime = function (localdate, format) {
  // if (!format) return moment(localdate).format('YYYYMMDDHHmmss');
  // else {
  //   return moment(localdate, format).format('YYYYMMDDHHmmss');
  // }
};

exports.toQueryStringDate = function (localdate, format) {
  // if (!format) return moment(localdate).format('YYYYMMDD');
  // return moment(localdate).format(format);
};

exports.toFormatStringLocalDate = function (localdate, format, outputformat) {
  let resFormat = outputformat || 'MM/DD/YYYY';
  // if (!format) return moment(localdate).format(resFormat);
  // else return moment(localdate, format).format(resFormat);
};

exports.toFormatStringDate = function (localdate, format, outputformat) {
  // if (!outputformat) outputformat = 'MM/DD/YYYY';
  // if (!format) return moment(localdate).format(outputformat);
  // else return moment(localdate, format).format(outputformat);
};

exports.toQueryStringUTCDateTime = function (localdate, format) {
  // if (!format) return moment.utc(localdate).format('YYYYMMDDHHmmss');
  // else {
  //   return moment.utc(localdate, format).format('YYYYMMDDHHmmss');
  // }
};
exports.toQueryStringUTCEndDateTime = function (localdate, format) {
  // if (!format) return moment.utc(localdate).format('YYYYMMDD235959');
  // else return moment.utc(localdate, format).format('YYYYMMDD235959');
};
exports.toQueryStringUTCDate = function (localdate, format) {
  // if (!format) return moment.utc(localdate).format('YYYYMMDD');
  // else {
  //   return moment.utc(localdate, format).format('YYYYMMDD');
  // }
};

exports.AES_encrypt = function (input, key) {
  let enc_user = AES.encrypt(input, key);
  let uid = enc_user.toString();
  return uid;
};

exports.AES_decrypt = function (input, key) {
  let enc_user = AES.decrypt(input, key);
  let uid = enc_user.toString(CryptoJS.enc.Utf8);
  return uid;
};

exports.UnixTime_To_Date = function (unix) {
  let date = new Date(Date.UTC(1970, 0, 1, 0, 0, 0, 0));
  date.setSeconds(unix);
  return date;
};

exports.responsiveHeight = h => {
  return Dimensions.get('window').height * (h / 100);
};

exports.responsiveWidth = w => {
  return Dimensions.get('window').width * (w / 100);
};

exports.responsiveFontSize = f => {
  let width = Dimensions.get('window').width;
  let height = Dimensions.get('window').height;
  return Math.sqrt(height * height + width * width) * (f / 100);
};

exports.styleNoDataCenter = (width, height) => {
  return {position: 'absolute', width: width, height: height, zIndex: 10};
};

exports.getIconAlertType = alertID => {
  switch (alertID) {
    case AlertTypes.DVR_Insufficient_Disk_Space_Backup:
      return 'insufficient-disk-space';
    case AlertTypes.DVR_Video_Loss:
      return 'video-loss';
    case AlertTypes.DVR_Storage_Setup_Changed:
      return 'change-backup-storage';
    case AlertTypes.DVR_Not_recording:
      return 'not-recording';
    case AlertTypes.DVR_Partition_Dropped:
      return 'partition-dropped';
    case AlertTypes.DVR_is_off_line:
      return 'nvr-offline';
    case AlertTypes.DVR_Record_Less_Than:
      return 'fewer-xdays';
    case AlertTypes.DVR_HDD_Format_Started:
      return 'hdd-format';
    case AlertTypes.DVR_HDD_Format_Completed:
      return 'hdd-format';
    case AlertTypes.CMSWEB_Door_count_0:
      return 'no-door';
    case AlertTypes.CMSWEB_POS_data_missing:
      return 'no-pos';
    case AlertTypes.DVR_Sensor_Triggered:
      return 'sensor';
    case AlertTypes.DVR_VA_detection:
      return 'va';
    case AlertTypes.SOCIAL_DISTANCE:
      return 'social-distancing-group';
    case AlertTypes.POS_Exceptions:
      return 'smart-er';
    case AlertTypes.Alarm_Temperature:
      return 'ic-temperature-32px';
    default:
      return 'ellipsis';
  }
};

exports.formatnumber = n => {
  return n ? String(n).replace(/(.)(?=(\d{3})+$)/g, '$1,') : '0';
};

exports.formatdecimal = (val, places) => {
  places = !isNaN((places = Math.abs(places))) ? places : 2;
  let thousand = ',';
  let decimal = '.';
  var number = val,
    negative = number < 0 ? '-' : '',
    i = parseInt((number = Math.abs(+number || 0).toFixed(places)), 10) + '',
    j = (j = i.length) > 3 ? j % 3 : 0;
  return (
    negative +
    (j ? i.substr(0, j) + thousand : '') +
    i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousand) +
    (places
      ? decimal +
        Math.abs(number - i)
          .toFixed(places)
          .slice(2)
      : '')
  );
};

exports.StringMatch = (left, right) => {
  if (!left && !right) return false;
  if ((!left && right) || (!right && left)) return false;
  return left.toLocaleLowerCase().includes(right.toLocaleLowerCase());
};

exports.getIconChannelStatus = status => {
  switch (status) {
    case ChannelStatus.DISABLE:
      return 'videocam-filled-tool';
    case ChannelStatus.NOT_RECORDING:
      return 'videocam-filled-tool';
    case ChannelStatus.RECORDING:
      return 'videocam-filled-tool';
    case ChannelStatus.VIDEOLOSS:
      return 'video-loss';
    case ChannelStatus.RESDISABLE:
      return 'videocam-filled-tool';
    default:
      return 'videocam-filled-tool';
  }
};

exports.getImageSize = ({width, height}) => {
  // if(!ratio)
  //   ratio = 16/9;
  if (!height && !width) {
    return {width: 0, height: 0};
  }
  if (width <= height) {
    let _height = parseInt((width * 9) / 16);
    return {width: width, height: _height};
  }

  if (width >= height) {
    let _height = Math.floor((width * 9) / 16);
    return {width: width, height: _height};
  }
  return {width, height};
};

exports.getNameStatus = status => {
  switch (status) {
    case ChannelStatus.DISABLE:
      return 'Disable';
    case ChannelStatus.NOT_RECORDING:
      return 'Not recording';
    case ChannelStatus.RECORDING:
      return 'Recording';
    case ChannelStatus.VIDEOLOSS:
      return 'Video loss';
    case ChannelStatus.RESDISABLE:
      return 'Redisable';
    default:
      return '';
  }
};

exports.getColorStatus = status => {
  switch (status) {
    case ChannelStatus.DISABLE:
      return CMSColors.Success;
    case ChannelStatus.NOT_RECORDING:
      return CMSColors.Success;
    case ChannelStatus.RECORDING:
      return CMSColors.Success;
    case ChannelStatus.VIDEOLOSS:
      return CMSColors.SecondaryText;
    case ChannelStatus.RESDISABLE:
      return CMSColors.Success;
    default:
      return CMSColors.Success;
  }
};

exports.getAlertTypeVA = status => {
  switch (status) {
    case AlertTypeVA.Unknown:
      return 'Unknown';
    case AlertTypeVA.Area:
      return 'Enters Area';
    case AlertTypeVA.Idle:
      return 'Idles In Area';
    case AlertTypeVA.Stop:
      return 'Stopped In Area';
    case AlertTypeVA.CrossWire:
      return 'Crossed Line';
    case AlertTypeVA.MissAlarm:
      return 'Missing From Area';
    case AlertTypeVA.Direction:
      return 'Moves In Direction';
    case AlertTypeVA.ManyHuman:
      return 'Many Human';
    case AlertTypeVA.AIDetection:
      return 'Detected';
    default:
      return '';
  }
};

exports.findItem = (collection, key, value) => {
  return collection.find(item => {
    if (item[key] === undefined) return false;
    return item[key] === value;
  });
};

exports.findItems = (collection, key, value) => {
  return (ret = collection.find(item => {
    if (Array.isArray(key)) {
      let i = 0;
      let len = key.length;
      let parent = item;
      let childs = parent;
      let result;
      while (i < len - 1) {
        childs = parent[key[i]];
        i++;
        if (i == len - 1) {
          return childs.find(it => {
            let val = it[key[i]];
            return val === value;
          });
        }
      }
    } else {
      if (!item[key]) return false;
      return item[key] === value;
    }
  }));
};

exports.Capitalize = (str, Special) => {
  if (!str) return '';
  if (!Special) Special = ' ';
  var pieces = str.split(Special);
  for (var i = 0; i < pieces.length; i++) {
    var j = pieces[i].charAt(0).toUpperCase();
    pieces[i] = j + pieces[i].substr(1);
  }
  return pieces.join(Special);
};

exports.isNullOrUndef = val => {
  return val === undefined || val === null;
};

exports.isTemperatureAlert = alertId => {
  return TEMPERATURE_ALARMS_TYPES.includes(alertId);
};

exports.isSDAlert = alertId => {
  return alertId === AlertTypes.SOCIAL_DISTANCE;
};

exports.getRandomId = () => {
  return uuid.v1().toString();
};

exports.isValidHttpUrl = val => {
  // toString.call(val) === '[object URL]';
  try {
    const url = new URL(val);
    return val.startsWith('http:://') || val.startsWith('https://');
  } catch (err) {
    __DEV__ && console.log('GOND not valid url: ', err);
    return false;
  }
};

exports.compareArrays = (a, b) => {
  return JSON.stringify(a) == JSON.stringify(b);
};

exports.compareStrings = (a, b) => {
  return a > b ? 1 : a < b ? -1 : 0;
};
