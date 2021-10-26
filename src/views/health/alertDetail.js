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

import Ripple from 'react-native-material-ripple';
import {SwipeRow} from 'react-native-swipe-list-view';

import AlertActionModal from './modals/actionsModal';
import AlertDismissModal from './modals/dismissModal';
import InputTextIcon from '../../components/controls/InputTextIcon';
// import BackButton from '../../components/controls/BackButton';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSImage from '../../components/containers/CMSImage';
// import FullWidthImage from '../../components/containers/FullWidthImage';
import {IconCustom, ListViewHeight} from '../../components/CMSStyleSheet';

import utils from '../../util/general';
import {AlertTypes, DateFormat} from '../../consts/misc';
import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import {No_Image} from '../../consts/images';

import {Comps as CompTxt, HEALTH as HEALTH_TXT} from '../../localization/texts';
import {DateTime} from 'luxon';

const VIEW_PADDING = 10;
const ITEM_PADDING = 5;
const NUM_IMAGES_ON_SCREEN = 3;

class AlertDetailView extends Component {
  constructor(props) {
    super(props);
    const {width, height} = Dimensions.get('window');
    const {healthStore} = props;

    this.state = {
      width,
      height,
    };
    this.imagesScrollView = null;
    this._isMounted = false;
    this.reactions = [];
    this.eventSubscribers = [];
    __DEV__ &&
      console.log(
        'AlertDetailView constructor, alerts list: ',
        props.healthStore.alertsListByType,
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

    this.eventSubscribers = [
      Dimensions.addEventListener('change', this.onDimensionsChange),
    ];
    this.reactions = [
      // reaction(
      //   () => healthStore.selectedAlert,
      //   newValue => {
      //     if (newValue == null || newValue == undefined)
      //       healthStore.selectAlert(); // default first alert
      //   }
      // ),
      reaction(
        () => healthStore.alertsListByType,
        newList => {
          __DEV__ &&
            console.log(
              'AlertDetailView alert list changed, re-select alert: '
            );
          healthStore.selectAlert();
          __DEV__ && console.log(': : ', healthStore.selectedAlert);
        }
      ),
    ];
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlertDetailView componentWillUnmount');
    this._isMounted = false;

    this.eventSubscribers.forEach(sub => sub && sub.remove());
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
    const imageWidth = width - VIEW_PADDING * 2;
    const imageHeight = (imageWidth * 9) / 16;

    return (
      <View style={{flex: 1 /*, padding: VIEW_PADDING*/}}>
        {/* {image ? (
            imageInfo ? (
              <FullWidthImage
                source={{uri: 'data:image/jpeg;base64,' + image}}
                width={imageWidth}
                height={imageHeight}
                resizeMode="contain"
              />
            ) : (
          <CMSImage
            id={utils.getRandomId()}
            src={image}
            resizeMode="cover"
            styleImage={{width: imageWidth, height: imageHeight}}
          />
        )) : (
          // )
          <Image
            source={No_Image}
            resizeMode="cover"
            style={{width: imageWidth, height: imageHeight}}
          />
        )} */}
        <CMSImage
          id={utils.getRandomId()}
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

  renderAlertInfo = item => {
    if (!item) return <View />;
    const {dvr, channelName} = item;

    return (
      <View style={styles.infoContainer}>
        <View style={styles.actionsButtonContainer}>
          <CMSTouchableIcon
            iconCustom="searching-magnifying-glass"
            onPress={this.onActionButtonPressed}
            size={28}
            color={CMSColors.White}
            styles={styles.actionButton}
          />
        </View>
        <View style={styles.infoLeft}>
          <Text numberOfLines={2} style={[styles.infoText, {fontSize: 16}]}>
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
            <Text style={styles.infoText}>{dvr.name}</Text>
          </View>
        </View>
        <View style={styles.infoRight}>
          <Text style={[styles.infoText, {color: CMSColors.Danger}]}>
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
            <Text style={{color: CMSColors.PrimaryText, fontSize: 14}}>
              {/* {this.getDateFromActive(alert)} */}
              {DateTime.fromISO(item.timezone).toFormat(
                DateFormat.AlertDetail_Date
              )}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  renderImageItem = ({item}) => {
    if (!item) return;
    const isDummy = typeof item !== 'object' || Object.keys(item).length === 0;
    const {kChannel, channelName} = item;
    const {healthStore} = this.props;
    const isSelected =
      !isDummy &&
      healthStore.selectedAlert &&
      healthStore.selectedAlert.id == item.id;
    const {imageW, imageH} = this.state;
    // const imageW = (width / NUM_IMAGES_ON_SCREEN) * (isSelected ? 1.2 : 1);
    const borderStyle = isSelected
      ? {borderWidth: 2, borderColor: CMSColors.PrimaryActive}
      : {};
    // console.log('GOND renderChannelItem ', item);

    return isDummy ? (
      <View
        style={[
          styles.listContainer,
          {
            width: imageW,
          },
        ]}
      />
    ) : (
      <Ripple
        style={[
          styles.listContainer,
          {
            width: imageW,
          },
        ]}
        onPress={() => this.onSwitchImage(item)}>
        <CMSImage
          // resizeMode="cover"
          style={{height: imageH}}
          styleImage={[borderStyle, {width: imageW, height: imageH}]}
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
          style={
            isSelected ? styles.selectedChannelName : styles.normalChannelName
          }
          numberOfLines={1}>
          {channelName}
        </Text>
      </Ripple>
    );
  };

  renderImageList = (data, selectedItemIndex) => {
    const {width} = Dimensions.get('window');
    const itemWidth = Math.floor(width / NUM_IMAGES_ON_SCREEN) - 30;

    return (
      <FlatList
        ref={r => (this.imagesScrollView = r)}
        style={{flex: 1}}
        data={[{}, ...data, {}]}
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
      />
    );
  };

  render() {
    const {healthStore, navigation} = this.props;
    __DEV__ &&
      console.log(
        'GOND HEALTH DETAIL render, selectedAlert: ',
        healthStore.selectedAlert
      );

    return (
      <View
        style={{flex: 1, flexDirection: 'column'}}
        onLayout={this.onViewLayout}>
        <View style={{flex: 45, padding: VIEW_PADDING}}>
          {this.renderActiveImage(healthStore.selectedAlert)}
        </View>
        <View style={{flex: 15}}>
          {this.renderAlertInfo(healthStore.selectedAlert)}
        </View>
        <View style={{flex: 40}}>
          {healthStore.alertsListByType.length > 0 &&
            this.renderImageList(
              healthStore.alertsListByType,
              healthStore.selectedAlertIndex
            )}
        </View>
        <AlertActionModal
          data={healthStore.selectedAlert}
          siteAlerts={false}
          navigation={navigation}
        />
        <AlertDismissModal selectedAlert={healthStore.selectedAlert} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    backgroundColor: CMSColors.DarkTheme,
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
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: VIEW_PADDING,
  },
  actionsButtonContainer: {
    flex: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  infoLeft: {
    flex: 42,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  infoRight: {
    flex: 42,
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  infoText: {fontSize: 14, color: CMSColors.PrimaryColor},
  dvrInfo: {flexDirection: 'row', justifyContent: 'flex-start'},
  dvrIcon: {paddingRight: 5, justifyContent: 'center'},
  timeInfo: {flexDirection: 'row', paddingTop: 5},
  timeIcon: {paddingRight: 5, justifyContent: 'center'},
});

export default inject('healthStore', 'videoStore')(observer(AlertDetailView));
