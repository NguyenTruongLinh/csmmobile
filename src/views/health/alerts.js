// ----------------------------------------------------
// <!-- START MODULES -->
import {inject, observer} from 'mobx-react';
import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Image,
  Platform,
  StatusBar,
  Dimensions,
  StyleSheet,
} from 'react-native';

import Ripple from 'react-native-material-ripple';
import {SwipeRow} from 'react-native-swipe-list-view';

// import HeaderWithSearch from '../../components/containers/HeaderWithSearch';
import InputTextIcon from '../../components/controls/InputTextIcon';
// import BackButton from '../../components/controls/BackButton';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSImage from '../../components/containers/CMSImage';
import CMSTextInputModal from '../../components/controls/CMSTextInputModal';
import {IconCustom, ListViewHeight} from '../../components/CMSStyleSheet';

import snackbar from '../../util/snackbar';

import ROUTERS from '../../consts/routes';
import {AlertTypes, DateFormat} from '../../consts/misc';
import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import {No_Image} from '../../consts/images';

import {Comps as CompTxt} from '../../localization/texts';
import {DateTime} from 'luxon';

const ALERTS_GRID_LAYOUT = 3;

// const HEADER_MAX_HEIGHT = Platform.OS !== 'ios' ? 54 : 64;
// const HEADER_MIN_HEIGHT = 35;
// const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

class AlertsView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isListView: true,
      showDismissModal: false,
      selectedAlertForDismiss: null,
    };
    this.rowRefs = {};
    this.lastOpenRowId = null;
  }

  componentDidMount() {
    __DEV__ && console.log('AlertsView componentDidMount');

    this.setHeader();
    this.getData();
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlertsView componentWillUnmount');
  }

  setHeader = () => {
    const {healthStore, navigation} = this.props;
    const {selectedAlertTypeId} = healthStore;
    __DEV__ &&
      console.log(
        'GOND AlertsView setHeader, alertType = ',
        selectedAlertTypeId
      );

    let options = {};
    if (
      selectedAlertTypeId == AlertTypes.DVR_Video_Loss ||
      selectedAlertTypeId == AlertTypes.DVR_Sensor_Triggered
    ) {
      options = {
        ...options,
        headerRight: () => (
          <CMSTouchableIcon
            iconCustom="two-rows-and-three-columns-layout"
            size={22}
            color={CMSColors.ColorText}
            styles={{
              flex: 1,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              // padding: 10,
              // backgroundColor: CMSColors.transparent,
            }}
            onPress={() => {
              this.setState({
                isListView: !this.state.isListView,
              });
            }}
          />
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

  onDismissAlert = description => {
    const {healthStore} = this.props;
    const {selectedAlertForDismiss} = this.state;
    healthStore.dismissAlert(selectedAlertForDismiss, description);
    this.setState({showDismissModal: false, selectedAlertForDismiss: null});
  };

  onCancelDismiss = () => {
    this.setState({showDismissModal: false, selectedAlertForDismiss: null});
  };

  gotoAlertDetail = alert => {};

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
            showDismissModal: true,
          });
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
              domain={this.getSnapShot(item)}
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
              {width: itemWidth, height: itemWidth},
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
    const {healthStore} = this.props;
    const {showDismissModal, isListView} = this.state;

    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={healthStore.alertFilter}
            onChangeText={this.onFilter}
            placeholder={CompTxt.searchPlaceholder}
            iconCustom="searching-magnifying-glass"
            disabled={false}
            iconPosition="right"
          />
        </View>
        <FlatList
          key={isListView ? 'list' : 'grid'}
          renderItem={this.renderItem}
          keyExtractor={item => (isListView ? 'list_' : 'grid_') + item.id}
          data={healthStore.filteredAlerts}
          numColumns={isListView ? 1 : ALERTS_GRID_LAYOUT}
          onRefresh={this.getData}
          refreshing={healthStore.isLoading}
        />
        <CMSTextInputModal
          isVisible={showDismissModal}
          title="Dismiss alert"
          label="Description"
          onSubmit={this.onDismissAlert}
          onCancel={this.onCancelDismiss}
          placeHolder="Dismiss descriptions"
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
