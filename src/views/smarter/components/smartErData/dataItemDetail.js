import React from 'react';
import {FlatList, Text, View} from 'react-native';

import {inject, observer} from 'mobx-react';

import LoadingOverlay from '../../../../components/common/loadingOverlay';
import DataDetailGroupItem from './dataDetailGroupItem';

import theme from '../../../../styles/appearance';
import styles from '../../styles/smartErStyles';
import CMSColors from '../../../../styles/cmscolors';

import ROUTERS from '../../../../consts/routes';

class DataItemDetail extends React.Component {
  onGroupItemPress = employee => {
    const {exceptionStore, appStore} = this.props;
    __DEV__ && console.log('GOND onSelectEmployee: ', employee);

    exceptionStore.selectEmployee(employee.id);
    appStore.naviService.push(ROUTERS.TRANSACTIONS);
  };

  renderGroupItem = ({item}) => {
    return (
      <DataDetailGroupItem
        data={item}
        onPress={() => this.onGroupItemPress(item)}
      />
    );
  };

  render() {
    const {exceptionStore, appStore, data, loadingDetail} = this.props;
    const {appearance} = appStore;

    return loadingDetail ? (
      <View style={styles.siteDetailLoadingContainer}>
        <LoadingOverlay
          height={48}
          backgroundColor={theme[appearance].modalContainer.backgroundColor}
          indicatorColor={CMSColors.PrimaryActive}
          style={styles.siteLoadingDetail}
        />
      </View>
    ) : (
      <View style={{flex: 1}}>
        <View
          style={[
            styles.groupInfoContainer,
            theme[appearance].modalContainer,
            theme[appearance].borderColor,
          ]}>
          <View style={styles.itemInfo}>
            <Text style={[styles.textTitleInfo, theme[appearance].text]}>
              Total transaction
            </Text>
            <Text style={[styles.textValueInfo, theme[appearance].text]}>
              {data.totalTran.toLocaleString()}
            </Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.textTitleInfo, theme[appearance].text]}>
              Total amount
            </Text>
            <Text style={[styles.textValueInfo, theme[appearance].text]}>
              ${data.totalAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.textTitleInfo, theme[appearance].text]}>
              Ratio to Sale
            </Text>
            <Text style={[styles.textValueInfo, theme[appearance].text]}>
              {data.percentToSale}%
            </Text>
          </View>
        </View>
        <FlatList
          data={data.employees}
          renderItem={this.renderGroupItem}
          refreshing={exceptionStore.isLoading}
          keyExtractor={(item, index) => item.employeeId ?? `empl_${index}`}
        />
      </View>
    );
  }
}

export default inject('appStore', 'exceptionStore')(observer(DataItemDetail));
