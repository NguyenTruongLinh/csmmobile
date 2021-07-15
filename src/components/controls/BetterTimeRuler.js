import React, {PureComponent} from 'react';
import {Dimensions, View, ScrollView, Text} from 'react-native';
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
} from '../../consts/video';
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
    scrollTo: this.scrollTo,
    // startAt: 0,
    hourBuildRuler: default24H,
    hourSpecial: '',
    rulerDST: null,
  };
  constructor(props) {
    super(props);
    // this.arrayof24HTime = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
    // this.arrayof12HTime = ['12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'];
    this.color = ['pink', 'orange', 'blue', 'green', '00ff00'];
    this.isSrolling = true;
    this.PressOut = true;
    this.searchDate = this.props.searchDate;

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
    this.state = {
      widthMarker:
        Dimensions.get('screen').width /
        (this.props.numofHours * this.props.numofMin),
      numofMin: this.props.numofMin,
      dwidth: Dimensions.get('screen').width / this.props.numofHours, //*this.props.numofHours*/)
      secondValue: this.props.numofHours * this.props.numofMin,
      onScroll: this.props.onScroll,
      labelhour: '',
    };

    this.isScrollingDrag = false;
  }

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
    if (this.isSrolling) this.sc.scrollTo({x: x, y: y, animated: false});
  };

  componentDidMount() {
    Dimensions.addEventListener('change', this._onDimensionChange);
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this._onDimensionChange);
  }

  componentDidUpdate(prevProps) {
    const {currentTime, searchDate} = this.props;
    const lastTime = prevProps.currentTime;
    // __DEV__ &&
    //   console.log(
    //     'GOND Timeline prev frameTime: ',
    //     lastTime,
    //     ', this.isScrollingDrag',
    //     this.isScrollingDrag
    //   );
    if (currentTime != lastTime && !this.isScrollingDrag) {
      let sec = currentTime - searchDate;
      let secWidth = this.state.dwidth / (SECONDS_PER_MINUTE * MINUTE_PER_HOUR);

      // TODO: handle DST
      // ---

      console.log('GOND move timeline, sec: ', sec, ', secW = ', secWidth);
      this.scrollTo(sec * secWidth, 0);
    }
  }

  _onDimensionChange = event => {
    let d = Dimensions.get('screen').width;
    this.setState({
      dwidth: d / this.props.numofHours,
      widthMarker: d / (this.props.numofHours * this.props.numofMin),
    });
  };

  _roundOddToEven = value => {
    if (value == 0) return 2;
    if (value % 2 == 0) return value;

    let rs = value + 1;
    return rs;
  };
  _renderTimeHeaderFooter = isheader => {
    let arrayHours = this.props.is24hour
      ? arrayof24HTime.slice(0)
      : arrayof12HTime.slice(0);
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
    this.timeData = this.props.timeData;
    if (!this.timeData) return [];

    if (Array.isArray(rulerDST) && rulerDST.length > 0) {
      let arrayofViews = rulerDST;
      if (this.props.markerPosition == 'absolute')
        arrayofViews = this._renderTimeHeaderFooter(true)
          .concat(arrayofViews)
          .concat(this._renderTimeHeaderFooter(false));
      else
        arrayofViews = arrayofViews.concat(this._renderTimeHeaderFooter(true));

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
      let value = i;
      if (hourBuildRuler == startDST && i == parseInt(hourSpecial)) {
        continue;
      }
      if (hourBuildRuler == endDST && i >= parseInt(hourSpecial)) {
        value = i - 1;
      }
      let objectValue = {
        key: is24hour ? arrayof24HTime[value] : arrayof12HTime[value],
        visible: true,
        color: CMSColors.White,
        value: value,
      };

      let minArray = [];
      for (let j = 0; j < this.props.numofMin; j++) {
        // let start = j * minValue;
        // let end = start + (minValue - 1);
        let _objectValue = {};
        // let hasData = this.timeData != null && this.timeData.length > 0;
        let long_start = searchDate + i * 3600 + j * minValue * 60;
        let long_end = long_start + minValue * 60 - 1;
        // __DEV__ &&
        //   console.log(
        //     'GOND renderDST long_start = ',
        //     long_start,
        //     ', long_end = ',
        //     long_end
        //   );
        _objectValue.begin = long_start;
        _objectValue.end = long_end;
        _objectValue.id = -1;
        minArray.push(_objectValue);
      }
      objectValue.minData = minArray;
      arrayofViews.push(objectValue);
    }
    // END self built rulerDST
    if (this.props.markerPosition == 'absolute') {
      arrayofViews = this._renderTimeHeaderFooter(true)
        .concat(arrayofViews)
        .concat(this._renderTimeHeaderFooter(false));
    } else {
      arrayofViews = arrayofViews.concat(this._renderTimeHeaderFooter(true));
    }

    return arrayofViews;
  };

  _renderHours = is24hour => {
    // console.log('GOND TimeRuler _renderHours!')
    this.timeData = this.props.timeData;
    if (!this.timeData) return [];
    let numofview = 24;
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
    __DEV__ && console.log('GOND renderHours searchDate = ', searchDate);
    for (let i = 0; i < numofview; i++) {
      let value = i;
      let objectValue = {
        key: is24hour ? arrayof24HTime[i] : arrayof12HTime[i],
        visible: true,
        color: CMSColors.White,
        value: value,
      };
      let minArray = [];
      for (let j = 0; j < this.props.numofMin; j++) {
        // let start = j * minValue;
        // let end = start + (minValue - 1);
        let _objectValue = {};
        // let hasData = this.timeData != null && this.timeData.length > 0;
        let long_start = searchDate + i * 3600 + j * minValue * 60;
        let long_end = long_start + minValue * 60 - 1;
        // __DEV__ &&
        //   console.log(
        //     'GOND renderHours long_start = ',
        //     long_start,
        //     ', long_end = ',
        //     long_end
        //   );
        _objectValue.begin = long_start;
        _objectValue.end = long_end;
        _objectValue.id = -1;
        minArray.push(_objectValue);
      }
      objectValue.minData = minArray;
      arrayofViews.push(objectValue);
    }
    if (this.props.markerPosition == 'absolute') {
      arrayofViews = this._renderTimeHeaderFooter(true)
        .concat(arrayofViews)
        .concat(this._renderTimeHeaderFooter(false));
    } else {
      arrayofViews = arrayofViews.concat(this._renderTimeHeaderFooter(true));
    }

    return arrayofViews;
  };

  _renderminutes = item => {
    if (item.visible == false) return <View />;
    let arrayofViews = [];
    let numOfSecs = this.props.numofMin;
    let widthofViews = Dimensions.get('screen').width / this.state.secondValue;
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
          //   'GOND _renderminutes: \n- b1 = ',
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

  _onSrollEnd = event => {
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
    if (this.props.onScrollEnd) {
      this.props.onScrollEnd(event, {
        hour: hour,
        minutes: minutes,
        seconds: seconds,
        milisecondValue: hour * 3600 + minutes * 60 + seconds,
      });
      this.isSrolling = true;
      this.PressOut = true;
      return;
    }
  };
  _onPressIn = event => {
    if (this.props.onBeginSrcoll) {
      this.props.onBeginSrcoll();
    }
    this.isSrolling = false;
    this.PressOut = false;
  };
  // _onPressOut = (event) => {
  //   this.isSrolling = true;
  //   this.PressOut = true;
  // }
  formatTime = value => {
    return parseInt(value) > 9 ? value : '0' + value;
  };
  _onScrollBeginDrag = event => {
    this.isScrollingDrag = true;
    this.props.onPauseVideoScrolling();
    this.props.setShowHideTimeOnTimeRule(true);
  };
  _onScroll = event => {
    let {hourBuildRuler, hourSpecial} = this.props;
    if (this.isScrollingDrag == true) {
      this.isSrolling = true;
      let decimalhour = event.nativeEvent.contentOffset.x / this.state.dwidth;
      let hour = Math.floor(decimalhour);
      let decimalminutes = (decimalhour - hour) * 60;
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
      if (hourBuildRuler == startDST && hour >= hourSpecial) {
        hour++;
      } else if (hourBuildRuler == endDST && hour >= hourSpecial) {
        hour--;
      }

      //this.props.onScrollBeginDrag({hour:hour,minutes:minutes,seconds:seconds, milisecondValue: (hour*3600+minutes*60+seconds) });
      this.props.onScrollBeginDrag(
        this.formatTime(hour) +
          ':' +
          this.formatTime(minutes) +
          ':' +
          this.formatTime(seconds)
      );
      //console.log(decimalhour);
    }
  };
  _onScrollEndDrag = event => {
    this.isScrollingDrag = false;
    this.props.setShowHideTimeOnTimeRule(false);
    this._onSrollEnd(event);
  };

  render() {
    let {is24hour, hourBuildRuler, hourSpecial, rulerDST} = this.props;
    // console.log('GOND TimeRuler hourBuildRuler: ', hourBuildRuler);
    let _data =
      hourBuildRuler != default24H
        ? this.renderDST(is24hour, hourBuildRuler, hourSpecial, rulerDST)
        : this._renderHours(is24hour);
    // __DEV__ &&
    //   this.props.timeData &&
    //   console.log('GOND TimeRuler built ruler data: ', _data);
    return (
      <View
        style={{
          flex: 1,
          height: this.props.height,
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }}>
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
              this.sc = sc;
            }}
            horizontal={true}
            style={{
              flex: 1,
              flexDirection: 'row',
              backgroundColor: CMSColors.PrimaryText,
            }}
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={this._onScrollBeginDrag}
            onScroll={this._onScroll}
            onScrollEndDrag={this._onScrollEndDrag}
            onMomentumScrollBegin={this._onPressIn}
            onMomentumScrollEnd={this._onSrollEnd}
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
                    {this._renderminutes(item)}
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
