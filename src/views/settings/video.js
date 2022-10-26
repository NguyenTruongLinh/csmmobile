import React, {Component} from 'react';
import {View, FlatList, Text, Image} from 'react-native';

import {inject, observer} from 'mobx-react';
import Ripple from 'react-native-material-ripple';

import {MaterialIcons} from '../../components/CMSStyleSheet';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import styles from './styles/videoStyles';

import {
  Setting_Video_Direct,
  Setting_Video_Cloud,
  Setting_Video_Relay,
} from '../../consts/images';
import {Settings as SettingsTxt} from '../../localization/texts';
import {MODULE_PERMISSIONS} from '../../consts/misc';
import {CLOUD_TYPE} from '../../consts/video';
import snackbar from '../util/snackbar';

export const CloudSettingData = [
  {
    id: 'direct',
    name: SettingsTxt.videoDirectName,
    description: SettingsTxt.videoDirecDesc,
    icon: Setting_Video_Direct, // 'desktop',
    value: CLOUD_TYPE.DIRECTION,
    visible: true,
  },
  {
    id: 'stream',
    name: SettingsTxt.videoStreamName,
    description: SettingsTxt.videoStreamDesc,
    icon: Setting_Video_Cloud, // 'cloud',
    value: CLOUD_TYPE.HLS,
    visible: true,
  },
  {
    id: 'relay',
    name: SettingsTxt.videoRelayServer,
    description: SettingsTxt.videoRelayDesc,
    icon: Setting_Video_Relay, // 'relay',
    value: CLOUD_TYPE.RS,
    visible: true,
  },
];

class VideosettingView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedValue: null,
      settingLoaded: false,
    };
  }

  componentDidMount() {
    __DEV__ && console.log('VideoSettingView componentDidMount ');
    const {cloudType} = this.props.videoStore;

    if (cloudType) {
      this.setState({selectedValue: cloudType});
    }

    this.getAPIVersion();
    this.getCloudSetting();
  }

  canSave = () => {
    __DEV__ &&
      console.log(
        'VideoSettingView cansave: ',
        this.state.selectedValue,
        this.props.videoStore.cloudType
      );
    return this.props.videoStore
      ? this.state.selectedValue != this.props.videoStore.cloudType
      : false;
  };

  getAPIVersion = async () => {
    const res = await this.props.videoStore.getAPIVersion();
  };

  getCloudSetting = async () => {
    const isStreamingAvailable = this.props.userStore.hasPermission(
      MODULE_PERMISSIONS.VSC
    );
    const res = await this.props.videoStore.getCloudSetting(
      isStreamingAvailable
    );
    if (res) {
      this.setState({
        selectedValue: this.props.videoStore.cloudType,
      });
    } else {
      snackbar.handleRequestFailed();
    }
  };

  updateCloudSetting = async () => {
    let value =
      this.state.selectedValue > 1
        ? this.state.selectedValue
        : this.state.selectedValue == 1
        ? true
        : false;
    const res = await this.props.videoStore.updateCloudSetting(value);
    snackbar.handleSaveResult(res);
  };

  onItemPress = value => {
    const {selectedValue} = this.state;
    const {isLoading} = this.props.videoStore;
    const isStreamingAvailable = this.props.userStore.hasPermission(
      MODULE_PERMISSIONS.VSC
    );

    if (isLoading) {
      return;
    }

    if (selectedValue !== value && (isStreamingAvailable || selectedValue)) {
      this.setState({selectedValue: value}, () => {
        this.updateCloudSetting();
      });
    }
  };

  renderItem = ({item}) => {
    if (!item) return;
    const {appearance} = this.props.appStore;

    const isStreamingAvailable = this.props.userStore.hasPermission(
      MODULE_PERMISSIONS.VSC
    );
    const {selectedValue} = this.state;
    const isChecked =
      (selectedValue == item.value && item.value && isStreamingAvailable) ||
      (!item.value && !selectedValue);
    item.visible = true;

    const checkBox = (
      <MaterialIcons
        style={{marginTop: 15, marginRight: 8}}
        name={isChecked ? 'radio-button-checked' : 'radio-button-unchecked'}
        color={
          item.value && !isStreamingAvailable
            ? CMSColors.DisableItemColor
            : CMSColors.PrimaryActive
        }
        size={28}
      />
    );
    return (
      item.visible && (
        <Ripple
          rippleOpacity={0.87}
          onPress={() => this.onItemPress(item.value)}>
          <View
            style={[
              styles.rowList,
              theme[appearance].container,
              theme[appearance].borderColor,
            ]}>
            <View style={styles.rowButton_contain_icon}>
              <Image
                source={item.icon}
                style={[
                  styles.rowButton_icon,
                  item.value && !isStreamingAvailable
                    ? {tintColor: CMSColors.DisableItemColor}
                    : {},
                ]}
                resizeMode="contain"
              />
            </View>
            <View style={styles.rowButton_contain_name}>
              <Text
                style={[
                  styles.rowButton_name,
                  theme[appearance].text,
                  item.value && !isStreamingAvailable
                    ? {color: CMSColors.DisableItemColor}
                    : {},
                ]}>
                {item.name}
              </Text>
              <Text
                style={[
                  styles.rowButton_desc,
                  theme[appearance].text,
                  item.value && !isStreamingAvailable
                    ? {color: CMSColors.DisableItemColor}
                    : {},
                ]}>
                {item.description}
              </Text>
            </View>
            {checkBox}
          </View>
        </Ripple>
      )
    );
  };

  render() {
    const {appearance} = this.props.appStore;

    return (
      <View
        style={[commonStyles.normalViewContainer, theme[appearance].container]}>
        <View style={styles.firstContainer}>
          <FlatList
            data={CloudSettingData}
            renderItem={this.renderItem.bind(this)}
            onRefresh={this.getCloudSetting}
            refreshing={
              this.props.videoStore ? this.props.videoStore.isLoading : false
            }
          />
        </View>
      </View>
    );
  }
}

export default inject(
  'videoStore',
  'userStore',
  'appStore'
)(observer(VideosettingView));
