import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Platform,
  StyleSheet,
  // StatusBar,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import Ripple from 'react-native-material-ripple';

import Button from '../../components/controls/Button';
import CMSAvatars from '../../components/containers/CMSAvatars';
import {Icon} from '../../components/CMSStyleSheet';

import snackbar from '../util/snackbar';
// import {STREAMING_TYPES} from '../../consts/video';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variable from '../../styles/variables';
import {Settings as SettingsTxt} from '../../localization/texts';

const CloudSettingData = [
  {
    id: 'direct',
    name: SettingsTxt.videoDirectName,
    description: SettingsTxt.videoDirecDesc,
    icon: 'desktop',
    value: false,
  },
  {
    id: 'stream',
    name: SettingsTxt.videoStreamName,
    description: SettingsTxt.videoStreamDesc,
    icon: 'cloud',
    value: true,
  },
];

class VideosettingView extends Component {
  constructor(props) {
    super(props);
    this.getCloudSetting = this.getCloudSetting.bind(this);
    // this.canSave = this.canSave.bind(this);

    this.state = {
      isCloud: true,
      selectedValue: true,
      settingLoaded: false,
    };
  }

  componentDidMount() {
    __DEV__ && console.log('VideoSettingView componentDidMount ');

    this.refreshSaveButton();
    // console.log('GOND comDidMount videoStore: ', this.props.videoStore);
    this.getCloudSetting();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedValue != this.state.selectedValue) {
      this.refreshSaveButton();
    }
  }

  canSave() {
    return this.props.videoStore
      ? this.state.selectedValue != this.props.videoStore.isCloud
      : false;
  }

  refreshSaveButton() {
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
  }

  async getCloudSetting() {
    const res = await this.props.videoStore.getCloudSetting();
    if (res) {
      this.setState({
        selectedValue: this.props.videoStore.isCloud,
      });
    } else {
      snackbar.handleGetDataFailed();
    }
  }

  async updateCloudSetting() {
    const res = this.props.videoStore.updateCloudSetting();
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
  }

  renderItem(_item) {
    const item = _item.item;
    if (!_item) return;
    const {selectedValue} = this.state;
    const isChecked = selectedValue == item.value;

    const checkBox = isChecked ? (
      <View style={[styles.containIconCheck]}>
        <Icon name="check-circle" color={CMSColors.PrimaryColor} size={24} />
      </View>
    ) : (
      <View style={[styles.containIconCheck]}>
        <Icon name="circle" color={CMSColors.DividerColor} size={24} />
      </View>
    );
    return (
      <Ripple
        rippleOpacity={0.87}
        onPress={() => {
          if (selectedValue != item.value && !this.props.videoStore.isLoading) {
            this.setState({selectedValue: item.value});
          }
        }}>
        <View style={styles.rowList}>
          <View style={styles.rowButton_contain_icon}>
            <CMSAvatars
              size={24}
              styles={[
                styles.rowButton_icon,
                isChecked
                  ? styles.rowButton_icon_check
                  : styles.rowButton_icon_uncheck,
              ]}
              disabled={true}
              color={isChecked ? CMSColors.White : CMSColors.colorRow_options}
              icon={item.icon}
            />
          </View>
          <View style={styles.rowButton_contain_name}>
            <Text style={styles.rowButton_name}>{item.name}</Text>
            <Text style={styles.rowButton_name}>{item.description}</Text>
          </View>
          {checkBox}
        </View>
      </Ripple>
    );
  }

  render() {
    // let statusbar =
    //   Platform.OS == 'ios' ? <View style={styles.statusbarios}></View> : null;

    return (
      <View style={commonStyles.normalViewContainer}>
        {/* <StatusBar
          translucent={false}
          backgroundColor={CMSColors.Dark_Blue}
          barStyle="light-content"
        />
        {statusbar} */}
        {/* <View style={styles.navbar_body}>
          <View style={styles.navbar}>
            <Ripple
              rippleCentered={true}
              style={styles.left}
              onPress={this.onBack.bind(this)}>
              <View style={styles.icon}>
                <CMSAvatars
                  size={20}
                  color={CMSColors.SecondaryText}
                  styles={styles.contentIcon}
                  iconCustom="keyboard-left-arrow-button"
                />
              </View>
              <View style={styles.title}>
                <Text>{this.state.title}</Text>
              </View>
            </Ripple>
            <View>
              <Button
                style={styles.buttonSave}
                caption="SAVE"
                enable={this.state.isChange}
                onPress={this.UpdateVideoSetting}
                styleCaption={styles.buttonSave_text}
                type="flat"
              />
            </View>
          </View>
        </View> */}

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
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
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

export default inject('videoStore')(observer(VideosettingView));
