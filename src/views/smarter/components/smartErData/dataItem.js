import React from 'react';
import {Text, View} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';

import CMSRipple from '../../../../components/controls/CMSRipple';
import {IconCustom} from '../../../../components/CMSStyleSheet';
import DataItemDetail from './dataItemDetail';

import styles from '../../styles/smartErStyles';
import theme from '../../../../styles/appearance';

import {formatNumber} from '../../../../util/general';

class DataItem extends React.Component {
  static PropTypes = {
    selectedSiteKey: PropTypes.number,
    loadingDetail: PropTypes.bool,
    onSelectSite: PropTypes.func,
    data: PropTypes.object,
  };

  static defaultProps = {
    selectedSiteKey: false,
    loadingDetail: false,
    onSelectSite: () => {},
    data: {},
  };

  render() {
    const {data, appStore, selectedSiteKey, onSelectSite, loadingDetail} =
      this.props;
    const {appearance} = appStore;

    if (!data) return null;

    return (
      <View>
        <CMSRipple
          delayTime={0}
          rippleOpacity={0.87}
          onPress={() => {
            onSelectSite && onSelectSite(data.siteKey);
          }}>
          <View
            style={[
              styles.siteItemContainer,
              theme[appearance].container,
              theme[appearance].borderColor,
            ]}>
            <View style={styles.siteIconContainer}>
              <IconCustom
                name="sites"
                size={24}
                color={theme[appearance].iconColor}
              />
            </View>
            <View style={styles.siteNameContainer}>
              <Text style={[styles.siteNameText, theme[appearance].text]}>
                {data.siteName}
              </Text>
            </View>
            <View style={styles.siteRiskContainer}>
              <Text style={[styles.siteRiskText, theme[appearance].text]}>
                {formatNumber(data.riskFactor)}
              </Text>
            </View>
          </View>
        </CMSRipple>
        {data.siteKey === selectedSiteKey && (
          <DataItemDetail {...{data, loadingDetail}} />
        )}
      </View>
    );
  }
}

export default inject('appStore')(observer(DataItem));
