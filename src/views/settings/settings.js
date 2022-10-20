import {Text, ScrollView, StyleSheet, View, Switch} from 'react-native';
import React, {Component} from 'react';

import {inject, observer} from 'mobx-react';

import Ripple from 'react-native-material-ripple';

// import naviService from '../../navigation/navigationService';
import {Account} from '../../consts/apiRoutes';

import CMSColors from '../../styles/cmscolors';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSImage from '../../components/containers/CMSImage';
import theme from '../../styles/appearance';

import CMSStyleSheet from '../../components/CMSStyleSheet';
import ROUTERS from '../../consts/routes';
import {MODULE_PERMISSIONS} from '../../consts/misc';
import {clientLogID} from '../../stores/user';
import {CloudSettingData} from './video';
const IconCustom = CMSStyleSheet.IconCustom;

class SettingsView extends Component {
  constructor(props) {
    super(props);
    let domains = props.config && props.config.domains;
    let domain =
      domains == undefined ? null : domains.length > 0 ? domains[0] : null;
    this.state = {
      title: 'Options',
      domainName: domain ? domain.Url : 'https://',
    };
  }

  componentDidMount() {
    const {userStore} = this.props;
    __DEV__ && console.log('GOND SettingsView componentDidMount');
    userStore.setActivites(clientLogID.SETTINGS);
    this.getCloudSetting();
  }

  onLogout = () => {
    const {
      userStore,
      videoStore,
      alarmStore,
      healthStore,
      oamStore,
      sitesStore,
      exceptionStore,
    } = this.props;
    this.props;
    if (userStore.logout()) {
      videoStore.cleanUp();
      alarmStore.cleanUp();
      healthStore.cleanUp();
      oamStore.cleanUp();
      sitesStore.cleanUp();
      exceptionStore.cleanUp();
    }
  };

  toProfile = () => {
    this.props.appStore.naviService.navigate(ROUTERS.OPTIONS_PROFILE);
  };

  toAbout = () => {
    this.props.appStore.naviService.navigate(ROUTERS.OPTIONS_ABOUT);
  };

  toNotify = () => {
    this.props.appStore.naviService.navigate(ROUTERS.OPTIONS_NOTIFY);
  };

  toVideoSetting = () => {
    this.props.appStore.naviService.navigate(ROUTERS.OPTIONS_VIDEO);
  };

  getCloudSetting = async () => {
    const isStreamingAvailable = this.props.userStore.hasPermission(
      MODULE_PERMISSIONS.VSC
    );
    await this.props.videoStore.getCloudSetting(isStreamingAvailable);
  };

  renderArrowIcon = () => {
    const {appearance} = this.props.appStore;

    return (
      <View style={styles.listEnterIcon}>
        <IconCustom
          name="keyboard-right-arrow-button"
          size={16}
          color={theme[appearance].iconColor}
        />
      </View>
    );
  };

  renderSwitchDarkMode = () => {
    const {appearance} = this.props.appStore;

    return (
      <Switch
        value={appearance === 'dark'}
        thumbColor={
          appearance === 'dark' ? CMSColors.PrimaryActive : CMSColors.White
        }
        trackColor={{true: '#7ab8e1', false: '#d3d3d3'}}
        style={{marginRight: 16}}
      />
    );
  };

  onToggleDarkMode = () => {
    const {appearance, setAppearance} = this.props.appStore;
    if (appearance === 'dark') {
      setAppearance('light');
    } else {
      setAppearance('dark');
    }
  };

  render() {
    if (!this.props.userStore) return <View />;
    const {user} = this.props.userStore;
    const {appearance} = this.props.appStore;
    const {cloudType} = this.props.videoStore;
    // const showVideoSetting = user.hasPermission(
    //   MODULE_PERMISSIONS.VSC
    // );
    const imgParams = {
      controller: Account.controller,
      action: Account.avatar,
      id: user ? user.userId : 0,
    };
    // __DEV__ && console.log('GOND setting UserPhoto: ', user);

    const selectedVideoConnection = CloudSettingData.find(
      con => con.value === cloudType
    );

    let avatar = user ? (
      <CMSTouchableIcon
        disabled={true}
        size={30}
        styles={styles.avatar}
        image={
          <CMSImage
            id={user.avatar.slice(-20)}
            styleImage={styles.image}
            styles={styles.avatar}
            source={user.avatar}
            domain={imgParams}
          />
        }
      />
    ) : null;

    const videoConnection = (
      <View>
        <Text style={styles.videoConnectionLittleText}>
          {selectedVideoConnection?.name}
        </Text>
      </View>
    );

    const data = [
      {
        id: 'domain',
        title: 'Domain',
        subTitle: this.props.userStore.domain,
        onPress: () => {},
        titleStyle: [styles.listTextDomainTitle, theme[appearance].text],
        subTitleStyle: [styles.listTextDomain, theme[appearance].text],
        disabled: true,
        icon: null,
      },
      {
        id: 'notification-settings',
        title: 'Notification Settings',
        subTitle: null,
        onPress: this.toNotify,
        titleStyle: [styles.listText, theme[appearance].text],
        subTitleStyle: null,
        disabled: false,
        icon: this.renderArrowIcon(),
      },
      {
        id: 'video-connection',
        title: 'Video Connection',
        subTitle: selectedVideoConnection?.name,
        onPress: this.toVideoSetting,
        titleStyle: [styles.listText, theme[appearance].text],
        subTitleStyle: [
          styles.videoConnectionLittleText,
          theme[appearance].videoConnectionLittleText,
        ],
        disabled: false,
        icon: this.renderArrowIcon(),
      },
      {
        id: 'dark-theme',
        title: 'Dark theme',
        subTitle: null,
        onPress: this.onToggleDarkMode,
        titleStyle: [styles.listText, theme[appearance].text],
        subTitleStyle: null,
        disabled: false,
        icon: this.renderSwitchDarkMode(),
      },
      {
        id: 'about',
        title: 'About',
        subTitle: null,
        onPress: this.toAbout,
        titleStyle: [styles.listText, theme[appearance].text],
        subTitleStyle: null,
        disabled: false,
        icon: this.renderArrowIcon(),
      },
      {
        id: 'logout',
        title: 'Logout',
        subTitle: null,
        onPress: this.onLogout,
        titleStyle: [styles.listText, {color: '#d9534f'}],
        subTitleStyle: null,
        disabled: false,
        icon: null,
      },
    ];

    return (
      <View style={[styles.all, theme[appearance].container]}>
        <ScrollView style={[styles.container, theme[appearance].container]}>
          <Ripple
            style={[styles.headerRowContainer, theme[appearance].borderColor]}
            rippleOpacity={0.87}
            onPress={this.toProfile}>
            <View style={[styles.infoProfile]}>
              <View>{avatar}</View>
              <View style={styles.userInfo}>
                <Text style={[styles.userInfoText, theme[appearance].text]}>
                  {user.firstName}
                </Text>
                <Text style={[styles.userInfoSubText, theme[appearance].text]}>
                  {user.email}
                </Text>
              </View>
            </View>
            {this.renderArrowIcon()}
          </Ripple>
          {data.map(item => (
            <Ripple
              style={[styles.rowContainer, theme[appearance].borderColor]}
              rippleOpacity={0.87}
              disabled={item.disabled}
              onPress={item.onPress}
              key={item.id}>
              <View style={styles.listRow}>
                <View style={styles.listRowLeft}>
                  <Text style={item.titleStyle}>{item.title}</Text>
                  {item.subTitle && (
                    <Text style={item.subTitleStyle}>{item.subTitle}</Text>
                  )}
                </View>
                {item.icon}
              </View>
            </Ripple>
          ))}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  all: {
    flexDirection: 'row',
    flex: 1,
    // backgroundColor: '#eee',
  },
  container: {
    flex: 1,
    width: null,
    height: null,
  },
  headerRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    //padding: 20,
    //margin: 20,
    height: 94,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgb(204, 204, 204)',
  },
  infoProfile: {
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconArrowProfile: {
    marginRight: 10,
    width: 30,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#3c7ba4',
    marginRight: 5,
    borderRadius: 30,
  },
  image: {
    top: 1,
    left: 1,
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  userInfo: {
    justifyContent: 'center',
    marginLeft: 10,
  },
  userInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.ColorText,
  },
  userInfoSubText: {
    fontSize: 14,
    color: CMSColors.ColorText,
  },
  rowContainer: {
    height: 70,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgb(204, 204, 204)',
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listIcon: {
    width: 30,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  domainContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  listText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.ColorText,
    lineHeight: 24,
  },
  listTextDomainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.ColorText,
    lineHeight: 22,
  },
  listTextDomain: {
    fontSize: 14,
    color: CMSColors.PrimaryColor,
  },
  listEnterIcon: {
    marginRight: 10,
    width: 30,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoConnectionContent: {
    flex: 1,
    margin: 15,
  },
  videoConnectionLittleText: {
    fontSize: 12,
    color: CMSColors.RowOptions,
    lineHeight: 18,
  },
  listRowLeft: {
    flex: 1,
    paddingLeft: 16,
  },
});

export default inject(
  'userStore',
  'appStore',
  'videoStore',
  'alarmStore',
  'healthStore',
  'oamStore',
  'sitesStore',
  'exceptionStore'
)(observer(SettingsView));
