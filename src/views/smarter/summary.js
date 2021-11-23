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
  ScrollView,
  TouchableHighlight,
} from 'react-native';
import {inject, observer} from 'mobx-react';
import {HorizontalBarChart} from 'react-native-charts-wrapper';
import Accordion from 'react-native-collapsible/Accordion';
// import * as Animatable from 'react-native-animatable';

import CMSRipple from '../../components/controls/CMSRipple';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import LoadingOverlay from '../../components/common/loadingOverlay';
import {IconCustom} from '../../components/CMSStyleSheet';
import Button from '../../components/controls/Button';

import {formatNumber} from '../../util/general';
import {
  DateFormat,
  ExceptionSortField,
  GroupByException,
} from '../../consts/misc';
import CMSColors from '../../styles/cmscolors';
import {
  SMARTER as SMARTER_TXT,
  COMMON as COMMON_TXT,
} from '../../localization/texts';
import commonStyles from '../../styles/commons.style';

class DashboardView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sortField: ExceptionSortField.RiskFactor,
      showChart: true, // Only 2 modes: show chart or show data
      showFilterModal: false,
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
    // if (!exceptionStore.filterParams) {
    exceptionStore.setDefaultParams(sitesStore.sitesList.map(s => s.key));
    // }
    await exceptionStore.getExceptionsSummary();
  };

  onSelectEmployee = employee => {
    const {exceptionStore, navigation} = this.props;
  };

  renderChart = () => {
    const {exceptionStore} = this.props;
    const {sortField} = this.state;
    const chartData = exceptionStore.exceptionsGroup
      ? exceptionStore.exceptionsGroup.data.slice().sort((a, b) => {
          switch (sortField) {
            case ExceptionSortField.Employee:
              return true;
            case ExceptionSortField.RiskFactor:
              return a.riskFactor > b.riskFactor;
            case ExceptionSortField.TotalAmount:
              return a.totalAmount > b.totalAmount;
            case ExceptionSortField.RatioToSale:
              return a.percentToSale > b.percentToSale;
          }
          return true;
        })
      : [];
    const chartValues = exceptionStore.exceptionsGroup
      ? exceptionStore.exceptionsGroup.data.map(x => {
          switch (sortField) {
            case ExceptionSortField.RiskFactor:
              return x.riskFactor;
            case ExceptionSortField.TotalAmount:
              return x.totalAmount;
            case ExceptionSortField.RatioToSale:
              return x.percentToSale;
          }
          return 0;
        })
      : [];

    return (
      // <Animatable.View ref={r => (this.chartViewRef = r)}>
      <View style={{flex: 1, margin: 10, marginTop: 0}}>
        <HorizontalBarChart
          data={{
            dataSets: [
              {
                values: chartValues,
                label: '',
                config: {
                  color: processColor('#FFC107'),
                  barSpacePercent: 50,
                  barShadowColor: processColor('lightgrey'),
                  highlightAlpha: 90,
                  highlightColor: processColor('#FFC107'),
                  barWidth: 0.5,
                  drawValues: false,
                },
              },
            ],
          }}
          xAxis={{
            valueFormatter: chartData.map(x => x.siteName),
            granularityEnabled: true,
            granularity: 1,
          }}
          yAxis={{
            left: {
              axisMinimum: 0,
              labelCount: 5,
              labelCountForce: true,
              granularity: 1,
              granularityEnabled: true,
            },
            right: {
              axisMinimum: 0,
              labelCount: 5,
              labelCountForce: true,
              granularity: 1,
              granularityEnabled: true,
            },
          }}
          legend={{enabled: false}}
          marker={{
            enabled: true,
            backgroundTint: processColor('gray'),
            markerColor: processColor('#0000008C'),
            textColor: processColor('white'),
            value: '20',
          }}
          style={{flex: 1}}
        />
      </View>
      // </Animatable.View>
    );
  };

  renderGroupHeader = (section, index, isActive) => {
    if (!section) return;
    const {exceptionStore} = this.props;

    return (
      <View>
        <CMSRipple
          rippleOpacity={0.87}
          onPress={() => exceptionStore.onGetEmployee(section.title.siteKey)}>
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
                borderColor: 'rgb(204, 204, 204)',
              },
              isActive == true
                ? {
                    backgroundColor: CMSColors.White,
                    borderBottomWidth: 0,
                  }
                : null,
            ]}>
            <View style={{}}>
              <IconCustom
                name="sites"
                size={24}
                color={CMSColors.IconSiteListRow}
              />
            </View>
            <View style={{}}>
              <Text style={{}}>{section.title.name}</Text>
            </View>
            <View style={{}}>
              <Text style={{}}>{formatNumber(section.title.riskFactor)}</Text>
            </View>
          </View>
        </CMSRipple>
      </View>
    );
  };

  renderGroupItem = ({employee}) => {
    const {exceptionStore} = this.props;

    return (
      <CMSRipple onPress={() => this.onSelectEmployee(employee)} style={{}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            paddingHorizontal: 5,
            paddingVertical: 15,
            backgroundColor: CMSColors.DividerColor16,
            borderBottomWidth: 0.5,
            borderColor: 'rgb(204, 204, 204)',
            //backgroundColor: '#F6F6F6',
          }}>
          <View style={{}}>
            <IconCustom
              name="user-shape"
              size={20}
              color={CMSColors.iconUserListRow}
            />
          </View>

          <View style={{}}>
            <Text style={{}}>{section.EmployerName}</Text>
          </View>
          <View key={this.autoKey()} style={{}}>
            <Text style={{}}>{formatnumber(section.RiskFactor)}</Text>
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

  renderGroupContent = (section, index, isActive) => {
    if (!section.content || section.content.length == 0 || !isActive) return;
    const {exceptionStore} = this.props;

    return (
      <View style={{}}>
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
              {section.title.totalTran.toLocaleString()}
            </Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.textTitleInfo}>Total amount</Text>
            <Text style={styles.textValueInfo}>
              ${section.title.totalAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.textTitleInfo}>Ratio to Sale</Text>
            <Text style={styles.textValueInfo}>
              {section.title.percentToSale}%
            </Text>
          </View>
        </View>
        <FlatList
          data={section.content}
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
          {
            title: {
              // rowID: parseInt(rowID),
              siteKey: item.siteKey,
              name: item.siteName,
              riskFactor: rowData.riskFactor,
              totalTran: rowData.totalTran,
              totalAmount: rowData.totalAmount,
              percentToSale: rowData.percentToSale,
            },
            //Total: rowData.Total,

            content: item.employees,
          },
        ]}
        renderHeader={this.renderGroupHeader}
        renderContent={this.renderGroupContent}
        onChange={() => {}}
        touchableComponent={props => <CMSRipple {...props} />}
      />
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
      this.renderChart()
    );
  };

  renderDataView() {
    const {exceptionStore, sitesStore} = this.props;
    return (
      <View style={{flex: 1}}>
        <FlatList
          data={exceptionStore.exceptionsGroupData}
          renderItem={this.renderDataItem}
          keyExtractor={(item, index) => item.siteKey ?? 'grp_' + index}
          refreshing={exceptionStore.isLoading}
        />
      </View>
    );
  }

  render() {
    const {exceptionStore, sitesStore} = this.props;
    const {showChart} = this.state;
    const content = showChart ? this.renderChartView() : this.renderDataView();

    return (
      <View style={{flex: 1}}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            paddingHorizontal: 7,
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
                this.setState({showChart: !showChart});
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
