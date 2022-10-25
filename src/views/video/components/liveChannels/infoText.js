import React from 'react';
import {Text, View} from 'react-native';

import {inject, observer} from 'mobx-react';

import CMSTouchableIcon from '../../../../components/containers/CMSTouchableIcon';

import styles from '../../styles/liveChannelStyles';

import ROUTERS from '../../../../consts/routes';
import {MODULE_PERMISSIONS} from '../../../../consts/misc';
import {VIDEO as VIDEO_TXT, STREAM_STATUS} from '../../localization/texts';
import theme from '../../../../styles/appearance';

class InformationText extends React.Component {
  render() {
    const {userStore, videoStore, appStore} = this.props;
    if (!videoStore.isAuthenticated) return null;
    const {appearance} = appStore;

    return userStore.hasPermission(MODULE_PERMISSIONS.VSC) &&
      videoStore.hasNVRPermission ? (
      <View style={[styles.infoTextContainer, theme[appearance].container]}>
        <Text style={theme[appearance].text}>{VIDEO_TXT.SELECT_CHANNEL_1}</Text>
        <CMSTouchableIcon
          size={22}
          onPress={() =>
            appStore.naviService.push(ROUTERS.VIDEO_CHANNELS_SETTING)
          }
          color={theme[appearance].iconColor}
          styles={styles.infoTextIcon}
          iconCustom="add-cam"
        />
        <Text style={theme[appearance].text}>{VIDEO_TXT.SELECT_CHANNEL_2}</Text>
      </View>
    ) : (
      <View style={[styles.infoTextContainer, theme[appearance].container]}>
        <Text style={theme[appearance].text}>
          {userStore.hasPermission(MODULE_PERMISSIONS.VSC)
            ? STREAM_STATUS.NO_PERMISSION
            : VIDEO_TXT.NO_VSC_PERMISSION}
        </Text>
      </View>
    );
  }
}

export default inject(
  'appStore',
  'userStore',
  'videoStore'
)(observer(InformationText));
