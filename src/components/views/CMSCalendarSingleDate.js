import React from 'react';
import {View, StyleSheet, Text} from 'react-native';

import {CalendarList} from 'react-native-calendars';
import {DateTime} from 'luxon';
import {inject, observer} from 'mobx-react';

import CMSColors from '../../styles/cmscolors';
import {DateFormat} from '../../consts/misc';
import theme from '../../styles/appearance';

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

class CMSCalendarSingleDate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      date: this.createDate(props.date),
    };
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  getRangeString = () => {
    return this.state.date;
  };

  createDate = selectedDate => {
    const {markedDates} = this.props;
    let dateObj = {};
    const formatedSelDate = selectedDate.toFormat(DateFormat.CalendarDate);
    let formatedSelDateObj = {
      color: CMSColors.PrimaryActive,
      textColor: CMSColors.White,
      startingDay: true,
      endingDay: true,
    };
    dateObj[formatedSelDate] = formatedSelDateObj;
    dateObj = {...markedDates, ...dateObj};
    return dateObj;
  };

  onDayPress = ({day, dateString, month, timestamp, year}) => {
    const {onDateChange} = this.props;
    if (!onDateChange || typeof onDateChange != 'function') {
      __DEV__ &&
        console.log('GOND CMSCalendarSingleDate onDateChange not defined!');
      return;
    }
    __DEV__ &&
      console.log('GOND CMSCalendarSingleDate day pressed: ', {
        day,
        dateString,
        month,
        timestamp,
        year,
      });
    const selectedDate = DateTime.fromISO(dateString, {zone: 'utc'});
    // Disable future selection
    if (selectedDate > DateTime.utc()) return;
    this.setState({date: this.createDate(selectedDate)});
    onDateChange(selectedDate.toFormat(DateFormat.CalendarDate));
  };

  getSelectedDatesString = () => {
    let {date} = this.props;
    __DEV__ && console.log('GOND getSelectedDatesString ', date);
    return date.toFormat(DateFormat.POS_Filter_Date);
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

    markedData = {...markedData, ...this.state.date};
    return (
      <CalendarList
        markingType={'period'}
        onDayPress={this.onDayPress}
        markedDates={markedData}
        hideExtraDays={true}
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

export default inject('appStore')(observer(CMSCalendarSingleDate));
