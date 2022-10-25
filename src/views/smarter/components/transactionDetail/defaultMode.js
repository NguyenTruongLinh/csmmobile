import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';

import Button from '../../../../components/controls/Button';
import TransactionBillView from './transactionBill';
import VideoPlayerView from './videoPlayer';

import styles, {ViewModes} from '../../styles/transactionDetailStyles';
import CMSColors from '../../../../styles/cmscolors';

import {SMARTER as SMARTER_TXT} from '../../../../localization/texts';

class DefaultModeView extends React.Component {
  static PropTypes = {
    viewMode: PropTypes.number,
    onViewVideo: PropTypes.func,
  };

  static defaultProps = {
    viewMode: ViewModes.normal,
    onViewVideo: () => {},
  };

  render() {
    const {
      onViewVideo,
      viewMode,
      onVideoDownload,
      onFlagPress,
      onViewBill,
      exceptionStore,
    } = this.props;
    const {selectedTransaction, isLoading} = exceptionStore;
    __DEV__ &&
      console.log(
        'GOND transaction detail video url: ',
        selectedTransaction.media
      );

    return (
      <View style={[styles.viewContainer]}>
        {selectedTransaction.hasVideo && (
          <VideoPlayerView {...{viewMode, onViewVideo}} />
        )}
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
              onPress={onVideoDownload}
            />
          )}
          {selectedTransaction.hasVideo && <View style={{width: 20}} />}
          <Button
            style={[styles.button, styles.viewContainer]}
            caption={SMARTER_TXT.FLAG.toUpperCase()}
            captionStyle={{color: CMSColors.PrimaryActive, fontSize: 20}}
            iconCustom="ic_flag_black_48px"
            iconSize={24}
            type="flat"
            enable={true}
            onPress={onFlagPress}
          />
        </View>
        <TouchableOpacity
          onPress={onViewBill}
          style={[styles.contentView, styles.defaultBillContainer]}>
          <TransactionBillView
            isLoading={isLoading}
            transaction={selectedTransaction}
          />
        </TouchableOpacity>
      </View>
    );
  }
}

export default inject('exceptionStore')(observer(DefaultModeView));
