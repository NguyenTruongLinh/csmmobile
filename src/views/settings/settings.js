import {Text, ScrollView, StyleSheet, View} from 'react-native';
import React, {Component} from 'react';

import {inject, observer} from 'mobx-react';

import Ripple from 'react-native-material-ripple';

// import naviService from '../../navigation/navigationService';
import {Account} from '../../consts/apiRoutes';

import CMSColors from '../../styles/cmscolors';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSImage from '../../components/containers/CMSImage';

import CMSStyleSheet from '../../components/CMSStyleSheet';
import ROUTERS from '../../consts/routes';
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
    __DEV__ && console.log('GOND SettingsView componentDidMount');
  }

  onLogout = () => {
    const {
      userStore,
      videoStore,
      alarmStore,
      healthStore,
      oamStore,
      sitesStore,
      posStore,
    } = this.props;
    this.props;
    if (userStore.logout()) {
      videoStore.cleanUp();
      alarmStore.cleanUp();
      healthStore.cleanUp();
      oamStore.cleanUp();
      sitesStore.cleanUp();
      posStore.cleanUp();
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

  render() {
    if (!this.props.userStore) return <View />;
    const {user} = this.props.userStore;
    const imgParams = {
      controller: Account.controller,
      action: Account.avatar,
      id: user ? user.userId : 0,
    };
    // __DEV__ && console.log('GOND setting UserPhoto: ', user);

    let avatar = user ? (
      <CMSTouchableIcon
        disabled={true}
        size={30}
        styles={styles.avatar}
        image={
          <CMSImage
            styleImage={styles.image}
            styles={styles.avatar}
            source={user.avatar}
            domain={imgParams}
          />
        }
      />
    ) : null;

    return (
      <View style={styles.all}>
        <ScrollView style={[styles.container]}>
          <Ripple
            style={styles.headerRowContainer}
            rippleOpacity={0.87}
            onPress={this.toProfile}>
            <View style={[styles.infoProfile]}>
              <View>{avatar}</View>
              <View style={styles.userInfo}>
                <Text style={styles.userInfoText}>{user.firstName}</Text>
                <Text style={styles.userInfoSubText}>{user.email}</Text>
              </View>
            </View>
            <View style={[styles.iconArrowProfile]}>
              <IconCustom
                name="keyboard-right-arrow-button"
                size={16}
                color={CMSColors.RowOptions}
              />
            </View>
          </Ripple>
          <View style={styles.rowContainer} rippleOpacity={0.87}>
            <View style={styles.listRow}>
              {/* <View style={styles.listIcon}>
                <IconCustom
                  name="earth-grid-select-language-button"
                  size={20}
                  color={CMSColors.RowOptions}
                />
              </View> */}
              <View style={styles.domainContainer}>
                <Text style={styles.listTextDomainTitle}>Domain</Text>
                <Text style={styles.listTextDomain}>
                  {/* {this.state.domainName} */}
                  {this.props.userStore.domain}
                </Text>
              </View>
            </View>
          </View>
          <Ripple
            style={styles.rowContainer}
            rippleOpacity={0.87}
            onPress={this.toAbout}>
            <View style={styles.listRow}>
              {/* <View style={styles.listIcon}>
                <IconCustom
                  name="round-info-button"
                  size={20}
                  color={CMSColors.RowOptions}
                />
              </View> */}
              <Text style={styles.listText}>About</Text>

              <View style={styles.listEnterIcon}>
                <IconCustom
                  name="keyboard-right-arrow-button"
                  size={16}
                  color={CMSColors.RowOptions}
                />
              </View>
            </View>
          </Ripple>
          <Ripple
            style={styles.rowContainer}
            rippleOpacity={0.87}
            onPress={this.toNotify}>
            <View style={styles.listRow}>
              {/* <View style={styles.listIcon}>
                <IconCustom
                  name="notifications-button"
                  size={20}
                  color={CMSColors.RowOptions}
                />
              </View> */}
              <Text style={styles.listText}>Notification settings</Text>

              <View style={styles.listEnterIcon}>
                <IconCustom
                  name="keyboard-right-arrow-button"
                  size={16}
                  color={CMSColors.RowOptions}
                />
              </View>
            </View>
          </Ripple>
          <Ripple
            style={styles.rowContainer}
            rippleOpacity={0.87}
            onPress={this.toVideoSetting}>
            <View style={styles.listRow}>
              {/* <View style={styles.listIcon}>
                <IconCustom
                  name="icon-dvr"
                  size={20}
                  color={CMSColors.RowOptions}
                />
              </View> */}
              <Text style={styles.listText}>Video settings</Text>

              <View style={styles.listEnterIcon}>
                <IconCustom
                  name="keyboard-right-arrow-button"
                  size={16}
                  color={CMSColors.RowOptions}
                />
              </View>
            </View>
          </Ripple>
          <Ripple
            style={styles.rowContainer}
            rippleOpacity={0.87}
            onPress={this.onLogout}>
            <View style={styles.listRow}>
              {/* <View style={styles.listIcon}>
                <IconCustom
                  name="logout"
                  size={20}
                  color={CMSColors.RowOptions}
                />
              </View> */}
              <Text style={styles.listText}>Logout</Text>

              <View style={styles.listEnterIcon}>
                <IconCustom
                  name="keyboard-right-arrow-button"
                  size={16}
                  color={CMSColors.RowOptions}
                />
              </View>
            </View>
          </Ripple>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  all: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: CMSColors.White,
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
    marginLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconArrowProfile: {
    width: 30,
    height: 30,
    paddingTop: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: 5,
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#3c7ba4',
    marginRight: 5,
    borderRadius: 30,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    margin: 5,
    width: 30,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  domainContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  listText: {
    flex: 1,
    margin: 15,
    padding: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.ColorText,
  },
  listTextDomainTitle: {
    marginLeft: 15, //10,
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.ColorText,
  },
  listTextDomain: {
    marginLeft: 15, // 10,
    fontSize: 14,
    color: CMSColors.PrimaryColor,
  },
  listEnterIcon: {
    width: 30,
    height: 30,
    paddingTop: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  'posStore'
)(observer(SettingsView));
