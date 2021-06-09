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
        style={
          ([styles.container],
          {
            height: Dimensions.get('window').height,
            backgroundColor:
              this.props.backgroundColor || CMSColors.primaryActive,
          })
        }>
        <ActivityIndicator
          style={[styles.centerIndicator]}
          size="large"
          color={CMSColors.ActivityIndicator_color_Login}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  centerIndicator: {
    flex: 1,
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
