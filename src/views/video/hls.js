import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ImageBackground,
  Dimensions,
  Platform,
  StatusBar,
  TouchableOpacity,
  Modal,
  UIManager,
  BackHandler,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';

import util, {normalize} from '../../util/general';

const Video_State = {STOP: 0, PLAY: 1, PAUSE: 2};
// const Time_Ruler_Height = normalize(variables.isPhoneX ? 75 : 65);
// const content_padding = normalize(6);

const Default_Action_Offset = 30;
const Action_Button_Height = 54;
const naturalRatio = 16 / 9;
const Limit_Time_Allow_Change_Live_Search = 1;
const header_height = 50;
const footer_height = 50;
// let isSwitchToLive = false;

class HLSStreamingView extends Component {
  static defaultProps = {
    enableSwitchChannel: true,
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('HLSStreamingView componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('HLSStreamingView componentWillUnmount');
    // Dimensions.removeEventListener('change', this.Dimension_handler);
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    // if (Platform.OS === 'ios') {
    //   this.appStateEventListener.remove();
    // }
  }

  render() {
    return <View></View>;
  }
}

var SliderStyle = StyleSheet.create({
  slidercontainer: {
    paddingLeft: normalize(10),
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  track: {
    height: normalize(3.5),
    backgroundColor: CMSColors.White_Op40,
  },
  slider: {paddingLeft: normalize(10), paddingRight: normalize(10), flex: 1},
  thumb: {
    width: normalize(7.5),
    height: normalize(7.5),
    backgroundColor: CMSColors.White,
    shadowColor: CMSColors.borderColor,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    borderColor: CMSColors.White_Op40,
    borderWidth: normalize(22 / 2),
  },
});

const styles = StyleSheet.create({
  modalcontainer: {
    flex: 1,
    backgroundColor: CMSColors.PrimaryColor54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: CMSColors.PrimaryText,
    flexDirection: 'row',
    /* , paddingLeft: normalize(10)*/
    paddingRight: 0,
  },
  headerOverlay: {
    paddingLeft: normalize(10),
    paddingRight: 0,
    flexDirection: 'row',
    position: 'absolute',
    zIndex: 2,
    backgroundColor: CMSColors.PrimaryColor54,
  },
  FullScreenButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: normalize(10),
    paddingLeft: normalize(10),
    backgroundColor: 'transparent',
  },
  HDModeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: normalize(10),
    paddingLeft: normalize(10),
    backgroundColor: 'transparent',
  },
  Channel_Container: {
    flexDirection: 'row',
    flex: 5,
    //marginBottom: normalize(13),
    marginLeft: normalize(0),
    paddingTop: normalize(10),
    paddingBottom: normalize(10),
    paddingLeft: normalize(12),
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: CMSColors.DividerColor24,
  },
  HistoricalText: {
    fontSize: normalize(14),
    color: CMSColors.Danger,
    alignItems: 'flex-end',
  },
  ChanelText: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    fontSize: normalize(16),
  },
  SiteText: {
    fontSize: normalize(14),
    color: CMSColors.White,
  },
  Site: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  Historical_Container: {
    flexDirection: 'column',
    flex: 5,
    paddingLeft: normalize(12),
    paddingRight: normalize(10),
    paddingTop: normalize(10),
    paddingBottom: normalize(10),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    //alignItems: 'center',
    //justifyContent: 'center',
    //backgroundColor: 'white'
  },
  VideoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    backgroundColor: CMSColors.PrimaryText,
  },
  StatusText: {
    color: CMSColors.White,
    fontSize: normalize(14),
  },
  StatusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'transparent',
  },
  ControlContainer: {
    flexDirection: 'row',
    position: 'absolute',
    zIndex: 2,
    backgroundColor: CMSColors.PrimaryColor54,
  },
  styleIcon_Close: {
    //backgroundColor: 'blue',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: normalize(22),
    paddingBottom: normalize(22),
    width: normalize(63),
  },
  styleIcon_changechannel: {
    //backgroundColor: 'blue',
    backgroundColor: 'transparent',
  },
  fixedRatio: {
    backgroundColor: 'rebeccapurple',
    flex: 1,
    aspectRatio: 1,
  },
  lableContainer: {
    position: 'absolute',
    zIndex: 3,
    flex: 0,
    flexDirection: 'column',
    paddingLeft: normalize(10),
    paddingRight: normalize(10),
    alignItems: 'flex-start',
  },
  Novideo: {
    flex: 1,
    alignSelf: 'stretch',
    //width: undefined,
    //height: undefined,
    width: '100%',
    height: '100%',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  modal_footer_Apply: {
    height: footer_height,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: CMSColors.footer_border,
    //alignItems: 'flex-end',
    //paddingRight: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button_cancel: {
    height: 50,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    //backgroundColor: 'red'
  },
  content_button_apply: {
    height: 50,
    flex: 2,
    justifyContent: 'center',
    //paddingLeft: 10,
    //paddingRight: 10,
    marginRight: 10,
  },
  content_button_cancel: {
    height: 50,
    flex: 2,
    justifyContent: 'center',
    //paddingLeft: 10,
    //paddingRight: 10,
    marginLeft: 10,
  },
  button_apply: {
    height: 36,
  },
  modal_header: {
    height: header_height,
    backgroundColor: CMSColors.White,
    borderBottomWidth: 1,
    borderColor: CMSColors.header_border,
    alignItems: 'center',
    flexDirection: 'row',
  },
  modal_header_icon: {
    marginLeft: 15,
  },
  modal_title: {
    marginLeft: 10,
    fontSize: 16,
  },
  modal_title_search: {
    color: CMSColors.PrimaryText,
    fontSize: 16,
  },
  modal_body: {
    flex: 1,
  },
  timeontimerule: {
    backgroundColor: CMSColors.SecondaryText,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeontimerule_horizon: {
    backgroundColor: CMSColors.transparent,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
});

export default HLSStreamingView;
