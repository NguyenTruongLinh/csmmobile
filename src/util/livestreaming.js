import {ROUTERS} from '../models/consts';
import {VSCCommand, STREAMING_TYPES} from '../models/videoconsts';
import Snackbar from 'react-native-snackbar';
import dayjs from 'dayjs';
import CMSColors from '../styles/cmscolors';

startSelectivePlayer = (cloudType, propsObj) => {
  switch (cloudType) {
    case STREAMING_TYPES.DEFAULT:
    case STREAMING_TYPES.DIRECTION:
      Actions[ROUTERS.LIVEVIDEOIOS](propsObj);
      break;
    case STREAMING_TYPES.HLS:
      Actions[ROUTERS.LIVESTREAMING](propsObj);
      break;
    case STREAMING_TYPES.RTC:
      Actions[ROUTERS.RTCSTREAMING](propsObj);
      break;
    default:
      Actions[ROUTERS.LIVEVIDEOIOS](propsObj);
      break;
  }
};

showSnackbarMsg = (msg, backcolor = CMSColors.Success, actions = null) => {
  setTimeout(() => {
    Snackbar.show({
      text: msg,
      duration: actions ? Snackbar.LENGTH_INDEFINITE : Snackbar.LENGTH_LONG,
      backgroundColor: backcolor,
      action: actions
        ? {
            title: actions.title,
            color: actions.color,
            onPress: actions.onPress,
          }
        : undefined,
    });
  }, 100);
};

validateStreamInfo = (info, prevInfo) => {
  // console.log('GOND validateStreamInfo info.accessKeyId !== prevInfo.accessKeyId = ', info.accessKeyId !== prevInfo.accessKeyId,
  //   '\n info.secretAccessKey !== prevInfo.secretAccessKey = ', info.secretAccessKey !== prevInfo.secretAccessKey,
  //   '\n info.channelName !== prevInfo.rtcChannelName = ', info.channelName !== prevInfo.rtcChannelName,
  // )

  return (
    typeof info.accessKeyId === 'string' &&
    typeof info.secretAccessKey === 'string' &&
    typeof info.channelName === 'string' &&
    // && typeof info.endpoints === 'string'
    (!prevInfo ||
      info.accessKeyId != prevInfo.accessKeyId ||
      info.secretAccessKey != prevInfo.secretAccessKey ||
      info.channelName != prevInfo.rtcChannelName)
  );
};

// exports.buildRecordingDates = () => {
//   let willCheckData = !_.isObject(this.recordingDates) || Object.keys(this.recordingDates).length == 0;
//   let recodingDays = {};
//   let cdate = moment().format("YYYY-MM-DD");
//   for (let i = 0; i < value.length; i++) {
//     if(cdate == value[i]) {
//       recodingDays[value[i]] = { textColor: 'red', dotColor:"red", marked:true }
//     } else {
//       recodingDays[value[i]] = { textColor: 'red' };
//     }
//   }
//   this.recordingDates = recodingDays;
//   if (willCheckData)
//     this.checkDataOnSearchDate();
// }
/**
 * Get DST info in given year
 * @param {number} yearInput
 * @param {object} timezoneInfo
 * @returns {object} simulate timezone object return by api server
 */
getDSTInfoByYear = (yearInput, timezoneInfo) => {
  const res = {};
  const timezoneOffset = new Date().getTimezoneOffset();
  const hoursOffset = (-timezoneOffset + parseInt(timezoneInfo.Bias)) / 60;

  let tmpDate = dayjs().year(yearInput);
  tmpDate.date() < 7 && (tmpDate = tmpDate.add(7, 'date')); // prevent 'month' changed after setting 'day' of week
  let daylightDate = tmpDate
    .month(2)
    .day(0)
    .hour(2)
    .minute(0)
    .second(0)
    .millisecond(0);

  while (daylightDate.date() < 8) daylightDate = daylightDate.add(7, 'day');
  while (daylightDate.date() > 15) daylightDate = daylightDate.add(-7, 'day');
  res.DaylightDate = {
    wYear: daylightDate.year(),
    wMonth: daylightDate.month() + 1,
    wDayOfWeek: daylightDate.day(),
    wDay: daylightDate.date(),
    wHour: '2',
    wMinute: '0',
    wSecond: '0',
    wMilliseconds: '0',
  };
  res.unixDaylightDate = daylightDate.add(hoursOffset, 'hour').unix();

  let standardDate = tmpDate
    .month(10)
    .day(0)
    .hour(2)
    .minute(0)
    .second(0)
    .millisecond(0);
  while (standardDate.date() > 7) standardDate = standardDate.add(-7, 'day');
  res.StandardDate = {
    wYear: standardDate.year(),
    wMonth: standardDate.month() + 1,
    wDayOfWeek: standardDate.day(),
    wDay: standardDate.date(),
    wHour: '2',
    wMinute: '0',
    wSecond: '0',
    wMilliseconds: '0',
  };
  res.unixStandardDate = standardDate.add(hoursOffset, 'hour').unix();

  // console.log('111 GOND getTransitionDSTDateByYear daylightDate = ', dayjs(res.unixDaylightDate * 1000))
  // console.log('222 GOND getTransitionDSTDateByYear standardDate = ', dayjs(res.unixStandardDate * 1000))
  return res;
};

/**
 * Get daylight and standard date in given year
 * @param {number} yearInput
 * @param {number} hoursOffset
 * @returns {object} object contains daylight date and standard date in unix
 */
getTransitionDSTDateByYear = (yearInput, hoursOffset) => {
  const res = {};
  let daylightDate = dayjs()
    .year(yearInput)
    .day(0)
    .month(2)
    .hour(2)
    .minute(0)
    .second(0)
    .millisecond(0);
  // console.log('GOND getTransitionDSTDateByYear daylightDate 1 = ', daylightDate)
  while (daylightDate.date() < 8) daylightDate = daylightDate.add(7, 'day');
  while (daylightDate.date() > 15) daylightDate = daylightDate.add(-7, 'day');
  // console.log('GOND getTransitionDSTDateByYear daylightDate 2 = ', daylightDate)
  res.unixDaylightDate = daylightDate.add(hoursOffset, 'hour').unix();

  let standardDate = dayjs()
    .year(yearInput)
    .day(0)
    .month(10)
    .hour(2)
    .minute(0)
    .second(0)
    .millisecond(0);
  while (standardDate.date() > 7) standardDate = standardDate.add(-7, 'day');
  res.unixStandardDate = standardDate.add(hoursOffset, 'hour').unix();

  // console.log('111 GOND getTransitionDSTDateByYear daylightDate = ', dayjs(res.unixDaylightDate * 1000))
  // console.log('222 GOND getTransitionDSTDateByYear standardDate = ', dayjs(res.unixStandardDate * 1000))
  return res;
};

/**
 * Timezone and DST functions
 * @param dateInput: datetime in unix
 * @param timezoneInfo: timezone object passing by server (https://docs.microsoft.com/en-us/windows/win32/api/timezoneapi/ns-timezoneapi-time_zone_information)
 *  + additional: added History object to timezone for historical daylight date of past years
 *    {
 *      ...timezoneInfo,
 *      History: {
 *        2020: {
 *          DaylightDate: {...},
 *          StandardDate: {...},
 *          unixDaylightDate: ...,
 *          unixStandardDate: ...,
 *        }
 *      }
 *    }
 */

/**
 * Check if given local time is in DST range
 * @param {number} dateInput datetime in unix
 * @param {object} timezoneInfo timezone object passing by dotNet server
 * @returns {number}: unix server time
 */
checkIfInDSTRange = (dateInput, timezoneInfo, hoursOffset) => {
  const dateInServerTz = dayjs(dateInput * 1000).add(hoursOffset, 'hour');
  // console.log('-- GOND checkIfInDSTRange dateInServerTz = ', dateInServerTz, ', year = ', dateInServerTz.year());
  // console.log('-- GOND checkIfInDSTRange timezoneInfo = ', timezoneInfo);
  if (parseInt(timezoneInfo.DaylightDate.wYear) == 0) {
    return false;
  } else if (
    dateInServerTz.year() == parseInt(timezoneInfo.DaylightDate.wYear)
  ) {
    return (
      dateInput >= timezoneInfo.unixDaylightDate &&
      dateInput <= timezoneInfo.unixStandardDate
    ); // && yearInput == timezoneInfo.wYear;
  } else {
    let transitionDates = {};
    if (
      timezoneInfo.History &&
      timezoneInfo.History[dateInServerTz.year()] &&
      timezoneInfo.History[dateInServerTz.year()].unixDaylightDate &&
      timezoneInfo.History[dateInServerTz.year()].unixStandardDate
    ) {
      transitionDates = timezoneInfo.History[dateInServerTz.year()];
      // console.log('GOND --- checkIfInDSTRange use already built History: ', transitionDates);
    } else {
      transitionDates = getTransitionDSTDateByYear(
        dateInServerTz.year(),
        hoursOffset
      );
    }
    return (
      dateInput >= transitionDates.unixDaylightDate &&
      dateInput <= transitionDates.unixStandardDate
    );
  }
};

/**
 * Get different time in second between local and server
 * @param {number} dateInput datetime in unix
 * @param {object} timezoneInfo timezone object passing by dotNet server
 * @returns {number}: time offset (localTime - serverTime) in seconds
 */
getTimeOffset = (dateInput, timezoneInfo) => {
  if (
    typeof timezoneInfo != 'object' ||
    Object.keys(timezoneInfo).length <= 0
  ) {
    console.log(
      'GOND WARNING! Timezone is not defined, timeOffset is set to 0!'
    );
    console.trace();
    return 0;
  }
  // console.log('-- GOND timezoneInfo.Bias', timezoneInfo.Bias);
  const timezoneOffset = new Date().getTimezoneOffset();
  // const yearInput = new Date(dateInput * 1000).getFullYear();
  //console.log('-- GOND getTimeOffset yearInput = ', yearInput, ', timneZoneYear = ', timezoneInfo.wYear);
  const hoursOffset = (-timezoneOffset + parseInt(timezoneInfo.Bias)) / 60;
  // console.log('-- GOND hoursOffset', hoursOffset);

  const dateInServerTz = dayjs(dateInput * 1000).add(hoursOffset, 'hour');
  // console.log('-- GOND getTimeOffset dateInServerTz = ', dateInServerTz, ', year = ', dateInServerTz.year());
  // console.log('-- GOND getTimeOffset DaylightDate = ', timezoneInfo.DaylightDate);

  /*
  let isInDSTRange = false;
  if (parseInt(timezoneInfo.DaylightDate.wYear) == 0) {
    isInDSTRange = false;
  } else if (dateInServerTz.year() == parseInt(timezoneInfo.DaylightDate.wYear)) {
    isInDSTRange = dateInput >= timezoneInfo.unixDaylightDate && dateInput <= timezoneInfo.unixStandardDate; // && yearInput == timezoneInfo.wYear;
  } else {
    let transitionDates = {}
    if (timezoneInfo.History && timezoneInfo.History[dateInServerTz.year()] && timezoneInfo.History[dateInServerTz.year()].unixDaylightDate && timezoneInfo.History[dateInServerTz.year()].unixStandardDate) {
      transitionDates = timezoneInfo.History[dateInServerTz.year()];
      // console.log('GOND --- getTimeOffset use already built History: ', transitionDates);
    } else {
      transitionDates = getTransitionDSTDateByYear(dateInServerTz.year(), hoursOffset)
    }
    isInDSTRange = dateInput >= transitionDates.unixDaylightDate && dateInput <= transitionDates.unixStandardDate
  }
  */

  let isInDSTRange = checkIfInDSTRange(dateInput, timezoneInfo, hoursOffset);
  // console.log('-- GOND getTimeOffset isInDSTRange = ', isInDSTRange, ', dateInput = ', new Date(dateInput * 1000))
  return (
    (timezoneOffset -
      parseInt(timezoneInfo.Bias) -
      (isInDSTRange ? parseInt(timezoneInfo.DaylightBias) : 0)) *
    60
  );
};

/**
 * Convert local time (unix) to server time (unix)
 * @param {number} dateInput datetime in unix
 * @param {object} timezoneInfo timezone object passing by dotNet server
 * @returns {number}: unix server time
 */
convertBackToServerTime = (dateInput, timezoneInfo) => {
  // console.log('-- GOND convertBackToServerTime timezoneInfo = ', timezoneInfo);
  return dateInput - getTimeOffset(dateInput, timezoneInfo);
};

/**
 * Convert server time (unix) to local time (unix)
 * @param {number} dateInput server datetime in unix
 * @param {object} timezoneInfo timezone object passing by dotNet server
 * @returns {number}: unix local time
 */
convertToLocalTime = (dateInput, timezoneInfo) => {
  // console.log('-- GOND convertToLocalTime timezoneInfo = ', timezoneInfo);
  // return dateInput + (timezone * 60);
  return dateInput + getTimeOffset(dateInput, timezoneInfo);
};

/**
 * Get server start of day in unix
 * @param {number} dateInput local datetime in unix
 * @param {object} timezoneInfo timezone object passing by dotNet server
 * @returns {number}: unix start of day in server time
 */
getServerEndOfDay = (dateInput, timezoneInfo) => {
  // console.log('-- GOND getServerEndOfDay timezoneInfo = ', timezoneInfo);
  return convertBackToServerTime(
    dayjs(dateInput * 1000)
      .endOf('date')
      .unix(),
    timezoneInfo
  );
};

/**
 * Get server start of day in unix
 * @param {number} dateInput local datetime in unix
 * @param {object} timezoneInfo timezone object passing by dotNet server
 * @returns {number}: unix start of day in server time
 */
getServerStartOfDay = (dateInput, timezoneInfo) => {
  // console.log('-- GOND getServerStartOfDay timezoneInfo = ', timezoneInfo);
  return convertBackToServerTime(
    dayjs(dateInput * 1000)
      .startOf('date')
      .unix(),
    timezoneInfo
  );
};

module.exports = {
  startSelectivePlayer,
  showSnackbarMsg,
  validateStreamInfo,
  getTransitionDSTDateByYear,
  convertToLocalTime,
  getDSTInfoByYear,
  getTimeOffset,
  convertBackToServerTime,
  checkIfInDSTRange,
  getServerStartOfDay,
  getServerEndOfDay,
};
