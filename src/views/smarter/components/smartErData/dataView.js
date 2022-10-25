import React from 'react';
import {FlatList, Text, View} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';

import InputTextIcon from '../../../../components/controls/InputTextIcon';
import NoDataView from '../../../../components/views/NoData';
import DataItem from './dataItem';

import theme from '../../../../styles/appearance';
import styles from '../../styles/smartErStyles';

import {Comps as CompTxt} from '../../../../localization/texts';

class DataView extends React.Component {
  static PropTypes = {
    selectedSiteKey: PropTypes.number,
    loadingDetail: PropTypes.bool,
    onSelectSite: PropTypes.func,
  };

  static defaultProps = {
    selectedSiteKey: false,
    loadingDetail: false,
    onSelectSite: () => {},
  };

  onFilter = value => {
    this.props.exceptionStore.setGroupFilter(value);
  };

  renderSite = ({item}) => {
    const {selectedSiteKey, onSelectSite, loadingDetail} = this.props;
    return (
      <DataItem
        data={item}
        {...{onSelectSite, selectedSiteKey, loadingDetail}}
      />
    );
  };

  render() {
    const {exceptionStore, sitesStore, appStore} = this.props;
    const isLoading = exceptionStore.isLoading || sitesStore.isLoading;
    const {appearance} = appStore;

    return (
      <View style={[{flex: 1}, theme[appearance].container]}>
        <View style={styles.dataSearchContainer}>
          <InputTextIcon
            label=""
            value={exceptionStore.groupFilter}
            onChangeText={this.onFilter}
            placeholder={CompTxt.searchPlaceholder}
            iconCustom="searching-magnifying-glass"
            disabled={false}
            iconPosition="right"
            iconColor={theme[appearance].iconColor}
            iconStyle={styles.iconSearchData}
          />
        </View>
        {exceptionStore.filteredGroupsData.length == 0 ? (
          <NoDataView isLoading={false} style={{flex: 1}} />
        ) : (
          <FlatList
            data={exceptionStore.filteredGroupsData}
            renderItem={this.renderSite}
            refreshing={isLoading}
            keyExtractor={(_, index) => `site_${index}`}
          />
        )}
        {exceptionStore.filteredGroupsData &&
          exceptionStore.filteredGroupsData.length > 0 && (
            <Text style={styles.dummyBugFixingText}>
              {exceptionStore.filteredGroupsData[0].siteName}
            </Text>
          )}
      </View>
    );
  }
}

export default inject(
  'appStore',
  'exceptionStore',
  'sitesStore'
)(observer(DataView));
