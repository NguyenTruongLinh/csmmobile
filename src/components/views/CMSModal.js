'use strict';

import React, {Component} from 'react';
import {View, Animated, LogBox} from 'react-native';
// import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';

class CMSModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      modalProps: {isVisible: false},
      shouldUpdate: false,
    };
  }

  componentDidMount() {
    if (this.props.isVisible) {
      __DEV__ && console.log('GOND CMSModal didMount: ', this.props.name);
      const {modalRef} = this.props.appStore;
      if (modalRef) {
        modalRef.updateProps(this.props);
        this.setState({
          modalProps: this.props,
        });
      } else {
        __DEV__ &&
          console.log('GOND CMSModal didMount modalRef not yet created');
      }
    }
  }

  componentWillUnmount() {
    if (this.state.isVisible && modalRef) {
      modalRef.updateProps({isVisible: false});
    }
  }

  componentDidUpdate() {
    const {modalRef} = this.props.appStore;
    const {modalProps, shouldUpdate} = this.state;

    // if (!shouldUpdate) return false;
    if (shouldUpdate && modalRef) {
      modalRef.updateProps(modalProps);
      this.setState({shouldUpdate: false});
    } else if (!modalRef) {
      __DEV__ && console.log('GOND CMSModal modalRef not yet created');
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    __DEV__ && console.log('GOND CMSModal update: ', nextProps, prevState);
    if (nextProps.isVisible != prevState.modalProps.isVisible) {
      __DEV__ && console.log('GOND CMSModal will be updated');
      return {
        modalProps: nextProps.isVisible ? nextProps : {isVisible: false},
        shouldUpdate: true,
      };
    }
    return {shouldUpdate: false};
  }

  updateProps(values) {
    this.setState({modalProps: values});
  }

  render() {
    return <View />;
  }
  // render() {
  // return this.props.children();
  // }
}

// export default CMSModal;
export default inject('appStore')(observer(CMSModal));
