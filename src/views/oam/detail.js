'use strict';
import React, {Component} from 'react';
import {View, Platform, ActivityIndicator, StatusBar} from 'react-native';

import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
import Ripple from 'react-native-material-ripple';

import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import Button from '../../components/controls/Button';
import CounterView from './widget/CMSCounter';
import TrendingView from './widget/TrendingView';
import WaitTime from './widget/WaitTime';
import AcknowledgePopup from './widget/AcknowledgePopup';

import {normalize} from '../../util/general';
import snackbarUtil from '../../util/snackbar';

import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import theme from '../../styles/appearance';
import styles from './styles/detailStyles';

import ROUTERS from '../../consts/routes';
import {VIDEO as VIDEO_TXT} from '../../localization/texts';

// const pvmColors = CMSColors.pvm;
const BORDER_ALPHA = '28';

class OAMDetailView extends Component {
  static defaultProps = {
    selectedSite: {
      KDVR: 0,
      Name: 'Unknow',
      noData: false,
    },
  };
  isHeaderShown = true;

  constructor(props) {
    super(props);
    this.state = {
      showPopup: false,
    };
    this.reactions = [];
  }

  componentWillUnmount() {
    const {videoStore} = this.props;
    __DEV__ && console.log('RTCStreamingView componentWillUnmount');
    videoStore.onExitSinglePlayer();
    videoStore.releaseStreams();
    this.unsubscribleFocusEvent && this.unsubscribleFocusEvent();
    this.unsubscribleBlurEvent && this.unsubscribleBlurEvent();
    this.reactions && this.reactions.forEach(unsubscribe => unsubscribe());
    videoStore.enterVideoView(false);
  }

  async componentDidMount() {
    const {navigation, oamStore, videoStore} = this.props;
    __DEV__ && console.log('RTCStreamingView componentDidMount');
    // videoStore.testUpdateBitrateRelayFlow();
    // videoStore.testUpdateBitrate();

    navigation.setOptions({
      headerShown: this.isHeaderShown,
      headerTitle: oamStore.title,
    });
    this.unsubscribleFocusEvent = navigation.addListener('focus', () => {
      if (Platform.OS == 'android') StatusBar.setHidden(!this.isHeaderShown);
      else
        setTimeout(() => {
          StatusBar.setHidden(!this.isHeaderShown);
        }, 1000);
    });
    this.unsubscribleBlurEvent = navigation.addListener('blur', () => {
      StatusBar.setHidden(false);
    });
    let res = await videoStore.getDVRPermission(oamStore.kdvr);

    this.initReactions();
    videoStore.enterVideoView(true);
  }

  initReactions = () => {
    const {oamStore, navigation} = this.props;

    this.reactions = [
      reaction(
        () => oamStore.title,
        newTitle => {
          navigation.setOptions({
            headerTitle: newTitle,
          });
        }
      ),
    ];
  };

  renderFullScreenButton(foreColor) {
    return (
      <Ripple
        style={{
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={this.onFullScreenPress}>
        <CMSTouchableIcon
          iconCustom="switch-to-full-screen-button"
          size={18}
          color={foreColor}
        />
      </Ripple>
    );
  }

  renderAcknowledgeButton(foreColor, backColor) {
    const {oamStore} = this.props;
    return oamStore.data.kAlertEventDetail ? (
      <Button
        style={[
          styles.ackButton,
          {backgroundColor: 'ffffff00', borderColor: foreColor + BORDER_ALPHA},
        ]}
        type="Flat"
        enable={true}
        caption={'acknowledge'}
        captionStyle={{color: foreColor, fontSize: normalize(14)}}
        onPress={() => oamStore.setAckPopupVisibility(true)}
      />
    ) : null;
  }

  gotoLiveVideo = () => {
    const {oamStore, videoStore, navigation} = this.props;
    videoStore.setLiveMode(true);
    const {kDVR, timezone, channelNo} = oamStore.data;

    __DEV__ && console.log('GOND OAM-gotoVideo: ', oamStore.data);
    videoStore.postAuthenticationCheck(() => {
      const canPlay = videoStore.canEnterChannel(channelNo);
      __DEV__ && console.log('GOND OAM canPlay: ', canPlay);
      if (videoStore.isUserNotLinked || canPlay) {
        videoStore.onAlertPlay(true, {kDVR, timezone, channelNo});
        setTimeout(() => {
          navigation.push(ROUTERS.VIDEO_PLAYER);
          this.setState({isLoading: false});
        }, 100);
      } else {
        snackbarUtil.onWarning(VIDEO_TXT.NO_NVR_PERMISSION);
      }
    });
  };

  renderActionButton() {
    return (
      <View style={[commonStyles.floatingActionButton, {right: 20}]}>
        <CMSTouchableIcon
          iconCustom="videocam-filled-tool"
          onPress={() => this.gotoLiveVideo()}
          size={28}
          color={CMSColors.White}
        />
      </View>
    );
  }

  onFullScreenPress = () => {
    const {oamStore} = this.props;
    this.isHeaderShown = !this.isHeaderShown;
    this.props.appStore.hideBottomTabs(!this.isHeaderShown);
    this.props.navigation.setOptions({
      headerShown: this.isHeaderShown,
    });
    StatusBar.setHidden(!this.isHeaderShown);
  };

  render() {
    const {oamStore, appStore} = this.props;
    const {appearance} = appStore;
    const isLandscape = false;
    if (!oamStore.data)
      return (
        <View style={[styles.spinner, theme[appearance].container]}>
          <ActivityIndicator
            animating={true}
            style={commonStyles.spinnerCenter}
            size="large"
            color={CMSColors.SpinnerColor}
          />
        </View>
      );
    const {
      occupancy,
      occupancyTitle,
      untilCapacity,
      capacityTitle,
      estWaitTime,
      historycals,
      foreCasts,
      dataPoint,
    } = oamStore.data;

    let backColor = oamStore.data.backColor || '#008000';
    let foreColor = oamStore.data.foreColor || '#ffffff';
    let untilCapacityText =
      !isNaN(untilCapacity) && untilCapacity >= 0
        ? untilCapacity.toString()
        : 'Full';
    let textLen1 = (occupancyTitle || 'OCCUPANCY').length / 1.5;
    textLen1 = Math.min(textLen1, 6);
    let textLen2 = (capacityTitle || 'UNTIL CAPACITY').length / 1.5;
    textLen2 = Math.min(textLen2, 7.5);
    const numLen1 = ('' + occupancy).length + 3;
    const numLen2 = untilCapacityText.length + 3;
    const flex1 = textLen1 > numLen1 ? textLen1 : numLen1;
    const flex2 = textLen2 > numLen2 ? textLen2 : numLen2;
    return (
      <View
        style={{
          flex: 1,
          borderWidth: 1,
          backgroundColor: backColor,
          paddingBottom: 120,
        }}>
        <View
          style={[styles.header, {backgroundColor: foreColor + BORDER_ALPHA}]}>
          {this.renderAcknowledgeButton(foreColor, backColor)}
          {this.renderFullScreenButton(foreColor)}
        </View>
        <View
          style={[
            styles.occupancyView,
            isLandscape ? {minHeight: 100} : {},
            {borderBottomColor: foreColor + BORDER_ALPHA, borderBottomWidth: 2},
          ]}>
          <CounterView
            flex={flex1}
            title={occupancyTitle || 'OCCUPANCY'}
            count={occupancy}
            color={foreColor}
            borderAlpha={BORDER_ALPHA}
            icon="wc-2"
            paddingLeft={flex1 > 6 ? 10 : 0}
          />
          <View style={{width: 5}}></View>
          <CounterView
            flex={flex2}
            title={capacityTitle || 'UNTIL CAPACITY'}
            count={untilCapacityText}
            color={foreColor}
            borderAlpha={BORDER_ALPHA}
            icon="family"
            paddingRight={flex2 > 7.5 ? 10 : 0}
          />
        </View>
        <WaitTime
          style={{flex: 0.8}}
          estWaitTime={estWaitTime}
          color={foreColor}
          borderAlpha={BORDER_ALPHA}
        />
        <TrendingView
          style={{flex: 1}}
          color={foreColor}
          historicalData={historycals}
          forecastData={foreCasts}
          dataPoint={dataPoint}
          borderAlpha={BORDER_ALPHA}
        />
        {this.renderActionButton()}
        <AcknowledgePopup />
      </View>
    );
  }
}

export default inject(
  'oamStore',
  'videoStore',
  'appStore'
)(observer(OAMDetailView));
