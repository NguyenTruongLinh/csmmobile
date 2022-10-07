import React, {PureComponent} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import CMSColors from '../../styles/cmscolors';
import {Login as LoginTxt} from '../../localization/texts';

const SECONDS = 180;

class CountDown extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      time: {},
      seconds: SECONDS,
    };
    this.timer = 0;
  }

  componentDidMount() {
    let timeLeftVar = this.secondsToTime(this.state.seconds);
    this.setState({time: timeLeftVar});
    this.startTimer();
  }

  componentWillUnmount() {
    this.stopTimer();
  }

  secondsToTime(secs) {
    let divisor_for_minutes = secs % (60 * 60);
    let minutes = Math.floor(divisor_for_minutes / 60);

    let divisor_for_seconds = divisor_for_minutes % 60;
    let seconds = Math.ceil(divisor_for_seconds);

    let obj = {
      m: minutes,
      s: seconds,
    };
    return obj;
  }

  startTimer = () => {
    if (this.timer == 0 && this.state.seconds > 0) {
      this.timer = setInterval(this.countDown, 1000);
      this.props.onStartCountDown && this.props.onStartCountDown();
    }
  };

  stopTimer = () => {
    clearInterval(this.timer);
    this.timer = 0;
  };

  countDown = () => {
    let seconds = this.state.seconds - 1;
    this.setState({
      time: this.secondsToTime(seconds),
      seconds: seconds,
    });

    if (seconds == 0) {
      this.stopTimer();
      this.props.onStopCountDown && this.props.onStopCountDown();
    }
  };

  onReCountDown = () => {
    let timeLeftVar = this.secondsToTime(SECONDS);

    this.setState({seconds: SECONDS, time: timeLeftVar}, () => {
      this.startTimer();
    });
  };

  getSeconds = () => {
    return this.state.seconds;
  };

  render() {
    const {time, seconds} = this.state;

    const content =
      seconds > 0 ? (
        <View>
          <Text style={styles.timeLeftText}>
            <Text style={styles.textBold}>
              {time.m}:{time.s} seconds left
            </Text>
          </Text>
        </View>
      ) : (
        <Text style={[styles.timeLeftText, styles.timeLeftExpiredText]}>
          {LoginTxt.timeLeftExpired}
        </Text>
      );

    return <View style={styles.countDownContainer}>{content}</View>;
  }
}

const styles = StyleSheet.create({
  textBold: {
    fontWeight: 'bold',
  },
  timeLeftText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 16,
    textAlign: 'center',
  },
  timeLeftExpiredText: {
    color: CMSColors.Danger,
  },
});

export default CountDown;
