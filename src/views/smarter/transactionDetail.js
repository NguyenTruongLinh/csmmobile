import React, {Component} from 'react';
import {View, StyleSheet, StatusBar} from 'react-native';

import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';

import Button from '../../components/controls/Button';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import BackButton from '../../components/controls/BackButton';
import FlagWeightModal from './FlagWeightModal';
import TransactionBillView from './components/transactionDetail/transactionBill';
import LoadingOverlay from '../../components/common/loadingOverlay';
import VideoPlayerView from './components/transactionDetail/videoPlayer';
import DefaultModeView from './components/transactionDetail/defaultMode';

import snackbarUtil from '../../util/snackbar';

import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import theme from '../../styles/appearance';
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

class TransactionDetailView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showFlagModal: false,
      viewMode: ViewModes.normal,
    };

    this.reactions = [];
    this.unsubBackEvent = null;
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
    const {exceptionStore, navigation, appStore} = this.props;
    const {viewMode} = this.state;
    const {appearance} = appStore;

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
                      : theme[appearance].iconColor
                  }
                  styles={commonStyles.headerIcon}
                  iconCustom="clear-button"
                />
              </View>
            )
          : null,
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

  onFlagPress = () => this.setState({showFlagModal: true});

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

  renderFullscreenVideo = () => {
    return (
      <View style={styles.videoContainer}>
        <VideoPlayerView
          viewMode={this.state.viewMode}
          onViewVideo={this.onViewVideo}
        />
      </View>
    );
  };

  renderDefaultMode = () => {
    return (
      <DefaultModeView
        viewMode={this.state.viewMode}
        onViewVideo={this.onViewVideo}
        onVideoDownload={this.onVideoDownload}
        onFlagPress={this.onFlagPress}
        onViewBill={this.onViewBill}
      />
    );
  };

  render() {
    const {selectedTransaction, isLoading} = this.props.exceptionStore;
    const {showFlagModal, viewMode} = this.state;
    const {appearance} = this.props.appStore;

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
      <View style={[styles.viewContainer, theme[appearance].container]}>
        {isLoading ? (
          <LoadingOverlay
            backgroundColor={theme[appearance].container}
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
  },
  contentView: {
    paddingHorizontal: 12,
  },
  button: {
    height: 50,
    borderColor: CMSColors.PrimaryActive,
    borderWidth: 2,
    marginTop: 16,
    justifyContent: 'center',
  },
  defaultBillContainer: {flex: 1, marginTop: 16},
});

export default inject(
  'exceptionStore',
  'videoStore',
  'appStore'
)(observer(TransactionDetailView));
