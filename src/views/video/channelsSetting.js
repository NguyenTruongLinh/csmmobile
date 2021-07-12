import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  StatusBar,
  BackHandler,
  StyleSheet,
  Image,
} from 'react-native';

import CMSColors from '../../styles/cmscolors';

class ChannelsSettingView extends Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {
    __DEV__ && console.log('ChannelsSettingView componentWillUnmount');
  }

  componentDidMount() {
    __DEV__ && console.log('ChannelsSettingView componentDidMount');
  }

  render() {
    return (
      <View>
        {/* <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {this.channelsCount +
              (this.channelsCount > 1 ? ' channels' : ' channel')}
          </Text>
        </View> */}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  summaryContainer: {
    backgroundColor: CMSColors.HeaderListRow,
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    paddingLeft: 24,
    textAlignVertical: 'center',
    color: CMSColors.RowOptions,
  },
});
export default ChannelsSettingView;
