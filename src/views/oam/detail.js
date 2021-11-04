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

import CMSColors from '../../styles/cmscolors';
import {inject, observer} from 'mobx-react';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';

import {normalize} from '../../util/general';

import commonStyles from '../../styles/commons.style';

import Button from '../../components/controls/Button';
import CounterView from './widget/CMSCounter';
import TrendingView from './widget/TrendingView';
import WaitTime from './widget/WaitTime';

const pvmColors = CMSColors.pvm;
const BORDER_ALPHA = '28';
const PVM_MESSAGES = {
  PVM_OFFLINE: 'NVR is offline.',
  PVM_NO_UPDATE: 'No new data for more than 2 hours.',
  PVM_NOT_ENABLE: 'Site has no PVM enabled.',
};
const warningMessage = [
  {
    id: 1,
    selected: true,
    value:
      'I have responded to the alarm and per company protocol, have taken corrective action.',
  },
  {
    id: 2,
    value:
      'I have responded to the alarm and per company protocol, have allowed additional customers into the store.',
  },
  {
    id: 3,
    value: 'I have responded to the alarm and no further action is needed.',
  },
];

class OAMDetailView extends Component {
  static defaultProps = {
    selectedSite: {
      KDVR: 0,
      Name: 'Unknow',
      noData: false,
    },
    // showBackButton: true,
  };

  constructor(props) {
    super(props);
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
    __DEV__ && console.log('RTCStreamingView componentWillUnmount');
    // Orientation.unlockAllOrientations();
    // Dimensions.removeEventListener('change', this.onDimensionChange);
    // AppState.removeEventListener('change', this._handleAppStateChange);
    // if (this.props.onBack)
    //   BackHandler.removeEventListener('hardwareBackPress', this.props.onBack);
    // Orientation.removeDeviceOrientationListener(this._orientationDidChange);
  }

  componentDidMount() {
    const {oamStore} = this.props;
    __DEV__ && console.log('RTCStreamingView componentDidMount');
    oamStore.fetchData();
    // AppState.addEventListener('change', this._handleAppStateChange);
    // Dimensions.addEventListener('change', this.onDimensionChange);
    // if (this.props.onBack)
    //   BackHandler.addEventListener('hardwareBackPress', this.props.onBack);
    // Orientation.addDeviceOrientationListener(this._orientationDidChange);
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
    // return this.state.KAlertEventDetail ? (
    return (
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
        onPress={() => {
          this.onAcknowledge();
        }}
      />
    );
    // ) : null;
  }

  renderActionButton() {
    return (
      <View style={styles.actionButtonContainer}>
        <CMSTouchableIcon
          iconCustom="videocam-filled-tool"
          onPress={() => {
            // this.setState({showActionsModal: true})
            // this.props.healthStore.showActionsModal(true);
          }}
          size={28}
          color={CMSColors.White}
        />
      </View>
    );
  }
  onFullScreenPress = () => {};

  render() {
    const {oamStore} = this.props;
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
      // foreColor,
      // backColor,
      dataPoint,
      showAcknowledgeButton,
      firstLoading,
      waitForAcknowledgeResponse,
      dvrName,
    } = oamStore.data;
    let backColor = oamStore.data.backColor || '#008000';
    let foreColor = oamStore.data.foreColor || '#ffffff';
    return (
      oamStore.data && (
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
          <View style={styles.header}>
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
            color={foreColor || 'white'}
            historicalData={historycals}
            forecastData={foreCasts}
            dataPoint={dataPoint}
            borderAlpha={BORDER_ALPHA}
          />
          {this.renderActionButton()}
        </View>
      )
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
    backgroundColor: '#ffffff' + BORDER_ALPHA,
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
  buttonIgnore: {
    flex: 1,
    backgroundColor: CMSColors.PrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  buttonSite: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    height: 24,
    marginRight: 3,
  },
  popupcomponent: {
    flexDirection: 'row',
    flex: 1,
    paddingTop: 10,
    marginLeft: 10,
    marginRight: 10,
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
  radiobuttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 24,
    paddingRight: 24,
    //marginTop:20,
    marginRight: 20,
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

export default inject('oamStore')(observer(OAMDetailView));
