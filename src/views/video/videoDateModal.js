import React, {Component} from 'react';
import {Text, View, StyleSheet} from 'react-native';

import {inject, observer} from 'mobx-react';

import Modal from '../../components/views/CMSModal';
import CMSCalendarSingleDate from '../../components/views/CMSCalendarSingleDate';
import Button from '../../components/controls/Button';

import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import theme from '../../styles/appearance';

import {Comps as CompTxt} from '../../localization/texts';

const SECTION_HEADER_HEIGHT = 48;

class VideoDateModal extends Component {
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
    const {appearance} = this.props.appStore;

    return (
      <View
        style={[
          commonStyles.modalHeader,
          commonStyles.modalHeaderSeparator,
          {
            flex: 10,
          },
          theme[appearance].modalContainer,
        ]}>
        <Text style={[commonStyles.modalTitle, theme[appearance].text]}>
          Select date
        </Text>
      </View>
    );
  };

  renderFooter = () => {
    const {appearance} = this.props.appStore;

    return (
      <View
        style={[
          commonStyles.modalFooter,
          styles.modalFooter,
          theme[appearance].modalContainer,
        ]}>
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
    const {appearance} = this.props.appStore;

    return (
      <View
        style={[
          styles.modalContentContainer,
          theme[appearance].modalContainer,
        ]}>
        <CMSCalendarSingleDate
          markedDates={this.props.markedDates}
          date={this.props.date}
          onDateChange={this.onDateChange}
        />
      </View>
    );
  };

  render() {
    const {appearance} = this.props.appStore;

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
        <View
          style={[
            commonStyles.modalContainer,
            {marginTop: this.props.isFullscreen ? '5%' : '25%'},
            theme[appearance].modalContainer,
          ]}>
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
  modalFooter: {flex: 15, paddingHorizontal: 12},
  modalContentContainer: {flex: 75},
});

export default inject('appStore')(observer(VideoDateModal));
