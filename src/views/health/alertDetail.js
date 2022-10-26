import React, {Component} from 'react';
import {View, FlatList, Text, Dimensions} from 'react-native';

import {reaction} from 'mobx';
import {inject, observer} from 'mobx-react';

import Swipe from '../../components/controls/Swipe';
import CMSRipple from '../../components/controls/CMSRipple';
import AlertDismissModal from './modals/dismissModal';
import CMSImage from '../../components/containers/CMSImage';
import AlertInfoDetail from './components/alertInfoDetail';
import NoDataView from '../../components/views/NoData';

import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import styles from './styles/alertDetailStyles';

import {VIDEO as VIDEO_TXT} from '../../localization/texts';
import ROUTERS from '../../consts/routes';

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
    const {selectedAlertType, selectedSite, currentSiteName, alertsList} =
      healthStore;

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

  onSnapshotLoaded = (alert, image) => {
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
    const imageW = (width / NUM_IMAGES_ON_SCREEN) * (isSelected ? 1.2 : 1);
    const borderStyle = isSelected
      ? {borderWidth: 2, borderColor: CMSColors.PrimaryActive}
      : {};

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
        data={[{}, {}, ...data, {}, {}]}
        renderItem={this.renderImageItem}
        keyExtractor={(item, index) => item.id ?? 'dummy' + index}
        getItemLayout={(_, index) => ({
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
    const {appearance} = appStore;
    __DEV__ &&
      console.log(
        'GOND HEALTH DETAIL render, selectedAlert: ',
        healthStore.selectedAlert
      );

    return (
      <View
        style={[styles.container, theme[appearance].container]}
        onLayout={this.onViewLayout}>
        {healthStore.filteredAlerts.length == 0 ? (
          <NoDataView
            isLoading={healthStore.isLoading}
            style={styles.container}
          />
        ) : (
          <View style={styles.container}>
            <Swipe onSwipeLeft={this.onNext} onSwipeRight={this.onPrevious}>
              {this.renderActiveImage(healthStore.selectedAlert)}
            </Swipe>
            <View style={styles.infoViewContainer}>
              <AlertInfoDetail
                data={healthStore.selectedAlert}
                onLivePress={() =>
                  this.onLiveSearchVideo(true, healthStore.selectedAlert)
                }
                onSearchPress={() =>
                  this.onLiveSearchVideo(false, healthStore.selectedAlert)
                }
                onDismissPress={this.onDismissAlert}
              />
            </View>
            <View style={styles.imageSlideListContainer}>
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

export default inject(
  'healthStore',
  'videoStore',
  'appStore'
)(observer(AlertDetailView));
