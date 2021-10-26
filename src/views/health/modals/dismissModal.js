// ----------------------------------------------------
// <!-- START MODULES -->

import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {inject, observer} from 'mobx-react';

// import InputTextIcon from '../../../components/controls/InputTextIcon';
import CMSTextInputModal from '../../../components/controls/CMSTextInputModal';

class AlertDismissModal extends Component {
  static defaultProps = {
    selectedAlert: null,
    selectedAlertType: null,
    callback: null,
  };

  constructor(props) {
    super(props);

    this.state = {};
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onDismissAlert = async description => {
    const {healthStore, selectedAlert, selectedAlertType, callback} =
      this.props;
    __DEV__ &&
      console.log('GOND DISMISSMODAL onDismiss alert: ', selectedAlert);

    if (selectedAlert) {
      healthStore.dismissAlert(selectedAlert, description);
    } else healthStore.dismissAlertsByType(selectedAlertType, description);
    // else {
    //   console.log(
    //     'Warning: None alert or alert type is selected, nothing is dismissed!'
    //   );
    // }
    if (callback && typeof callback == 'function') callback();
    healthStore.showDismissModal(false);
  };

  onCancelDismiss = () => {
    const {healthStore} = this.props;

    healthStore.showDismissModal(false);
  };

  render() {
    const {dismissModalShown} = this.props.healthStore;

    return (
      <CMSTextInputModal
        isVisible={dismissModalShown}
        title="Dismiss alert"
        label="Description"
        onSubmit={this.onDismissAlert}
        onCancel={this.onCancelDismiss}
        placeHolder="Dismiss descriptions"
      />
    );
  }
}

const styles = StyleSheet.create({});

export default inject('healthStore')(observer(AlertDismissModal));
