import React from 'react';
import {Dimensions, FlatList, Text} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';

import Modal from '../../../../components/views/CMSModal';

import styles from '../../styles/liveChannelStyles';
import theme from '../../../../styles/appearance';

import {LAYOUT_DATA} from '../../../../consts/video';

const {height} = Dimensions.get('window');

class LayoutModal extends React.Component {
  static propTypes = {
    isVisible: PropTypes.bool,
    onClose: PropTypes.func,
    onItemPress: PropTypes.func,
  };
  static defaultProps = {
    isVisible: false,
    onClose: () => {},
    onItemPress: () => {},
  };

  renderLayoutItem = ({item}) => {
    const {videoStore, appStore, onItemPress} = this.props;
    const {appearance} = appStore;

    return (
      <CMSTouchableIcon
        size={height * 0.07}
        onPress={() => {
          videoStore.setGridLayout(item.value);
          onItemPress && onItemPress(item);
        }}
        color={theme[appearance].iconColor}
        iconCustom={item.icon}
      />
    );
  };

  render() {
    const {appStore, isVisible, onClose} = this.props;
    const {appearance} = appStore;

    return (
      <Modal
        isVisible={isVisible}
        onBackdropPress={onClose}
        onBackButtonPress={onClose}
        backdropOpacity={0.1}
        key="divisionModal"
        name="divisionModal"
        style={[
          styles.layoutModalContainer,
          styles.layoutModalContainerExtra,
          theme[appearance].modalContainer,
        ]}>
        <Text style={[styles.layoutModalTitle, theme[appearance].text]}>
          Division
        </Text>
        <FlatList
          contentContainerStyle={styles.layoutModalBody}
          renderItem={this.renderLayoutItem}
          data={LAYOUT_DATA}
          horizontal={true}
          style={{
            paddingBottom: height * 0.07,
          }}
        />
      </Modal>
    );
  }
}

export default inject('appStore')(observer(LayoutModal));
