import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  AppState,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {inject, observer} from 'mobx-react';

import Ripple from 'react-native-material-ripple';
import Icon from 'react-native-vector-icons/FontAwesome';

import CMSStyleSheet from '../../../components/CMSStyleSheet';
const IconCustom = CMSStyleSheet.IconCustom;

import {normalize} from '../../../util/general';

import CMSColors from '../../../styles/cmscolors';
import CMSTouchableIcon from '../../../components/containers/CMSTouchableIcon';

import commonStyles from '../../../styles/commons.style';
import Button from '../../../components/controls/Button';

const warningMessages = [
  'I have responded to the alarm and per company protocol, have taken corrective action.',
  'I have responded to the alarm and per company protocol, have allowed additional customers into the store.',
  'I have responded to the alarm and no further action is needed.',
];

class AcknowledgePopup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedMsgId: 0,
    };
  }
  onRadioButtonPress = id => {
    this.setState({selectedMsgId: id});
  };
  onAckPostPress() {
    const {oamStore} = this.props;
    const errorCb = () => {};
    oamStore.postAcknowledge(
      {
        id: oamStore.data.kAlertEventDetail || 0,
        Note: warningMessages[this.state.selectedMsgId],
      },
      this.onCloseAcknowledge,
      errorCb
    );
  }
  renderRadioMessages = () => {
    const {oamStore} = this.props;
    return (
      <View
        style={[
          {
            flex: oamStore.data.kAlertType < 3 ? 3 : 2,
            borderBottomWidth: 2,
            borderBottomColor: 'rgba(189,189,189,0.54)',
            flexDirection: 'column',
          },
        ]}>
        {warningMessages.map((msg, index) => {
          return index != 2 || oamStore.data.kAlertType < 3 ? (
            <Ripple
              style={[styles.radiobuttonContainer]}
              onPress={() => {
                this.onRadioButtonPress(index);
              }}>
              <Icon
                name={
                  this.state.selectedMsgId == index
                    ? 'dot-circle-o'
                    : 'circle-o'
                }
                size={24}
                color={CMSColors.PrimaryColor}
              />
              <Text style={{paddingLeft: 10}}> {warningMessages[index]}</Text>
            </Ripple>
          ) : null;
        })}
      </View>
    );
  };

  render() {
    const {oamStore} = this.props;
    return (
      <Modal
        animationType={'slide'}
        transparent={true}
        isDisabled={false}
        backdrop={true}
        supportedOrientations={[
          'portrait',
          'landscape',
          'portrait-upside-down',
          'landscape-left',
          'landscape-right',
        ]}
        swipeDirection="down"
        style={{justifyContent: 'flex-end', margin: 0}}
        coverScreen={true}
        visible={oamStore.isAckPopupVisible}
        onRequestClose={() => {
          this.setState({showConfirm: false});
        }}>
        <View style={{flex: 1, flexDirection: 'column', padding: 0}}>
          <TouchableOpacity
            style={{
              flex: oamStore.data.kAlertType < 3 ? 3 : 4,
              backgroundColor: CMSColors.borderColor,
            }}
            activeOpacity={1}
            onPress={() => oamStore.setAckPopupVisibility(false)}
          />
          <View
            style={[
              styles.modalcontainer,
              {
                flex: oamStore.data.kAlertType < 3 ? 7 : 6,
              },
            ]}>
            <View style={[styles.modalcontent, {flex: 3}]}>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'column',
                  alignContent: 'center',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <IconCustom
                  disabled={true}
                  style={[
                    styles.icon,
                    {color: oamStore.data.kAlertType >= 3 ? 'red' : 'orange'},
                  ]}
                  size={normalize(40)}
                  name={'round-error-symbol'}
                />
              </View>
            </View>
            <View
              style={{
                flexDirection: 'column',
                alignContent: 'center',
                justifyContent: 'center',
                flex: 8,
              }}>
              {this.renderRadioMessages()}
              <View
                style={[
                  styles.popupcomponent,
                  {paddingLeft: 20, paddingRight: 20},
                ]}>
                <View
                  style={{
                    flex: 4,
                    marginBottom: 20,
                  }}>
                  <Button
                    style={[styles.buttonIgnore, {backgroundColor: 'white'}]}
                    type="Custom"
                    caption="Cancel"
                    IconStyleEnable={[{color: CMSColors.PrimaryText}]}
                    styleCaption={styles.buttonCaption}
                    enable={true}
                    iconCustom="clear-button"
                    onPress={() => oamStore.setAckPopupVisibility(false)}
                  />
                </View>
                <View
                  style={{
                    flex: 6,
                    paddingLeft: 10,
                    marginBottom: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Button
                    enable={true}
                    type={'primary'}
                    caption="Acknowledge"
                    onPress={this.onAckPostPress.bind(this)}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  radiobuttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 24,
    paddingRight: 24,
    //marginTop:20,
    marginRight: 20,
  },
  modalcontainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalcontent: {
    height: 50,
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomColor: 'rgb(204, 204, 204)',
  },
  radiobuttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 24,
    paddingRight: 24,
    //marginTop:20,
    marginRight: 20,
  },
  popupcomponent: {
    flexDirection: 'row',
    flex: 1,
    paddingTop: 10,
    marginLeft: 10,
    marginRight: 10,
  },
  buttonIgnore: {
    flex: 1,
    backgroundColor: CMSColors.PrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  buttonCaption: {
    color: '#fff',
    fontSize: normalize(13),
  },
});

export default inject('oamStore')(observer(AcknowledgePopup));
