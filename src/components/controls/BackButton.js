import React from 'react';
import {StyleSheet, View} from 'react-native';
import Ripple from 'react-native-material-ripple';

import CMSAvatars from '../containers/CMSAvatars';
import CMSColors from '../../styles/cmscolors';

class BackButton extends React.Component {
  constructor(props) {
    super(props);
    if (!props.navigator) {
      __DEV__ &&
        console.log('GOND WARNING! BackButton must have navigator props!');
    }
    __DEV__ && console.log('GOND navi: ', props.navigator);
  }

  render() {
    const {navigator} = this.props;
    return (
      <Ripple
        rippleCentered={true}
        style={styles.left}
        onPress={() => navigator && navigator.goBack()}>
        <View style={styles.icon}>
          <CMSAvatars
            size={20}
            color={CMSColors.SecondaryText}
            styles={[styles.contentIcon, {position: 'relative'}]}
            iconCustom="keyboard-left-arrow-button"
          />
        </View>
      </Ripple>
    );
  }
}

const styles = StyleSheet.create({
  left: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginLeft: 10,
    marginTop: 2,
    alignItems: 'center',
  },
  icon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  contentIcon: {
    paddingTop: 2,
  },
  title: {
    marginLeft: 5,
  },
});

export default BackButton;
