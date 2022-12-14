import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Platform,
  StyleSheet,
  Image,
  // StatusBar,
} from 'react-native';

import {reaction} from 'mobx';
import {inject, observer} from 'mobx-react';
import Ripple from 'react-native-material-ripple';

import Button from '../../components/controls/Button';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import {MaterialIcons} from '../../components/CMSStyleSheet';

import snackbar from '../util/snackbar';
import {CLOUD_TYPE} from '../../consts/video';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variable from '../../styles/variables';
import {
  Setting_Video_Direct,
  Setting_Video_Cloud,
  Setting_Video_Relay,
  // Setting_Video_Relay,
} from '../../consts/images';
import {Settings as SettingsTxt} from '../../localization/texts';
import {MODULE_PERMISSIONS} from '../../consts/misc';

const CloudSettingData = [
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
    // this.getCloudSetting = this.getCloudSetting.bind(this);
    // this.canSave = this.canSave.bind(this);

    this.state = {
      selectedValue: null,
      settingLoaded: false,
    };

    this.reactions = [];
  }

  componentDidMount() {
    __DEV__ && console.log('VideoSettingView componentDidMount ');

    this.refreshSaveButton();
    // console.log('GOND comDidMount videoStore: ', this.props.videoStore);
    this.getAPIVersion();
    this.getCloudSetting();

    this.reactions = [
      reaction(
        () => this.props.videoStore.cloudType,
        (newIsCloud, oldValue) => {
          if (newIsCloud != oldValue) {
            this.refreshSaveButton();
          }
        }
      ),
    ];
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedValue != this.state.selectedValue) {
      this.refreshSaveButton();
    }
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

  refreshSaveButton = () => {
    this.props.navigation.setOptions({
      headerRight: () => (
        <Button
          style={commonStyles.buttonSave}
          caption={SettingsTxt.save}
          enable={this.canSave()}
          onPress={this.updateCloudSetting.bind(this)}
          styleCaption={commonStyles.buttonSaveText}
          type="flat"
        />
      ),
    });
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
    const res = await this.props.videoStore.updateCloudSetting(
      value
      //this.state.selectedValue // ? 1 : 0
    );
    // console.log('GOND save cloud setting response: ', response)
    // if (res) {
    //   Snackbar.show({
    //     text: ActionMessages.saveSuccess,
    //     duration: Snackbar.LENGTH_LONG,
    //     backgroundColor: CMSColors.Success, //CMSColors.Danger, //onTimeOut: this.onSnackbarTimeout
    //   });
    // } else {
    //   Snackbar.show({
    //     text: ActionMessages.saveFailRestart,
    //     duration: Snackbar.LENGTH_LONG,
    //     backgroundColor: CMSColors.Danger, //CMSColors.Danger,
    //   });
    // }
    snackbar.handleSaveResult(res);
  };

  renderItem = ({item}) => {
    if (!item) return;

    const isStreamingAvailable = this.props.userStore.hasPermission(
      MODULE_PERMISSIONS.VSC
    );
    const {selectedValue} = this.state;
    const {isLoading, apiVersion} = this.props.videoStore;
    const isChecked =
      (selectedValue == item.value && item.value && isStreamingAvailable) ||
      (!item.value && !selectedValue);
    item.visible = true; //item.id === 'relay' && apiVersion == '' ? false : true;
    const checkBox = (
      <MaterialIcons
        style={{marginTop: 15, marginRight: 8}}
        name={
          isChecked && !isLoading
            ? 'radio-button-checked'
            : 'radio-button-unchecked'
        }
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
          onPress={() => {
            if (
              selectedValue != item.value &&
              !isLoading &&
              (isStreamingAvailable || selectedValue)
            ) {
              this.setState({selectedValue: item.value});
            }
          }}>
          <View style={styles.rowList}>
            <View style={styles.rowButton_contain_icon}>
              {/* <CMSTouchableIcon
              size={24}
              styles={[
                styles.rowButton_icon,
                isChecked
                  ? styles.rowButton_icon_check
                  : styles.rowButton_icon_uncheck,
              ]}
              disabled={true}
              color={isChecked ? CMSColors.White : CMSColors.RowOptions}
              icon={item.icon}
            /> */}
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
                  item.value && !isStreamingAvailable
                    ? {color: CMSColors.DisableItemColor}
                    : {},
                ]}>
                {item.name}
              </Text>
              <Text
                style={[
                  styles.rowButton_desc,
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
    // let statusbar =
    //   Platform.OS == 'ios' ? <View style={styles.statusbarios}></View> : null;

    return (
      <View style={commonStyles.normalViewContainer}>
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

const styles = StyleSheet.create({
  all: {
    flex: 1,
    backgroundColor: CMSColors.White,
  },
  firstContainer: {
    flex: 1,
  },

  statusbarios: {
    height: variable.isPhoneX ? 44 : 20,
    backgroundColor: CMSColors.Dark_Blue,
  },
  // navbar_body: {
  //   backgroundColor: CMSColors.Dark_Blue,
  //   justifyContent: 'center',
  //   ...Platform.select({
  //     ios: {
  //       shadowOpacity: 0.3,
  //       shadowRadius: 3,
  //       shadowOffset: {
  //         height: 0,
  //         width: 0,
  //       },
  //     },
  //     android: {
  //       elevation: 1,
  //     },
  //   }),
  // },
  // navbar: {
  //   backgroundColor: CMSColors.White,
  //   ...Platform.select({
  //     ios: {
  //       //height: 64,
  //       shadowOpacity: 0.3,
  //       shadowRadius: 3,
  //       shadowOffset: {
  //         height: 0,
  //         width: 0,
  //       },
  //     },
  //     android: {
  //       //height: 54,
  //       elevation: 1,
  //     },
  //   }),
  //   height: 50,
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   //borderBottomWidth: 0.5,
  //   borderBottomColor: '#828287',
  //   borderTopLeftRadius: 5,
  //   borderTopRightRadius: 5,
  // },
  // left: {
  //   flexDirection: 'row',
  //   justifyContent: 'flex-start',
  //   marginLeft: 10,
  //   marginTop: 2,
  //   alignItems: 'center',
  // },
  // icon: {
  //   flexDirection: 'row',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   padding: 5,
  // },
  // contentIcon: {
  //   paddingTop: 5,
  // },
  // title: {
  //   marginLeft: 5,
  // },
  // title_text: {
  //   fontSize: 16,
  // },
  // right: {},
  rowList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    borderBottomWidth: variable.borderWidthRow,
    borderColor: 'rgb(204, 204, 204)',
    backgroundColor: CMSColors.White,
  },
  rowButton_contain_icon: {
    //backgroundColor: 'red'
  },
  rowButton_icon: {
    margin: 5,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    // borderRadius: 20,
  },
  rowButton_icon_check: {
    backgroundColor: CMSColors.PrimaryColor,
  },
  rowButton_icon_uncheck: {
    backgroundColor: '#D8D8D8',
  },
  rowButton_contain_name: {
    flex: 1,
    //backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rowButton_name: {
    margin: 5,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  rowButton_desc: {
    margin: 5,
    paddingTop: 10,
    paddingBottom: 10,
    //fontSize: 14,
  },
  containIconCheck: {
    //backgroundColor: 'blue'
    margin: 5,
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'center',
    //backgroundColor: '#D8D8D8',
  },
});

export default inject('videoStore', 'userStore')(observer(VideosettingView));
