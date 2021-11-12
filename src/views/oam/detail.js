'use strict';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  AppState,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import Ripple from 'react-native-material-ripple';
import Icon from 'react-native-vector-icons/FontAwesome';

import CMSColors from '../../styles/cmscolors';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';

import {normalize} from '../../util/general';

import commonStyles from '../../styles/commons.style';

import Button from '../../components/controls/Button';
import CounterView from './widget/CMSCounter';
import TrendingView from './widget/TrendingView';
import WaitTime from './widget/WaitTime';

import CMSStyleSheet from '../../components/CMSStyleSheet';
const IconCustom = CMSStyleSheet.IconCustom;

import AcknowledgePopup from './widget/AcknowledgePopup';
import ROUTERS from '../../consts/routes';

const pvmColors = CMSColors.pvm;
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
  }

  // onDimensionChange = event => {
  //   //setTimeout(()=>{
  //   this.setFullScreenDefault();
  //   //},1000)
  // };

  // _orientationDidChange = ort => {
  //   this.setState({orientation: ort});
  // };

  componentWillUnmount() {
    const {videoStore} = this.props;
    __DEV__ && console.log('RTCStreamingView componentWillUnmount');
    // Orientation.unlockAllOrientations();
    // Dimensions.removeEventListener('change', this.onDimensionChange);
    // AppState.removeEventListener('change', this._handleAppStateChange);
    // if (this.props.onBack)
    //   BackHandler.removeEventListener('hardwareBackPress', this.props.onBack);
    // Orientation.removeDeviceOrientationListener(this._orientationDidChange);
    videoStore.onExitSinglePlayer();
    videoStore.releaseStreams();
  }

  componentDidMount() {
    const {navigation, oamStore} = this.props;
    __DEV__ && console.log('RTCStreamingView componentDidMount');
    // AppState.addEventListener('change', this._handleAppStateChange);
    // Dimensions.addEventListener('change', this.onDimensionChange);
    // if (this.props.onBack)
    //   BackHandler.addEventListener('hardwareBackPress', this.props.onBack);
    // Orientation.addDeviceOrientationListener(this._orientationDidChange);
    navigation.setOptions({
      headerShown: this.isHeaderShown,
    });
  }

  // _handleAppStateChange = nextAppState => {
  //   //console.log('GOND PVM detail handleAppStateChange this.state.appState: ', this.state.appState)
  //   if (
  //     this.state.appState.match(/Inactive|background/) &&
  //     nextAppState === 'active'
  //   ) {
  //     if (this.props.api && this.props.selectedSite.KDVR > 0) {
  //       this.props.actions.getPVMData(
  //         this.props.api,
  //         this.props.selectedSite.KDVR
  //       );
  //     }
  //   }
  //   this.setState({
  //     appState: nextAppState,
  //   });
  // };

  renderFullScreenButton(foreColor) {
    return (
      <CMSTouchableIcon
        iconCustom="switch-to-full-screen-button"
        onPress={this.onFullScreenPress}
        size={18}
        color={foreColor}
      />
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
    videoStore.switchLiveSearch(true);
    const {kDVR, timezone, channelNo} = oamStore.data;
    videoStore.onAlertPlay(true, {kDVR, timezone, channelNo});
    setTimeout(() => {
      navigation.push(ROUTERS.VIDEO_PLAYER);
    }, 200);
  };

  renderActionButton() {
    return (
      <View style={styles.actionButtonContainer}>
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
    oamStore.setIsBottomTabShown(this.isHeaderShown);
    this.props.navigation.setOptions({
      headerShown: this.isHeaderShown,
    });
  };

  render() {
    const {oamStore, navigation} = this.props;
    navigation.setOptions({
      headerTitle: oamStore.title,
    });
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
        <View
          style={[styles.header, {backgroundColor: foreColor + BORDER_ALPHA}]}>
          {this.renderAcknowledgeButton(foreColor, backColor)}
          {this.renderFullScreenButton(foreColor)}
        </View>

        <View
          style={[styles.occupancyView, isLandscape ? {minHeight: 100} : {}]}>
          <CounterView
            style={{flex: 1}}
            title={occupancyTitle || 'OCCUPANCY'}
            count={occupancy}
            color={foreColor}
            borderAlpha={BORDER_ALPHA}
            icon="wc-2"
          />
          <CounterView
            style={{flex: 1}}
            title={capacityTitle || 'UNTIL CAPACITY'}
            count={untilCapacity}
            color={foreColor}
            borderAlpha={BORDER_ALPHA}
            icon="family"
          />
        </View>
        <WaitTime
          style={{flex: 1}}
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
    paddingRight: 20,
    justifyContent: 'flex-end',
    paddingVertical: 5,
    minHeight: 45,
  },
  occupancyView: {
    flex: 1.5,
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

export default inject('oamStore', 'videoStore')(observer(OAMDetailView));
