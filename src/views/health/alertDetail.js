import {inject, observer} from 'mobx-react';
import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Platform,
  StatusBar,
  Image,
  Dimensions,
  StyleSheet,
} from 'react-native';
import {reaction} from 'mobx';

// import Ripple from 'react-native-material-ripple';
// import {SwipeRow} from 'react-native-swipe-list-view';
import Swipe from '../../components/controls/Swipe';

import CMSRipple from '../../components/controls/CMSRipple';
import AlertActionModal from './modals/actionsModal';
import AlertDismissModal from './modals/dismissModal';
import InputTextIcon from '../../components/controls/InputTextIcon';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSImage from '../../components/containers/CMSImage';
import {IconCustom, ListViewHeight} from '../../components/CMSStyleSheet';

import utils from '../../util/general';
import {AlertTypes, DateFormat} from '../../consts/misc';
import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import theme from '../../styles/appearance';
import {No_Image} from '../../consts/images';

import Button from '../../components/controls/Button';

import {
  Comps as CompTxt,
  HEALTH as HEALTH_TXT,
  VIDEO as VIDEO_TXT,
} from '../../localization/texts';
import {DateTime} from 'luxon';
import ROUTERS from '../../consts/routes';
import NoDataView from '../../components/views/NoData';

const VIEW_PADDING = 0;
const ITEM_PADDING = 5;
const NUM_IMAGES_ON_SCREEN = 5;

const {width, height} = Dimensions.get('window');

class AlertDetailView extends Component {
  constructor(props) {
    super(props);
    const {healthStore} = props;

    this.state = {
      width,
      height,
    };
    this.imagesScrollView = null;
    this._isMounted = false;
    this.reactions = [];
    // this.eventSubscribers = [];
    __DEV__ &&
      console.log(
        'AlertDetailView constructor, alerts list: ',
        props.healthStore.alertsList,
        '\n selected alert: ',
        props.healthStore.selectedAlert
      );
    if (!healthStore.selectedAlert) {
      healthStore.selectAlert();
    }
  }

  componentDidMount() {
    const {healthStore} = this.props;
    __DEV__ && console.log('AlertDetailView componentDidMount');
    this._isMounted = true;

    // this.eventSubscribers = [
    //   Dimensions.addEventListener('change', this.onDimensionsChange),
    // ];
    this.reactions = [
      reaction(
        () => healthStore.alertsList,
        newList => {
          __DEV__ &&
            console.log(
              'AlertDetailView alert list changed, re-select alert: '
            );
          healthStore.selectAlert();
          __DEV__ && console.log(': : ', healthStore.selectedAlert);
        }
      ),
      reaction(
        () =>
          healthStore.selectedSite ? healthStore.selectedSite.siteName : '',
        newSiteName => {
          this.setHeader();
        }
      ),
    ];
    this.setHeader();
  }

  setHeader = () => {
    const {healthStore, navigation} = this.props;
    const {
      selectedAlertTypeId,
      selectedAlertType,
      selectedSite,
      currentSiteName,
      alertsList,
    } = healthStore;

    __DEV__ &&
      console.log('GOND AlertsView setHeader, selectedSite = ', selectedSite);

    let options = {
      headerTitle: `${
        selectedAlertType
          ? selectedAlertType.name
          : alertsList.length > 0
          ? healthStore.getAlertName(alertsList[0].alertId)
          : ''
      } - ${
        selectedSite ? selectedSite.siteName : currentSiteName ?? 'Unknown site'
      }`,
    };

    navigation.setOptions(options);
  };

  componentWillUnmount() {
    __DEV__ && console.log('AlertDetailView componentWillUnmount');
    this._isMounted = false;

    // this.eventSubscribers.forEach(sub => sub && sub.remove());
    this.reactions && this.reactions.forEach(unsubscribe => unsubscribe());
    this.props.healthStore.onExitAlertDetailView();
  }

  onViewLayout = event => {
    const {width, height} = event.nativeEvent.layout;
    const imageW = width / NUM_IMAGES_ON_SCREEN; // - ITEM_PADDING;
    this.setState({
      width,
      height,
      imageW,
      imageH: Math.floor((imageW * 9) / 16),
    });
  };

  onActionButtonPressed = () => {
    this.props.healthStore.showActionsModal(true);
  };

  onSwitchImage = item => {
    const {healthStore} = this.props;
    healthStore.selectAlert(item);
  };

  onSnapshotLoaded = (alert, image, param) => {
    if (image) {
      alert.saveImage(image);
    }
  };

  renderActiveImage = activeItem => {
    __DEV__ && console.log('GOND HEALTH renderActiveImage: ', activeItem);
    if (!activeItem) return;

    const {healthStore} = this.props;
    const {image, imageInfo} = activeItem;
    const {width} = this.state;
    const imageWidth = width;
    const imageHeight = (imageWidth * 9) / 16;

    return (
      <View style={{height: imageHeight, backgroundColor: '#f7f7f7'}}>
        <CMSImage
          id={'img_' + healthStore.selectedAlert.id}
          src={image}
          domain={healthStore.getAlertSnapShot(activeItem)} // {this.getSnapShot(item)}
          dataCompleteHandler={(param, image) => {
            this.onSnapshotLoaded(activeItem, image, param);
          }}
          // resizeMode="cover"
          styleImage={{width: imageWidth, height: imageHeight}}
        />
      </View>
    );
  };

  onLiveSearchVideo = (isLive, data) => {
    const {sitesStore, healthStore, videoStore, navigation} = this.props;
    __DEV__ && console.log('GOND Health gotoVideo ... ', data);
    if (data.kDVR) {
      videoStore.onAlertPlay(isLive, data);
      setTimeout(() => {
        navigation.push(ROUTERS.VIDEO_PLAYER);
      }, 500);
    } else if (data.siteId) {
      sitesStore.selectSite(data.siteId);
      setTimeout(() => {
        navigation.push(ROUTERS.HEALTH_CHANNELS);
      }, 500);
    } else {
      __DEV__ &&
        console.log('GOND HealthMonitor onLiveSearch data not valid: ', data);
      snackbarUtil.onError(VIDEO_TXT.CHANNEL_ERROR);
      return;
    }
    healthStore.setVideoMode(isLive);
  };

  onDismissAlert = () => {
    const {healthStore} = this.props;
    healthStore.showDismissModal(true);
  };

  renderAlertInfo = item => {
    const {healthStore, appStore} = this.props;
    const {showDismissAllButtonInHealthDetail} = healthStore;
    const {appearance} = appStore;
    if (!item) return <View />;
    const {dvr, channelName} = item;

    return (
      <View style={styles.infoContainer}>
        <View style={{flexDirection: 'row'}}>
          <View style={styles.infoLeft}>
            <Text
              numberOfLines={2}
              style={[styles.infoText, {fontSize: 16}, theme[appearance].text]}>
              {channelName}
            </Text>
            <View style={styles.dvrInfo}>
              <View style={styles.dvrIcon}>
                <IconCustom
                  name="icon-dvr"
                  size={12}
                  color={CMSColors.SecondaryText}
                />
              </View>
              <Text style={[styles.dvrName, theme[appearance].text]}>
                {dvr.name}
              </Text>
            </View>
          </View>
          <View style={styles.infoRight}>
            <Text style={[styles.hisText, theme[appearance].text]}>
              {HEALTH_TXT.HISTORICAL}
            </Text>
            <View style={styles.timeInfo}>
              <View style={styles.timeIcon}>
                <IconCustom
                  name="clock-with-white-face"
                  size={12}
                  color={CMSColors.SecondaryText}
                />
              </View>
              <Text style={[{fontSize: 14}, theme[appearance].text]}>
                {/* {this.getDateFromActive(alert)} */}
                {DateTime.fromISO(item.timezone).toFormat(
                  DateFormat.AlertDetail_Date
                )}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            marginTop: 16,
            justifyContent: 'center',
          }}>
          <Button
            style={styles.buttonStyle}
            caption={VIDEO_TXT.LIVE}
            iconCustom="videocam-filled-tool"
            iconSize={17}
            type="flat"
            enable={true}
            onPress={() => this.onLiveSearchVideo(true, item)}
            captionStyle={styles.buttonCaptionStyle}
          />
          <Button
            style={styles.buttonStyle}
            caption={VIDEO_TXT.SEARCH}
            iconCustom="searching-magnifying-glass"
            iconSize={17}
            type="flat"
            enable={true}
            onPress={() => this.onLiveSearchVideo(false, item)}
            captionStyle={styles.buttonCaptionStyle}
          />
          {showDismissAllButtonInHealthDetail && (
            <Button
              style={[styles.buttonStyle, styles.buttonDismiss]}
              caption={HEALTH_TXT.DISMISS_CURRENT}
              iconCustom="double-tick-indicator"
              iconSize={17}
              type="flat"
              enable={true}
              onPress={this.onDismissAlert}
              captionStyle={styles.buttonCaptionStyle}
            />
          )}
        </View>
      </View>
    );
  };

  renderImageItem = ({item}) => {
    if (!item) return;
    const isDummy = typeof item !== 'object' || Object.keys(item).length === 0;
    const {kChannel, channelName} = item;
    const {healthStore, appStore} = this.props;
    const {appearance} = appStore;
    const isSelected =
      !isDummy &&
      healthStore.selectedAlert &&
      healthStore.selectedAlert.id == item.id;
    // const {imageW, imageH} = this.state;
    const imageW = (width / NUM_IMAGES_ON_SCREEN) * (isSelected ? 1.2 : 1);
    const borderStyle = isSelected
      ? {borderWidth: 2, borderColor: CMSColors.PrimaryActive}
      : {};
    // console.log('GOND renderChannelItem ', item);

    return isDummy ? (
      <View
        style={[
          styles.listImageContainer,
          {
            width: imageW,
          },
          theme[appearance].container,
        ]}
      />
    ) : (
      <CMSRipple
        style={[
          styles.listImageContainer,
          {
            width: imageW,
          },
          theme[appearance].container,
        ]}
        onPress={() => this.onSwitchImage(item)}>
        <CMSImage
          // resizeMode="cover"
          style={{height: imageW}}
          styleImage={[borderStyle, {width: imageW, height: imageW}]}
          dataCompleteHandler={(param, image) =>
            this.onSnapshotLoaded(item, image, param)
          }
          // zzz
          domain={{
            controller: 'channel',
            action: 'image',
            id: kChannel,
          }}
        />
        <Text
          style={[
            isSelected ? styles.selectedChannelName : styles.normalChannelName,
            theme[appearance].text,
          ]}
          numberOfLines={1}>
          {channelName}
        </Text>
      </CMSRipple>
    );
  };

  renderImageList = (data, selectedItemIndex) => {
    const {width} = Dimensions.get('window');
    const itemWidth = Math.floor(width / NUM_IMAGES_ON_SCREEN) - 30;

    return (
      <FlatList
        ref={r => (this.imagesScrollView = r)}
        // style={{flex: 1}}
        data={[{}, {}, ...data, {}, {}]}
        renderItem={this.renderImageItem}
        keyExtractor={(item, index) => item.id ?? 'dummy' + index}
        getItemLayout={(data, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
          index,
        })}
        initialNumToRender={data.length + 2}
        initialScrollIndex={
          selectedItemIndex >= 0 ? selectedItemIndex : undefined
        }
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      />
    );
  };
  onNext = () => {
    __DEV__ && console.log(`Swipe onNext`);
    const {healthStore} = this.props;
    healthStore.nextAlert();
    setTimeout(() => {
      this.imagesScrollView.scrollToOffset({
        animated: true,
        offset: (healthStore.selectedAlertIndex * width) / NUM_IMAGES_ON_SCREEN,
      });
    }, 200);
  };
  onPrevious = () => {
    __DEV__ && console.log(`Swipe onPrevious`);
    const {healthStore} = this.props;
    healthStore.previousAlert();
    setTimeout(() => {
      this.imagesScrollView.scrollToOffset({
        animated: true,
        offset: (healthStore.selectedAlertIndex * width) / NUM_IMAGES_ON_SCREEN,
      });
    }, 200);
  };
  render() {
    const {healthStore, appStore} = this.props;
    const {showDismissAllButtonInHealthDetail, actionsModalShown} = healthStore;
    const {appearance} = appStore;
    __DEV__ &&
      console.log(
        'GOND HEALTH DETAIL render, selectedAlert: ',
        healthStore.selectedAlert
      );

    return (
      <View
        style={[{flex: 1}, theme[appearance].container]}
        onLayout={this.onViewLayout}>
        {healthStore.filteredAlerts.length == 0 ? (
          <NoDataView isLoading={healthStore.isLoading} style={{flex: 1}} />
        ) : (
          <View style={{flex: 1}}>
            <Swipe onSwipeLeft={this.onNext} onSwipeRight={this.onPrevious}>
              {this.renderActiveImage(healthStore.selectedAlert)}
            </Swipe>
            <View style={{padding: 10}}>
              {this.renderAlertInfo(healthStore.selectedAlert)}
            </View>
            <View style={{position: 'absolute', bottom: '5%'}}>
              {healthStore.alertsList.length > 0 &&
                this.renderImageList(
                  healthStore.alertsList,
                  healthStore.selectedAlertIndex
                )}
            </View>
          </View>
        )}
        <AlertDismissModal selectedAlert={healthStore.selectedAlert} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  listImageContainer: {
    // flex: 1,
    flexDirection: 'column',
    // height: '100%',
    justifyContent: 'center',
    backgroundColor: CMSColors.White,
  },
  selectedChannelName: {
    fontSize: 14,
    width: '100%',
    paddingTop: 10,
    color: CMSColors.White,
    justifyContent: 'center',
  },
  normalChannelName: {
    fontSize: 12,
    width: '100%',
    paddingTop: 10,
    color: CMSColors.SecondaryText,
    justifyContent: 'center',
  },
  actionButton: {
    borderRadius: 45,
    backgroundColor: CMSColors.PrimaryActive,
    justifyContent: 'center',
    alignItems: 'center',
    width: 52,
    height: 52,
  },
  infoContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  actionsButtonContainer: {
    flex: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  infoLeft: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  infoRight: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  infoText: {fontSize: 14, color: CMSColors.PrimaryText, fontWeight: 'bold'},
  hisText: {fontSize: 14, color: CMSColors.SecondaryText},
  dvrName: {fontSize: 14, color: CMSColors.PrimaryText},
  dvrInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  dvrIcon: {paddingRight: 5, justifyContent: 'center'},
  timeInfo: {flexDirection: 'row', paddingTop: 5},
  timeIcon: {paddingRight: 5, justifyContent: 'center'},
  buttonStyle: {
    borderColor: CMSColors.PrimaryActive,
    borderWidth: 1,
    maxHeight: 32,
    paddingHorizontal: 10,
    marginRight: 12,
  },
  buttonCaptionStyle: {
    fontSize: 14,
    // fontWeight: 'bold',
  },
  buttonDismiss: {
    // position: 'absolute',
    // right: 0,
    marginRight: 0,
  },
});

export default inject(
  'healthStore',
  'videoStore',
  'appStore'
)(observer(AlertDetailView));
