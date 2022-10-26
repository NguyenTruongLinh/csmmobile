import React from 'react';
import {View, StatusBar, ActivityIndicator} from 'react-native';

import {inject, observer} from 'mobx-react';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';

import {profileConstraints} from '../../util/constraints.js';

import InputText from '../../components/controls/InputText';
import Button from '../../components/controls/Button';
import CMSImage from '../../components/containers/CMSImage';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';

import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import theme from '../../styles/appearance.js';
import styles from './styles/profileStyles';

import {Account} from '../../consts/apiRoutes';
import {Settings as SettingTxt} from '../../localization/texts';

class ProfileView extends React.Component {
  constructor(props) {
    super(props);
    this.updateProfile = this.updateProfile.bind(this);
    this.onTextChanged = this.onTextChanged.bind(this);

    const {user} = props.userStore;

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
    const {user} = this.props.userStore;
    const {appearance} = this.props.appStore;

    let AvatarUser;
    if (user) {
      AvatarUser = (
        <CMSTouchableIcon
          disabled
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

    const spninner =
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

    return (
      <View
        style={[commonStyles.rowsViewContainer, theme[appearance].container]}>
        <StatusBar
          translucent={false}
          backgroundColor={CMSColors.Dark_Blue}
          barStyle="light-content"
        />
        <View style={styles.container}>
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
                enablesReturnKeyAutomatically
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
                enablesReturnKeyAutomatically
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
                enablesReturnKeyAutomatically
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

export default inject('userStore', 'appStore')(observer(ProfileView));
