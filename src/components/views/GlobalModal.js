'use strict';

import React, {Component} from 'react';
import {View, Animated, LogBox} from 'react-native';
// import PropTypes from 'prop-types';

// import {inject, observer} from 'mobx-react';

import Modal from 'react-native-modal';

class GlobalModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      modalProps: {isVisible: false},
      // isVisible: false,
    };

    this.delayedCommand = null;
  }

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidUpdate(prevProps, prevState) {}

  updateProps(values) {
    const {modalProps} = this.state;
    __DEV__ &&
      console.log('GOND GlobalModal updateProps: ', modalProps.name, values);
    if (
      values.name != modalProps.name &&
      modalProps.isVisible &&
      values.isVisible
    ) {
      this.setState({modalProps: {...modalProps, isVisible: false}}, () => {
        if (this.delayedCommand) {
          clearTimeout(this.delayedCommand);
        }
        this.delayedCommand = setTimeout(() => {
          this.setState({modalProps: values});
          this.delayedCommand = null;
        }, 500);
      });
    } else {
      this.setState({modalProps: values});
    }
  }

  render() {
    const {modalProps} = this.state;
    const props = {...modalProps, children: undefined};

    return (
      <Modal
        {...props}
        useNativeDriver={true}
        animationInTiming={300}
        animationOut="slideOutDown"
        animationIn="slideInUp"
        animationOutTiming={300}>
        {modalProps.children}
      </Modal>
    );
  }
}

export default GlobalModal;
// export default inject('appStore')(observer(GlobalModal));
