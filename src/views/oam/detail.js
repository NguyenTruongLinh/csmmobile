'use strict';
import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

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
    // showBackButton: true,
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
        // iconCustom='todo' iconsize={24}
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
    // videoStore.onAlertPlay(true, {kDVR, timezone, channelNo});
    // setTimeout(() => {
    //   navigation.push(ROUTERS.VIDEO_PLAYER);
    // }, 200);

    __DEV__ && console.log('GOND OAM-gotoVideo: ', oamStore.data);
    videoStore.postAuthenticationCheck(() => {
      const canPlay = videoStore.canEnterChannel(channelNo);
      __DEV__ && console.log('GOND OAM canPlay: ', canPlay);
      if (videoStore.isUserNotLinked || canPlay) {
        videoStore.onAlertPlay(true, {kDVR, timezone, channelNo});
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
    // oamStore.setIsBottomTabShown(this.isHeaderShown);
    this.props.appStore.hideBottomTabs(!this.isHeaderShown);
    this.props.navigation.setOptions({
      headerShown: this.isHeaderShown,
    });
    StatusBar.setHidden(!this.isHeaderShown);
  };

  render() {
    const {oamStore, navigation} = this.props;
    const isLandscape = false;
    if (!oamStore.data)
      return (
        <View style={styles.spinner}>
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
        {/* <Text>{JSON.stringify(oamStore.data)}</Text> */}
        {/* <Text>{JSON.stringify(historycals)}</Text>
          <Text>{JSON.stringify(foreCasts)}</Text> */}
        {/* <Text>
          {flex1}-{flex2}
        </Text> */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  siteName: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    //paddingTop:25,
    marginTop: 10,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
    justifyContent: 'flex-end',
    // paddingVertical: 5,
    minHeight: 45,
  },
  occupancyView: {
    flex: 1.2,
    flexDirection: 'row',
  },
  analyzeViews: {
    paddingTop: 10,
    flex: 7,
    flexDirection: 'column',
  },
  footerButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
  },
  ackButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginLeft: 3,
    borderWidth: 1,
    paddingHorizontal: 5,
    height: 36,
    marginRight: 30,
  },
  liveButton: {
    fontSize: 32,
    color: 'white',
  },
  buttonback: {
    color: 'white',
    paddingTop: 10,
    backgroundColor: 'black',
  },
  buttonCaption: {
    color: '#fff',
    //opacity: 1,
    fontSize: normalize(14),
  },
  buttonSite: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    height: 24,
    marginRight: 3,
  },
  modalcontainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalcontent: {
    height: 50,
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomColor: 'rgb(204, 204, 204)',
  },
  centering: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  actionButtonContainer: {
    position: 'absolute',
    right: 35,
    bottom: 28,
    width: 63,
    height: 63,
    borderRadius: 45,
    backgroundColor: CMSColors.PrimaryActive,
    justifyContent: 'center',
    alignItems: 'center',
    // android's shadow
    elevation: 5,
    // ios's shadow check later
    shadowOffset: {width: 14, height: 14},
    shadowColor: 'black',
    shadowOpacity: 0.7,
    shadowRadius: 45,
  },
  spinner: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    height: '100%',
  },
});

export default inject(
  'oamStore',
  'videoStore',
  'appStore'
)(observer(OAMDetailView));
