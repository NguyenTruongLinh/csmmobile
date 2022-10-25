import React, {Component} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Dimensions,
  Animated,
  LogBox,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import {LiquidLike} from 'react-native-animated-pagination-dots';
import {AirbnbRating} from 'react-native-ratings';
import Svg, {Polygon} from 'react-native-svg';
import {DateTime} from 'luxon';
import {reaction} from 'mobx';

import TransThumb from '../../components/views/TransThumb';
import {IconCustom} from '../../components/CMSStyleSheet';
import Button from '../../components/controls/Button';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import RatingDetail from './components/rating';

import util from '../../util/general';
import snackbarUtil from '../../util/snackbar';
import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import variable from '../../styles/variables';
import theme from '../../styles/appearance';
import styles from './styles/detailStyles';

import {
  Comps as ComponentTxt,
  Settings as SettingsTxt,
  ALARM as ALARM_TXT,
  VIDEO as VIDEO_TXT,
} from '../../localization/texts';
import {DateFormat, AlertTypes, AlertNames} from '../../consts/misc';
import ROUTERS from '../../consts/routes';

const CONTENT_INFO_HEIGHT = 92;
const STATUS_HEIGHT = 17;

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
      isLoading: false,
    };
    this.scrollX = new Animated.Value(0);
    this.reactions = [];
    this._isMounted = false;
    this.shouldReloadOnExit = false;
    this.unsubFocusEvent = null;
    this.currentPage = 0;
  }

  async componentDidMount() {
    const {alarmStore, videoStore, navigation} = this.props;
    this._isMounted = true;
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
    __DEV__ && console.log('AlarmDetail componentDidMount');

    if (!alarmStore.vaConfig || alarmStore.vaConfig.length == 0) {
      alarmStore.getVAConfigs();
    }
    if (!alarmStore.rateConfig || alarmStore.rateConfig.length == 0) {
      alarmStore.getConfigs();
    }
    this.setHeader();
    alarmStore.selectedAlarm.loadSnapshotImages();
    this.initReactions();
    this.unsubFocusEvent = navigation.addListener('focus', () => {
      videoStore.setShouldShowVideoMessage(false);
    });

    this.unsubBlurEvent = navigation.addListener('blur', () => {
      this.currentPageUpdateAllowed = false;
    });

    let res = await videoStore.getDVRPermission(alarmStore.selectedAlarm.kDVR);

    // Preload video streaming: Live mode
    __DEV__ && console.log('GOND alarm detail: ', alarmStore.selectedAlarm);
    if (
      videoStore.isAuthenticated &&
      videoStore.isCloud &&
      videoStore.canEnterChannel(alarmStore.selectedAlarm.channelNo, true)
    )
      res = await videoStore.onAlertPlay(true, alarmStore.selectedAlarm, true);
    videoStore.enterVideoView(true);
  }

  componentWillUnmount() {
    const {alarmStore, videoStore} = this.props;
    __DEV__ && console.log('AlarmDetail componentWillUnmount');
    this._isMounted = false;

    this.unsubFocusEvent && this.unsubFocusEvent();
    this.unsubBlurEvent && this.unsubBlurEvent();
    alarmStore.onExitAlarmDetail();
    if (videoStore.isPreloadStream) videoStore.onExitSinglePlayer();
    videoStore.releaseStreams();
    this.reactions && this.reactions.forEach(unsubscribe => unsubscribe());

    videoStore.enterVideoView(false);
  }

  initReactions = () => {
    const {alarmStore, navigation} = this.props;
    this.reactions = [
      reaction(
        () => alarmStore.selectedAlarm,
        (newValue, previousValue) => {
          if (newValue == null && this._isMounted) {
            navigation.goBack();
          }
        }
      ),
    ];
  };

  setHeader = headerRightOnly => {
    const {alarmStore, appStore} = this.props;
    const {selectedAlarm} = alarmStore;
    const {appearance} = appStore;
    if (!selectedAlarm) return;

    const {rating, note, activeIndex} = this.state;
    const canSave =
      selectedAlarm.status != 1 ||
      note != selectedAlarm.note ||
      rating.rateId != selectedAlarm.rate;
    const currentSnapshot = selectedAlarm.snapshot[activeIndex] ?? {
      channelName: 'Channel ' + (selectedAlarm.channelNo + 1),
    };

    const siteName =
      selectedAlarm.siteName && selectedAlarm.siteName.length > 0
        ? selectedAlarm.siteName
        : selectedAlarm.serverID;
    const headerRightCb = () => (
      <Button
        style={[commonStyles.buttonSave]}
        caption={SettingsTxt.save}
        enable={canSave}
        onPress={this.onSave}
        styleCaption={commonStyles.buttonSaveText}
        type="flat"
      />
    );
    const headerTitleCb = () => (
      <View style={{flexDirection: 'column', marginLeft: -20}}>
        <Text
          style={[{fontWeight: 'bold', fontSize: 18}, theme[appearance].text]}>
          {selectedAlarm.isTempSDAlert
            ? selectedAlarm.dvrUser && selectedAlarm.dvrUser.length > 0
              ? selectedAlarm.dvrUser
              : ALARM_TXT.NONEMPLOYEE
            : currentSnapshot.channelName}
        </Text>
        <Text
          style={[{fontSize: 16, textAlign: 'center'}, theme[appearance].text]}
          numberOfLines={1}>
          {siteName}
        </Text>
      </View>
    );

    this.props.navigation.setOptions(
      headerRightOnly
        ? {
            headerRight: headerRightCb,
            headerTitleAlign: 'center',
          }
        : {
            headerRight: headerRightCb,
            headerTitle: headerTitleCb,
            headerTitleAlign: 'center',
          }
    );
  };

  onLayout = event => {
    const {x, y, width, height} = event.nativeEvent.layout;

    this.setState({
      viewableWindow: {
        width,
        height,
      },
      imgSize: this.getImageSize(width, height),
    });
  };

  onSave = async () => {
    const {rating, note} = this.state;
    const {userStore, alarmStore} = this.props;

    // console.log('GOND onAlarm saved: ', userStore.user);
    await alarmStore.updateSelectedAlarm({
      rate: rating.rateId,
      note,
      user: userStore.user ? userStore.user.userName : undefined,
    });
    // console.log('GOND onAlarm saved 2: ', alarmStore.selectedAlarm);
    this.shouldReloadOnExit = true;
    this.forceUpdate();
  };

  onNoteChange = value => {
    this.setState({note: value}, () => this.setHeader(true));
  };

  onRatingChange = value => {
    this.setState({rating: this.props.alarmStore.getRate(5 - value)}, () =>
      this.setHeader(true)
    );
  };

  onVisibleImageChanged = ({viewableItems}) => {
    __DEV__ && console.log('GOND onSnapshot item changed: ', viewableItems);
    for (let i = 0; i < viewableItems.length; i++) {
      if (viewableItems[i].isViewable)
        this.setState({activeIndex: viewableItems[i].index}, () =>
          this.setHeader()
        );
    }
  };

  handleScroll = event => {
    // Save the x (horizontal) value each time a scroll occurs
    this.scrollX.setValue(event.nativeEvent.contentOffset.x);
    if (this.currentPageUpdateAllowed)
      this.currentPage = Math.floor(
        event.nativeEvent.contentOffset.x / this.state.viewableWindow.width
      );
  };

  getImageSize = (width, height) => {
    // portrail mode
    if (width < height) {
      let v_width = Math.min(width, height);
      let v_height = this.state ? this.state.viewableWindow.height : height;
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

    __DEV__ && console.log('GOND Alarm-gotoVideo: ', alarmStore.selectedAlarm);
    videoStore.postAuthenticationCheck(() => {
      const canPlay = videoStore.canEnterChannel(
        alarmStore.selectedAlarm.channelNo
      );
      __DEV__ && console.log('GOND alarm canPlay: ', canPlay);
      if (videoStore.isUserNotLinked || canPlay) {
        videoStore.onAlertPlay(isLive, alarmStore.selectedAlarm, true);
        // }
        setTimeout(() => {
          navigation.push(ROUTERS.VIDEO_PLAYER);
          this.setState({isLoading: false});
        }, 100);
      } else {
        snackbarUtil.onWarning(VIDEO_TXT.NO_NVR_PERMISSION);
      }
      // });
    });
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
          viewBox={'0 0 ' + imgSize.width + ' ' + imgSize.height}>
          <Polygon
            points={coordinateList
              .map(point => {
                let res = '' + point.x + ',' + point.y;
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
    const {appearance} = this.props.appStore;
    const {selectedAlarm} = this.props.alarmStore;
    if (selectedAlarm == null) return;

    let {status} = selectedAlarm;
    if (status == 1)
      return (
        <View style={styles.statusContainer}>
          <View style={styles.alertStatusWrapper}>
            <IconCustom
              name={'check-symbol'}
              size={12}
              color={CMSColors.Success}
            />
          </View>
          <Text
            numberOfLines={1}
            style={[styles.alertStatusSuccess, theme[appearance].text]}>
            {ALARM_TXT.PROCESSED_BY}{' '}
          </Text>
          <View style={styles.alertStatusBottomContainer}>
            <Text
              style={[styles.alertStatusBottomText, theme[appearance].text]}>
              {selectedAlarm.cmsUser}
            </Text>
          </View>
        </View>
      );
  };

  renderImage = ({item}) => {
    const {selectedAlarm} = this.props.alarmStore;
    if (selectedAlarm == null) return;
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
        <View style={[this.state.imgSize, styles.imageThumbContainer]}>
          <TransThumb
            data={item}
            containerStyle={styles.imageThumb}
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
      </View>
    );
  };

  renderInfoDescription = () => {
    const {selectedAlarm} = this.props.alarmStore;
    if (selectedAlarm == null) return;
    let {description, kAlertTypeVA, kAlertType, isSDAlert} = selectedAlarm;

    if (kAlertType != AlertTypes.DVR_VA_detection) {
      if (isSDAlert) {
        return description.split(',')[0] + ': Social distance';
      }
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
    const {appearance} = this.props.appStore;
    const strTime =
      typeof item.key === 'string'
        ? item.key
        : DateTime.fromISO(item.key, {zone: 'utc'}).toFormat(
            DateFormat.AlertDetail_Date
          );
    const iconSize = 16;
    const {selectedAlarm} = this.props.alarmStore;
    const color =
      selectedAlarm.kAlertType === AlertTypes.TEMPERATURE_OUT_OF_RANGE
        ? CMSColors.Danger
        : theme[appearance].text.color;
    return (
      <View
        style={[
          styles.temperatureInfoContainer,
          styles.timeInfoContainer,
          styles.row,
        ]}>
        <View style={[styles.row, styles.alignCenter]}>
          <View style={styles.justifyBetween}>
            <IconCustom
              name="clock-with-white-face"
              size={iconSize}
              color={theme[appearance].iconColor}
            />
          </View>
          <Text style={[styles.temp_text, theme[appearance].text]}>
            {strTime}
          </Text>
        </View>

        <View style={[styles.row, styles.alignCenter]}>
          <View style={styles.justifyBetween}>
            <IconCustom
              name="ic-temperature-32px"
              size={iconSize}
              color={theme[appearance].iconColor}
            />
          </View>
          <Text style={[styles.temp_text, {color: color}]}>{item.value}</Text>
        </View>
      </View>
    );
  };

  renderTemperatureInfo = () => {
    const {appearance} = this.props.appStore;
    const {selectedAlarm} = this.props.alarmStore;
    if (selectedAlarm == null || !selectedAlarm.extra) return null;

    const isIncreaseTemp =
      selectedAlarm.kAlertType === AlertTypes.TEMPERATURE_INCREASE_RATE_BY_DAY;
    let contentHeight = isIncreaseTemp
      ? 22 * (selectedAlarm.extra.length + 2)
      : CONTENT_INFO_HEIGHT;
    contentHeight +=
      selectedAlarm.status == 1 && selectedAlarm.cmsUser ? STATUS_HEIGHT : 0;
    let padding = variable.contentPadding;

    return (
      <View style={theme[appearance].temperatureInfo}>
        <View
          style={[
            styles.infoContainer,
            theme[appearance].borderColor,
            {borderBottomWidth: 1},
          ]}>
          <View style={styles.leftInfoContainer}>
            <View style={[styles.textInfoContainer, {paddingLeft: padding}]}>
              <Text
                numberOfLines={2}
                style={[styles.textInfo, theme[appearance].text]}>
                {AlertNames[selectedAlarm.kAlertType]}
              </Text>
              {this.renderAlertStatus()}
            </View>
          </View>
          {this.renderVideoButtons()}
        </View>
        {selectedAlarm.extra.length > 0 && <View style={styles.height3}></View>}
        <FlatList
          data={selectedAlarm.extra}
          renderItem={this.renderTemperatureItem}
          keyExtractor={(item, index) => index.toString()}
          initialNumToRender={selectedAlarm.extra.length}
        />
        {selectedAlarm.extra.length > 0 && <View style={styles.height3}></View>}
      </View>
    );
  };

  renderInfo = index => {
    const {selectedAlarm} = this.props.alarmStore;
    const {appearance} = this.props.appStore;
    if (selectedAlarm == null) return;

    if (selectedAlarm.isTemperatureAlert) return this.renderTemperatureInfo();
    const padding = variable.contentPadding;

    let strTime = DateTime.fromISO(selectedAlarm.timezone, {
      zone: 'utc',
    }).toFormat(DateFormat.AlertDetail_Date);
    let contentHeight = CONTENT_INFO_HEIGHT;
    contentHeight +=
      selectedAlarm.status == 1 && selectedAlarm.cmsUser ? STATUS_HEIGHT : 0;
    // height: contentHeight
    return (
      <View
        style={[styles.infoContainer, theme[appearance].alarmInfoContainer]}>
        <View style={styles.leftInfoContainer}>
          <View style={[styles.textInfoContainer, {paddingLeft: padding}]}>
            <Text
              numberOfLines={2}
              style={[styles.textInfo, theme[appearance].alarmDetailColor]}>
              {this.renderInfoDescription()}
            </Text>
            {this.renderAlertStatus()}
            <View style={[styles.timeInfoContainer, styles.alignCenter]}>
              <View style={styles.justifyBetween}>
                <IconCustom
                  name="clock-with-white-face"
                  size={12}
                  color={theme[appearance].alarmDetailColor.color}
                />
              </View>
              <Text
                style={[styles.date_text, theme[appearance].alarmDetailColor]}>
                {strTime}
              </Text>
            </View>
          </View>
        </View>
        {this.renderVideoButtons()}
      </View>
    );
  };

  renderVideoButtons = () => {
    const {isLoading} = this.state;
    const {appearance} = this.props.appStore;

    return (
      <View style={styles.videoButtonContainer}>
        <View style={styles.videoButtonWrapper}>
          <CMSTouchableIcon
            iconCustom="searching-magnifying-glass"
            size={26}
            onPress={() => this.gotoVideo(false)}
            color={theme[appearance].alarmDetailColor.color}
            disabledColor={CMSColors.DisabledIconButton}
            disabled={isLoading} // || !canSearchSelectedChannel}
          />
        </View>
        <View style={styles.videoButtonWrapper}>
          <CMSTouchableIcon
            iconCustom="videocam-filled-tool"
            size={26}
            onPress={() => this.gotoVideo(true)}
            color={theme[appearance].alarmDetailColor.color}
            disabledColor={CMSColors.DisabledIconButton}
            disabled={isLoading} // || !canLiveSelectedChannel}
          />
        </View>
      </View>
    );
  };

  renderNoteInput = () => {
    const {appearance} = this.props.appStore;

    return (
      <View style={[styles.inputContainer, theme[appearance].container]}>
        <Text style={theme[appearance].text}>Note</Text>
        <TextInput
          style={[styles.inputNote, theme[appearance].text]}
          underlineColorAndroid={CMSColors.transparent}
          multiline={true}
          allowFontScaling={true}
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

  render() {
    const {selectedAlarm} = this.props.alarmStore;
    const {appearance} = this.props.appStore;
    if (selectedAlarm == null) return <View />;

    const {imgSize} = this.state;
    return (
      <View
        style={[styles.container, theme[appearance].container]}
        onLayout={this.onLayout}>
        <KeyboardAwareScrollView>
          <View
            style={[
              styles.contentWrapper,
              {
                height: imgSize.height,
              },
            ]}>
            <FlatList
              ref={r => (this.imagesScrollView = r)}
              pagingEnabled={true}
              style={styles.container}
              initialScrollIndex={this.state.activeIndex}
              viewabilityConfig={{
                minimumViewTime: 300,
                viewAreaCoveragePercentThreshold: 80,
              }}
              onViewableItemsChanged={this.onVisibleImageChanged}
              horizontal={true}
              getItemLayout={(data, index) => ({
                length: imgSize.width,
                offset: imgSize.width * index,
                index,
              })}
              data={selectedAlarm ? selectedAlarm.snapshot : []}
              renderItem={this.renderImage}
              onScroll={this.handleScroll}
              keyExtractor={(item, index) =>
                item.channelNo ? `${item.channelNo}_${index}` : `_${index}`
              }
            />
            <View
              style={[
                styles.likeContainer,
                {
                  top: imgSize.height - 18,
                },
              ]}>
              <LiquidLike
                data={selectedAlarm ? selectedAlarm.snapshot : []}
                scrollX={this.scrollX}
                scrollOffset={this.scrollX}
                inActiveDotColor={theme[appearance].slideDotInactive}
                activeDotColor={theme[appearance].slideDotActive}
                strokeWidth={3}
              />
            </View>
          </View>
          <View style={styles.container}>
            {this.renderInfo()}
            <RatingDetail
              rating={this.state.rating}
              onRatingChange={this.onRatingChange}
            />
            {this.renderNoteInput()}
          </View>
        </KeyboardAwareScrollView>
      </View>
    );
  }
}

export default inject(
  'alarmStore',
  'appStore',
  'videoStore',
  'userStore'
)(observer(AlarmDetailView));
