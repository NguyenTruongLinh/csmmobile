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
import LoadingOverlay from '../../components/common/loadingOverlay';
import {IconCustom} from '../../components/CMSStyleSheet';
import Button from '../../components/controls/Button';

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
    navigation.setOptions({
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
    exceptionStore.setDefaultParams(
      sitesStore.sitesList.map(s => s.key).toString()
    );
    // }
    await exceptionStore.getExceptionsSummary();
  };

  renderChart = () => {
    const {exceptionStore} = this.props;
    const {sortField} = this.state;
    const chartData = exceptionStore.exceptionsGroup
      ? exceptionStore.exceptionsGroup.data.sort((a, b) => {
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
      <View style={{flex: 1}}>
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
        />
      </View>
      // </Animatable.View>
    );
  };

  renderChartView = () => {
    const {exceptionStore, sitesStore} = this.props;
    return exceptionStore.isLoading || sitesStore.isLoading ? (
      <LoadingOverlay />
    ) : (
      <View style={{flex: 1}}></View>
    );
  };

  renderDataView() {
    const {exceptionStore, sitesStore} = this.props;
    return <View style={{flex: 1}}></View>;
  }

  render() {
    const {exceptionStore, sitesStore} = this.props;
    const {showChart} = this.state;
    const content = showChart ? this.renderChartView() : this.renderDataView();

    return (
      <View style={{flex: 1}}>
        <View style={{flex: 1, flexDirection: 'row'}}>
          <IconCustom
            name={'power-connection-indicator'}
            color={CMSColors.ColorText}
            size={16}
          />
          <Text style={{marginLeft: 5}}>
            {exceptionStore.startDateTime.toFormat(DateFormat.POS_Filter_Date)}{' '}
            - {exceptionStore.endDateTime.toFormat(DateFormat.POS_Filter_Date)}
          </Text>
          <View style={{alignItems: 'flex-end'}}>
            <Text style={{marginRight: 7}}>{exceptionStore.sortFieldName}</Text>
          </View>
        </View>
        <View style={{flex: 11}}>
          <View style={{flex: 10}}>{content}</View>
          <View style={{flex: 1}}>
            <Button
              style={{
                height: 42,
                // minWidth: 36,
                // marginRight: 5,
                padding: 5,
                // backgroundColor: CMSColors.DividerColor24_HEX,
              }}
              caption={
                showChart ? SMARTER_TXT.SHOW_DATA : SMARTER_TXT.SHOW_CHART
              }
              iconCustom="view-list-button"
              iconSize={18}
              type={hasStatus ? 'primary' : 'flat'}
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

const styles = StyleSheet.create({});

export default inject('exceptionStore', 'sitesStore')(observer(DashboardView));
