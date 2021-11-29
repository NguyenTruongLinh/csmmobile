import React, {PropTypes} from 'react';
import {View, StyleSheet} from 'react-native';
// import Calendar from 'rn-date-range';
import {CalendarList, Calendar} from 'react-native-calendars';
import {DateTime} from 'luxon';

import CMSColors from '../../styles/cmscolors';
import {DateFormat} from '../../consts/misc';

export default class CMSCalendarRange extends React.Component {
  constructor(props) {
    super(props);
    const {dateFrom, dateTo} = props;

    this.state = {
      // istest : false,
      dateRange: CMSCalendarRange.createDateRange(dateFrom, dateTo),
    };
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    // if (this.props.Rotatable) {
    //   Dimensions.addEventListener('change', this.onDimensionChange);
    // }
    // this.onDimensionChange({window: Dimensions.get('window')});
  }

  componentWillUnmount() {
    // if (this.props.Rotatable) {
    //   Dimensions.removeEventListener('change', this.onDimensionChange);
    // }
    this._isMounted = false;
  }

  getRangeString = () => {
    return this.state.dateRange;
  };

  /**
   *
   * @param {DateTime} from
   * @param {DateTime} to
   */
  static createDateRange(from, to) {
    const dateRangeObj = {};
    const selectedStyle = {
      color: CMSColors.PrimaryActive,
      textColor: CMSColors.White,
    };
    if (from.startOf('day').toSeconds() == to.startOf('day').toSeconds()) {
      dateRangeObj[from.toFormat(DateFormat.CalendarDate)] = {
        ...selectedStyle,
        startingDay: true,
        endingDay: true,
      };
    } else {
      const [dateFrom, dateTo] =
        from.startOf('day').toSeconds() < to.startOf('day').toSeconds()
          ? [from.startOf('day'), to.startOf('day')]
          : [to.startOf('day'), from.startOf('day')];
      dateRangeObj[dateFrom.toFormat(DateFormat.CalendarDate)] = {
        ...selectedStyle,
        startingDay: true,
      };
      dateRangeObj[dateTo.toFormat(DateFormat.CalendarDate)] = {
        ...selectedStyle,
        endingDay: true,
      };

      let current = dateFrom.plus({days: 1});
      while (current < dateTo) {
        dateRangeObj[current.toFormat(DateFormat.CalendarDate)] = {
          ...selectedStyle,
          marked: true,
          selected: true,
        };
        current = current.plus({days: 1});
      }
    }
    return dateRangeObj;
  }

  static getDerivedStateFromProps(nextProps) {
    let {dateFrom, dateTo} = nextProps;
    return {
      dateRange: CMSCalendarRange.createDateRange(dateFrom, dateTo),
    };
  }

  onDayPress = ({day, dateString, month, timestamp, year}) => {
    const {dateFrom, dateTo} = this.props;
    __DEV__ &&
      console.log(
        'GOND CMSCalendarRange day pressed: ',
        {
          day,
          dateString,
          month,
          timestamp,
          year,
        },
        'from = ',
        dateFrom,
        ' to = ',
        dateTo
      );
    const selectedDate = DateTime.fromISO(dateString);
    // Disable future selection
    if (selectedDate > DateTime.now()) return;

    if (
      dateFrom.startOf('day').toSeconds() == dateTo.startOf('day').toSeconds()
    ) {
      __DEV__ &&
        console.log('GOND CMSCalendarRange day pressed date from == to ');
      this.props.onDateChange({
        from: dateFrom,
        to: selectedDate,
      });
    } else {
      __DEV__ &&
        console.log('GOND CMSCalendarRange day pressed diff from != to ');
      this.props.onDateChange({
        from: selectedDate,
        to: selectedDate,
      });
    }
  };

  getSelectedDatesString = () => {
    let {dateFrom, dateTo} = this.props;
    __DEV__ && console.log('GOND getSelectedDatesString ', dateFrom, dateTo);
    return (
      dateFrom.toFormat(DateFormat.POS_Filter_Date) +
      ' -> ' +
      dateTo.toFormat(DateFormat.POS_Filter_Date)
    );
  };

  render() {
    const today = DateTime.now();
    let markedData = {};
    markedData[today.toFormat(DateFormat.CalendarDate)] = {
      marked: true,
      textColor: CMSColors.ColorText,
      dotColor: 'red',
    };
    let futureDay = today.plus({days: 1});
    while (futureDay.month == today.month) {
      markedData[futureDay.toFormat(DateFormat.CalendarDate)] = {
        textColor: CMSColors.InactiveText,
      };
      futureDay = futureDay.plus({days: 1});
    }

    markedData = {...markedData, ...this.state.dateRange};
    // __DEV__ && console.log('GOND today marked: ', markedData);
    return (
      // <View style={{flex: 1}}>
      <CalendarList
        // current={new Date()}
        markingType={'period'}
        onDayPress={this.onDayPress}
        markedDates={markedData}
        // markedDates={this.state.dateRange}
        hideExtraDays={true}
        // pastScrollRange={36}
        futureScrollRange={0}
        initialNumToRender={12}
        animateScroll={false}
      />
      // </View>
    );
  }
}

const styles = StyleSheet.create({});
