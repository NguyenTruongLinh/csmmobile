import React, {Component} from 'react';
import {View, Text, Image, StyleSheet, Linking, StatusBar} from 'react-native';

import Ripple from 'react-native-material-ripple';

import CMSStyleSheet from '../../components/CMSStyleSheet';
const IconCustom = CMSStyleSheet.IconCustom;
import APP_INFO from '../../consts/appInfo';

import variable from '../../styles/variables';
// import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import {CMS_Logo} from '../../consts/images';

class AboutView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: 'ABOUT',
    };
  }

  onOpenPolicies() {
    let url = 'https://i3international.com/company-policies';
    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          console.log("Can't handle url: " + url);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(err => console.error('An error occurred', err));
  }

  onOpenPrivacyPolicy() {
    let url = 'https://i3international.com/privacy-policy';
    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          console.log("Can't handle url: " + url);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(err => console.error('An error occurred', err));
  }

  render() {
    // let statusbar = Platform.OS == 'ios' ?  (
    //   <View style={styles.statusbarios}></View>
    // ) : null;

    return (
      <View style={styles.viewContainer}>
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
                <CMSAvatars
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
            <Text style={styles.textName}>{APP_INFO.Title}</Text>
          </View>
          <View style={styles.infos}>
            <Text style={styles.textInfo}>{APP_INFO.Name}</Text>
            <Text style={styles.textInfo}>
              Build : {APP_INFO.BuiltDate} - {APP_INFO.Version}
            </Text>
            <Text style={styles.textInfo}>{APP_INFO.CopyRight}</Text>
          </View>
        </View>
        <View style={styles.secondContainer}>
          <Ripple
            style={styles.containerRow}
            rippleOpacity={0.87}
            onPress={this.onOpenPolicies.bind(this)}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <IconCustom
                  name="polocies"
                  size={20}
                  color={CMSColors.colorRow_options}
                />
              </View>

              <Text style={styles.rowText}>Policies</Text>
              <View style={styles.rowIconEnd}>
                <IconCustom
                  name="keyboard-right-arrow-button"
                  size={16}
                  color={CMSColors.colorRow_options}
                />
              </View>
            </View>
          </Ripple>
          <Ripple
            style={styles.containerRow}
            rippleOpacity={0.87}
            onPress={this.onOpenPrivacyPolicy.bind(this)}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <IconCustom
                  name="polocies"
                  size={20}
                  color={CMSColors.colorRow_options}
                />
              </View>

              <Text style={styles.rowText}>Privacy policies</Text>
              <View style={styles.rowIconEnd}>
                <IconCustom
                  name="keyboard-right-arrow-button"
                  size={16}
                  color={CMSColors.colorRow_options}
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
    backgroundColor: CMSColors.White,
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
    borderWidth: 1,
    borderColor: 'rgb(204, 204, 204)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIcon: {
    margin: 5,
    width: 30,
    height: 30,
    //fontSize: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 5,
  },
  rowText: {
    flex: 1,
    margin: 5,
    padding: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.colorText,
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

export default AboutView;
