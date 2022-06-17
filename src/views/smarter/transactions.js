import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Platform,
  StatusBar,
  Dimensions,
  StyleSheet,
} from 'react-native';

// import Ripple from 'react-native-material-ripple';
import {DateTime} from 'luxon';

import CMSRipple from '../../components/controls/CMSRipple';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSImage from '../../components/containers/CMSImage';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
import {IconCustom, ListViewHeight} from '../../components/CMSStyleSheet';

import {AlertTypes, DateFormat} from '../../consts/misc';
import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import {No_Image} from '../../consts/images';

import {Comps as CompTxt} from '../../localization/texts';
import ROUTERS from '../../consts/routes';

const ALERTS_GRID_LAYOUT = 2;

const {width, height} = Dimensions.get('window');

// const HEADER_MAX_HEIGHT = Platform.OS !== 'ios' ? 54 : 64;
// const HEADER_MIN_HEIGHT = 35;
// const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

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

    // this.props.exceptionStore.onExitAlertsView();
    this.onFilter('');
    this.reactions && this.reactions.forEach(unsubscribe => unsubscribe());
  }

  setHeader = () => {
    const {exceptionStore, navigation} = this.props;
    const {selectedEmployee} = exceptionStore;
    const {isListView} = this.state;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader())
      : null;
    // __DEV__ && console.log('GOND ExceptionsView setHeader');
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
            color={CMSColors.ColorText}
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

  gotoTransactionDetail = trans => {
    const {exceptionStore, navigation} = this.props;
    __DEV__ && console.log('GOND SMARTER Select trans: ', trans);
    exceptionStore.selectTransaction(trans.id);

    navigation.push(ROUTERS.TRANS_DETAIL);
  };

  renderExceptionFlags = trans => {
    if (!trans || trans.exceptionTypes.length === 0) return;
    let reversed = trans.exceptionTypes
      .slice(0, trans.exceptionTypes.length)
      .reverse();
    return reversed.map((flag, index) => (
      <View
        key={'flag_' + index}
        style={[
          styles.flagsContainer,
          {left: index * variables.exceptionFlagOffset},
        ]}>
        <IconCustom size={20} color={flag.color} name="ic_flag_black_48px" />
      </View>
    ));
  };

  renderItemListView = ({item}) => {
    // __DEV__ && console.log('GOND SMARTER render trans item: ', item);

    return (
      <CMSRipple
        style={styles.alertRipple}
        underlayColor={CMSColors.Underlay}
        onPress={() => this.gotoTransactionDetail(item)}>
        <View style={styles.transContainer}>
          <CMSImage
            id={'list_' + item.tranId} //DateTime.now().toMillis()}
            src={!item.isCloud ? item.snapshot : undefined}
            srcUrl={item.isCloud ? item.snapshot : undefined}
            domain={this.props.exceptionStore.getTransactionSnapShot(item)} // {this.getSnapShot(item)}
            dataCompleteHandler={(param, imageData) => {
              if (imageData) {
                item.saveImage(imageData);
              }
            }}
            twoStepsLoading={true}
            styleImage={styles.alertThumb}
            styles={styles.thumbContainer}
          />
          <View style={styles.transInfoContainer}>
            <Text style={styles.transNoText}>#{item.tranNo}</Text>

            <View style={styles.thumbSub}>
              <View style={styles.thumbSubIcon}>
                <IconCustom
                  name="clock-with-white-face"
                  size={12}
                  color={CMSColors.SecondaryText}
                />
              </View>
              <Text style={styles.transDateText}>
                {DateTime.fromISO(item.tranDate, {zone: 'utc'}).toFormat(
                  DateFormat.Alert_Date
                )}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.transInfoFlags}>
          {this.renderExceptionFlags(item)}
        </View>
      </CMSRipple>
    );
  };

  renderItemGridView = ({item}) => {
    const {width} = Dimensions.get('window');
    // const itemPadding = 10;
    const itemWidth = width / ALERTS_GRID_LAYOUT - 15;

    return (
      <CMSRipple
        onPress={() => {
          this.gotoTransactionDetail(item);
        }}
        underlayColor={CMSColors.Underlay}
        style={[
          styles.gridItemContainer,
          {
            width: itemWidth,
          },
        ]}>
        <View
          style={{
            width: itemWidth,
            height: Math.floor((itemWidth * 3) / 4),
            backgroundColor: CMSColors.DividerColor24_HEX,
          }}>
          <CMSImage
            id={'grid_' + item.tranId} //DateTime.now().toMillis()}
            src={item.image ? item.image : undefined}
            styleImage={[
              styles.alertThumbGrid,
              {width: itemWidth, height: Math.floor((itemWidth * 3) / 4)},
            ]}
            styles={styles.gridSnapshot}
            twoStepsLoading={true}
            dataCompleteHandler={(param, image) => {
              if (image) {
                item.saveImage(image);
              }
            }}
            domain={this.props.exceptionStore.getTransactionSnapShot(item)}
          />
        </View>
        <View style={styles.gridInfoContainer}>
          <View style={styles.gridInfoLeft}>
            <Text style={styles.transNoText}>#{item.tranNo}</Text>

            <View style={styles.thumbSub}>
              <View style={styles.thumbSubIcon}>
                <IconCustom
                  name="clock-with-white-face"
                  size={12}
                  color={CMSColors.SecondaryText}
                />
              </View>
              <Text style={styles.transDateText}>
                {DateTime.fromISO(item.tranDate, {zone: 'utc'}).toFormat(
                  DateFormat.Alert_Date
                )}
              </Text>
            </View>
          </View>
          <View style={styles.transInfoFlags}>
            {this.renderExceptionFlags(item)}
          </View>
        </View>
      </CMSRipple>
    );
  };

  render() {
    const {exceptionStore, navigation} = this.props;
    const {/*showDismissModal,*/ isListView} = this.state;

    return (
      <View style={styles.viewContainer}>
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          // value={exceptionStore.alertFilter}
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

const styles = StyleSheet.create({
  viewContainer: {flex: 1, flexDirection: 'column'},
  thumbSub: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbChannelText: {
    fontSize: 16,
    color: CMSColors.PrimaryText,
    marginTop: 0,
  },
  thumbSubIcon: {
    //paddingTop: 5,
    paddingRight: 5,
  },
  thumbSubText: {
    color: CMSColors.SecondaryText,
    fontSize: 12,
    marginBottom: 2,
    //paddingTop: 2
  },
  alertThumbView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CMSColors.White,
    borderBottomWidth: 1,
    borderColor: CMSColors.BorderColorListRow,
    padding: 5,
  },
  alertThumbContainer: {
    margin: 5,
    width: 60,
    height: 60,
    // paddingLeft: 5,
    // marginLeft: 5,
    // marginRight: 20,
  },
  alertThumb: {
    width: 60,
    height: 60,
  },
  alertThumbGrid: {
    width: 150,
    height: 145,
    resizeMode: 'cover',
  },
  backRowRipple: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  backRowView: {
    // flex: 1,
    paddingRight: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  alertRipple: {
    alignItems: 'center',
    backgroundColor: CMSColors.White,
    borderBottomColor: CMSColors.BorderColorListRow,
    borderBottomWidth: variables.borderWidthRow,
    paddingHorizontal: 10,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  thumbContainer: {
    width: 60,
    height: 60,
    backgroundColor: CMSColors.DividerColor24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  transContainer: {
    flex: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  flagsContainer: {
    position: 'absolute',
    backgroundColor: CMSColors.Transparent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transInfoContainer: {flex: 2},
  transNoText: {padding: 2, fontSize: 16},
  transDateText: {
    padding: 2,
    fontSize: 12,
  },
  transInfoFlags: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-end',
    // borderColor: 'red',
    // borderWidth: 1,
  },
  gridItemContainer: {
    // flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CMSColors.White,
    borderColor: CMSColors.BorderColorListRow,
    borderRadius: 2,
    backgroundColor: CMSColors.White,
    flexDirection: 'column',
    ...Platform.select({
      ios: {
        shadowRadius: 2,
        shadowColor: CMSColors.BoxShadow,
      },
      android: {
        elevation: 2,
      },
    }),
    margin: 5,
  },
  gridSnapshot: {flex: 8},
  gridInfoContainer: {flexDirection: 'row', paddingHorizontal: 5},
  gridInfoLeft: {flex: 3},
});

export default inject('exceptionStore')(observer(ExceptionsView));
