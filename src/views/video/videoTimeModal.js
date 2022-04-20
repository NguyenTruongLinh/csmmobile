import React, {Component, Fragment, PropTypes} from 'react';
import {
  Text,
  View,
  Dimensions,
  StyleSheet,
  ScrollView,
  Platform,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Modal from 'react-native-modal';

import CMSCalendarSingleDate from '../../components/views/CMSCalendarSingleDate';
import Button from '../../components/controls/Button';
import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import {Comps as CompTxt} from '../../localization/texts';
import CMSNumberPicker from '../../components/views/CMSNumberPicker';

const SECTION_HEADER_HEIGHT = 48;

const ALL_HOURS = Array.from(Array(24).keys());
const MINUTES = Array.from(Array(60).keys());
const SECONDS = Array.from(Array(60).keys());

export default class VideoTimeModal extends Component {
  static defaultProps = {
    selectedTime: {hourIndex: 0, hour: 0, minute: 0, second: 0},
  };

  constructor(props) {
    super(props);

    this.state = {
      dstHours: ALL_HOURS,
    };
    this.calendarRef = null;
    this.selectedTime = {hourIndex: 0, hour: 0, minute: 0, second: 0};
    this.hourRef = null;
  }

  componentDidMount() {
    // if (this.props.Rotatable) {
    //   Dimensions.addEventListener('change', this.onDimensionChange);
    // }
    // this.onDimensionChange({window: Dimensions.get('window')});
    const {hour, minute, second} = this.props.selectedTime ?? {
      hour: 0,
      minute: 0,
      second: 0,
    };

    this.constructArrayOfHours();

    this.selectedTime = {
      hourIndex: this.state.dstHours.findIndex(value => hour == value),
      hour: hour ?? 0,
      minute: minute ?? 0,
      second: second ?? 0,
    };
  }

  constructArrayOfHours = () => {
    const dstHours = [];
    const selectedDate = this.props.datetime.toFormat('yyyyMMdd');
    let hourIterator = this.props.datetime.startOf('day');
    let currentDate = hourIterator.toFormat('yyyyMMdd');
    do {
      dstHours.push(hourIterator.toFormat('H'));
      hourIterator = hourIterator.plus({hour: 1});
      currentDate = hourIterator.toFormat('yyyyMMdd');
    } while (currentDate == selectedDate);

    this.setState({dstHours});
  };

  componentWillUnmount() {
    // if (this.props.Rotatable) {
    //   Dimensions.removeEventListener('change', this.onDimensionChange);
    // }
  }

  onTimeChange = (key, value) => {
    this.selectedTime[key] = value;
  };

  renderHeader = () => {
    return (
      <View style={styles.modalHeader}>
        <TouchableOpacity
          caption={CompTxt.cancelButton}
          type="flat"
          enable={true}
          onPress={() => {
            const {onDismiss} = this.props;
            onDismiss && onDismiss();
            this.selectedTime = {};
          }}>
          <Text
            style={[
              styles.headerActionText,
              {
                color: CMSColors.SecondaryText,
              },
            ]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          caption={CompTxt.applyButton}
          captionStyle={{color: CMSColors.White}}
          type="flat"
          // enable={this.state.selectedSites.length > 0}
          enable={true}
          onPress={() => {
            const {onSubmit} = this.props;
            __DEV__ &&
              console.log('GOND TimePicker onSubmit: ', this.selectedTime);
            onSubmit &&
              onSubmit(
                this.selectedTime.hourIndex,
                this.selectedTime.hour,
                this.selectedTime.minute,
                this.selectedTime.second
              );
            this.selectedTime = {};
          }}>
          <Text
            style={[
              styles.headerActionText,
              {
                color: CMSColors.SpinnerColor,
              },
            ]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  renderContent = () => {
    return (
      <View style={{flex: 1, flexDirection: 'row'}}>
        <CMSNumberPicker
          ref={r => (this.hourRef = r)}
          numbers={this.state.dstHours}
          onSelectNumber={(number, index) => {
            this.onTimeChange('hour', number);
            this.onTimeChange('hourIndex', index);
          }}
          selected={this.props.selectedTime.hour}
        />
        <CMSNumberPicker
          numbers={MINUTES}
          onSelectNumber={number => this.onTimeChange('minute', number)}
          selected={this.props.selectedTime.minute}
        />
        <CMSNumberPicker
          numbers={SECONDS}
          onSelectNumber={number => this.onTimeChange('second', number)}
          selected={this.props.selectedTime.second}
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
        style={{
          margin: 0,
          flex: 1,
          justifyContent: 'flex-end',
        }}>
        <View
          style={{
            height: '40%',
            backgroundColor: 'white',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            flexDirection: 'column',
          }}>
          {this.renderHeader()}
          {this.renderContent()}
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  modalHeader: {
    height: 50,
    backgroundColor: CMSColors.White,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: 'lightgray',
    borderBottomWidth: 1,
  },
  headerActionText: {
    fontSize: 18,
    paddingHorizontal: 10,
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
