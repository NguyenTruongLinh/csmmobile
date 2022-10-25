import React from 'react';
import {Dimensions, FlatList, Text, View} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';

import Modal from '../../../components/views/CMSModal';
import {MaterialIcons, ListViewHeight} from '../../../components/CMSStyleSheet';
import CMSRipple from '../../../components/controls/CMSRipple';

import styles from '../styles/smartErStyles';
import theme from '../../../styles/appearance';
import CMSColors from '../../../styles/cmscolors';

import {ExceptionSortFieldName} from '../../../consts/misc';
import {SMARTER as SMARTER_TXT} from '../../../localization/texts';

class RickFactorTypeModal extends React.Component {
  static PropTypes = {
    isVisible: PropTypes.bool,
    onClose: PropTypes.func,
  };

  static defaultProps = {
    isVisible: false,
    onClose: () => {},
  };

  render() {
    const {height} = Dimensions.get('window');
    const {exceptionStore, appStore, isVisible, onClose} = this.props;
    const {displaySortFields, sortField} = exceptionStore;
    const {appearance} = appStore;

    return (
      <Modal
        isVisible={isVisible}
        onBackdropPress={onClose}
        onBackButtonPress={onClose}
        backdropOpacity={0.5}
        key="summaryModal"
        name="summaryModal"
        style={[
          styles.sortModal,
          {
            marginTop:
              height - (displaySortFields.length * ListViewHeight + 100),
          },
          theme[appearance].modalContainer,
        ]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, theme[appearance].text]}>
            {SMARTER_TXT.SORT_MODAL_TITLE}
          </Text>
        </View>
        <FlatList
          data={displaySortFields}
          keyExtractor={item => `rsk_${item}`}
          renderItem={({item}) => (
            <CMSRipple
              style={styles.sortItemRipple}
              onPress={() => {
                exceptionStore.setSortField(item);
                onClose && onClose();
              }}>
              <MaterialIcons
                name={
                  sortField === item
                    ? 'radio-button-checked'
                    : 'radio-button-unchecked'
                }
                color={
                  sortField === item
                    ? CMSColors.PrimaryActive
                    : theme[appearance].radioColor
                }
                size={24}
              />
              <Text style={[styles.sortItemText, theme[appearance].text]}>
                {ExceptionSortFieldName[item]}
              </Text>
            </CMSRipple>
          )}
        />
      </Modal>
    );
  }
}

export default inject(
  'appStore',
  'exceptionStore'
)(observer(RickFactorTypeModal));
