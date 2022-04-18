import React, {PureComponent} from 'react';
import {Dimensions, View, ScrollView, Text} from 'react-native';
import {DateTime} from 'luxon';

import CMSColors from '../../styles/cmscolors';
import {
  default24H,
  startDST,
  endDST,
  arrayof12HTime,
  arrayof24HTime,
  HOURS_ON_SCREEN,
  MINUTE_PER_HOUR,
  SECONDS_PER_MINUTE,
  SECONDS_PER_HOUR,
} from '../../consts/video';
import {NVRPlayerConfig} from '../../consts/misc';
// import moment from 'moment';

export default class TimeRuler extends PureComponent {
  static defaultProps = {
    data: [],
    height: 100,
    width: 0,
    heightColMin: 5,
    heightColMinColor: 10,
    heightMarker: 75,
    widthMarker: 1,
    colorMarker: 'yellow',
    markerPosition: 'absolute',
    numofHours: HOURS_ON_SCREEN, // A mount of hours columns display in sequence. Recommend an even number,
    numofMin: MINUTE_PER_HOUR, // A mount of minutes columns display in sequence. Recommend an even number,
    is24hour: true,
    timeData: [], //[{value:0,status:0},{value:1,status:0}],
    searchDate: null,
    fontSize: 8,
    // scrollTo: this.scrollTo,
    // startAt: 0,
    hourBuildRuler: default24H,
    hourSpecial: '',
    rulerDST: null,
    onPositionChanged: x =>
      __DEV__ && console.log('GOND TimeRuler onPositionChanged not defined.'),
    initialPosition: 0,
  };
  constructor(props) {
    super(props);
    this.color = ['pink', 'orange', 'blue', 'green', '00ff00'];
    const {width, height} = Dimensions.get('window');

    this.Enum_RecordType = {
      EMPTY: 0,
      CONTINUOUS: 1 << 0,
      SENSOR: 1 << 1,
      MOTION: 1 << 2,
      PREALARM: 1 << 3,
      WATERMARK: 1 << 4,
      AUDIO: 1 << 5,
      VIDEOANALYTIC: 1 << 6,
      EMERGENCY_S: (1 << 0) | (1 << 1),
      EMERGENCY_M: (1 << 0) | (1 << 2),
      EMERGENCY_V: (1 << 0) | (1 << 6),
      SENSOR_AND_MOTION: (1 << 1) | (1 << 2),
    };
    this.RecordedTypeColor = {
      Continous: '#C914E0',
      Sensor: '#EC8317',
      Motion: '#3361D1',
      Sensor_Motion: '#30B47F',
      VA: '#05FD00',
      VA_Sensor_Motion: '#00B1FF',
    };

    const [hoursArray, hoursValue] = this.constructArrayOfHours(props.is24hour);
    this.state = {
      width,
      height,
      widthMarker: width / (this.props.numofHours * this.props.numofMin),
      numofMin: this.props.numofMin,
      dwidth: width / this.props.numofHours, //*this.props.numofHours*/)
      secondValue: this.props.numofHours * this.props.numofMin,
      labelhour: '',
      hoursArray,
      hoursValue,
    };

    this.isAutoScrolling = true;
    this.isManualScrolling = false;
    this._isMounted = false;
    this.lastX = 0;
    this.draggedX = 0;
    this.lastScrollOffsetX = -1;
    // this.isTouchEnd = true;
    // this.isScrollEnd = true;
    this.scrollEndTimeout = null;
    this.lastDataTime = 0;

    this.savedSecPos = 0;
  }

  componentDidMount() {
    this.dimensionsChangeEvtSub = Dimensions.addEventListener(
      'change',
      this.onDimensionChange
    );
    this._isMounted = true;

    const {initialPosition} = this.props;
    __DEV__ && console.log('GOND TimeRuler didMount', initialPosition);
    if (initialPosition) {
      // this.moveToPosition(initialPosition);
      this.savedSecPos = initialPosition;
    }

    // this.autoUpdatePosition(currentTime, searchDate);
    // if (currentTime && currentTime > searchDate) {
    //   let sec = currentTime - searchDate;
    //   let secWidth = this.state.dwidth / (SECONDS_PER_MINUTE * MINUTE_PER_HOUR);
    //   this.scrollTo(sec * secWidth, 0);
    // }
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.onDimensionChange);
    // this.dimensionsChangeEvtSub && this.dimensionsChangeEvtSub.remove();
    this._isMounted = false;

    this.clearScrollEndTimeout();
  }

  componentDidUpdate(prevProps) {
    const {currentTime, searchDate} = this.props;
    const lastTime = prevProps.currentTime;
    // __DEV__ &&
    //   console.log(
    //     'GOND Timeline prev frameTime: ',
    //     lastTime,
    //     ', this.isManualScrolling',
    //     this.isManualScrolling
    //   );
    if (currentTime != lastTime && !this.isManualScrolling) {
      this.autoUpdatePosition(currentTime, searchDate);
    }
    if (searchDate != prevProps.searchDate) {
      __DEV__ &&
        console.log(
          'GOND searchDate changed: ',
          searchDate,
          prevProps.searchDate
        );
      const [hoursArray, hoursValue] = this.constructArrayOfHours(
        this.props.is24hour
      );
      this.setState({
        hoursArray,
        hoursValue,
      });
      this.draggedX = 0;
      this.lastX = 0;
      this.lastScrollOffsetX = -1;
    }
  }

  constructArrayOfHours = is24hour => {
    const {datetime} = this.props;
    const resString = [];
    const resValues = [];
    if (!DateTime.isDateTime(datetime)) {
      __DEV__ &&
        console.log(
          'GOND Warning TimeRuler datetime is not a valid Luxon object'
        );
      return is24hour ? arrayof24HTime : arrayof12HTime;
    }

    const selectedDate = datetime.toFormat(
      NVRPlayerConfig.QueryStringUTCDateFormat
    );
    let hourIterator = datetime.startOf('day');
    let currentDate = hourIterator.toFormat(
      NVRPlayerConfig.QueryStringUTCDateFormat
    );

    do {
      resString.push(hourIterator.toFormat(is24hour ? 'HH:mm' : 'hh:mm a'));
      resValues.push(hourIterator.hour);
      hourIterator = hourIterator.plus({hour: 1});
      currentDate = hourIterator.toFormat(
        NVRPlayerConfig.QueryStringUTCDateFormat
      );
      // __DEV__ &&
      //   console.log(
      //     'GOND TimeRuler constructArrayOfHours',
      //     currentDate,
      //     hourIterator,
      //     hourIterator.hour
      //   );
    } while (currentDate == selectedDate);

    return [resString, resValues];
  };

  autoUpdatePosition = (currentTime, searchDate) => {
    const {hoursValue} = this.state;
    let sec = currentTime - searchDate;
    // const secsPerHour = SECONDS_PER_MINUTE * MINUTE_PER_HOUR;
    let secWidth = this.state.dwidth / SECONDS_PER_HOUR;
    __DEV__ && console.log('GOND auto update timeline: ', currentTime, sec);

    let secToAdd = 0;
    let hourIndex = 0;
    for (; hourIndex < hoursValue.length; hourIndex++) {
      const currentHourSec =
        (hoursValue.length > default24H ? hourIndex : hoursValue[hourIndex]) *
        SECONDS_PER_HOUR;
      const nextHourSec =
        (hoursValue.length > default24H
          ? hourIndex + 1
          : hourIndex == hoursValue.length - 1
          ? hoursValue[hourIndex] + 1
          : hoursValue[hourIndex + 1]) * SECONDS_PER_HOUR;
      // __DEV__ &&
      //   console.log(
      //     'GOND auto timeline check: ',
      //     currentHourSec,
      //     nextHourSec,
      //     sec
      //   );
      if (sec < nextHourSec && sec > currentHourSec) {
        secToAdd = sec - currentHourSec;
        break;
      }
    }

    if (hourIndex < hoursValue.length) {
      const realSecToScroll = hourIndex * SECONDS_PER_HOUR + secToAdd;
      // __DEV__ && console.log('GOND move timeline, sec: ', sec, ', secW = ', secWidth);
      // this.scrollTo(sec * secWidth, 0);
      this.scrollTo(realSecToScroll * secWidth, 0);
    } else {
      __DEV__ &&
        console.log('GOND move timeline, sec: ', sec, ', secW = ', secWidth);
    }
  };

  moveToPosition = sec => {
    let secWidth = this.state.dwidth / (SECONDS_PER_MINUTE * MINUTE_PER_HOUR);

    // TODO: handle DST
    console.log('GOND moveToPosition, sec: ', sec, ', secW = ', secWidth);
    this.isAutoScrolling = false;
    this.scrollRef &&
      this.scrollRef.scrollTo({x: sec * secWidth, y: 0, animated: false});
    setTimeout(() => {
      this.isAutoScrolling = true;
    }, 2000);
  };

  clearScrollEndTimeout = () => {
    if (this.scrollEndTimeout) {
      clearTimeout(this.scrollEndTimeout);
      this.scrollEndTimeout = null;
    }
  };

  checkWithWatermarkAndAudio = (code, checkingType) => {
    return (
      code == checkingType ||
      code == (checkingType | this.Enum_RecordType.WATERMARK) ||
      code == (checkingType | this.Enum_RecordType.AUDIO) ||
      code ==
        (checkingType |
          this.Enum_RecordType.WATERMARK |
          this.Enum_RecordType.AUDIO)
    );
  };

  getcolor = code => {
    // console.log('GOND getColor code = ', code)
    if (
      code == this.Enum_RecordType.CONTINUOUS ||
      code == this.Enum_RecordType.EMERGENCY_S ||
      code == this.Enum_RecordType.EMERGENCY_V ||
      code == this.Enum_RecordType.EMERGENCY_M ||
      code ==
        (this.Enum_RecordType.CONTINUOUS | this.Enum_RecordType.WATERMARK) ||
      code == (this.Enum_RecordType.CONTINUOUS | this.Enum_RecordType.AUDIO) ||
      code ==
        (this.Enum_RecordType.CONTINUOUS |
          this.Enum_RecordType.WATERMARK |
          this.Enum_RecordType.AUDIO)
    )
      return this.RecordedTypeColor.Continous;

    if (
      code == this.Enum_RecordType.SENSOR ||
      code == (this.Enum_RecordType.SENSOR | this.Enum_RecordType.WATERMARK) ||
      code == (this.Enum_RecordType.SENSOR | this.Enum_RecordType.AUDIO) ||
      code ==
        (this.Enum_RecordType.SENSOR |
          this.Enum_RecordType.AUDIO |
          this.Enum_RecordType.WATERMARK)
    )
      return this.RecordedTypeColor.Sensor;

    if (
      code == this.Enum_RecordType.MOTION ||
      code == (this.Enum_RecordType.MOTION | this.Enum_RecordType.WATERMARK) ||
      code == (this.Enum_RecordType.MOTION | this.Enum_RecordType.AUDIO) ||
      code ==
        (this.Enum_RecordType.MOTION |
          this.Enum_RecordType.AUDIO |
          this.Enum_RecordType.WATERMARK)
    )
      return this.RecordedTypeColor.Motion;

    if (
      code == this.Enum_RecordType.SENSOR_AND_MOTION ||
      code ==
        (this.Enum_RecordType.SENSOR_AND_MOTION |
          this.Enum_RecordType.WATERMARK) ||
      code ==
        (this.Enum_RecordType.SENSOR_AND_MOTION | this.Enum_RecordType.AUDIO) ||
      code ==
        (this.Enum_RecordType.SENSOR_AND_MOTION |
          this.Enum_RecordType.AUDIO |
          this.Enum_RecordType.WATERMARK)
    )
      return this.RecordedTypeColor.Sensor_Motion;

    if (
      code == this.Enum_RecordType.VIDEOANALYTIC ||
      code ==
        (this.Enum_RecordType.VIDEOANALYTIC | this.Enum_RecordType.WATERMARK) ||
      code ==
        (this.Enum_RecordType.VIDEOANALYTIC | this.Enum_RecordType.AUDIO) ||
      code ==
        (this.Enum_RecordType.VIDEOANALYTIC |
          this.Enum_RecordType.AUDIO |
          this.Enum_RecordType.WATERMARK)
    )
      return this.RecordedTypeColor.VA;

    if (
      this.checkWithWatermarkAndAudio(
        code,
        this.Enum_RecordType.VIDEOANALYTIC | this.Enum_RecordType.SENSOR
      ) ||
      this.checkWithWatermarkAndAudio(
        code,
        this.Enum_RecordType.VIDEOANALYTIC | this.Enum_RecordType.MOTION
      ) ||
      this.checkWithWatermarkAndAudio(
        code,
        this.Enum_RecordType.VIDEOANALYTIC |
          this.Enum_RecordType.SENSOR |
          this.Enum_RecordType.MOTION
      )
    )
      return this.RecordedTypeColor.VA_Sensor_Motion;

    return this.RecordedTypeColor.Continous;
  };

  scrollTo = (x, y) => {
    // __DEV__ &&
    //   console.log(
    //     'GOND === TimeRuler scrollTo ',
    //     this.isAutoScrolling,
    //     this.isManualScrolling,
    //     this.scrollRef,
    //     'pos: ',
    //     x
    //   );
    if (this.isAutoScrolling && !this.isManualScrolling && this.scrollRef) {
      // __DEV__ && console.log('GOND === TimeRuler AAAAAAAAAAAAAAAAAAAAA');
      if (this.lastScrollOffsetX >= 0) this.lastScrollOffsetX = -1;
      if (this.draggedX > 0) {
        if (
          x >= this.draggedX &&
          (x < this.lastX ||
            Math.abs(x - this.draggedX) < Math.abs(this.lastX - this.draggedX))
        ) {
          this.draggedX = 0;
        } else {
          __DEV__ &&
            console.log(
              'GOND onTimeRuler autoScroll -> still at old position, not update!',
              x,
              this.lastX,
              this.draggedX
            );
          return;
        }
      }
      this.scrollRef.scrollTo({x: x, y: y, animated: false});
      const secWidth = this.state.dwidth / SECONDS_PER_HOUR;
      this.props.onPositionChanged(x / secWidth);
      this.lastX = x;
      this.savedSecPos = 0;
    } else {
      __DEV__ && console.log('GOND onTimeRuler autoScroll is disabled ---!');
    }
  };

  formatTime = value => {
    return parseInt(value) > 9 ? value : '0' + value;
  };

  onDimensionChange = event => {
    // let d = Dimensions.get('screen').width;
    // this.setState({
    //   dwidth: d / this.props.numofHours,
    //   widthMarker: d / (this.props.numofHours * this.props.numofMin),
    // });
  };

  onLayout = event => {
    const {width, height} = event.nativeEvent.layout;
    __DEV__ && console.log('GOND onTimeRuler onLayout!', width, height);
    this.setState(
      {
        width,
        height,
        dwidth: width / this.props.numofHours,
        widthMarker: width / (this.props.numofHours * this.props.numofMin),
      },
      () => {
        if (this.savedSecPos) {
          this.moveToPosition(this.savedSecPos);
          // this.savedSecPos = 0;
        }
      }
    );
  };

  // _roundOddToEven = value => {
  //   if (value == 0) return 2;
  //   if (value % 2 == 0) return value;

  //   let rs = value + 1;
  //   return rs;
  // };

  onSendTimeData = xAxis => {
    const {hoursArray, hoursValue} = this.state;
    this.scrollEndTimeout = null;
    // if (this.isTouchEnd && this.isScrollEnd) {
    if (!this._isMounted || xAxis == this.lastScrollOffsetX) {
      return;
    } else {
      this.lastScrollOffsetX = xAxis;
    }
    __DEV__ && console.log('GOND === TimeRuler onSendTimeData');
    // }
    // let { hourBuildRuler, hourSpecial } = this.props
    let decimalhour = xAxis / this.state.dwidth;
    // let hour = Math.floor(decimalhour);
    let hourIndex = Math.floor(decimalhour);
    hourIndex =
      hourIndex < 0
        ? 0
        : hourIndex >= hoursArray.length
        ? hoursArray.length - 1
        : hourIndex;
    let hour = hoursValue[hourIndex]; // parseInt(hoursArray[hourIndex].split(':')[0]);
    let decimalminutes = (decimalhour - hourIndex) * 60;
    let minutes = Math.floor(decimalminutes);
    let seconds = Math.floor((decimalminutes - minutes) * 60);

    this.draggedX = xAxis;
    if (this.props.onScrollEnd) {
      this.props.onScrollEnd({
        hour: hour,
        minutes: minutes,
        seconds: seconds,
        timestamp:
          /*this.props.searchDate +*/ hourIndex * 3600 + minutes * 60 + seconds,
      });
      const secWidth = this.state.dwidth / SECONDS_PER_HOUR;
      this.props.onPositionChanged(xAxis / secWidth);

      // Delaying auto scroll to prevent glitch
      setTimeout(() => {
        if (this._isMounted) this.isAutoScrolling = true;
      }, 2000);

      return;
    }
    // }
  };

  onScrollEnd = event => {
    __DEV__ &&
      console.log(
        'GOND === TimeRuler onScrollEnd: ',
        event.nativeEvent.contentOffset.x,
        this.lastScrollOffsetX
      );
    // this.isScrollEnd = true;

    this.clearScrollEndTimeout();
    let {x} = event.nativeEvent.contentOffset;
    this.scrollEndTimeout = setTimeout(() => this.onSendTimeData(x), 500);
    /*
    // if (this.lastScrollOffsetX >= 0) {
    if (event.nativeEvent.contentOffset.x == this.lastScrollOffsetX) {
      return;
    } else {
      this.lastScrollOffsetX = event.nativeEvent.contentOffset.x;
    }
    // }
    // let { hourBuildRuler, hourSpecial } = this.props
    let decimalhour = event.nativeEvent.contentOffset.x / this.state.dwidth;
    let hour = Math.floor(decimalhour);
    // if (hourBuildRuler == startDST && hour >= hourSpecial) {
    //   hour++;
    // } else if (hourBuildRuler == endDST && hour >= hourSpecial) {
    //   hour--;
    // }
    let decimalminutes = (decimalhour - hour) * 60;
    let minutes = Math.floor(decimalminutes);
    let seconds = Math.floor((decimalminutes - minutes) * 60);

    this.draggedX = event.nativeEvent.contentOffset.x;
    if (this.props.onScrollEnd) {
      this.props.onScrollEnd(event, {
        hour: hour,
        minutes: minutes,
        seconds: seconds,
        timestamp:
          hour * 3600 + minutes * 60 + seconds,
      });

      // Delaying auto scroll to prevent glitch
      setTimeout(() => {
        if (this._isMounted) this.isAutoScrolling = true;
      }, 2000);

      // this.isTouchEnd = true;
      return;
    }
    */
  };

  onPressIn = event => {
    __DEV__ && console.log('GOND === TimeRuler onPressIn');
    if (this.props.onBeginSrcoll) {
      this.props.onBeginSrcoll();
    }
    this.isAutoScrolling = false;
    // this.isTouchEnd = false;
    // this.isScrollEnd = false;
  };

  // onPressOut = event => {
  //   __DEV__ && console.log('GOND === TimeRuler onPressOut');
  //   this.isAutoScrolling = true;
  //   this.isTouchEnd = true;
  // };

  onScrollBeginDrag = event => {
    __DEV__ && console.log('GOND === TimeRuler onScrollBeginDrag');
    this.isManualScrolling = true;
    this.props.onPauseVideoScrolling && this.props.onPauseVideoScrolling();
    this.props.setShowHideTimeOnTimeRule(true);
  };

  onScroll = event => {
    // __DEV__ && console.log('GOND === TimeRuler onScroll', event);
    this.clearScrollEndTimeout();
    const {hourBuildRuler, hourSpecial} = this.props;
    const {hoursArray, hoursValue} = this.state;
    if (this.isManualScrolling == true) {
      // this.isAutoScrolling = true;
      let decimalhour = event.nativeEvent.contentOffset.x / this.state.dwidth;
      let hourIndex = Math.floor(decimalhour);
      hourIndex =
        hourIndex < 0
          ? 0
          : hourIndex >= hoursArray.length
          ? hoursArray.length - 1
          : hourIndex;
      let hour = hoursValue[hourIndex]; // parseInt(hoursArray[hourIndex].split(':')[0]);
      let decimalminutes = (decimalhour - hourIndex) * 60;
      let minutes = Math.floor(decimalminutes);
      let seconds = Math.floor((decimalminutes - minutes) * 60);

      // if (this.props.hourBuildRuler != default24H && this.props.hourBuildRuler == endDST) {
      //   if (hour >= (this.props.hourSpecial + 1)) {
      //     hour--;
      //   }
      // }

      // if (this.props.hourBuildRuler != default24H && this.props.hourBuildRuler == startDST) {
      //   if (hour >= (this.props.hourSpecial)) {
      //     hour++;
      //   }
      // }
      /*
      if (hourBuildRuler == startDST && hour >= hourSpecial) {
        hour++;
      } else if (hourBuildRuler == endDST && hour >= hourSpecial) {
        hour--;
      }
      */

      __DEV__ &&
        console.log('GOND === TimeRuler onScroll', hour, minutes, seconds);
      //this.props.onScrolling({hour:hour,minutes:minutes,seconds:seconds, timestamp: (hour*3600+minutes*60+seconds) });
      this.props.onScrolling(
        this.formatTime(hour) +
          ':' +
          this.formatTime(minutes) +
          ':' +
          this.formatTime(seconds)
      );
      //console.log(decimalhour);
    }
  };

  onScrollEndDrag = event => {
    __DEV__ && console.log('GOND === TimeRuler onScrollEndDrag');
    this.isManualScrolling = false;
    this.props.setShowHideTimeOnTimeRule(false);
    this.onScrollEnd(event);
  };

  renderTimeHeaderFooter = isheader => {
    // let arrayHours = this.props.is24hour
    //   ? arrayof24HTime.slice(0)
    //   : arrayof12HTime.slice(0);
    let arrayHours = [...this.state.hoursArray];
    let attachment = isheader ? arrayHours.reverse() : arrayHours;
    let lenngthofprefix =
      this.props.markerPosition == 'absolute'
        ? this.props.numofHours / 2
        : this.props.numofHours;
    let res = [];
    for (let i = 0; i < lenngthofprefix; i++) {
      res.push({key: attachment[i], visible: false});
    }
    return isheader ? res.reverse() : res;
  };

  renderDST = (is24hour, hourBuildRuler, hourSpecial, rulerDST) => {
    // console.log('GOND TimeRuler renderDST! hourSpecial = ', hourSpecial)
    if (!this.props.timeData) return [];

    if (Array.isArray(rulerDST) && rulerDST.length > 0) {
      let arrayofViews = rulerDST;
      if (this.props.markerPosition == 'absolute')
        arrayofViews = this.renderTimeHeaderFooter(true)
          .concat(arrayofViews)
          .concat(this.renderTimeHeaderFooter(false));
      else
        arrayofViews = arrayofViews.concat(this.renderTimeHeaderFooter(true));

      return arrayofViews;
    }

    // BEGIN self built rulerDST:
    let numofview = hourBuildRuler;
    let arrayofViews = [];
    let searchDate = this.props.searchDate
      ? this.props.searchDate
      : new Date() / 1000;
    const minValue = 60 / this.props.numofMin;
    // __DEV__ && console.log('GOND renderDST minValue = ', minValue);

    for (let i = 0; i < numofview; i++) {
      let value = this.state.hoursArray[i]; // i;
      if (hourBuildRuler == startDST && i == parseInt(hourSpecial)) {
        continue;
      }
      if (hourBuildRuler == endDST && i >= parseInt(hourSpecial)) {
        value = i - 1;
      }
      let objectValue = {
        // key: is24hour ? arrayof24HTime[value] : arrayof12HTime[value],
        key: value,
        visible: true,
        color: CMSColors.White,
        value: value,
      };

      let minArray = [];
      for (let j = 0; j < this.props.numofMin; j++) {
        // let start = j * minValue;
        // let end = start + (minValue - 1);
        let minObject = {};
        let long_start =
          searchDate + this.state.hoursValue[i] * 3600 + j * minValue * 60;
        let long_end = long_start + minValue * 60 - 1;
        // __DEV__ &&
        //   console.log(
        //     'GOND renderDST long_start = ',
        //     long_start,
        //     ', long_end = ',
        //     long_end
        //   );
        minObject.begin = long_start;
        minObject.end = long_end;
        minObject.id = -1;
        minArray.push(minObject);
      }
      objectValue.minData = minArray;
      arrayofViews.push(objectValue);
    }
    // END self built rulerDST
    if (this.props.markerPosition == 'absolute') {
      arrayofViews = this.renderTimeHeaderFooter(true)
        .concat(arrayofViews)
        .concat(this.renderTimeHeaderFooter(false));
    } else {
      arrayofViews = arrayofViews.concat(this.renderTimeHeaderFooter(true));
    }

    return arrayofViews;
  };

  renderHours = is24hour => {
    // console.log('GOND TimeRuler renderHours!')
    if (!this.props.timeData) return [];
    let numofview = this.state.hoursArray.length; // 24;
    let arrayofViews = [];
    // let _searchDateNow = new Date();
    // _searchDateNow = moment([_searchDateNow.getFullYear(), _searchDateNow.getMonth(), _searchDateNow.getDate()]).unix();
    // _searchDateNow = _searchDateNow / 1000;
    // let _searchDate = this.props.searchDate ? this.props.searchDate : _searchDateNow; //= new Date(this.searchDate ?this.searchDate:(this.props.searchDate?this.props.searchDate: Date.now()));
    // console.log('GOND TimeRuler _searchDate = ', _searchDate, ', ', dayjs(_searchDate * 1000).format()); //('DD/MM/YY HH:mm:ss'))
    // let searchDate = _searchDate;
    let searchDate = this.props.searchDate
      ? this.props.searchDate
      : new Date() / 1000;
    const minValue = 60 / this.props.numofMin;
    // __DEV__ && console.log('GOND renderHours searchDate = ', searchDate);
    for (let i = 0; i < numofview; i++) {
      let value = this.state.hoursArray[i]; // i;
      let objectValue = {
        // key: is24hour ? arrayof24HTime[i] : arrayof12HTime[i],
        key: value,
        visible: true,
        color: CMSColors.White,
        value: value,
      };
      let minArray = [];
      for (let j = 0; j < this.props.numofMin; j++) {
        // let start = j * minValue;
        // let end = start + (minValue - 1);
        let minObject = {};
        let long_start =
          searchDate + this.state.hoursValue[i] * 3600 + j * minValue * 60;
        let long_end = long_start + minValue * 60 - 1;
        // __DEV__ &&
        //   console.log(
        //     'GOND renderHours long_start = ',
        //     long_start,
        //     ', long_end = ',
        //     long_end
        //   );
        minObject.begin = long_start;
        minObject.end = long_end;
        minObject.id = -1;
        minArray.push(minObject);
      }
      objectValue.minData = minArray;
      arrayofViews.push(objectValue);
    }
    if (this.props.markerPosition == 'absolute') {
      arrayofViews = this.renderTimeHeaderFooter(true)
        .concat(arrayofViews)
        .concat(this.renderTimeHeaderFooter(false));
    } else {
      arrayofViews = arrayofViews.concat(this.renderTimeHeaderFooter(true));
    }
    // __DEV__ && console.log('GOND TimeRuler renderHours', arrayofViews);
    return arrayofViews;
  };

  renderMinutes = item => {
    if (item.visible == false) return <View />;
    let arrayofViews = [];
    let numOfSecs = this.props.numofMin;
    // let widthofViews = Dimensions.get('screen').width / this.state.secondValue;
    let secWidth = this.state.dwidth / numOfSecs;
    let heightofView = 10;
    let heighofPaint = 5;
    let timeData = this.props.timeData;
    let lastFound = '';
    let currentSpaceLength = 0;
    // console.log('GOND item: ', item, ', timeData: ', timeData);
    for (let i = 0; i < numOfSecs; i++) {
      let _foundColor = 'transparent';
      // console.log('GOND sec: ', 1, ', timeData: ', timeData);
      if (timeData) {
        let idx = timeData.findIndex(t => {
          let b1 = item.minData[i].begin,
            e1 = item.minData[i].end;
          let b2 = t.begin,
            e2 = t.end;
          // console.log(
          //   'GOND renderMinutes: \n- b1 = ',
          //   dayjs(b1).format('DD/MM/YY HH:mm:ss'),
          //   ', e1 = ',
          //   dayjs(e1).format('DD/MM/YY HH:mm:ss'),
          //   '\n- b2 = ',
          //   dayjs(b2).format('DD/MM/YY HH:mm:ss'),
          //   ', e2 = ',
          //   dayjs(e2).format('DD/MM/YY HH:mm:ss')
          // );

          let found1 = b2 <= b1 && b1 <= e1 && e1 <= e2;
          let found2 = b2 <= b1 && b1 <= e2 && e2 <= e1;
          let found3 = b1 <= b2 && b2 <= e1 && e1 <= e2;

          return found1 || found2 || found3;
        });
        // this.props.timeData &&
        //   this.props.timeData.length > 0 &&
        //   console.log(
        //     'GOND sec: ',
        //     item.minData[i],
        //     ' :: ',
        //     dayjs(item.minData[i].begin * 1000).format('DD/MM/YY HH:mm:ss'),
        //     ' - ',
        //     dayjs(item.minData[i].end * 1000).format('DD/MM/YY HH:mm:ss'),
        //     ', _foundIdx: ',
        //     idx
        //   );
        _foundColor =
          idx >= 0 ? this.getcolor(timeData[idx].type) : 'transparent';
        // _foundColor != 'transparent' &&
        //   console.log('GOND sec: ', i, ', _foundColor: ', _foundColor);
      }

      if (_foundColor == lastFound || lastFound == '') {
        currentSpaceLength += secWidth; //this.state.widthMarker;
      } else {
        arrayofViews.push(
          <View
            key={item.minData[i].begin + i}
            style={{
              height: heightofView,
              width: currentSpaceLength, // this.state.widthMarker,
              // borderLeftWidth: 1, borderRightWidth: 1, borderLeftColor: 'white', borderRightColor: 'white',
            }}>
            <View
              key={item.minData[i].begin + i}
              style={{
                height: heighofPaint,
                flex: 1,
                backgroundColor: lastFound,
              }}
            />
          </View>
        );
        currentSpaceLength = secWidth;
      }
      // console.log(
      //   'GOND spacelenght: ',
      //   currentSpaceLength,
      //   ', color: ',
      //   _foundColor
      // );
      lastFound = _foundColor;
    }
    // Push last part of time
    arrayofViews.push(
      <View
        key={'_last_min'}
        style={{
          height: heightofView,
          width: currentSpaceLength,
        }}>
        <View
          key={'_last_min'}
          style={{height: heighofPaint, flex: 1, backgroundColor: lastFound}}
        />
      </View>
    );
    // __DEV__ && console.log('GOND === TimeRuler arrayofViews: ', arrayofViews);
    return arrayofViews;
  };

  render() {
    const {
      is24hour,
      hourBuildRuler,
      hourSpecial,
      rulerDST,
      timeData,
    } = this.props;
    // console.log('GOND TimeRuler hourBuildRuler: ', hourBuildRuler);
    let _data =
      hourBuildRuler != default24H
        ? this.renderDST(is24hour, hourBuildRuler, hourSpecial, rulerDST)
        : this.renderHours(is24hour);
    // __DEV__ &&
    //   timeData &&
    //   console.log('GOND TimeRuler built ruler data: ', _data);
    const isEnable = timeData && timeData.length > 0;
    return (
      <View
        style={{
          flex: 1,
          height: this.props.height,
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }}
        onLayout={this.onLayout}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 10,
          }}>
          <ScrollView
            ref={sc => {
              this.scrollRef = sc;
            }}
            horizontal={true}
            style={{
              flex: 1,
              flexDirection: 'row',
              backgroundColor: isEnable
                ? CMSColors.PrimaryText
                : CMSColors.DisableItemColor,
            }}
            scrollEnabled={isEnable}
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={this.onScrollBeginDrag}
            onScroll={this.onScroll}
            onScrollEndDrag={this.onScrollEndDrag}
            // onMomentumScrollBegin={this.onPressIn}
            onMomentumScrollEnd={this.onScrollEnd}
            onTouchStart={this.onPressIn}
            onTouchEnd={this.onPressOut}
            bounces={false}
            scrollEventThrottle={16}>
            {_data.map((item, index) => {
              // console.log('GOND TimeRuler renderHour: ', item);
              return item ? (
                <View
                  key={index}
                  style={{
                    height: this.props.height,
                    width: this.state.dwidth,
                    paddingTop: 0,
                  }}>
                  <View
                    key={index + item.value}
                    style={{
                      flexDirection: 'row',
                      height: 20,
                      width: this.state.dwidth,
                      borderLeftWidth: 2,
                      borderTopWidth: 1,
                      borderTopColor: item.visible
                        ? 'gray'
                        : CMSColors.InactiveText,
                      borderLeftColor: 'gray',
                    }}>
                    {this.renderMinutes(item)}
                  </View>
                  <View
                    style={{
                      position: 'absolute',
                      flexDirection: 'row',
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <View
                      style={{
                        position: 'relative',
                        flex: 1,
                        height: 10,
                        borderRightWidth: 1,
                        borderColor: 'white',
                      }}
                    />
                    <View
                      style={{
                        position: 'relative',
                        flex: 1,
                        height: 10,
                        borderLeftWidth: 1,
                        borderColor: 'white',
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      color: item.visible ? item.color : CMSColors.InactiveText,
                      fontSize: this.props.fontSize,
                      left: -19,
                    }}>
                    {item.key}
                  </Text>
                </View>
              ) : null;
            })}
          </ScrollView>

          <View
            style={{
              backgroundColor: this.props.colorMarker,
              width: 10,
              height: this.props.height,
              position: this.props.markerPosition,
              opacity: 0.5,
            }}
          />
        </View>
      </View>
    );
  }
}
