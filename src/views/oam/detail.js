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
} from 'react-native';

import CMSColors from '../../styles/cmscolors';
const pvmColors = CMSColors.pvm;

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
    __DEV__ && console.log('RTCStreamingView componentDidMount');
    // AppState.addEventListener('change', this._handleAppStateChange);
    // Dimensions.addEventListener('change', this.onDimensionChange);
    // if (this.props.onBack)
    //   BackHandler.addEventListener('hardwareBackPress', this.props.onBack);
    // Orientation.addDeviceOrientationListener(this._orientationDidChange);
  }

  // _handleAppStateChange = nextAppState => {
  //   //console.log('GOND PVM detail handleAppStateChange this.state.appState: ', this.state.appState)
  //   if (
  //     this.state.appState.match(/inactive|background/) &&
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

  render() {
    return <View style={{flex: 1}}></View>;
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
  occupancyView: {
    flex: 2,
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
  button: {
    // backgroundColor: 'rgba(255,255,255,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginLeft: 3,
    borderWidth: 1,
    height: '100%',
    width: 155,
    height: 50,
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
    //color: '#fff',
    //opacity: 1,
    // fontSize: normalize(14),
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
});

export default OAMDetailView;
