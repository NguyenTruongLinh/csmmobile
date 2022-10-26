import React, {Component} from 'react';
import {StyleSheet, View, Text} from 'react-native';

import {reaction} from 'mobx';
import {inject, observer} from 'mobx-react';

import Button from '../controls/Button';
import InputTextIcon from '../controls/InputTextIcon';
import {IconCustom} from '../CMSStyleSheet';

import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import theme from '../../styles/appearance';
import styles from './styles/authenModalStyles';

class AuthenModal extends Component {
  constructor(props) {
    super(props);
    let {username, password, showpass, ShowPassLabel} = props;

    let isok = this.checkData({username, password});
    this.state = {
      isOK: isok,
      showpass: showpass,
      username: username ?? '',
      password: password ?? '',
    };

    this._refs = {};
  }

  componentDidMount() {
    this.initReactions();
  }

  initReactions = () => {
    const {videoStore} = this.props;
    this.reactions = [
      reaction(
        () => videoStore.showAuthenModal,
        showAuthenModal => {
          if (showAuthenModal) {
            this._refs.password && this._refs.password.clear();
            if (this._refs.username) {
              this._refs.username.clear();
              this._refs.username.focus();
            }
          }
        }
      ),
    ];
  };

  checkData = ({username, password}) => {
    if (username && password && username.length > 0 && password.length > 0)
      return true;
    return false;
  };

  onOK = ({username, password}) => {
    if (this.props.onOK)
      this.props.onOK({username: username, password: password});
  };

  onCancel = () => {
    if (this.props.onCancel) this.props.onCancel();
  };

  onSubmitEditing = () => {
    let focus = false;
    for (let key in this._refs) {
      let ref = this._refs[key];
      if (focus) {
        ref.focus();
        break;
      }
      if (ref && ref.isFocused && ref.isFocused()) focus = true;
    }
  };

  onChangeText = text => {
    let tmp = {};
    let last_key = '';
    for (let key in this._refs) {
      let ref = this._refs[key];
      tmp[key] = this.state[key];
      if (ref && ref.isFocused && ref.isFocused()) {
        tmp[key] = text;
        last_key = key;
      }
    }
    let isok = this.checkData(tmp);
    this.setState({[last_key]: text, isOK: isok});
  };

  checkedIcon = checked => {
    if (checked === true) {
      return (
        <View style={[styles.checkboxIcon, styles.checkedboxIcon]}>
          <IconCustom
            name={'check-symbol'}
            color={CMSColors.White}
            size={variables.fix_fontSire}
          />
        </View>
      );
    } else {
      return (
        <View
          style={[
            styles.checkboxIcon,
            {backgroundColor: CMSColors.White},
          ]}></View>
      );
    }
  };

  render() {
    let {title, appStore} = this.props;
    let {showpass} = this.state;
    const {appearance} = appStore;
    // let check_box = this.renderCheckbox(showpass);
    return (
      <View style={[styles.container, this.props.style]}>
        <View style={styles.header}>
          <Text style={[styles.headerText, theme[appearance].text]}>
            {title}
          </Text>
        </View>
        <View style={[styles.body]}>
          <InputTextIcon
            ref={r => (this._refs.username = r)}
            value={this.state.username}
            autoCorrect={false}
            enablesReturnKeyAutomatically={true}
            //onFocus={this.onFocus.bind(this)}
            onSubmitEditing={this.onSubmitEditing}
            onChangeText={this.onChangeText}
            returnKeyType="next"
            label="Username *"
            placeholder=""
            disabled={false}
            secureTextEntry={false}
            iconColor={CMSColors.InputIconColor}
          />
          <InputTextIcon
            ref={r => (this._refs.password = r)}
            value={this.state.password}
            autoCorrect={false}
            enablesReturnKeyAutomatically={true}
            onFocus={this.onFocus}
            onChangeText={this.onChangeText}
            returnKeyType="next"
            label="Password *"
            placeholder=""
            disabled={false}
            secureTextEntry={!showpass}
            limit={32}
            revealable={true}
            iconColor={CMSColors.InputIconColor}
          />
          {/* {check_box} */}
        </View>
        <View style={[styles.footer]}>
          <Button
            style={[styles.button, styles.cancelButton]}
            type="primary"
            onPress={() => {
              this.onCancel();
            }}
            backgroundColor={CMSColors.Transparent}
            textColor={CMSColors.PrimaryColor}
            enable={true}
            caption={'CANCEL'}
            captionStyle={styles.cancelButtonText}
          />
          <Button
            style={styles.button}
            type="primary"
            onPress={() => {
              this.onOK(this.state);
            }}
            textColor={CMSColors.PrimaryColor}
            enable={this.state.isOK}
            caption={'LOGIN'}
            captionStyle={styles.buttonText}
          />
        </View>
      </View>
    );
  }
}

export default inject('videoStore', 'appStore')(observer(AuthenModal));
