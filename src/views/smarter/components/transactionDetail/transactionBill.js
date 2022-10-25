import React, {Component} from 'react';
import {View, ScrollView, Text} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';
import {SMARTER as SMARTER_TXT} from '../../../../localization/texts';
import theme from '../../../../styles/appearance';
import styles from '../../styles/transactionDetailStyles';

class TransactionBillView extends Component {
  static propTypes = {
    transaction: PropTypes.object,
  };

  static defaultProps = {
    transaction: {},
    style: {},
  };

  constructor(props) {
    super(props);
    const {transaction} = this.props;
    __DEV__ && console.log('GOND TransactionBill trans = ', transaction);

    const paymentData = [];
    // transaction.subTotal &&
    paymentData.push({
      label: SMARTER_TXT.SUB_TOTAL,
      value: transaction.subTotal || 0,
    });
    transaction.taxs &&
      Array.isArray(transaction.taxs) &&
      transaction.taxs.forEach(item =>
        paymentData.push({
          label: item.name,
          value: item.amount,
          isHighlightName: item.isHighlightName,
          isHighlightValue: item.isHighlightValue,
          color: item.color,
        })
      );
    // transaction.total &&
    paymentData.push({
      label: SMARTER_TXT.TOTAL,
      value: transaction.total,
    });
    transaction.payments &&
      Array.isArray(transaction.payments) &&
      transaction.payments.forEach(item =>
        paymentData.push({
          label: SMARTER_TXT.PAYMENT + ' ' + item.name,
          value: item.amount,
          isHighlightName: item.isHighlightName,
          isHighlightValue: item.isHighlightValue,
          color: item.color,
        })
      );
    // transaction.changeAmount &&
    paymentData.push({
      label: SMARTER_TXT.CHANGE,
      value: transaction.changeAmount,
    });

    __DEV__ && console.log('GOND TransactionBill paymentData = ', paymentData);
    this.state = {
      paymentData,
    };
  }

  componentWillUnmount() {
    __DEV__ && console.log('TransactionBillView componentWillUnmount');
  }

  componentDidMount() {
    __DEV__ && console.log('TransactionBillView componentDidMount');
    //this.props.RefeshPage(!this.props.app.stateapp)
  }

  renderHeaderInfo = (label, value) => {
    const {appearance} = this.props.appStore;
    return (
      <View style={styles.normalTextContainer} key={'head_' + label}>
        <Text style={[styles.headerText, theme[appearance].text]}>
          {label + ': ' + value}
        </Text>
      </View>
    );
  };

  renderDetailItem = (item, index) => {
    const {appearance} = this.props.appStore;
    return (
      <View key={'item_' + index} style={{height: 32, flexDirection: 'row'}}>
        <View style={{flex: 1}}>
          <Text style={[styles.normalText, theme[appearance].text]}>
            {item.quantity}
          </Text>
        </View>
        <View style={{flex: 8}}>
          <Text style={[styles.normalText, theme[appearance].text]}>
            {item.descriptionName}
          </Text>
        </View>
        <View
          style={{
            flex: 2.5,
            alignItems: 'flex-end',
          }}>
          <Text style={[styles.normalText, theme[appearance].text]}>
            ${item.total}
          </Text>
        </View>
      </View>
    );
  };

  renderPaymentItem = (item, index) => {
    const {appearance} = this.props.appStore;
    return (
      <View
        key={'paym_' + index}
        style={{
          height: 36,
          flexDirection: 'row',
          justifyContent: 'center',
        }}>
        <View style={{flex: 8, alignItems: 'flex-end'}}>
          <Text style={[styles.paymentText, theme[appearance].text]}>
            {item.label}
          </Text>
        </View>
        <View style={{flex: 1}} />
        <View style={{flex: 2}}>
          <Text style={[styles.paymentText, theme[appearance].text]}>
            ${item.value}
          </Text>
        </View>
      </View>
    );
  };

  render() {
    const {transaction, style, appStore} = this.props;
    const {appearance} = appStore;
    const {paymentData} = this.state;
    let sortedDetail = transaction.detail.slice(0, transaction.detail.length);
    sortedDetail.sort((a, b) => a.itemLine - b.itemLine);
    return (
      <ScrollView
        style={[styles.billViewContainer, theme[appearance].container, style]}>
        {this.renderHeaderInfo(SMARTER_TXT.ORDER_TIME, transaction.orderTime)}
        {this.renderHeaderInfo(SMARTER_TXT.CASHIER, transaction.employeeName)}
        {this.renderHeaderInfo(SMARTER_TXT.REG, transaction.registerName)}
        <View key="item_list" style={{marginVertical: 14}}>
          {sortedDetail.map(this.renderDetailItem)}
        </View>
        <View key="payment_tax" style={{}}>
          {paymentData.map(this.renderPaymentItem)}
        </View>
      </ScrollView>
    );
  }
}

export default inject('appStore')(observer(TransactionBillView));
