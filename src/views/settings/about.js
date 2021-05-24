import React, {Component} from 'react';
import {View, Text, Image, Platform, Linking, StatusBar} from 'react-native';

class AboutView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: 'ABOUT',
    };
    this.onBack.bind(this);
  }

  onOpenPolocies() {
    let url = 'http://i3international.com/company-policies';
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

  onOpenPrivatePolicy() {
    let url = 'http://i3international.com/privacy-policy';
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
      <View />
      /*<View style={styles.all}>
        <StatusBar
          translucent={false}
          backgroundColor={CMSColors.Dark_Blue}
          barStyle="light-content" />
        {statusbar}
        <View style={styles.navbar_body}>
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
        </View>

        <View style={styles.firstContainer}>
          <View style={styles.imageLogo}>
            <Image  source={img_logo}
              style={styles.size_launchscreenLogo}
              resizeMode='contain'/>
          </View>
          <View style={styles.Name}>
            <Text style={styles.textName}>{APP_INFO.Title}</Text>
          </View>
          <View style={styles.Infos}>
            <Text style={styles.textInfo}>{APP_INFO.Name}</Text>
            <Text style={styles.textInfo}>Build : {APP_INFO.BuiltDate} - {APP_INFO.Version}</Text>
            <Text style={styles.textInfo}>{APP_INFO.CopyRight}</Text>
          </View>
        </View>
        <View style={styles.secondContainer}>
          <Ripple
            style={styles.container_row}
            rippleOpacity={0.87}
            onPress={this.onOpenPolocies.bind(this)}>
            <View style={styles.row}>
              <View style={styles.row_icon}>
                <IconCustom name="polocies" size={20} color={CMSColors.colorRow_options} />
              </View>

              <Text style={styles.row_text}>
                            Policies
              </Text>
              <View style={styles.row_icon_end}>
                <IconCustom  name="keyboard-right-arrow-button" size={16} color={CMSColors.colorRow_options} />
              </View>

            </View>
          </Ripple>
          <Ripple
            style={styles.container_row}
            rippleOpacity={0.87}
            onPress={this.onOpenPrivatePolicy.bind(this)}>
            <View style={styles.row}>
              <View style={styles.row_icon}>
                <IconCustom name="polocies" size={20} color={CMSColors.colorRow_options} />
              </View>

              <Text style={styles.row_text}>
                          Privacy policies
              </Text>
              <View style={styles.row_icon_end}>
                <IconCustom  name="keyboard-right-arrow-button" size={16} color={CMSColors.colorRow_options} />
              </View>

            </View>
          </Ripple>
        </View>
      </View>*/
    );
  }
}

export default AboutView;
