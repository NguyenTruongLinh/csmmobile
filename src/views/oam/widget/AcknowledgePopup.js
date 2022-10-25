import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {inject, observer} from 'mobx-react';

import Ripple from 'react-native-material-ripple';
import Icon from 'react-native-vector-icons/FontAwesome';

import CMSStyleSheet from '../../../components/CMSStyleSheet';
const IconCustom = CMSStyleSheet.IconCustom;
import Button from '../../../components/controls/Button';

import {normalize} from '../../../util/general';

import CMSColors from '../../../styles/cmscolors';

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
        style={{
          flexDirection: 'column',
        }}>
        {warningMessages.map((msg, index) => {
          return index != 1 || oamStore.data.kAlertType < 3 ? (
            <Ripple
              style={[styles.radiobuttonContainer]}
              onPress={() => {
                this.onRadioButtonPress(index);
              }}
              key={index}>
              <Icon
                name={
                  this.state.selectedMsgId == index
                    ? 'dot-circle-o'
                    : 'circle-o'
                }
                size={24}
                color={CMSColors.PrimaryActive}
              />
              <Text style={{paddingLeft: 10}}> {warningMessages[index]}</Text>
            </Ripple>
          ) : null;
        })}
      </View>
    );
  };

  render() {
    const {width, height} = Dimensions.get('window');
    const screenWidth = width;
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
              flex: 1,
              backgroundColor: CMSColors.borderColor,
            }}
            activeOpacity={1}
            onPress={() => oamStore.setAckPopupVisibility(false)}
          />
          <View style={styles.modalcontainer}>
            <View style={styles.modalHeader}>
              <IconCustom
                disabled={true}
                style={[
                  styles.icon,
                  {color: oamStore.data.kAlertType >= 3 ? 'red' : 'orange'},
                ]}
                size={normalize(40)}
                name={
                  oamStore.data.kAlertType >= 3 ? 'o-warning' : 'warning-sign'
                }
              />
            </View>
            {this.renderRadioMessages()}
            <View style={styles.popupFooterButtons}>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                }}>
                <Button
                  style={styles.footerButton}
                  type="flat"
                  caption="Cancel"
                  enable={true}
                  captionStyle={styles.buttonCaption}
                  onPress={() => oamStore.setAckPopupVisibility(false)}
                />
              </View>
              <View style={{width: 10}}></View>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                }}>
                <Button
                  style={styles.footerButton}
                  enable={true}
                  type={'primary'}
                  caption="Acknowledge"
                  captionStyle={styles.buttonCaption}
                  onPress={this.onAckPostPress.bind(this)}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  modalcontainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalHeader: {
    height: 80,
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomColor: 'rgb(204, 204, 204)',
    paddingTop: 20,
  },
  radiobuttonContainer: {
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 18,
    paddingRight: 24,
    marginTop: 20,
    marginRight: 12,
  },
  popupFooterButtons: {
    marginTop: 24,
    height: 80,
    flexDirection: 'row',
    padding: 18,
    marginBottom: 24,
  },
  footerButton: {
    maxHeight: 50,
    flex: 1,
    borderColor: CMSColors.PrimaryActive,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonCaption: {
    fontSize: normalize(14),
    fontWeight: 'bold',
  },
});

export default inject('oamStore')(observer(AcknowledgePopup));
