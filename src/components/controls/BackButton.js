import React from 'react';
import {StyleSheet, View, Platform} from 'react-native';
import Ripple from 'react-native-material-ripple';

import CMSTouchableIcon from '../containers/CMSTouchableIcon';
import {inject, observer} from 'mobx-react';
import theme from '../../styles/appearance';

class BackButton extends React.Component {
  static defaultProps = {
    icon: 'keyboard-left-arrow-button',
  };

  constructor(props) {
    super(props);
    if (!props.navigator) {
      __DEV__ &&
        console.log('GOND WARNING! BackButton must have navigator props!');
    }
    // __DEV__ && console.log('GOND navi: ', props.navigator);
  }

  render() {
    const {navigator, icon, color, appStore} = this.props;
    const {appearance} = appStore;
    const overrideColor = color ? color : theme[appearance].backIconColor;

    return (
      <Ripple
        rippleCentered={true}
        style={styles.left}
        onPress={() => {
          // __DEV__ && console.log('GOND BackButton onPress!!!');
          if (navigator && navigator.canGoBack()) navigator.goBack();
        }}>
        <View style={styles.icon}>
          <CMSTouchableIcon
            size={20}
            color={overrideColor}
            styles={[
              styles.contentIcon,
              {position: 'relative', paddingBottom: 14},
            ]}
            iconCustom={icon}
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
    // marginTop: 2,
    alignItems: 'center',
  },
  icon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    ...Platform.select({
      android: {
        marginTop: 10,
      },
    }),
  },
  contentIcon: {
    paddingTop: 2,
  },
  title: {
    marginLeft: 5,
  },
});

export default inject('appStore')(observer(BackButton));
