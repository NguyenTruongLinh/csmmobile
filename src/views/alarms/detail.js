import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';
import PropTypes from 'prop-types';
import {inject, observer} from 'mobx-react';
import BigNumber from 'bignumber.js';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import {LiquidLike} from 'react-native-animated-pagination-dots';
import {AirbnbRating} from 'react-native-ratings';
import Svg, {Polygon} from 'react-native-svg';
import {DateTime} from 'luxon';

import TransThumb from '../../components/views/TransThumb';
import {IconCustom} from '../../components/CMSStyleSheet';
import Button from '../../components/controls/Button';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';

import util from '../../util/general';
import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import variable from '../../styles/variables';
import {
  Comps as ComponentTxt,
  Settings as SettingsTxt,
  Alarm as AlarmTxt,
} from '../../localization/texts';
import {DateFormat, AlertTypes, AlertNames} from '../../consts/misc';
import ROUTERS from '../../consts/routes';

const ID_Canned_Message = 5;
const CONTENT_INFO_HEIGHT = 92;

class AlarmDetailView extends Component {
  constructor(props) {
    super(props);
    const {selectedAlarm} = props.alarmStore;
    const {width, height} = Dimensions.get('window');

    if (!selectedAlarm) return;
    this.state = {
      rating: props.alarmStore.getRate(selectedAlarm.rate),
      note: selectedAlarm.note,
      viewableWindow: {width, height},
      imgSize: this.getImageSize(width, height),
      activeIndex: 0,
    };
    this.scrollX = new Animated.Value(0);
  }

  async componentDidMount() {
    const {alarmStore} = this.props;
    __DEV__ && console.log('AlarmDetail componentDidMount');

    if (!alarmStore.vaConfig || alarmStore.vaConfig.length == 0) {
      alarmStore.getVAConfigs();
    }
    if (!alarmStore.rateConfig || alarmStore.rateConfig.length == 0) {
      alarmStore.getConfigs();
    }
    this.refreshHeader();
    alarmStore.selectedAlarm.loadSnapshotImages();
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlarmDetail componentWillUnmount');
  }

  refreshHeader = () => {
    const {alarmStore} = this.props;
    const {selectedAlarm} = alarmStore;
    const {rating, note, activeIndex} = this.state;
    const canSave =
      note != selectedAlarm.note || rating.rateId != selectedAlarm.rate;
    const currentSnapshot = selectedAlarm.snapshot[activeIndex] ?? {
      channelName: 'Channel ' + (selectedAlarm.channelNo + 1),
    };

    /* __DEV__ &&
      console.log(
        'GOND canSave: note ',
        currentSnapshot,
        ',  a.note: ',
        selectedAlarm.note,
        ' > ',
        note != selectedAlarm.note,
        '\n rating: ',
        rating,
        ', a.rate: ',
        selectedAlarm.rate,
        ' > ',
        rating.rateId != selectedAlarm.rate
      );*/

    this.props.navigation.setOptions({
      headerRight: () => (
        <Button
          style={[
            commonStyles.buttonSave,
            // {borderWidth: 2, borderColor: 'red'},
          ]}
          caption={SettingsTxt.save}
          enable={canSave}
          onPress={() =>
            alarmStore.updateSelectedAlarm({
              rate: rating.rateId,
              note,
            })
          }
          styleCaption={commonStyles.buttonSaveText}
          type="flat"
        />
      ),
      headerTitle: () => (
        <View style={{flexDirection: 'column', marginLeft: -20}}>
          <Text style={{fontWeight: 'bold', fontSize: 18}}>
            {currentSnapshot.channelName}
          </Text>
          <Text style={{}}>{selectedAlarm.siteName}</Text>
        </View>
      ),
      headerTitleAlign: 'left',
    });
  };

  onLayout = event => {
    const {x, y, width, height} = event.nativeEvent.layout;
    const {gridLayout} = this.state;
    __DEV__ && console.log('ChannelsView onLayout: ', event.nativeEvent);
    this.setState({
      viewableWindow: {
        width,
        height,
      },
      imgSize: this.getImageSize(width, height),
    });
  };

  onNoteChange = value => {
    this.setState({note: value}, () => this.refreshHeader());
  };

  onRatingChange = value => {
    this.setState({rating: this.props.alarmStore.getRate(5 - value)}, () =>
      this.refreshHeader()
    );
  };

  onVisibleImageChanged = ({viewableItems}) => {
    __DEV__ && console.log('GOND onSnapshot item changed: ', viewableItems);
    for (let i = 0; i < viewableItems.length; i++) {
      if (viewableItems.isViewable)
        this.setState({activeIndex: viewableItems.index}, () =>
          this.refreshHeader()
        );
    }
  };

  handleScroll = event => {
    // Save the x (horizontal) value each time a scroll occurs
    this.scrollX.setValue(event.nativeEvent.contentOffset.x);
  };

  getImageSize = (width, height) => {
    // portrail mode
    if (width < height) {
      let v_width = Math.min(width, height);
      let v_height = this.state ? this.state.viewableWindow.height : height;
      // __DEV__ &&
      //   console.log(
      //     'GOND getImageSize w = ',
      //     v_width,
      //     ', h = ',
      //     v_height,
      //     ', size = ',
      //     util.getImageSize({width: v_width, height: v_height})
      //   );
      return util.getImageSize({width: v_width, height: v_height});
    } else {
      //lanscape mode
      let v_width = parseInt(Math.max(width, height) / 2);
      let v_height = this.state ? this.state.viewableWindow.height : height;
      return util.getImageSize({
        width: v_width,
        height: v_height,
      });
    }
  };

  gotoVideo = isLive => {
    const {alarmStore, videoStore, navigation} = this.props;

    videoStore.onAlarmPlay(isLive, alarmStore.selectedAlarm);
    setTimeout(() => {
      navigation.push(ROUTERS.VIDEO_PLAYER);
    }, 200);
  };

  renderViolationGroup = (imgSize, coordinateList) => {
    return (
      <View
        style={[
          imgSize,
          {top: 0, left: 0, position: 'absolute', alignItems: 'center'},
        ]}>
        <Svg
          height="100%"
          width="100%"
          viewBox={'0 0 ' + imgSize.width + ' ' + imgSize.height} //"0 0 100 100"
          // style={{position: 'absolute', borderWidth: 2, borderColor: 'blue'}}
        >
          <Polygon
            points={coordinateList
              .map(point => {
                let res = '' + point.x + ',' + point.y;
                // console.log('GOND --- point: ', res)
                return res;
              }, [])
              .join(' ')}
            stroke="red"
            strokeWidth="0.5"
            fill="none"
          />
        </Svg>
      </View>
    );
  };

  renderAlertStatus = () => {
    let {status} = this.props.alarmStore.selectedAlarm;
    if (status == 1)
      return (
        <View style={styles.statusContainer}>
          <View
            style={{
              justifyContent: 'center',
              paddingRight: variable.inputPaddingLeft,
            }}>
            <IconCustom
              name={'check-symbol'}
              size={12}
              color={CMSColors.White}
            />
          </View>
          <Text
            numberOfLines={1}
            style={{fontSize: 12, color: CMSColors.White}}>
            {AlarmTxt.process}
          </Text>
        </View>
      );
  };

  renderImage = ({item}) => {
    const {selectedAlarm} = this.props.alarmStore;
    const alertStatus = this.renderAlertStatus();
    let violationGroup = null;
    __DEV__ && console.log('GOND renderImage: ', item);

    if (
      this.state.alertType === AlertTypes.SOCIAL_DISTANCE &&
      Array.isArray(selectedAlarm.extra) &&
      selectedAlarm.extra.length > 2
    ) {
      const ratio = {
        x: this.state.imgSize.width,
        y: this.state.imgSize.height,
      };
      const coordinateList = selectedAlarm.extra.map(item => {
        let [x, y] = item.value ? item.value.split(';') : [0, 0];

        return {
          x: '' + parseFloat(x) * ratio.x,
          y: '' + parseFloat(y) * ratio.y,
        };
      });
      violationGroup = this.renderViolationGroup(
        this.state.imgSize,
        coordinateList
      );
    }

    return (
      <View style={{...this.state.imgSize, flex: 1}}>
        <View
          style={[this.state.imgSize, {top: 0, left: 0, position: 'absolute'}]}>
          <TransThumb
            data={item}
            containerStyle={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            imageSize={this.state.imgSize}
            imageStyle={{
              resizeMode: selectedAlarm.isTemperatureAlert
                ? 'contain'
                : 'stretch',
            }}
            resizeMode="contain"
          />
          {violationGroup}
        </View>
        {alertStatus}
      </View>
    );
  };

  renderInfoDescription = () => {
    let {description, kAlertTypeVA, kAlertType, isSDAlert} =
      this.props.alarmStore.selectedAlarm;

    // __DEV__ && console.log('GOND infoDesc: ', description);
    if (kAlertType != AlertTypes.DVR_VA_detection) {
      if (isSDAlert) {
        return description.split(',')[0] + ': Social distance';
      }
      // __DEV__ && console.log('GOND infoDesc not change');
      return description;
    }

    try {
      // version old
      if (description.includes(':')) {
        let lstT = description.split(' ');
        if (!lstT || lstT.length == 0) return '';
        lstT[lstT.length - 1] = util.getAlertTypeVA(kAlertTypeVA);
        return lstT.join(' ');
      } else {
        let lst = description.split('.');
        //console.log(lst);
        if (!lst || lst.length == 0) return '';
        lst[lst.length - 1] = util.getAlertTypeVA(kAlertTypeVA);
        lst[lst.length - 2] = util.capitalize(lst[lst.length - 2], '&');
        lst[lst.length - 2] = ': ' + util.capitalize(lst[lst.length - 2], '/');
        lst[0] = lst[0] ? lst[0] + '.' : '';
        lst[1] = lst[1] ? lst[1] + '.' : '';
        let newlst = lst.map(s => s.trim());
        __DEV__ && console.log('GOND infoDesc: va', newlst.join(' '));
        return util.capitalize(newlst.join(' '));
      }
    } catch (err) {
      console.log('GOND VAAlert split description failed: ', err);
      return description;
    }
  };

  renderTemperatureItem = ({index, item}) => {
    const strTime =
      typeof item.key === 'string'
        ? item.key
        : DateTime.fromISO(item.key, {zone: 'utc'}).toFormat(
            DateFormat.AlertDetail_Date
          );
    const iconSize = 16;
    return this.state.alertType ===
      AlertTypes.TEMPERATURE_INCREASE_RATE_BY_DAY ? (
      <View style={(styles.timeInfoContainer, {flexDirection: 'row'})}>
        {/* <View style={styles.timeInfoContainer}> */}
        <View style={{justifyContent: 'center'}}>
          <IconCustom
            name="clock-with-white-face"
            size={iconSize}
            color={CMSColors.SecondaryText}
          />
        </View>
        <Text style={styles.temp_text}>{strTime}</Text>
        {/* </View> */}
        <View style={{padding: variable.contentPadding}} />
        <View style={{justifyContent: 'center'}}>
          <IconCustom
            name="ic-temperature-32px"
            size={iconSize}
            color={CMSColors.SecondaryText}
          />
        </View>
        <Text style={styles.temp_text}>
          {item.value /* + String.fromCharCode(176) + 'C'*/}
        </Text>
      </View>
    ) : (
      <View style={[styles.timeInfoContainer, {flexDirection: 'column'}]}>
        <View style={[{flexDirection: 'row'}]}>
          <View style={{justifyContent: 'center'}}>
            <IconCustom
              name="ic-temperature-32px"
              size={iconSize}
              color={CMSColors.SecondaryText}
            />
          </View>
          <Text
            style={[
              styles.temp_text,
              this.state.alertType === AlertTypes.TEMPERATURE_OUT_OF_RANGE
                ? {color: CMSColors.Danger}
                : {},
            ]}>
            {item.value /* + String.fromCharCode(176) + 'C'*/}
          </Text>
        </View>
        <View style={styles.timeInfoContainer}>
          <View style={{justifyContent: 'center'}}>
            <IconCustom
              name="clock-with-white-face"
              size={iconSize}
              color={CMSColors.SecondaryText}
            />
          </View>
          <Text style={styles.temp_text}>{strTime}</Text>
        </View>
      </View>
    );
  };

  renderTemperatureInfo = () => {
    const {selectedAlarm} = this.props.alarmStore;
    if (!selectedAlarm || !selectedAlarm.extra) return null;

    const isIncreaseTemp =
      selectedAlarm.kAlertType === AlertTypes.TEMPERATURE_INCREASE_RATE_BY_DAY;
    let contentHeight = isIncreaseTemp
      ? 22 * (selectedAlarm.extra.length + 2)
      : CONTENT_INFO_HEIGHT;
    let padding = variable.contentPadding;

    // console.log('GOND renderTemperatureInfo extradata: ', selectedAlarm.extra)
    let cmsUserInfo = selectedAlarm.cmsUser ? (
      <View
        style={{flexDirection: 'row', alignItems: 'center', marginBottom: 2}}>
        <Text style={{width: 40, textAlign: 'center'}}>-</Text>
        <View style={{justifyContent: 'center'}}>
          <IconCustom
            name="user-shape"
            size={12}
            color={CMSColors.SecondaryText}
          />
        </View>
        <Text style={styles.name_text}>{selectedAlarm.cmsUser}</Text>
      </View>
    ) : null;

    return (
      <View style={[styles.infoContainer, {height: contentHeight}]}>
        <View style={styles.leftInfoContainer}>
          <View style={[styles.textInfoContainer, {paddingLeft: padding}]}>
            <Text numberOfLines={2} style={styles.textInfo}>
              {AlertNames[selectedAlarm.kAlertType]}
            </Text>
            <FlatList
              data={selectedAlarm.extra}
              renderItem={this.renderTemperatureItem}
              keyExtractor={(item, index) => index.toString()}
              initialNumToRender={selectedAlarm.extra.length}
            />
            {isIncreaseTemp ? cmsUserInfo : null}
          </View>
          {isIncreaseTemp ? null : cmsUserInfo}
        </View>
        {this.renderVideoButtons()}
      </View>
    );
  };

  renderInfo = index => {
    const {selectedAlarm} = this.props.alarmStore;

    if (selectedAlarm.isTemperatureAlert) return this.renderTemperatureInfo();
    const padding = variable.contentPadding;

    let strTime = DateTime.fromISO(selectedAlarm.timezone, {
      zone: 'utc',
    }).toFormat(DateFormat.AlertDetail_Date);

    let cmsUserInfo = selectedAlarm.cmsUser ? (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Text style={{width: 40, textAlign: 'center'}}>-</Text>
        <View style={{justifyContent: 'center'}}>
          <IconCustom
            name="user-shape"
            size={12}
            color={CMSColors.SecondaryText}
          />
        </View>
        <Text style={styles.date_text}>{selectedAlarm.cmsUser}</Text>
      </View>
    ) : null;

    return (
      <View style={[styles.infoContainer, {height: CONTENT_INFO_HEIGHT}]}>
        <View style={styles.leftInfoContainer}>
          {/* {this.renderActionButton(BUTTON_TYPE.SEARCH)} */}
          {/* <View style={[ styles.textInfoContainer, Platform.OS == 'ios' ? {paddingRight: btn_size + 2 * padding} : {paddingLeft: btn_size + 2* padding} ]} > */}
          <View
            style={[
              styles.textInfoContainer,
              {paddingLeft: /*btn_size + 2**/ padding},
            ]}>
            <Text numberOfLines={2} style={styles.textInfo}>
              {this.renderInfoDescription()}
            </Text>
            <View style={styles.timeInfoContainer}>
              <View style={{justifyContent: 'center'}}>
                <IconCustom
                  name="clock-with-white-face"
                  size={12}
                  color={CMSColors.SecondaryText}
                />
              </View>
              <Text style={styles.date_text}>{strTime}</Text>
              {cmsUserInfo}
            </View>
          </View>
        </View>
        {this.renderVideoButtons()}
      </View>
    );
  };

  renderVideoButtons = () => {
    return (
      <View
        style={{
          flex: 3,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <CMSTouchableIcon
            iconCustom="searching-magnifying-glass"
            size={26}
            onPress={() => this.gotoVideo(false)}
            color={CMSColors.ColorText}
          />
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <CMSTouchableIcon
            iconCustom="videocam-filled-tool"
            size={26}
            onPress={() => this.gotoVideo(true)}
            color={CMSColors.ColorText}
          />
        </View>
      </View>
    );
  };

  renderNoteInput = () => {
    return (
      <View style={{flexDirection: 'column'}}>
        <Text style={{color: CMSColors.InactiveText, paddingLeft: 25}}>
          Note
        </Text>
        <TextInput
          style={styles.inputNote}
          underlineColorAndroid={CMSColors.transparent}
          multiline={true}
          allowFontScaling={true}
          // numberOfLines={4}
          onChangeText={this.onNoteChange}
          autoCorrect={false}
          enablesReturnKeyAutomatically={true}
          value={this.state.note}
          maxLength={250}
          placeholder={ComponentTxt.notePlaceholder}
          placeholderTextColor={CMSColors.InactiveText}
        />
      </View>
    );
  };

  renderRating = () => {
    const {rateId} = this.state.rating;

    return (
      <View
        style={{
          borderWidth: 0,
          flexDirection: 'column',
          paddingTop: variable.inputPaddingLeft,
          paddingBottom: variable.inputPaddingLeft,
          justifyContent: 'center',
          alignItems: 'center', //height: 56,
          // borderBottomWidth: 1,
          // borderColor: CMSColors.DividerColor54,
        }}>
        <AirbnbRating
          type="star"
          showRating={false}
          ratingCount={5}
          defaultRating={rateId == -1 ? rateId : 5 - rateId}
          size={30}
          allowEmpty={true}
          onFinishRating={this.onRatingChange}
        />
        {/* <Text   numberOfLines={1} >{msg_info}</Text> */}
        <Text style={{padding: 8}}>{this.state.rating.rateName}</Text>
      </View>
    );
  };

  render() {
    const {selectedAlarm} = this.props.alarmStore;
    // const indicator = this.renderIndicator();

    const {imgSize} = this.state;
    return (
      <View style={styles.container} onLayout={this.onLayout}>
        <KeyboardAwareScrollView>
          <View style={{flex: 1, height: imgSize.height, flexDirection: 'row'}}>
            <FlatList
              pagingEnabled={true}
              style={{flex: 1}}
              initialScrollIndex={this.state.activeIndex}
              onViewableItemsChanged={this.onVisibleImageChanged}
              // onScroll={Animated.event(
              //   // Animated.event returns a function that takes an array where the first element...
              //   [{nativeEvent: {contentOffset: {x: this.scrollX}}}],
              //   {useNativeDriver: false}
              // )} // in this case we are mapping the value of nativeEvent.contentOffset.x to this.scrollX
              horizontal={true}
              getItemLayout={(data, index) => ({
                length: imgSize.width,
                offset: imgSize.width * index,
                index,
              })}
              data={selectedAlarm.snapshot}
              renderItem={this.renderImage}
              onScroll={this.handleScroll}
              keyExtractor={(item, index) =>
                item.channelNo ? `${item.channelNo}_${index}` : `_${index}`
              }
            />
            <View
              style={{
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'flex-end',
                left: 0,
                right: 0,
                height: '100%',
                flexDirection: 'row',
                paddingBottom: 5,
              }}>
              <LiquidLike
                data={selectedAlarm.snapshot}
                scrollX={this.scrollX}
                scrollOffset={this.scrollX}
                inActiveDotColor={CMSColors.Inactive}
                activeDotColor={CMSColors.White}
                strokeWidth={3}
              />
            </View>
            {/* {indicator} */}
            {/* {this.renderActionButton(BUTTON_TYPE.LIVE, 50)}
            {this.renderActionButton(BUTTON_TYPE.SEARCH)} */}
          </View>
          <View style={{flex: 1}}>
            {this.renderInfo()}
            {this.renderRating()}
            {this.renderNoteInput()}
          </View>
        </KeyboardAwareScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingLeft: variable.inputPaddingLeft
    // , paddingRight: variable.inputPaddingLeft
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: CMSColors.DividerColor24,
    height: CONTENT_INFO_HEIGHT,
    flex: 1,
  },
  textInfoContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  textInfo: {
    fontSize: 16,
    color: CMSColors.PrimaryColor,
    justifyContent: 'center',
  },
  Indicator: {
    flexDirection: 'row',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: 0,
    right: 0,
    bottom: variable.contentPadding,
  },
  leftInfoContainer: {
    flex: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  RightInfoContainer: {
    flex: 1,
    paddingRight: variable.contentPadding,
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date_text: {
    color: CMSColors.PrimaryText,
    fontSize: 14,
    paddingLeft: variable.inputPaddingLeft,
    //paddingTop: 3
  },
  name_text: {
    color: CMSColors.PrimaryText,
    fontSize: 14,
    paddingLeft: variable.inputPaddingLeft,
  },
  temp_text: {
    color: CMSColors.PrimaryText,
    fontSize: 16,
    paddingLeft: variable.inputPaddingLeft + 4,
  },
  inputNote: {
    color: CMSColors.DarkText,
    // height: 130,
    borderBottomWidth: 1,
    borderColor: CMSColors.DarkText,
    // borderRadius: 4,
    textAlignVertical: 'top',
    padding: 10,
    fontSize: 14,
    margin: 10,
    marginLeft: 20,
    marginRight: 20,
  },
  subtext: {
    color: CMSColors.SecondaryText,
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: variable.inputPaddingLeft,
    backgroundColor: CMSColors.Success,
    width: 74,
    height: 22,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    marginTop: 24,
  },
});

export default inject('alarmStore', 'videoStore')(observer(AlarmDetailView));
