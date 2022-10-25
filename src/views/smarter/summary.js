// ----------------------------------------------------
// <!-- START MODULES -->
import React from 'react';
import {View, Text} from 'react-native';
import {inject, observer} from 'mobx-react';

import CMSRipple from '../../components/controls/CMSRipple';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import LoadingOverlay from '../../components/common/loadingOverlay';
import {IconCustom} from '../../components/CMSStyleSheet';
import Button from '../../components/controls/Button';
import ExceptionSearchModal from './FilterModal';
import NoDataView from '../../components/views/NoData';
import DataView from './components/smartErData/dataView';
import RickFactorTypeModal from './components/rickFactorTypeModal';
import ChartView from './components/smartErChart/chartView';

import CMSColors from '../../styles/cmscolors';
import commonStyles from '../../styles/commons.style';
import theme from '../../styles/appearance';
import styles from './styles/smartErStyles';

import {DateFormat, WIDGET_COUNTS} from '../../consts/misc';
import ROUTERS from '../../consts/routes';
import {SMARTER as SMARTER_TXT} from '../../localization/texts';
import {clientLogID} from '../../stores/user';

class DashboardView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showChart: true, // Only 2 modes: show chart or show data
      showSortModal: false,
      showFilterModal: false,
      selectedSiteKey: null,
      loadingDetail: false,
    };

    this.chartViewRef = null;
    this.dataViewRef = null;
    this._isMounted = false;
  }

  componentDidMount() {
    __DEV__ && console.log('ExceptionsSummaryView componentDidMount');
    this._isMounted = true;
    const {route, navigation, userStore} = this.props;

    __DEV__ &&
      console.log('ExceptionsSummaryView route.params = ', route.params);
    if (
      route.params &&
      route.params.redirect &&
      Object.values(ROUTERS).includes(route.params.redirect)
    ) {
      __DEV__ &&
        console.log(
          'ExceptionsSummaryView navigate to ',
          route.params.redirect
        );
      navigation.navigate({
        name: route.params.redirect,
        params: route.params.params,
      });
    }

    this.setHeader();
    this.getData();
    userStore.resetWidgetCount(WIDGET_COUNTS.SMART_ER);
    userStore.setActivites(clientLogID.SMART_ER);
  }

  componentWillUnmount() {
    __DEV__ && console.log('ExceptionsSummaryView componentWillUnmount');
    this._isMounted = false;
  }

  setHeader = () => {
    const {appearance} = this.props.appStore;

    this.props.navigation.setOptions({
      headerRight: () => (
        <View style={commonStyles.headerContainer}>
          <CMSTouchableIcon
            size={24}
            onPress={() => this.setState({showFilterModal: true})}
            color={theme[appearance].iconColor}
            styles={commonStyles.headerIcon}
            iconCustom="searching-magnifying-glass"
          />
        </View>
      ),
    });
  };

  getData = async () => {
    const {exceptionStore, sitesStore} = this.props;
    if (sitesStore.sitesList.length == 0) {
      await sitesStore.getSiteTree();
    }
    if (!exceptionStore.filterParams) {
      exceptionStore.setDefaultParams(sitesStore.sitesList.map(s => s.key));
    }
    exceptionStore.getExceptionTypes();
    await exceptionStore.getExceptionsSummary();
  };

  onChartEvent = event => {
    event.persist();
    __DEV__ && console.log('GOND on chart click event: ', event);
    if (!event) return;
    const {nativeEvent} = event;
    if (!nativeEvent || !nativeEvent.data || !nativeEvent.data.key) return;
    this.onSelectSite(nativeEvent.data.key);
    this.setState({showChart: false});
  };

  onSelectSite = async siteKey => {
    if (siteKey == this.state.selectedSiteKey) {
      this.setState({selectedSiteKey: null});
      return;
    }
    __DEV__ && console.log(`onSelectSite siteKey = `, siteKey);
    const {exceptionStore} = this.props;
    this.setState({selectedSiteKey: siteKey, loadingDetail: true}, async () => {
      __DEV__ &&
        console.log(`onSelectSite getGroupDetailData siteKey = `, siteKey);
      await exceptionStore.getGroupDetailData(siteKey);
      this._isMounted && this.setState({loadingDetail: false});
    });
  };

  onSubmitFilter = ({dateFrom, dateTo, selectedSites}) => {
    const {exceptionStore} = this.props;
    exceptionStore.setFilterParams({
      sort: exceptionStore.sortField,
      sDate: dateFrom.toFormat(DateFormat.QuerryDateTime),
      eDate: dateTo.toFormat(DateFormat.QuerryDateTime),
      sites: selectedSites,
    });
    __DEV__ &&
      console.log(
        'GOND SmartER onSubmitFilter, sDate: ',
        dateFrom.toISO(),
        exceptionStore.startDateTime
      );

    this.setState({showFilterModal: false});
    this.getData();
  };

  onCloseSortModal = () => {
    this.setState({showSortModal: false});
  };

  render() {
    const {exceptionStore, sitesStore, appStore} = this.props;
    const {showChart, showFilterModal, showSortModal} = this.state;
    const {appearance} = appStore;
    const isLoading = exceptionStore.isLoading || sitesStore.isLoading;
    const content = isLoading ? (
      <LoadingOverlay
        backgroundColor={theme[appearance].container.backgroundColor}
        indicatorColor={CMSColors.PrimaryActive}
      />
    ) : showChart ? (
      <ChartView onChartEvent={this.onChartEvent} />
    ) : (
      <DataView
        selectedSiteKey={this.state.selectedSiteKey}
        onSelectSite={this.onSelectSite}
        loadingDetail={this.state.loadingDetail}
      />
    );

    return (
      <View style={[{flex: 1}, theme[appearance].container]}>
        <View
          style={[styles.topInfoContainer, theme[appearance].headerListRow]}>
          <CMSRipple
            style={styles.calendarIconContainer}
            onPress={() => this.setState({showFilterModal: true})}>
            <IconCustom
              name={'power-connection-indicator'}
              color={theme[appearance].iconColor}
              size={22}
            />
            <Text style={[styles.dateRangeText, theme[appearance].text]}>
              {exceptionStore.startDateTime.toFormat(
                DateFormat.POS_Filter_Date
              ) +
                ' - ' +
                exceptionStore.endDateTime.toFormat(DateFormat.POS_Filter_Date)}
            </Text>
          </CMSRipple>
          {showChart && (
            <View style={{}}>
              <Button
                style={styles.sortButton}
                caption={exceptionStore.sortFieldName}
                type={'flat'}
                enable={true}
                onPress={() => {
                  this.setState({showSortModal: true});
                }}
              />
            </View>
          )}
        </View>
        {exceptionStore.exceptionsGroupData.length == 0 ? (
          <NoDataView isLoading={isLoading} style={{flex: 11}} />
        ) : (
          <View style={[styles.mainViewContainer, theme[appearance].container]}>
            <View style={[{flex: 10}, theme[appearance].container]}>
              {content}
            </View>
            <View style={[{flex: 1}, theme[appearance].container]}>
              <Button
                style={[
                  styles.switchViewButton,
                  theme[appearance].headerListRow,
                ]}
                caption={
                  showChart ? SMARTER_TXT.SHOW_DATA : SMARTER_TXT.SHOW_CHART
                }
                iconCustom="view-list-button"
                iconSize={18}
                type={'flat'}
                enable={true}
                onPress={() => {
                  this.setState({showChart: !showChart});
                }}
              />
            </View>
          </View>
        )}

        <RickFactorTypeModal
          isVisible={showSortModal}
          onClose={this.onCloseSortModal}
        />

        <ExceptionSearchModal
          isVisible={showFilterModal}
          sitesStore={sitesStore}
          sites={sitesStore.sitesList}
          filteredSites={sitesStore.filteredSites}
          dateFrom={exceptionStore.startDateTime}
          dateTo={exceptionStore.endDateTime}
          onDismiss={() => this.setState({showFilterModal: false})}
          onSubmit={this.onSubmitFilter}
        />
      </View>
    );
  }
}

export default inject(
  'exceptionStore',
  'sitesStore',
  'userStore',
  'appStore'
)(observer(DashboardView));
