// ----------------------------------------------------
// <!-- START CONST -->
//const PATH_ACTIONS = "../../actions";
//const PATH_VIEW = "../../actions";

// <!-- END CONST -->
// ----------------------------------------------------

// ----------------------------------------------------
// <!-- START MODULES -->
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableHighlight,
  Image,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  findNodeHandle,
} from 'react-native';
import {createIconSetFromFontello} from 'react-native-vector-icons';
import fontelloConfig from '../../components/common/fontello/config.json';
import validatejs from 'validate.js';
import {Domain} from '../../consts/misc';

const IconCustom = createIconSetFromFontello(fontelloConfig);
const launchscreenBg = require('../../components/common/img/BG.png');
const launchscreenBgloading = require('../../components/common/img/BG-loading.png');
const launchscreenLogo = require('../../components/common/img/CMS-logo-white.png');

const validators = validatejs.validators;
// <!-- END CONSTS -->
// ----------------------------------------------------

class LoginView extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('LoginView componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('LoginView componentWillUnmount');
  }

  render() {
    return (
      <View style={{flex: 1}}>
        {/* <View style={styles.imagebgContainer}>
          <Image source={imageBG} style={[styles.imagebg]} />
        </View>
        <KeyboardAwareScrollView
          scrollEnabled
          ref={ref => {
            this.scroll = ref;
          }}
          enableAutomaticScroll={true}
          contentContainerStyle={styles.scrollViewContainer}>
          <View style={[styles.all, styles.content, styles.centerContent]}>
            {this.state.isShowSpinner ? (
              <View style={styles.spinner}>
                <ActivityIndicator
                  animating={this.state.animating}
                  style={[styles_cmp.ActivityIndicator_centering]}
                  size="large"
                  color={CMSColors.ActivityIndicator_color_Login}
                />
              </View>
            ) : (
              <View style={styles.centerContent}>
                <View style={{alignItems: 'center'}}>
                  <Image
                    source={launchscreenLogo}
                    style={{width: 150, height: 150}}
                    resizeMode="contain"
                  />

                  <InputTextIcon
                    ref="domainname"
                    name="domainname"
                    value={this.state.domainname}
                    maxLength={60}
                    enablesReturnKeyAutomatically={true}
                    onEndEditing={this.onEndEditing}
                    onChangeText={this.onChangeText_Domain.bind(this)}
                    onSubmitEditing={this.onSubmitDomain.bind(this)}
                    onBlur={this.onBlur}
                    returnKeyType="next"
                    iconCustom="earth-grid-select-language-button"
                    label="Domain"
                    autoCapitalize={'none'}
                    autoCorrect={false}
                    tintColor={CMSColors.White}
                    textColor={CMSColors.White}
                    baseColor={CMSColors.White}
                    //placeholder="http://domainname.com"
                    error={errors.domainname}
                    disabled={false}
                    secureTextEntry={false}
                  />

                  <InputTextIcon
                    ref="username"
                    name="username"
                    maxLength={60}
                    value={this.state.username}
                    autoCorrect={false}
                    enablesReturnKeyAutomatically={true}
                    onEndEditing={this.onEndEditing}
                    onFocus={event => {
                      this.onFocus(event);
                    }}
                    onChangeText={this.onChangeText.bind(this)}
                    onSubmitEditing={this.onSubmitUserName.bind(this)}
                    returnKeyType="next"
                    autoCapitalize={'none'}
                    iconCustom="user-shape"
                    label="User Name"
                    placeholder=""
                    error={errors.username}
                    disabled={false}
                    tintColor={CMSColors.White}
                    textColor={CMSColors.White}
                    baseColor={CMSColors.White}
                    secureTextEntry={false}
                  />

                  <InputTextIcon
                    ref="password"
                    name="password"
                    maxLength={60}
                    autoCapitalize={'none'}
                    value={this.state.password}
                    autoCorrect={false}
                    enablesReturnKeyAutomatically={true}
                    onEndEditing={this.onEndEditing}
                    onFocus={event => {
                      this.onFocus(event);
                    }}
                    onSubmitEditing={this.onSubmitPassword.bind(this)}
                    returnKeyType="next"
                    iconCustom="locked-padlock"
                    label="Password"
                    placeholder=""
                    error={errors.password}
                    disabled={false}
                    tintColor={CMSColors.White}
                    textColor={CMSColors.White}
                    baseColor={CMSColors.White}
                    secureTextEntry={true}
                  />
                </View>
                <View
                  style={{
                    paddingTop: 20,
                    alignItems: 'center',
                    flexDirection: 'row',
                  }}>
                  <Button
                    ref="button"
                    style={styles.button}
                    caption="LOGIN"
                    type="primary"
                    styleCaption={styles.styleCaption}
                    backgroundColor={CMSColors.White}
                    onPress={this.onSubmitPressed.bind(this)}
                    enable={this.state.isdisable ? false : true}
                  />
                </View>
              </View>
            )}
            
          </View>
        </KeyboardAwareScrollView> */}
      </View>
    );
  }
}

export default LoginView;
