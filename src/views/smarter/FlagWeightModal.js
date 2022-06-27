import React, {Component} from 'react';
import {View, ScrollView, Text, FlatList, Dimensions} from 'react-native';
import PropTypes from 'prop-types';

// import Modal from 'react-native-modal';
import Modal from '../../components/views/CMSModal';

import {IconCustom} from '../../components/CMSStyleSheet';
import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import {SMARTER as SMARTER_TXT} from '../../localization/texts';

const HeaderHeight = 56;
const ListItemHeight = 42;

class FlagWeightModal extends Component {
  constructor(props) {
    super(props);

    const {height} = Dimensions.get('window');
    this.minMarginTop = height * 0.1;
  }

  componentWillUnmount() {
    __DEV__ && console.log('FlagWeightModal componentWillUnmount');
  }

  componentDidMount() {
    __DEV__ && console.log('FlagWeightModal componentDidMount');
    //this.props.RefeshPage(!this.props.app.stateapp)
  }

  renderItem = ({item}) => {
    return (
      <View
        style={{
          height: ListItemHeight,
          flexDirection: 'row',
          paddingHorizontal: 10,
          justifyContent: 'flex-start',
          backgroundColor: CMSColors.White,
        }}>
        <View
          style={{
            width: 32,
            height: 32,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <IconCustom size={20} color={item.color} name="ic_flag_black_48px" />
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: -6 * item.typeWeight.toString().length,
            }}>
            <View style={{width: 10}}></View>
            <Text
              style={{
                color: CMSColors.Red,
                fontSize: 10,
                borderColor: 'lightgray',
                borderWidth: 1,
                minWidth: 15,
                height: 15,
                borderRadius: 10,
                textAlign: 'center',
                paddingHorizontal: 3,
              }}>
              {item.typeWeight}
            </Text>
          </View>
        </View>
        <View
          style={{
            paddingLeft: 14,
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}>
          <Text style={{}}>{item.name}</Text>
        </View>
      </View>
    );
  };

  render() {
    const {isVisible, data, onDismiss} = this.props;
    const {height} = Dimensions.get('window');

    if (!data || !Array.isArray(data)) {
      __DEV__ && console.log('FlagWeightModal flag data not valid: ', data);
      return;
    }
    const marginTop = height - (HeaderHeight + data.length * ListItemHeight);

    return (
      <Modal
        isVisible={isVisible}
        onBackButtonPress={onDismiss}
        onBackdropPress={onDismiss}
        backdropOpacity={0.1}
        key="flagWeightModal"
        name="flagWeightModal"
        style={[
          commonStyles.modalContainer,
          {
            marginTop:
              (marginTop < this.minMarginTop ? this.minMarginTop : marginTop) /
              1.1,
            backgroundColor: 'white',
          },
        ]}>
        <View style={[commonStyles.modalHeader, {height: HeaderHeight}]}>
          <Text style={commonStyles.modalTitle}>{SMARTER_TXT.FLAG_WEIGHT}</Text>
        </View>
        <FlatList
          data={data}
          renderItem={this.renderItem}
          keyExtractor={(item, index) => 'flag_' + index}
        />
      </Modal>
    );
  }
}

export default FlagWeightModal;
