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

import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import {SMARTER as SMARTER_TXT} from '../../localization/texts';
import ROUTERS from '../../consts/routes';

const ViewModes = {
  normal: 0,
  fullscreenBill: 1,
  fullscreenVideo: 2,
};

class TransactionDetailView extends Component {
  constructor(props) {
    super(props);
    const {width} = Dimensions.get('window');

    this.state = {
      showFlagModal: false,
      // fullscreenVideo: false,
      // fullscreenBill: false,
      viewMode: ViewModes.normal,
      videoWidth: width,
      videoHeight: (1.1 * (width * 9)) / 16,
    };

    this.reactions = [];
  }

  componentWillUnmount() {
    __DEV__ && console.log('TransactionDetailView componentWillUnmount');

    this.reactions && this.reactions.forEach(unsubscribe => unsubscribe());
    this.unsubBackEvent && this.unsubBackEvent();
    this.props.videoStore.releaseStreams();
    this.props.exceptionStore.onExitTransactionDetail();
  }

  componentDidMount() {
    __DEV__ &&
      console.log(
        'TransactionDetailView componentDidMount: ',
        this.props.exceptionStore.selectedTransaction
      );
    const {route, navigation} = this.props;

    if (!route || !route.params || !route.params.fromNotify) {
      this.getData();
    }

    this.setHeader();
    this.initReactions();

    this.unsubBackEvent = navigation.addListener('beforeRemove', e => {
      if (!this.state.viewMode == ViewModes.normal) {
        e.preventDefault();
        this.onExitFullscren();
      }
    });
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
    const fullscreenMode =
      viewMode == ViewModes.fullscreenVideo ||
      viewMode == ViewModes.fullscreenBill;

    navigation.setOptions({
      headerLeft: fullscreenMode
        ? null
        : () => <BackButton navigator={navigation} />,
      headerTitle:
        viewMode == ViewModes.fullscreenVideo
          ? null
          : SMARTER_TXT.TRANSACTION +
            (exceptionStore.selectedTransaction
              ? ' #' + exceptionStore.selectedTransaction.tranNo
              : ''),
      headerRight: fullscreenMode
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
    });
  };

  getData = () => {
    const {exceptionStore} = this.props;
    exceptionStore.getTransaction();
  };

  onExitFullscren = () => {
    this.setState({viewMode: ViewModes.normal}, () => this.setHeader());
  };

  onLayout = event => {
    const {width} = event.nativeEvent.layout;
    this.setState({videoWidth: width, videoHeight: (width * 9) / 16});
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
    videoStore.onAlertPlay(false, transaction);
    setTimeout(() => {
      navigation.push(ROUTERS.VIDEO_PLAYER);
    }, 200);
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
    const {videoWidth, videoHeight} = this.state;

    return (
      <View style={{height: videoHeight, width: '100%'}}>
        <VideoPlayer
          // controls={true}
          video={
            selectedTransaction.media
              ? {uri: selectedTransaction.media}
              : undefined
          }
          videoWidth={videoWidth}
          videoHeight={videoHeight}
          poster={selectedTransaction.snapshot}
          resizeMode={'stretch'}
          // controlsTimeout={3}
          disableControlsAutoHide
          muted
          autoplay
          fullScreenHandler={this.onViewVideo}
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
          backgroundColor: CMSColors.DarkTheme,
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
    const actionButton = this.renderActionButton();

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
