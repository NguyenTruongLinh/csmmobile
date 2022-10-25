// ----------------------------------------------------
// <!-- START MODULES -->

import React, {Component} from 'react';
import {inject, observer} from 'mobx-react';

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

export default inject('healthStore')(observer(AlertDismissModal));
