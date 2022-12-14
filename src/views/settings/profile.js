import React from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import Ripple from 'react-native-material-ripple';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';

import {profileConstraints} from '../../util/constraints.js';

import InputText from '../../components/controls/InputText';
import Button from '../../components/controls/Button';
import CMSImage from '../../components/containers/CMSImage';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';

import {Account} from '../../consts/apiRoutes';
import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import {Settings as SettingTxt, ActionMessages} from '../../localization/texts';
import variables from '../../styles/variables';

// const img_header = require('../../assets/images/common/profile_header.jpg');

const Fields = {
  firstname: 'firstName',
  lastname: 'lastName',
  email: 'email',
};

class ProfileView extends React.Component {
  constructor(props) {
    super(props);
    this.updateProfile = this.updateProfile.bind(this);
    this.onTextChanged = this.onTextChanged.bind(this);

    const user = props.userStore.user;

    this.state = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      photo: user.avatar,
      showSpinner: false,
      firstNameError: null,
      lastNameError: null,
      emailError: null,
    };

    this._refs = {
      firstName: null,
      lastName: null,
      email: null,
    };
  }

  componentDidMount() {
    // __DEV__ && console.log('GOND profile navi = ', this.props.navigation);

    this.refreshSaveButton();
  }

  // onBack = () => {
  //   naviService.back();
  // };

  async updateProfile() {
    this.setState({showSpinner: true});
    const {firstName, lastName, email} = this.state;

    await this.props.userStore.updateProfile({firstName, lastName, email});
    this.setState({showSpinner: false});
  }

  buildUserImageParams() {
    return {
      controller: Account.controller,
      action: Account.avatar,
      id: this.props.userStore.user.userId,
    };
  }

  compareInputNewData() {
    const {user} = this.props.userStore;
    // console.log(
    //   'GOND state: {',
    //   this.state.firstName,
    //   this.state.lastName,
    //   this.state.email,
    //   '} , user: {',
    //   user.firstName,
    //   user.lastName,
    //   user.email,
    //   '}'
    // );
    if (
      this.state.firstName != user.firstName ||
      this.state.lastName != user.lastName ||
      this.state.email != user.email
    ) {
      return false;
    }
    return true;
  }

  isInputsValid() {
    // console.log('GOND isInputsValid: ', this._refs.firstName);
    return (
      this._refs.firstName &&
      this._refs.lastName &&
      this._refs.email &&
      this._refs.firstName.isValid() &&
      this._refs.lastName.isValid() &&
      this._refs.email.isValid()
    );
  }

  onTextChanged(field, value) {
    if (field == 'firstName') {
      this.setState({firstName: value});
    } else if (field == 'lastName') {
      this.setState({lastName: value});
    } else if (field == 'email') {
      this.setState({email: value});
    }
    setTimeout(() => {
      this.refreshSaveButton();
    }, 200);
  }

  refreshSaveButton() {
    this.props.navigation.setOptions({
      headerRight: () => (
        <Button
          style={commonStyles.buttonSave}
          caption={SettingTxt.save}
          enable={this.isInputsValid() && !this.compareInputNewData()}
          onPress={this.updateProfile}
          styleCaption={commonStyles.buttonSaveText}
          type="flat"
        />
      ),
    });
  }

  render() {
    let {user} = this.props.userStore;
    let AvatarUser;
    if (user) {
      AvatarUser = (
        <CMSTouchableIcon
          disabled={true}
          size={30}
          styles={styles.avatar}
          image={
            <CMSImage
              id={user.avatar.slice(-20)}
              Services={this.props.Services}
              styleImage={styles.image}
              styles={styles.avatar}
              src={user.avatar}
              domain={this.buildUserImageParams()}
            />
          }
        />
      );
    }

    let spninner =
      this.state.showSpinner == true ? (
        <View style={styles.spinner}>
          <ActivityIndicator
            animating={this.state.animating}
            style={commonStyles.spinnerCenter}
            size="large"
            color={CMSColors.SpinnerColor}
          />
        </View>
      ) : null;

    let statusbar =
      Platform.OS == 'ios' ? <View style={styles.statusBar}></View> : null;

    return (
      <View style={commonStyles.rowsViewContainer}>
        <StatusBar
          translucent={false}
          backgroundColor={CMSColors.Dark_Blue}
          barStyle="light-content"
        />
        <View style={styles.container}>
          {/* {statusbar} */}
          {spninner}
          <View style={styles.rowHeaderContainer}>
            <View>{AvatarUser}</View>
          </View>
          <KeyboardAwareScrollView>
            <View style={styles.control}>
              <InputText
                ref={r => (this._refs.firstName = r)}
                value={this.state.firstName}
                fontSize={16}
                autoCorrect={false}
                enablesReturnKeyAutomatically={true}
                maxLength={20}
                onChangeText={text => this.onTextChanged('firstName', text)}
                returnKeyType="next"
                label="First Name"
                disabled={this.state.showSpinner}
                error={this.state.firstNameError}
                validation={{firstName: profileConstraints.firstName}}
              />
            </View>
            <View style={styles.control}>
              <InputText
                ref={r => (this._refs.lastName = r)}
                maxLength={20}
                fontSize={16}
                value={this.state.lastName}
                onChangeText={text => this.onTextChanged('lastName', text)}
                autoCorrect={false}
                enablesReturnKeyAutomatically={true}
                returnKeyType="next"
                label="Last Name"
                disabled={this.state.showSpinner}
                error={this.state.lastNameError}
                validation={{lastName: profileConstraints.lastName}}
              />
            </View>
            <View style={styles.control}>
              <InputText
                ref={r => (this._refs.email = r)}
                maxLength={50}
                fontSize={16}
                value={this.state.email}
                onChangeText={text => this.onTextChanged('email', text)}
                autoCorrect={false}
                enablesReturnKeyAutomatically={true}
                returnKeyType="next"
                label="Email"
                disabled={this.state.showSpinner}
                error={this.state.emailError}
                validation={{email: profileConstraints.email}}
              />
            </View>
          </KeyboardAwareScrollView>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: null,
    height: null,
  },
  rowHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    height: 120,
  },
  avatar: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#3c7ba4',
    marginRight: 5,
    borderRadius: 50,
  },
  image: {
    top: 1,
    left: 1,
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  control: {
    marginLeft: 24,
    marginRight: 24,
  },
  statusBar: {
    height: variables.isPhoneX ? 44 : 20,
    backgroundColor: CMSColors.White, // CMSColors.Dark_Blue,
  },
  navbarBody: {
    backgroundColor: CMSColors.Dark_Blue,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowOffset: {
          height: 0,
          width: 0,
        },
      },
      android: {
        elevation: 1,
      },
    }),
  },
  navbar: {
    backgroundColor: CMSColors.White,
    ...Platform.select({
      ios: {
        //height: 64,
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowOffset: {
          height: 0,
          width: 0,
        },
      },
      android: {
        //height: 50,
        elevation: 1,
      },
    }),
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    //borderTopWidth: 5,
    //borderTopColor: '#828287',
    //borderBottomWidth: 0.5,
    borderBottomColor: '#828287',
    borderTopWidth: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  left: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginLeft: 10,
    marginTop: 2,
    alignItems: 'center',
  },
  icon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  contentIcon: {
    paddingTop: 2,
  },
  title: {
    marginLeft: 5,
  },
  // buttonSave: {
  //   marginRight: 12,
  //   backgroundColor: CMSColors.Transparent,
  //   height: 20,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  spinner: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    height: 50,
  },
});

export default inject('userStore')(observer(ProfileView));
