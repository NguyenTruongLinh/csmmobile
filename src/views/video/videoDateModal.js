import React, {Component, PropTypes} from 'react';
import {
  Text,
  View,
  Dimensions,
  StyleSheet,
  ScrollView,
  Platform,
  FlatList,
} from 'react-native';
// import Modal from 'react-native-modal';
import Modal from '../../components/views/CMSModal';

import CMSCalendarSingleDate from '../../components/views/CMSCalendarSingleDate';
import Button from '../../components/controls/Button';
import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import {Comps as CompTxt} from '../../localization/texts';

const SECTION_HEADER_HEIGHT = 48;

export default class VideoDateModal extends Component {
  constructor(props) {
    super(props);

    this.calendarRef = null;
    this.pressedDateString = null;
  }

  componentDidMount() {
    // if (this.props.Rotatable) {
    //   Dimensions.addEventListener('change', this.onDimensionChange);
    // }
    // this.onDimensionChange({window: Dimensions.get('window')});
  }

  componentWillUnmount() {
    // if (this.props.Rotatable) {
    //   Dimensions.removeEventListener('change', this.onDimensionChange);
    // }
  }

  onDismiss = () => {
    const {onDismiss} = this.props;
    onDismiss && onDismiss();
    this.pressedDateString = null;
  };

  onSubmit = () => {
    const {onSubmit} = this.props;
    onSubmit && onSubmit(this.pressedDateString);
    this.pressedDateString = null;
  };

  onDateChange = pressedDateString => {
    this.pressedDateString = pressedDateString;
  };

  renderHeader = () => {
    return (
      <View
        style={[
          commonStyles.modalHeader,
          commonStyles.modalHeaderSeparator,
          {
            flex: 10,
          },
        ]}>
        <Text style={[commonStyles.modalTitle]}>Select date</Text>
      </View>
    );
  };

  renderFooter = () => {
    return (
      <View
        style={[commonStyles.modalFooter, {flex: 15, paddingHorizontal: 12}]}>
        <View style={commonStyles.modalButtonCancelContainer}>
          <Button
            style={commonStyles.modalButtonCancel}
            caption={CompTxt.cancelButton}
            type="flat"
            enable={true}
            onPress={() => {
              this.onDismiss();
            }}
          />
        </View>
        <View style={commonStyles.modalButtonApplyContainer}>
          <Button
            style={commonStyles.modalButtonApply}
            caption={CompTxt.applyButton}
            captionStyle={{color: CMSColors.White}}
            type="flat"
            // enable={this.state.selectedSites.length > 0}
            enable={true}
            onPress={() => {
              this.onSubmit();
            }}
          />
        </View>
      </View>
    );
  };

  renderContent = () => {
    return (
      <View style={{flex: 75}}>
        <CMSCalendarSingleDate
          markedDates={this.props.markedDates}
          date={this.props.date}
          onDateChange={this.onDateChange}
        />
      </View>
    );
  };

  render() {
    return (
      <Modal
        isVisible={this.props.isVisible}
        onBackdropPress={this.props.onBackdropPress}
        onBackButtonPress={this.props.onBackButtonPress}
        panResponderThreshold={10}
        backdropOpacity={0.3}
        key="videoDateModal"
        name="videoDateModal"
        style={styles.modal}>
        <View style={[commonStyles.modalContainer, {marginTop: '25%'}]}>
          {this.renderHeader()}
          {this.renderContent()}
          {this.renderFooter()}
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    marginBottom: 0,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    flex: 1,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    // padding: 5,
    paddingHorizontal: 12,
    height: SECTION_HEADER_HEIGHT,
    backgroundColor: CMSColors.White,
    borderBottomWidth: 0.5,
    borderColor: CMSColors.BorderColorListRow,
  },
  siteNameContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  siteNameText: {
    fontSize: 14,
  },
  button_sort: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatSearchBarContainer: {
    paddingLeft: 18,
    paddingRight: 4,
    height: 50,
    backgroundColor: CMSColors.White,
  },
});
