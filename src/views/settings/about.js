import React, {Component} from 'react';
import {View, Text, Image, StyleSheet, Linking, StatusBar} from 'react-native';

import Ripple from 'react-native-material-ripple';
import {inject, observer} from 'mobx-react';

import CMSStyleSheet from '../../components/CMSStyleSheet';
import APP_INFO from '../../consts/appInfo';

import variable from '../../styles/variables';
// import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import {CMS_Logo} from '../../consts/images';

const {IconCustom} = CMSStyleSheet;

class AboutView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: 'ABOUT',
    };
  }

  onOpenPolicies() {
    // let url = 'https://i3international.com/company-policies';
    Linking.canOpenURL(APP_INFO.PoliciesUrl)
      .then(supported => {
        if (!supported) {
          console.log(`Can't handle url: ${APP_INFO.PoliciesUrl}`);
        } else {
          return Linking.openURL(APP_INFO.PoliciesUrl);
        }
      })
      .catch(err => console.error('An error occurred', err));
  }

  onOpenPrivacyPolicy() {
    // let url = 'https://i3international.com/privacy-policy';
    Linking.canOpenURL(APP_INFO.PrivacyPolicyUrl)
      .then(supported => {
        if (!supported) {
          console.log(`Can't handle url: ${APP_INFO.PrivacyPolicyUrl}`);
        } else {
          return Linking.openURL(APP_INFO.PrivacyPolicyUrl);
        }
      })
      .catch(err => console.error('An error occurred', err));
  }

  render() {
    const {appearance} = this.props.appStore;
    // let statusbar = Platform.OS == 'ios' ?  (
    //   <View style={styles.statusbarios}></View>
    // ) : null;

    return (
      <View style={[styles.viewContainer, theme[appearance].container]}>
        {/* <StatusBar
          translucent={false}
          backgroundColor={CMSColors.Dark_Blue}
          barStyle="light-content" />
        {statusbar} */}
        {/* <View style={styles.navbar_body}>
          <View style={styles.navbar}>
            <Ripple
              rippleCentered={true}
              style={styles.left}
              onPress={this.onBack.bind(this)}>
              <View style={styles.icon}>
                <CMSTouchableIcon
                  size={20}
                  color={CMSColors.SecondaryText}
                  styles={styles.contentIcon}
                  iconCustom='keyboard-left-arrow-button' />
              </View>
              <View style={styles.title}>
                <Text>{this.state.title}</Text>
              </View>
            </Ripple>
            <View>

            </View>
          </View>
        </View> */}

        <View style={styles.firstContainer}>
          <View style={styles.imageLogo}>
            <Image
              source={CMS_Logo}
              style={styles.logoSize}
              resizeMode="contain"
            />
          </View>
          <View style={styles.name}>
            <Text style={[styles.textName, theme[appearance].text]}>
              {APP_INFO.Title}
            </Text>
          </View>
          <View style={styles.infos}>
            <Text style={[styles.textInfo, theme[appearance].text]}>
              {APP_INFO.Name}
            </Text>
            <Text style={[styles.textInfo, theme[appearance].text]}>
              Build : {APP_INFO.BuiltDate} - {APP_INFO.Version}
            </Text>
            <Text style={[styles.textInfo, theme[appearance].text]}>
              {APP_INFO.CopyRight}
            </Text>
          </View>
        </View>
        <View style={styles.secondContainer}>
          <Ripple
            style={[
              styles.containerRow,
              theme[appearance].borderColor,
              {borderTopWidth: 1},
            ]}
            rippleOpacity={0.87}
            onPress={this.onOpenPolicies.bind(this)}>
            <View style={styles.row}>
              <Text style={[styles.rowText, theme[appearance].text]}>
                Policies
              </Text>
              <View style={styles.rowIconEnd}>
                <IconCustom
                  name="keyboard-right-arrow-button"
                  size={16}
                  color={theme[appearance].iconColor}
                />
              </View>
            </View>
          </Ripple>
          <Ripple
            style={[styles.containerRow, theme[appearance].borderColor]}
            rippleOpacity={0.87}
            onPress={this.onOpenPrivacyPolicy.bind(this)}>
            <View style={styles.row}>
              <Text style={[styles.rowText, theme[appearance].text]}>
                Privacy policy
              </Text>
              <View style={styles.rowIconEnd}>
                <IconCustom
                  name="keyboard-right-arrow-button"
                  size={16}
                  color={theme[appearance].iconColor}
                />
              </View>
            </View>
          </Ripple>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
  },
  firstContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLogo: {},
  logoSize: {
    width: variable.width_logo_image,
    height: variable.height_logo_image,
    tintColor: CMSColors.PrimaryColor,
  },
  name: {
    marginTop: 5,
  },
  textName: {
    color: CMSColors.Dark_Gray_2,
    fontSize: 20,
  },
  infos: {
    alignItems: 'center',
    marginTop: 10,
  },
  textInfo: {
    color: CMSColors.Dark_Gray,
    fontSize: 14,
  },
  secondContainer: {
    flex: 1,
  },
  containerRow: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 70,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIcon: {
    width: 30,
    height: 30,
    // fontSize: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 5,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.ColorText,
  },
  rowIconEnd: {
    width: 30,
    height: 30,
    paddingTop: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // statusbarios: {
  //   height: variable.isPhoneX ? 44 : 20,
  //   backgroundColor: CMSColors.Dark_Blue,
  // },
});

export default inject('appStore')(observer(AboutView));
