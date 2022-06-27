import React, {Component} from 'react';
import {
  View,
  ScrollView,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  BackHandler,
  StatusBar,
} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
// import Video from 'react-native-video';
import VideoPlayer from 'react-native-video-player';

import Button from '../../components/controls/Button';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import BackButton from '../../components/controls/BackButton';
import FlagWeightModal from './FlagWeightModal';
import TransactionBillView from './transactionBill';
import LoadingOverlay from '../../components/common/loadingOverlay';

import snackbarUtil from '../../util/snackbar';

import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import {
  SMARTER as SMARTER_TXT,
  VIDEO as VIDEO_TXT,
} from '../../localization/texts';
import ROUTERS from '../../consts/routes';

import Orientation from 'react-native-orientation-locker';

const ViewModes = {
  normal: 0,
  fullscreenBill: 1,
  fullscreenVideo: 2,
};
const {width, height} = Dimensions.get('window');
const fullscreenVideoW = height;
const fullscreenVideoH = width;
const videoW = width;
const videoH = (width * 9) / 16;
class TransactionDetailView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showFlagModal: false,
      // fullscreenVideo: false,
      // fullscreenBill: false,
      viewMode: ViewModes.normal,
      // videoWidth: width,
      // videoHeight: (1.1 * (width * 9)) / 16,
    };

    this.reactions = [];
    this.unsubBackEvent = null;
    // this.unsubFocusEvent = null;
    // this.firstFocus = true;
  }

  componentWillUnmount() {
    __DEV__ && console.log('TransactionDetailView componentWillUnmount');

    this.reactions && this.reactions.forEach(unsubscribe => unsubscribe());
    this.unsubBackEvent && this.unsubBackEvent();
    // this.unsubFocusEvent && this.unsubFocusEvent();
    this.props.videoStore.releaseStreams();
    this.props.exceptionStore.onExitTransactionDetail();

    this.props.videoStore.enterVideoView(false);
    // Just for sure
    if (!this.props.appStore.showTabbar)
      this.props.appStore.hideBottomTabs(false);
  }

  async componentDidMount() {
    const {route, navigation, videoStore, exceptionStore} = this.props;
    __DEV__ &&
      console.log(
        'TransactionDetailView componentDidMount: ',
        exceptionStore.selectedTransaction
      );

    if (!route || !route.params || !route.params.fromNotify) {
      this.getData();
    }
    let res = await videoStore.getDVRPermission(
      exceptionStore.selectedTransaction.pacId
    );

    this.setHeader();
    this.initReactions();

    // this.unsubFocusEvent = navigation.addListener('focus', () => {
    //   __DEV__ && console.log('GOND trans detail on focused');
    //   videoStore.setShouldShowVideoMessage(false);
    //   if (this.firstFocus) {
    //     this.firstFocus = false;
    //   } else {
    //     videoStore.resetNVRAuthentication();
    //   }
    // });
    this.unsubBackEvent = navigation.addListener('beforeRemove', e => {
      if (!this.state.viewMode == ViewModes.normal) {
        e.preventDefault(); // prevent back behaviour
        this.onExitFullscren();
      }
    });

    videoStore.enterVideoView(true);
  }

  initReactions = () => {
    const {exceptionStore} = this.props;

    this.reactions = [
      reaction(
        () => exceptionStore.selectedTransaction,
        () => this.setHeader()
      ),
    ];
  };

  setHeader = () => {
    const {exceptionStore, navigation} = this.props;
    const {viewMode} = this.state;

    navigation.setOptions({
      headerLeft:
        viewMode == ViewModes.fullscreenVideo ||
        viewMode == ViewModes.fullscreenBill
          ? null
          : () => <BackButton navigator={navigation} />,
      headerTitle:
        viewMode == ViewModes.fullscreenVideo
          ? null
          : SMARTER_TXT.TRANSACTION +
            (exceptionStore.selectedTransaction
              ? ' #' + exceptionStore.selectedTransaction.tranNo
              : ''),
      headerRight:
        viewMode == ViewModes.fullscreenBill
          ? () => (
              <View style={commonStyles.headerContainer}>
                <CMSTouchableIcon
                  size={20}
                  onPress={() => this.onExitFullscren()}
                  color={
                    viewMode == ViewModes.fullscreenVideo
                      ? CMSColors.White
                      : CMSColors.ColorText
                  }
                  styles={commonStyles.headerIcon}
                  iconCustom="clear-button"
                />
              </View>
            )
          : null,
      headerStyle: {
        backgroundColor:
          viewMode == ViewModes.fullscreenVideo
            ? CMSColors.DarkTheme
            : CMSColors.White,
      },
      headerShown: viewMode != ViewModes.fullscreenVideo,
    });
    if (viewMode == ViewModes.fullscreenVideo) Orientation.lockToLandscape();
    else Orientation.lockToPortrait();
    StatusBar.setHidden(viewMode == ViewModes.fullscreenVideo);
  };

  getData = () => {
    const {exceptionStore} = this.props;
    exceptionStore.getTransaction();
  };

  onExitFullscren = () => {
    this.setState({viewMode: ViewModes.normal}, () => this.setHeader());
    this.props.appStore.hideBottomTabs(false);
  };

  onLayout = event => {
    const {width} = event.nativeEvent.layout;
    // this.setState({videoWidth: width, videoHeight: (width * 9) / 16});
  };

  onViewBill = () => {
    this.setState({viewMode: ViewModes.fullscreenBill}, () => this.setHeader());
  };

  onViewVideo = () => {
    __DEV__ && console.log('GOND transaction detail onVideoFullscreen ');
    this.setState(
      {
        viewMode:
          this.state.viewMode == ViewModes.fullscreenVideo
            ? ViewModes.normal
            : ViewModes.fullscreenVideo,
      },
      () => {
        this.props.appStore.hideBottomTabs(
          this.state.viewMode == ViewModes.fullscreenVideo
        );
        this.setHeader();
      }
    );
  };

  onVideoDownload = () => {
    const {selectedTransaction} = this.props.exceptionStore;
    if (
      selectedTransaction &&
      typeof selectedTransaction.downloadVideo == 'function'
    )
      selectedTransaction.downloadVideo();
  };

  gotoVideo = () => {
    const {navigation, videoStore, exceptionStore} = this.props;
    const transaction = exceptionStore.selectedTransaction;
    if (transaction.pacId <= 0) {
      __DEV__ &&
        console.log('GOND transaction video: not valid dvr: ', transaction);
      return;
    }
    // videoStore.onAlertPlay(false, transaction);
    // setTimeout(() => {
    //   navigation.push(ROUTERS.VIDEO_PLAYER);
    // }, 200);

    videoStore.postAuthenticationCheck(() => {
      const canPlay = videoStore.canEnterChannel(parseInt(transaction.camName));
      __DEV__ && console.log('GOND transaction canPlay: ', canPlay);
      if (videoStore.isUserNotLinked || canPlay) {
        videoStore.onAlertPlay(false, transaction);
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

  renderActionButton = () => {
    return (
      <View style={commonStyles.floatingActionButton}>
        <CMSTouchableIcon
          iconCustom="searching-magnifying-glass"
          onPress={this.gotoVideo}
          size={28}
          color={CMSColors.White}
        />
      </View>
    );
  };

  renderFullscreenBill = () => {
    const {selectedTransaction, isLoading} = this.props.exceptionStore;
    return (
      <View style={[styles.viewContainer, styles.contentView]}>
        {/* <View style={{height: 42}} /> */}
        <Button
          style={styles.button}
          caption={SMARTER_TXT.FLAG}
          iconCustom="ic_flag_black_48px"
          iconSize={24}
          captionStyle={{color: CMSColors.PrimaryActive, fontSize: 20}}
          type="flat"
          enable={true}
          onPress={() => this.setState({showFlagModal: true})}
        />
        <TransactionBillView
          isLoading={isLoading}
          transaction={selectedTransaction}
          style={{marginTop: 16}}
        />
      </View>
    );
  };

  renderVideoPlayer = () => {
    const {selectedTransaction} = this.props.exceptionStore;
    // const {videoWidth, videoHeight} = this.state;
    const width =
      this.state.viewMode == ViewModes.fullscreenVideo
        ? fullscreenVideoW
        : videoW;
    const height =
      this.state.viewMode == ViewModes.fullscreenVideo
        ? fullscreenVideoH
        : videoH;
    return (
      <View style={{height: height, width: width}}>
        <VideoPlayer
          // controls={true}
          video={
            selectedTransaction.media
              ? {uri: selectedTransaction.media}
              : undefined
          }
          videoWidth={width}
          videoHeight={height}
          poster={
            selectedTransaction.snapshot.uri
              ? selectedTransaction.snapshot.uri
              : selectedTransaction.snapshot
          }
          resizeMode={'stretch'}
          // controlsTimeout={3}
          disableControlsAutoHide
          muted
          autoplay
          fullScreenHandler={this.onViewVideo}
          showDuration={true}
          // style={{
          //   width: '100%',
          //   height: videoHeight,
          //   // backgroundColor: CMSColors.PrimaryText,
          // }}
        />
      </View>
    );
  };

  renderFullscreenVideo = () => {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'green', //CMSColors.DarkTheme,
        }}>
        {this.renderVideoPlayer()}
      </View>
    );
  };

  renderDefaultMode = () => {
    const {selectedTransaction, isLoading} = this.props.exceptionStore;
    // const {videoWidth, videoHeight} = this.state;
    __DEV__ &&
      console.log(
        'GOND transaction detail video url: ',
        selectedTransaction.media
      );

    return (
      <View style={[styles.viewContainer]}>
        {selectedTransaction.hasVideo && this.renderVideoPlayer()}
        <View style={[styles.contentView, {flexDirection: 'row'}]}>
          {selectedTransaction.hasVideo && (
            <Button
              style={[styles.button, {flex: 1}]}
              caption={SMARTER_TXT.DOWNLOAD.toUpperCase()}
              captionStyle={{color: CMSColors.PrimaryActive, fontSize: 20}}
              iconMaterial="get-app"
              iconSize={24}
              type="flat"
              enable={true}
              onPress={this.onVideoDownload}
            />
          )}
          {selectedTransaction.hasVideo && <View style={{width: 20}} />}
          <Button
            style={[styles.button, {flex: 1}]}
            caption={SMARTER_TXT.FLAG.toUpperCase()}
            captionStyle={{color: CMSColors.PrimaryActive, fontSize: 20}}
            iconCustom="ic_flag_black_48px"
            iconSize={24}
            type="flat"
            enable={true}
            onPress={() => this.setState({showFlagModal: true})}
          />
        </View>
        <TouchableOpacity
          onPress={this.onViewBill}
          style={[styles.contentView, styles.defaultBillContainer]}>
          <TransactionBillView
            isLoading={isLoading}
            transaction={selectedTransaction}
          />
        </TouchableOpacity>
      </View>
    );
  };

  render() {
    const {selectedTransaction, isLoading} = this.props.exceptionStore;
    const {showFlagModal, viewMode} = this.state;

    if (!selectedTransaction) return <View />;

    let content = null;
    const actionButton =
      viewMode != ViewModes.fullscreenVideo && this.renderActionButton();

    switch (viewMode) {
      case ViewModes.normal:
        content = this.renderDefaultMode();
        break;
      case ViewModes.fullscreenBill:
        content = this.renderFullscreenBill();
        break;
      case ViewModes.fullscreenVideo:
        content = this.renderFullscreenVideo();
        break;
      default:
        __DEV__ &&
          console.log(
            'GOND render TransactionDetail: invalid viewMode: ',
            viewMode
          );
        break;
    }

    return (
      <View style={styles.viewContainer}>
        {isLoading ? (
          <LoadingOverlay
            backgroundColor={CMSColors.White}
            indicatorColor={CMSColors.PrimaryActive}
          />
        ) : (
          content
        )}
        {actionButton}
        <FlagWeightModal
          isVisible={showFlagModal}
          data={selectedTransaction.exceptionTypes}
          onDismiss={() => this.setState({showFlagModal: false})}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    backgroundColor: CMSColors.White,
  },
  contentView: {
    paddingHorizontal: 12,
  },
  button: {
    height: 50,
    borderColor: CMSColors.PrimaryActive,
    borderWidth: 2,
    marginTop: 42,
    justifyContent: 'center',
  },
  defaultBillContainer: {flex: 1, marginTop: 16},
});

export default inject(
  'exceptionStore',
  'videoStore',
  'appStore'
)(observer(TransactionDetailView));
