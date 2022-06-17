import React, {PropTypes} from 'react';
import {View, StyleSheet, Text} from 'react-native';
// import Calendar from 'rn-date-range';
import {CalendarList, Calendar} from 'react-native-calendars';
import {DateTime} from 'luxon';

import CMSColors from '../../styles/cmscolors';
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

export default class CMSCalendarSingleDate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      date: this.createDate(props.date),
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

  // static getDerivedStateFromProps(nextProps) {
  //   let {date} = nextProps;
  //   return {
  //     // date: CMSCalendarSingleDate.createDate(date),
  //   };
  // }

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
    const today = DateTime.utc();
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

    markedData = {...markedData, ...this.state.date};
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
            <Text style={styles.monthText}>
              {Months[date.getMonth()] + ' ' + date.getFullYear()}
            </Text>
          </View>
        )}
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
