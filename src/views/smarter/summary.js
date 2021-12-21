// ----------------------------------------------------
// <!-- START MODULES -->
import React from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  Platform,
  processColor,
  Dimensions,
  ScrollView,
  TouchableHighlight,
} from 'react-native';
import {inject, observer} from 'mobx-react';
import {HorizontalBarChart} from 'react-native-charts-wrapper';
import Accordion from 'react-native-collapsible/Accordion';
// import * as Animatable from 'react-native-animatable';
import Modal from 'react-native-modal';

import CMSRipple from '../../components/controls/CMSRipple';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import LoadingOverlay from '../../components/common/loadingOverlay';
import {
  Icon,
  IconCustom,
  MaterialIcons,
  ListViewHeight,
} from '../../components/CMSStyleSheet';
import Button from '../../components/controls/Button';
import InputTextIcon from '../../components/controls/InputTextIcon';
import ExceptionSearchModal from './FilterModal';
import NoDataView from '../../components/views/NoData';

import {formatNumber, isNullOrUndef} from '../../util/general';
import {
  DateFormat,
  ExceptionSortField,
  ExceptionSortFieldName,
  GroupByException,
  WIDGET_COUNTS,
} from '../../consts/misc';
import CMSColors from '../../styles/cmscolors';
import ROUTERS from '../../consts/routes';
import {
  SMARTER as SMARTER_TXT,
  COMMON as COMMON_TXT,
  Comps as CompTxt,
} from '../../localization/texts';
import commonStyles from '../../styles/commons.style';

class DashboardView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // sortField: ExceptionSortField.RatioToSale,
      showChart: true, // Only 2 modes: show chart or show data
      showSortModal: false,
      showFilterModal: false,
      activeGroup: null,
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
  }

  componentWillUnmount() {
    __DEV__ && console.log('ExceptionsSummaryView componentWillUnmount');
    this._isMounted = false;
  }

  setHeader = () => {
    this.props.navigation.setOptions({
      headerRight: () => (
        <View style={commonStyles.headerContainer}>
          <CMSTouchableIcon
            size={28}
            onPress={() => this.setState({showFilterModal: true})}
            color={CMSColors.ColorText}
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

  onFilter = value => {
    this.props.exceptionStore.setGroupFilter(value);
  };

  onChartEvent = event => {
    event.persist();
    __DEV__ && console.log('GOND on chart click event: ', event);
    if (!event) return;
    const {nativeEvent} = event;
    if (!nativeEvent) return;
    // const selectedItem = nativeEvent.x;
    // if (!selectedItem) return;

    __DEV__ && console.log('GOND on chart click selected item: ', nativeEvent);
    let index = nativeEvent.data
      ? this.props.exceptionStore.filteredGroupsData.findIndex(
          data => data.siteKey == nativeEvent.data.key
        )
      : null;
    if (index < 0) index = null;
    this.onSelectGroup([index]);
    this.setState({showChart: false});
  };

  onSelectEmployee = employee => {
    const {exceptionStore, navigation} = this.props;
    __DEV__ && console.log('GOND onSelectEmployee: ', employee);

    exceptionStore.selectEmployee(employee.id);
    navigation.push(ROUTERS.TRANSACTIONS);
  };

  onSelectGroup = async updatedSections => {
    if (updatedSections.length === 0) {
      this.setState({activeGroup: null});
      return;
    }

    const {exceptionStore} = this.props;
    __DEV__ && console.log('GOND on section changed: ', updatedSections);

    let selectedSection = updatedSections.find(
      idx => idx != this.state.activeGroup
    );
    __DEV__ &&
      console.log('GOND on section changed selectedSection: ', selectedSection);
    if (
      isNullOrUndef(selectedSection) ||
      selectedSection >= exceptionStore.filteredGroupsData.length
    ) {
      __DEV__ &&
        console.log(
          'GOND Error selected section out of bound: ',
          selectedSection
        );
      return;
    }
    const groupData = exceptionStore.filteredGroupsData[selectedSection];
    this.setState(
      {activeGroup: selectedSection, loadingDetail: true},
      async () => {
        await exceptionStore.getGroupDetailData(groupData.siteKey);
        this._isMounted && this.setState({loadingDetail: false});
      }
    );
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

  renderSortModal = () => {
    const {height} = Dimensions.get('window');
    const {showSortModal} = this.state;
    const {exceptionStore} = this.props;
    const {displaySortFields, sortField} = exceptionStore;

    return (
      <Modal
        isVisible={showSortModal}
        onBackdropPress={() => this.setState({showSortModal: false})}
        // onSwipeOut={() => this.setState({showSortModal: false})}
        onBackButtonPress={() => this.setState({showSortModal: false})}
        backdropOpacity={0.5}
        style={[
          styles.sortModal,
          {
            marginTop:
              height - (displaySortFields.length * ListViewHeight + 100),
          },
        ]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{SMARTER_TXT.SORT_MODAL_TITLE}</Text>
        </View>
        <FlatList
          data={displaySortFields}
          keyExtractor={item => 'rsk_' + item}
          renderItem={({item}) => {
            return (
              <CMSRipple
                style={styles.sortItemRipple}
                onPress={() => {
                  exceptionStore.setSortField(item);
                  this.setState({showSortModal: false});
                }}>
                <MaterialIcons
                  name={
                    sortField == item
                      ? 'radio-button-checked'
                      : 'radio-button-unchecked'
                  }
                  color={
                    sortField == item
                      ? CMSColors.PrimaryActive
                      : CMSColors.ColorText
                  }
                  size={20}
                />
                <Text style={styles.sortItemText}>
                  {ExceptionSortFieldName[item]}
                </Text>
              </CMSRipple>
            );
          }}
        />
      </Modal>
    );
  };

  renderGroupHeader = (data, index, isActive) => {
    if (!data) return;
    const {exceptionStore} = this.props;

    return (
      <CMSRipple
        delayTime={0}
        rippleOpacity={0.87}
        onPress={() => {
          // console.log('11111111111111111111111');
          // this.onSelectGroup(data, index);
          if (index == this.state.activeGroup) {
            this.setState({activeGroup: undefined});
          }
        }}>
        <View
          style={[
            {
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 5,
              height: 48,
              backgroundColor: CMSColors.White,
              // borderBottomWidth: 0.5,
              // borderColor: CMSColors.BorderColorListRow,
            },
            // isActive == true
            //   ? {
            //       borderBottomWidth: 0,
            //     }
            //   : {},
          ]}>
          <View style={styles.siteIconContainer}>
            <IconCustom name="sites" size={24} color={CMSColors.PrimaryText} />
          </View>
          <View style={styles.siteNameContainer}>
            <Text style={styles.siteNameText}>{data.siteName}</Text>
          </View>
          <View style={styles.siteRiskContainer}>
            <Text style={styles.siteRiskText}>
              {formatNumber(data.riskFactor)}
            </Text>
          </View>
        </View>
      </CMSRipple>
    );
  };

  renderGroupItem = ({item}) => {
    const {exceptionStore} = this.props;

    return (
      <CMSRipple onPress={() => this.onSelectEmployee(item)} style={{}}>
        <View style={styles.groupItemContainer}>
          <View style={styles.userIconContainer}>
            <IconCustom
              name="user-shape"
              size={20}
              color={CMSColors.iconUserListRow}
            />
          </View>

          <View style={styles.employeeNameContainer}>
            <Text style={styles.employeeNameText}>{item.employeeName}</Text>
          </View>
          <View style={styles.employeeNameRiskContainer}>
            <Text style={styles.employeeNameRiskText}>
              {formatNumber(item.riskFactor)}
            </Text>
            <IconCustom
              name="keyboard-right-arrow-button"
              size={20}
              color={CMSColors.ColorText} // {CMSColors.DividerColor}
            />
          </View>
        </View>
      </CMSRipple>
    );
  };

  renderGroupContent = (data, index, isActive) => {
    if (
      /*data.employees.length == 0 ||*/ !isActive ||
      index != this.state.activeGroup
    )
      return;
    const {exceptionStore} = this.props;
    const {loadingDetail} = this.state;

    return loadingDetail ? (
      <View
        style={{
          flex: 1,
          height: 54,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: CMSColors.White,
          paddingHorizontal: 10,
        }}>
        <LoadingOverlay
          height={48}
          backgroundColor={CMSColors.White}
          indicatorColor={CMSColors.PrimaryActive}
        />
      </View>
    ) : (
      <View style={{flex: 1}}>
        <View style={styles.groupInfoContainer}>
          <View style={styles.itemInfo}>
            <Text style={styles.textTitleInfo}>Total transaction</Text>
            <Text style={styles.textValueInfo}>
              {data.totalTran.toLocaleString()}
            </Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.textTitleInfo}>Total amount</Text>
            <Text style={styles.textValueInfo}>
              ${data.totalAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.textTitleInfo}>Ratio to Sale</Text>
            <Text style={styles.textValueInfo}>{data.percentToSale}%</Text>
          </View>
        </View>
        <FlatList
          data={data.employees}
          renderItem={this.renderGroupItem}
          refreshing={exceptionStore.isLoading}
          keyExtractor={(item, index) => item.employeeId ?? 'empl_' + index}
        />
      </View>
    );
  };

  // renderDataItem = data => {
  //   const {exceptionStore} = this.props;
  //   const {item} = data;

  //   return (
  //     <Accordion
  //       activeSections={[0]}
  //       style={{}}
  //       sections={[
  //         item,
  //         // {
  //         //   title: {
  //         //     // rowID: parseInt(rowID),
  //         //     siteKey: item.siteKey,
  //         //     name: item.siteName,
  //         //     riskFactor: item.riskFactor,
  //         //     totalTran: item.totalTran,
  //         //     totalAmount: item.totalAmount,
  //         //     percentToSale: item.percentToSale,
  //         //   },

  //         //   content: item.employees,
  //         // },
  //       ]}
  //       renderHeader={this.renderGroupHeader}
  //       renderContent={this.renderGroupContent}
  //       onChange={() => {}}
  //       touchableComponent={props => <CMSRipple {...props} />}
  //     />
  //   );
  // };

  renderDataView() {
    const {exceptionStore, sitesStore} = this.props;
    return (
      <View style={{flex: 1}}>
        <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={exceptionStore.groupFilter}
            onChangeText={this.onFilter}
            placeholder={CompTxt.searchPlaceholder}
            iconCustom="searching-magnifying-glass"
            disabled={false}
            iconPosition="right"
          />
        </View>
        <Accordion
          activeSections={[this.state.activeGroup]}
          style={{}}
          sections={exceptionStore.filteredGroupsData}
          renderHeader={this.renderGroupHeader}
          renderContent={this.renderGroupContent}
          renderAsFlatList={true}
          onChange={this.onSelectGroup}
          touchableComponent={props => (
            <CMSRipple {...props} rippleOpacity={0.87} delayTime={0} />
          )}
        />
        {exceptionStore.filteredGroupsData &&
          exceptionStore.filteredGroupsData.length > 0 && (
            <Text style={styles.dummyBugFixingText}>
              {exceptionStore.filteredGroupsData[0].siteName}
            </Text>
          )}
      </View>
    );
  }

  renderChart = () => {
    const {exceptionStore} = this.props;
    __DEV__ &&
      console.log('GOND renderChart chartValues: ', exceptionStore.chartData);
    const backgroundDataSet = exceptionStore.chartData.map(data => ({
      y: exceptionStore.chartData[exceptionStore.chartData.length - 1].value,
      key: data.key,
    }));
    const labelDataSet = exceptionStore.chartData.map(data => ({
      y: 0,
      key: data.key,
    }));

    return (
      // <Animatable.View ref={r => (this.chartViewRef = r)}>
      <HorizontalBarChart
        data={{
          dataSets: [
            {
              values: backgroundDataSet,
              label: '',
              config: {
                color: processColor('rgba(189, 189, 189, 0.24)'),
                // barShadowColor: processColor('lightgrey'),
                highlightAlpha: 90,
                drawValues: false,
              },
            },
            {
              values: exceptionStore.chartData.map(data => ({
                y: data.value,
                key: data.key,
              })),
              label: '',
              config: {
                color: processColor('#FFC107'),
                highlightAlpha: 90,
                highlightColor: processColor('#FFC107'),
                drawValues: false,
                // drawValues: true,
                // valueTextSize: 16,
                // valueTextColor: processColor('black'),
                // visible: true,
                // valueFormatter: exceptionStore.chartData.map(
                //   x => x.name + ' - ' + x.value
                // ),
              },
            },
            {
              values: labelDataSet,
              label: '',
              config: {
                drawValues: true,
                valueTextSize: 14,
                valueTextColor: processColor('black'),
                visible: true,
                valueFormatter: exceptionStore.chartData.map(
                  x => x.name + ' - ' + formatNumber(x.value)
                ),
              },
            },
          ],
          config: {
            barWidth: 0.3,
            // group: {
            //   fromX: 0,
            //   groupSpace: 0.01,
            //   barSpace: 0.001,
            // },
          },
        }}
        xAxis={{
          valueFormatter: exceptionStore.chartData.map(
            x => x.name + ' - ' + formatNumber(x.value)
          ),
          granularityEnabled: true,
          granularity: 1,
          drawLabels: false,
          drawGridLines: false,
          drawAxisLine: false,
          position: 'TOP_INSIDE',
          // centerAxisLabels: true,
        }}
        yAxis={{
          inverted: true,
          left: {
            drawLabels: false,
            // drawGridLines: false,
            // drawAxisLine: false,
          },
          right: {
            // axisMinimum: 0,
            // labelCount: 5,
            // labelCountForce: true,
            // granularity: 1,
            // granularityEnabled: true,
            drawLabels: false,
            drawGridLines: false,
            // drawAxisLine: false,
          },
        }}
        legend={{enabled: false}}
        // marker={{
        //   enabled: true,
        //   // markerColor: processColor('#0000008C'),
        //   textColor: processColor('white'),
        //   textSize: 16,
        // }}
        chartDescription={{text: ''}}
        drawBorders={false}
        // drawGridBackground={false}
        drawValueAboveBar={true}
        onSelect={this.onChartEvent}
        animation={{durationY: 500}}
        style={{flex: 1}}
        // extraOffsets={{
        //   left: 0,
        //   right: 0,
        // }}
      />
      // </Animatable.View>
    );
  };

  renderChartView = () => {
    const {exceptionStore, sitesStore} = this.props;
    return (
      <View style={{flex: 1}}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartHeaderText}>{SMARTER_TXT.TOTAL_RISK}</Text>
          <Text style={styles.chartHeaderRiskValue}>
            {exceptionStore.totalRiskFactors}
          </Text>
        </View>
        <View style={styles.chartContainer}>{this.renderChart()}</View>
      </View>
    );
  };

  render() {
    const {exceptionStore, sitesStore} = this.props;
    const {showChart, showFilterModal} = this.state;
    const isLoading = exceptionStore.isLoading || sitesStore.isLoading;
    const content = isLoading ? (
      <LoadingOverlay
        backgroundColor={CMSColors.White}
        indicatorColor={CMSColors.PrimaryActive}
      />
    ) : showChart ? (
      this.renderChartView()
    ) : (
      this.renderDataView()
    );

    return (
      <View style={{flex: 1}}>
        <View style={styles.topInfoContainer}>
          <View style={styles.calendarIcon}>
            <IconCustom
              name={'power-connection-indicator'}
              color={CMSColors.ColorText}
              size={22}
            />
            <Text style={styles.dateRangeText}>
              {exceptionStore.startDateTime.toFormat(
                DateFormat.POS_Filter_Date
              ) +
                ' - ' +
                exceptionStore.endDateTime.toFormat(DateFormat.POS_Filter_Date)}
            </Text>
          </View>
          {showChart && (
            <View style={{}}>
              {/* <Text style={{marginRight: 7}}>{exceptionStore.sortFieldName}</Text> */}
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
          <View style={styles.mainViewContainer}>
            <View style={{flex: 10}}>{content}</View>
            <View style={{flex: 1}}>
              <Button
                style={styles.switchViewButton}
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
        {this.renderSortModal()}
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

const styles = StyleSheet.create({
  sortModal: {
    flex: 1,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: CMSColors.White,
  },
  modalHeader: {height: 70, alignItems: 'center', justifyContent: 'center'},
  modalTitle: {textAlign: 'center', fontSize: 24, fontWeight: 'bold'},
  sortItemRipple: {
    width: '100%',
    height: ListViewHeight,
    borderBottomWidth: 1,
    borderBottomColor: CMSColors.BorderColorListRow,
    paddingLeft: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortItemText: {marginLeft: 14},
  siteIconContainer: {marginLeft: 19, marginRight: 14},
  siteNameContainer: {
    flex: 1,
    margin: 5,
    minHeight: 40,
    justifyContent: 'center',
    backgroundColor: CMSColors.transparent,
  },
  siteNameText: {
    flexWrap: 'wrap',
    flexShrink: 1,
    fontSize: 16,
    color: CMSColors.PrimaryText,
    backgroundColor: CMSColors.transparent,
  },
  siteRiskContainer: {
    backgroundColor: CMSColors.BtnNumberListRow,
    minWidth: 65,
    height: 24,
    borderRadius: 3,
    // padding: 5,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  siteRiskText: {fontSize: 16, color: CMSColors.TextNumberListRow},
  groupItemContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 15,
    backgroundColor: CMSColors.White, // CMSColors.DividerColor16,
    // borderBottomWidth: 0.5,
    // borderColor: CMSColors.BorderColorListRow,
    //backgroundColor: '#F6F6F6',
  },
  userIconContainer: {
    backgroundColor: CMSColors.Transparent, // CMSColors.DividerColor3,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    // borderRadius: 20,
    // marginLeft: 30,
    // marginRight: 14,
    marginHorizontal: 14,
  },
  employeeNameContainer: {
    flex: 1,
    justifyContent: 'center',
    // marginLeft: 10,
  },
  employeeNameText: {fontSize: 16, color: CMSColors.PrimaryText},
  employeeNameRiskContainer: {
    marginLeft: 10,
    // padding: 5,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  employeeNameRiskText: {
    marginRight: 10,
    fontSize: 16,
    color: CMSColors.Danger,
  },
  groupInfoContainer: {
    height: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: CMSColors.White,
    paddingHorizontal: 10,
    // ...Platform.select({
    //   ios: {
    //     shadowOpacity: 0.3,
    //     shadowRadius: 1,
    //   },
    //   android: {
    //     elevation: 1,
    //     borderTopWidth: 1,
    //     borderBottomWidth: 1,
    //     borderColor: 'rgb(204, 204, 204)',
    //   },
    // }),
  },
  itemInfo: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CMSColors.White,
  },
  textTitleInfo: {
    fontSize: 12,
    color: CMSColors.Dark_Gray,
  },
  textValueInfo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CMSColors.Dark_Gray_2,
  },
  chartHeader: {flex: 1, justifyContent: 'center', alignContent: 'center'},
  chartHeaderText: {fontSize: 16, textAlign: 'center'},
  chartHeaderRiskValue: {fontSize: 35, textAlign: 'center', fontWeight: 'bold'},
  chartContainer: {
    flex: 4,
    marginLeft: -35,
    marginTop: 0,
  },
  topInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarIcon: {flexDirection: 'row'},
  dateRangeText: {marginLeft: 5, fontSize: 16},
  sortButton: {
    height: 42,
    padding: 5,
  },
  mainViewContainer: {flex: 11, backgroundColor: CMSColors.White},
  switchViewButton: {
    height: 42,
    padding: 5,
    backgroundColor: CMSColors.White,
  },
  dummyBugFixingText: {
    display: 'none',
  },
});

export default inject(
  'exceptionStore',
  'sitesStore',
  'userStore'
)(observer(DashboardView));
