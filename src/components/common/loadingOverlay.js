import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';

import CMSColors from '../../styles/cmscolors';

class LoadingOverlay extends React.Component {
  render() {
    return (
      <View
        style={[
          styles.container,
          {
            height: Dimensions.get('window').height,
            backgroundColor:
              this.props.backgroundColor ?? CMSColors.PrimaryActive,
          },
        ]}>
        <ActivityIndicator
          style={[styles.centerIndicator]}
          size="large"
          color={
            this.props.indicatorColor ?? CMSColors.ActivityIndicator_color_Login
          }
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  centerIndicator: {
    flex: 1,
    // backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingTop: 9,
    justifyContent: 'center',
  },
});

export default LoadingOverlay;
