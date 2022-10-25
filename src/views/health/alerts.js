import {inject, observer} from 'mobx-react';
import React, {Component} from 'react';
import {View, FlatList} from 'react-native';

import {SwipeRow} from 'react-native-swipe-list-view';
import {reaction} from 'mobx';

import CMSRipple from '../../components/controls/CMSRipple';
import AlertActionModal from './modals/actionsModal';
import AlertDismissModal from './modals/dismissModal';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSImage from '../../components/containers/CMSImage';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
import ContentAlertWithSnapshot from './components/contentAlertWithSnapshot';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import styles from './styles/alertsStyles';
import theme from '../../styles/appearance';

import {AlertTypes} from '../../consts/misc';
import ROUTERS from '../../consts/routes';
import NoDataView from '../../components/views/NoData';
import {NonDismissableAlerts} from '../../stores/health';
import AlertsBackItem from './components/alertsBackItem';
import UnDismissNormalAlertItem from './components/unDismissNormalAlertItem';

const ALERTS_GRID_LAYOUT = 2;

class AlertsView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isListView: true,
      // showDismissModal: false,
      selectedAlertForDismiss: null,
    };
    this.rowRefs = {};
    this.lastOpenRowId = null;
    this._isMounted = false;
    this.reactions = [];
  }

  componentDidMount() {
    const {healthStore} = this.props;
    __DEV__ && console.log('AlertsView componentDidMount');
    this._isMounted = true;

    this.reactions = [
      reaction(
        () =>
          healthStore.selectedSite ? healthStore.selectedSite.siteName : '',
        newSiteName => {
          __DEV__ && console.log('reaction newSiteName = ', newSiteName);
          this.setHeader();
        }
      ),
    ];

    this.setHeader();
    this.getData();
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlertsView componentWillUnmount');
    this._isMounted = false;

    this.props.healthStore.onExitAlertsView();
    this.onFilter('');
    this.reactions && this.reactions.forEach(unsubscribe => unsubscribe());
  }

  setHeader = () => {
    const {healthStore, navigation, appStore} = this.props;
    const {
      selectedAlertTypeId,
      selectedAlertType,
      selectedSite,
      currentSiteName,
      alertsList,
    } = healthStore;
    const {appearance} = appStore;
    const {isListView} = this.state;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader())
      : null;
    __DEV__ &&
      console.log('GOND AlertsView setHeader, selectedSite = ', selectedSite);

    let options = {
      headerTitle: `${
        selectedAlertType
          ? selectedAlertType.name
          : alertsList.length > 0
          ? healthStore.getAlertName(alertsList[0].alertId)
          : ''
      } - ${
        selectedSite ? selectedSite.siteName : currentSiteName ?? 'Unknown site'
      }`,
      headerRight: () => (
        <View style={commonStyles.headerContainer}>{searchButton}</View>
      ),
    };
    if (
      selectedAlertTypeId == AlertTypes.DVR_Video_Loss ||
      selectedAlertTypeId == AlertTypes.DVR_Sensor_Triggered
    ) {
      options = {
        ...options,
        headerRight: () => (
          <View style={commonStyles.headerContainer}>
            <CMSTouchableIcon
              iconCustom={
                isListView
                  ? 'two-rows-and-three-columns-layout'
                  : 'view-list-button'
              }
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
      };
    }

    navigation.setOptions(options);
  };

  getData = async () => {
    const {healthStore} = this.props;

    await healthStore.getAlertsByType();
  };

  onFilter = value => {
    const {healthStore} = this.props;
    healthStore.setAlertFilter(value);
  };

  onRowOpen = data => {
    const rowId = data.id ?? 0;
    __DEV__ &&
      console.log('GOND Health onRowOpen ... ', data, this.lastOpenRowId);

    if (
      this.lastOpenRowId &&
      this.lastOpenRowId != rowId &&
      this.rowRefs[this.lastOpenRowId]
    ) {
      this.rowRefs[this.lastOpenRowId].closeRow();
    }
    this.lastOpenRowId = rowId;
  };

  onBackItemPress = item => {
    this.setState({
      selectedAlertForDismiss: item,
    });
    this.props.healthStore.showDismissModal(true);
  };

  gotoAlertDetail = alert => {
    const {healthStore, navigation} = this.props;
    __DEV__ && console.log('GOND HEALTH Select alert: ', alert);
    healthStore.selectAlert(alert);
    __DEV__ && console.log('GOND HEALTH Select alert 1');
    navigation.push(ROUTERS.HEALTH_ALERT_DETAIL);
  };

  renderNormalAlertItem = (item, canDismiss) => {
    return canDismiss ? (
      this.renderDismissableNormalAlertItem(item)
    ) : (
      <UnDismissNormalAlertItem data={item} />
    );
  };

  renderDismissableNormalAlertItem = item => {
    return (
      <SwipeRow
        onRowOpen={() => this.onRowOpen(item)}
        ref={r => (this.rowRefs[item.id] = r)}
        closeOnRowPress={true}
        disableRightSwipe={true}
        swipeToOpenPercent={10}
        rightOpenValue={-55}>
        <AlertsBackItem onPress={() => this.onBackItemPress(item)} />
        <UnDismissNormalAlertItem data={item} />
      </SwipeRow>
    );
  };

  renderAlertItemWithSnapshot = item => {
    const {healthStore, appStore} = this.props;
    const {appearance} = appStore;
    __DEV__ && console.log('GOND renderAlertItemWithSnapshot: ', item);

    return (
      <SwipeRow
        onRowOpen={() => this.onRowOpen(item)}
        ref={r => (this.rowRefs[item.id] = r)}
        closeOnRowPress={true}
        disableRightSwipe={true}
        swipeToOpenPercent={10}
        rightOpenValue={item.canDismiss ? -55 : 0}>
        <AlertsBackItem onPress={() => this.onBackItemPress(item)} />
        <CMSRipple
          onPress={() => {
            this.gotoAlertDetail(item);
          }}
          underlayColor={CMSColors.Underlay}>
          <View
            style={[
              styles.alertThumbView,
              theme[appearance].container,
              theme[appearance].borderColor,
            ]}>
            <CMSImage
              id={'list_' + item.id} //DateTime.now().toMillis()}
              src={item.image}
              domain={healthStore.getAlertSnapShot(item)} // {this.getSnapShot(item)}
              dataCompleteHandler={(param, image) => {
                if (image) {
                  item.saveImage(image);
                }
              }}
              styleImage={styles.alertThumb}
              styles={styles.alertThumbContainer}
            />
            <ContentAlertWithSnapshot
              alert={item}
              isListView={this.state.isListView}
            />
          </View>
        </CMSRipple>
      </SwipeRow>
    );
  };

  renderAlertItemGridView = item => {
    const {healthStore, appStore} = this.props;
    const {appearance} = appStore;
    __DEV__ && console.log('GOND renderAlertItemWithSnapshot: ', item);

    return (
      <CMSRipple
        onPress={() => {
          this.gotoAlertDetail(item);
        }}
        underlayColor={CMSColors.Underlay}
        style={styles.alertItemGridViewContainer}>
        <View
          style={[
            styles.itemGridViewWrapper,
            theme[appearance].container,
            theme[appearance].borderColor,
          ]}>
          <View style={styles.itemGridViewContentContainer}>
            <CMSImage
              id={'grid_' + item.id} //DateTime.now().toMillis()}
              src={item.image ? item.image : undefined}
              styleImage={[styles.alertThumbGrid, styles.alertThumbGrid_2]}
              styles={{flex: 8}}
              dataCompleteHandler={(param, image) => {
                if (image) {
                  item.saveImage(image);
                }
              }}
              domain={healthStore.getAlertSnapShot(item)} // {this.getSnapShot(item)}
            />
          </View>
          <ContentAlertWithSnapshot
            alert={item}
            isListView={this.state.isListView}
          />
        </View>
      </CMSRipple>
    );
  };

  renderItem = ({item}) => {
    const {healthStore} = this.props;
    const {selectedAlertTypeId} = healthStore;
    const {isListView} = this.state;
    const canDismiss =
      healthStore.selectedAlertType &&
      !NonDismissableAlerts.includes(healthStore.selectedAlertType.alertId);
    switch (selectedAlertTypeId) {
      case AlertTypes.DVR_Video_Loss:
      case AlertTypes.DVR_Sensor_Triggered: // removed
        return isListView
          ? this.renderAlertItemWithSnapshot(item)
          : this.renderAlertItemGridView(item);
      case AlertTypes.DVR_is_off_line:
      case AlertTypes.DVR_Record_Less_Than:
      case AlertTypes.CMSWEB_Door_count_0:
      case AlertTypes.CMSWEB_POS_data_missing:
      // return this.renderNormalAlertItem(item);
      default:
        return this.renderNormalAlertItem(item, canDismiss);
    }
  };

  render() {
    const {healthStore, navigation, appStore} = this.props;
    const {appearance} = appStore;
    const {isListView, selectedAlertForDismiss} = this.state;
    __DEV__ && console.log('GOND alerts: render  ', healthStore.selectedSite);
    if (!healthStore.selectedSite) return null;

    return (
      <View style={[styles.container, theme[appearance].container]}>
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          value={healthStore.alertFilter}
        />
        {healthStore.filteredAlerts.length == 0 ? (
          <NoDataView
            isLoading={healthStore.isLoading}
            style={styles.container}
          />
        ) : (
          <FlatList
            key={isListView ? 'list' : 'grid'}
            renderItem={this.renderItem}
            keyExtractor={item =>
              (isListView ? 'list_' : 'grid_') + item ? item.id : 'unk'
            }
            data={healthStore.filteredAlerts}
            numColumns={isListView ? 1 : ALERTS_GRID_LAYOUT}
            onRefresh={this.getData}
            refreshing={healthStore.isLoading}
            style={{padding: isListView ? 0 : 5}}
          />
        )}
        <AlertActionModal
          data={{
            siteId: healthStore.selectedSite.id,
          }}
          siteAlerts={false}
          navigation={navigation}
        />
        <AlertDismissModal
          selectedAlert={selectedAlertForDismiss}
          callback={() =>
            this._isMounted && this.setState({selectedAlertForDismiss: null})
          }
        />
      </View>
    );
  }
}

export default inject('healthStore', 'appStore')(observer(AlertsView));
