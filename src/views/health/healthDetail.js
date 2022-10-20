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
import {reaction} from 'mobx';

import {SwipeRow} from 'react-native-swipe-list-view';
// import Ripple from 'react-native-material-ripple';

import CMSRipple from '../../components/controls/CMSRipple';
import AlertActionModal from './modals/actionsModal';
import AlertDismissModal from './modals/dismissModal';
// import InputTextIcon from '../../components/controls/InputTextIcon';
import CMSTextInputModal from '../../components/controls/CMSTextInputModal';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import {IconCustom, ListViewHeight} from '../../components/CMSStyleSheet';

import {getIconAlertType} from '../../util/general';

import commonStyles from '../../styles/commons.style';
import variables from '../../styles/variables';
import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import ROUTERS from '../../consts/routes';
const RowEmpty = {isEmpty: true};

class HealthDetailView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // showActionsModal: false,
      // showDismissModal: false,
      dismissDescription: '',
      selectedAlertForDismiss: null,
    };
    this._isMounted = false;
    this.rowRefs = {};
    this.lastOpenRowId = null;
    this.reactions = [];
  }

  componentDidMount() {
    const {navigation, healthStore} = this.props;
    __DEV__ && console.log('HealthDetailView componentDidMount');
    this._isMounted = true;

    navigation.setOptions({
      headerTitle: healthStore.selectedSite
        ? healthStore.selectedSite.siteName
        : healthStore.currentSiteName,
    });
    this.initReactions();
    if (!healthStore.isFromNotification) this.getData();
  }

  componentWillUnmount() {
    __DEV__ && console.log('HealthDetailView componentWillUnmount');
    this._isMounted = false;

    const {healthStore} = this.props;
    this.reactions && this.reactions.forEach(unsubscribe => unsubscribe());

    healthStore.onExitHealthDetail();
  }

  initReactions = () => {
    const {healthStore, navigation} = this.props;

    this.reactions = [
      reaction(
        () => healthStore.selectedSite,
        newSite => {
          if (newSite == null && this._isMounted) navigation.goBack();
        }
      ),
      reaction(
        () =>
          healthStore.selectedSite ? healthStore.selectedSite.siteName : '',
        newSiteName => {
          navigation.setOptions({
            headerTitle: newSiteName || healthStore.currentSiteName,
          });
        }
      ),
    ];
  };

  getData = async () => {
    const {userStore, healthStore} = this.props;

    if (!userStore.settings || userStore.settings.alertTypes.length == 0) {
      await userStore.getAlertTypesSettings();
    }

    // Use saved alertTypes in healthStore
    await healthStore.getHealthDetail();
  };

  onRowOpen = data => {
    const rowId = data.alertId ?? 0;
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

  onAlertTypeSelected = data => {
    const {healthStore, navigation} = this.props;
    healthStore.selectAlertType(data);
    navigation.push(ROUTERS.HEALTH_ALERTS);
  };

  renderActionButton = () => {
    return (
      <View style={commonStyles.floatingActionButton}>
        <CMSTouchableIcon
          iconCustom="grid-view-9"
          onPress={() => {
            // this.setState({showActionsModal: true})
            this.props.healthStore.showActionsModal(true);
          }}
          size={28}
          color={CMSColors.White}
        />
      </View>
    );
  };

  renderItem = ({item}) => {
    const {appearance} = this.props.appStore;
    __DEV__ && console.log('GOND healthDetail renderItem ', item);
    if (
      (item.computedTotalFromChildren != null &&
        item.computedTotalFromChildren <= 0) ||
      (!item.computedTotalFromChildren && item.total <= 0)
    )
      return null;
    const rowId = item.alertId ?? 0;
    const alertIcon = getIconAlertType(item.alertId);

    return (
      <SwipeRow
        onRowOpen={() => this.onRowOpen(item)}
        ref={r => (this.rowRefs[rowId] = r)}
        closeOnRowPress={true}
        disableRightSwipe={true}
        swipeToOpenPercent={10}
        rightOpenValue={item.canDismiss ? -55 : 0}
        // tension={2}
        // friction={3}
      >
        <View
          style={[
            styles.backRowContainer,
            theme[appearance].modalContainer,
            theme[appearance].borderColor,
          ]}>
          <View style={styles.dismissButton}>
            {item.canDismiss && (
              <CMSTouchableIcon
                iconCustom="double-tick-indicator"
                size={26}
                onPress={() => {
                  this.setState({
                    selectedAlertForDismiss: item,
                    // showDismissModal: true,
                  });
                  this.props.healthStore.showDismissModal(true);
                }}
                color={CMSColors.Dismiss}
              />
            )}
          </View>
        </View>
        <CMSRipple
          rippleOpacity={0.8}
          onPress={() => this.onAlertTypeSelected(item)}
          style={[
            styles.frontRowRipple,
            theme[appearance].container,
            theme[appearance].borderColor,
          ]}>
          <View style={styles.frontRowIcon}>
            <IconCustom
              name={alertIcon}
              color={theme[appearance].iconColor}
              size={variables.fix_fontSize_Icon}
            />
            <Text style={[styles.itemText, theme[appearance].text]}>
              {item.name}
            </Text>
          </View>
          <View style={styles.frontRowInfoContainer}>
            <Text style={styles.frontRowText}>
              {item.computedTotalFromChildren != null
                ? item.computedTotalFromChildren
                : item.total}
            </Text>
            <IconCustom
              name="keyboard-right-arrow-button"
              color={theme[appearance].iconColor}
              size={variables.fix_fontSire}
            />
          </View>
        </CMSRipple>
      </SwipeRow>
    );
  };

  render() {
    const {healthStore, navigation, appStore} = this.props;
    const {/*showDismissModal,*/ selectedAlertForDismiss} = this.state;
    const {appearance} = appStore;
    // __DEV__ &&
    //   console.log(
    //     'GOND render Health detail: ',
    //     healthStore.selectedSiteAlertTypes
    //   );
    if (!healthStore.selectedSiteAlertTypes)
      return <View style={[{flex: 1}, theme[appearance].container]} />;

    return (
      <View style={[{flex: 1}, theme[appearance].container]}>
        {/* <KeyboardAwareScrollView
          contentContainerStyle={{flex: 1}}
          enableOnAndroid={true}> */}
        <FlatList
          renderItem={this.renderItem}
          keyExtractor={item => item.alertId}
          data={healthStore.selectedSiteAlertTypes}
          onRefresh={this.getData}
          refreshing={healthStore.isLoading}
        />
        {this.renderActionButton()}
        {/* {this.renderActionsModal()} */}
        {/* <CMSTextInputModal
          isVisible={showDismissModal}
          title="Dismiss alert"
          label="Description"
          onSubmit={this.onDismissAlert}
          onCancel={this.onCancelDismiss}
          placeHolder="Dismiss descriptions"
        /> */}
        <AlertActionModal
          data={
            healthStore.selectedSite
              ? {
                  siteId: healthStore.selectedSite.id,
                }
              : null
          }
          siteAlerts={true}
          navigation={navigation}
        />
        <AlertDismissModal
          selectedAlertType={selectedAlertForDismiss}
          callback={() =>
            this._isMounted && this.setState({selectedAlertForDismiss: null})
          }
        />
        {/* </KeyboardAwareScrollView> */}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  actionContainer: {},
  actionModal: {
    flex: 1,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'flex-start',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: CMSColors.White,
  },
  actionRowContainer: {
    width: '100%',
    height: ListViewHeight,
    borderBottomWidth: 1,
    borderBottomColor: CMSColors.BorderColorListRow,
    paddingLeft: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {marginLeft: 14},
  actionButtonContainer: {
    position: 'absolute',
    right: 35,
    bottom: 28,
    width: 63,
    height: 63,
    borderRadius: 45,
    backgroundColor: CMSColors.PrimaryActive,
    justifyContent: 'center',
    alignItems: 'center',
    // android's shadow
    elevation: 5,
    // ios's shadow check later
    shadowOffset: {width: 14, height: 14},
    shadowColor: 'black',
    shadowOpacity: 0.7,
    shadowRadius: 45,
  },
  backRowContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: ListViewHeight,
    borderBottomWidth: 1,
  },
  dismissButton: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frontRowRipple: {
    flex: 1,
    height: ListViewHeight + 2,
    backgroundColor: CMSColors.White,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'flex-start',
    paddingLeft: 16,
    // borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: CMSColors.BorderColorListRow,
  },
  frontRowIcon: {
    flex: 1,
    flexDirection: 'row',
    // backgroundColor: CMSColors.Transparent,
  },
  frontRowInfoContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    width: ListViewHeight - 15,
    height: ListViewHeight - 15,
    marginRight: 14,
    flexDirection: 'row',
    // backgroundColor: CMSColors.BtnNumberListRow,
  },
  frontRowText: {
    fontSize: 16,
    fontWeight: '500',
    color: CMSColors.TotalAlerts,
  },
  itemText: {fontSize: 16, fontWeight: '500', paddingLeft: 14},
});

export default inject(
  'userStore',
  'healthStore',
  'appStore'
)(observer(HealthDetailView));
