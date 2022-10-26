import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
import React, {Component} from 'react';
import {View, FlatList, Dimensions} from 'react-native';

import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
import ItemListView from './components/transactions/itemListView';

import commonStyles from '../../styles/commons.style';
import theme from '../../styles/appearance';
import styles from './styles/transactionsStyles';

import ItemGridView from './components/transactions/itemGridView';

const ALERTS_GRID_LAYOUT = 2;
const {width} = Dimensions.get('window');

class ExceptionsView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isListView: true,
    };
    this._isMounted = false;
    this.currentPage = 1;
    this.reactions = [];
  }

  componentDidMount() {
    __DEV__ && console.log('ExceptionsView componentDidMount');
    this._isMounted = true;

    this.setHeader();
    this.getData();
    this.initReactions();
  }

  initReactions = () => {
    const {exceptionStore, navigation} = this.props;

    this.reactions = [
      reaction(
        () => exceptionStore.selectedEmployee.siteName,
        newSiteName => {
          const {selectedEmployee} = exceptionStore;
          navigation.setOptions({
            headerTitle:
              (selectedEmployee.employeeName &&
              selectedEmployee.employeeName.length > 0
                ? selectedEmployee.employeeName + ' - '
                : '') + selectedEmployee.siteName,
          });
        }
      ),
    ];
  };

  componentWillUnmount() {
    __DEV__ && console.log('ExceptionsView componentWillUnmount');
    this._isMounted = false;

    this.onFilter('');
    this.reactions && this.reactions.forEach(unsubscribe => unsubscribe());
  }

  setHeader = () => {
    const {exceptionStore, navigation, appStore} = this.props;
    const {selectedEmployee} = exceptionStore;
    const {appearance} = appStore;
    const {isListView} = this.state;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader())
      : null;

    let title =
      (selectedEmployee.employeeName && selectedEmployee.employeeName.length > 0
        ? selectedEmployee.employeeName + ' - '
        : '') + selectedEmployee.siteName;
    navigation.setOptions({
      headerTitle:
        width < 440 && title.length > 19
          ? title.substring(0, 18) + '...'
          : title,
      headerRight: () => (
        <View style={commonStyles.headerContainer}>
          <CMSTouchableIcon
            iconCustom={isListView ? 'grid-view-4' : 'view-list-button'}
            size={24}
            color={theme[appearance].iconColor}
            styles={commonStyles.headerIcon}
            onPress={() => {
              this.setState(
                {
                  isListView: !this.state.isListView,
                },
                () => this.setHeader()
              );
            }}
          />
          {searchButton}
        </View>
      ),
    });
  };

  getData = async () => {
    const {exceptionStore} = this.props;

    await exceptionStore.getEmployeeTransactions();
  };

  onFilter = value => {
    const {exceptionStore} = this.props;
    exceptionStore.setTransactionFilter(value);
  };

  onLoadMore = pullDistance => {
    const {exceptionStore} = this.props;

    if (!exceptionStore.isLoading && exceptionStore.hasMore) {
      this.currentPage++;
      __DEV__ &&
        console.log(`onLoadMore this.currentPage = `, this.currentPage);
      exceptionStore.getEmployeeTransactions(
        exceptionStore.selectedEmployee,
        this.currentPage
      );
    }
  };

  renderItemListView = ({item}) => <ItemListView data={item} />;

  renderItemGridView = ({item}) => <ItemGridView data={item} />;

  render() {
    const {exceptionStore, appStore} = this.props;
    const {isListView} = this.state;
    const {appearance} = appStore;

    return (
      <View style={[styles.viewContainer, theme[appearance].container]}>
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
        />
        <FlatList
          key={isListView ? 'list' : 'grid'}
          renderItem={
            isListView ? this.renderItemListView : this.renderItemGridView
          }
          keyExtractor={item => (isListView ? 'list_' : 'grid_') + item.id}
          data={exceptionStore.filteredTransactions}
          numColumns={isListView ? 1 : ALERTS_GRID_LAYOUT}
          onRefresh={() => this.getData()}
          refreshing={
            exceptionStore.isLoading &&
            exceptionStore.filteredTransactions.length == 0
          }
          onEndReached={this.onLoadMore}
          style={{padding: isListView ? 0 : 5}}
        />
      </View>
    );
  }
}

export default inject('exceptionStore', 'appStore')(observer(ExceptionsView));
