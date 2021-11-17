import React, {Component} from 'react';
import {
  View,
  FlatList,
  BackHandler,
  ActivityIndicator,
  Platform,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';

const options = ['Ratio To Sale', 'Total Amount', 'Risk Factor'];

class TransactionFCMView extends Component {
  static defaultProps = {
    Transactions: {Data: []},
  };

  constructor(props) {
    super(props);
  }

  componentWillUnmount() {
    __DEV__ && console.log('TransactionFCMView componentWillUnmount');
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    if (this.props.Rotatable) {
      Dimensions.removeEventListener('change', this.onDimensionChange);
    }
  }
  componentDidMount() {
    __DEV__ && console.log('TransactionFCMView componentDidMount');
    if (this.props.Rotatable) {
      Dimensions.addEventListener('change', this.onDimensionChange);
    }
  }

  // handleBack() {
  //   // this.props.navigation.navigate('trans');
  //   // return true;
  //   this.props.ApplyIsBackFCM(true);
  //   if (Actions.currentScene === ROUTERS.TRAN_DETAIL_FCM) Actions.pop();
  //   this.onGoTransactionList();
  //   return true;
  // }

  // buildparams(siteKey, TransDate) {
  //   let sites;
  //   if (siteKey) sites = _.filter(this.props.sites, e => e.Key == siteKey);
  //   else
  //     sites = _.filter(
  //       this.props.sites,
  //       e => state.posexception.Filter.SitesSelected.indexOf(e.Key) !== -1
  //     );

  //   let paramFilter;
  //   let state = createStore.getState();

  //   if (TransDate) {
  //     let tranDate = moment.utc(TransDate).format(DateFormat.TranDate);
  //     let dateTran = moment([
  //       moment.utc(TransDate).year(),
  //       moment.utc(TransDate).month(),
  //       moment.utc(TransDate).date(),
  //     ]).toDate();
  //     //moment([moment(TransDate).toDate().getFullYear(),moment(TransDate).toDate().getMonth(),moment(TransDate).toDate().getDate()]).toDate();
  //     paramFilter = {
  //       // sdate: moment(tranDate).format('YYYYMMDD000000'),
  //       // edate: moment(tranDate).format('YYYYMMDD235959'),
  //       sdate: moment.utc(TransDate).format('YYYYMMDD000000'),
  //       edate: moment.utc(TransDate).format('YYYYMMDD235959'),
  //       dateFrom: dateTran,
  //       dateTo: dateTran,
  //       sites: sites ? sites : this.state.filter.sites,
  //     };
  //   } else {
  //     paramFilter = {
  //       sdate: moment().add(-1, 'days').startOf('day').format('YYYYMMDDHHmmss'),
  //       edate: moment().add(-1, 'days').endOf('day').format('YYYYMMDDHHmmss'),
  //       dateFrom: moment().add(-1, 'days').startOf('day'),
  //       dateTo: moment().add(-1, 'days').endOf('day'),
  //       sites: sites ? sites : this.props.sites,
  //     };
  //   }

  //   let params = {
  //     Site: this.props.sites,
  //     sort: this.state.isSort,
  //     groupby:
  //       this.state.isGroupEmployee == true
  //         ? GroupByException.EMPL
  //         : GroupByException.SITE,
  //     emprisk: this.state.isGroupEmployee == true ? '' : 'emprisk',
  //     page: 1,
  //     psize: this.state.pagesize,
  //     ...paramFilter,
  //   };
  //   return params;
  // }

  render() {
    return <View></View>;
  }
}

export default TransactionFCMView;
