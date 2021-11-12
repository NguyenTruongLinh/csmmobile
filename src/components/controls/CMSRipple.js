import React from 'react';
import Ripple from 'react-native-material-ripple';

const REST_TIME = 1500;

export default class CMSRipple extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      resting: false,
    };

    this._isMmounted = false;
  }

  componentDidMount() {
    this._isMmounted = true;
  }

  componentWillUnmount() {
    this._isMmounted = false;
  }

  componentDidCatch(error, info) {
    __DEV__ &&
      console.log('GOND CMSRipple catch error: ', error, '\n --- info: ', info);
  }

  onPress = event => {
    if (this.state.resting) return;

    this.setState(
      {
        resting: true,
      },
      () => {
        setTimeout(() => {
          if (this._isMmounted) {
            this.setState({resting: false});
          }
        }, REST_TIME);
      }
    );

    this.props.onPress(event);
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
