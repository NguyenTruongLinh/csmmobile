import React, {Component, PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Image,
  Animated,
  Platform,
} from 'react-native';

import CMSColors from '../../styles/cmscolors';

class TimeOnTimeRuler extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      isShow: false,
      fadeAnim: new Animated.Value(0),
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.value != this.state.value) {
      this.setState({value: nextProps.value});
    }
  }

  setValue = newValue => {
    this.setState({value: newValue});
  };

  setShowHide = newv => {
    this.setState({isShow: newv});
    if (newv == true) {
      Animated.timing(
        // Animate over time
        this.state.fadeAnim, // The animated value to drive
        {
          toValue: 1, // Animate to opacity: 1 (opaque)
          duration: 3000, // Make it take a while
          useNativeDriver: true,
        }
      ).start();
    } else {
      Animated.timing(
        // Animate over time
        this.state.fadeAnim, // The animated value to drive
        {
          toValue: 0, // Animate to opacity: 1 (opaque)
          duration: 3000, // Make it take a while
          useNativeDriver: true,
        }
      ).start();
    }
  };

  render() {
    let {styles, backgroundColor} = this.props;
    let {fadeAnim} = this.state;
    if (this.state.isShow == true) {
      return (
        <View style={styles}>
          <Animated.View // Special animatable View</Animated.View>
            style={{
              opacity: fadeAnim, // Bind opacity to animated value
            }}>
            <View
              style={{
                backgroundColor: backgroundColor,
                padding: 3,
                borderRadius: 3,
              }}>
              <Text style={{color: CMSColors.PrimaryText}}>
                {this.state.value}
              </Text>
            </View>
          </Animated.View>
        </View>
      );
    } else {
      return <View />;
    }
  }
}

export default TimeOnTimeRuler;
