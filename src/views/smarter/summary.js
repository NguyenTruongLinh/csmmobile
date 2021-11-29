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

import {formatNumber, isNullOrUndef} from '../../util/general';
import {
  DateFormat,
  ExceptionSortField,
  ExceptionSortFieldName,
  GroupByException,
} from '../../consts/misc';
import CMSColors from '../../styles/cmscolors';
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
    };

    this.chartViewRef = null;
    this.dataViewRef = null;
  }

  componentDidMount() {
    __DEV__ && console.log('ExceptionsSummaryView componentWillUnmount');
    this.getData();
    this.setHeader();
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
    await exceptionStore.getGroupDetailData(groupData.siteKey);
    this.setState({activeGroup: selectedSection});
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
        style={{
          flex: 1,
          marginBottom: 0,
          marginLeft: 0,
          marginRight: 0,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: CMSColors.White,
          marginTop: height - (displaySortFields.length * ListViewHeight + 100),
        }}>
        <View
          style={{height: 70, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{textAlign: 'center', fontSize: 24, fontWeight: 'bold'}}>
            {SMARTER_TXT.SORT_MODAL_TITLE}
          </Text>
        </View>
        <FlatList
          data={displaySortFields}
          keyExtractor={item => 'rsk_' + item}
          renderItem={({item}) => {
            return (
              <CMSRipple
                style={{
                  width: '100%',
                  height: ListViewHeight,
                  borderBottomWidth: 1,
                  borderBottomColor: CMSColors.BorderColorListRow,
                  paddingLeft: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
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
                <Text style={{marginLeft: 14}}>
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
      <View>
        <CMSRipple
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
                borderBottomWidth: 0.5,
                borderColor: CMSColors.BorderColorListRow,
              },
              isActive == true
                ? {
                    borderBottomWidth: 0,
                  }
                : {},
            ]}>
            <View style={{marginLeft: 19, marginRight: 14}}>
              <IconCustom
                name="sites"
                size={24}
                color={CMSColors.PrimaryText}
              />
            </View>
            <View
              style={{
                flex: 1,
                margin: 5,
                minHeight: 40,
                justifyContent: 'center',
                backgroundColor: CMSColors.transparent,
              }}>
              <Text
                style={{
                  flexWrap: 'wrap',
                  flexShrink: 1,
                  fontSize: 16,
                  color: CMSColors.PrimaryText,
                  backgroundColor: CMSColors.transparent,
                }}>
                {data.siteName}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: CMSColors.BtnNumberListRow,
                minWidth: 65,
                height: 24,
                borderRadius: 3,
                // padding: 5,
                margin: 5,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text style={{fontSize: 16, color: CMSColors.TextNumberListRow}}>
                {formatNumber(data.riskFactor)}
              </Text>
            </View>
          </View>
        </CMSRipple>
      </View>
    );
  };

  renderGroupItem = ({item}) => {
    const {exceptionStore} = this.props;

    return (
      <CMSRipple onPress={() => this.onSelectEmployee(item)} style={{}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            paddingHorizontal: 5,
            paddingVertical: 15,
            backgroundColor: CMSColors.DividerColor16,
            borderBottomWidth: 0.5,
            borderColor: CMSColors.BorderColorListRow,
            //backgroundColor: '#F6F6F6',
          }}>
          <View
            style={{
              backgroundColor: CMSColors.DividerColor3,
              justifyContent: 'center',
              alignItems: 'center',
              width: 40,
              height: 40,
              borderRadius: 20,
              marginLeft: 30,
              marginRight: 14,
            }}>
            <IconCustom
              name="user-shape"
              size={20}
              color={CMSColors.iconUserListRow}
            />
          </View>

          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              marginLeft: 10,
            }}>
            <Text style={{fontSize: 16, color: CMSColors.PrimaryText}}>
              {item.employeeName}
            </Text>
          </View>
          <View
            style={{
              marginLeft: 10,
              // padding: 5,
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}>
            <Text
              style={{marginRight: 10, fontSize: 16, color: CMSColors.Danger}}>
              {formatNumber(item.riskFactor)}
            </Text>
            <IconCustom
              style={{}}
              name="keyboard-right-arrow-button"
              size={20}
              color={CMSColors.DividerColor}
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

    return (
      <View style={{flex: 1}}>
        <View
          style={{
            height: 54,
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: CMSColors.White,
            paddingHorizontal: 10,
            ...Platform.select({
              ios: {
                shadowOpacity: 0.3,
                shadowRadius: 1,
              },
              android: {
                elevation: 1,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: 'rgb(204, 204, 204)',
              },
            }),
          }}>
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

  renderDataItem = data => {
    const {exceptionStore} = this.props;
    const {item} = data;

    return (
      <Accordion
        activeSections={[0]}
        style={{}}
        sections={[
          item,
          // {
          //   title: {
          //     // rowID: parseInt(rowID),
          //     siteKey: item.siteKey,
          //     name: item.siteName,
          //     riskFactor: item.riskFactor,
          //     totalTran: item.totalTran,
          //     totalAmount: item.totalAmount,
          //     percentToSale: item.percentToSale,
          //   },

          //   content: item.employees,
          // },
        ]}
        renderHeader={this.renderGroupHeader}
        renderContent={this.renderGroupContent}
        onChange={() => {}}
        touchableComponent={props => <CMSRipple {...props} />}
      />
    );
  };

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
          onChange={this.onSelectGroup}
          touchableComponent={props => <CMSRipple {...props} delayTime={0} />}
        />
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
              values: labelDataSet,
              label: '',
              config: {
                drawValues: true,
                valueTextSize: 16,
                valueTextColor: processColor('black'),
                visible: true,
                valueFormatter: exceptionStore.chartData.map(
                  x => x.name + ' - ' + x.value
                ),
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
                // barShadowColor: processColor('lightgrey'),
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
          ],
          config: {barWidth: 0.14},
        }}
        xAxis={{
          valueFormatter: exceptionStore.chartData.map(
            x => x.name + ' - ' + x.value
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
          left: {
            drawLabels: false,
            drawGridLines: false,
            drawAxisLine: false,
          },
          right: {
            // axisMinimum: 0,
            // labelCount: 5,
            // labelCountForce: true,
            // granularity: 1,
            // granularityEnabled: true,
            drawLabels: false,
            drawGridLines: false,
            drawAxisLine: false,
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
        drawGridBackground={false}
        drawValueAboveBar={true}
        onSelect={this.onChartEvent}
        style={{flex: 1}}
      />
      // </Animatable.View>
    );
  };

  renderChartView = () => {
    const {exceptionStore, sitesStore} = this.props;
    return exceptionStore.isLoading || sitesStore.isLoading ? (
      <LoadingOverlay
        backgroundColor={CMSColors.White}
        indicatorColor={CMSColors.PrimaryActive}
      />
    ) : (
      <View style={{flex: 1}}>
        <View
          style={{flex: 1, justifyContent: 'center', alignContent: 'center'}}>
          <Text style={{fontSize: 16, textAlign: 'center'}}>
            {SMARTER_TXT.TOTAL_RISK}
          </Text>
          <Text style={{fontSize: 35, textAlign: 'center', fontWeight: 'bold'}}>
            {exceptionStore.totalRiskFactors}
          </Text>
        </View>
        <View
          style={{
            flex: 4,
            margin: 10,
            marginTop: 0,
            // borderColor: CMSColors.DividerColor,
            // borderWidth: 1,
          }}>
          {this.renderChart()}
        </View>
      </View>
    );
  };

  render() {
    const {exceptionStore, sitesStore} = this.props;
    const {showChart, showFilterModal} = this.state;
    const content = showChart ? this.renderChartView() : this.renderDataView();

    return (
      <View style={{flex: 1}}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            paddingHorizontal: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View style={{flexDirection: 'row'}}>
            <IconCustom
              name={'power-connection-indicator'}
              color={CMSColors.ColorText}
              size={22}
            />
            <Text style={{marginLeft: 5, fontSize: 16}}>
              {exceptionStore.startDateTime.toFormat(
                DateFormat.POS_Filter_Date
              ) +
                ' - ' +
                exceptionStore.endDateTime.toFormat(DateFormat.POS_Filter_Date)}
            </Text>
          </View>
          <View style={{}}>
            {/* <Text style={{marginRight: 7}}>{exceptionStore.sortFieldName}</Text> */}
            <Button
              style={{
                height: 42,
                padding: 5,
              }}
              caption={exceptionStore.sortFieldName}
              type={'flat'}
              enable={true}
              onPress={() => {
                this.setState({showSortModal: true});
              }}
            />
          </View>
        </View>
        <View style={{flex: 11, backgroundColor: CMSColors.White}}>
          <View style={{flex: 10}}>{content}</View>
          <View style={{flex: 1}}>
            <Button
              style={{
                height: 42,
                padding: 5,
              }}
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
});

export default inject('exceptionStore', 'sitesStore')(observer(DashboardView));
