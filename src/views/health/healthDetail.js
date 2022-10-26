// ----------------------------------------------------
// <!-- START MODULES -->

import React, {Component} from 'react';
import {View, FlatList, Text} from 'react-native';

import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
import {SwipeRow} from 'react-native-swipe-list-view';

import AlertActionModal from './modals/actionsModal';
import AlertDismissModal from './modals/dismissModal';
import CMSRipple from '../../components/controls/CMSRipple';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import {IconCustom} from '../../components/CMSStyleSheet';

import {getIconAlertType} from '../../util/general';

import commonStyles from '../../styles/commons.style';
import variables from '../../styles/variables';
import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import styles from './styles/healthDetailStyles';
import ROUTERS from '../../consts/routes';

class HealthDetailView extends Component {
  constructor(props) {
    super(props);

    this.state = {
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
        rightOpenValue={item.canDismiss ? -55 : 0}>
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
    const {selectedAlertForDismiss} = this.state;
    const {appearance} = appStore;
    if (!healthStore.selectedSiteAlertTypes)
      return <View style={[{flex: 1}, theme[appearance].container]} />;

    return (
      <View style={[{flex: 1}, theme[appearance].container]}>
        <FlatList
          renderItem={this.renderItem}
          keyExtractor={item => item.alertId}
          data={healthStore.selectedSiteAlertTypes}
          onRefresh={this.getData}
          refreshing={healthStore.isLoading}
        />
        {this.renderActionButton()}
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
      </View>
    );
  }
}

export default inject(
  'userStore',
  'healthStore',
  'appStore'
)(observer(HealthDetailView));
