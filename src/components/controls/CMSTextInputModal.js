import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';

import AuthenModal from '../common/AuthenModal';
import InputText from './InputText';
import Button from './Button';
import {normalize} from '../../util/general';

import CMSColors from '../../styles/cmscolors';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';

class CMSTextInputModal extends React.Component {
  static defaultProps = {
    title: '',
    placeHolder: undefined,
    savePreviousText: false,
    onSubmit: text => console.log('GOND CMSTextInputModal onSubmit: ', text),
    onCancel: () => console.log('GOND CMSTextInputModal onCancel'),
  };

  constructor(props) {
    super(props);

    this.state = {
      textInput: '',
      isInputFocus: false,
      keyboardHeight: 0,
    };
    this.inputRef = null;
  }

  componentDidMount() {
    __DEV__ && console.log('CMSTextInputModal componentDidMount');
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this._keyboardDidShow.bind(this)
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this._keyboardDidHide.bind(this)
    );
  }

  componentWillUnmount() {
    __DEV__ && console.log('CMSTextInputModal componentWillUnmount');
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  _keyboardDidShow(e) {
    this.setState({
      isInputFocus: true,
      keyboardHeight: e.endCoordinates.height,
    });
  }

  _keyboardDidHide() {
    this.setState({isInputFocus: false});
  }

  onSubmit = () => {
    const {onSubmit, savePreviousText} = this.props;
    const {textInput} = this.state;

    if (onSubmit && typeof onSubmit == 'function') {
      onSubmit(textInput);
      if (!savePreviousText) this.setState({textInput: ''});
    } else {
      console.log('GOND CMSTextInputModal onSubmit no handler function found!');
    }
  };

  onCancel = () => {
    const {onCancel, savePreviousText} = this.props;

    if (onCancel && typeof onCancel == 'function') {
      onCancel();
      if (!savePreviousText) this.setState({textInput: ''});
    } else {
      console.log('GOND CMSTextInputModal onCancel no handler function found!');
    }
  };

  onTextChanged = text => {
    this.setState({textInput: text});
  };

  render() {
    const {isVisible, placeHolder, title, label} = this.props;
    const {textInput /*, focused*/} = this.state;
    const {height} = Dimensions.get('window');

    return (
      // <KeyboardAwareScrollView
      //   contentContainerStyle={{flex: 1}}
      //   enableOnAndroid={true}>
      // <KeyboardAvoidingView style={{flex: 1}} enabled>
      //   <ScrollView scrollEnabled={false} keyboardShouldPersistTaps="handled">
      <Modal
        isVisible={isVisible}
        onBackdropPress={this.onCancel}
        onBackButtonPress={this.onCancel}
        backdropOpacity={0.1}
        style={[
          styles.modalcontainer,
          {
            marginTop:
              height -
              (this.state.isInputFocus ? this.state.keyboardHeight + 333 : 333),
          },
        ]}>
        <View style={[styles.modalView]}>
          {title.length > 0 && (
            <View
              style={[
                styles.header,
                // Platform.OS == 'ios' ? {height: 80} : {flex: 2},
              ]}>
              <Text style={styles.headerText}>{title}</Text>
            </View>
          )}
          <View
            style={[
              styles.body,
              Platform.OS == 'ios'
                ? {paddingBottom: 100, justifyContent: 'flex-start'}
                : {},
            ]}>
            <InputText
              ref={r => (this.inputRef = r)}
              value={textInput}
              fontSize={16}
              autoCorrect={false}
              // underlineColorAndroid={CMSColors.Transparent}
              enablesReturnKeyAutomatically={true}
              multiline={true}
              allowFontScaling={true}
              numberOfLines={5}
              maxLength={250}
              onChangeText={this.onTextChanged}
              label={label}
              placeHolder={placeHolder}
              style={styles.textInput}
              // onFocus={() => this.setState({focused: true})}
              // onBlur={() => this.setState({focused: false})}
            />
          </View>
          <View
            style={[
              styles.footer,
              Platform.OS == 'ios'
                ? {position: 'absolute', top: 333 - 100, left: 8}
                : {},
            ]}>
            <Button
              style={styles.button}
              type="flat"
              onPress={this.onCancel}
              // backgroundColor={CMSColors.White}
              enable={true}
              caption="CANCEL"
            />
            <Button
              style={[styles.button, styles.buttonSave]}
              type="flat"
              onPress={this.onSubmit}
              // backgroundColor={CMSColors.White}
              captionStyle={{color: CMSColors.White}}
              enable={true} // {textInput.length > 0}
              caption="SAVE"
            />
          </View>
        </View>
      </Modal>
      // </ScrollView>
      // </KeyboardAvoidingView>
      // </KeyboardAwareScrollView>
    );
  }
}

const styles = StyleSheet.create({
  modalView: {
    // width: 350,
    // height: 280,
    flex: 1,
    width: '100%',
    flexDirection: 'column',
    backgroundColor: CMSColors.White,
    paddingLeft: normalize(8),
    paddingRight: normalize(8),
    // paddingTop: normalize(20),
    paddingBottom: normalize(8),
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalcontainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: CMSColors.PrimaryColor54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 280,
    marginLeft: 0,
    marginRight: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  header: {
    height: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
    // borderColor: 'red',
    // borderWidth: 1,
    // marginLeft: normalize(21),
    // marginBottom: normalize(7),
  },
  headerText: {
    fontSize: normalize(20),
    fontWeight: '700',
    textAlign: 'center',
    color: CMSColors.PrimaryText,
  },
  body: {
    flex: 5,
    flexDirection: 'column',
    // padding: 10,
    marginHorizontal: normalize(10),
    // marginBottom: normalize(8),
    marginTop: 10,
    // borderColor: 'red',
    // borderWidth: 1,
  },
  footer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 50,
    // borderColor: 'red',
    // borderWidth: 1,
  },
  textInput: {
    width: '100%',
    // height: 140,
    // borderWidth: 2,
    // borderColor: '#eee',
    // borderRadius: 4,
    // textAlignVertical: 'top',
    padding: 10,
    fontSize: 14,
    // ...Platform.select({
    //   ios: {left: 1, top: -1},
    //   android: {textAlignVertical: 'top'},
    // }),
  },
  button: {
    height: 50,
    flex: 1,
    justifyContent: 'center',
    borderColor: CMSColors.PrimaryActive,
    borderWidth: 1,
    marginRight: 5,
    marginLeft: 10,
  },
  buttonSave: {
    backgroundColor: CMSColors.PrimaryActive,
    marginRight: 10,
    marginLeft: 5,
  },
});

export default CMSTextInputModal;
