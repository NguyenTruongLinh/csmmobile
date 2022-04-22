import React, {Component} from 'react';
import {StyleSheet, View, Text} from 'react-native';

import Button from '../controls/Button';
import InputTextIcon from '../controls/InputTextIcon';
import {normalize} from '../util/general';
import Ripple from 'react-native-material-ripple';
import {IconCustom} from '../CMSStyleSheet';

import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
//import Icon from 'react-native-vector-icons/FontAwesome';
//import { createIconSetFromFontello } from 'react-native-vector-icons';
//import fontelloConfig from './common/fontello/config.json';

import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';

const str_showpass = 'Show password';

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
      // showpasslable: ShowPassLabel ? ShowPassLabel : str_showpass,
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
    //<IConCustom name={checkedIcon} color={CMSColors.White} size={iconSize}/>
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

  // renderCheckbox = showpass => {
  //   let check_uncheck_Icon = this.checkedIcon(showpass);
  //   return (
  //     <View style={[styles.checkboxContainer]}>
  //       <Ripple
  //         style={[styles.checkboxRipple]}
  //         onPress={() => {
  //           this._refs['password'].blur();
  //           this.setState({showpass: !this.state.showpass});
  //         }}>
  //         <View style={{paddingRight: normalize(12)}}>
  //           {check_uncheck_Icon}
  //         </View>
  //         <Text style={[styles.checkboxLable]}>{this.state.showpasslable}</Text>
  //       </Ripple>
  //     </View>
  //   );
  // };

  render() {
    let {title} = this.props;
    let {showpass} = this.state;
    // let check_box = this.renderCheckbox(showpass);
    return (
      <View style={[styles.container, this.props.style]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{title}</Text>
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
            iconCustom="user-shape"
            label="User Name"
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
            iconCustom="locked-padlock"
            label="Password"
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
            style={styles.button}
            type="flat"
            onPress={() => {
              this.onCancel();
            }}
            backgroundColor={CMSColors.White}
            textColor={CMSColors.PrimaryColor}
            enable={true}
            caption={'CANCEL'}
          />
          <Button
            style={styles.button}
            type="flat"
            onPress={() => {
              this.onOK(this.state);
            }}
            backgroundColor={CMSColors.White}
            textColor={CMSColors.PrimaryColor}
            enable={this.state.isOK}
            caption={'LOGIN'}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: CMSColors.White,
    paddingLeft: normalize(24),
    paddingTop: normalize(20),
    paddingBottom: normalize(8),
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginRight: normalize(24),
    marginBottom: normalize(8),
  },
  headerText: {
    fontSize: normalize(20),
    color: CMSColors.PrimaryText,
  },
  body: {
    flex: 1,
    alignItems: 'flex-start',
    flexDirection: 'column',
    marginRight: normalize(24),
    marginBottom: normalize(8),
  },
  footer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    marginRight: normalize(8),
  },
  checkboxContainer: {
    paddingLeft: normalize(18 + 12), //18 for icon font 12 for padding
    flexDirection: 'row',
  },
  checkboxRipple: {
    flexDirection: 'row',
  },
  checkedboxIcon: {
    borderColor: CMSColors.PrimaryColor,
    backgroundColor: CMSColors.PrimaryColor,
    flex: 1,
  },
  checkboxIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: normalize(22),
    height: normalize(22),
    borderRadius: 2,
    borderWidth: 2,
    borderColor: 'rgba(01,01,01,0.54)',
  },
  checkboxLable: {
    fontSize: normalize(16),
    color: CMSColors.PrimaryText,
  },
  button: {
    padding: 10,
  },
});

export default inject('videoStore')(observer(AuthenModal));
