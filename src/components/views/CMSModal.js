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
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    if (this.props.isVisible) {
      __DEV__ &&
        console.log('GOND CMSModal didMount visible: ', this.props.name);
      const {modalRef} = this.props.appStore;
      if (modalRef) {
        modalRef.updateProps(this.props);
      } else {
        __DEV__ &&
          console.log('GOND CMSModal didMount modalRef not yet created');
      }
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.state.isVisible && modalRef) {
      const {onDismiss} = this.props;
      modalRef.updateProps({isVisible: false});
      if (onDismiss && typeof onDismiss == 'function') onDismiss();
    }
  }

  // componentDidUpdate() {
  //   const {modalRef} = this.props.appStore;
  //   const {modalProps, shouldUpdate} = this.state;

  //   // if (!shouldUpdate) return false;
  //   if (shouldUpdate && modalRef) {
  //     modalRef.updateProps(modalProps);
  //     this.setState({shouldUpdate: false});
  //   } else if (!modalRef) {
  //     __DEV__ && console.log('GOND CMSModal modalRef not yet created');
  //   }
  // }

  // static getDerivedStateFromProps(nextProps, prevState) {
  //   __DEV__ && console.log('GOND CMSModal newProps: ', nextProps, prevState);
  //   if (prevState.shouldUpdate) {
  //     return {shouldUpdate: false};
  //   }
  //   if (
  //     nextProps.isVisible ||
  //     nextProps.isVisible != prevState.modalProps.isVisible
  //   ) {
  //     __DEV__ && console.log('GOND CMSModal will be updated');
  //     return {
  //       modalProps: nextProps.isVisible ? nextProps : {isVisible: false},
  //       shouldUpdate: true,
  //     };
  //   }

  //   return {shouldUpdate: false};
  // }

  componentDidUpdate(prevProps) {
    const {isVisible} = this.props;
    const {modalRef} = this.props.appStore;

    if (
      this._isMounted &&
      modalRef &&
      (isVisible || isVisible != prevProps.isVisible)
    ) {
      modalRef.updateProps(this.props);
    } else if (!modalRef) {
      __DEV__ && console.log('GOND CMSModal modalRef not yet created');
    }
  }

  forceUpdate(values) {
    super.forceUpdate();
    // this.setState({modalProps: values});
    modalRef.updateProps(values);
  }

  // render() {
  //   return <View />;
  // }

  render() {
    const {children} = this.props;
    // __DEV__ && console.log('GOND CMSModal render: ', children);
    // if (children) {
    //   // children.forEach(c => c.forceUpdate());
    //   if (
    //     typeof children == 'object' &&
    //     typeof children.forceUpdate == 'function'
    //   ) {
    //     children.forceUpdate();
    //   } else if (Array.isArray(children)) {
    //     children.forEach(c => {
    //       if (typeof c.forceUpdate == 'function') c.forceUpdate();
    //     });
    //   }
    // }
    return null;
  }
}

// export default CMSModal;
export default inject('appStore')(observer(CMSModal));
