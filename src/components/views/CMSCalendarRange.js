import React, {PropTypes} from 'react';
import {View, StyleSheet, Text} from 'react-native';
// import Calendar from 'rn-date-range';
import {CalendarList, Calendar} from 'react-native-calendars';
import {DateTime} from 'luxon';
import {inject, observer} from 'mobx-react';

import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import {DateFormat} from '../../consts/misc';

const Months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

class CMSCalendarRange extends React.Component {
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
          // ...selectedStyle,
          color: CMSColors.HighlightedDates,
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
    const {dateFrom, dateTo, onDateChange} = this.props;
    if (!onDateChange || typeof onDateChange != 'function') {
      __DEV__ && console.log('GOND CMSCalendarRange onDateChange not defined!');
      return;
    }
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
    const selectedDate = DateTime.fromISO(dateString, {zone: 'utc'});
    // Disable future selection
    if (selectedDate > DateTime.utc()) return;

    if (
      dateFrom.startOf('day').toSeconds() == dateTo.startOf('day').toSeconds()
    ) {
      const [from, to] =
        dateFrom <= selectedDate
          ? [dateFrom, selectedDate]
          : [selectedDate, dateFrom];
      __DEV__ &&
        console.log('GOND CMSCalendarRange day pressed date from == to ');
      this.props.onDateChange({
        from,
        to,
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
    const {appearance} = this.props.appStore;
    const today = DateTime.utc();
    let markedData = {};
    markedData[today.toFormat(DateFormat.CalendarDate)] = {
      marked: true,
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
        hideExtraDays={true}
        // pastScrollRange={36}
        futureScrollRange={0}
        initialNumToRender={6}
        animateScroll={false}
        renderHeader={date => (
          <View style={styles.monthContainer}>
            <Text style={[styles.monthText, theme[appearance].text]}>
              {Months[date.getMonth()] + ' ' + date.getFullYear()}
            </Text>
          </View>
        )}
        theme={{
          backgroundColor: theme[appearance].container.backgroundColor,
          calendarBackground: theme[appearance].container.backgroundColor,
          textSectionTitleColor: theme[appearance].text.color,
          dayTextColor: theme[appearance].text.color,
          todayTextColor: CMSColors.PrimaryActive,
          todayDotColor: CMSColors.PrimaryActive,
          textDisabledColor: theme[appearance].textCalendarDisabledColor,
          selectedDayTextColor: theme[appearance].text.color,
        }}
      />
      // </View>
    );
  }
}

const styles = StyleSheet.create({
  monthContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 5,
  },
  monthText: {textAlign: 'left', fontSize: 18},
});

export default inject('appStore')(observer(CMSCalendarRange));
