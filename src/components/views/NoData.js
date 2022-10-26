'use strict';

import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';

import PropTypes from 'prop-types';
import {inject, observer} from 'mobx-react';

import LoadingOverlay from '../common/loadingOverlay';
import {No_Data} from '../../consts/images';

import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import {COMMON as COMMON_TXT} from '../../localization/texts';

class NoDataView extends React.Component {
  static propTypes = {
    height: PropTypes.number,
  };

  constructor(props) {
    super(props);

    this.state = {
      height: 0,
    };
  }

  onLayout = ({nativeEvent}) => {
    const {height} = nativeEvent.layout;

    this.setState({height});
  };

  render() {
    const {isLoading, appStore} = this.props;
    const {appearance} = appStore;

    return (
      <View
        style={[styles.noDataContainer, this.props.style]}
        onLayout={this.onLayout}>
        {isLoading ? (
          <LoadingOverlay
            backgroundColor={theme[appearance].container}
            indicatorColor={CMSColors.PrimaryActive}
          />
        ) : (
          <View style={styles.contentContainer}>
            <Image source={No_Data} style={styles.noDataImg}></Image>
            <Text style={[styles.noDataTxt, theme[appearance].text]}>
              {COMMON_TXT.NO_DATA}
            </Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  noDataContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataImg: {
    width: 100,
    height: 100,
  },
  noDataTxt: {
    marginTop: 12,
    paddingBottom: 50,
    fontSize: 16,
    color: CMSColors.PrimaryText,
  },
  contentContainer: {alignItems: 'center', justifyContent: 'center'},
});

export default inject('appStore')(observer(NoDataView));
