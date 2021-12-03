'use strict';

import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';

import PropTypes from 'prop-types';

import LoadingOverlay from '../common/loadingOverlay';
import {No_Data} from '../../consts/images';

import CMSColors from '../../styles/cmscolors';
import {COMMON as COMMON_TXT} from '../../localization/texts';

export default class NoDataView extends React.Component {
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
    const {width, height} = nativeEvent.layout;

    this.setState({height});
  };

  render() {
    const {isLoading} = this.props;

    return (
      <View
        style={[
          styles.noDataContainer,
          this.props.style,
          //{height: this.props.height}
        ]}
        onLayout={this.onLayout}>
        {isLoading ? (
          <LoadingOverlay
            backgroundColor={CMSColors.White}
            indicatorColor={CMSColors.PrimaryActive}
          />
        ) : (
          <View>
            <Image source={No_Data} style={styles.noDataImg}></Image>
            <Text style={styles.noDataTxt}>{COMMON_TXT.NO_DATA}</Text>
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
});
