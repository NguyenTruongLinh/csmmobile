import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
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
    onSubmit: text => console.log('GOND CMSTextInputModal onSubmit: ', text),
    onCancel: () => console.log('GOND CMSTextInputModal onCancel'),
  };

  constructor(props) {
    super(props);

    this.state = {
      textInput: '',
      focused: false,
    };
  }

  onSubmit = () => {
    const {onSubmit} = this.props;
    const {textInput} = this.state;

    if (onSubmit && typeof onSubmit == 'function') {
      onSubmit(textInput);
    } else {
      console.log('GOND CMSTextInputModal onSubmit no handler function found!');
    }
  };

  onCancel = () => {
    const {onCancel} = this.props;

    if (onCancel && typeof onCancel == 'function') {
      onCancel();
    } else {
      console.log('GOND CMSTextInputModal onCancel no handler function found!');
    }
  };

  onTextChanged = text => {
    this.setState({textInput: text});
  };

  render() {
    const {isVisible, placeHolder, title, label} = this.props;
    const {textInput, focused} = this.state;
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
          {marginTop: height - (focused ? 650 : 283)},
        ]}>
        <View style={[styles.modalView]}>
          {title.length > 0 && (
            <View style={styles.header}>
              <Text style={styles.headerText}>{title}</Text>
            </View>
          )}
          <View style={[styles.body]}>
            <InputText
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
              onFocus={() => this.setState({focused: true})}
              onBlur={() => this.setState({focused: false})}
            />
          </View>
          <View style={[styles.footer]}>
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
    paddingLeft: normalize(24),
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
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
    marginRight: normalize(24),
    // marginBottom: normalize(8),
    // marginTop: 14,
  },
  footer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 21,
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
    margin: 10,
  },
  buttonSave: {
    backgroundColor: CMSColors.PrimaryActive,
  },
});

export default CMSTextInputModal;
