import React from 'react';
import Ripple from 'react-native-material-ripple';

const REST_TIME = 1500;

export default class CMSRipple extends React.Component {
  static defaultProps = {
    delayTime: REST_TIME,
  };

  constructor(props) {
    super(props);

    this.state = {
      resting: false,
    };

    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidCatch(error, info) {
    __DEV__ &&
      console.log('GOND CMSRipple catch error: ', error, '\n --- info: ', info);
  }

  onPress = event => {
    const {onPress, delayTime} = this.props;
    if (!onPress && typeof onPress != 'function') {
      __DEV__ && console.log('GOND CMSRipple onPress not defined!');
      return;
    }
    if (delayTime !== 0) {
      if (this.state.resting) {
        __DEV__ && console.log('GOND CMSRipple is resting...', delayTime);
        return;
      }

      this.setState(
        {
          resting: true,
        },
        () => {
          setTimeout(() => {
            if (this._isMounted) {
              this.setState({resting: false});
            }
          }, delayTime);
        }
      );
    }

    onPress(event);
  };

  render() {
    const {children} = this.props;

    return (
      <Ripple {...this.props} onPress={this.onPress}>
        {children}
      </Ripple>
    );
  }
}
