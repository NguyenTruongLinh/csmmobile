import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Animated, PanResponder, View} from 'react-native';

const swipeDirections = {
  SWIPE_LEFT: 'SWIPE_LEFT',
  SWIPE_RIGHT: 'SWIPE_RIGHT',
  SWIPE_UP: 'SWIPE_UP',
  SWIPE_DOWN: 'SWIPE_DOWN',
};

function isValidSwipe(
  velocity,
  velocityThreshold,
  directionalOffset,
  directionalOffsetThreshold
) {
  return (
    Math.abs(velocity) >= velocityThreshold &&
    Math.abs(directionalOffset) < directionalOffsetThreshold
  );
}
function isClickSwipe(dx, dy, directionalOffsetThreshold) {
  return (
    Math.abs(dx) <= directionalOffsetThreshold &&
    Math.abs(dy) <= directionalOffsetThreshold
  );
}

class Swipe extends Component {
  constructor(props) {
    super(props);

    this.swipeConfig = {
      velocityThreshold: 0.3,
      directionalOffsetThreshold: 80,
      directionalClickThreshold: 5,
    };

    const panResponder = PanResponder.create({
      onPanResponderTerminationRequest: () => false,
      onStartShouldSetPanResponder: () => {
        return true;
      },
      onPanResponderRelease: (evt, gestureState) => {
        //console.log(gestureState);
        const swipeDirection = this._getSwipeDirection(gestureState);
        if (swipeDirection)
          this._triggerSwipeHandlers(swipeDirection, gestureState);
        else {
          const {dx, dy} = gestureState;
          const {directionalClickThreshold} = this.swipeConfig;
          if (
            isClickSwipe(dx, dy, directionalClickThreshold) &&
            this.props.onPress
          )
            this.props.onPress();
        }
      },
    });

    this.state = {panResponder};
  }

  _triggerSwipeHandlers(swipeDirection, gestureState) {
    const {SWIPE_LEFT, SWIPE_RIGHT, SWIPE_DOWN, SWIPE_UP} = swipeDirections;
    switch (swipeDirection) {
      case SWIPE_DOWN:
        if (this.props.onSwipeDown) this.props.onSwipeDown(gestureState);
        break;
      case SWIPE_UP:
        if (this.props.onSwipeUp) this.props.onSwipeUp(gestureState);
        break;
      case SWIPE_LEFT:
        if (this.props.onSwipeLeft) this.props.onSwipeLeft(gestureState);
        break;
      case SWIPE_RIGHT:
        if (this.props.onSwipeRight) this.props.onSwipeRight(gestureState);
        break;
    }
  }

  _getSwipeDirection(gestureState) {
    const {SWIPE_LEFT, SWIPE_RIGHT, SWIPE_DOWN, SWIPE_UP} = swipeDirections;
    const {dx, dy} = gestureState;
    if (this._isValidHorizontalSwipe(gestureState)) {
      return dx > 0 ? SWIPE_RIGHT : SWIPE_LEFT;
    } else if (this._isValidVerticalSwipe(gestureState)) {
      return dy > 0 ? SWIPE_DOWN : SWIPE_UP;
    }
    return null;
  }

  _isValidHorizontalSwipe(gestureState) {
    const {vx, dy} = gestureState;
    const {velocityThreshold, directionalOffsetThreshold} = this.swipeConfig;
    return isValidSwipe(vx, velocityThreshold, dy, directionalOffsetThreshold);
  }
  _isValidVerticalSwipe(gestureState) {
    const {vy, dx} = gestureState;
    const {velocityThreshold, directionalOffsetThreshold} = this.swipeConfig;
    return isValidSwipe(vy, velocityThreshold, dx, directionalOffsetThreshold);
  }

  render() {
    // console.log('GOND Animated.View this.props.children: ', this.props.children)
    let handles = this.state.panResponder.panHandlers;
    return (
      <Animated.View style={this.props.style} {...handles}>
        {this.props.children}
      </Animated.View>
    );
  }
}

Swipe.propTypes = {
  onSwipeLeft: PropTypes.func,
  onSwipeRight: PropTypes.func,
};

Swipe.defaultProps = {
  onSwipeLeft: () => {},
  onSwipeRight: () => {},
};

export default Swipe;
