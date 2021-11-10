import {inject, observer} from 'mobx-react';
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

import Ripple from 'react-native-material-ripple';
import {SwipeRow} from 'react-native-swipe-list-view';
import {DateTime} from 'luxon';

import AlertActionModal from './modals/actionsModal';
import AlertDismissModal from './modals/dismissModal';
// import HeaderWithSearch from '../../components/containers/HeaderWithSearch';
import InputTextIcon from '../../components/controls/InputTextIcon';
// import BackButton from '../../components/controls/BackButton';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSImage from '../../components/containers/CMSImage';
// import CMSTextInputModal from '../../components/controls/CMSTextInputModal';
import {IconCustom, ListViewHeight} from '../../components/CMSStyleSheet';
import CMSSearchbar from '../../components/containers/CMSSearchbar';

import {AlertTypes, DateFormat} from '../../consts/misc';
import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import {No_Image} from '../../consts/images';

import {Comps as CompTxt} from '../../localization/texts';
import ROUTERS from '../../consts/routes';

const ALERTS_GRID_LAYOUT = 2;

// const HEADER_MAX_HEIGHT = Platform.OS !== 'ios' ? 54 : 64;
// const HEADER_MIN_HEIGHT = 35;
// const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

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
  }

  componentDidMount() {
    __DEV__ && console.log('AlertsView componentDidMount');
    this._isMounted = true;

    this.setHeader();
    this.getData();
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlertsView componentWillUnmount');
    this._isMounted = false;

    this.props.healthStore.onExitAlertsView();
  }

  setHeader = () => {
    const {healthStore, navigation} = this.props;
    const {
      selectedAlertTypeId,
      selectedAlertType,
      selectedSite,
      currentSiteName,
      alertsList,
    } = healthStore;
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
      };
    }

    navigation.setOptions(options);
  };

  getData = async () => {
    const {healthStore} = this.props;
    if (healthStore.isFromNotification) return;

    await healthStore.getAlertsByType();
  };

  onFilter = value => {
    const {healthStore} = this.props;
    healthStore.setAlertFilter(value);
  };

  onRowOpen = data => {
    const rowId = data.id ?? 0;
    __DEV__ && console.log('GOND Health onRowOpen ... ', this.lastOpenRowId);

    if (
      this.lastOpenRowId &&
      this.lastOpenRowId != rowId &&
      this.rowRefs[this.lastOpenRowId]
    ) {
      this.rowRefs[this.lastOpenRowId].closeRow();
    }
    this.lastOpenRowId = rowId;
  };

  // onDismissAlert = description => {
  //   const {healthStore} = this.props;
  //   const {selectedAlertForDismiss} = this.state;
  //   healthStore.dismissAlert(selectedAlertForDismiss, description);
  //   this.setState({showDismissModal: false, selectedAlertForDismiss: null});
  // };

  // onCancelDismiss = () => {
  //   this.setState({showDismissModal: false, selectedAlertForDismiss: null});
  // };

  gotoAlertDetail = alert => {
    const {healthStore, navigation} = this.props;
    __DEV__ && console.log('GOND HEALTH Select alert: ', alert);
    healthStore.selectAlert(alert);
    __DEV__ && console.log('GOND HEALTH Select alert 1');
    navigation.push(ROUTERS.HEALTH_ALERT_DETAIL);
  };

  getSnapShot = alert => {
    if (!alert) return;
    const {selectedAlertTypeId} = this.props.healthStore;

    if (selectedAlertTypeId == AlertTypes.DVR_Sensor_Triggered)
      return {
        controller: 'alert',
        action: 'imagetime',
        id: alert.timezone,
        param: {
          thumb: true,
          download: false,
          next: false,
          kdvr: alert.KDVR,
          ch: alert.ChannelNo,
        },
        no_img: No_Image,
      };
    return {
      controller: 'channel',
      action: 'image',
      param: null,
      id: alert.kChannel,
      no_img: No_Image,
    };
  };

  renderNormalAlertItem = item => {
    return (
      <Ripple style={styles.alertRipple} underlayColor={CMSColors.Underlay}>
        <View style={styles.alertContainer}>
          <View style={styles.alertIconContainer}>
            <IconCustom name="icon-dvr" size={36} color={CMSColors.Dark_Gray} />
          </View>
          <View style={{flex: 2}}>
            <Text style={{padding: 2, fontSize: 16}}>{item.dvr.name}</Text>

            <View style={styles.thumbSub}>
              <View style={styles.thumbSubIcon}>
                <IconCustom
                  name="clock-with-white-face"
                  size={12}
                  color={CMSColors.SecondaryText}
                />
              </View>
              <Text
                style={{
                  padding: 2,
                  fontSize: 12,
                }}>
                {DateTime.fromISO(item.timezone).toFormat(
                  DateFormat.Alert_Date
                )}
              </Text>
            </View>
          </View>
        </View>
      </Ripple>
    );
  };

  renderBackItem = item => {
    return (
      <Ripple
        style={styles.backRowRipple}
        onPress={() => {
          this.setState({
            selectedAlertForDismiss: item,
            // showDismissModal: true,
          });
          this.props.healthStore.showDismissModal(true);
        }}>
        {/* <View style={{flex: 1, padding: 5, justifyContent: 'center'}}> */}
        <View style={styles.backRowView}>
          <IconCustom
            name="double-tick-indicator"
            size={24}
            color={CMSColors.Dismiss}
          />
        </View>
        {/* </View> */}
      </Ripple>
    );
  };

  renderContentAlertWithSnapshot = alert => {
    const {isListView} = this.state;
    // __DEV__ && console.log('GOND renderContentAlertWithSnapshot: ', alert);

    const containerStyle = isListView
      ? {flex: 2}
      : {
          backgroundColor: CMSColors.transparent,
          paddingLeft: 5,
          paddingBottom: 5,
        };
    const numberOfLines = isListView ? 0 : 1;

    return (
      <View style={containerStyle}>
        <Text numberOfLines={numberOfLines} style={styles.thumbChannelText}>
          {alert.channelName}
        </Text>

        <View style={styles.thumbSub}>
          <View style={styles.thumbSubIcon}>
            <IconCustom
              name="icon-dvr"
              size={12}
              color={CMSColors.SecondaryText}
            />
          </View>
          <Text style={styles.thumbSubText}>{alert.dvr.name}</Text>
        </View>

        <View style={styles.thumbSub}>
          <View style={styles.thumbSubIcon}>
            <IconCustom
              name="clock-with-white-face"
              size={12}
              color={CMSColors.SecondaryText}
            />
          </View>
          <Text style={styles.thumbSubText}>
            {DateTime.fromISO(alert.timezone).toFormat(DateFormat.Alert_Date)}
          </Text>
        </View>
      </View>
    );
  };

  renderAlertItemWithSnapshot = item => {
    const {healthStore} = this.props;

    return (
      <SwipeRow
        onRowOpen={() => this.onRowOpen(item)}
        ref={r => (this.rowRefs[item.id] = r)}
        closeOnRowPress={true}
        disableRightSwipe={true}
        swipeToOpenPercent={10}
        rightOpenValue={item.canDismiss ? -55 : 0}>
        {this.renderBackItem(item)}
        <Ripple
          onPress={() => {
            this.gotoAlertDetail(item);
          }}
          underlayColor={CMSColors.Underlay}>
          <View style={styles.alertThumbView}>
            <CMSImage
              id={'list_' + DateTime.now().toMillis()}
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
            {this.renderContentAlertWithSnapshot(item)}
          </View>
        </Ripple>
      </SwipeRow>
    );
  };

  renderAlertItemGridView = item => {
    const {width} = Dimensions.get('window');
    const itemPadding = 10;
    const itemWidth = width / ALERTS_GRID_LAYOUT - 2 * itemPadding;

    return (
      <Ripple
        onPress={() => {
          this.gotoAlertDetail(item);
        }}
        underlayColor={CMSColors.Underlay}
        style={{flex: 1}}>
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: CMSColors.White,
            borderColor: CMSColors.BorderColorListRow,
            padding: itemPadding,
          }}>
          <CMSImage
            id={'grid_' + DateTime.now().toMillis()}
            src={item.image ? item.image : undefined}
            styleImage={[
              styles.alertThumbGrid,
              {width: itemWidth, height: Math.floor((itemWidth * 9) / 16)},
            ]}
            styles={{flex: 8}}
            dataCompleteHandler={(param, image) => {
              if (image) {
                item.saveImage(image);
              }
            }}
            domain={this.getSnapShot(item)}
          />
          {this.renderContentAlertWithSnapshot(item)}
        </View>
      </Ripple>
    );
  };

  renderItem = ({item}) => {
    const {healthStore} = this.props;
    const {selectedAlertTypeId} = healthStore;
    const {isListView} = this.state;

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
        return this.renderNormalAlertItem(item);
    }
  };

  render() {
    const {healthStore, navigation} = this.props;
    const {/*showDismissModal,*/ isListView, selectedAlertForDismiss} =
      this.state;

    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        {/* <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={healthStore.alertFilter}
            onChangeText={this.onFilter}
            placeholder={CompTxt.searchPlaceholder}
            iconCustom="searching-magnifying-glass"
            disabled={false}
            iconPosition="right"
          />
        </View> */}
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          value={healthStore.alertFilter}
        />
        <FlatList
          key={isListView ? 'list' : 'grid'}
          renderItem={this.renderItem}
          keyExtractor={item => (isListView ? 'list_' : 'grid_') + item.id}
          data={healthStore.filteredAlerts}
          numColumns={isListView ? 1 : ALERTS_GRID_LAYOUT}
          onRefresh={this.getData}
          refreshing={healthStore.isLoading}
        />
        {/* <CMSTextInputModal
          isVisible={showDismissModal}
          title="Dismiss alert"
          label="Description"
          onSubmit={this.onDismissAlert}
          onCancel={this.onCancelDismiss}
          placeHolder="Dismiss descriptions"
        /> */}
        <AlertActionModal
          data={healthStore.selectedAlertType}
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

const styles = StyleSheet.create({
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
    resizeMode: 'contain',
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
    justifyContent: 'center',
  },
  alertIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: CMSColors.DividerColor24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  alertContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
  },
});

export default inject('healthStore')(observer(AlertsView));
