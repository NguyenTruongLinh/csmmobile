import React, {Component} from 'react';
import {View, ScrollView, Text, FlatList, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

import LoadingOverlay from '../../components/common/loadingOverlay';

import CMSColors from '../../styles/cmscolors';
import {SMARTER as SMARTER_TXT} from '../../localization/texts';

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
    transaction.total &&
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
    transaction.changeAmount &&
      paymentData.push({
        label: SMARTER_TXT.CHANGE + (transaction.changeAmount > 0 ? 's' : ''),
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
    return (
      <View style={styles.normalTextContainer} key={'head_' + label}>
        <Text style={styles.normalText}>{label + ': ' + value}</Text>
      </View>
    );
  };

  renderDetailItem = (item, index) => {
    return (
      <View key={'item_' + index} style={{height: 42, flexDirection: 'row'}}>
        <View style={{flex: 1}}>
          <Text style={styles.normalText}>{item.quantity}</Text>
        </View>
        <View style={{flex: 8}}>
          <Text style={styles.normalText}>{item.descriptionName}</Text>
        </View>
        <View style={{flex: 1, alignItems: 'flex-end'}}>
          <Text style={styles.normalText}>${item.total}</Text>
        </View>
      </View>
    );
  };

  renderPaymentItem = (item, index) => {
    return (
      <View
        key={'paym_' + index}
        style={{
          height: 42,
          flexDirection: 'row',
          justifyContent: 'center',
        }}>
        <View style={{flex: 8, alignItems: 'flex-end'}}>
          <Text style={styles.paymentText}>{item.label}</Text>
        </View>
        <View style={{flex: 1}} />
        <View style={{flex: 2}}>
          <Text style={styles.paymentText}>${item.value}</Text>
        </View>
      </View>
    );
  };

  render() {
    const {transaction, style, isLoading} = this.props;
    const {paymentData} = this.state;
    return (
      <ScrollView style={[styles.viewContainer, style]}>
        {this.renderHeaderInfo(SMARTER_TXT.ORDER_TIME, transaction.orderTime)}
        {this.renderHeaderInfo(SMARTER_TXT.CASHIER, transaction.employeeName)}
        {this.renderHeaderInfo(SMARTER_TXT.REG, transaction.registerName)}
        {/* {isLoading ? (
          <LoadingOverlay
            backgroundColor={CMSColors.White}
            indicatorColor={CMSColors.PrimaryActive}
          />
        ) : ( */}
        <View key="item_list" style={{marginVertical: 14}}>
          {transaction.detail.map(this.renderDetailItem)}
        </View>
        {/* )} */}
        <View key="payment_tax" style={{}}>
          {paymentData.map(this.renderPaymentItem)}
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    flexDirection: 'column',
    padding: 7,
    backgroundColor: CMSColors.White,
  },
  normalText: {
    fontSize: 12,
  },
  normalTextContainer: {
    height: 35,
  },
  paymentText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default TransactionBillView;
